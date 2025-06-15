import { NextApiRequest, NextApiResponse } from 'next';
import { withApiHandler } from '@/lib/api-wrapper';
import dbMonitor from '@/lib/db-monitor';
import { logger } from '@/lib/logger';

/**
 * Database statistics API endpoint
 * 
 * GET /api/db-stats - Get database statistics
 * GET /api/db-stats?type=slow-queries - Get slow queries
 * GET /api/db-stats?type=tables - Get table statistics
 * GET /api/db-stats?type=indexes - Get index statistics
 */
async function dbStatsHandler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow GET method
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  // Check if user has admin role (implement your auth check here)
  // This is a placeholder - replace with your actual auth check
  const isAdmin = req.headers.authorization === 'Bearer admin-token';
  if (!isAdmin) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }

  try {
    const { type } = req.query;
    
    switch (type) {
      case 'slow-queries':
        const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
        const slowQueries = await dbMonitor.getSlowQueries(limit);
        return res.status(200).json({ success: true, data: slowQueries });
        
      case 'tables':
        const tableStats = await dbMonitor.getTableStats();
        return res.status(200).json({ success: true, data: tableStats });
        
      case 'indexes':
        const indexStats = await dbMonitor.getIndexStats();
        return res.status(200).json({ success: true, data: indexStats });
        
      default:
        // Get general database statistics
        const dbStats = await dbMonitor.getDbStats();
        return res.status(200).json({ success: true, data: dbStats });
    }
  } catch (error) {
    logger.error('Database stats API error', { error });
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to get database statistics' 
    });
  }
}

export default withApiHandler(dbStatsHandler);