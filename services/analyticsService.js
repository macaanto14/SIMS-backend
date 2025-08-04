const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class SMSAnalyticsService {
  async trackSMSSent(data) {
    if (process.env.ENABLE_SMS_ANALYTICS !== 'true') {
      return;
    }
    
    const client = await pool.connect();
    
    try {
      await client.query(
        `INSERT INTO sms_analytics (
          id, phone_number_hash, purpose, status, twilio_sid, country_code, 
          carrier, timestamp, ip_address_hash, user_agent, error_code, error_message
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), $8, $9, $10, $11)`,
        [
          uuidv4(),
          data.phoneNumber,
          data.purpose,
          data.status,
          data.twilioSid || null,
          data.countryCode || null,
          data.carrier || null,
          this.hashIP(data.ipAddress),
          data.userAgent || null,
          data.errorCode || null,
          data.errorMessage || null
        ]
      );
    } catch (error) {
      console.error('Analytics tracking error:', error);
    } finally {
      client.release();
    }
  }
  
  async trackSMSDelivered(twilioWebhook) {
    if (process.env.ENABLE_SMS_ANALYTICS !== 'true') {
      return;
    }
    
    const client = await pool.connect();
    
    try {
      await client.query(
        `UPDATE sms_analytics 
         SET status = $1, response_time = $2, updated_at = NOW()
         WHERE twilio_sid = $3`,
        [
          twilioWebhook.MessageStatus,
          twilioWebhook.ResponseTime || null,
          twilioWebhook.MessageSid
        ]
      );
    } catch (error) {
      console.error('Delivery tracking error:', error);
    } finally {
      client.release();
    }
  }
  
  async trackSMSVerified(data) {
    if (process.env.ENABLE_SMS_ANALYTICS !== 'true') {
      return;
    }
    
    const client = await pool.connect();
    
    try {
      await client.query(
        `UPDATE sms_analytics 
         SET status = $1, updated_at = NOW()
         WHERE twilio_sid = $2`,
        [data.status, data.twilioSid]
      );
    } catch (error) {
      console.error('Verification tracking error:', error);
    } finally {
      client.release();
    }
  }
  
  async generateAnalyticsReport(dateRange, filters = {}) {
    const client = await pool.connect();
    
    try {
      let whereClause = 'WHERE timestamp >= $1 AND timestamp <= $2';
      let params = [dateRange.start, dateRange.end];
      let paramIndex = 3;
      
      if (filters.purpose) {
        whereClause += ` AND purpose = $${paramIndex}`;
        params.push(filters.purpose);
        paramIndex++;
      }
      
      if (filters.countryCode) {
        whereClause += ` AND country_code = $${paramIndex}`;
        params.push(filters.countryCode);
        paramIndex++;
      }
      
      if (filters.status) {
        whereClause += ` AND status = $${paramIndex}`;
        params.push(filters.status);
        paramIndex++;
      }
      
      const query = `
        SELECT 
          purpose,
          status,
          country_code,
          COUNT(*) as total_count,
          COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_count,
          COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count,
          COUNT(CASE WHEN status = 'verified' THEN 1 END) as verified_count,
          AVG(response_time) as avg_response_time,
          DATE_TRUNC('day', timestamp) as date
        FROM sms_analytics 
        ${whereClause}
        GROUP BY purpose, status, country_code, DATE_TRUNC('day', timestamp)
        ORDER BY date DESC, purpose, status
      `;
      
      const result = await client.query(query, params);
      
      return {
        data: result.rows,
        summary: await this.generateSummaryStats(dateRange, filters)
      };
      
    } finally {
      client.release();
    }
  }
  
  async generateSummaryStats(dateRange, filters = {}) {
    const client = await pool.connect();
    
    try {
      let whereClause = 'WHERE timestamp >= $1 AND timestamp <= $2';
      let params = [dateRange.start, dateRange.end];
      
      const summaryQuery = `
        SELECT 
          COUNT(*) as total_sms,
          COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_count,
          COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count,
          COUNT(CASE WHEN status = 'verified' THEN 1 END) as verified_count,
          ROUND(
            COUNT(CASE WHEN status = 'delivered' THEN 1 END)::numeric / 
            NULLIF(COUNT(*), 0) * 100, 2
          ) as delivery_rate,
          ROUND(
            COUNT(CASE WHEN status = 'verified' THEN 1 END)::numeric / 
            NULLIF(COUNT(CASE WHEN status = 'delivered' THEN 1 END), 0) * 100, 2
          ) as verification_rate,
          AVG(response_time) as avg_response_time
        FROM sms_analytics 
        ${whereClause}
      `;
      
      const summaryResult = await client.query(summaryQuery, params);
      
      return summaryResult.rows[0];
      
    } finally {
      client.release();
    }
  }
  
  async getSuccessRateByCountry(dateRange) {
    const client = await pool.connect();
    
    try {
      const query = `
        SELECT 
          country_code,
          COUNT(*) as total_count,
          COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_count,
          ROUND(
            COUNT(CASE WHEN status = 'delivered' THEN 1 END)::numeric / 
            NULLIF(COUNT(*), 0) * 100, 2
          ) as success_rate
        FROM sms_analytics 
        WHERE timestamp >= $1 AND timestamp <= $2
        GROUP BY country_code
        ORDER BY success_rate DESC
      `;
      
      const result = await client.query(query, [dateRange.start, dateRange.end]);
      return result.rows;
      
    } finally {
      client.release();
    }
  }
  
  async getCostAnalytics(dateRange) {
    const client = await pool.connect();
    
    try {
      // Note: Cost calculation would need to be implemented based on Twilio pricing
      // This is a placeholder implementation
      const query = `
        SELECT 
          country_code,
          purpose,
          COUNT(*) as sms_count,
          COUNT(*) * 0.0075 as estimated_cost -- Placeholder cost calculation
        FROM sms_analytics 
        WHERE timestamp >= $1 AND timestamp <= $2 AND status = 'delivered'
        GROUP BY country_code, purpose
        ORDER BY estimated_cost DESC
      `;
      
      const result = await client.query(query, [dateRange.start, dateRange.end]);
      
      const totalCost = result.rows.reduce((sum, row) => sum + parseFloat(row.estimated_cost), 0);
      
      return {
        breakdown: result.rows,
        totalCost: totalCost.toFixed(4),
        totalSMS: result.rows.reduce((sum, row) => sum + parseInt(row.sms_count), 0)
      };
      
    } finally {
      client.release();
    }
  }
  
  async getFailureAnalysis(dateRange) {
    const client = await pool.connect();
    
    try {
      const query = `
        SELECT 
          error_code,
          error_message,
          country_code,
          purpose,
          COUNT(*) as failure_count
        FROM sms_analytics 
        WHERE timestamp >= $1 AND timestamp <= $2 AND status = 'failed'
        GROUP BY error_code, error_message, country_code, purpose
        ORDER BY failure_count DESC
        LIMIT 20
      `;
      
      const result = await client.query(query, [dateRange.start, dateRange.end]);
      return result.rows;
      
    } finally {
      client.release();
    }
  }
  
  hashIP(ipAddress) {
    if (!ipAddress) return null;
    
    const crypto = require('crypto');
    return crypto
      .createHash('sha256')
      .update(ipAddress + process.env.ENCRYPTION_KEY)
      .digest('hex');
  }
}

module.exports = new SMSAnalyticsService();