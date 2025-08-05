const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3002;

app.use(cors());
app.use(express.json());

// Simple schools endpoint without authentication
app.get('/api/schools', (req, res) => {
  res.json({
    success: true,
    message: 'Schools endpoint working without auth',
    data: [
      { id: 1, name: 'Test School 1' },
      { id: 2, name: 'Test School 2' }
    ]
  });
});

app.post('/api/schools', (req, res) => {
  res.json({
    success: true,
    message: 'School creation endpoint working',
    data: {
      id: 3,
      name: req.body.name || 'New School',
      created: new Date().toISOString()
    }
  });
});

app.listen(PORT, () => {
  console.log(`🧪 Test schools server running on port ${PORT}`);
  console.log(`GET: http://localhost:${PORT}/api/schools`);
  console.log(`POST: http://localhost:${PORT}/api/schools`);
});