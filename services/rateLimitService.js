const pool = require('../config/database');
const phoneValidationService = require('./phoneValidationService');
const crypto = require('crypto');

class RateLimitService {
  constructor() {
    this.windowMs = 15 * 60 * 1000; // 15 minutes
    this.maxAttemptsPerPhone = 5;
    this.globalMaxAttempts = 100;
  }

  async checkPhoneRateLimit(phoneNumber) {
    const client = await pool.connect();
    
    try {
      const phoneHash = phoneValidationService.hashPhoneNumber(phoneNumber);
      
      // Check existing rate limit
      const result = await client.query(
        `SELECT count, window_start, expires_at FROM sms_rate_limits 
         WHERE identifier = $1 AND limit_type = 'phone' AND expires_at > NOW()`,
        [phoneHash]
      );
      
      if (result.rows.length > 0) {
        const rateLimit = result.rows[0];
        
        if (rateLimit.count >= this.maxAttemptsPerPhone) {
          const retryAfter = Math.ceil((new Date(rateLimit.expires_at) - new Date()) / 1000);
          throw new Error(`Phone rate limit exceeded. Try again in ${retryAfter} seconds`);
        }
        
        // Increment count
        await client.query(
          `UPDATE sms_rate_limits SET count = count + 1, updated_at = NOW() 
           WHERE identifier = $1 AND limit_type = 'phone'`,
          [phoneHash]
        );
      } else {
        // Create new rate limit record with explicit UUID generation
        const uuid = this.generateUUID();
        await client.query(
          `INSERT INTO sms_rate_limits (id, identifier, limit_type, count, window_start, expires_at)
           VALUES ($1, $2, 'phone', 1, NOW(), NOW() + INTERVAL '${this.windowMs} milliseconds')`,
          [uuid, phoneHash]
        );
      }
      
    } finally {
      client.release();
    }
  }

  async checkGlobalRateLimit() {
    const client = await pool.connect();
    
    try {
      const windowStart = new Date(Date.now() - this.windowMs);
      
      // Check global rate limit
      const result = await client.query(
        `SELECT count, window_start, expires_at FROM sms_rate_limits 
         WHERE identifier = 'global' AND limit_type = 'global' AND expires_at > NOW()`
      );
      
      if (result.rows.length > 0) {
        const rateLimit = result.rows[0];
        
        if (rateLimit.count >= this.globalMaxAttempts) {
          const retryAfter = Math.ceil((new Date(rateLimit.expires_at) - new Date()) / 1000);
          throw new Error(`Global rate limit exceeded. Try again in ${retryAfter} seconds`);
        }
        
        // Increment count
        await client.query(
          `UPDATE sms_rate_limits SET count = count + 1, updated_at = NOW() 
           WHERE identifier = 'global' AND limit_type = 'global'`
        );
      } else {
        // Create new global rate limit record with explicit UUID generation
        const uuid = this.generateUUID();
        await client.query(
          `INSERT INTO sms_rate_limits (id, identifier, limit_type, count, window_start, expires_at)
           VALUES ($1, 'global', 'global', 1, NOW(), NOW() + INTERVAL '${this.windowMs} milliseconds')`,
          [uuid]
        );
      }
      
    } finally {
      client.release();
    }
  }

  async checkPurposeRateLimit(phoneNumber, purpose) {
    const client = await pool.connect();
    
    try {
      const phoneHash = phoneValidationService.hashPhoneNumber(phoneNumber);
      const purposeLimits = {
        'registration': 3,
        'login': 5,
        'password_reset': 3,
        'two_factor': 10,
        'verification': 5
      };
      
      const maxAttempts = purposeLimits[purpose] || 3;
      
      // Check purpose-specific rate limit
      const result = await client.query(
        `SELECT count, window_start, expires_at FROM sms_rate_limits 
         WHERE identifier = $1 AND limit_type = 'purpose' AND purpose = $2 AND expires_at > NOW()`,
        [phoneHash, purpose]
      );
      
      if (result.rows.length > 0) {
        const rateLimit = result.rows[0];
        
        if (rateLimit.count >= maxAttempts) {
          const retryAfter = Math.ceil((new Date(rateLimit.expires_at) - new Date()) / 1000);
          throw new Error(`${purpose} rate limit exceeded. Try again in ${retryAfter} seconds`);
        }
        
        // Increment count
        await client.query(
          `UPDATE sms_rate_limits SET count = count + 1, updated_at = NOW() 
           WHERE identifier = $1 AND limit_type = 'purpose' AND purpose = $2`,
          [phoneHash, purpose]
        );
      } else {
        // Create new purpose rate limit record with explicit UUID generation
        const uuid = this.generateUUID();
        await client.query(
          `INSERT INTO sms_rate_limits (id, identifier, limit_type, purpose, count, window_start, expires_at)
           VALUES ($1, $2, 'purpose', $3, 1, NOW(), NOW() + INTERVAL '${this.windowMs} milliseconds')`,
          [uuid, phoneHash, purpose]
        );
      }
      
    } finally {
      client.release();
    }
  }

  async checkIPRateLimit(ipAddress) {
    const client = await pool.connect();
    
    try {
      const ipHash = this.hashIP(ipAddress);
      const maxAttemptsPerIP = 20; // 20 SMS per IP per window
      
      // Check IP rate limit
      const result = await client.query(
        `SELECT count, window_start, expires_at FROM sms_rate_limits 
         WHERE identifier = $1 AND limit_type = 'ip' AND expires_at > NOW()`,
        [ipHash]
      );
      
      if (result.rows.length > 0) {
        const rateLimit = result.rows[0];
        
        if (rateLimit.count >= maxAttemptsPerIP) {
          const retryAfter = Math.ceil((new Date(rateLimit.expires_at) - new Date()) / 1000);
          throw new Error(`IP rate limit exceeded. Try again in ${retryAfter} seconds`);
        }
        
        // Increment count
        await client.query(
          `UPDATE sms_rate_limits SET count = count + 1, updated_at = NOW() 
           WHERE identifier = $1 AND limit_type = 'ip'`,
          [ipHash]
        );
      } else {
        // Create new IP rate limit record with explicit UUID generation
        const uuid = this.generateUUID();
        await client.query(
          `INSERT INTO sms_rate_limits (id, identifier, limit_type, count, window_start, expires_at)
           VALUES ($1, $2, 'ip', 1, NOW(), NOW() + INTERVAL '${this.windowMs} milliseconds')`,
          [uuid, ipHash]
        );
      }
      
    } finally {
      client.release();
    }
  }

  // Generate UUID manually if database function fails
  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  hashIP(ipAddress) {
    return crypto
      .createHash('sha256')
      .update(ipAddress + (process.env.ENCRYPTION_KEY || 'default-key'))
      .digest('hex');
  }

  async getRateLimitStatus(phoneNumber) {
    const client = await pool.connect();
    
    try {
      const phoneHash = phoneValidationService.hashPhoneNumber(phoneNumber);
      
      const result = await client.query(
        `SELECT limit_type, purpose, count, window_start, expires_at 
         FROM sms_rate_limits 
         WHERE identifier = $1 AND expires_at > NOW()`,
        [phoneHash]
      );
      
      return result.rows.map(row => ({
        type: row.limit_type,
        purpose: row.purpose,
        count: row.count,
        windowStart: row.window_start,
        expiresAt: row.expires_at,
        remaining: this.getMaxForType(row.limit_type, row.purpose) - row.count
      }));
      
    } finally {
      client.release();
    }
  }

  getMaxForType(limitType, purpose) {
    switch (limitType) {
      case 'phone':
        return this.maxAttemptsPerPhone;
      case 'global':
        return this.globalMaxAttempts;
      case 'purpose':
        const purposeLimits = {
          'registration': 3,
          'login': 5,
          'password_reset': 3,
          'two_factor': 10,
          'verification': 5
        };
        return purposeLimits[purpose] || 3;
      case 'ip':
        return 20;
      default:
        return 5;
    }
  }

  async cleanupExpiredRateLimits() {
    const client = await pool.connect();
    
    try {
      const result = await client.query(
        'DELETE FROM sms_rate_limits WHERE expires_at <= NOW()'
      );
      
      console.log(`Cleaned up ${result.rowCount} expired rate limit records`);
      return result.rowCount;
      
    } finally {
      client.release();
    }
  }
}

module.exports = new RateLimitService();