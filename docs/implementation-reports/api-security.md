# API Security Implementation Report

## Overview

This report documents the implementation of enhanced API security measures for the Certificate Verification System. The goal was to implement a comprehensive CORS policy, add CSRF protection for all state-changing operations, configure a more restrictive Content Security Policy, and implement API rate limiting with proper configuration.

## Implementation Details

### 1. Comprehensive CORS Policy

To ensure that the API can only be accessed from authorized domains, we implemented a comprehensive CORS policy:

```typescript
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
};
```

The CORS policy is configured using environment variables, allowing for easy customization in different environments:

```
CORS_ALLOWED_ORIGINS=http://localhost:3000,https://your-domain.com
```

We also added special handling for preflight requests in the middleware to ensure proper CORS behavior:

```typescript
// Always allow CORS preflight requests
if (isPreflightRequest(request)) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': process.env.CORS_ALLOWED_ORIGINS || '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With',
      'Access-Control-Max-Age': '3600',
    },
  });
}
```

### 2. CSRF Protection

To prevent Cross-Site Request Forgery attacks, we implemented a token-based CSRF protection system:

```typescript
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
```

We created a middleware to validate CSRF tokens for all state-changing operations:

```typescript
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
```

We also created a client-side utility to simplify working with CSRF tokens:

```typescript
/**
 * Add a CSRF token to a fetch request
 * @param url - Request URL
 * @param options - Fetch options
 * @returns Fetch options with CSRF token
 */
export async function fetchWithCsrf(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // Only add CSRF token for state-changing methods
  const method = options.method || 'GET';
  
  if (['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase())) {
    return fetch(url, options);
  }
  
  // Get the CSRF token
  const csrfToken = await getCsrfToken();
  
  // Create headers with CSRF token
  const headers = new Headers(options.headers || {});
  headers.set('X-CSRF-Token', csrfToken);
  
  // Add the token to the request
  const newOptions = {
    ...options,
    headers,
  };
  
  return fetch(url, newOptions);
}
```

### 3. Content Security Policy

We implemented a more restrictive Content Security Policy at both the Nginx and API levels:

#### Nginx Configuration

```nginx
# More restrictive Content Security Policy
add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; form-action 'self'; base-uri 'self'; object-src 'none'; frame-src 'none'; worker-src 'self'; manifest-src 'self'; media-src 'self'; prefetch-src 'self'; upgrade-insecure-requests" always;
```

#### API Route Implementation

```typescript
// Add Content-Security-Policy header for API routes
if (req.url?.startsWith('/api/')) {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'none'; frame-ancestors 'none'"
  );
}
```

We also added additional security headers:

```typescript
// Add security headers
res.setHeader('X-Content-Type-Options', 'nosniff');
res.setHeader('X-Frame-Options', 'DENY');
res.setHeader('X-XSS-Protection', '1; mode=block');
res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()');
```

### 4. API Rate Limiting

We implemented a comprehensive rate limiting system with different limits for different endpoints:

```typescript
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
```

The rate limiting is implemented using Redis for distributed tracking:

```typescript
// Create rate limiters for each configuration
for (const [key, config] of Object.entries(rateLimitConfigs)) {
  rateLimiters[key] = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: `ratelimit:${key}`,
    points: config.points,
    duration: config.duration,
  });
}
```

We also added rate limit headers to responses:

```typescript
// Add rate limit headers
res.setHeader('X-Rate-Limit-Limit', rateLimiter.points);
res.setHeader('X-Rate-Limit-Remaining', rateLimitResult.remainingPoints);
res.setHeader('X-Rate-Limit-Reset', new Date(Date.now() + rateLimitResult.msBeforeNext).toISOString());
```

### 5. API Wrapper Integration

We updated the API wrapper to include all security middleware:

```typescript
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
```

We also created a version without CSRF protection for public endpoints:

```typescript
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
```

## Testing Results

The implementation was tested with the following scenarios:

1. **CORS Testing**: Verified that requests from unauthorized origins are blocked
2. **CSRF Protection**: Confirmed that state-changing operations require a valid CSRF token
3. **Content Security Policy**: Verified that the CSP headers are correctly set
4. **Rate Limiting**: Tested that requests are rate limited according to the configuration

All tests passed successfully, demonstrating that the API security enhancements are working as expected.

## Conclusion

The Certificate Verification System API now has a comprehensive security implementation that protects against common web vulnerabilities and attacks. The implementation includes:

1. A configurable CORS policy that restricts access to authorized domains
2. CSRF protection for all state-changing operations
3. A restrictive Content Security Policy
4. Tiered rate limiting for different endpoints
5. Additional security headers for enhanced protection

These security measures provide a robust defense against unauthorized access and abuse, making the API more secure and reliable.

## Next Steps

The next task to implement is "Documentation: Create System Documentation" which involves creating architecture documentation with diagrams, documenting API endpoints with OpenAPI/Swagger, creating a deployment and operations guide, and documenting disaster recovery procedures.