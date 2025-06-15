#!/usr/bin/env node

/**
 * Performance monitoring script for Certificate Verification System
 * This script processes performance data from Redis and generates reports
 */

const { createClient } = require('redis');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  outputDir: './performance-reports',
  batchSize: 100,
  processingInterval: 5000, // 5 seconds
  retentionPeriod: 30, // days
};

// Create output directory if it doesn't exist
if (!fs.existsSync(config.outputDir)) {
  fs.mkdirSync(config.outputDir, { recursive: true });
}

// Get current date for report naming
const date = new Date().toISOString().split('T')[0];
const reportDir = path.join(config.outputDir, date);
if (!fs.existsSync(reportDir)) {
  fs.mkdirSync(reportDir, { recursive: true });
}

// Initialize Redis client
async function initRedis() {
  const client = createClient({
    url: config.redisUrl,
  });
  
  client.on('error', (err) => console.error('Redis Client Error', err));
  
  await client.connect();
  return client;
}

// Process performance data from Redis
async function processPerformanceData(redis) {
  console.log('Processing performance data from Redis...');
  
  // Get batch of keys from the queue
  const keys = await redis.lRange('perf:queue', 0, config.batchSize - 1);
  
  if (keys.length === 0) {
    console.log('No performance data to process');
    return 0;
  }
  
  console.log(`Processing ${keys.length} performance entries`);
  
  // Group data by session ID
  const sessionData = {};
  
  // Process each key
  for (const key of keys) {
    try {
      // Get data from Redis
      const data = await redis.get(key);
      if (!data) continue;
      
      const perfData = JSON.parse(data);
      const sessionId = perfData.sessionId;
      
      // Initialize session data if needed
      if (!sessionData[sessionId]) {
        sessionData[sessionId] = {
          sessionId,
          url: perfData.url,
          userAgent: perfData.userAgent,
          environment: perfData.environment,
          appVersion: perfData.appVersion,
          startTime: Date.now(),
          metrics: {
            ttfb: [],
            fcp: [],
            lcp: [],
            fid: [],
            cls: [],
            inp: [],
            navigation: [],
            resource: [],
            custom: [],
          },
        };
      }
      
      // Add metrics to session data
      if (perfData.metrics && Array.isArray(perfData.metrics)) {
        perfData.metrics.forEach((metric) => {
          if (sessionData[sessionId].metrics[metric.type]) {
            sessionData[sessionId].metrics[metric.type].push({
              value: metric.value,
              timestamp: metric.timestamp,
              name: metric.name,
              url: metric.url,
            });
          }
        });
      }
      
      // Remove processed key from Redis
      await redis.del(key);
    } catch (error) {
      console.error(`Error processing key ${key}:`, error);
    }
  }
  
  // Remove processed keys from the queue
  if (keys.length > 0) {
    await redis.lTrim('perf:queue', keys.length, -1);
  }
  
  // Save session data to files
  for (const sessionId in sessionData) {
    const sessionFilePath = path.join(reportDir, `session-${sessionId}.json`);
    fs.writeFileSync(sessionFilePath, JSON.stringify(sessionData[sessionId], null, 2));
  }
  
  // Generate summary report
  await generateSummaryReport(sessionData, reportDir);
  
  return keys.length;
}

// Generate a summary report
async function generateSummaryReport(sessionData, reportDir) {
  // Calculate averages for core web vitals
  const coreWebVitals = {
    ttfb: [],
    fcp: [],
    lcp: [],
    fid: [],
    cls: [],
    inp: [],
  };
  
  // Collect all resource timings
  const resourceTimings = [];
  
  // Process session data
  Object.values(sessionData).forEach((session) => {
    // Process core web vitals
    Object.keys(coreWebVitals).forEach((metric) => {
      if (session.metrics[metric] && session.metrics[metric].length > 0) {
        // For CLS, use the last value as it's cumulative
        if (metric === 'cls') {
          const lastCls = session.metrics[metric][session.metrics[metric].length - 1];
          coreWebVitals[metric].push(lastCls.value);
        } else {
          // For other metrics, use all values
          session.metrics[metric].forEach((m) => {
            coreWebVitals[metric].push(m.value);
          });
        }
      }
    });
    
    // Process resource timings
    if (session.metrics.resource && session.metrics.resource.length > 0) {
      session.metrics.resource.forEach((resource) => {
        resourceTimings.push(resource);
      });
    }
  });
  
  // Calculate averages
  const averages = {};
  Object.keys(coreWebVitals).forEach((metric) => {
    if (coreWebVitals[metric].length > 0) {
      const sum = coreWebVitals[metric].reduce((a, b) => a + b, 0);
      averages[metric] = sum / coreWebVitals[metric].length;
    } else {
      averages[metric] = 'N/A';
    }
  });
  
  // Group resource timings by type
  const resourcesByType = {};
  resourceTimings.forEach((resource) => {
    const type = resource.value.initiatorType || 'unknown';
    if (!resourcesByType[type]) {
      resourcesByType[type] = [];
    }
    resourcesByType[type].push(resource.value);
  });
  
  // Calculate resource averages by type
  const resourceAverages = {};
  Object.keys(resourcesByType).forEach((type) => {
    const resources = resourcesByType[type];
    const count = resources.length;
    const totalDuration = resources.reduce((sum, r) => sum + r.duration, 0);
    const totalSize = resources.reduce((sum, r) => sum + (r.size || 0), 0);
    
    resourceAverages[type] = {
      count,
      averageDuration: totalDuration / count,
      averageSize: totalSize / count,
      totalSize,
    };
  });
  
  // Create summary report
  const summary = {
    date,
    sessionCount: Object.keys(sessionData).length,
    coreWebVitals: {
      averages,
      sampleCounts: {
        ttfb: coreWebVitals.ttfb.length,
        fcp: coreWebVitals.fcp.length,
        lcp: coreWebVitals.lcp.length,
        fid: coreWebVitals.fid.length,
        cls: coreWebVitals.cls.length,
        inp: coreWebVitals.inp.length,
      },
    },
    resources: resourceAverages,
  };
  
  // Save summary report
  const summaryPath = path.join(reportDir, 'summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  
  // Generate markdown report
  const markdownPath = path.join(reportDir, 'summary.md');
  let markdown = `# Performance Summary - ${date}\n\n`;
  
  // Add core web vitals section
  markdown += '## Core Web Vitals\n\n';
  markdown += '| Metric | Average | Sample Count |\n';
  markdown += '| ------ | ------- | ------------ |\n';
  markdown += `| TTFB | ${typeof averages.ttfb === 'number' ? `${averages.ttfb.toFixed(2)}ms` : averages.ttfb} | ${coreWebVitals.ttfb.length} |\n`;
  markdown += `| FCP | ${typeof averages.fcp === 'number' ? `${averages.fcp.toFixed(2)}ms` : averages.fcp} | ${coreWebVitals.fcp.length} |\n`;
  markdown += `| LCP | ${typeof averages.lcp === 'number' ? `${averages.lcp.toFixed(2)}ms` : averages.lcp} | ${coreWebVitals.lcp.length} |\n`;
  markdown += `| FID | ${typeof averages.fid === 'number' ? `${averages.fid.toFixed(2)}ms` : averages.fid} | ${coreWebVitals.fid.length} |\n`;
  markdown += `| CLS | ${typeof averages.cls === 'number' ? averages.cls.toFixed(4) : averages.cls} | ${coreWebVitals.cls.length} |\n`;
  markdown += `| INP | ${typeof averages.inp === 'number' ? `${averages.inp.toFixed(2)}ms` : averages.inp} | ${coreWebVitals.inp.length} |\n`;
  
  // Add resource section
  markdown += '\n## Resource Performance\n\n';
  markdown += '| Resource Type | Count | Avg Duration | Avg Size | Total Size |\n';
  markdown += '| ------------- | ----- | ------------ | -------- | ---------- |\n';
  
  Object.keys(resourceAverages).forEach((type) => {
    const avg = resourceAverages[type];
    markdown += `| ${type} | ${avg.count} | ${avg.averageDuration.toFixed(2)}ms | ${(avg.averageSize / 1024).toFixed(2)}KB | ${(avg.totalSize / 1024).toFixed(2)}KB |\n`;
  });
  
  // Add recommendations
  markdown += '\n## Recommendations\n\n';
  
  // LCP recommendations
  if (typeof averages.lcp === 'number') {
    if (averages.lcp > 2500) {
      markdown += '### Largest Contentful Paint (LCP)\n\n';
      markdown += `Current average: ${averages.lcp.toFixed(2)}ms (Target: < 2500ms)\n\n`;
      markdown += '- Optimize and preload critical resources\n';
      markdown += '- Implement better image optimization and lazy loading\n';
      markdown += '- Consider using a CDN for static assets\n';
      markdown += '- Reduce JavaScript execution time\n';
    }
  }
  
  // FID recommendations
  if (typeof averages.fid === 'number') {
    if (averages.fid > 100) {
      markdown += '\n### First Input Delay (FID)\n\n';
      markdown += `Current average: ${averages.fid.toFixed(2)}ms (Target: < 100ms)\n\n`;
      markdown += '- Break up long tasks\n';
      markdown += '- Optimize JavaScript execution\n';
      markdown += '- Reduce JavaScript bundle size\n';
      markdown += '- Implement better code splitting\n';
    }
  }
  
  // CLS recommendations
  if (typeof averages.cls === 'number') {
    if (averages.cls > 0.1) {
      markdown += '\n### Cumulative Layout Shift (CLS)\n\n';
      markdown += `Current average: ${averages.cls.toFixed(4)} (Target: < 0.1)\n\n`;
      markdown += '- Set explicit width and height for images and videos\n';
      markdown += '- Avoid inserting content above existing content\n';
      markdown += '- Ensure web fonts don\'t cause layout shifts\n';
      markdown += '- Reserve space for dynamic content\n';
    }
  }
  
  // Resource recommendations
  const largeResourceTypes = Object.keys(resourceAverages).filter(
    (type) => resourceAverages[type].averageSize > 100 * 1024 // > 100KB
  );
  
  if (largeResourceTypes.length > 0) {
    markdown += '\n### Resource Optimization\n\n';
    largeResourceTypes.forEach((type) => {
      const avg = resourceAverages[type];
      markdown += `- Optimize ${type} resources (Avg size: ${(avg.averageSize / 1024).toFixed(2)}KB)\n`;
    });
    markdown += '  - Implement better compression\n';
    markdown += '  - Consider lazy loading non-critical resources\n';
    markdown += '  - Use modern image formats (WebP, AVIF)\n';
    markdown += '  - Implement HTTP/2 or HTTP/3\n';
  }
  
  fs.writeFileSync(markdownPath, markdown);
  
  console.log(`Summary reports generated at ${reportDir}`);
}

// Clean up old reports
async function cleanupOldReports() {
  const dirs = fs.readdirSync(config.outputDir)
    .filter(dir => /^\d{4}-\d{2}-\d{2}$/.test(dir))
    .map(dir => ({
      name: dir,
      path: path.join(config.outputDir, dir),
      date: new Date(dir),
    }))
    .sort((a, b) => b.date - a.date);
  
  // Keep only the last N days of reports
  if (dirs.length > config.retentionPeriod) {
    const dirsToDelete = dirs.slice(config.retentionPeriod);
    dirsToDelete.forEach(dir => {
      try {
        fs.rmSync(dir.path, { recursive: true, force: true });
        console.log(`Deleted old report directory: ${dir.name}`);
      } catch (error) {
        console.error(`Error deleting directory ${dir.path}:`, error);
      }
    });
  }
}

// Main function
async function main() {
  console.log('=== Certificate Verification System Performance Monitor ===');
  console.log(`Starting at ${new Date().toLocaleString()}`);
  console.log(`Redis URL: ${config.redisUrl}`);
  console.log(`Output directory: ${config.outputDir}`);
  console.log('----------------------------------------');
  
  // Initialize Redis client
  const redis = await initRedis();
  
  // Clean up old reports
  await cleanupOldReports();
  
  // Process performance data periodically
  let running = true;
  
  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('Shutting down...');
    running = false;
    await redis.quit();
    process.exit(0);
  });
  
  // Main processing loop
  while (running) {
    try {
      const processedCount = await processPerformanceData(redis);
      
      if (processedCount === 0) {
        // If no data was processed, wait longer
        await new Promise(resolve => setTimeout(resolve, config.processingInterval * 2));
      } else {
        // Wait for the next processing interval
        await new Promise(resolve => setTimeout(resolve, config.processingInterval));
      }
    } catch (error) {
      console.error('Error in processing loop:', error);
      await new Promise(resolve => setTimeout(resolve, config.processingInterval));
    }
  }
}

// Run the main function
main().catch(error => {
  console.error('Error running performance monitor:', error);
  process.exit(1);
});