import type { NextApiRequest, NextApiResponse } from 'next';
import { withApiHandler } from '@/lib/api-wrapper';
import { logger } from '@/lib/logger';
import redisClient, { cacheUtils } from '@/lib/redis';
import axios from 'axios';
import os from 'os';

// Get instance ID from environment or generate one
const instanceId = process.env.INSTANCE_ID || `instance-${Math.random().toString(36).substring(2, 9)}`;

/**
 * API endpoint to get information about all instances
 * This is useful for monitoring and debugging in a distributed environment
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Only allow GET requests
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Get Redis pool stats
    const redisStats = await cacheUtils.getStats();
    
    // Get system information for this instance
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

    // Try to get information about other instances from Redis
    const instancesKey = 'system:instances';
    
    // Register this instance
    await cacheUtils.set(`${instancesKey}:${instanceId}`, {
      id: instanceId,
      lastSeen: new Date().toISOString(),
      system: systemInfo,
    }, 60); // TTL of 60 seconds
    
    // Get all instances
    const instanceKeys = await redisClient.keys(`${instancesKey}:*`);
    const instances = [];
    
    for (const key of instanceKeys) {
      const instanceData = await cacheUtils.get(key);
      if (instanceData) {
        instances.push(instanceData);
      }
    }
    
    // Return instance information
    res.status(200).json({
      currentInstance: {
        id: instanceId,
        system: systemInfo,
      },
      allInstances: instances,
      redis: redisStats?.pool || {},
    });
  } catch (error) {
    logger.error('Error getting instance information', { error, instanceId });
    
    res.status(500).json({
      error: 'Failed to get instance information',
      message: error.message,
      instance: instanceId,
    });
  }
}

export default withApiHandler(handler);