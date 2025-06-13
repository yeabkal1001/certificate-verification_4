"use client"

import { useState, useEffect, useCallback } from "react"
import { templatesApi } from "@/lib/api/templates"
import type { CertificateTemplate } from "@/types/template"
import type { ApiError } from "@/lib/api/client"

export function useTemplates() {
  const [data, setData] = useState<CertificateTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<ApiError | null>(null)

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const templates = await templatesApi.getAll()
      setData(templates)
    } catch (err) {
      setError(err as ApiError)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  const refresh = useCallback(() => {
    fetchTemplates()
  }, [fetchTemplates])

  return { data, loading, error, refresh }
}

export function useTemplate(id: string) {
  const [data, setData] = useState<CertificateTemplate | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<ApiError | null>(null)

  const fetchTemplate = useCallback(async () => {
    if (!id) return

    try {
      setLoading(true)
      setError(null)
      const template = await templatesApi.getById(id)
      setData(template)
    } catch (err) {
      setError(err as ApiError)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchTemplate()
  }, [fetchTemplate])

  const refresh = useCallback(() => {
    fetchTemplate()
  }, [fetchTemplate])

  return { data, loading, error, refresh }
}

export function useTemplateMutations() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)

  const createTemplate = useCallback(async (template: Omit<CertificateTemplate, "id" | "createdAt" | "updatedAt">) => {
    try {
      setLoading(true)
      setError(null)
      const newTemplate = await templatesApi.create(template)
      return newTemplate
    } catch (err) {
      setError(err as ApiError)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const updateTemplate = useCallback(async (id: string, updates: Partial<CertificateTemplate>) => {
    try {
      setLoading(true)
      setError(null)
      const updatedTemplate = await templatesApi.update(id, updates)
      return updatedTemplate
    } catch (err) {
      setError(err as ApiError)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const updateLayout = useCallback(async (id: string, layout: any) => {
    try {
      setLoading(true)
      setError(null)
      const updatedTemplate = await templatesApi.updateLayout(id, layout)
      return updatedTemplate
    } catch (err) {
      setError(err as ApiError)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteTemplate = useCallback(async (id: string) => {
    try {
      setLoading(true)
      setError(null)
      await templatesApi.delete(id)
    } catch (err) {
      setError(err as ApiError)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const uploadBackground = useCallback(async (id: string, file: File) => {
    try {
      setLoading(true)
      setError(null)
      const backgroundUrl = await templatesApi.uploadBackground(id, file)
      return backgroundUrl
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
    createTemplate,
    updateTemplate,
    updateLayout,
    deleteTemplate,
    uploadBackground,
  }
}
