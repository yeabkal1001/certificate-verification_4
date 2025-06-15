import http from 'k6/http';
import { sleep, check } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';
import { randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

// Custom metrics
const verificationRequests = new Counter('verification_requests');
const failedVerifications = new Counter('failed_verifications');
const verificationDuration = new Trend('verification_duration');
const errorRate = new Rate('error_rate');

// Test configuration
export const options = {
  scenarios: {
    // Scenario 1: Constant load
    constant_load: {
      executor: 'constant-vus',
      vus: 50,
      duration: '2m',
      tags: { scenario: 'constant_load' },
    },
    // Scenario 2: Ramp-up load
    ramp_up: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 50 },
        { duration: '1m', target: 100 },
        { duration: '30s', target: 0 },
      ],
      startTime: '2m',
      tags: { scenario: 'ramp_up' },
    },
    // Scenario 3: Spike test
    spike: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 0 },
        { duration: '10s', target: 200 },
        { duration: '30s', target: 200 },
        { duration: '10s', target: 0 },
      ],
      startTime: '4m',
      tags: { scenario: 'spike' },
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    'verification_duration': ['p(95)<1000'], // 95% of verifications should be below 1s
    'error_rate': ['rate<0.1'], // Error rate should be below 10%
  },
};

// Sample certificate IDs for testing
const validCertificateIds = [
  'CERT-2024-001',
  'CERT-2024-002',
  'CERT-2024-003',
  'CERT-2024-004',
  'CERT-2024-005',
];

const invalidCertificateIds = [
  'INVALID-001',
  'FAKE-CERT-123',
  'NOT-A-CERT',
  'CERT-0000-000',
  'TEST-CERT-999',
];

// Helper function to get a random certificate ID
function getRandomCertificateId(valid = true) {
  const array = valid ? validCertificateIds : invalidCertificateIds;
  return array[Math.floor(Math.random() * array.length)];
}

// Main test function
export default function() {
  // Randomly choose between valid and invalid certificate (80% valid, 20% invalid)
  const useValidCert = Math.random() < 0.8;
  const certId = getRandomCertificateId(useValidCert);
  
  // Start timing
  const startTime = new Date();
  
  // Make API request to verify certificate
  const response = http.post(`${__ENV.API_URL || 'http://localhost:3000'}/api/certificates/verify`, 
    JSON.stringify({ certificateId: certId }),
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
  
  // End timing and record duration
  const duration = new Date() - startTime;
  verificationDuration.add(duration);
  verificationRequests.add(1);
  
  // Check response
  const success = check(response, {
    'status is 200': (r) => r.status === 200,
    'response has expected structure': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.hasOwnProperty('valid') && body.hasOwnProperty('certificate');
      } catch (e) {
        return false;
      }
    },
    'verification result matches expectation': (r) => {
      try {
        const body = JSON.parse(r.body);
        return useValidCert ? body.valid === true : body.valid === false;
      } catch (e) {
        return false;
      }
    },
  });
  
  if (!success) {
    failedVerifications.add(1);
    errorRate.add(1);
  } else {
    errorRate.add(0);
  }
  
  // Random sleep between requests to simulate real user behavior
  sleep(randomIntBetween(1, 5));
}