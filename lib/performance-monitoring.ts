'use client';

import { v4 as uuidv4 } from 'uuid';

// Configuration
const config = {
  endpoint: '/api/performance-monitoring',
  sampleRate: 0.1, // Default to 10% sampling
  flushInterval: 10000, // Flush metrics every 10 seconds
  maxQueueSize: 100, // Maximum number of metrics to queue before forcing a flush
  debug: process.env.NODE_ENV === 'development',
};

// Types
export enum MetricType {
  CORE_WEB_VITAL = 'core_web_vital',
  RESOURCE = 'resource',
  NAVIGATION = 'navigation',
  CUSTOM = 'custom',
  ERROR = 'error',
}

interface Metric {
  type: MetricType;
  value: number | object;
  name?: string;
  timestamp: number;
  url: string;
  sessionId: string;
}

// State
let isInitialized = false;
let sessionId = '';
let metricsQueue: Metric[] = [];
let flushTimeout: NodeJS.Timeout | null = null;
let markTimestamps: Record<string, number> = {};

// Initialize performance monitoring
export function initPerformanceMonitoring(options: { sampleRate?: number } = {}) {
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
      console.log('[Performance] Session not sampled');
    }
    return;
  }

  // Generate session ID
  sessionId = uuidv4();

  // Set up observers
  setupPerformanceObservers();

  // Set up flush interval
  scheduleFlush();

  // Set up unload handler
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', flush);
  }

  isInitialized = true;

  if (config.debug) {
    console.log(`[Performance] Monitoring initialized with session ID: ${sessionId}`);
  }
}

// Set up performance observers
function setupPerformanceObservers() {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
    return;
  }

  try {
    // Core Web Vitals
    const coreWebVitalsObserver = new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (entry.entryType === 'largest-contentful-paint') {
          trackMetric(MetricType.CORE_WEB_VITAL, entry.startTime, 'LCP');
        } else if (entry.entryType === 'first-input') {
          // @ts-ignore - PerformanceEventTiming is not in the TypeScript types
          trackMetric(MetricType.CORE_WEB_VITAL, entry.processingStart - entry.startTime, 'FID');
        } else if (entry.entryType === 'layout-shift') {
          // @ts-ignore - LayoutShiftAttribution is not in the TypeScript types
          if (!entry.hadRecentInput) {
            trackMetric(MetricType.CORE_WEB_VITAL, entry.value, 'CLS');
          }
        }
      }
    });

    coreWebVitalsObserver.observe({ type: 'largest-contentful-paint', buffered: true });
    coreWebVitalsObserver.observe({ type: 'first-input', buffered: true });
    coreWebVitalsObserver.observe({ type: 'layout-shift', buffered: true });

    // Navigation timing
    const navigationObserver = new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (entry.entryType === 'navigation') {
          const navigationEntry = entry as PerformanceNavigationTiming;
          trackMetric(MetricType.NAVIGATION, {
            domComplete: navigationEntry.domComplete,
            domInteractive: navigationEntry.domInteractive,
            loadEventEnd: navigationEntry.loadEventEnd,
            responseEnd: navigationEntry.responseEnd,
            responseStart: navigationEntry.responseStart,
            fetchStart: navigationEntry.fetchStart,
            domContentLoadedEventEnd: navigationEntry.domContentLoadedEventEnd,
            domContentLoadedEventStart: navigationEntry.domContentLoadedEventStart,
          }, 'navigation');
        }
      }
    });

    navigationObserver.observe({ type: 'navigation', buffered: true });

    // Resource timing
    const resourceObserver = new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (entry.entryType === 'resource') {
          const resourceEntry = entry as PerformanceResourceTiming;
          
          // Only track resources that took more than 100ms to load
          if (resourceEntry.duration > 100) {
            trackMetric(MetricType.RESOURCE, {
              name: resourceEntry.name,
              duration: resourceEntry.duration,
              transferSize: resourceEntry.transferSize,
              initiatorType: resourceEntry.initiatorType,
            }, 'resource');
          }
        }
      }
    });

    resourceObserver.observe({ type: 'resource', buffered: true });
  } catch (error) {
    console.error('[Performance] Error setting up observers:', error);
  }
}

// Track a metric
export function trackMetric(type: MetricType, value: number | object, name?: string) {
  if (!isInitialized) {
    return;
  }
  
  const metric = {
    type,
    value,
    name,
    timestamp: Date.now(),
    url: window.location.href,
    sessionId,
  };
  
  metricsQueue.push(metric);
  
  if (config.debug) {
    console.log(`[Performance] Tracked metric: ${name}`, metric);
  }
  
  if (metricsQueue.length >= config.maxQueueSize) {
    flush();
  }
}

// Mark the start of a custom measurement
export function markStart(name: string) {
  if (!isInitialized) {
    return;
  }
  
  markTimestamps[name] = performance.now();
  
  if (config.debug) {
    console.log(`[Performance] Marked start: ${name}`);
  }
}

// Mark the end of a custom measurement and track it
export function markEnd(name: string) {
  if (!isInitialized || !markTimestamps[name]) {
    return;
  }
  
  const startTime = markTimestamps[name];
  const endTime = performance.now();
  const duration = endTime - startTime;
  
  trackMetric(MetricType.CUSTOM, duration, name);
  
  delete markTimestamps[name];
  
  if (config.debug) {
    console.log(`[Performance] Marked end: ${name}, duration: ${duration}ms`);
  }
}

// Schedule a flush
function scheduleFlush() {
  if (flushTimeout) {
    clearTimeout(flushTimeout);
  }
  
  flushTimeout = setTimeout(flush, config.flushInterval);
}

// Flush metrics to the server
export function flush() {
  if (!isInitialized || metricsQueue.length === 0) {
    return;
  }
  
  const metrics = [...metricsQueue];
  metricsQueue = [];
  
  if (config.debug) {
    console.log(`[Performance] Flushing ${metrics.length} metrics`);
  }
  
  // Use sendBeacon if available, otherwise use fetch
  if (navigator.sendBeacon) {
    const blob = new Blob([JSON.stringify({ metrics })], { type: 'application/json' });
    navigator.sendBeacon(config.endpoint, blob);
  } else {
    fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ metrics }),
      keepalive: true,
    }).catch((error) => {
      console.error('[Performance] Error sending metrics:', error);
    });
  }
  
  scheduleFlush();
}

// Hook for React components
export function usePerformanceMonitoring(options: { sampleRate?: number } = {}) {
  if (typeof window !== 'undefined' && !isInitialized) {
    initPerformanceMonitoring(options);
  }
}