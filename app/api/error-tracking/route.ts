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
    console.log('Connected to Redis for error tracking');
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
  }
})();

export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json();
    const { errors } = body;

    if (!errors || !Array.isArray(errors)) {
      return NextResponse.json({ error: 'Invalid error data' }, { status: 400 });
    }

    // Store errors in Redis for later processing
    // We use Redis as a buffer to avoid overwhelming the database
    const timestamp = Date.now();
    const key = `error:reports:${timestamp}`;
    
    await redis.set(key, JSON.stringify(errors), {
      EX: 86400, // Expire after 24 hours
    });
    
    // Add to processing queue
    await redis.lPush('error:queue', key);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing error reports:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    // This endpoint is for checking if the error tracking API is working
    return NextResponse.json({ status: 'Error tracking API is working' });
  } catch (error) {
    console.error('Error in error tracking API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}