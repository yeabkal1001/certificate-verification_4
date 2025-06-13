import { renderHook, act } from "@testing-library/react"
import { useValidation } from "@/hooks/use-validation"
import { certificatesApi } from "@/lib/api/certificates"
import { vi } from "vitest"

// Mock the API
vi.mock("@/lib/api/certificates")
const mockCertificatesApi = certificatesApi as vi.Mocked<typeof certificatesApi>

describe("useValidation", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should validate certificate successfully", async () => {
    const mockResult = {
      valid: true,
      certificate: {
        id: "1",
        certificateId: "CERT-2024-001",
        recipientName: "John Doe",
        courseName: "Makeup Artistry",
        grade: "A",
        issueDate: "2024-01-01",
        templateId: "template-1",
        status: "active" as const,
        qrCode: "qr-code-data",
        issuedBy: "admin",
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
        recipientEmail: "john@example.com",
      },
      message: "Certificate is valid",
    }

    mockCertificatesApi.verify.mockResolvedValue(mockResult)

    const { result } = renderHook(() => useValidation())

    await act(async () => {
      await result.current.validateCertificate("CERT-2024-001")
    })

    expect(result.current.data).toEqual(mockResult)
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBe(null)
  })

  it("should handle validation error", async () => {
    const mockError = {
      code: 404,
      message: "Certificate not found",
    }

    mockCertificatesApi.verify.mockRejectedValue(mockError)

    const { result } = renderHook(() => useValidation())

    await act(async () => {
      try {
        await result.current.validateCertificate("INVALID-ID")
      } catch (error) {
        // Expected to throw
      }
    })

    expect(result.current.data).toBe(null)
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toEqual(mockError)
  })

  it("should clear validation data", () => {
    const { result } = renderHook(() => useValidation())

    act(() => {
      result.current.clearValidation()
    })

    expect(result.current.data).toBe(null)
    expect(result.current.error).toBe(null)
  })
})
