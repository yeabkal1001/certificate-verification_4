import { Counter, Histogram } from 'prom-client';
import { NextApiRequest, NextApiResponse } from 'next';

// HTTP request counter
export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'path', 'status']
});

// HTTP request duration histogram
export const httpRequestDurationSeconds = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'path'],
  buckets: [0.05, 0.1, 0.3, 0.5, 0.7, 1, 3, 5, 10]
});

// Database query counter
export const dbQueriesTotal = new Counter({
  name: 'db_queries_total',
  help: 'Total number of database queries',
  labelNames: ['operation', 'model']
});

// Database query duration histogram
export const dbQueryDurationSeconds = new Histogram({
  name: 'db_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'model'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 0.7, 1, 3, 5]
});

// Certificate operations counter
export const certificateOperationsTotal = new Counter({
  name: 'certificate_operations_total',
  help: 'Total number of certificate operations',
  labelNames: ['operation']
});

// Middleware to track HTTP requests
export function metricsMiddleware(handler: any) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    // Skip metrics endpoint to avoid circular references
    if (req.url === '/api/metrics') {
      return handler(req, res);
    }

    const start = Date.now();
    
    // Create a custom end function to capture response status
    const originalEnd = res.end;
    res.end = function(chunk?: any, encoding?: any, callback?: any) {
      const responseTime = (Date.now() - start) / 1000;
      
      // Extract path without query parameters
      const path = (req.url || '').split('?')[0];
      
      // Record metrics
      httpRequestsTotal.inc({
        method: req.method,
        path,
        status: res.statusCode
      });
      
      httpRequestDurationSeconds.observe(
        {
          method: req.method,
          path
        },
        responseTime
      );
      
      // Call the original end function
      return originalEnd.call(this, chunk, encoding, callback);
    };
    
    return handler(req, res);
  };
}