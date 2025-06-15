import type { NextApiRequest, NextApiResponse } from 'next';
import { withApiHandler } from '@/lib/api-wrapper';
import { logger } from '@/lib/logger';
import prisma from '@/lib/prisma';
import { cacheUtils } from '@/lib/redis';
import os from 'os';

// Get instance ID from environment or generate one
const instanceId = process.env.INSTANCE_ID || `instance-${Math.random().toString(36).substring(2, 9)}`;

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    // Check Redis connection
    const redisStatus = await cacheUtils.exists('health-check-key');
    
    // Get system information
    const systemInfo = {
      hostname: os.hostname(),
      cpus: os.cpus().length,
      memory: {
        total: Math.round(os.totalmem() / (1024 * 1024)),
        free: Math.round(os.freemem() / (1024 * 1024)),
      },
      uptime: os.uptime(),
      loadAvg: os.loadavg(),
    };
    
    // Get Redis pool stats
    const redisStats = await cacheUtils.getStats();
    
    // Return health status with instance information
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      instance: {
        id: instanceId,
        system: systemInfo,
      },
      services: {
        database: 'up',
        redis: redisStatus !== null ? 'up' : 'unknown',
        api: 'up'
      },
      redis: redisStats?.pool || {},
    });
  } catch (error) {
    logger.error('Health check failed', { error, instanceId });
    
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      instance: {
        id: instanceId,
      },
      services: {
        database: error.message.includes('database') ? 'down' : 'unknown',
        redis: error.message.includes('redis') ? 'down' : 'unknown',
        api: 'up'
      },
      error: error.message
    });
  }
}

export default withApiHandler(handler);