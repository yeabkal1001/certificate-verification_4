import { NextApiRequest, NextApiResponse } from 'next';
import { createHash, randomBytes } from 'crypto';
import { logger } from './logger';
import { cacheUtils } from './redis';

// CSRF token expiration time (1 hour)
const CSRF_TOKEN_EXPIRY = 60 * 60; // seconds

/**
 * Generate a CSRF token
 * @param userId - User ID or session ID
 * @returns CSRF token
 */
export async function generateCsrfToken(userId: string): Promise<string> {
  // Generate a random token
  const randomToken = randomBytes(32).toString('hex');
  
  // Create a hash of the token
  const tokenHash = createHash('sha256')
    .update(`${randomToken}${process.env.NEXTAUTH_SECRET || ''}`)
    .digest('hex');
  
  // Store the token hash in Redis with expiration
  const cacheKey = `csrf:${userId}`;
  await cacheUtils.set(cacheKey, tokenHash, CSRF_TOKEN_EXPIRY);
  
  return tokenHash;
}

/**
 * Validate a CSRF token
 * @param userId - User ID or session ID
 * @param token - CSRF token to validate
 * @returns Boolean indicating if token is valid
 */
export async function validateCsrfToken(userId: string, token: string): Promise<boolean> {
  if (!userId || !token) {
    return false;
  }
  
  // Get the stored token hash from Redis
  const cacheKey = `csrf:${userId}`;
  const storedToken = await cacheUtils.get<string>(cacheKey);
  
  // Validate the token
  return storedToken === token;
}

/**
 * CSRF protection middleware for API routes
 * This middleware validates CSRF tokens for state-changing operations (POST, PUT, DELETE, PATCH)
 */
export function withCsrfProtection(handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    // Skip CSRF validation for GET and OPTIONS requests
    if (req.method === 'GET' || req.method === 'OPTIONS' || req.method === 'HEAD') {
      return handler(req, res);
    }
    
    try {
      // Get the CSRF token from the request header or body
      const csrfToken = req.headers['x-csrf-token'] as string || 
                        req.body?.csrfToken as string;
      
      // Get the user ID from the session
      const userId = req.headers['x-user-id'] as string || 
                     req.cookies?.['next-auth.session-token'] || 
                     'anonymous';
      
      // Validate the CSRF token
      const isValidToken = await validateCsrfToken(userId, csrfToken);
      
      if (!isValidToken) {
        logger.warn('CSRF token validation failed', { 
          url: req.url, 
          method: req.method,
          userId,
          hasToken: !!csrfToken
        });
        
        return res.status(403).json({
          success: false,
          message: 'Invalid or missing CSRF token',
        });
      }
      
      // Continue with the request
      return handler(req, res);
    } catch (error) {
      logger.error('CSRF middleware error', { error, url: req.url });
      
      return res.status(500).json({
        success: false,
        message: 'CSRF protection error',
      });
    }
  };
}

/**
 * API route to generate a CSRF token
 * This should be called before making any state-changing requests
 */
export async function csrfTokenHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // Get the user ID from the session
    const userId = req.headers['x-user-id'] as string || 
                   req.cookies?.['next-auth.session-token'] || 
                   'anonymous';
    
    // Generate a new CSRF token
    const token = await generateCsrfToken(userId);
    
    // Return the token
    return res.status(200).json({
      success: true,
      csrfToken: token,
      expiresIn: CSRF_TOKEN_EXPIRY,
    });
  } catch (error) {
    logger.error('Error generating CSRF token', { error });
    
    return res.status(500).json({
      success: false,
      message: 'Failed to generate CSRF token',
    });
  }
}