const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

// Import fresh database connection for debug
const pool = require('./config/database-debug');

const app = express();
const PORT = 3001; // Fixed port to avoid conflicts

// Basic middleware
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('combined'));

// Health check
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      port: PORT,
      database: 'connected'
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      database: 'disconnected'
    });
  }
});

// API info
app.get('/api', (req, res) => {
  res.json({
    name: 'SIMS Backend API - Debug Mode',
    version: '2.0.0',
    endpoints: {
      health: '/health',
      schools: '/api/schools'
    },
    timestamp: new Date().toISOString()
  });
});

// Debug schools route (no auth required)
try {
  const schoolsDebugRoutes = require('./routes/schools-debug');
  app.use('/api/schools', schoolsDebugRoutes);
  console.log('✅ Debug schools routes mounted');
} catch (error) {
  console.error('❌ Failed to mount debug schools routes:', error.message);
}

// 404 handler
app.use('*', (req, res) => {
  console.log(`❌ 404: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    availableEndpoints: [
      'GET /health',
      'GET /api',
      'GET /api/schools',
      'POST /api/schools'
    ]
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('❌ Global error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: error.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 SIMS Debug Server`);
  console.log(`📡 Running on port ${PORT}`);
  console.log(`🔗 Health: http://localhost:${PORT}/health`);
  console.log(`🔗 API Info: http://localhost:${PORT}/api`);
  console.log(`🔗 Schools: http://localhost:${PORT}/api/schools`);
  console.log(`📝 Test with: curl http://localhost:${PORT}/api/schools`);
});

module.exports = app;