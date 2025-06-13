"use client"

import { useState, useEffect, useCallback } from "react"
import { usersApi, type UserListParams } from "@/lib/api/users"
import type { User, UserRole } from "@/types/user"
import type { ApiError } from "@/lib/api/client"

export function useUsers(params?: UserListParams) {
  const [data, setData] = useState<{
    users: User[]
    total: number
    page: number
    totalPages: number
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<ApiError | null>(null)

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await usersApi.getAll(params)
      setData(result)
    } catch (err) {
      setError(err as ApiError)
    } finally {
      setLoading(false)
    }
  }, [params])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const refresh = useCallback(() => {
    fetchUsers()
  }, [fetchUsers])

  return { data, loading, error, refresh }
}

export function useUserMutations() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)

  const createUser = useCallback(
    async (userData: {
      name: string
      email: string
      password: string
      role: UserRole
    }) => {
      try {
        setLoading(true)
        setError(null)
        const user = await usersApi.create(userData)
        return user
      } catch (err) {
        setError(err as ApiError)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  const updateUser = useCallback(async (id: string, updates: Partial<User>) => {
    try {
      setLoading(true)
      setError(null)
      const user = await usersApi.update(id, updates)
      return user
    } catch (err) {
      setError(err as ApiError)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteUser = useCallback(async (id: string) => {
    try {
      setLoading(true)
      setError(null)
      await usersApi.delete(id)
    } catch (err) {
      setError(err as ApiError)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    loading,
    error,
    createUser,
    updateUser,
    deleteUser,
  }
}
