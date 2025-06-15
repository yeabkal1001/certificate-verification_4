import { NextApiRequest, NextApiResponse } from 'next';
import { withApiHandler } from '@/lib/api-wrapper';
import { cacheUtils } from '@/lib/redis';
import { logger } from '@/lib/logger';

/**
 * Cache management API endpoint
 * 
 * GET /api/cache - Get cache stats
 * DELETE /api/cache - Clear all cache
 * DELETE /api/cache?pattern=api:* - Clear cache by pattern
 */
async function cacheHandler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow GET and DELETE methods
  if (!['GET', 'DELETE'].includes(req.method || '')) {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  // Check if user has admin role (implement your auth check here)
  // This is a placeholder - replace with your actual auth check
  const isAdmin = req.headers.authorization === 'Bearer admin-token';
  if (!isAdmin) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }

  try {
    // GET: Return cache stats
    if (req.method === 'GET') {
      const stats = await cacheUtils.getStats();
      return res.status(200).json({ success: true, stats });
    }
    
    // DELETE: Clear cache
    if (req.method === 'DELETE') {
      const { pattern } = req.query;
      
      if (pattern && typeof pattern === 'string') {
        // Clear cache by pattern
        await cacheUtils.delByPattern(pattern);
        logger.info(`Cache cleared with pattern: ${pattern}`);
        return res.status(200).json({ 
          success: true, 
          message: `Cache cleared with pattern: ${pattern}` 
        });
      } else {
        // Clear all cache (use with caution)
        await cacheUtils.delByPattern('*');
        logger.info('All cache cleared');
        return res.status(200).json({ 
          success: true, 
          message: 'All cache cleared' 
        });
      }
    }
  } catch (error) {
    logger.error('Cache API error', { error });
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to manage cache' 
    });
  }
}

export default withApiHandler(cacheHandler);