"use client"

import { useAuth } from "@/hooks/use-auth"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Loader2 } from "lucide-react"
import { 
  LazyAdminDashboard, 
  LazyStaffDashboard, 
  LazyStudentDashboard 
} from "@/components/lazy-components"
import { LazyComponent } from "@/lib/lazy-load"

export default function DashboardPage() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-pink" />
      </div>
    )
  }

  if (!user) {
    return null // This will be handled by the auth provider redirect
  }

  const renderDashboard = () => {
    switch (user.role) {
      case "admin":
        return <LazyAdminDashboard />
      case "staff":
        return <LazyStaffDashboard />
      case "student":
        return <LazyStudentDashboard />
      default:
        return <LazyStudentDashboard />
    }
  }

  return (
    <DashboardLayout>
      <LazyComponent>
        {renderDashboard()}
      </LazyComponent>
    </DashboardLayout>
  )
}
