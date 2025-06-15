# Caching Strategy

This document outlines the caching strategy implemented in the Certificate Verification System to improve performance and reduce load on the backend services.

## Overview

The system implements a multi-layered caching approach:

1. **Redis Caching**: Server-side caching for API responses and session data
2. **Nginx Caching**: Proxy-level caching for static assets and read-only API endpoints
3. **Browser Caching**: Client-side caching controlled via HTTP headers

## Redis Caching

Redis is used for two primary purposes:

1. **API Response Caching**: Caching API responses to reduce database load
2. **Session Storage**: Storing user sessions for authentication

### API Response Caching

The system caches API responses based on the request URL, method, query parameters, and authorization context. This ensures that:

- Frequently accessed data is served from cache
- User-specific data is properly isolated
- Cache is invalidated when data changes

#### Cache Configuration

Different API endpoints have different caching TTLs (Time To Live):

| Endpoint Type | TTL (seconds) | Rationale |
|---------------|---------------|-----------|
| Certificate validation | 3600 (1 hour) | Certificates rarely change once issued |
| Certificate listings | 300 (5 minutes) | Balance between freshness and performance |
| Template data | 1800 (30 minutes) | Templates change infrequently |
| User data | 120 (2 minutes) | User data may change more frequently |
| Static reference data | 86400 (24 hours) | Reference data rarely changes |

### Session Storage

Redis is used to store user sessions, which provides:

- Improved performance compared to database storage
- Support for horizontal scaling (sessions are not tied to a specific server)
- Automatic session expiration

## Nginx Caching

Nginx provides an additional layer of caching at the proxy level:

### Static Asset Caching

Static assets (images, CSS, JavaScript, etc.) are cached with the following configuration:

- Cache TTL: 7 days
- Cache location: `/var/cache/nginx/static_cache`
- Cache size limit: 1GB
- Cache key: `$scheme$proxy_host$request_uri`

### API Response Caching

Read-only API endpoints are cached at the Nginx level with the following configuration:

- Cache TTL: 5 minutes for successful responses, 1 minute for 404 responses
- Cache location: `/var/cache/nginx/api_cache`
- Cache size limit: 500MB
- Cache key: `$scheme$proxy_host$request_uri$http_authorization`
- Only GET requests are cached

## Browser Caching

The system sets appropriate cache control headers to enable browser caching:

### Static Assets

```
Cache-Control: public, max-age=604800, stale-while-revalidate=86400
```

This configuration:
- Allows public caching (CDNs, proxies)
- Sets a max age of 7 days (604800 seconds)
- Allows stale content to be served while revalidating for up to 1 day (86400 seconds)

### API Responses

```
Cache-Control: private, max-age=300, stale-while-revalidate=600
```

This configuration:
- Restricts caching to the browser only (private)
- Sets a max age of 5 minutes (300 seconds)
- Allows stale content to be served while revalidating for up to 10 minutes (600 seconds)

## Cache Invalidation

The system implements several cache invalidation strategies:

### Time-Based Invalidation

All cached items have a TTL (Time To Live) after which they are automatically removed from the cache.

### Event-Based Invalidation

When data is modified, related cache entries are invalidated:

- When a certificate is issued, updated, or revoked, the certificate cache is invalidated
- When a template is modified, the template cache is invalidated
- When user data changes, the user cache is invalidated

### Manual Invalidation

Administrators can manually invalidate the cache using the cache management API:

- `DELETE /api/cache`: Clear all cache
- `DELETE /api/cache?pattern=api:*`: Clear cache by pattern

## Cache Monitoring

The system provides tools to monitor cache performance:

### Cache Statistics

Cache statistics are available via the API:

```
GET /api/cache
```

This endpoint returns information about:
- Cache size
- Cache hit rate
- Memory usage

### Cache Headers

All cached responses include headers indicating cache status:

- `X-Cache`: Indicates if the response was served from the Redis cache (HIT/MISS)
- `X-Cache-Status`: Indicates if the response was served from the Nginx cache (HIT/MISS)

### Performance Testing

A performance testing script is provided to measure the effectiveness of caching:

```bash
npm run cache:test
```

This script:
- Makes multiple requests to the same endpoint
- Measures response times for cache hits and misses
- Calculates performance improvement from caching

## Implementation Details

### Redis Cache Implementation

The Redis cache is implemented in:
- `lib/redis.ts`: Redis client and cache utility functions
- `lib/cache-middleware.ts`: API route caching middleware

### Nginx Cache Implementation

The Nginx cache is configured in:
- `nginx/conf.d/default.conf`: Nginx cache configuration

### Cache Headers Implementation

Cache headers are set in:
- `lib/api-wrapper.ts`: API response cache headers
- `nginx/conf.d/default.conf`: Static asset cache headers

## Best Practices

1. **Cache Selectively**: Only cache responses that are expensive to generate and don't change frequently
2. **Set Appropriate TTLs**: Balance between freshness and performance
3. **Include Vary Headers**: Ensure proper cache variation based on request headers
4. **Monitor Cache Performance**: Regularly check cache hit rates and adjust strategy as needed
5. **Implement Proper Invalidation**: Ensure cache is invalidated when underlying data changes

## References

- [Redis Documentation](https://redis.io/documentation)
- [Nginx Caching Guide](https://www.nginx.com/blog/nginx-caching-guide/)
- [HTTP Caching](https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching)
- [Cache-Control Header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control)
- [Stale-While-Revalidate](https://web.dev/stale-while-revalidate/)