import apiClient from "./client"
import type { Certificate, CertificateStatus } from "@/types/certificate"

export interface CertificateListParams {
  page?: number
  limit?: number
  search?: string
  status?: CertificateStatus
  templateId?: string
}

export interface VerificationResult {
  valid: boolean
  certificate?: Certificate
  message: string
}

export interface BulkUploadResult {
  success: boolean
  count: number
  errors?: Array<{ row: number; message: string }>
}

export const certificatesApi = {
  async getAll(params?: CertificateListParams) {
    const response = await apiClient.get("/certificates", { params })
    return response.data
  },

  async getById(id: string): Promise<Certificate> {
    const response = await apiClient.get(`/certificates/${id}`)
    return response.data.certificate
  },

  async verify(certificateId: string): Promise<VerificationResult> {
    const response = await apiClient.get(`/validate?code=${certificateId}`)
    return response.data
  },

  async issue(certificateData: Partial<Certificate>): Promise<Certificate> {
    const response = await apiClient.post("/certificates", certificateData)
    return response.data.certificate
  },

  async bulkUpload(file: File): Promise<BulkUploadResult> {
    const formData = new FormData()
    formData.append("file", file)

    const response = await apiClient.post("/certificates/bulk", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    return response.data
  },

  async download(id: string, format: "pdf" | "png"): Promise<Blob> {
    const response = await apiClient.get(`/certificates/${id}/download`, {
      params: { format },
      responseType: "blob",
    })
    return response.data
  },

  async revoke(id: string, reason: string): Promise<void> {
    await apiClient.patch(`/certificates/${id}/revoke`, { reason })
  },

  async update(id: string, updates: Partial<Certificate>): Promise<Certificate> {
    const response = await apiClient.patch(`/certificates/${id}`, updates)
    return response.data.certificate
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/certificates/${id}`)
  },
}
