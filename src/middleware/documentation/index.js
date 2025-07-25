/**
 * Documentation Middleware
 * Auto-generates and serves API documentation with real-time updates
 */

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const redoc = require('redoc-express');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../../utils/logger');

class DocumentationMiddleware {
  constructor() {
    this.swaggerSpec = null;
    this.lastUpdate = null;
    this.autoUpdateInterval = null;
  }

  /**
   * Initialize documentation middleware with auto-update
   */
  async initialize(app, options = {}) {
    const {
      enableAutoUpdate = true,
      updateInterval = 30000, // 30 seconds
      enableRedoc = true,
      enableSwaggerUI = true
    } = options;

    try {
      // Generate initial swagger spec
      await this.generateSwaggerSpec();

      // Setup Swagger UI
      if (enableSwaggerUI) {
        this.setupSwaggerUI(app);
      }

      // Setup Redoc
      if (enableRedoc) {
        this.setupRedoc(app);
      }

      // Setup auto-update
      if (enableAutoUpdate) {
        this.startAutoUpdate(updateInterval);
      }

      // Setup documentation routes
      this.setupDocumentationRoutes(app);

      logger.info('Documentation middleware initialized successfully');
    } catch (error) {
      logger.error('Documentation middleware initialization failed:', error);
      throw error;
    }
  }

  /**
   * Generate Swagger specification from code annotations
   */
  async generateSwaggerSpec() {
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
            url: process.env.API_BASE_URL || 'http://localhost:3000',
            description: 'Development server'
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
                avatarUrl: { type: 'string', format: 'uri', description: 'User avatar image URL' },
                isActive: { type: 'boolean', description: 'User account status' },
                roles: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/UserRole' },
                  description: 'User roles and permissions'
                },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' }
              },
              required: ['id', 'email', 'firstName', 'lastName']
            },
            UserRole: {
              type: 'object',
              properties: {
                roleId: { type: 'string', format: 'uuid' },
                roleName: { type: 'string', enum: ['Super Admin', 'Admin', 'Teacher', 'Student', 'Parent'] },
                schoolId: { type: 'string', format: 'uuid' },
                schoolName: { type: 'string' }
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
                website: { type: 'string', format: 'uri', description: 'School website URL' },
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
                requestId: { type: 'string', description: 'Unique request identifier' },
                timestamp: { type: 'string', format: 'date-time' }
              },
              required: ['success', 'message']
            },
            PaginatedResponse: {
              allOf: [
                { $ref: '#/components/schemas/ApiResponse' },
                {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'object',
                      properties: {
                        items: { type: 'array', items: {} },
                        pagination: {
                          type: 'object',
                          properties: {
                            total: { type: 'integer', description: 'Total number of items' },
                            page: { type: 'integer', description: 'Current page number' },
                            limit: { type: 'integer', description: 'Items per page' },
                            totalPages: { type: 'integer', description: 'Total number of pages' },
                            hasNext: { type: 'boolean', description: 'Whether there are more pages' },
                            hasPrev: { type: 'boolean', description: 'Whether there are previous pages' }
                          }
                        }
                      }
                    }
                  }
                }
              ]
            },
            ErrorResponse: {
              type: 'object',
              properties: {
                success: { type: 'boolean', example: false },
                message: { type: 'string', description: 'Error message' },
                error: {
                  type: 'object',
                  properties: {
                    code: { type: 'string', description: 'Error code' },
                    details: { type: 'array', items: { type: 'string' } }
                  }
                },
                requestId: { type: 'string' },
                timestamp: { type: 'string', format: 'date-time' }
              },
              required: ['success', 'message']
            }
          },
          responses: {
            UnauthorizedError: {
              description: 'Authentication required',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                  example: {
                    success: false,
                    message: 'Authentication required',
                    error: { code: 'UNAUTHORIZED' },
                    requestId: 'req_123456789',
                    timestamp: '2024-01-15T10:30:00Z'
                  }
                }
              }
            },
            ForbiddenError: {
              description: 'Insufficient permissions',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                  example: {
                    success: false,
                    message: 'Insufficient permissions',
                    error: { code: 'FORBIDDEN' },
                    requestId: 'req_123456789',
                    timestamp: '2024-01-15T10:30:00Z'
                  }
                }
              }
            },
            NotFoundError: {
              description: 'Resource not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                  example: {
                    success: false,
                    message: 'Resource not found',
                    error: { code: 'NOT_FOUND' },
                    requestId: 'req_123456789',
                    timestamp: '2024-01-15T10:30:00Z'
                  }
                }
              }
            },
            ValidationError: {
              description: 'Validation failed',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                  example: {
                    success: false,
                    message: 'Validation failed',
                    error: {
                      code: 'VALIDATION_ERROR',
                      details: ['Email is required', 'Password must be at least 8 characters']
                    },
                    requestId: 'req_123456789',
                    timestamp: '2024-01-15T10:30:00Z'
                  }
                }
              }
            },
            RateLimitError: {
              description: 'Rate limit exceeded',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                  example: {
                    success: false,
                    message: 'Rate limit exceeded',
                    error: { code: 'RATE_LIMIT_EXCEEDED' },
                    requestId: 'req_123456789',
                    timestamp: '2024-01-15T10:30:00Z'
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
              schema: { type: 'integer', minimum: 1, default: 1 }
            },
            LimitParam: {
              name: 'limit',
              in: 'query',
              description: 'Number of items per page',
              required: false,
              schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 }
            },
            SearchParam: {
              name: 'search',
              in: 'query',
              description: 'Search term for filtering results',
              required: false,
              schema: { type: 'string' }
            },
            SchoolIdParam: {
              name: 'school_id',
              in: 'query',
              description: 'Filter by school ID',
              required: false,
              schema: { type: 'string', format: 'uuid' }
            }
          }
        },
        security: [{ bearerAuth: [] }],
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
            description: 'System health and monitoring endpoints'
          }
        ]
      },
      apis: [
        './src/routes/**/*.js',
        './src/api/controllers/**/*.js',
        './controllers/*.js',
        './routes/*.js'
      ]
    };

    try {
      this.swaggerSpec = swaggerJsdoc(swaggerOptions);
      this.lastUpdate = new Date();
      
      // Save spec to file for external tools
      await this.saveSpecToFile();
      
      logger.info('Swagger specification generated successfully');
      return this.swaggerSpec;
    } catch (error) {
      logger.error('Failed to generate Swagger specification:', error);
      throw error;
    }
  }

  /**
   * Setup Swagger UI middleware
   */
  setupSwaggerUI(app) {
    const swaggerUiOptions = {
      explorer: true,
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        showExtensions: true,
        showCommonExtensions: true,
        docExpansion: 'none',
        defaultModelsExpandDepth: 2,
        defaultModelExpandDepth: 2,
        tryItOutEnabled: true
      },
      customCss: `
        .swagger-ui .topbar { display: none; }
        .swagger-ui .info { margin: 20px 0; }
        .swagger-ui .scheme-container { background: #f8f9fa; padding: 15px; border-radius: 5px; }
      `,
      customSiteTitle: 'SIMS API Documentation',
      customfavIcon: '/favicon.ico'
    };

    app.use('/api-docs', swaggerUi.serve);
    app.get('/api-docs', swaggerUi.setup(this.swaggerSpec, swaggerUiOptions));
    
    // Serve raw swagger spec
    app.get('/api-docs/swagger.json', (req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.send(this.swaggerSpec);
    });

    logger.info('Swagger UI setup completed at /api-docs');
  }

  /**
   * Setup Redoc middleware
   */
  setupRedoc(app) {
    const redocOptions = {
      title: 'SIMS API Documentation',
      specUrl: '/api-docs/swagger.json',
      redocOptions: {
        theme: {
          colors: {
            primary: {
              main: '#2196F3'
            }
          },
          typography: {
            fontSize: '14px',
            lineHeight: '1.5em',
            code: {
              fontSize: '13px'
            }
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
        expandResponses: '200,201',
        expandSingleSchemaField: true
      }
    };

    app.get('/docs', redoc(redocOptions));
    logger.info('Redoc setup completed at /docs');
  }

  /**
   * Setup additional documentation routes
   */
  setupDocumentationRoutes(app) {
    // API status and documentation index
    app.get('/api', (req, res) => {
      res.json({
        name: 'SIMS Backend API',
        version: '2.0.0',
        description: 'School Information Management System - Backend API',
        documentation: {
          swagger: `${req.protocol}://${req.get('host')}/api-docs`,
          redoc: `${req.protocol}://${req.get('host')}/docs`,
          postman: `${req.protocol}://${req.get('host')}/api/postman`,
          openapi: `${req.protocol}://${req.get('host')}/api-docs/swagger.json`
        },
        health: `${req.protocol}://${req.get('host')}/health`,
        lastUpdated: this.lastUpdate
      });
    });

    // Postman collection endpoint
    app.get('/api/postman', async (req, res) => {
      try {
        const postmanCollection = await this.generatePostmanCollection();
        res.json(postmanCollection);
      } catch (error) {
        logger.error('Failed to generate Postman collection:', error);
        res.status(500).json({ error: 'Failed to generate Postman collection' });
      }
    });

    // Documentation health check
    app.get('/api/docs/health', (req, res) => {
      res.json({
        status: 'healthy',
        lastUpdate: this.lastUpdate,
        endpoints: {
          swagger: '/api-docs',
          redoc: '/docs',
          postman: '/api/postman',
          spec: '/api-docs/swagger.json'
        }
      });
    });
  }

  /**
   * Start auto-update process
   */
  startAutoUpdate(interval) {
    this.autoUpdateInterval = setInterval(async () => {
      try {
        await this.generateSwaggerSpec();
        logger.debug('Documentation auto-updated');
      } catch (error) {
        logger.error('Documentation auto-update failed:', error);
      }
    }, interval);

    logger.info(`Documentation auto-update started (interval: ${interval}ms)`);
  }

  /**
   * Stop auto-update process
   */
  stopAutoUpdate() {
    if (this.autoUpdateInterval) {
      clearInterval(this.autoUpdateInterval);
      this.autoUpdateInterval = null;
      logger.info('Documentation auto-update stopped');
    }
  }

  /**
   * Save specification to file
   */
  async saveSpecToFile() {
    try {
      const docsDir = path.join(process.cwd(), 'docs');
      await fs.mkdir(docsDir, { recursive: true });
      
      const specPath = path.join(docsDir, 'swagger.json');
      await fs.writeFile(specPath, JSON.stringify(this.swaggerSpec, null, 2));
      
      logger.debug('Swagger specification saved to file');
    } catch (error) {
      logger.error('Failed to save specification to file:', error);
    }
  }

  /**
   * Generate Postman collection from Swagger spec
   */
  async generatePostmanCollection() {
    // This would convert Swagger spec to Postman collection format
    // Implementation would depend on your specific needs
    return {
      info: {
        name: 'SIMS Backend API',
        description: 'Auto-generated from Swagger specification',
        version: '2.0.0',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
      },
      // ... collection items would be generated from swagger spec
    };
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    this.stopAutoUpdate();
    logger.info('Documentation middleware cleaned up');
  }
}

module.exports = new DocumentationMiddleware();