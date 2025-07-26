/**
 * SIMS Backend API - Main Application Entry Point
 * 
 * This file initializes the Express application with all necessary middleware,
 * routes, and error handling. It follows a modular architecture for scalability.
 * 
 * @author Ismail Mohamed
 * @version 1.0.0
 */

const express = require('express');
const compression = require('compression');
require('dotenv').config();
const AuditContextMiddleware = require('./middleware/audit/auditContext');

// Import core modules
const { setupMiddleware } = require('./api/middleware');
const { setupRoutes } = require('./api/routes');
const { setupErrorHandling } = require('./api/middleware/errorHandler');
const { connectDatabase } = require('./infrastructure/database');
const logger = require('./shared/utils/logger');
const { APP_CONFIG } = require('./config/app');
const documentationMiddleware = require('./middleware/documentation');

/**
 * Initialize and configure the Express application
 * @returns {Express} Configured Express application instance
 */
const createApp = () => {
  // Create Express application instance
  const app = express();

  // Enable response compression for better performance
  app.use(compression());

  // Setup core middleware (security, parsing, logging, etc.)
  setupMiddleware(app);

  // Setup API routes with versioning support
  setupRoutes(app);

  // Setup global error handling middleware
  setupErrorHandling(app);

  return app;
};

/**
 * Start the application server
 * Handles database connection, server startup, and graceful shutdown
 */
const startServer = async () => {
  try {
    // Initialize database connection
    await connectDatabase();
    logger.info('Database connection established successfully');

    // Create and configure Express app
    const app = createApp();

    // Start HTTP server
    const server = app.listen(APP_CONFIG.PORT, () => {
      logger.info(`🚀 SIMS Backend API Server Started`);
      logger.info(`📡 Server running on port ${APP_CONFIG.PORT}`);
      logger.info(`🌍 Environment: ${APP_CONFIG.NODE_ENV}`);
      logger.info(`📊 Health check: http://localhost:${APP_CONFIG.PORT}/health`);
    });

    // Graceful shutdown handling
    const gracefulShutdown = async (signal) => {
      logger.info(`${signal} received, shutting down gracefully`);
      
      // Close HTTP server
      server.close(async () => {
        try {
          // Close database connections
          await require('./infrastructure/database').closeConnection();
          logger.info('Database connections closed');
          
          // Exit process
          process.exit(0);
        } catch (error) {
          logger.error('Error during shutdown:', error);
          process.exit(1);
        }
      });
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    return server;
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server if this file is run directly
if (require.main === module) {
  startServer();
}

module.exports = { createApp, startServer };


class Application {
  constructor() {
    this.app = express();
    this.server = null;
    this.setupMiddleware();
    this.setupRoutes();
    this.setupDocumentation(); // Add this line
    this.setupErrorHandling();
  }

  /**
   * Setup API documentation
   */
  setupDocumentation() {
    // Initialize documentation middleware
    documentationMiddleware.initialize().catch(err => 
      logger.error('Documentation initialization failed:', err)
    );

    // Swagger UI
    this.app.use('/docs', ...documentationMiddleware.setupSwaggerUI());
    
    // OpenAPI JSON endpoint
    this.app.get('/docs/openapi.json', documentationMiddleware.serveOpenAPIJSON());
    
    // OpenAPI YAML endpoint
    this.app.get('/docs/openapi.yaml', documentationMiddleware.serveOpenAPIYAML());
    
    // Documentation health check
    this.app.get('/docs/health', documentationMiddleware.healthCheck());

    // Redoc documentation (if available)
    this.app.get('/redoc', (req, res) => {
      res.redirect('/docs/redoc.html');
    });

    // Serve static documentation files
    this.app.use('/docs/static', express.static(path.join(__dirname, '../docs')));

    logger.info('API documentation endpoints configured', {
      swagger: '/docs',
      openapi: '/docs/openapi.json',
      redoc: '/redoc'
    });
  }
}