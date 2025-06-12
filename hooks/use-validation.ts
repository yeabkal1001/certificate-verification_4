"use client"

import { useState, useCallback } from "react"
import { certificatesApi, type VerificationResult } from "@/lib/api/certificates"
import type { ApiError } from "@/lib/api/client"

export function useValidation() {
  const [data, setData] = useState<VerificationResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)

  const validateCertificate = useCallback(async (certificateId: string) => {
    if (!certificateId.trim()) {
      setError({ code: 400, message: "Certificate ID is required" })
      return
    }

    try {
      setLoading(true)
      setError(null)
      const result = await certificatesApi.verify(certificateId)
      setData(result)
      return result
    } catch (err) {
      setError(err as ApiError)
      setData(null)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const clearValidation = useCallback(() => {
    setData(null)
    setError(null)
  }, [])

  return {
    data,
    loading,
    error,
    validateCertificate,
    clearValidation,
  }
}
