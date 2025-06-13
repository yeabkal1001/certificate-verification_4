import { useState, useCallback } from "react"
// Placeholder for signature API logic
// Replace with real API when backend is ready
export function useSignature() {
  const [signature, setSignature] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Simulate saving signature (drawn/uploaded as base64)
  const saveSignature = useCallback(async (base64: string) => {
    setLoading(true)
    setError(null)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500))
      setSignature(base64)
      return base64
    } catch (err) {
      setError("Failed to save signature")
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return { signature, loading, error, saveSignature }
}
