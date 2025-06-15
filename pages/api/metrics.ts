import type { NextApiRequest, NextApiResponse } from 'next';
import { register } from 'prom-client';
import { collectDefaultMetrics } from 'prom-client';
import { logger } from '@/lib/logger';

// Initialize default metrics
collectDefaultMetrics({ prefix: 'certificate_verification_' });

// Custom metrics can be defined here
// For example:
// const httpRequestDurationMicroseconds = new client.Histogram({
//   name: 'http_request_duration_seconds',
//   help: 'Duration of HTTP requests in seconds',
//   labelNames: ['method', 'path', 'status'],
//   buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
// });

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Only allow GET requests
    if (req.method !== 'GET') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    // Set content type for Prometheus metrics
    res.setHeader('Content-Type', register.contentType);
    
    // Get metrics
    const metrics = await register.metrics();
    
    // Send metrics
    res.status(200).send(metrics);
  } catch (error) {
    logger.error('Error generating metrics', { error });
    res.status(500).json({ error: 'Error generating metrics' });
  }
}