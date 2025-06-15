'use client';

import { v4 as uuidv4 } from 'uuid';

// Configuration
const config = {
  endpoint: '/api/error-tracking',
  sampleRate: 1.0, // Default to 100% sampling for errors
  flushInterval: 5000, // Flush errors every 5 seconds
  maxQueueSize: 10, // Maximum number of errors to queue before forcing a flush
  debug: process.env.NODE_ENV === 'development',
  ignorePatterns: [
    /ResizeObserver loop limit exceeded/,
    /ResizeObserver loop completed with undelivered notifications/,
    /Network request failed/,
    /Loading chunk \d+ failed/,
    /Loading CSS chunk \d+ failed/,
    /Script error/,
  ],
};

// Types
export enum ErrorSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

export interface ErrorContext {
  componentName?: string;
  route?: string;
  action?: string;
  userId?: string;
  [key: string]: any;
}

interface ErrorReport {
  message: string;
  stack?: string;
  severity: ErrorSeverity;
  context: ErrorContext;
  timestamp: number;
  url: string;
  userAgent: string;
  sessionId: string;
}

// State
let isInitialized = false;
let sessionId = '';
let errorsQueue: ErrorReport[] = [];
let flushTimeout: NodeJS.Timeout | null = null;

// Initialize error tracking
export function initErrorTracking(options: { sampleRate?: number } = {}) {
  if (typeof window === 'undefined') {
    return; // Don't run on server
  }

  if (isInitialized) {
    return; // Already initialized
  }

  // Apply options
  if (options.sampleRate !== undefined) {
    config.sampleRate = options.sampleRate;
  }

  // Determine if we should sample this session
  if (Math.random() > config.sampleRate) {
    if (config.debug) {
      console.log('[ErrorTracking] Session not sampled');
    }
    return;
  }

  // Generate session ID
  sessionId = uuidv4();

  // Set up global error handlers
  setupErrorHandlers();

  // Set up flush interval
  scheduleFlush();

  // Set up unload handler
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', flush);
  }

  isInitialized = true;

  if (config.debug) {
    console.log(`[ErrorTracking] Initialized with session ID: ${sessionId}`);
  }
}

// Set up global error handlers
function setupErrorHandlers() {
  if (typeof window === 'undefined') {
    return;
  }

  // Global error handler
  window.addEventListener('error', (event) => {
    trackError(event.error || event.message, ErrorSeverity.ERROR, {
      lineNumber: event.lineno,
      columnNumber: event.colno,
      fileName: event.filename,
    });
    
    // Don't prevent default error handling
    return false;
  });

  // Unhandled promise rejection handler
  window.addEventListener('unhandledrejection', (event) => {
    trackError(event.reason, ErrorSeverity.ERROR, {
      type: 'unhandledrejection',
    });
    
    // Don't prevent default error handling
    return false;
  });
}

// Track an error
export function trackError(
  error: Error | string,
  severity: ErrorSeverity = ErrorSeverity.ERROR,
  context: ErrorContext = {}
) {
  // Check if we should ignore this error
  const errorMessage = typeof error === 'string' ? error : error.message;
  if (config.ignorePatterns?.some(pattern => pattern.test(errorMessage))) {
    return;
  }
  
  // Don't track errors if not initialized
  if (!isInitialized) {
    if (config.debug) {
      console.log('[ErrorTracking] Not initialized, error not tracked:', errorMessage);
    }
    return;
  }
  
  // Create error report
  const errorReport: ErrorReport = {
    message: errorMessage,
    stack: typeof error === 'string' ? undefined : error.stack,
    severity,
    context: {
      ...context,
      route: typeof window !== 'undefined' ? window.location.pathname : undefined,
    },
    timestamp: Date.now(),
    url: typeof window !== 'undefined' ? window.location.href : '',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    sessionId,
  };
  
  // Add to queue
  errorsQueue.push(errorReport);
  
  if (config.debug) {
    console.log('[ErrorTracking] Tracked error:', errorReport);
  }
  
  // Flush immediately for critical errors
  if (severity === ErrorSeverity.CRITICAL || errorsQueue.length >= config.maxQueueSize) {
    flush();
  }
}

// Schedule a flush
function scheduleFlush() {
  if (flushTimeout) {
    clearTimeout(flushTimeout);
  }
  
  flushTimeout = setTimeout(flush, config.flushInterval);
}

// Flush errors to the server
export function flush() {
  if (!isInitialized || errorsQueue.length === 0) {
    return;
  }
  
  const errors = [...errorsQueue];
  errorsQueue = [];
  
  if (config.debug) {
    console.log(`[ErrorTracking] Flushing ${errors.length} errors`);
  }
  
  // Use sendBeacon if available, otherwise use fetch
  if (navigator.sendBeacon) {
    const blob = new Blob([JSON.stringify({ errors })], { type: 'application/json' });
    navigator.sendBeacon(config.endpoint, blob);
  } else {
    fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ errors }),
      keepalive: true,
    }).catch((error) => {
      console.error('[ErrorTracking] Error sending errors:', error);
    });
  }
  
  scheduleFlush();
}

// Hook for React components
export function useErrorTracking(options: { sampleRate?: number } = {}) {
  if (typeof window !== 'undefined' && !isInitialized) {
    initErrorTracking(options);
  }
}