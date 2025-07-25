/**
 * Documentation Health Check Script
 * Verifies that all documentation endpoints are working correctly
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

class DocumentationChecker {
  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
    this.results = [];
  }

  async checkEndpoint(endpoint, expectedStatus = 200) {
    return new Promise((resolve) => {
      const url = `${this.baseUrl}${endpoint}`;
      const startTime = Date.now();
      
      const req = http.get(url, (res) => {
        const duration = Date.now() - startTime;
        const result = {
          endpoint,
          url,
          status: res.statusCode,
          expected: expectedStatus,
          success: res.statusCode === expectedStatus,
          duration: `${duration}ms`,
          contentType: res.headers['content-type']
        };
        
        this.results.push(result);
        resolve(result);
      });

      req.on('error', (error) => {
        const result = {
          endpoint,
          url,
          status: 'ERROR',
          expected: expectedStatus,
          success: false,
          error: error.message,
          duration: 'N/A'
        };
        
        this.results.push(result);
        resolve(result);
      });

      req.setTimeout(5000, () => {
        req.destroy();
        const result = {
          endpoint,
          url,
          status: 'TIMEOUT',
          expected: expectedStatus,
          success: false,
          error: 'Request timeout',
          duration: '5000ms+'
        };
        
        this.results.push(result);
        resolve(result);
      });
    });
  }

  async runAllChecks() {
    console.log('🔍 Checking SIMS API Documentation Endpoints...\n');

    const endpoints = [
      { path: '/health', description: 'Health Check' },
      { path: '/api', description: 'API Index' },
      { path: '/api-docs', description: 'Swagger UI' },
      { path: '/api-docs/swagger.json', description: 'OpenAPI Specification' },
      { path: '/docs', description: 'Redoc Documentation' }
    ];

    for (const { path, description } of endpoints) {
      console.log(`Checking ${description}: ${path}`);
      await this.checkEndpoint(path);
    }

    this.printResults();
    this.generateReport();
  }

  printResults() {
    console.log('\n📊 Results Summary:');
    console.log('='.repeat(80));
    
    this.results.forEach(result => {
      const status = result.success ? '✅' : '❌';
      const statusText = result.status === 'ERROR' ? result.error : result.status;
      
      console.log(`${status} ${result.endpoint.padEnd(25)} | ${statusText.toString().padEnd(15)} | ${result.duration}`);
      
      if (!result.success && result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });

    const successCount = this.results.filter(r => r.success).length;
    const totalCount = this.results.length;
    
    console.log('\n' + '='.repeat(80));
    console.log(`📈 Overall Status: ${successCount}/${totalCount} endpoints working`);
    
    if (successCount === totalCount) {
      console.log('🎉 All documentation endpoints are working correctly!');
      console.log('\n📚 Access your documentation:');
      console.log(`   • Swagger UI: ${this.baseUrl}/api-docs`);
      console.log(`   • Redoc: ${this.baseUrl}/docs`);
      console.log(`   • API Index: ${this.baseUrl}/api`);
    } else {
      console.log('⚠️  Some endpoints are not working. Check the errors above.');
      this.printTroubleshootingTips();
    }
  }

  printTroubleshootingTips() {
    console.log('\n🔧 Troubleshooting Tips:');
    console.log('1. Make sure your server is running: npm start or node server.js');
    console.log('2. Check if the server is running on the correct port (default: 3000)');
    console.log('3. Verify all dependencies are installed: npm install');
    console.log('4. Check server logs for any startup errors');
    console.log('5. Ensure your .env file is properly configured');
  }

  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      baseUrl: this.baseUrl,
      results: this.results,
      summary: {
        total: this.results.length,
        successful: this.results.filter(r => r.success).length,
        failed: this.results.filter(r => !r.success).length
      }
    };

    const reportPath = path.join(__dirname, '../docs/health-check-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  }
}

// Run the checker
if (require.main === module) {
  const checker = new DocumentationChecker();
  checker.runAllChecks().catch(console.error);
}

module.exports = DocumentationChecker;