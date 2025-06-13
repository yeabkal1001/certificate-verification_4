import { useState, useCallback } from "react"
import { certificatesApi } from "@/lib/api/certificates"
import type { VerificationResult } from "@/lib/api/certificates"
import type { ApiError } from "@/lib/api/client"

export function useVerify() {
  const [result, setResult] = useState<VerificationResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)

  const verify = useCallback(async (certificateId: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await certificatesApi.verify(certificateId)
      setResult(res)
      return res
    } catch (err) {
      setError(err as ApiError)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return { result, loading, error, verify }
}
