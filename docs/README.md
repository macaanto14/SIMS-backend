# SIMS Backend API Documentation

## Overview
School Information Management System (SIMS) Backend API provides comprehensive endpoints for managing educational institutions, users, academic data, and more.

## Features
- 🔐 JWT Authentication & Authorization
- 👥 Multi-role User Management (Super Admin, Admin, Teacher, Student, Parent)
- 🏫 Multi-tenant School Management
- 📚 Academic Year & Class Management
- 📊 Real-time Performance Monitoring
- 🚀 Non-blocking, Event-driven Architecture

## Quick Start

### 1. Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### 2. Register a new user
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+1234567890"
  }'
```

### 3. Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }'
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh JWT token

### User Management
- `GET /api/users` - Get all users (paginated)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Deactivate user

### School Management
- `GET /api/schools` - Get all schools
- `POST /api/schools` - Create new school
- `GET /api/schools/:id` - Get school by ID
- `PUT /api/schools/:id` - Update school

### Academic Management
- `GET /api/academic/years` - Get academic years
- `POST /api/academic/years` - Create academic year
- `GET /api/academic/classes` - Get classes
- `POST /api/academic/classes` - Create class

## Response Format
All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data here
  },
  "requestId": "req_123456789",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": {
    "code": "ERROR_CODE",
    "details": ["Additional error details"]
  },
  "requestId": "req_123456789",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Rate Limiting
API requests are rate-limited based on user roles:
- **Standard Users**: 100 requests per 15 minutes
- **Premium Users**: 1000 requests per 15 minutes
- **Admins**: 5000 requests per 15 minutes

## Error Codes
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

## Documentation Links
- [Swagger UI](http://localhost:3000/api-docs) - Interactive API documentation
- [Redoc](http://localhost:3000/docs) - Clean, responsive documentation
- [Postman Collection](http://localhost:3000/api/postman) - Import into Postman

## Support
For API support, please contact: support@sims.edu
