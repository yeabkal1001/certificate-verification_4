import { logger } from './logger';
import prisma from './prisma';
import { metrics } from './metrics';
import { Counter, Histogram } from 'prom-client';

// Create metrics for database performance monitoring
const dbQueryCounter = new Counter({
  name: 'db_query_total',
  help: 'Total number of database queries',
  labelNames: ['model', 'operation'],
});

const dbQueryDuration = new Histogram({
  name: 'db_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['model', 'operation'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
});

const dbErrorCounter = new Counter({
  name: 'db_error_total',
  help: 'Total number of database errors',
  labelNames: ['model', 'operation', 'error_type'],
});

// Register metrics
metrics.registerMetric(dbQueryCounter);
metrics.registerMetric(dbQueryDuration);
metrics.registerMetric(dbErrorCounter);

// Database models to monitor
const models = [
  'user',
  'certificate',
  'template',
  'verificationLog',
  'auditLog',
  'session',
  'account',
];

// Database operations to monitor
const operations = [
  'findUnique',
  'findFirst',
  'findMany',
  'create',
  'update',
  'upsert',
  'delete',
  'count',
  'aggregate',
  'groupBy',
];

// Slow query threshold in milliseconds
const SLOW_QUERY_THRESHOLD = process.env.SLOW_QUERY_THRESHOLD 
  ? parseInt(process.env.SLOW_QUERY_THRESHOLD, 10) 
  : 500;

/**
 * Initialize database monitoring
 * This function wraps Prisma client methods with monitoring code
 */
export function initDbMonitoring() {
  // For each model in Prisma client
  for (const model of models) {
    if (!(model in prisma)) continue;
    
    // For each operation in the model
    for (const operation of operations) {
      if (!(operation in prisma[model])) continue;
      
      // Store the original method
      const originalMethod = prisma[model][operation];
      
      // Replace with monitored version
      prisma[model][operation] = async (...args: any[]) => {
        const startTime = process.hrtime();
        
        // Increment query counter
        dbQueryCounter.inc({ model, operation });
        
        try {
          // Execute the original method
          const result = await originalMethod.apply(prisma[model], args);
          
          // Calculate duration
          const [seconds, nanoseconds] = process.hrtime(startTime);
          const duration = seconds + nanoseconds / 1e9;
          
          // Record query duration
          dbQueryDuration.observe({ model, operation }, duration);
          
          // Log slow queries
          if (duration * 1000 > SLOW_QUERY_THRESHOLD) {
            logger.warn('Slow database query detected', {
              model,
              operation,
              duration: `${(duration * 1000).toFixed(2)}ms`,
              args: JSON.stringify(args),
            });
          }
          
          return result;
        } catch (error) {
          // Record error
          const errorType = error.name || 'UnknownError';
          dbErrorCounter.inc({ model, operation, error_type: errorType });
          
          // Log error
          logger.error('Database query error', {
            model,
            operation,
            error,
            args: JSON.stringify(args),
          });
          
          // Re-throw the error
          throw error;
        }
      };
    }
  }
  
  logger.info('Database monitoring initialized');
}

/**
 * Get database statistics
 * This function queries the database for performance statistics
 */
export async function getDbStats() {
  try {
    // Query PostgreSQL for statistics
    const result = await prisma.$queryRaw`
      SELECT
        (SELECT count(*) FROM pg_stat_activity) AS active_connections,
        pg_database_size(current_database()) AS database_size,
        (SELECT count(*) FROM pg_stat_activity WHERE state = 'active') AS active_queries,
        (SELECT count(*) FROM pg_stat_activity WHERE state = 'idle') AS idle_connections,
        (SELECT extract(epoch FROM now() - pg_postmaster_start_time())) AS uptime_seconds,
        (SELECT sum(seq_scan) FROM pg_stat_user_tables) AS sequential_scans,
        (SELECT sum(idx_scan) FROM pg_stat_user_tables) AS index_scans,
        (SELECT sum(n_tup_ins) FROM pg_stat_user_tables) AS rows_inserted,
        (SELECT sum(n_tup_upd) FROM pg_stat_user_tables) AS rows_updated,
        (SELECT sum(n_tup_del) FROM pg_stat_user_tables) AS rows_deleted,
        (SELECT sum(n_tup_hot_upd) FROM pg_stat_user_tables) AS rows_hot_updated,
        (SELECT sum(n_live_tup) FROM pg_stat_user_tables) AS live_rows,
        (SELECT sum(n_dead_tup) FROM pg_stat_user_tables) AS dead_rows
    `;
    
    return result[0];
  } catch (error) {
    logger.error('Failed to get database statistics', { error });
    return null;
  }
}

/**
 * Get slow queries
 * This function returns the top slow queries from PostgreSQL
 */
export async function getSlowQueries(limit = 10) {
  try {
    // Query PostgreSQL for slow queries (requires pg_stat_statements extension)
    const result = await prisma.$queryRaw`
      SELECT
        query,
        calls,
        total_time / calls AS avg_time,
        rows / calls AS avg_rows,
        100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
      FROM pg_stat_statements
      ORDER BY total_time / calls DESC
      LIMIT ${limit}
    `;
    
    return result;
  } catch (error) {
    logger.error('Failed to get slow queries', { error });
    return [];
  }
}

/**
 * Get table statistics
 * This function returns statistics about database tables
 */
export async function getTableStats() {
  try {
    // Query PostgreSQL for table statistics
    const result = await prisma.$queryRaw`
      SELECT
        schemaname,
        relname AS table_name,
        seq_scan,
        seq_tup_read,
        idx_scan,
        idx_tup_fetch,
        n_tup_ins,
        n_tup_upd,
        n_tup_del,
        n_live_tup,
        n_dead_tup
      FROM pg_stat_user_tables
      ORDER BY n_live_tup DESC
    `;
    
    return result;
  } catch (error) {
    logger.error('Failed to get table statistics', { error });
    return [];
  }
}

/**
 * Get index statistics
 * This function returns statistics about database indexes
 */
export async function getIndexStats() {
  try {
    // Query PostgreSQL for index statistics
    const result = await prisma.$queryRaw`
      SELECT
        schemaname,
        relname AS table_name,
        indexrelname AS index_name,
        idx_scan,
        idx_tup_read,
        idx_tup_fetch
      FROM pg_stat_user_indexes
      ORDER BY idx_scan DESC
    `;
    
    return result;
  } catch (error) {
    logger.error('Failed to get index statistics', { error });
    return [];
  }
}

export default {
  initDbMonitoring,
  getDbStats,
  getSlowQueries,
  getTableStats,
  getIndexStats,
};