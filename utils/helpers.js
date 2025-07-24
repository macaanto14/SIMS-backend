const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

// Password utilities
const hashPassword = async (password) => {
  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
  return await bcrypt.hash(password, saltRounds);
};

const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

// JWT utilities
const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  });
};

// Database utilities
const buildUpdateQuery = (tableName, data, whereClause) => {
  const keys = Object.keys(data);
  const setClause = keys.map((key, index) => `${key} = $${index + 1}`).join(', ');
  const values = keys.map(key => data[key]);
  
  return {
    query: `UPDATE ${tableName} SET ${setClause}, updated_at = NOW() WHERE ${whereClause}`,
    values
  };
};

const buildInsertQuery = (tableName, data) => {
  const keys = Object.keys(data);
  const placeholders = keys.map((_, index) => `$${index + 1}`).join(', ');
  const values = keys.map(key => data[key]);
  
  return {
    query: `INSERT INTO ${tableName} (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`,
    values
  };
};

// Pagination utilities
const getPaginationParams = (req) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;
  
  return { page, limit, offset };
};

const buildPaginatedResponse = (data, total, page, limit) => {
  const totalPages = Math.ceil(total / limit);
  
  return {
    data,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems: total,
      itemsPerPage: limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  };
};

// Response utilities
const successResponse = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

const errorResponse = (res, message = 'Internal server error', statusCode = 500, details = null) => {
  const response = {
    success: false,
    message
  };
  
  if (details) {
    response.details = details;
  }
  
  return res.status(statusCode).json(response);
};

// Date utilities
const formatDate = (date) => {
  return new Date(date).toISOString().split('T')[0];
};

const isValidDateRange = (startDate, endDate) => {
  return new Date(startDate) < new Date(endDate);
};

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  buildUpdateQuery,
  buildInsertQuery,
  getPaginationParams,
  buildPaginatedResponse,
  successResponse,
  errorResponse,
  formatDate,
  isValidDateRange,
  generateUUID: uuidv4
};