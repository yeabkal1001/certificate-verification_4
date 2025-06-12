"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { authApi } from "@/lib/api/auth"
import type { User } from "@/types/user"
import { getCookie } from "@/lib/utils"

interface AuthContextType {
  user: User | null
  isLoading: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (name: string, email: string, password: string, role: string) => Promise<void>
  signOut: () => Promise<void>
  forgotPassword: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    // Redirect logic
    if (!isLoading) {
      if (user && (pathname === "/auth/signin" || pathname === "/auth/signup")) {
        router.push("/dashboard")
      } else if (!user && pathname.startsWith("/dashboard")) {
        router.push("/auth/signin")
      }
    }
  }, [user, isLoading, pathname, router])

  const checkAuth = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Check if we have a user-role cookie (client-side readable)
      const userRole = getCookie("user-role")

      if (!userRole) {
        setUser(null)
        return
      }

      // If we have a role cookie, fetch the full user data
      const userData = await authApi.getCurrentUser()
      setUser(userData)
    } catch (error) {
      console.error("Auth check failed:", error)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true)
      setError(null)
      const userData = await authApi.login(email, password)
      setUser(userData)
    } catch (error: any) {
      setError(error.response?.data?.error || "Sign in failed")
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const signUp = async (name: string, email: string, password: string, role: string) => {
    try {
      setIsLoading(true)
      setError(null)
      await authApi.signup(name, email, password, role)
      // After signup, we'll redirect to sign in
    } catch (error: any) {
      setError(error.response?.data?.error || "Sign up failed")
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setIsLoading(true)
      await authApi.logout()
      setUser(null)
      router.push("/verify")
    } catch (error) {
      console.error("Sign out failed:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const forgotPassword = async (email: string) => {
    try {
      setIsLoading(true)
      setError(null)
      await authApi.forgotPassword(email)
    } catch (error: any) {
      setError(error.response?.data?.error || "Password reset request failed")
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        signIn,
        signUp,
        signOut,
        forgotPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
