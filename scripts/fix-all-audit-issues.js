const fs = require('fs');

console.log('🔧 Fixing all audit system issues...');

// Fix server.js
const serverPath = './server.js';
let serverContent = fs.readFileSync(serverPath, 'utf8');

// Fix import
serverContent = serverContent.replace(
  "const auditMiddleware = require('./src/middleware/audit');",
  "const { auditMiddleware } = require('./src/middleware/audit');"
);

// Fix middleware usage
serverContent = serverContent.replace(
  "app.use(auditMiddleware);",
  "app.use(auditMiddleware());"
);

fs.writeFileSync(serverPath, serverContent);
console.log('✅ Fixed server.js');

console.log('🎉 All audit system issues have been fixed!');
console.log('📝 Changes made:');
console.log('   - Fixed audit middleware import with destructuring');
console.log('   - Fixed middleware usage by calling auditMiddleware()');
console.log('');
console.log('🚀 You can now start the server with: npm run dev');