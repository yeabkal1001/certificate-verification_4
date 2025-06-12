"use client"

import { useState, useEffect, useCallback } from "react"
import { rolesApi } from "@/lib/api/users"
import type { Role } from "@/types/user"
import type { ApiError } from "@/lib/api/client"

export function useRoles() {
  const [data, setData] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<ApiError | null>(null)

  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const roles = await rolesApi.getAll()
      setData(roles)
    } catch (err) {
      setError(err as ApiError)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRoles()
  }, [fetchRoles])

  const refresh = useCallback(() => {
    fetchRoles()
  }, [fetchRoles])

  return { data, loading, error, refresh }
}
