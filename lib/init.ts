/**
 * Application initialization
 * This file contains code to initialize various components of the application
 */

import { logger } from './logger';
import { metrics } from './metrics';
import { initDbMonitoring } from './db-monitor';

/**
 * Initialize the application
 */
export function initializeApp() {
  try {
    // Initialize metrics
    metrics.init();
    logger.info('Metrics initialized');
    
    // Initialize database monitoring
    initDbMonitoring();
    logger.info('Database monitoring initialized');
    
    logger.info('Application initialization completed');
  } catch (error) {
    logger.error('Failed to initialize application', { error });
    throw error;
  }
}

export default { initializeApp };