'use client';

import { Suspense, lazy, ComponentType, ReactNode } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Default loading component
const DefaultLoading = () => (
  <div className="w-full space-y-4 p-4">
    <Skeleton className="h-8 w-full" />
    <Skeleton className="h-32 w-full" />
    <div className="space-y-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  </div>
);

// Function to create a lazy-loaded component with a custom loading component
export function lazyLoad<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  LoadingComponent: React.ComponentType = DefaultLoading
) {
  const LazyComponent = lazy(importFunc);

  return (props: React.ComponentProps<T>): JSX.Element => (
    <Suspense fallback={<LoadingComponent />}>
      <LazyComponent {...props} />
    </Suspense>
  );
}

// Higher-order component for lazy loading with custom loading state
export function withLazyLoading<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  LoadingComponent: React.ComponentType = DefaultLoading
) {
  return lazyLoad(importFunc, LoadingComponent);
}

// Wrapper component for lazy loading with children
interface LazyComponentProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export const LazyComponent = ({ children, fallback = <DefaultLoading /> }: LazyComponentProps) => (
  <Suspense fallback={fallback}>{children}</Suspense>
);