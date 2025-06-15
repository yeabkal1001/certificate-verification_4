#!/usr/bin/env node

/**
 * Script to apply database optimizations
 * This script applies the database optimizations to the PostgreSQL database:
 * 1. Creates necessary extensions
 * 2. Applies configuration changes
 * 3. Creates indexes
 */

require('dotenv').config();
const { execSync } = require('child_process');
const { PrismaClient } = require('@prisma/client');

// Create Prisma client
const prisma = new PrismaClient();

// Database connection details from DATABASE_URL
const getDatabaseDetails = () => {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  // Parse DATABASE_URL
  const regex = /^postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)(\?.*)?$/;
  const match = url.match(regex);
  
  if (!match) {
    throw new Error('Invalid DATABASE_URL format');
  }
  
  return {
    user: match[1],
    password: match[2],
    host: match[3],
    port: match[4],
    database: match[5],
  };
};

// Execute PostgreSQL command
const executePgCommand = (command) => {
  const { user, password, host, port, database } = getDatabaseDetails();
  
  // Set PGPASSWORD environment variable
  process.env.PGPASSWORD = password;
  
  try {
    // Execute command
    const result = execSync(`psql -U ${user} -h ${host} -p ${port} -d ${database} -c "${command}"`, {
      encoding: 'utf-8',
    });
    
    return result;
  } catch (error) {
    console.error(`Error executing command: ${command}`);
    console.error(error.message);
    throw error;
  } finally {
    // Clear PGPASSWORD for security
    delete process.env.PGPASSWORD;
  }
};

// Create pg_stat_statements extension
const createExtensions = async () => {
  console.log('Creating extensions...');
  
  try {
    executePgCommand('CREATE EXTENSION IF NOT EXISTS pg_stat_statements');
    console.log('  Created pg_stat_statements extension');
  } catch (error) {
    console.error('  Failed to create pg_stat_statements extension');
  }
  
  console.log('Extensions setup completed');
};

// Apply PostgreSQL configuration
const applyConfiguration = async () => {
  console.log('Applying PostgreSQL configuration...');
  
  const configs = [
    `SET work_mem = '${process.env.POSTGRES_WORK_MEM || '4MB'}'`,
    `SET maintenance_work_mem = '${process.env.POSTGRES_MAINTENANCE_WORK_MEM || '64MB'}'`,
    `SET random_page_cost = ${process.env.POSTGRES_RANDOM_PAGE_COST || '1.1'}`,
    `SET effective_io_concurrency = 2`,
    `SET default_statistics_target = ${process.env.POSTGRES_DEFAULT_STATISTICS_TARGET || '100'}`,
  ];
  
  for (const config of configs) {
    try {
      executePgCommand(config);
      console.log(`  Applied: ${config}`);
    } catch (error) {
      console.error(`  Failed to apply: ${config}`);
    }
  }
  
  console.log('PostgreSQL configuration applied');
};

// Create additional indexes
const createIndexes = async () => {
  console.log('Creating additional indexes...');
  
  const indexes = [
    'CREATE INDEX IF NOT EXISTS "Certificate_status_idx" ON "Certificate" (status)',
    'CREATE INDEX IF NOT EXISTS "Certificate_issueDate_idx" ON "Certificate" ("issueDate")',
    'CREATE INDEX IF NOT EXISTS "Certificate_certificateId_idx" ON "Certificate" ("certificateId")',
    'CREATE INDEX IF NOT EXISTS "Certificate_createdAt_idx" ON "Certificate" ("createdAt")',
    'CREATE INDEX IF NOT EXISTS "VerificationLog_timestamp_idx" ON "VerificationLog" (timestamp)',
    'CREATE INDEX IF NOT EXISTS "VerificationLog_isValid_idx" ON "VerificationLog" ("isValid")',
    'CREATE INDEX IF NOT EXISTS "VerificationLog_certificateId_timestamp_idx" ON "VerificationLog" ("certificateId", timestamp)',
    'CREATE INDEX IF NOT EXISTS "AuditLog_action_idx" ON "AuditLog" (action)',
    'CREATE INDEX IF NOT EXISTS "AuditLog_entityId_idx" ON "AuditLog" ("entityId")',
    'CREATE INDEX IF NOT EXISTS "AuditLog_userId_idx" ON "AuditLog" ("userId")',
    'CREATE INDEX IF NOT EXISTS "AuditLog_timestamp_idx" ON "AuditLog" (timestamp)',
  ];
  
  for (const index of indexes) {
    try {
      executePgCommand(index);
      console.log(`  Created index: ${index}`);
    } catch (error) {
      console.error(`  Failed to create index: ${index}`);
    }
  }
  
  console.log('Index creation completed');
};

// Analyze tables
const analyzeTables = async () => {
  console.log('Analyzing tables...');
  
  try {
    executePgCommand('ANALYZE');
    console.log('  Analyzed all tables');
  } catch (error) {
    console.error('  Failed to analyze tables');
  }
  
  console.log('Table analysis completed');
};

// Main function
const main = async () => {
  try {
    console.log('Starting database optimization...');
    
    // Apply optimizations
    await createExtensions();
    await applyConfiguration();
    await createIndexes();
    await analyzeTables();
    
    console.log('Database optimization completed successfully');
  } catch (error) {
    console.error('Database optimization failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
};

// Run the script
main();