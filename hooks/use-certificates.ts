"use client"

import { useState, useEffect, useCallback } from "react"
import { certificatesApi, type CertificateListParams, type BulkUploadResult } from "@/lib/api/certificates"
import type { Certificate } from "@/types/certificate"
import type { ApiError } from "@/lib/api/client"

export function useCertificates(params?: CertificateListParams) {
  const [data, setData] = useState<{
    certificates: Certificate[]
    total: number
    page: number
    totalPages: number
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<ApiError | null>(null)

  const fetchCertificates = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await certificatesApi.getAll(params)
      setData(result)
    } catch (err) {
      setError(err as ApiError)
    } finally {
      setLoading(false)
    }
  }, [params])

  useEffect(() => {
    fetchCertificates()
  }, [fetchCertificates])

  const refresh = useCallback(() => {
    fetchCertificates()
  }, [fetchCertificates])

  return { data, loading, error, refresh }
}

export function useCertificate(id: string) {
  const [data, setData] = useState<Certificate | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<ApiError | null>(null)

  const fetchCertificate = useCallback(async () => {
    if (!id) return

    try {
      setLoading(true)
      setError(null)
      const certificate = await certificatesApi.getById(id)
      setData(certificate)
    } catch (err) {
      setError(err as ApiError)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchCertificate()
  }, [fetchCertificate])

  const refresh = useCallback(() => {
    fetchCertificate()
  }, [fetchCertificate])

  return { data, loading, error, refresh }
}

export function useCertificateMutations() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)

  const issueCertificate = useCallback(async (certificateData: Partial<Certificate>) => {
    try {
      setLoading(true)
      setError(null)
      const certificate = await certificatesApi.issue(certificateData)
      return certificate
    } catch (err) {
      setError(err as ApiError)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const bulkUpload = useCallback(async (file: File): Promise<BulkUploadResult> => {
    try {
      setLoading(true)
      setError(null)
      const result = await certificatesApi.bulkUpload(file)
      return result
    } catch (err) {
      setError(err as ApiError)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const revokeCertificate = useCallback(async (id: string, reason: string) => {
    try {
      setLoading(true)
      setError(null)
      await certificatesApi.revoke(id, reason)
    } catch (err) {
      setError(err as ApiError)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const downloadCertificate = useCallback(async (id: string, format: "pdf" | "png") => {
    try {
      setLoading(true)
      setError(null)
      const blob = await certificatesApi.download(id, format)

      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `certificate-${id}.${format}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
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
    issueCertificate,
    bulkUpload,
    revokeCertificate,
    downloadCertificate,
  }
}
