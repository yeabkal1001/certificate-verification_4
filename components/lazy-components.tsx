'use client';

import { lazyLoad } from '@/lib/lazy-load';
import { Skeleton } from '@/components/ui/skeleton';

// Custom loading components
const DashboardLoading = () => (
  <div className="w-full space-y-6 p-6">
    <Skeleton className="h-10 w-1/3" />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Skeleton className="h-40 w-full rounded-lg" />
      <Skeleton className="h-40 w-full rounded-lg" />
      <Skeleton className="h-40 w-full rounded-lg" />
    </div>
    <Skeleton className="h-64 w-full rounded-lg" />
  </div>
);

const ChartLoading = () => (
  <div className="w-full h-64 flex items-center justify-center bg-muted rounded-lg">
    <Skeleton className="h-52 w-11/12 rounded-lg" />
  </div>
);

const FormLoading = () => (
  <div className="w-full space-y-4 p-4">
    <Skeleton className="h-8 w-1/2" />
    <Skeleton className="h-10 w-full" />
    <Skeleton className="h-10 w-full" />
    <Skeleton className="h-10 w-full" />
    <Skeleton className="h-10 w-1/2" />
    <Skeleton className="h-10 w-1/3" />
  </div>
);

// Lazy loaded components
export const LazyAdminDashboard = lazyLoad(
  () => import('@/components/dashboards/admin-dashboard'),
  DashboardLoading
);

export const LazyStaffDashboard = lazyLoad(
  () => import('@/components/dashboards/staff-dashboard'),
  DashboardLoading
);

export const LazyStudentDashboard = lazyLoad(
  () => import('@/components/dashboards/student-dashboard'),
  DashboardLoading
);

export const LazyChart = lazyLoad(
  () => import('@/components/ui/chart'),
  ChartLoading
);

export const LazyAddCertificateForm = lazyLoad(
  () => import('@/components/add-certificate-form'),
  FormLoading
);

export const LazyBulkUploadForm = lazyLoad(
  () => import('@/components/bulk-upload-form'),
  FormLoading
);

export const LazyTemplateManagement = lazyLoad(
  () => import('@/components/template-management'),
  FormLoading
);

export const LazyQRScanner = lazyLoad(
  () => import('@/components/qr-scanner'),
  () => (
    <div className="w-full h-64 flex items-center justify-center bg-muted rounded-lg">
      <p className="text-muted-foreground">Loading QR Scanner...</p>
    </div>
  )
);

export const LazyCertificateGenerator = lazyLoad(
  () => import('@/components/certificate-generator'),
  FormLoading
);

export const LazySignatureManagement = lazyLoad(
  () => import('@/components/signature-management'),
  FormLoading
);

export const LazyVerificationResult = lazyLoad(
  () => import('@/components/verification-result'),
  () => (
    <div className="w-full space-y-4 p-4">
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  )
);