#!/usr/bin/env node

/**
 * Lighthouse audit script for Certificate Verification System
 * This script runs Lighthouse audits on key pages and generates reports
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Configuration
const config = {
  baseUrl: process.env.AUDIT_URL || 'http://localhost:3000',
  outputDir: './lighthouse-reports',
  routes: [
    '/',
    '/verify',
    '/dashboard',
    '/certificate-generator',
    '/auth/login',
  ],
  categories: ['performance', 'accessibility', 'best-practices', 'seo'],
  devices: ['mobile', 'desktop'],
  runs: 3, // Number of runs per page for more reliable results
};

// Create output directory if it doesn't exist
if (!fs.existsSync(config.outputDir)) {
  fs.mkdirSync(config.outputDir, { recursive: true });
}

// Get current date for report naming
const date = new Date().toISOString().split('T')[0];

// Check if Lighthouse CLI is installed
try {
  execSync('lighthouse --version', { stdio: 'ignore' });
} catch (error) {
  console.error('Lighthouse CLI is not installed. Please install it globally:');
  console.error('pnpm install -g lighthouse');
  process.exit(1);
}

// Function to run Lighthouse audit
async function runLighthouseAudit(url, device, categories, outputPath) {
  console.log(`Running Lighthouse audit for ${url} on ${device}...`);
  
  const categoryParams = categories.map(cat => `--only-categories=${cat}`).join(' ');
  const command = `lighthouse ${url} --output=json,html --output-path=${outputPath} --emulated-form-factor=${device} ${categoryParams} --chrome-flags="--headless --no-sandbox --disable-gpu"`;
  
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`Audit completed for ${url} on ${device}`);
    return true;
  } catch (error) {
    console.error(`Error running audit for ${url} on ${device}:`, error.message);
    return false;
  }
}

// Function to parse and aggregate results
function aggregateResults(outputDir) {
  const results = {
    performance: {},
    accessibility: {},
    'best-practices': {},
    seo: {},
  };
  
  // Find all JSON reports
  const jsonReports = fs.readdirSync(outputDir)
    .filter(file => file.endsWith('.json'))
    .map(file => path.join(outputDir, file));
  
  // Parse each report and aggregate scores
  jsonReports.forEach(reportPath => {
    try {
      const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
      const url = new URL(report.requestedUrl).pathname || '/';
      const device = report.configSettings.emulatedFormFactor;
      const categories = report.categories;
      
      // Initialize results for this URL and device if needed
      Object.keys(results).forEach(category => {
        if (!results[category][url]) {
          results[category][url] = { mobile: [], desktop: [] };
        }
      });
      
      // Add scores to the appropriate arrays
      Object.keys(categories).forEach(category => {
        if (results[category]) {
          results[category][url][device].push(categories[category].score * 100);
        }
      });
    } catch (error) {
      console.error(`Error parsing report ${reportPath}:`, error.message);
    }
  });
  
  // Calculate averages
  Object.keys(results).forEach(category => {
    Object.keys(results[category]).forEach(url => {
      ['mobile', 'desktop'].forEach(device => {
        const scores = results[category][url][device];
        if (scores.length > 0) {
          const sum = scores.reduce((a, b) => a + b, 0);
          results[category][url][device] = Math.round(sum / scores.length);
        } else {
          results[category][url][device] = 'N/A';
        }
      });
    });
  });
  
  return results;
}

// Function to generate a summary report
function generateSummaryReport(results, outputDir) {
  const summaryPath = path.join(outputDir, `summary-${date}.md`);
  
  let markdown = `# Lighthouse Audit Summary - ${date}\n\n`;
  
  // Add performance summary table
  markdown += '## Performance Summary\n\n';
  markdown += '| Page | Mobile | Desktop |\n';
  markdown += '| ---- | ------ | ------- |\n';
  
  Object.keys(results.performance).forEach(url => {
    const mobile = results.performance[url].mobile;
    const desktop = results.performance[url].desktop;
    markdown += `| ${url} | ${mobile} | ${desktop} |\n`;
  });
  
  // Add accessibility summary table
  markdown += '\n## Accessibility Summary\n\n';
  markdown += '| Page | Mobile | Desktop |\n';
  markdown += '| ---- | ------ | ------- |\n';
  
  Object.keys(results.accessibility).forEach(url => {
    const mobile = results.accessibility[url].mobile;
    const desktop = results.accessibility[url].desktop;
    markdown += `| ${url} | ${mobile} | ${desktop} |\n`;
  });
  
  // Add best practices summary table
  markdown += '\n## Best Practices Summary\n\n';
  markdown += '| Page | Mobile | Desktop |\n';
  markdown += '| ---- | ------ | ------- |\n';
  
  Object.keys(results['best-practices']).forEach(url => {
    const mobile = results['best-practices'][url].mobile;
    const desktop = results['best-practices'][url].desktop;
    markdown += `| ${url} | ${mobile} | ${desktop} |\n`;
  });
  
  // Add SEO summary table
  markdown += '\n## SEO Summary\n\n';
  markdown += '| Page | Mobile | Desktop |\n';
  markdown += '| ---- | ------ | ------- |\n';
  
  Object.keys(results.seo).forEach(url => {
    const mobile = results.seo[url].mobile;
    const desktop = results.seo[url].desktop;
    markdown += `| ${url} | ${mobile} | ${desktop} |\n`;
  });
  
  // Add recommendations
  markdown += '\n## Recommendations\n\n';
  markdown += 'Based on the audit results, consider the following improvements:\n\n';
  
  // Performance recommendations
  const lowPerformancePages = Object.keys(results.performance).filter(url => {
    return results.performance[url].mobile < 90 || results.performance[url].desktop < 90;
  });
  
  if (lowPerformancePages.length > 0) {
    markdown += '### Performance Improvements\n\n';
    lowPerformancePages.forEach(url => {
      markdown += `- Optimize ${url} page (Mobile: ${results.performance[url].mobile}, Desktop: ${results.performance[url].desktop})\n`;
    });
    markdown += '  - Consider lazy loading more components\n';
    markdown += '  - Optimize and compress images further\n';
    markdown += '  - Reduce JavaScript bundle size\n';
    markdown += '  - Implement better code splitting\n';
  }
  
  // Accessibility recommendations
  const lowAccessibilityPages = Object.keys(results.accessibility).filter(url => {
    return results.accessibility[url].mobile < 90 || results.accessibility[url].desktop < 90;
  });
  
  if (lowAccessibilityPages.length > 0) {
    markdown += '\n### Accessibility Improvements\n\n';
    lowAccessibilityPages.forEach(url => {
      markdown += `- Improve accessibility on ${url} page (Mobile: ${results.accessibility[url].mobile}, Desktop: ${results.accessibility[url].desktop})\n`;
    });
    markdown += '  - Ensure proper contrast ratios\n';
    markdown += '  - Add missing ARIA attributes\n';
    markdown += '  - Improve keyboard navigation\n';
    markdown += '  - Add proper alt text to images\n';
  }
  
  fs.writeFileSync(summaryPath, markdown);
  console.log(`Summary report generated at ${summaryPath}`);
}

// Main function to run audits
async function main() {
  console.log('=== Certificate Verification System Lighthouse Audit ===');
  console.log(`Starting audits at ${new Date().toLocaleString()}`);
  console.log(`Base URL: ${config.baseUrl}`);
  console.log(`Output directory: ${config.outputDir}`);
  console.log('----------------------------------------');
  
  // Create a subdirectory for this run
  const runDir = path.join(config.outputDir, date);
  if (!fs.existsSync(runDir)) {
    fs.mkdirSync(runDir, { recursive: true });
  }
  
  // Run audits for each route and device
  for (const route of config.routes) {
    const url = `${config.baseUrl}${route}`;
    
    for (const device of config.devices) {
      for (let run = 1; run <= config.runs; run++) {
        const outputPath = path.join(runDir, `${route.replace(/\//g, '-') || 'home'}-${device}-run${run}`);
        await runLighthouseAudit(url, device, config.categories, outputPath);
      }
    }
  }
  
  // Aggregate results and generate summary
  console.log('----------------------------------------');
  console.log('Aggregating results and generating summary...');
  const results = aggregateResults(runDir);
  generateSummaryReport(results, config.outputDir);
  
  console.log('----------------------------------------');
  console.log(`Audits completed at ${new Date().toLocaleString()}`);
}

// Run the main function
main().catch(error => {
  console.error('Error running Lighthouse audits:', error);
  process.exit(1);
});