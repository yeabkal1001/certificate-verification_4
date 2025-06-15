'use client';

import { useCallback, useEffect, useRef } from 'react';
import { markStart, markEnd, trackMetric, MetricType } from '@/lib/performance-monitoring';

interface UsePerformanceOptions {
  componentName?: string;
  trackMounts?: boolean;
  trackRenders?: boolean;
}

/**
 * Hook for measuring component performance
 */
export function usePerformance(options: UsePerformanceOptions = {}) {
  const {
    componentName = 'UnnamedComponent',
    trackMounts = true,
    trackRenders = true,
  } = options;
  
  const renderCount = useRef(0);
  const mountTime = useRef(0);
  
  // Track component mount
  useEffect(() => {
    if (trackMounts) {
      const startTime = performance.now();
      mountTime.current = startTime;
      
      return () => {
        const unmountTime = performance.now();
        const timeOnScreen = unmountTime - mountTime.current;
        
        // Track time on screen for components that stay mounted for at least 100ms
        if (timeOnScreen > 100) {
          trackMetric(
            MetricType.CUSTOM,
            timeOnScreen,
            `${componentName}_timeOnScreen`
          );
        }
      };
    }
  }, [componentName, trackMounts]);
  
  // Track component render
  useEffect(() => {
    if (trackRenders) {
      renderCount.current += 1;
      
      if (renderCount.current > 1) {
        trackMetric(
          MetricType.CUSTOM,
          renderCount.current,
          `${componentName}_renderCount`
        );
      }
    }
  });
  
  // Measure a custom operation
  const measureOperation = useCallback(
    <T>(operation: () => T, operationName: string): T => {
      const fullName = `${componentName}_${operationName}`;
      markStart(fullName);
      const result = operation();
      markEnd(fullName);
      return result;
    },
    [componentName]
  );
  
  // Measure an async operation
  const measureAsyncOperation = useCallback(
    async <T>(operation: () => Promise<T>, operationName: string): Promise<T> => {
      const fullName = `${componentName}_${operationName}`;
      markStart(fullName);
      try {
        const result = await operation();
        markEnd(fullName);
        return result;
      } catch (error) {
        markEnd(fullName);
        throw error;
      }
    },
    [componentName]
  );
  
  // Track a custom metric
  const trackCustomMetric = useCallback(
    (value: number, metricName: string) => {
      const fullName = `${componentName}_${metricName}`;
      trackMetric(MetricType.CUSTOM, value, fullName);
    },
    [componentName]
  );
  
  return {
    measureOperation,
    measureAsyncOperation,
    trackCustomMetric,
  };
}