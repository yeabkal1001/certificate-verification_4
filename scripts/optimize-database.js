#!/usr/bin/env node

/**
 * Script to optimize the database
 * This script performs various database optimizations:
 * 1. Analyzes tables to update statistics
 * 2. Vacuums tables to reclaim space
 * 3. Reindexes tables to optimize indexes
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

// Get all tables in the database
const getTables = async () => {
  const result = await prisma.$queryRaw`
    SELECT tablename
    FROM pg_catalog.pg_tables
    WHERE schemaname = 'public'
  `;
  
  return result.map(row => row.tablename);
};

// Analyze tables to update statistics
const analyzeTables = async (tables) => {
  console.log('Analyzing tables...');
  
  for (const table of tables) {
    console.log(`  Analyzing table: ${table}`);
    try {
      executePgCommand(`ANALYZE ${table}`);
    } catch (error) {
      console.error(`  Failed to analyze table: ${table}`);
    }
  }
  
  console.log('Table analysis completed');
};

// Vacuum tables to reclaim space
const vacuumTables = async (tables) => {
  console.log('Vacuuming tables...');
  
  for (const table of tables) {
    console.log(`  Vacuuming table: ${table}`);
    try {
      executePgCommand(`VACUUM FULL ${table}`);
    } catch (error) {
      console.error(`  Failed to vacuum table: ${table}`);
    }
  }
  
  console.log('Table vacuum completed');
};

// Reindex tables to optimize indexes
const reindexTables = async (tables) => {
  console.log('Reindexing tables...');
  
  for (const table of tables) {
    console.log(`  Reindexing table: ${table}`);
    try {
      executePgCommand(`REINDEX TABLE ${table}`);
    } catch (error) {
      console.error(`  Failed to reindex table: ${table}`);
    }
  }
  
  console.log('Table reindexing completed');
};

// Get database size before optimization
const getDatabaseSize = async () => {
  const result = await prisma.$queryRaw`
    SELECT pg_size_pretty(pg_database_size(current_database())) as size
  `;
  
  return result[0].size;
};

// Main function
const main = async () => {
  try {
    console.log('Starting database optimization...');
    
    // Get database size before optimization
    const sizeBefore = await getDatabaseSize();
    console.log(`Database size before optimization: ${sizeBefore}`);
    
    // Get all tables
    const tables = await getTables();
    console.log(`Found ${tables.length} tables: ${tables.join(', ')}`);
    
    // Perform optimizations
    await analyzeTables(tables);
    await vacuumTables(tables);
    await reindexTables(tables);
    
    // Get database size after optimization
    const sizeAfter = await getDatabaseSize();
    console.log(`Database size after optimization: ${sizeAfter}`);
    
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