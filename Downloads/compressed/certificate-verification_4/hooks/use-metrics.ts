"use client"

import { useState, useEffect, useCallback } from "react"
import { analyticsApi, type MetricsParams } from "@/lib/api/analytics"
import type { ApiError } from "@/lib/api/client"

export interface MetricsData {
  totalCertificates: number
  activeCertificates: number
  revokedCertificates: number
  totalValidations: number
  validationsToday: number
  certificatesThisMonth: number
  topCourses: Array<{ name: string; count: number }>
  validationTrends: Array<{ date: string; count: number }>
  issuanceTrends: Array<{ date: string; count: number }>
}

export function useMetrics(params?: MetricsParams) {
  const [data, setData] = useState<MetricsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<ApiError | null>(null)

  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const metrics = await analyticsApi.getMetrics(params)
      setData(metrics)
    } catch (err) {
      setError(err as ApiError)
    } finally {
      setLoading(false)
    }
  }, [params])

  useEffect(() => {
    fetchMetrics()
  }, [fetchMetrics])

  const refresh = useCallback(() => {
    fetchMetrics()
  }, [fetchMetrics])

  return { data, loading, error, refresh }
}

export function useValidationLogs(params?: { page?: number; limit?: number; search?: string }) {
  const [data, setData] = useState<{
    logs: Array<{
      id: string
      certificateId: string
      timestamp: string
      ipAddress: string
      userAgent: string
      result: "valid" | "invalid"
    }>
    total: number
    page: number
    totalPages: number
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<ApiError | null>(null)

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const logs = await analyticsApi.getValidationLogs(params)
      setData(logs)
    } catch (err) {
      setError(err as ApiError)
    } finally {
      setLoading(false)
    }
  }, [params])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const refresh = useCallback(() => {
    fetchLogs()
  }, [fetchLogs])

  return { data, loading, error, refresh }
}
