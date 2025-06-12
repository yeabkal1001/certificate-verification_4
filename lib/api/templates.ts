import apiClient from "./client"
import type { CertificateTemplate } from "@/types/template"

export const templatesApi = {
  async getAll(): Promise<CertificateTemplate[]> {
    const response = await apiClient.get("/templates")
    return response.data.templates
  },

  async getById(id: string): Promise<CertificateTemplate | null> {
    try {
      const response = await apiClient.get(`/templates/${id}`)
      return response.data.template
    } catch (error: any) {
      if (error.code === 404) return null
      throw error
    }
  },

  async create(template: Omit<CertificateTemplate, "id" | "createdAt" | "updatedAt">): Promise<CertificateTemplate> {
    const response = await apiClient.post("/templates", template)
    return response.data.template
  },

  async update(id: string, updates: Partial<CertificateTemplate>): Promise<CertificateTemplate> {
    const response = await apiClient.patch(`/templates/${id}`, updates)
    return response.data.template
  },

  async updateLayout(id: string, layout: any): Promise<CertificateTemplate> {
    const response = await apiClient.patch(`/templates/${id}/layout`, { layout })
    return response.data.template
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/templates/${id}`)
  },

  async uploadBackground(id: string, file: File): Promise<string> {
    const formData = new FormData()
    formData.append("background", file)

    const response = await apiClient.post(`/templates/${id}/background`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    return response.data.backgroundUrl
  },
}
