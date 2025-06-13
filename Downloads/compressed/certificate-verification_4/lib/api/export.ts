import apiClient from "./client"

export interface ExportParams {
  format?: "csv" | "xlsx" | "pdf"
  startDate?: string
  endDate?: string
  filters?: Record<string, any>
}

export const exportApi = {
  async exportCertificates(params?: ExportParams): Promise<Blob> {
    const response = await apiClient.get("/export/certificates", {
      params,
      responseType: "blob",
    })
    return response.data
  },

  async exportValidationLogs(params?: ExportParams): Promise<Blob> {
    const response = await apiClient.get("/export/logs", {
      params,
      responseType: "blob",
    })
    return response.data
  },

  async exportUsers(params?: ExportParams): Promise<Blob> {
    const response = await apiClient.get("/export/users", {
      params,
      responseType: "blob",
    })
    return response.data
  },

  async exportTemplates(params?: ExportParams): Promise<Blob> {
    const response = await apiClient.get("/export/templates", {
      params,
      responseType: "blob",
    })
    return response.data
  },

  async exportMetrics(params?: ExportParams): Promise<Blob> {
    const response = await apiClient.get("/export/metrics", {
      params,
      responseType: "blob",
    })
    return response.data
  },

  // Utility function to trigger download
  downloadBlob(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  },
}
