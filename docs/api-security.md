# API Security Implementation Guide

This document provides a comprehensive guide to the security measures implemented in the Certificate Verification System API. It covers CORS policy, CSRF protection, Content Security Policy, and API rate limiting.

## Table of Contents

1. [Overview](#overview)
2. [CORS Policy](#cors-policy)
3. [CSRF Protection](#csrf-protection)
4. [Content Security Policy](#content-security-policy)
5. [Rate Limiting](#rate-limiting)
6. [Security Headers](#security-headers)
7. [Best Practices](#best-practices)
8. [Testing](#testing)

## Overview

The Certificate Verification System API implements multiple layers of security to protect against common web vulnerabilities and attacks. These include:

- **Cross-Origin Resource Sharing (CORS)**: Controls which domains can access the API
- **Cross-Site Request Forgery (CSRF) Protection**: Prevents unauthorized state-changing requests
- **Content Security Policy (CSP)**: Restricts which resources can be loaded
- **Rate Limiting**: Prevents abuse by limiting request rates
- **Security Headers**: Adds various HTTP security headers to responses

## CORS Policy

### Implementation

The CORS policy is implemented in two places:

1. **Middleware Level**: For handling preflight requests and basic CORS headers
2. **API Route Level**: For more granular control over CORS for specific endpoints

### Configuration

The CORS policy is configured using the following environment variables:

```
CORS_ALLOWED_ORIGINS=http://localhost:3000,https://your-domain.com
```

### Code Implementation

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

## CSRF Protection

### Implementation

CSRF protection is implemented using a token-based approach:

1. **Token Generation**: A unique token is generated for each user session
2. **Token Validation**: The token is validated for all state-changing operations (POST, PUT, DELETE, PATCH)
3. **Token Storage**: Tokens are stored in Redis with an expiration time

### Configuration

CSRF protection is configured using the following environment variables:

```
CSRF_TOKEN_EXPIRY=3600
```

### Code Implementation

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

### Client-Side Implementation

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

## Content Security Policy

### Implementation

The Content Security Policy is implemented at two levels:

1. **Nginx Level**: For the entire application
2. **API Route Level**: For specific API endpoints

### Configuration

The Content Security Policy is configured using the following environment variables:

```
CONTENT_SECURITY_POLICY="default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'"
```

### Nginx Implementation

```nginx
# More restrictive Content Security Policy
add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; form-action 'self'; base-uri 'self'; object-src 'none'; frame-src 'none'; worker-src 'self'; manifest-src 'self'; media-src 'self'; prefetch-src 'self'; upgrade-insecure-requests" always;
```

### API Route Implementation

```typescript
// Add Content-Security-Policy header for API routes
if (req.url?.startsWith('/api/')) {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'none'; frame-ancestors 'none'"
  );
}
```

## Rate Limiting

### Implementation

Rate limiting is implemented using a Redis-based approach:

1. **Rate Limiter Configuration**: Different rate limits for different endpoints
2. **Request Tracking**: Requests are tracked by IP address and user ID
3. **Response Headers**: Rate limit information is included in response headers

### Configuration

Rate limiting is configured using the following environment variables:

```
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

### Code Implementation

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

## Security Headers

### Implementation

Security headers are added at multiple levels:

1. **Nginx Level**: For the entire application
2. **Middleware Level**: For all Next.js routes
3. **API Route Level**: For specific API endpoints

### Headers Implemented

- **Strict-Transport-Security**: Enforces HTTPS
- **X-Content-Type-Options**: Prevents MIME type sniffing
- **X-Frame-Options**: Controls framing of the page
- **X-XSS-Protection**: Enables browser XSS protection
- **Referrer-Policy**: Controls referrer information
- **Permissions-Policy**: Restricts browser features
- **Feature-Policy**: Legacy version of Permissions-Policy

### Code Implementation

```typescript
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

// Strict Transport Security
if (process.env.NODE_ENV === 'production') {
  res.setHeader(
    'Strict-Transport-Security',
    'max-age=63072000; includeSubDomains; preload'
  );
}
```

## Best Practices

### CORS

1. **Restrict Origins**: Only allow trusted domains
2. **Limit Methods**: Only allow necessary HTTP methods
3. **Limit Headers**: Only allow necessary HTTP headers
4. **Use Credentials**: Enable credentials only if needed
5. **Cache Preflight**: Cache preflight requests to reduce overhead

### CSRF

1. **Token-Based Protection**: Use unique tokens for each session
2. **Validate All State-Changing Operations**: Check tokens for POST, PUT, DELETE, PATCH
3. **Short Expiration**: Use short expiration times for tokens
4. **Secure Storage**: Store tokens securely (Redis, session storage)
5. **Include in Headers**: Send tokens in headers rather than cookies

### CSP

1. **Restrictive Policy**: Start with a restrictive policy and loosen as needed
2. **No Unsafe Inline**: Avoid 'unsafe-inline' for script-src and style-src
3. **No Unsafe Eval**: Avoid 'unsafe-eval' for script-src
4. **Frame Protection**: Use frame-ancestors to control framing
5. **Report Violations**: Use report-uri to monitor violations

### Rate Limiting

1. **Tiered Limits**: Use different limits for different endpoints
2. **User-Based Limits**: Consider user roles when setting limits
3. **Include Headers**: Include rate limit information in headers
4. **Graceful Degradation**: Return helpful error messages when limits are exceeded
5. **Monitor and Adjust**: Regularly review and adjust limits based on usage patterns

## Testing

### CORS Testing

```bash
# Test CORS with curl
curl -H "Origin: http://example.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: X-Requested-With" \
  -X OPTIONS \
  --verbose \
  https://your-api.com/api/endpoint
```

### CSRF Testing

```bash
# Get a CSRF token
TOKEN=$(curl -s https://your-api.com/api/auth/csrf-token | jq -r '.csrfToken')

# Use the token in a request
curl -X POST \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: $TOKEN" \
  -d '{"name":"test"}' \
  https://your-api.com/api/endpoint
```

### CSP Testing

```bash
# Check CSP headers
curl -I https://your-api.com | grep -i "content-security-policy"
```

### Rate Limiting Testing

```bash
# Make multiple requests to test rate limiting
for i in {1..20}; do
  curl -I https://your-api.com/api/endpoint
  echo "Request $i"
  sleep 0.1
done
```

## Conclusion

The security measures implemented in the Certificate Verification System API provide a robust defense against common web vulnerabilities and attacks. By combining CORS policy, CSRF protection, Content Security Policy, and rate limiting, the API is well-protected against unauthorized access and abuse.

For further assistance or to report security issues, please contact the system administrators.