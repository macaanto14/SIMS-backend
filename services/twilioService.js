const twilio = require('twilio');
const smsMessages = require('../config/smsMessages');
const phoneValidationService = require('./phoneValidationService');

class TwilioService {
  constructor() {
    this.defaultClient = null;
    this.initializeDefaultClient();
  }
  
  initializeDefaultClient() {
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      this.defaultClient = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
    }
  }
  
  getClient(config) {
    if (config && config.accountSid && config.authToken) {
      return twilio(config.accountSid, config.authToken);
    }
    
    if (!this.defaultClient) {
      throw new Error('Twilio configuration not provided and no default configuration found');
    }
    
    return this.defaultClient;
  }
  
  /**
   * Format phone number for Twilio API (requires + prefix)
   * @param {string} phoneNumber - Phone number in backend format (251927802065)
   * @returns {string} Twilio-formatted number (+251927802065)
   */
  formatPhoneNumberForTwilio(phoneNumber) {
    // If already has +, return as is
    if (phoneNumber.startsWith('+')) {
      return phoneNumber;
    }
    
    // For Ethiopian numbers in backend format (251927802065), add +
    if (phoneNumber.startsWith('251') && phoneNumber.length === 12) {
      return '+' + phoneNumber;
    }
    
    // For other formats, validate and format
    const validationResult = phoneValidationService.validatePhoneNumber(phoneNumber);
    if (validationResult.isValid) {
      // Return backend format with + prefix
      return '+' + validationResult.phoneNumber;
    }
    
    // Fallback: add + if not present
    return phoneNumber.startsWith('+') ? phoneNumber : '+' + phoneNumber;
  }
  
  async sendVerification(phoneNumber, config = null) {
    try {
      const client = this.getClient(config);
      const serviceSid = config?.serviceSid || process.env.TWILIO_VERIFY_SERVICE_SID;
      
      if (!serviceSid) {
        throw new Error('Twilio Verify Service SID not provided');
      }
      
      // Format phone number for Twilio (add + prefix)
      const twilioFormattedNumber = this.formatPhoneNumberForTwilio(phoneNumber);
      
      console.log(`Sending verification to: ${twilioFormattedNumber} (original: ${phoneNumber})`);
      
      const verification = await client.verify.v2
        .services(serviceSid)
        .verifications
        .create({
          to: twilioFormattedNumber,
          channel: 'sms'
        });
      
      return {
        account_sid: verification.accountSid,
        sid: verification.sid,
        service_sid: verification.serviceSid,
        to: verification.to,
        channel: verification.channel,
        status: verification.status,
        valid: verification.valid,
        date_created: verification.dateCreated,
        date_updated: verification.dateUpdated
      };
      
    } catch (error) {
      console.error('Twilio send verification error:', error);
      throw new Error(`Failed to send SMS: ${error.message}`);
    }
  }
  
  async verifyCode(phoneNumber, code, config = null) {
    try {
      const client = this.getClient(config);
      const serviceSid = config?.serviceSid || process.env.TWILIO_VERIFY_SERVICE_SID;
      
      if (!serviceSid) {
        throw new Error('Twilio Verify Service SID not provided');
      }
      
      // Format phone number for Twilio (add + prefix)
      const twilioFormattedNumber = this.formatPhoneNumberForTwilio(phoneNumber);
      
      console.log(`Verifying code for: ${twilioFormattedNumber} (original: ${phoneNumber})`);
      
      const verificationCheck = await client.verify.v2
        .services(serviceSid)
        .verificationChecks
        .create({
          to: twilioFormattedNumber,
          code: code
        });
      
      return {
        account_sid: verificationCheck.accountSid,
        sid: verificationCheck.sid,
        service_sid: verificationCheck.serviceSid,
        to: verificationCheck.to,
        channel: verificationCheck.channel,
        status: verificationCheck.status,
        valid: verificationCheck.valid,
        date_created: verificationCheck.dateCreated,
        date_updated: verificationCheck.dateUpdated
      };
      
    } catch (error) {
      console.error('Twilio verify code error:', error);
      throw new Error(`Failed to verify code: ${error.message}`);
    }
  }
  
  async sendCustomSMS(phoneNumber, message, config = null) {
    try {
      const client = this.getClient(config);
      
      // Format phone number for Twilio (add + prefix)
      const twilioFormattedNumber = this.formatPhoneNumberForTwilio(phoneNumber);
      
      console.log(`Sending custom SMS to: ${twilioFormattedNumber} (original: ${phoneNumber})`);
      
      const sms = await client.messages.create({
        body: message,
        from: config?.fromNumber || process.env.TWILIO_PHONE_NUMBER,
        to: twilioFormattedNumber
      });
      
      return {
        sid: sms.sid,
        status: sms.status,
        to: sms.to,
        from: sms.from,
        body: sms.body,
        dateCreated: sms.dateCreated,
        dateUpdated: sms.dateUpdated
      };
      
    } catch (error) {
      console.error('Twilio send custom SMS error:', error);
      throw new Error(`Failed to send custom SMS: ${error.message}`);
    }
  }
  
  validateWebhookSignature(signature, url, body) {
    try {
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      return twilio.validateRequest(authToken, signature, url, body);
    } catch (error) {
      console.error('Webhook validation error:', error);
      return false;
    }
  }

  async checkServiceHealth() {
    try {
      if (!this.defaultClient) {
        return false;
      }
      
      // Simple health check by fetching account info
      await this.defaultClient.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();
      return true;
    } catch (error) {
      console.error('Twilio service health check failed:', error);
      return false;
    }
  }
}

module.exports = new TwilioService();