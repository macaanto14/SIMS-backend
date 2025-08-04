const rateLimit = require('express-rate-limit');
const rateLimitService = require('../services/rateLimitService');
const phoneValidationService = require('../services/phoneValidationService');
const twilioService = require('../services/twilioService');
const { errorResponse } = require('../utils/helpers');

// SMS-specific rate limiting middleware
const smsRateLimit = async (req, res, next) => {
  try {
    const { phoneNumber, purpose } = req.body;
    const ipAddress = req.ip;
    
    // Check multiple rate limit layers
    await rateLimitService.checkPhoneRateLimit(phoneNumber);
    await rateLimitService.checkGlobalRateLimit();
    await rateLimitService.checkPurposeRateLimit(phoneNumber, purpose);
    await rateLimitService.checkIPRateLimit(ipAddress);
    
    next();
  } catch (error) {
    console.error('SMS rate limit error:', error);
    
    // Extract retry time from error message if available
    const retryMatch = error.message.match(/(\d+) seconds/);
    const retryAfter = retryMatch ? parseInt(retryMatch[1]) : 900; // Default 15 minutes
    
    res.status(429).json({
      success: false,
      message: error.message,
      retryAfter: retryAfter,
      timestamp: new Date().toISOString()
    });
  }
};

// SMS security middleware
const smsSecurityMiddleware = {
  // Validate Twilio webhook signatures
  validateTwilioWebhook: (req, res, next) => {
    try {
      const signature = req.headers['x-twilio-signature'];
      const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
      const body = req.body;
      
      if (!signature) {
        return errorResponse(res, 'Missing Twilio signature', 401);
      }
      
      const isValid = twilioService.validateWebhookSignature(signature, url, body);
      
      if (!isValid) {
        return errorResponse(res, 'Invalid Twilio signature', 401);
      }
      
      next();
    } catch (error) {
      console.error('Webhook validation error:', error);
      errorResponse(res, 'Webhook validation failed', 401);
    }
  },
  
  // Sanitize phone numbers
  sanitizePhoneNumber: (req, res, next) => {
    try {
      if (req.body.phoneNumber) {
        // Clean and validate phone number
        const validationResult = phoneValidationService.validatePhoneNumber(req.body.phoneNumber);
        
        if (!validationResult.isValid) {
          return errorResponse(res, `Invalid phone number: ${validationResult.error}`, 400);
        }
        
        // Replace with cleaned/formatted number
        req.body.phoneNumber = validationResult.phoneNumber;
        req.phoneValidation = validationResult;
      }
      
      if (req.params.phoneNumber) {
        const validationResult = phoneValidationService.validatePhoneNumber(req.params.phoneNumber);
        
        if (!validationResult.isValid) {
          return errorResponse(res, `Invalid phone number: ${validationResult.error}`, 400);
        }
        
        // Replace with cleaned/formatted number
        req.params.phoneNumber = validationResult.phoneNumber;
        req.phoneValidation = validationResult;
      }
      
      next();
    } catch (error) {
      console.error('Phone number sanitization error:', error);
      errorResponse(res, 'Phone number validation failed', 400);
    }
  },
  
  // Validate SMS content
  validateSMSContent: (req, res, next) => {
    try {
      const { message, purpose } = req.body;
      
      if (!message || typeof message !== 'string') {
        return errorResponse(res, 'Message content is required', 400);
      }
      
      // Check message length (SMS limit is 160 characters for single SMS)
      if (message.length > 1600) { // Allow up to 10 SMS segments
        return errorResponse(res, 'Message too long (max 1600 characters)', 400);
      }
      
      // Check for prohibited content
      const prohibitedPatterns = [
        /spam/i,
        /phishing/i,
        /scam/i,
        /click here/i,
        /urgent.*action/i
      ];
      
      for (const pattern of prohibitedPatterns) {
        if (pattern.test(message)) {
          return errorResponse(res, 'Message contains prohibited content', 400);
        }
      }
      
      // Validate purpose if provided
      const validPurposes = ['verification', 'notification', 'alert', 'reminder', 'marketing'];
      if (purpose && !validPurposes.includes(purpose)) {
        return errorResponse(res, `Invalid purpose. Must be one of: ${validPurposes.join(', ')}`, 400);
      }
      
      next();
    } catch (error) {
      console.error('SMS content validation error:', error);
      errorResponse(res, 'SMS content validation failed', 400);
    }
  },
  
  // Check SMS service availability
  checkServiceAvailability: async (req, res, next) => {
    try {
      const isAvailable = await twilioService.checkServiceHealth();
      
      if (!isAvailable) {
        return errorResponse(res, 'SMS service temporarily unavailable', 503);
      }
      
      next();
    } catch (error) {
      console.error('SMS service availability check error:', error);
      errorResponse(res, 'Unable to verify SMS service availability', 503);
    }
  }
};

// SMS logging middleware
const smsLoggingMiddleware = (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    // Log SMS request and response
    const logData = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      phoneNumber: req.body?.phoneNumber || req.params?.phoneNumber,
      purpose: req.body?.purpose,
      statusCode: res.statusCode,
      responseTime: Date.now() - req.startTime
    };
    
    console.log('SMS Request Log:', JSON.stringify(logData, null, 2));
    
    originalSend.call(this, data);
  };
  
  req.startTime = Date.now();
  next();
};

// Express rate limit for general SMS endpoints
const generalSMSRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many SMS requests from this IP, please try again later.',
    retryAfter: 900
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many SMS requests from this IP, please try again later.',
      retryAfter: 900,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = {
  smsRateLimit,
  smsSecurityMiddleware,
  smsLoggingMiddleware,
  generalSMSRateLimit
};