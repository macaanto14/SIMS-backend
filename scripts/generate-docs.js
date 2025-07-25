/**
 * Auto-Documentation Generator
 * Generates comprehensive API documentation from code annotations
 */

const fs = require('fs').promises;
const path = require('path');
const swaggerJsdoc = require('swagger-jsdoc');

class DocumentationGenerator {
  constructor() {
    this.outputDir = path.join(process.cwd(), 'docs');
    this.generatedFiles = [];
  }

  async generateAll() {
    console.log('🚀 Starting documentation generation...');
    
    try {
      // Ensure output directory exists
      await fs.mkdir(this.outputDir, { recursive: true });

      // Generate different documentation formats
      await Promise.all([
        this.generateSwaggerSpec(),
        this.generatePostmanCollection(),
        this.generateMarkdownDocs(),
        this.generateApiIndex()
      ]);

      console.log('✅ Documentation generation completed successfully!');
      console.log('\n📁 Generated files:');
      this.generatedFiles.forEach(file => console.log(`   - ${file}`));
      
      console.log('\n🌐 Access documentation at:');
      console.log('   - Swagger UI: http://localhost:3000/api-docs');
      console.log('   - Redoc: http://localhost:3000/docs');
      console.log('   - API Index: http://localhost:3000/api');

    } catch (error) {
      console.error('❌ Documentation generation failed:', error);
      process.exit(1);
    }
  }

  async generateSwaggerSpec() {
    const swaggerOptions = {
      definition: {
        openapi: '3.0.0',
        info: {
          title: 'SIMS Backend API',
          version: '2.0.0',
          description: 'School Information Management System - Complete Backend API'
        }
      },
      apis: [
        './src/routes/**/*.js',
        './src/api/controllers/**/*.js',
        './controllers/*.js',
        './routes/*.js'
      ]
    };

    const spec = swaggerJsdoc(swaggerOptions);
    const filePath = path.join(this.outputDir, 'swagger.json');
    
    await fs.writeFile(filePath, JSON.stringify(spec, null, 2));
    this.generatedFiles.push('docs/swagger.json');
    
    console.log('📄 Generated Swagger specification');
  }

  async generatePostmanCollection() {
    // Read existing Postman collection and enhance it
    const existingCollection = path.join(process.cwd(), 'SIMS_Backend_API.postman_collection.json');
    
    try {
      const collectionData = await fs.readFile(existingCollection, 'utf8');
      const collection = JSON.parse(collectionData);
      
      // Enhance collection with additional metadata
      collection.info.description += '\n\nAuto-generated and enhanced collection';
      collection.info.version = '2.0.0';
      collection.info._postman_id = require('crypto').randomUUID();
      
      const outputPath = path.join(this.outputDir, 'postman-collection.json');
      await fs.writeFile(outputPath, JSON.stringify(collection, null, 2));
      this.generatedFiles.push('docs/postman-collection.json');
      
      console.log('📮 Generated enhanced Postman collection');
    } catch (error) {
      console.warn('⚠️  Could not enhance existing Postman collection:', error.message);
    }
  }

  async generateMarkdownDocs() {
    const markdownContent = `# SIMS Backend API Documentation

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
\`\`\`
Authorization: Bearer <your-jwt-token>
\`\`\`

### 2. Register a new user
\`\`\`bash
curl -X POST http://localhost:3000/api/auth/register \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+1234567890"
  }'
\`\`\`

### 3. Login
\`\`\`bash
curl -X POST http://localhost:3000/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }'
\`\`\`

## API Endpoints

### Authentication
- \`POST /api/auth/register\` - Register new user
- \`POST /api/auth/login\` - User login
- \`GET /api/auth/profile\` - Get user profile
- \`POST /api/auth/logout\` - User logout
- \`POST /api/auth/refresh\` - Refresh JWT token

### User Management
- \`GET /api/users\` - Get all users (paginated)
- \`GET /api/users/:id\` - Get user by ID
- \`PUT /api/users/:id\` - Update user
- \`DELETE /api/users/:id\` - Deactivate user

### School Management
- \`GET /api/schools\` - Get all schools
- \`POST /api/schools\` - Create new school
- \`GET /api/schools/:id\` - Get school by ID
- \`PUT /api/schools/:id\` - Update school

### Academic Management
- \`GET /api/academic/years\` - Get academic years
- \`POST /api/academic/years\` - Create academic year
- \`GET /api/academic/classes\` - Get classes
- \`POST /api/academic/classes\` - Create class

## Response Format
All API responses follow a consistent format:

### Success Response
\`\`\`json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data here
  },
  "requestId": "req_123456789",
  "timestamp": "2024-01-15T10:30:00Z"
}
\`\`\`

### Error Response
\`\`\`json
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
\`\`\`

## Rate Limiting
API requests are rate-limited based on user roles:
- **Standard Users**: 100 requests per 15 minutes
- **Premium Users**: 1000 requests per 15 minutes
- **Admins**: 5000 requests per 15 minutes

## Error Codes
- \`400\` - Bad Request (validation errors)
- \`401\` - Unauthorized (authentication required)
- \`403\` - Forbidden (insufficient permissions)
- \`404\` - Not Found
- \`409\` - Conflict (duplicate resource)
- \`429\` - Too Many Requests (rate limit exceeded)
- \`500\` - Internal Server Error

## Documentation Links
- [Swagger UI](http://localhost:3000/api-docs) - Interactive API documentation
- [Redoc](http://localhost:3000/docs) - Clean, responsive documentation
- [Postman Collection](http://localhost:3000/api/postman) - Import into Postman

## Support
For API support, please contact: support@sims.edu
`;

    const filePath = path.join(this.outputDir, 'README.md');
    await fs.writeFile(filePath, markdownContent);
    this.generatedFiles.push('docs/README.md');
    
    console.log('📝 Generated Markdown documentation');
  }

  async generateApiIndex() {
    const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SIMS API Documentation</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; border-radius: 8px 8px 0 0; }
        .content { padding: 40px; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-top: 30px; }
        .card { border: 1px solid #e1e5e9; border-radius: 6px; padding: 20px; transition: transform 0.2s; }
        .card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .card h3 { margin-top: 0; color: #333; }
        .btn { display: inline-block; background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin-top: 10px; }
        .btn:hover { background: #0056b3; }
        .status { display: inline-block; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: bold; }
        .status.online { background: #d4edda; color: #155724; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏫 SIMS API Documentation</h1>
            <p>School Information Management System - Complete Backend API</p>
            <span class="status online">● API Online</span>
        </div>
        
        <div class="content">
            <h2>📚 Documentation Formats</h2>
            <div class="grid">
                <div class="card">
                    <h3>🔧 Swagger UI</h3>
                    <p>Interactive API documentation with try-it-out functionality. Perfect for testing endpoints directly from the browser.</p>
                    <a href="/api-docs" class="btn">Open Swagger UI</a>
                </div>
                
                <div class="card">
                    <h3>📖 Redoc</h3>
                    <p>Clean, responsive documentation with a beautiful interface. Great for reading and understanding the API structure.</p>
                    <a href="/docs" class="btn">Open Redoc</a>
                </div>
                
                <div class="card">
                    <h3>📮 Postman Collection</h3>
                    <p>Ready-to-import Postman collection with all endpoints, examples, and environment variables configured.</p>
                    <a href="/api/postman" class="btn">Download Collection</a>
                </div>
                
                <div class="card">
                    <h3>📄 OpenAPI Spec</h3>
                    <p>Raw OpenAPI 3.0 specification in JSON format. Use this to generate client SDKs or import into other tools.</p>
                    <a href="/api-docs/swagger.json" class="btn">Download Spec</a>
                </div>
            </div>
            
            <h2>🚀 Quick Start</h2>
            <div class="grid">
                <div class="card">
                    <h3>1. Authentication</h3>
                    <p>Register or login to get your JWT token:</p>
                    <code>POST /api/auth/login</code>
                </div>
                
                <div class="card">
                    <h3>2. Set Authorization</h3>
                    <p>Include the token in your requests:</p>
                    <code>Authorization: Bearer &lt;token&gt;</code>
                </div>
                
                <div class="card">
                    <h3>3. Make Requests</h3>
                    <p>Start using the API endpoints:</p>
                    <code>GET /api/users</code>
                </div>
            </div>
            
            <h2>📊 API Status</h2>
            <div class="card">
                <h3>System Health</h3>
                <p>Check the current status of the API and its dependencies.</p>
                <a href="/health" class="btn">View Health Status</a>
            </div>
        </div>
    </div>
</body>
</html>`;

    const filePath = path.join(this.outputDir, 'index.html');
    await fs.writeFile(filePath, indexHtml);
    this.generatedFiles.push('docs/index.html');
    
    console.log('🌐 Generated API index page');
  }
}

// Run if called directly
if (require.main === module) {
  const generator = new DocumentationGenerator();
  generator.generateAll();
}

module.exports = DocumentationGenerator;