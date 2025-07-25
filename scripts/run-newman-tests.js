
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

newman.run({
  "collection": "./SIMS_Backend_API_Enhanced.postman_collection.json",
  "environment": "./environments/development.postman_environment.json",
  "reporters": [
    "cli",
    "json",
    "html"
  ],
  "reporter": {
    "html": {
      "export": "./test-results/newman-report.html"
    },
    "json": {
      "export": "./test-results/newman-report.json"
    }
  },
  "iterationCount": 1,
  "delayRequest": 100,
  "timeout": 30000,
  "timeoutRequest": 10000,
  "timeoutScript": 5000
}, function (err) {
  if (err) {
    console.error('Newman run failed:', err);
    process.exit(1);
  }
  console.log('Newman run completed successfully!');
});
