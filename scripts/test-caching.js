#!/usr/bin/env node

/**
 * Script to test caching performance
 * This script makes multiple requests to the same endpoint and measures response times
 */

const https = require('https');
const http = require('http');
const { performance } = require('perf_hooks');

// Configuration
const config = {
  host: process.env.TEST_HOST || 'localhost',
  port: process.env.TEST_PORT || 443,
  path: process.env.TEST_PATH || '/api/certificates',
  method: 'GET',
  iterations: parseInt(process.env.TEST_ITERATIONS || '10', 10),
  useHttps: process.env.TEST_USE_HTTPS !== 'false',
  headers: {
    'Accept': 'application/json',
  },
};

// Skip SSL verification for self-signed certificates in development
const requestOptions = {
  host: config.host,
  port: config.port,
  path: config.path,
  method: config.method,
  headers: config.headers,
  rejectUnauthorized: false, // Allow self-signed certificates
};

// Function to make a request and measure time
async function makeRequest() {
  return new Promise((resolve, reject) => {
    const startTime = performance.now();
    
    const req = (config.useHttps ? https : http).request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          duration,
          size: Buffer.byteLength(data, 'utf8'),
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.end();
  });
}

// Main function
async function main() {
  console.log(`Testing caching performance for ${config.method} ${config.host}:${config.port}${config.path}`);
  console.log(`Running ${config.iterations} iterations...\n`);
  
  const results = [];
  
  for (let i = 0; i < config.iterations; i++) {
    try {
      const result = await makeRequest();
      results.push(result);
      
      console.log(`Request ${i + 1}/${config.iterations}:`);
      console.log(`  Status: ${result.statusCode}`);
      console.log(`  Duration: ${result.duration.toFixed(2)}ms`);
      console.log(`  Size: ${(result.size / 1024).toFixed(2)} KB`);
      console.log(`  Cache: ${result.headers['x-cache'] || result.headers['x-cache-status'] || 'N/A'}`);
      console.log('');
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`Error in request ${i + 1}:`, error.message);
    }
  }
  
  // Calculate statistics
  if (results.length > 0) {
    const durations = results.map(r => r.duration);
    const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    const minDuration = Math.min(...durations);
    const maxDuration = Math.max(...durations);
    
    const cacheHits = results.filter(r => 
      (r.headers['x-cache'] === 'HIT') || 
      (r.headers['x-cache-status'] === 'HIT')
    ).length;
    
    const cacheMisses = results.filter(r => 
      (r.headers['x-cache'] === 'MISS') || 
      (r.headers['x-cache-status'] === 'MISS')
    ).length;
    
    console.log('Performance Summary:');
    console.log(`  Average Response Time: ${avgDuration.toFixed(2)}ms`);
    console.log(`  Minimum Response Time: ${minDuration.toFixed(2)}ms`);
    console.log(`  Maximum Response Time: ${maxDuration.toFixed(2)}ms`);
    console.log(`  Cache Hits: ${cacheHits}`);
    console.log(`  Cache Misses: ${cacheMisses}`);
    
    if (cacheHits > 0 && cacheMisses > 0) {
      const hitDurations = results
        .filter(r => 
          (r.headers['x-cache'] === 'HIT') || 
          (r.headers['x-cache-status'] === 'HIT')
        )
        .map(r => r.duration);
      
      const missDurations = results
        .filter(r => 
          (r.headers['x-cache'] === 'MISS') || 
          (r.headers['x-cache-status'] === 'MISS')
        )
        .map(r => r.duration);
      
      const avgHitDuration = hitDurations.reduce((sum, d) => sum + d, 0) / hitDurations.length;
      const avgMissDuration = missDurations.reduce((sum, d) => sum + d, 0) / missDurations.length;
      
      console.log(`  Average Cache Hit Response Time: ${avgHitDuration.toFixed(2)}ms`);
      console.log(`  Average Cache Miss Response Time: ${avgMissDuration.toFixed(2)}ms`);
      console.log(`  Performance Improvement: ${((avgMissDuration - avgHitDuration) / avgMissDuration * 100).toFixed(2)}%`);
    }
  }
}

// Run the test
main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});