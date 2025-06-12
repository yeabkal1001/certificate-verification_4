"use client"

import { useAuth } from "@/hooks/use-auth"
import { AdminDashboard } from "@/components/dashboards/admin-dashboard"
import { StaffDashboard } from "@/components/dashboards/staff-dashboard"
import { StudentDashboard } from "@/components/dashboards/student-dashboard"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Loader2 } from "lucide-react"

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
        return <AdminDashboard />
      case "staff":
        return <StaffDashboard />
      case "student":
        return <StudentDashboard />
      default:
        return <StudentDashboard />
    }
  }

  return <DashboardLayout>{renderDashboard()}</DashboardLayout>
}
