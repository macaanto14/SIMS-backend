/**
 * Enhanced Postman Collection Generator
 * Auto-generates comprehensive Postman collections from OpenAPI spec
 */

const fs = require('fs').promises;
const path = require('path');
const { specs } = require('../docs/swagger-config');
const logger = require('../src/utils/logger');

class PostmanCollectionGenerator {
  constructor() {
    this.collection = {
      info: {
        name: 'SIMS Backend API - Enhanced Collection',
        description: 'Comprehensive API collection with automated tests and workflows',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
        version: '2.0.0'
      },
      auth: {
        type: 'bearer',
        bearer: [
          {
            key: 'token',
            value: '{{auth_token}}',
            type: 'string'
          }
        ]
      },
      variable: [
        {
          key: 'base_url',
          value: 'http://localhost:3000',
          type: 'string'
        },
        {
          key: 'auth_token',
          value: '',
          type: 'string'
        },
        {
          key: 'user_id',
          value: '',
          type: 'string'
        },
        {
          key: 'school_id',
          value: '',
          type: 'string'
        },
        {
          key: 'academic_year_id',
          value: '',
          type: 'string'
        },
        {
          key: 'class_id',
          value: '',
          type: 'string'
        }
      ],
      event: [
        {
          listen: 'prerequest',
          script: {
            type: 'text/javascript',
            exec: [
              '// Global pre-request script',
              'pm.globals.set("timestamp", new Date().toISOString());',
              'pm.globals.set("request_id", pm.variables.replaceIn("{{$randomUUID}}"));',
              '',
              '// Add request ID header',
              'pm.request.headers.add({',
              '    key: "X-Request-ID",',
              '    value: pm.globals.get("request_id")',
              '});'
            ]
          }
        },
        {
          listen: 'test',
          script: {
            type: 'text/javascript',
            exec: [
              '// Global test script',
              'pm.test("Response time is less than 5000ms", function () {',
              '    pm.expect(pm.response.responseTime).to.be.below(5000);',
              '});',
              '',
              'pm.test("Response has required headers", function () {',
              '    pm.expect(pm.response.headers.get("Content-Type")).to.include("application/json");',
              '});',
              '',
              '// Log response for debugging',
              'console.log("Response Status:", pm.response.status);',
              'console.log("Response Time:", pm.response.responseTime + "ms");'
            ]
          }
        }
      ],
      item: []
    };
  }

  async generate() {
    try {
      // Generate items from OpenAPI spec
      await this.generateFromOpenAPI();
      
      // Add custom workflows
      this.addWorkflows();
      
      // Add environment setup
      this.addEnvironmentSetup();
      
      // Write collection file
      await this.writeCollection();
      
      // Generate Newman test suite
      await this.generateNewmanTests();
      
      logger.info('Enhanced Postman collection generated successfully');
    } catch (error) {
      logger.error('Failed to generate Postman collection:', error);
      throw error;
    }
  }

  async generateFromOpenAPI() {
    const { paths, components } = specs;
    
    // Group endpoints by tags
    const groupedEndpoints = {};
    
    Object.entries(paths).forEach(([path, methods]) => {
      Object.entries(methods).forEach(([method, spec]) => {
        const tag = spec.tags?.[0] || 'Uncategorized';
        
        if (!groupedEndpoints[tag]) {
          groupedEndpoints[tag] = [];
        }
        
        groupedEndpoints[tag].push({
          path,
          method: method.toUpperCase(),
          spec
        });
      });
    });

    // Generate collection items
    Object.entries(groupedEndpoints).forEach(([tag, endpoints]) => {
      const folder = {
        name: tag,
        item: [],
        description: `${tag} related endpoints`,
        event: []
      };

      endpoints.forEach(({ path, method, spec }) => {
        const item = this.createPostmanItem(path, method, spec);
        folder.item.push(item);
      });

      this.collection.item.push(folder);
    });
  }

  createPostmanItem(path, method, spec) {
    const item = {
      name: spec.summary || `${method} ${path}`,
      request: {
        method,
        header: [
          {
            key: 'Content-Type',
            value: 'application/json',
            type: 'text'
          }
        ],
        url: {
          raw: `{{base_url}}${path}`,
          host: ['{{base_url}}'],
          path: path.split('/').filter(p => p)
        }
      },
      response: [],
      event: []
    };

    // Add description
    if (spec.description) {
      item.request.description = spec.description;
    }

    // Add authentication if required
    if (spec.security && spec.security.length > 0) {
      item.request.auth = {
        type: 'bearer',
        bearer: [
          {
            key: 'token',
            value: '{{auth_token}}',
            type: 'string'
          }
        ]
      };
    } else {
      item.request.auth = {
        type: 'noauth'
      };
    }

    // Add query parameters
    if (spec.parameters) {
      const queryParams = spec.parameters
        .filter(param => param.in === 'query')
        .map(param => ({
          key: param.name,
          value: this.getExampleValue(param.schema),
          description: param.description,
          disabled: !param.required
        }));
      
      if (queryParams.length > 0) {
        item.request.url.query = queryParams;
      }
    }

    // Add request body for POST/PUT/PATCH
    if (['POST', 'PUT', 'PATCH'].includes(method) && spec.requestBody) {
      const schema = spec.requestBody.content?.['application/json']?.schema;
      if (schema) {
        item.request.body = {
          mode: 'raw',
          raw: JSON.stringify(this.generateExampleFromSchema(schema), null, 2),
          options: {
            raw: {
              language: 'json'
            }
          }
        };
      }
    }

    // Add tests
    item.event.push({
      listen: 'test',
      script: {
        type: 'text/javascript',
        exec: this.generateTests(spec)
      }
    });

    // Add pre-request script for specific endpoints
    if (this.needsPreRequestScript(path, method)) {
      item.event.push({
        listen: 'prerequest',
        script: {
          type: 'text/javascript',
          exec: this.generatePreRequestScript(path, method)
        }
      });
    }

    return item;
  }

  generateTests(spec) {
    const tests = [
      '// Endpoint-specific tests',
      `pm.test("Status code is ${this.getExpectedStatusCode(spec)}", function () {`,
      `    pm.response.to.have.status(${this.getExpectedStatusCode(spec)});`,
      '});'
    ];

    // Add response schema validation
    if (spec.responses) {
      const successResponse = spec.responses['200'] || spec.responses['201'];
      if (successResponse?.content?.['application/json']?.schema) {
        tests.push(
          '',
          'pm.test("Response has valid schema", function () {',
          '    const responseJson = pm.response.json();',
          '    pm.expect(responseJson).to.be.an("object");',
          '});'
        );
      }
    }

    // Add variable extraction for auth endpoints
    if (spec.tags?.includes('Authentication')) {
      tests.push(
        '',
        '// Extract auth token',
        'if (pm.response.code === 200 || pm.response.code === 201) {',
        '    const response = pm.response.json();',
        '    if (response.data && response.data.token) {',
        '        pm.collectionVariables.set("auth_token", response.data.token);',
        '        console.log("Auth token updated");',
        '    }',
        '    if (response.data && response.data.user && response.data.user.id) {',
        '        pm.collectionVariables.set("user_id", response.data.user.id);',
        '        console.log("User ID updated");',
        '    }',
        '}'
      );
    }

    return tests;
  }

  generatePreRequestScript(path, method) {
    const scripts = [];

    // Add dynamic data generation
    if (method === 'POST' && path.includes('/register')) {
      scripts.push(
        '// Generate dynamic registration data',
        'const timestamp = Date.now();',
        'pm.globals.set("dynamic_email", `test${timestamp}@example.com`);',
        'pm.globals.set("dynamic_phone", `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`);'
      );
    }

    return scripts;
  }

  addWorkflows() {
    // Add complete user workflow
    const userWorkflow = {
      name: 'Complete User Workflow',
      item: [
        {
          name: 'Step 1: Register User',
          request: {
            method: 'POST',
            header: [
              {
                key: 'Content-Type',
                value: 'application/json'
              }
            ],
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                email: '{{dynamic_email}}',
                password: 'TestPassword123!',
                first_name: 'Test',
                last_name: 'User',
                phone: '{{dynamic_phone}}'
              }, null, 2)
            },
            url: {
              raw: '{{base_url}}/api/auth/register',
              host: ['{{base_url}}'],
              path: ['api', 'auth', 'register']
            }
          },
          event: [
            {
              listen: 'prerequest',
              script: {
                exec: [
                  'const timestamp = Date.now();',
                  'pm.globals.set("dynamic_email", `workflow${timestamp}@example.com`);',
                  'pm.globals.set("dynamic_phone", `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`);'
                ]
              }
            },
            {
              listen: 'test',
              script: {
                exec: [
                  'pm.test("Registration successful", function () {',
                  '    pm.response.to.have.status(201);',
                  '});',
                  '',
                  'if (pm.response.code === 201) {',
                  '    const response = pm.response.json();',
                  '    pm.collectionVariables.set("workflow_token", response.data.token);',
                  '    pm.collectionVariables.set("workflow_user_id", response.data.user.id);',
                  '    postman.setNextRequest("Step 2: Get User Profile");',
                  '} else {',
                  '    postman.setNextRequest(null);',
                  '}'
                ]
              }
            }
          ]
        },
        {
          name: 'Step 2: Get User Profile',
          request: {
            method: 'GET',
            header: [
              {
                key: 'Authorization',
                value: 'Bearer {{workflow_token}}'
              }
            ],
            url: {
              raw: '{{base_url}}/api/auth/profile',
              host: ['{{base_url}}'],
              path: ['api', 'auth', 'profile']
            }
          },
          event: [
            {
              listen: 'test',
              script: {
                exec: [
                  'pm.test("Profile retrieved successfully", function () {',
                  '    pm.response.to.have.status(200);',
                  '});',
                  '',
                  'pm.test("Profile contains user data", function () {',
                  '    const response = pm.response.json();',
                  '    pm.expect(response.data).to.have.property("id");',
                  '    pm.expect(response.data).to.have.property("email");',
                  '});',
                  '',
                  'postman.setNextRequest("Step 3: Update User Profile");'
                ]
              }
            }
          ]
        },
        {
          name: 'Step 3: Update User Profile',
          request: {
            method: 'PUT',
            header: [
              {
                key: 'Authorization',
                value: 'Bearer {{workflow_token}}'
              },
              {
                key: 'Content-Type',
                value: 'application/json'
              }
            ],
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                first_name: 'Updated',
                last_name: 'User'
              }, null, 2)
            },
            url: {
              raw: '{{base_url}}/api/users/{{workflow_user_id}}',
              host: ['{{base_url}}'],
              path: ['api', 'users', '{{workflow_user_id}}']
            }
          },
          event: [
            {
              listen: 'test',
              script: {
                exec: [
                  'pm.test("Profile updated successfully", function () {',
                  '    pm.response.to.have.status(200);',
                  '});',
                  '',
                  'console.log("User workflow completed successfully!");',
                  'postman.setNextRequest(null);'
                ]
              }
            }
          ]
        }
      ],
      description: 'Complete user registration, profile retrieval, and update workflow'
    };

    this.collection.item.push(userWorkflow);
  }

  addEnvironmentSetup() {
    const setupFolder = {
      name: 'Environment Setup',
      item: [
        {
          name: 'Health Check',
          request: {
            method: 'GET',
            header: [],
            url: {
              raw: '{{base_url}}/health',
              host: ['{{base_url}}'],
              path: ['health']
            }
          },
          event: [
            {
              listen: 'test',
              script: {
                exec: [
                  'pm.test("API is healthy", function () {',
                  '    pm.response.to.have.status(200);',
                  '});',
                  '',
                  'pm.test("Database is connected", function () {',
                  '    const response = pm.response.json();',
                  '    pm.expect(response.status).to.eql("healthy");',
                  '});'
                ]
              }
            }
          ]
        },
        {
          name: 'Clear All Variables',
          request: {
            method: 'GET',
            header: [],
            url: {
              raw: '{{base_url}}/health',
              host: ['{{base_url}}'],
              path: ['health']
            }
          },
          event: [
            {
              listen: 'test',
              script: {
                exec: [
                  '// Clear all collection variables',
                  'pm.collectionVariables.clear();',
                  'console.log("All collection variables cleared");'
                ]
              }
            }
          ]
        }
      ],
      description: 'Environment setup and cleanup utilities'
    };

    this.collection.item.unshift(setupFolder);
  }

  async writeCollection() {
    const outputPath = path.join(__dirname, '../SIMS_Backend_API_Enhanced.postman_collection.json');
    await fs.writeFile(outputPath, JSON.stringify(this.collection, null, 2));
    logger.info(`Enhanced Postman collection written to: ${outputPath}`);
  }

  async generateNewmanTests() {
    const newmanConfig = {
      collection: './SIMS_Backend_API_Enhanced.postman_collection.json',
      environment: './environments/development.postman_environment.json',
      reporters: ['cli', 'json', 'html'],
      reporter: {
        html: {
          export: './test-results/newman-report.html'
        },
        json: {
          export: './test-results/newman-report.json'
        }
      },
      iterationCount: 1,
      delayRequest: 100,
      timeout: 30000,
      timeoutRequest: 10000,
      timeoutScript: 5000
    };

    const newmanScript = `
#!/usr/bin/env node

/**
 * Newman Test Runner
 * Automated API testing with comprehensive reporting
 */

const newman = require('newman');
const path = require('path');
const fs = require('fs');

// Ensure test results directory exists
const resultsDir = path.join(__dirname, '../test-results');
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir, { recursive: true });
}

newman.run(${JSON.stringify(newmanConfig, null, 2)}, function (err) {
  if (err) {
    console.error('Newman run failed:', err);
    process.exit(1);
  }
  console.log('Newman run completed successfully!');
});
`;

    await fs.writeFile(
      path.join(__dirname, '../scripts/run-newman-tests.js'),
      newmanScript
    );

    // Generate development environment
    const devEnvironment = {
      id: 'dev-environment',
      name: 'Development Environment',
      values: [
        {
          key: 'base_url',
          value: 'http://localhost:3000',
          enabled: true
        },
        {
          key: 'auth_token',
          value: '',
          enabled: true
        }
      ]
    };

    const envDir = path.join(__dirname, '../environments');
    await fs.mkdir(envDir, { recursive: true });
    await fs.writeFile(
      path.join(envDir, 'development.postman_environment.json'),
      JSON.stringify(devEnvironment, null, 2)
    );
  }

  // Helper methods
  getExampleValue(schema) {
    if (schema.example) return schema.example;
    if (schema.default) return schema.default;
    
    switch (schema.type) {
      case 'string':
        if (schema.format === 'email') return 'test@example.com';
        if (schema.format === 'uuid') return '{{$randomUUID}}';
        if (schema.format === 'date') return '{{$isoTimestamp}}';
        return 'example';
      case 'integer':
        return 1;
      case 'boolean':
        return true;
      case 'array':
        return [];
      case 'object':
        return {};
      default:
        return '';
    }
  }

  generateExampleFromSchema(schema) {
    if (schema.example) return schema.example;
    
    if (schema.type === 'object' && schema.properties) {
      const example = {};
      Object.entries(schema.properties).forEach(([key, prop]) => {
        example[key] = this.getExampleValue(prop);
      });
      return example;
    }
    
    return this.getExampleValue(schema);
  }

  getExpectedStatusCode(spec) {
    if (spec.responses['200']) return 200;
    if (spec.responses['201']) return 201;
    if (spec.responses['204']) return 204;
    return 200;
  }

  needsPreRequestScript(path, method) {
    return (method === 'POST' && path.includes('/register')) ||
           (method === 'POST' && path.includes('/login'));
  }
}

// Generate collection if run directly
if (require.main === module) {
  const generator = new PostmanCollectionGenerator();
  generator.generate().catch(console.error);
}

module.exports = PostmanCollectionGenerator;