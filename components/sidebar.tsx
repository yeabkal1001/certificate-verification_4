"use client"

import { useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import {
  Shield,
  LayoutDashboard,
  FileText,
  Users,
  BarChart3,
  Settings,
  LogOut,
  X,
  Award,
  Upload,
  UserCheck,
} from "lucide-react"

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  userRole: string
}

const navigationItems = {
  admin: [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Templates", href: "/admin/templates", icon: FileText },
    { name: "Certificates", href: "/admin/certificates", icon: Award },
    { name: "Users", href: "/admin/users", icon: Users },
    { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  ],
  staff: [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Issue Certificate", href: "/staff/issue", icon: Upload },
    { name: "Certificates", href: "/staff/certificates", icon: Award },
    { name: "Verify", href: "/verify", icon: UserCheck },
  ],
  student: [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "My Certificates", href: "/student/certificates", icon: Award },
    { name: "Verify Certificate", href: "/verify", icon: UserCheck },
    { name: "Request Correction", href: "/student/request", icon: FileText },
  ],
}

export function Sidebar({ isOpen, onClose, userRole }: SidebarProps) {
  const { user, signOut } = useAuth()
  const pathname = usePathname()

  const navigation = navigationItems[userRole as keyof typeof navigationItems] || navigationItems.student

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        onClose()
      }
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [onClose])

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-border/50">
        <Link href="/verify" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-pink-purple rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold">
            <span className="text-gradient-pink-purple">IMS</span> Certify
          </span>
        </Link>
        <Button variant="ghost" size="icon" onClick={onClose} className="lg:hidden">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* User Info */}
      <div className="p-6 border-b border-border/50">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user?.avatar || "/placeholder.svg"} alt={user?.name} />
            <AvatarFallback className="bg-gradient-pink-purple text-white">
              {user?.name?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{user?.name}</p>
            <p className="text-sm text-muted-foreground capitalize">{user?.role}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-6 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-gradient-pink-purple text-white"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
              )}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-6 border-t border-border/50 space-y-2">
        <Button variant="ghost" className="w-full justify-start" onClick={() => {}}>
          <Settings className="w-5 h-5 mr-3" />
          Settings
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10"
          onClick={() => {
            signOut()
            onClose()
          }}
        >
          <LogOut className="w-5 h-5 mr-3" />
          Sign Out
        </Button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 lg:z-50 lg:bg-card lg:border-r lg:border-border/50">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="left" className="p-0 w-64">
          <SidebarContent />
        </SheetContent>
      </Sheet>
    </>
  )
}
