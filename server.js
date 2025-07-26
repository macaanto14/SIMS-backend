const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const redoc = require('redoc-express');
const path = require('path');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const schoolRoutes = require('./routes/schools');
const academicRoutes = require('./routes/academic');
const auditRoutes = require('./routes/audit');

// Import database connection
const pool = require('./config/database');

// Import audit middleware - Fixed import with destructuring
const { auditMiddleware } = require('./src/middleware/audit');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [] // Add your production domains
    : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173'],
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// Swagger/OpenAPI Configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SIMS Backend API',
      version: '2.0.0',
      description: `
        School Information Management System - Complete Backend API
        
        ## Features
        - 🔐 JWT Authentication & Authorization
        - 👥 Multi-role User Management
        - 🏫 Multi-tenant School Management
        - 📚 Academic Year & Class Management
        - 📊 Real-time Performance Monitoring
        - 🚀 Non-blocking, Event-driven Architecture
        
        ## Authentication
        Most endpoints require authentication. Include the JWT token in the Authorization header:
        \`Authorization: Bearer <your-jwt-token>\`
      `,
      contact: {
        name: 'SIMS API Support',
        email: 'support@sims.edu',
        url: 'https://sims.edu/support'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: process.env.API_BASE_URL || `http://localhost:${PORT}`,
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token obtained from login endpoint'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid', description: 'User unique identifier' },
            email: { type: 'string', format: 'email', description: 'User email address' },
            firstName: { type: 'string', description: 'User first name' },
            lastName: { type: 'string', description: 'User last name' },
            phone: { type: 'string', description: 'User phone number' },
            isActive: { type: 'boolean', description: 'User account status' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          },
          required: ['id', 'email', 'firstName', 'lastName']
        },
        UserRegistration: {
          type: 'object',
          properties: {
            email: { type: 'string', format: 'email', description: 'User email address' },
            password: { type: 'string', minLength: 8, description: 'User password (min 8 characters)' },
            firstName: { type: 'string', description: 'User first name' },
            lastName: { type: 'string', description: 'User last name' },
            phone: { type: 'string', description: 'User phone number' },
            schoolId: { type: 'string', format: 'uuid', description: 'School ID for association' }
          },
          required: ['email', 'password', 'firstName', 'lastName', 'schoolId']
        },
        UserLogin: {
          type: 'object',
          properties: {
            email: { type: 'string', format: 'email', description: 'User email address' },
            password: { type: 'string', description: 'User password' }
          },
          required: ['email', 'password']
        },
        AuthResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Authentication successful' },
            data: {
              type: 'object',
              properties: {
                user: { $ref: '#/components/schemas/User' },
                token: { type: 'string', description: 'JWT access token' },
                refreshToken: { type: 'string', description: 'JWT refresh token' },
                expiresIn: { type: 'integer', description: 'Token expiration time in seconds' }
              }
            },
            timestamp: { type: 'string', format: 'date-time' }
          }
        },
        School: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string', description: 'School name' },
            address: { type: 'string', description: 'School address' },
            phone: { type: 'string', description: 'School contact phone' },
            email: { type: 'string', format: 'email', description: 'School contact email' },
            isActive: { type: 'boolean', description: 'School status' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          },
          required: ['id', 'name', 'address']
        },
        AcademicYear: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            schoolId: { type: 'string', format: 'uuid' },
            name: { type: 'string', description: 'Academic year name (e.g., "2024-2025")' },
            startDate: { type: 'string', format: 'date' },
            endDate: { type: 'string', format: 'date' },
            isCurrent: { type: 'boolean', description: 'Whether this is the current academic year' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          },
          required: ['id', 'schoolId', 'name', 'startDate', 'endDate']
        },
        Class: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            schoolId: { type: 'string', format: 'uuid' },
            academicYearId: { type: 'string', format: 'uuid' },
            name: { type: 'string', description: 'Class name' },
            gradeLevel: { type: 'integer', minimum: 1, maximum: 12 },
            section: { type: 'string', description: 'Class section (A, B, C, etc.)' },
            maxStudents: { type: 'integer', minimum: 1 },
            roomNumber: { type: 'string', description: 'Classroom number' },
            classTeacherId: { type: 'string', format: 'uuid' },
            isActive: { type: 'boolean' },
            studentCount: { type: 'integer', description: 'Current number of enrolled students' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          },
          required: ['id', 'schoolId', 'academicYearId', 'name', 'gradeLevel']
        },
        ApiResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', description: 'Request success status' },
            message: { type: 'string', description: 'Response message' },
            data: { type: 'object', description: 'Response data' },
            timestamp: { type: 'string', format: 'date-time' }
          },
          required: ['success', 'message']
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', description: 'Error message' },
            error: { type: 'string', description: 'Error type' },
            details: { 
              type: 'object', 
              description: 'Additional error details',
              additionalProperties: true
            },
            timestamp: { type: 'string', format: 'date-time' },
            path: { type: 'string', description: 'Request path that caused the error' },
            requestId: { type: 'string', description: 'Unique request identifier' }
          },
          required: ['success', 'message']
        },
        ValidationErrorDetails: {
          type: 'object',
          properties: {
            field: { type: 'string', description: 'Field that failed validation' },
            message: { type: 'string', description: 'Validation error message' },
            value: { description: 'Value that failed validation' },
            code: { type: 'string', description: 'Validation error code' }
          },
          required: ['field', 'message']
        },
        PaginationMeta: {
          type: 'object',
          properties: {
            currentPage: { type: 'integer', minimum: 1 },
            totalPages: { type: 'integer', minimum: 0 },
            totalItems: { type: 'integer', minimum: 0 },
            itemsPerPage: { type: 'integer', minimum: 1 },
            hasNextPage: { type: 'boolean' },
            hasPreviousPage: { type: 'boolean' }
          }
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string' },
            data: {
              type: 'array',
              items: { type: 'object' }
            },
            meta: { $ref: '#/components/schemas/PaginationMeta' },
            timestamp: { type: 'string', format: 'date-time' }
          }
        }
      },
      responses: {
        ValidationError: {
          description: 'Validation Error - Invalid input data',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: false },
                  message: { type: 'string', example: 'Validation failed' },
                  error: { type: 'string', example: 'ValidationError' },
                  details: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/ValidationErrorDetails' }
                  },
                  timestamp: { type: 'string', format: 'date-time' }
                }
              },
              example: {
                success: false,
                message: 'Validation failed',
                error: 'ValidationError',
                details: [
                  {
                    field: 'email',
                    message: 'Invalid email format',
                    value: 'invalid-email',
                    code: 'INVALID_EMAIL'
                  }
                ],
                timestamp: '2024-01-15T10:30:00.000Z'
              }
            }
          }
        },
        UnauthorizedError: {
          description: 'Unauthorized - Authentication required',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: {
                success: false,
                message: 'Authentication required',
                error: 'UnauthorizedError',
                timestamp: '2024-01-15T10:30:00.000Z'
              }
            }
          }
        },
        ForbiddenError: {
          description: 'Forbidden - Insufficient permissions',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: {
                success: false,
                message: 'Insufficient permissions',
                error: 'ForbiddenError',
                timestamp: '2024-01-15T10:30:00.000Z'
              }
            }
          }
        },
        NotFoundError: {
          description: 'Not Found - Resource does not exist',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: {
                success: false,
                message: 'Resource not found',
                error: 'NotFoundError',
                timestamp: '2024-01-15T10:30:00.000Z'
              }
            }
          }
        },
        ConflictError: {
          description: 'Conflict - Resource already exists',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: {
                success: false,
                message: 'Resource already exists',
                error: 'ConflictError',
                timestamp: '2024-01-15T10:30:00.000Z'
              }
            }
          }
        },
        RateLimitError: {
          description: 'Too Many Requests - Rate limit exceeded',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: {
                success: false,
                message: 'Too many requests, please try again later',
                error: 'RateLimitError',
                details: {
                  limit: 100,
                  windowMs: 900000,
                  retryAfter: 300
                },
                timestamp: '2024-01-15T10:30:00.000Z'
              }
            }
          }
        },
        InternalServerError: {
          description: 'Internal Server Error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: {
                success: false,
                message: 'Internal server error',
                error: 'InternalServerError',
                timestamp: '2024-01-15T10:30:00.000Z'
              }
            }
          }
        }
      },
      parameters: {
        PageParam: {
          name: 'page',
          in: 'query',
          description: 'Page number for pagination',
          required: false,
          schema: {
            type: 'integer',
            minimum: 1,
            default: 1
          }
        },
        LimitParam: {
          name: 'limit',
          in: 'query',
          description: 'Number of items per page',
          required: false,
          schema: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            default: 10
          }
        },
        SchoolIdParam: {
          name: 'schoolId',
          in: 'query',
          description: 'School ID filter',
          required: false,
          schema: {
            type: 'string',
            format: 'uuid'
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: [
    './routes/*.js',
    './controllers/*.js',
    './src/routes/**/*.js',
    './src/controllers/**/*.js'
  ]
};

// Generate Swagger specification
const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Swagger UI setup
const swaggerUiOptions = {
  customCss: `
    .swagger-ui .topbar { display: none; }
    .swagger-ui .info { margin: 20px 0; }
    .swagger-ui .scheme-container { background: #f8f9fa; padding: 15px; border-radius: 5px; }
    .swagger-ui .btn.authorize { background-color: #007bff; border-color: #007bff; }
  `,
  customSiteTitle: 'SIMS API Documentation',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    showExtensions: true,
    showCommonExtensions: true
  }
};

// Documentation Routes
// Serve static documentation files FIRST (more specific route)
app.use('/docs/static', express.static(path.join(__dirname, 'docs')));

// Raw OpenAPI JSON
app.get('/api-docs/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));

// Redoc Documentation
app.get('/docs', redoc({
  title: 'SIMS API Documentation',
  specUrl: '/api-docs/swagger.json',
  redocOptions: {
    theme: {
      colors: {
        primary: {
          main: '#007bff'
        }
      },
      typography: {
        fontSize: '14px',
        lineHeight: '1.5em',
        code: {
          fontSize: '13px'
        },
        headings: {
          fontFamily: 'Montserrat, sans-serif',
          fontWeight: '600'
        }
      },
      sidebar: {
        backgroundColor: '#f8f9fa'
      }
    },
    hideDownloadButton: false,
    disableSearch: false,
    menuToggle: true,
    scrollYOffset: 60,
    hideLoading: false,
    nativeScrollbars: false,
    pathInMiddlePanel: true,
    requiredPropsFirst: true,
    sortPropsAlphabetically: true,
    showExtensions: true,
    sideNavStyle: 'summary-only'
  }
}));

// API Index/Landing Page
app.get('/api', (req, res) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  res.json({
    name: 'SIMS Backend API',
    version: '2.0.0',
    description: 'School Information Management System - Backend API',
    documentation: {
      swagger: `${baseUrl}/api-docs`,
      redoc: `${baseUrl}/docs`,
      openapi: `${baseUrl}/api-docs/swagger.json`
    },
    endpoints: {
      health: `${baseUrl}/health`,
      auth: `${baseUrl}/api/auth`,
      users: `${baseUrl}/api/users`,
      schools: `${baseUrl}/api/schools`,
      academic: `${baseUrl}/api`
    },
    timestamp: new Date().toISOString()
  });
});

// Serve static documentation files
app.use('/docs/static', express.static(path.join(__dirname, 'docs')));

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    await pool.query('SELECT 1');
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      documentation: {
        swagger: `http://localhost:${PORT}/api-docs`,
        redoc: `http://localhost:${PORT}/docs`,
        api: `http://localhost:${PORT}/api`
      }
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Database connection failed'
    });
  }
});

// Apply audit middleware globally (after authentication middleware)
app.use(auditMiddleware());

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/schools', schoolRoutes);
app.use('/api', academicRoutes);
app.use('/api/audit', auditRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
    availableEndpoints: {
      documentation: {
        swagger: '/api-docs',
        redoc: '/docs',
        api: '/api'
      },
      health: '/health'
    }
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  
  // Database errors
  if (error.code === '23505') {
    return res.status(409).json({
      success: false,
      message: 'Duplicate entry',
      details: error.detail
    });
  }
  
  if (error.code === '23503') {
    return res.status(400).json({
      success: false,
      message: 'Foreign key constraint violation',
      details: error.detail
    });
  }
  
  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
  
  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired'
    });
  }
  
  // Validation errors
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      details: error.details
    });
  }
  
  // Default error response
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await pool.end();
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 School Information Management System API`);
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📚 API Documentation:`);
  console.log(`   - Swagger UI: http://localhost:${PORT}/api-docs`);
  console.log(`   - Redoc: http://localhost:${PORT}/docs`);
  console.log(`   - API Index: http://localhost:${PORT}/api`);
});

module.exports = app;