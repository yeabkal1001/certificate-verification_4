import { PrismaClient } from "@prisma/client";
import { logger } from './logger';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
// Learn more: https://pris.ly/d/help/next-js-best-practices

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Connection pool configuration
const connectionPoolConfig = {
  // Maximum number of connections in the pool
  max_connections: process.env.PRISMA_CONNECTION_LIMIT 
    ? parseInt(process.env.PRISMA_CONNECTION_LIMIT, 10) 
    : 10,
  
  // Maximum idle time for a connection in milliseconds
  connection_timeout: process.env.PRISMA_CONNECTION_TIMEOUT 
    ? parseInt(process.env.PRISMA_CONNECTION_TIMEOUT, 10) 
    : 15000,
  
  // Maximum time to wait for a connection in milliseconds
  pool_timeout: process.env.PRISMA_POOL_TIMEOUT 
    ? parseInt(process.env.PRISMA_POOL_TIMEOUT, 10) 
    : 10000,
  
  // Idle timeout for a connection in milliseconds
  idle_timeout: process.env.PRISMA_IDLE_TIMEOUT 
    ? parseInt(process.env.PRISMA_IDLE_TIMEOUT, 10) 
    : 60000,
};

// Create Prisma client with connection pool configuration
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    // Configure connection pool
    // @ts-ignore - Prisma doesn't expose these options in the type definitions
    __internal: {
      engine: {
        connectionLimit: connectionPoolConfig.max_connections,
        connectionTimeout: connectionPoolConfig.connection_timeout,
        poolTimeout: connectionPoolConfig.pool_timeout,
        idleTimeout: connectionPoolConfig.idle_timeout,
      },
    },
  });

// Log connection pool configuration
logger.info('Prisma connection pool configured', {
  max_connections: connectionPoolConfig.max_connections,
  connection_timeout: connectionPoolConfig.connection_timeout,
  pool_timeout: connectionPoolConfig.pool_timeout,
  idle_timeout: connectionPoolConfig.idle_timeout,
});

// Keep a single instance of Prisma Client in development
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Handle connection events
prisma.$on('query', (e) => {
  if (process.env.LOG_QUERIES === 'true') {
    logger.debug('Prisma query', {
      query: e.query,
      params: e.params,
      duration: `${e.duration}ms`,
    });
  }
});

// Export Prisma client
export default prisma;