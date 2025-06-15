import http from 'k6/http';
import { sleep, check } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';
import { randomString } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

// Custom metrics
const generationRequests = new Counter('generation_requests');
const failedGenerations = new Counter('failed_generations');
const generationDuration = new Trend('generation_duration');
const errorRate = new Rate('error_rate');

// Test configuration
export const options = {
  scenarios: {
    // Scenario 1: Admin generating certificates
    admin_generation: {
      executor: 'constant-vus',
      vus: 5,
      duration: '3m',
      tags: { scenario: 'admin_generation' },
    },
    // Scenario 2: Bulk certificate generation
    bulk_generation: {
      executor: 'per-vu-iterations',
      vus: 2,
      iterations: 5,
      maxDuration: '5m',
      startTime: '3m',
      tags: { scenario: 'bulk_generation' },
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests should be below 2s
    'generation_duration': ['p(95)<5000'], // 95% of generations should be below 5s
    'error_rate': ['rate<0.05'], // Error rate should be below 5%
  },
};

// Sample template IDs for testing
const templateIds = [
  'template-001',
  'template-002',
  'template-003',
];

// Helper function to get a random template ID
function getRandomTemplateId() {
  return templateIds[Math.floor(Math.random() * templateIds.length)];
}

// Helper function to generate random certificate data
function generateCertificateData() {
  return {
    recipientName: `Test User ${randomString(5)}`,
    recipientEmail: `test.${randomString(8)}@example.com`,
    issueDate: new Date().toISOString(),
    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    courseTitle: `Test Course ${randomString(10)}`,
    templateId: getRandomTemplateId(),
    additionalFields: {
      grade: ['A', 'B', 'C', 'A+', 'B+'][Math.floor(Math.random() * 5)],
      credits: Math.floor(Math.random() * 5) + 1,
      instructor: `Dr. ${randomString(8)}`,
    },
  };
}

// Helper function to generate bulk certificate data
function generateBulkCertificateData(count = 50) {
  const certificates = [];
  for (let i = 0; i < count; i++) {
    const data = generateCertificateData();
    certificates.push(data);
  }
  return certificates;
}

// Admin auth token (in real scenario, this would be obtained via login)
const adminToken = 'ADMIN_TOKEN_FOR_TESTING';

// Main test function
export default function() {
  // Determine which scenario we're in
  const isBulkGeneration = __ITER !== undefined && __VU <= 2;
  
  // Start timing
  const startTime = new Date();
  
  let response;
  
  if (isBulkGeneration) {
    // Bulk certificate generation
    const bulkData = generateBulkCertificateData(50);
    response = http.post(`${__ENV.API_URL || 'http://localhost:3000'}/api/certificates/bulk`, 
      JSON.stringify({ certificates: bulkData }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
      }
    );
  } else {
    // Single certificate generation
    const certData = generateCertificateData();
    response = http.post(`${__ENV.API_URL || 'http://localhost:3000'}/api/certificates`, 
      JSON.stringify(certData),
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
      }
    );
  }
  
  // End timing and record duration
  const duration = new Date() - startTime;
  generationDuration.add(duration);
  generationRequests.add(1);
  
  // Check response
  const success = check(response, {
    'status is 201': (r) => r.status === 201,
    'response has expected structure': (r) => {
      try {
        const body = JSON.parse(r.body);
        if (isBulkGeneration) {
          return body.hasOwnProperty('success') && body.hasOwnProperty('count');
        } else {
          return body.hasOwnProperty('id') && body.hasOwnProperty('certificateUrl');
        }
      } catch (e) {
        return false;
      }
    },
  });
  
  if (!success) {
    failedGenerations.add(1);
    errorRate.add(1);
  } else {
    errorRate.add(0);
  }
  
  // Sleep between requests
  sleep(isBulkGeneration ? 10 : 3);
}