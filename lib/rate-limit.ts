import { NextApiRequest, NextApiResponse } from 'next';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import { logger } from './logger';
import redisClient from './redis';

// Rate limit configurations for different endpoints
const rateLimitConfigs: Record<string, { points: number; duration: number }> = {
  // Default rate limit (100 requests per minute)
  default: {
    points: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    duration: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60,
  },
  
  // Authentication endpoints (10 requests per minute)
  auth: {
    points: 10,
    duration: 60,
  },
  
  // Certificate verification endpoints (30 requests per minute)
  verification: {
    points: 30,
    duration: 60,
  },
  
  // User management endpoints (20 requests per minute)
  users: {
    points: 20,
    duration: 60,
  },
  
  // Template management endpoints (50 requests per minute)
  templates: {
    points: 50,
    duration: 60,
  },
};

// Create rate limiters for each configuration
const rateLimiters: Record<string, RateLimiterRedis> = {};

// Initialize rate limiters
export async function initRateLimiters() {
  // Wait for Redis client to be ready
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
  
  // Create rate limiters for each configuration
  for (const [key, config] of Object.entries(rateLimitConfigs)) {
    rateLimiters[key] = new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: `ratelimit:${key}`,
      points: config.points,
      duration: config.duration,
    });
  }
  
  logger.info('Rate limiters initialized', { 
    configs: Object.keys(rateLimiters) 
  });
}

/**
 * Get the appropriate rate limiter for a request
 * @param req - Next.js API request
 * @returns Rate limiter instance
 */
function getRateLimiter(req: NextApiRequest): RateLimiterRedis {
  const { url } = req;
  
  if (!url) {
    return rateLimiters.default;
  }
  
  // Authentication endpoints
  if (url.startsWith('/api/auth')) {
    return rateLimiters.auth;
  }
  
  // Certificate verification endpoints
  if (url.startsWith('/api/certificates/verify') || url.includes('/validate')) {
    return rateLimiters.verification;
  }
  
  // User management endpoints
  if (url.startsWith('/api/users')) {
    return rateLimiters.users;
  }
  
  // Template management endpoints
  if (url.startsWith('/api/templates')) {
    return rateLimiters.templates;
  }
  
  // Default rate limiter
  return rateLimiters.default;
}

/**
 * Generate a rate limit key for a request
 * @param req - Next.js API request
 * @returns Rate limit key
 */
function getRateLimitKey(req: NextApiRequest): string {
  // Get client IP address
  const ip = req.headers['x-forwarded-for'] || 
             req.connection.remoteAddress || 
             'unknown';
  
  // Get user ID from session if available
  const userId = req.headers['x-user-id'] || 'anonymous';
  
  // Use IP and user ID for rate limiting
  return `${ip}:${userId}`;
}

/**
 * Rate limiting middleware for API routes
 */
export function withRateLimit(handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      // Skip rate limiting for OPTIONS requests
      if (req.method === 'OPTIONS') {
        return handler(req, res);
      }
      
      // Get the appropriate rate limiter
      const rateLimiter = getRateLimiter(req);
      
      // Get the rate limit key
      const key = getRateLimitKey(req);
      
      // Try to consume a point
      const rateLimitResult = await rateLimiter.consume(key);
      
      // Add rate limit headers
      res.setHeader('X-Rate-Limit-Limit', rateLimiter.points);
      res.setHeader('X-Rate-Limit-Remaining', rateLimitResult.remainingPoints);
      res.setHeader('X-Rate-Limit-Reset', new Date(Date.now() + rateLimitResult.msBeforeNext).toISOString());
      
      // Continue with the request
      return handler(req, res);
    } catch (error) {
      // Check if it's a rate limit error
      if (error.remainingPoints !== undefined) {
        logger.warn('Rate limit exceeded', { 
          url: req.url, 
          method: req.method,
          ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        });
        
        // Add rate limit headers
        res.setHeader('X-Rate-Limit-Limit', error.limit);
        res.setHeader('X-Rate-Limit-Remaining', 0);
        res.setHeader('X-Rate-Limit-Reset', new Date(Date.now() + error.msBeforeNext).toISOString());
        res.setHeader('Retry-After', Math.ceil(error.msBeforeNext / 1000));
        
        // Return rate limit error
        return res.status(429).json({
          success: false,
          message: 'Too many requests, please try again later',
          retryAfter: Math.ceil(error.msBeforeNext / 1000),
        });
      }
      
      // Log other errors
      logger.error('Rate limit middleware error', { error, url: req.url });
      
      // Continue with the request (fail open)
      return handler(req, res);
    }
  };
}