import { NextApiRequest, NextApiResponse } from 'next';
import { metricsMiddleware } from './metrics';
import { logger } from './logger';
import { withCaching } from './cache-middleware';
import { withCors } from './cors-middleware';
import { withCsrfProtection } from './csrf-protection';
import { withRateLimit } from './rate-limit';

type ApiHandler = (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void;

export function withMetrics(handler: ApiHandler): ApiHandler {
  return metricsMiddleware(handler);
}

export function withErrorHandling(handler: ApiHandler): ApiHandler {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      await handler(req, res);
    } catch (error) {
      logger.error('API error', { 
        error, 
        url: req.url, 
        method: req.method,
        query: req.query,
        headers: req.headers
      });
      
      const statusCode = error.statusCode || 500;
      const message = error.message || 'Internal Server Error';
      
      res.status(statusCode).json({ 
        success: false, 
        message 
      });
    }
  };
}

export function withCacheHeaders(handler: ApiHandler): ApiHandler {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    // Set cache control headers for GET requests
    if (req.method === 'GET') {
      // Public cache for static resources
      if (req.url?.match(/\.(jpg|jpeg|png|gif|ico|css|js|svg)$/)) {
        res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=43200');
      } 
      // Private cache for API responses
      else if (req.url?.startsWith('/api/')) {
        res.setHeader('Cache-Control', 'private, max-age=300, stale-while-revalidate=600');
      }
      // Default cache policy
      else {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      }
    } else {
      // No caching for non-GET requests
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
    
    // Add Vary header to ensure proper caching
    res.setHeader('Vary', 'Accept, Authorization, Origin');
    
    return handler(req, res);
  };
}

export function withSecurityHeaders(handler: ApiHandler): ApiHandler {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    // Add security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Add Content-Security-Policy header for API routes
    if (req.url?.startsWith('/api/')) {
      res.setHeader(
        'Content-Security-Policy',
        "default-src 'none'; frame-ancestors 'none'"
      );
    }
    
    // Prevent browsers from performing MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // Strict Transport Security
    if (process.env.NODE_ENV === 'production') {
      res.setHeader(
        'Strict-Transport-Security',
        'max-age=63072000; includeSubDomains; preload'
      );
    }
    
    return handler(req, res);
  };
}

/**
 * API handler wrapper with all middleware
 * This applies the following middleware in order:
 * 1. CORS - Cross-Origin Resource Sharing
 * 2. Security Headers - Adds security-related HTTP headers
 * 3. Rate Limiting - Prevents abuse by limiting request rates
 * 4. Metrics - Collects metrics for monitoring
 * 5. CSRF Protection - Prevents cross-site request forgery (for state-changing operations)
 * 6. Cache Headers - Sets appropriate cache headers
 * 7. Caching - Caches responses for improved performance
 * 8. Error Handling - Handles errors gracefully
 */
export function withApiHandler(handler: ApiHandler): ApiHandler {
  return withCors(
    withSecurityHeaders(
      withRateLimit(
        withMetrics(
          withCsrfProtection(
            withCacheHeaders(
              withErrorHandling(
                withCaching(handler)
              )
            )
          )
        )
      )
    )
  );
}

/**
 * API handler wrapper without CSRF protection
 * Use this for public endpoints that don't require CSRF protection
 */
export function withPublicApiHandler(handler: ApiHandler): ApiHandler {
  return withCors(
    withSecurityHeaders(
      withRateLimit(
        withMetrics(
          withCacheHeaders(
            withErrorHandling(
              withCaching(handler)
            )
          )
        )
      )
    )
  );
}