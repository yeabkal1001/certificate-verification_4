import axios, { type AxiosError, type AxiosResponse } from "axios"
import { toast } from "sonner"

// Normalized error interface
export interface ApiError {
  code: number
  message: string
  details?: any
}

// Create axios instance with global configuration
export const apiClient = axios.create({
  baseURL: "/api",
  withCredentials: true,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
})

// Global request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available (for non-cookie auth scenarios)
    const token =
      typeof window !== "undefined"
        ? document.cookie
            .split("; ")
            .find((row) => row.startsWith("auth-token="))
            ?.split("=")[1]
        : null

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // Add request timestamp for debugging
    config.metadata = { startTime: new Date() }

    return config
  },
  (error) => {
    return Promise.reject(normalizeError(error))
  },
)

// Global response interceptor for error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log successful requests in development
    if (process.env.NODE_ENV === "development") {
      const duration = new Date().getTime() - response.config.metadata?.startTime?.getTime()
      console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url} (${duration}ms)`)
    }
    return response
  },
  (error: AxiosError) => {
    const normalizedError = normalizeError(error)

    // Log errors in development
    if (process.env.NODE_ENV === "development") {
      console.error(`❌ API Error:`, normalizedError)
    }

    // Handle specific error codes globally
    switch (normalizedError.code) {
      case 401:
        // Unauthorized - redirect to login (but not for login/register endpoints)
        if (!error.config?.url?.includes("/auth/")) {
          toast.error("Your session has expired. Please log in again.")
          // Clear any stored auth state
          if (typeof window !== "undefined") {
            window.location.href = "/auth/login"
          }
        }
        break

      case 403:
        toast.error("You don't have permission to perform this action")
        break

      case 404:
        // Don't show toast for 404s - let components handle them
        break

      case 422:
        // Validation errors - don't show global toast, let forms handle field errors
        break

      case 429:
        toast.error("Too many requests. Please wait a moment and try again.")
        break

      case 500:
        toast.error("Server error. Please try again later.")
        break

      default:
        // Only show toast for unexpected errors
        if (normalizedError.code >= 500) {
          toast.error(normalizedError.message)
        }
    }

    return Promise.reject(normalizedError)
  },
)

// Normalize different error types into consistent format
function normalizeError(error: any): ApiError {
  // Network errors (no response)
  if (!error.response) {
    return {
      code: 0,
      message:
        error.code === "ECONNABORTED"
          ? "Request timeout. Please check your connection."
          : "Network error. Please check your connection.",
      details: { originalError: error.message },
    }
  }

  // HTTP errors with response
  const response = error.response
  const data = response.data

  return {
    code: response.status,
    message: data?.message || data?.error || getDefaultErrorMessage(response.status),
    details: data?.details || data?.errors || null,
  }
}

// Default error messages for common HTTP status codes
function getDefaultErrorMessage(status: number): string {
  switch (status) {
    case 400:
      return "Invalid request. Please check your input."
    case 401:
      return "Authentication required."
    case 403:
      return "Access denied."
    case 404:
      return "Resource not found."
    case 409:
      return "Conflict. Resource already exists."
    case 422:
      return "Validation failed."
    case 429:
      return "Too many requests."
    case 500:
      return "Internal server error."
    case 502:
      return "Bad gateway."
    case 503:
      return "Service unavailable."
    default:
      return "An unexpected error occurred."
  }
}

export default apiClient
