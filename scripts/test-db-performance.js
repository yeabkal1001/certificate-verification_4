#!/usr/bin/env node

/**
 * Script to test database performance
 * This script runs various database operations and measures their performance
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { performance } = require('perf_hooks');

// Create Prisma client
const prisma = new PrismaClient();

// Number of iterations for each test
const ITERATIONS = process.env.TEST_ITERATIONS ? parseInt(process.env.TEST_ITERATIONS, 10) : 100;

// Test database operations
const tests = [
  {
    name: 'Find all certificates',
    run: async () => {
      return prisma.certificate.findMany({
        take: 10,
        orderBy: { issueDate: 'desc' },
      });
    },
  },
  {
    name: 'Find certificate by ID',
    run: async () => {
      // Get a random certificate ID first
      const certificates = await prisma.certificate.findMany({
        select: { id: true },
        take: 1,
      });
      
      if (certificates.length === 0) {
        console.warn('No certificates found for testing');
        return null;
      }
      
      return prisma.certificate.findUnique({
        where: { id: certificates[0].id },
        include: {
          recipient: true,
          issuer: true,
          template: true,
        },
      });
    },
  },
  {
    name: 'Find certificates with filtering',
    run: async () => {
      return prisma.certificate.findMany({
        where: {
          status: 'ACTIVE',
        },
        take: 10,
        orderBy: { issueDate: 'desc' },
      });
    },
  },
  {
    name: 'Count certificates',
    run: async () => {
      return prisma.certificate.count();
    },
  },
  {
    name: 'Find templates with certificates',
    run: async () => {
      return prisma.template.findMany({
        include: {
          certificates: {
            take: 5,
          },
        },
        take: 5,
      });
    },
  },
  {
    name: 'Find users with certificates',
    run: async () => {
      return prisma.user.findMany({
        where: {
          certificates: {
            some: {},
          },
        },
        include: {
          certificates: {
            take: 5,
          },
        },
        take: 5,
      });
    },
  },
  {
    name: 'Complex query with multiple relations',
    run: async () => {
      return prisma.certificate.findMany({
        where: {
          status: 'ACTIVE',
          issueDate: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
        include: {
          recipient: true,
          issuer: true,
          template: true,
          verificationLogs: {
            take: 5,
            orderBy: {
              timestamp: 'desc',
            },
          },
        },
        take: 10,
        orderBy: {
          issueDate: 'desc',
        },
      });
    },
  },
];

// Run a single test
const runTest = async (test, iterations) => {
  const durations = [];
  
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await test.run();
    const end = performance.now();
    durations.push(end - start);
  }
  
  // Calculate statistics
  const total = durations.reduce((sum, duration) => sum + duration, 0);
  const average = total / durations.length;
  const min = Math.min(...durations);
  const max = Math.max(...durations);
  
  return {
    name: test.name,
    iterations,
    average,
    min,
    max,
    total,
  };
};

// Format duration in milliseconds
const formatDuration = (ms) => {
  return `${ms.toFixed(2)}ms`;
};

// Main function
const main = async () => {
  try {
    console.log(`Starting database performance tests with ${ITERATIONS} iterations each...`);
    
    const results = [];
    
    for (const test of tests) {
      console.log(`Running test: ${test.name}`);
      const result = await runTest(test, ITERATIONS);
      results.push(result);
      
      console.log(`  Average: ${formatDuration(result.average)}`);
      console.log(`  Min: ${formatDuration(result.min)}`);
      console.log(`  Max: ${formatDuration(result.max)}`);
      console.log('');
    }
    
    // Print summary
    console.log('Performance Test Summary:');
    console.log('------------------------');
    
    results.forEach((result) => {
      console.log(`${result.name}:`);
      console.log(`  Average: ${formatDuration(result.average)}`);
      console.log(`  Min: ${formatDuration(result.min)}`);
      console.log(`  Max: ${formatDuration(result.max)}`);
      console.log(`  Total: ${formatDuration(result.total)}`);
      console.log('');
    });
    
    console.log('Database performance tests completed successfully');
  } catch (error) {
    console.error('Database performance tests failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
};

// Run the script
main();