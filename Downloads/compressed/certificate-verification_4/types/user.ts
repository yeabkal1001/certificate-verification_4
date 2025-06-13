export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  profileImage?: string
  status: "active" | "inactive" | "pending"
  emailVerified: boolean
  lastLoginAt?: string
  createdAt: string
  updatedAt: string
  // Student-specific fields
  studentId?: string
  enrollmentDate?: string
  // Staff-specific fields
  department?: string
  permissions?: string[]
}

export type UserRole = "admin" | "staff" | "student"

export interface Role {
  id: string
  name: UserRole
  displayName: string
  permissions: string[]
  description: string
  createdAt: string
  updatedAt: string
}
