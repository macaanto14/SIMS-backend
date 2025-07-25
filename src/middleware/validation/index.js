/**
 * Validation Middleware Module
 * 
 * This module provides comprehensive input validation middleware
 * for the SIMS backend API endpoints.
 * 
 * Features:
 * - Request validation using express-validator
 * - Custom validation rules
 * - Sanitization and normalization
 * - Comprehensive error reporting
 * - Reusable validation schemas
 * 
 * @author Ismail Mohamed 
 * @version 2.0.0
 */

const { body, param, query, validationResult, check } = require('express-validator');
const { errorResponse } = require('../../utils/response');
const logger = require('../../utils/logger');

/**
 * Middleware to handle validation errors
 * 
 * @description Processes validation results and returns formatted error responses
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void}
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value,
      location: error.location
    }));

    logger.warn('Validation failed', {
      endpoint: req.originalUrl,
      method: req.method,
      errors: formattedErrors,
      userId: req.user?.id
    });

    return errorResponse(res, 'Validation failed', 400, {
      errors: formattedErrors,
      errorCount: formattedErrors.length
    });
  }
  
  next();
};

// ==================== COMMON VALIDATION RULES ====================

/**
 * UUID validation rule
 * @param {string} field - Field name to validate
 * @param {Object} options - Validation options
 * @returns {ValidationChain} Express-validator chain
 */
const validateUUID = (field, options = {}) => {
  const { optional = false, message } = options;
  
  let validator = param(field).isUUID(4);
  
  if (optional) {
    validator = validator.optional();
  }
  
  return validator.withMessage(
    message || `${field} must be a valid UUID`
  );
};

/**
 * Email validation rule
 * @param {Object} options - Validation options
 * @returns {ValidationChain} Express-validator chain
 */
const validateEmail = (options = {}) => {
  const { 
    field = 'email', 
    optional = false, 
    normalize = true,
    message = 'Valid email address required'
  } = options;
  
  let validator = body(field).isEmail();
  
  if (optional) {
    validator = validator.optional();
  }
  
  if (normalize) {
    validator = validator.normalizeEmail({
      gmail_remove_dots: false,
      gmail_remove_subaddress: false,
      outlookdotcom_remove_subaddress: false,
      yahoo_remove_subaddress: false,
      icloud_remove_subaddress: false
    });
  }
  
  return validator.withMessage(message);
};

/**
 * Password validation rule with strength requirements
 * @param {Object} options - Validation options
 * @returns {ValidationChain} Express-validator chain
 */
const validatePassword = (options = {}) => {
  const {
    field = 'password',
    minLength = 8,
    maxLength = 128,
    requireUppercase = true,
    requireLowercase = true,
    requireNumbers = true,
    requireSpecialChars = false,
    optional = false
  } = options;

  let validator = body(field);
  
  if (optional) {
    validator = validator.optional();
  }
  
  validator = validator
    .isLength({ min: minLength, max: maxLength })
    .withMessage(`Password must be between ${minLength} and ${maxLength} characters`);

  // Build regex pattern based on requirements
  let regexPattern = '^';
  const requirements = [];
  
  if (requireLowercase) {
    regexPattern += '(?=.*[a-z])';
    requirements.push('one lowercase letter');
  }
  
  if (requireUppercase) {
    regexPattern += '(?=.*[A-Z])';
    requirements.push('one uppercase letter');
  }
  
  if (requireNumbers) {
    regexPattern += '(?=.*\\d)';
    requirements.push('one number');
  }
  
  if (requireSpecialChars) {
    regexPattern += '(?=.*[!@#$%^&*()_+\\-=\\[\\]{};\':"\\\\|,.<>\\/?])';
    requirements.push('one special character');
  }
  
  regexPattern += '.*$';
  
  if (requirements.length > 0) {
    validator = validator
      .matches(new RegExp(regexPattern))
      .withMessage(`Password must contain at least ${requirements.join(', ')}`);
  }

  return validator;
};

/**
 * Pagination validation rules
 * @param {Object} options - Validation options
 * @returns {Array<ValidationChain>} Array of validation chains
 */
const validatePagination = (options = {}) => {
  const {
    maxLimit = 100,
    defaultLimit = 20,
    maxPage = 10000
  } = options;

  return [
    query('page')
      .optional()
      .isInt({ min: 1, max: maxPage })
      .withMessage(`Page must be between 1 and ${maxPage}`)
      .toInt(),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: maxLimit })
      .withMessage(`Limit must be between 1 and ${maxLimit}`)
      .toInt(),
    
    query('sort')
      .optional()
      .isIn(['asc', 'desc', 'ASC', 'DESC'])
      .withMessage('Sort must be either "asc" or "desc"'),
    
    query('sortBy')
      .optional()
      .isLength({ min: 1, max: 50 })
      .matches(/^[a-zA-Z_][a-zA-Z0-9_]*$/)
      .withMessage('Sort field must be a valid column name')
  ];
};

// ==================== ENTITY-SPECIFIC VALIDATIONS ====================

/**
 * User registration validation schema
 * @param {Object} options - Validation options
 * @returns {Array<ValidationChain>} Array of validation chains
 */
const validateUserRegistration = (options = {}) => {
  const { requirePhone = false } = options;

  const validations = [
    validateEmail(),
    validatePassword(),
    
    body('first_name')
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('First name is required and must be less than 50 characters')
      .matches(/^[a-zA-Z\s'-]+$/)
      .withMessage('First name can only contain letters, spaces, hyphens, and apostrophes'),
    
    body('last_name')
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Last name is required and must be less than 50 characters')
      .matches(/^[a-zA-Z\s'-]+$/)
      .withMessage('Last name can only contain letters, spaces, hyphens, and apostrophes'),
    
    body('phone')
      .optional(!requirePhone)
      .isMobilePhone('any', { strictMode: false })
      .withMessage('Valid phone number required'),
    
    body('date_of_birth')
      .optional()
      .isISO8601()
      .withMessage('Valid date of birth required (YYYY-MM-DD format)')
      .custom((value) => {
        const birthDate = new Date(value);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        
        if (age < 13 || age > 120) {
          throw new Error('Age must be between 13 and 120 years');
        }
        
        return true;
      }),
    
    body('gender')
      .optional()
      .isIn(['male', 'female', 'other', 'prefer_not_to_say'])
      .withMessage('Gender must be one of: male, female, other, prefer_not_to_say')
  ];

  return validations;
};

/**
 * User login validation schema
 * @returns {Array<ValidationChain>} Array of validation chains
 */
const validateUserLogin = () => [
  validateEmail({ message: 'Valid email address required for login' }),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  body('remember_me')
    .optional()
    .isBoolean()
    .withMessage('Remember me must be a boolean value')
];

/**
 * School validation schema
 * @param {Object} options - Validation options
 * @returns {Array<ValidationChain>} Array of validation chains
 */
const validateSchool = (options = {}) => {
  const { isUpdate = false } = options;

  return [
    body('name')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('School name must be between 2 and 100 characters'),
    
    body('code')
      .trim()
      .isLength({ min: 2, max: 20 })
      .withMessage('School code must be between 2 and 20 characters')
      .matches(/^[A-Z0-9_-]+$/)
      .withMessage('School code can only contain uppercase letters, numbers, underscores, and hyphens'),
    
    body('email')
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid school email required'),
    
    body('phone')
      .optional()
      .isMobilePhone('any')
      .withMessage('Valid phone number required'),
    
    body('address')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Address must be less than 500 characters'),
    
    body('website')
      .optional()
      .isURL({ protocols: ['http', 'https'], require_protocol: true })
      .withMessage('Valid website URL required'),
    
    body('established_year')
      .optional()
      .isInt({ min: 1800, max: new Date().getFullYear() })
      .withMessage('Established year must be between 1800 and current year'),
    
    body('school_type')
      .optional()
      .isIn(['public', 'private', 'charter', 'international', 'religious'])
      .withMessage('School type must be one of: public, private, charter, international, religious'),
    
    body('grade_levels')
      .optional()
      .isArray({ min: 1 })
      .withMessage('Grade levels must be an array with at least one level'),
    
    body('grade_levels.*')
      .optional()
      .isInt({ min: 1, max: 12 })
      .withMessage('Each grade level must be between 1 and 12')
  ];
};

/**
 * Academic year validation schema
 * @returns {Array<ValidationChain>} Array of validation chains
 */
const validateAcademicYear = () => [
  body('name')
    .trim()
    .isLength({ min: 4, max: 50 })
    .withMessage('Academic year name must be between 4 and 50 characters')
    .matches(/^\d{4}[-\/]\d{4}$|^[A-Za-z0-9\s\-\/]+\d{4}/)
    .withMessage('Academic year name should include year information'),
  
  body('start_date')
    .isISO8601()
    .withMessage('Valid start date required (YYYY-MM-DD format)'),
  
  body('end_date')
    .isISO8601()
    .withMessage('Valid end date required (YYYY-MM-DD format)')
    .custom((endDate, { req }) => {
      if (new Date(endDate) <= new Date(req.body.start_date)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  
  body('school_id')
    .isUUID(4)
    .withMessage('Valid school ID required'),
  
  body('is_current')
    .optional()
    .isBoolean()
    .withMessage('Is current must be a boolean value'),
  
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters')
];

module.exports = {
  handleValidationErrors,
  validateUUID,
  validateEmail,
  validatePassword,
  validatePagination,
  validateUserRegistration,
  validateUserLogin,
  validateSchool,
  validateAcademicYear,
  
  // Additional validation utilities
  customValidation: {
    /**
     * Custom validation for checking if value exists in database
     * @param {Function} checkFunction - Function to check existence
     * @param {string} errorMessage - Error message if not found
     * @returns {Function} Validation function
     */
    existsInDatabase: (checkFunction, errorMessage) => {
      return async (value) => {
        const exists = await checkFunction(value);
        if (!exists) {
          throw new Error(errorMessage);
        }
        return true;
      };
    },
    
    /**
     * Custom validation for checking uniqueness in database
     * @param {Function} checkFunction - Function to check uniqueness
     * @param {string} errorMessage - Error message if not unique
     * @returns {Function} Validation function
     */
    uniqueInDatabase: (checkFunction, errorMessage) => {
      return async (value, { req }) => {
        const isUnique = await checkFunction(value, req.params?.id);
        if (!isUnique) {
          throw new Error(errorMessage);
        }
        return true;
      };
    }
  }
};