const { body, param, query, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Common validation rules
const validateUUID = (field) => param(field).isUUID().withMessage(`${field} must be a valid UUID`);

const validateEmail = () => body('email').isEmail().normalizeEmail().withMessage('Valid email required');

const validatePassword = () => body('password')
  .isLength({ min: 8 })
  .withMessage('Password must be at least 8 characters long')
  .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
  .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number');

const validatePagination = () => [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
];

// User validation
const validateUserRegistration = () => [
  validateEmail(),
  validatePassword(),
  body('first_name').trim().isLength({ min: 1 }).withMessage('First name is required'),
  body('last_name').trim().isLength({ min: 1 }).withMessage('Last name is required'),
  body('phone').optional().isMobilePhone().withMessage('Valid phone number required')
];

const validateUserLogin = () => [
  validateEmail(),
  body('password').notEmpty().withMessage('Password is required')
];

// School validation
const validateSchool = () => [
  body('name').trim().isLength({ min: 1 }).withMessage('School name is required'),
  body('code').trim().isLength({ min: 2, max: 10 }).withMessage('School code must be 2-10 characters'),
  body('email').optional().isEmail().normalizeEmail(),
  body('phone').optional().isMobilePhone()
];

// Academic validation
const validateAcademicYear = () => [
  body('name').trim().isLength({ min: 1 }).withMessage('Academic year name is required'),
  body('start_date').isISO8601().withMessage('Valid start date required'),
  body('end_date').isISO8601().withMessage('Valid end date required'),
  body('school_id').isUUID().withMessage('Valid school ID required')
];

const validateClass = () => [
  body('name').trim().isLength({ min: 1 }).withMessage('Class name is required'),
  body('grade_level').isInt({ min: 1, max: 12 }).withMessage('Grade level must be between 1 and 12'),
  body('school_id').isUUID().withMessage('Valid school ID required'),
  body('academic_year_id').isUUID().withMessage('Valid academic year ID required')
];

const validateAttendance = () => [
  body('student_id').isUUID().withMessage('Valid student ID required'),
  body('class_id').isUUID().withMessage('Valid class ID required'),
  body('date').isISO8601().withMessage('Valid date required'),
  body('status').isIn(['present', 'absent', 'late', 'excused']).withMessage('Invalid attendance status')
];

// Finance validation
const validateFeeStructure = () => [
  body('school_id').isUUID().withMessage('Valid school ID required'),
  body('academic_year_id').isUUID().withMessage('Valid academic year ID required'),
  body('fee_type').trim().isLength({ min: 1 }).withMessage('Fee type is required'),
  body('amount').isDecimal({ decimal_digits: '0,2' }).withMessage('Valid amount required'),
  body('frequency').optional().isIn(['monthly', 'quarterly', 'annually', 'one_time'])
];

// Library validation
const validateBook = () => [
  body('title').trim().isLength({ min: 1 }).withMessage('Book title is required'),
  body('author').trim().isLength({ min: 1 }).withMessage('Author is required'),
  body('school_id').isUUID().withMessage('Valid school ID required'),
  body('isbn').optional().isISBN(),
  body('copies_total').optional().isInt({ min: 1 })
];

module.exports = {
  handleValidationErrors,
  validateUUID,
  validatePagination,
  validateUserRegistration,
  validateUserLogin,
  validateSchool,
  validateAcademicYear,
  validateClass,
  validateAttendance,
  validateFeeStructure,
  validateBook
};