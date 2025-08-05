const express = require('express');
const cors = require('cors');

// Test if basic modules load correctly
console.log('🔍 Testing module imports...');

try {
  const authRoutes = require('./routes/auth');
  console.log('✅ Auth routes loaded');
} catch (error) {
  console.error('❌ Auth routes failed:', error.message);
}

try {
  const schoolRoutes = require('./routes/schools');
  console.log('✅ School routes loaded');
} catch (error) {
  console.error('❌ School routes failed:', error.message);
}

try {
  const pool = require('./config/database');
  console.log('✅ Database config loaded');
} catch (error) {
  console.error('❌ Database config failed:', error.message);
}

// Create a minimal test server
const app = express();
const PORT = 3001; // Use different port to avoid conflicts

app.use(cors());
app.use(express.json());

// Test route
app.get('/test', (req, res) => {
  res.json({ message: 'Test server working!' });
});

// Test schools route without authentication
app.get('/api/schools/test', (req, res) => {
  res.json({ message: 'Schools route accessible!' });
});

// Try to mount the actual schools route
try {
  const schoolRoutes = require('./routes/schools');
  app.use('/api/schools', schoolRoutes);
  console.log('✅ Schools routes mounted successfully');
} catch (error) {
  console.error('❌ Failed to mount schools routes:', error.message);
}

app.listen(PORT, () => {
  console.log(`🧪 Debug server running on port ${PORT}`);
  console.log(`Test: http://localhost:${PORT}/test`);
  console.log(`Schools test: http://localhost:${PORT}/api/schools/test`);
});