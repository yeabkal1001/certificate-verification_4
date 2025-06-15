import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createClient } from 'redis';

// Initialize Prisma client
const prisma = new PrismaClient();

// Initialize Redis client
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const redis = createClient({ url: redisUrl });

// Connect to Redis
(async () => {
  try {
    await redis.connect();
    console.log('Connected to Redis for performance monitoring');
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
  }
})();

export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json();
    const { metrics } = body;

    if (!metrics || !Array.isArray(metrics)) {
      return NextResponse.json({ error: 'Invalid metrics data' }, { status: 400 });
    }

    // Store metrics in Redis for later processing
    // We use Redis as a buffer to avoid overwhelming the database
    const timestamp = Date.now();
    const key = `performance:metrics:${timestamp}`;
    
    await redis.set(key, JSON.stringify(metrics), {
      EX: 86400, // Expire after 24 hours
    });
    
    // Add to processing queue
    await redis.lPush('performance:queue', key);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing performance metrics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    // This endpoint is for checking if the performance monitoring API is working
    return NextResponse.json({ status: 'Performance monitoring API is working' });
  } catch (error) {
    console.error('Error in performance monitoring API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}