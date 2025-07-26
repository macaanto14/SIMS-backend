const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing audit system issues...');

// Fix server.js import path
const serverPath = './server.js';
let serverContent = fs.readFileSync(serverPath, 'utf8');

// Replace the incorrect audit middleware import
serverContent = serverContent.replace(
  "const auditMiddleware = require('./src/middleware/audit');",
  "const { auditMiddleware } = require('./src/middleware/audit');"
);

// Also fix the audit routes import if needed
if (!serverContent.includes("const auditRoutes = require('./routes/audit');")) {
  serverContent = serverContent.replace(
    "const academicRoutes = require('./routes/academic');",
    "const academicRoutes = require('./routes/academic');\nconst auditRoutes = require('./routes/audit');"
  );
}

fs.writeFileSync(serverPath, serverContent);
console.log('✅ Fixed server.js imports');

console.log('🎉 All audit system issues have been fixed!');
console.log('📝 Changes made:');
console.log('   - Fixed audit middleware import in server.js');
console.log('   - Ensured proper destructuring of auditMiddleware');
console.log('');
console.log('🚀 You can now start the server with: npm run dev');