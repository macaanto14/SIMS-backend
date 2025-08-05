const pool = require('../config/database');
const twilioService = require('../services/twilioService');
const rateLimitService = require('../services/rateLimitService');
const analyticsService = require('../services/analyticsService');
const phoneValidationService = require('../services/phoneValidationService');
const { successResponse, errorResponse } = require('../utils/helpers');
const { logAuthEvent } = require('../src/middleware/audit');

/**
 * Send SMS verification code
 * @route POST /sms/send-verification
 */
const sendVerification = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { phoneNumber, purpose, twilioConfig } = req.body;
    
    // Validate phone number
    const validationResult = phoneValidationService.validatePhoneNumber(phoneNumber);
    if (!validationResult.isValid) {
      return errorResponse(res, `Invalid phone number: ${validationResult.error}`, 400);
    }
    
    // Check rate limits
    await rateLimitService.checkPhoneRateLimit(phoneNumber);
    await rateLimitService.checkGlobalRateLimit();
    await rateLimitService.checkPurposeRateLimit(phoneNumber, purpose);
    
    // Use provided Twilio config or default
    const config = twilioConfig || {
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
      serviceSid: process.env.TWILIO_VERIFY_SERVICE_SID
    };
    
    // Send SMS via Twilio
    const twilioResponse = await twilioService.sendVerification(phoneNumber, config);
    
    // Store verification record
    const phoneHash = phoneValidationService.hashPhoneNumber(phoneNumber);
    await client.query(
      `INSERT INTO sms_verifications (phone_number_hash, purpose, twilio_sid, status, expires_at)
       VALUES ($1, $2, $3, 'pending', NOW() + INTERVAL '10 minutes')
       ON CONFLICT (phone_number_hash, purpose) 
       DO UPDATE SET 
         twilio_sid = $3,
         status = 'pending',
         attempts = 0,
         expires_at = NOW() + INTERVAL '10 minutes',
         updatedAt = NOW()`,
      [phoneHash, purpose, twilioResponse.sid]
    );
    
    // Track analytics
    if (process.env.ENABLE_SMS_ANALYTICS === 'true') {
      await analyticsService.trackSMSSent({
        phoneNumber: phoneHash,
        purpose,
        twilioSid: twilioResponse.sid,
        countryCode: validationResult.countryCode,
        status: 'sent',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
    }
    
    // Log auth event
    await logAuthEvent('SMS_SEND', null, {
      phoneNumber: phoneHash,
      purpose,
      twilioSid: twilioResponse.sid,
      success: true,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    successResponse(res, twilioResponse, 'SMS verification code sent successfully');
    
  } catch (error) {
    console.error('SMS send error:', error);
    
    // Track failed attempt
    if (process.env.ENABLE_SMS_ANALYTICS === 'true') {
      await analyticsService.trackSMSSent({
        phoneNumber: req.body.phoneNumber ? phoneValidationService.hashPhoneNumber(req.body.phoneNumber) : null,
        purpose: req.body.purpose,
        status: 'failed',
        errorCode: error.code,
        errorMessage: error.message,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
    }
    
    if (error.message.includes('rate limit')) {
      return errorResponse(res, error.message, 429);
    }
    
    errorResponse(res, 'Failed to send SMS verification code', 500);
  } finally {
    client.release();
  }
};

/**
 * Verify SMS code
 * @route POST /sms/verify-code
 */
const verifyCode = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { phoneNumber, code, purpose, twilioConfig } = req.body;
    
    // Validate phone number
    const validationResult = phoneValidationService.validatePhoneNumber(phoneNumber);
    if (!validationResult.isValid) {
      return errorResponse(res, `Invalid phone number: ${validationResult.error}`, 400);
    }
    
    const phoneHash = phoneValidationService.hashPhoneNumber(phoneNumber);
    
    // Check verification record
    const verificationResult = await client.query(
      `SELECT * FROM sms_verifications 
       WHERE phone_number_hash = $1 AND purpose = $2 AND status = 'pending' AND expires_at > NOW()`,
      [phoneHash, purpose]
    );
    
    if (verificationResult.rows.length === 0) {
      return errorResponse(res, 'No valid verification found or code expired', 400);
    }
    
    const verification = verificationResult.rows[0];
    
    // Check max attempts
    if (verification.attempts >= verification.max_attempts) {
      await client.query(
        `UPDATE sms_verifications SET status = 'failed' WHERE id = $1`,
        [verification.id]
      );
      return errorResponse(res, 'Maximum verification attempts exceeded', 400);
    }
    
    // Use provided Twilio config or default
    const config = twilioConfig || {
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
      serviceSid: process.env.TWILIO_VERIFY_SERVICE_SID
    };
    
    // Verify code with Twilio
    const twilioResponse = await twilioService.verifyCode(phoneNumber, code, config);
    
    if (twilioResponse.status === 'approved') {
      // Update verification status
      await client.query(
        `UPDATE sms_verifications 
         SET status = 'verified', verified_at = NOW(), updatedAt = NOW()
         WHERE id = $1`,
        [verification.id]
      );
      
      // Track successful verification
      if (process.env.ENABLE_SMS_ANALYTICS === 'true') {
        await analyticsService.trackSMSVerified({
          phoneNumber: phoneHash,
          purpose,
          twilioSid: verification.twilio_sid,
          status: 'verified',
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        });
      }
      
      // Log auth event
      await logAuthEvent('SMS_VERIFY', null, {
        phoneNumber: phoneHash,
        purpose,
        twilioSid: verification.twilio_sid,
        success: true,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      successResponse(res, twilioResponse, 'SMS code verified successfully');
    } else {
      // Increment attempts
      await client.query(
        `UPDATE sms_verifications 
         SET attempts = attempts + 1, updatedAt = NOW()
         WHERE id = $1`,
        [verification.id]
      );
      
      errorResponse(res, 'Invalid verification code', 400);
    }
    
  } catch (error) {
    console.error('SMS verify error:', error);
    
    // Track failed verification
    if (process.env.ENABLE_SMS_ANALYTICS === 'true') {
      await analyticsService.trackSMSVerified({
        phoneNumber: req.body.phoneNumber ? phoneValidationService.hashPhoneNumber(req.body.phoneNumber) : null,
        purpose: req.body.purpose,
        status: 'failed',
        errorCode: error.code,
        errorMessage: error.message,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
    }
    
    errorResponse(res, 'Failed to verify SMS code', 500);
  } finally {
    client.release();
  }
};

/**
 * Get SMS verification status
 * @route GET /sms/status/:phoneNumber/:purpose
 */
const getVerificationStatus = async (req, res) => {
  try {
    const { phoneNumber, purpose } = req.params;
    
    const phoneHash = phoneValidationService.hashPhoneNumber(phoneNumber);
    
    const result = await pool.query(
      `SELECT status, attempts, max_attempts, expires_at, verified_at, createdAt
       FROM sms_verifications 
       WHERE phone_number_hash = $1 AND purpose = $2
       ORDER BY createdAt DESC LIMIT 1`,
      [phoneHash, purpose]
    );
    
    if (result.rows.length === 0) {
      return errorResponse(res, 'No verification found', 404);
    }
    
    const verification = result.rows[0];
    const isExpired = new Date() > new Date(verification.expires_at);
    
    successResponse(res, {
      status: isExpired ? 'expired' : verification.status,
      attempts: verification.attempts,
      maxAttempts: verification.max_attempts,
      expiresAt: verification.expires_at,
      verifiedAt: verification.verified_at,
      createdAt: verification.createdAt
    }, 'Verification status retrieved successfully');
    
  } catch (error) {
    console.error('Get verification status error:', error);
    errorResponse(res, 'Failed to get verification status', 500);
  }
};

module.exports = {
  sendVerification,
  verifyCode,
  getVerificationStatus
};