import { NextApiRequest, NextApiResponse } from 'next';
import Cors from 'cors';
import { logger } from './logger';

// CORS configuration
const corsOptions = {
  // Define allowed origins
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Get allowed origins from environment variable or use default
    const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || '').split(',').filter(Boolean);
    
    // In development, allow all origins if none specified
    if (allowedOrigins.length === 0 && process.env.NODE_ENV === 'development') {
      callback(null, true);
      return;
    }
    
    // Check if the origin is allowed
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      logger.warn('CORS blocked request', { origin });
      callback(new Error(`Origin ${origin} not allowed by CORS policy`));
    }
  },
  
  // Define allowed methods
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  
  // Define allowed headers
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'X-CSRF-Token',
  ],
  
  // Define exposed headers
  exposedHeaders: ['X-Total-Count', 'X-Rate-Limit-Limit', 'X-Rate-Limit-Remaining', 'X-Rate-Limit-Reset'],
  
  // Allow credentials (cookies, authorization headers)
  credentials: true,
  
  // Cache preflight requests for 1 hour (3600 seconds)
  maxAge: 3600,
  
  // Enable CORS preflight
  preflightContinue: false,
  
  // Success status for preflight
  optionsSuccessStatus: 204,
};

// Initialize CORS middleware
const cors = Cors(corsOptions);

// Helper method to run middleware
const runMiddleware = (req: NextApiRequest, res: NextApiResponse, fn: Function) => {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
};

/**
 * CORS middleware for API routes
 */
export function withCors(handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      // Run the CORS middleware
      await runMiddleware(req, res, cors);
      
      // Add CORS debug header in development
      if (process.env.NODE_ENV === 'development') {
        res.setHeader('X-CORS-Debug', 'true');
      }
      
      // Continue with the request
      return handler(req, res);
    } catch (error) {
      // Log CORS errors
      logger.error('CORS middleware error', { error, url: req.url });
      
      // Return CORS error
      return res.status(403).json({
        success: false,
        message: 'CORS policy violation',
      });
    }
  };
}