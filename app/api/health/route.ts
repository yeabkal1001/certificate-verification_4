import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createClient } from 'redis';

// Initialize Prisma client
const prisma = new PrismaClient();

// Initialize Redis client
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const redis = createClient({ url: redisUrl });

export async function GET(req: NextRequest) {
  const healthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    instance: process.env.INSTANCE_ID || 'default',
    services: {
      database: 'unknown',
      redis: 'unknown',
    },
  };

  // Check database connection
  try {
    await prisma.$queryRaw`SELECT 1`;
    healthStatus.services.database = 'healthy';
  } catch (error) {
    healthStatus.services.database = 'unhealthy';
    healthStatus.status = 'degraded';
  }

  // Check Redis connection
  try {
    if (!redis.isOpen) {
      await redis.connect();
    }
    await redis.ping();
    healthStatus.services.redis = 'healthy';
  } catch (error) {
    healthStatus.services.redis = 'unhealthy';
    healthStatus.status = 'degraded';
  } finally {
    if (redis.isOpen) {
      await redis.disconnect();
    }
  }

  // Return health status
  return NextResponse.json(healthStatus);
}