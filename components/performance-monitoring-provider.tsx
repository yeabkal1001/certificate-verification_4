'use client';

import { ReactNode, useEffect } from 'react';
import { usePerformanceMonitoring } from '@/lib/performance-monitoring';

interface PerformanceMonitoringProviderProps {
  children: ReactNode;
  sampleRate?: number;
}

/**
 * Provider component for performance monitoring
 * Initializes performance monitoring with the specified sample rate
 */
export function PerformanceMonitoringProvider({ 
  children, 
  sampleRate = 0.1 // Default to 10% sampling
}: PerformanceMonitoringProviderProps) {
  // Initialize performance monitoring
  usePerformanceMonitoring({ sampleRate });
  
  return <>{children}</>;
}