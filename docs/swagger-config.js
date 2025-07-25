/**
 * Swagger/OpenAPI Configuration
 * Auto-generates comprehensive API documentation
 */

const swaggerJSDoc = require('swagger-jsdoc');
const path = require('path');

const swaggerDefinition = {
  openapi: '3.0.3',
  info: {
    title: 'SIMS Backend API',
    version: '1.0.0',
    description: `
      # School Information Management System API
      
      A comprehensive REST API for managing school operations including:
      - User authentication and authorization
      - Student and staff management
      - Academic year and class management
      - Attendance tracking
      - Grade management
      - School administration
      
      ## Authentication
      This API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:
      \`Authorization: Bearer <your-jwt-token>\`
      
      ## Rate Limiting
      API requests are rate-limited based on user roles:
      - Standard users: 100 requests per 15 minutes
      - Premium users: 1000 requests per 15 minutes
      - Administrators: 5000 requests per 15 minutes
      
      ## Error Handling
      The API uses standard HTTP status codes and returns detailed error messages in JSON format.
    `,
    contact: {
      name: 'SIMS API Support',
      email: 'support@sims.edu',
      url: 'https://sims.edu/support'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    },
    termsOfService: 'https://sims.edu/terms'
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Development server'
    },
    {
      url: 'https://api-staging.sims.edu',
      description: 'Staging server'
    },
    {
      url: 'https://api.sims.edu',
      description: 'Production server'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token obtained from login endpoint'
      },
      apiKey: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
        description: 'API key for service-to-service communication'
      }
    },
    schemas: {
      User: {
        type: 'object',
        required: ['email', 'firstName', 'lastName'],
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'Unique user identifier',
            example: '123e4567-e89b-12d3-a456-426614174000'
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address',
            example: 'john.doe@school.edu'
          },
          firstName: {
            type: 'string',
            minLength: 2,
            maxLength: 50,
            description: 'User first name',
            example: 'John'
          },
          lastName: {
            type: 'string',
            minLength: 2,
            maxLength: 50,
            description: 'User last name',
            example: 'Doe'
          },
          phone: {
            type: 'string',
            pattern: '^\\+?[1-9]\\d{1,14}$',
            description: 'User phone number',
            example: '+1234567890'
          },
          avatarUrl: {
            type: 'string',
            format: 'uri',
            description: 'User avatar image URL',
            example: 'https://example.com/avatar.jpg'
          },
          isActive: {
            type: 'boolean',
            description: 'User account status',
            example: true
          },
          roles: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/UserRole'
            },
            description: 'User roles and permissions'
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Account creation timestamp',
            example: '2024-01-15T10:30:00Z'
          },
          lastLoginAt: {
            type: 'string',
            format: 'date-time',
            description: 'Last login timestamp',
            example: '2024-01-20T14:45:00Z'
          }
        }
      },
      UserRole: {
        type: 'object',
        properties: {
          roleId: {
            type: 'string',
            format: 'uuid',
            description: 'Role identifier'
          },
          roleName: {
            type: 'string',
            enum: ['Super Admin', 'Admin', 'Teacher', 'Student', 'Parent'],
            description: 'Role name'
          },
          schoolId: {
            type: 'string',
            format: 'uuid',
            description: 'Associated school identifier'
          },
          schoolName: {
            type: 'string',
            description: 'Associated school name'
          }
        }
      },
      School: {
        type: 'object',
        required: ['name', 'address'],
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'School identifier'
          },
          name: {
            type: 'string',
            minLength: 3,
            maxLength: 100,
            description: 'School name',
            example: 'Springfield Elementary School'
          },
          address: {
            type: 'string',
            description: 'School address',
            example: '123 Education St, Springfield, IL 62701'
          },
          phone: {
            type: 'string',
            description: 'School phone number'
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'School email address'
          },
          website: {
            type: 'string',
            format: 'uri',
            description: 'School website URL'
          },
          isActive: {
            type: 'boolean',
            description: 'School status'
          }
        }
      },
      AcademicYear: {
        type: 'object',
        required: ['name', 'startDate', 'endDate'],
        properties: {
          id: {
            type: 'string',
            format: 'uuid'
          },
          schoolId: {
            type: 'string',
            format: 'uuid'
          },
          name: {
            type: 'string',
            example: '2024-2025'
          },
          startDate: {
            type: 'string',
            format: 'date',
            example: '2024-09-01'
          },
          endDate: {
            type: 'string',
            format: 'date',
            example: '2025-06-30'
          },
          isCurrent: {
            type: 'boolean',
            description: 'Whether this is the current academic year'
          }
        }
      },
      Class: {
        type: 'object',
        required: ['name', 'gradeLevel'],
        properties: {
          id: {
            type: 'string',
            format: 'uuid'
          },
          schoolId: {
            type: 'string',
            format: 'uuid'
          },
          academicYearId: {
            type: 'string',
            format: 'uuid'
          },
          name: {
            type: 'string',
            example: 'Grade 5A'
          },
          gradeLevel: {
            type: 'integer',
            minimum: 1,
            maximum: 12,
            example: 5
          },
          section: {
            type: 'string',
            example: 'A'
          },
          maxStudents: {
            type: 'integer',
            minimum: 1,
            maximum: 50,
            example: 30
          },
          roomNumber: {
            type: 'string',
            example: 'Room 101'
          },
          classTeacherId: {
            type: 'string',
            format: 'uuid'
          }
        }
      },
      Error: {
        type: 'object',
        required: ['error', 'message'],
        properties: {
          error: {
            type: 'string',
            description: 'Error type',
            example: 'ValidationError'
          },
          message: {
            type: 'string',
            description: 'Error message',
            example: 'Invalid input data'
          },
          details: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field: {
                  type: 'string',
                  example: 'email'
                },
                message: {
                  type: 'string',
                  example: 'Invalid email format'
                }
              }
            }
          },
          requestId: {
            type: 'string',
            format: 'uuid',
            description: 'Request identifier for debugging'
          },
          timestamp: {
            type: 'string',
            format: 'date-time'
          }
        }
      },
      PaginatedResponse: {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: {
              type: 'object'
            }
          },
          pagination: {
            type: 'object',
            properties: {
              total: {
                type: 'integer',
                description: 'Total number of items'
              },
              page: {
                type: 'integer',
                description: 'Current page number'
              },
              limit: {
                type: 'integer',
                description: 'Items per page'
              },
              totalPages: {
                type: 'integer',
                description: 'Total number of pages'
              }
            }
          }
        }
      }
    },
    responses: {
      UnauthorizedError: {
        description: 'Authentication required',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error'
            },
            example: {
              error: 'UnauthorizedError',
              message: 'Access token required',
              timestamp: '2024-01-20T10:30:00Z'
            }
          }
        }
      },
      ForbiddenError: {
        description: 'Insufficient permissions',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error'
            }
          }
        }
      },
      NotFoundError: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error'
            }
          }
        }
      },
      ValidationError: {
        description: 'Invalid input data',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error'
            }
          }
        }
      },
      RateLimitError: {
        description: 'Rate limit exceeded',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error'
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
      SearchParam: {
        name: 'search',
        in: 'query',
        description: 'Search term for filtering results',
        required: false,
        schema: {
          type: 'string',
          minLength: 2,
          maxLength: 100
        }
      },
      SchoolIdParam: {
        name: 'school_id',
        in: 'query',
        description: 'Filter by school ID',
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
  ],
  tags: [
    {
      name: 'Authentication',
      description: 'User authentication and authorization endpoints'
    },
    {
      name: 'Users',
      description: 'User management operations'
    },
    {
      name: 'Schools',
      description: 'School management operations'
    },
    {
      name: 'Academic',
      description: 'Academic year and class management'
    },
    {
      name: 'Health',
      description: 'System health and monitoring'
    }
  ]
};

const options = {
  definition: swaggerDefinition,
  apis: [
    path.join(__dirname, '../src/routes/**/*.js'),
    path.join(__dirname, '../src/api/controllers/**/*.js'),
    path.join(__dirname, '../controllers/*.js'),
    path.join(__dirname, '../routes/*.js')
  ]
};

const specs = swaggerJSDoc(options);

module.exports = {
  swaggerDefinition,
  specs,
  options
};