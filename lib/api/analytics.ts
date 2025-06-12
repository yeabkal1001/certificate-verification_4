import apiClient from "./client"

export interface MetricsParams {
  startDate?: string
  endDate?: string
  granularity?: "day" | "week" | "month"
}

export interface ValidationLog {
  id: string
  certificateId: string
  timestamp: string
  ipAddress: string
  userAgent: string
  result: "valid" | "invalid"
  location?: {
    country: string
    city: string
  }
}

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
  userGrowth: Array<{ date: string; count: number }>
  popularTemplates: Array<{ name: string; count: number }>
}

export const analyticsApi = {
  async getMetrics(params?: MetricsParams): Promise<MetricsData> {
    const response = await apiClient.get("/metrics", { params })
    return response.data
  },

  async getValidationLogs(params?: {
    page?: number
    limit?: number
    search?: string
    startDate?: string
    endDate?: string
  }) {
    const response = await apiClient.get("/validation-logs", { params })
    return response.data
  },

  async getCertificateStats(params?: {
    templateId?: string
    courseId?: string
    startDate?: string
    endDate?: string
  }) {
    const response = await apiClient.get("/certificates/stats", { params })
    return response.data
  },

  async getUserStats(params?: {
    role?: string
    startDate?: string
    endDate?: string
  }) {
    const response = await apiClient.get("/users/stats", { params })
    return response.data
  },

  async getValidationStats(params?: {
    startDate?: string
    endDate?: string
    groupBy?: "hour" | "day" | "week" | "month"
  }) {
    const response = await apiClient.get("/validations/stats", { params })
    return response.data
  },
}
