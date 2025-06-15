import { NextApiRequest, NextApiResponse } from 'next';
import { cacheUtils } from './redis';
import { logger } from './logger';

// Default cache TTL in seconds (5 minutes)
const DEFAULT_CACHE_TTL = 300;

// Cache configuration by route pattern
const CACHE_CONFIG: Record<string, { ttl: number; methods: string[] }> = {
  // Certificate routes
  '/api/certificates': { ttl: 300, methods: ['GET'] },
  '/api/certificates/[id]': { ttl: 600, methods: ['GET'] },
  '/api/validate': { ttl: 3600, methods: ['GET'] },
  
  // Template routes
  '/api/templates': { ttl: 1800, methods: ['GET'] },
  '/api/templates/[id]': { ttl: 1800, methods: ['GET'] },
  
  // User routes - shorter TTL due to potential frequent changes
  '/api/users': { ttl: 120, methods: ['GET'] },
  
  // Static data routes - longer TTL
  '/api/countries': { ttl: 86400, methods: ['GET'] }, // 24 hours
  '/api/settings': { ttl: 3600, methods: ['GET'] },   // 1 hour
};

/**
 * Generate a cache key from the request
 */
const generateCacheKey = (req: NextApiRequest): string => {
  const { url, method, query, headers } = req;
  
  // Include authorization in the cache key to ensure user-specific caching
  const authHeader = headers.authorization || '';
  
  // Create a normalized query string
  const queryString = Object.keys(query)
    .sort()
    .map(key => `${key}=${query[key]}`)
    .join('&');
  
  // Generate a unique cache key
  return `api:${method}:${url}:${queryString}:${authHeader.substring(0, 10)}`;
};

/**
 * Check if a request should be cached based on configuration
 */
const shouldCache = (req: NextApiRequest): boolean => {
  const { method, url } = req;
  
  if (!url) return false;
  
  // Find matching route pattern
  const matchingPattern = Object.keys(CACHE_CONFIG).find(pattern => {
    // Convert pattern to regex (replace [param] with regex pattern)
    const regexPattern = pattern.replace(/\[([^\]]+)\]/g, '[^/]+');
    return new RegExp(regexPattern).test(url);
  });
  
  if (!matchingPattern) return false;
  
  // Check if method is allowed for caching
  return CACHE_CONFIG[matchingPattern].methods.includes(method || 'GET');
};

/**
 * Get TTL for a request based on configuration
 */
const getCacheTTL = (req: NextApiRequest): number => {
  const { url } = req;
  
  if (!url) return DEFAULT_CACHE_TTL;
  
  // Find matching route pattern
  const matchingPattern = Object.keys(CACHE_CONFIG).find(pattern => {
    const regexPattern = pattern.replace(/\[([^\]]+)\]/g, '[^/]+');
    return new RegExp(regexPattern).test(url);
  });
  
  return matchingPattern 
    ? CACHE_CONFIG[matchingPattern].ttl 
    : DEFAULT_CACHE_TTL;
};

/**
 * API caching middleware
 */
export function withCaching(handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    // Skip caching for non-GET methods or if caching is disabled
    if (!shouldCache(req)) {
      return handler(req, res);
    }
    
    const cacheKey = generateCacheKey(req);
    
    try {
      // Try to get from cache
      const cachedData = await cacheUtils.get(cacheKey);
      
      if (cachedData) {
        // Add cache header
        res.setHeader('X-Cache', 'HIT');
        
        // Return cached response
        return res.status(200).json(cachedData);
      }
      
      // Cache miss - create a custom response object to capture the response
      const originalJson = res.json;
      res.json = function(body) {
        // Restore original json method
        res.json = originalJson;
        
        // Cache the response
        const ttl = getCacheTTL(req);
        cacheUtils.set(cacheKey, body, ttl);
        
        // Add cache header
        res.setHeader('X-Cache', 'MISS');
        
        // Return the response
        return originalJson.call(this, body);
      };
      
      // Process the request
      return handler(req, res);
    } catch (error) {
      logger.error('Cache middleware error', { error, url: req.url });
      
      // Continue without caching
      return handler(req, res);
    }
  };
}