'use client';

import { ReactNode, useEffect } from 'react';
import { useErrorTracking } from '@/lib/error-tracking';

interface ErrorTrackingProviderProps {
  children: ReactNode;
  sampleRate?: number;
}

/**
 * Provider component for error tracking
 * Initializes error tracking with the specified sample rate
 */
export function ErrorTrackingProvider({ 
  children, 
  sampleRate = 1.0 // Default to 100% sampling for errors
}: ErrorTrackingProviderProps) {
  // Initialize error tracking
  useErrorTracking({ sampleRate });
  
  return <>{children}</>;
}