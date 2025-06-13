import MockAdapter from "axios-mock-adapter"
import { apiClient } from "@/lib/api/client"
import { authApi } from "@/lib/api/auth"
import { certificatesApi } from "@/lib/api/certificates"

// OpenAPI spec mock - this should match your backend exactly
const BACKEND_SPEC = {
  "/auth/login": {
    method: "POST",
    requestBody: { email: "string", password: "string" },
    response: { user: { id: "string", name: "string", email: "string", role: "string" } },
  },
  "/auth/signup": {
    method: "POST",
    requestBody: { name: "string", email: "string", password: "string", role: "string" },
    response: { user: { id: "string", name: "string", email: "string", role: "string" } },
  },
  "/certificates": {
    method: "GET",
    params: { page: "number", limit: "number", search: "string" },
    response: { certificates: "array", total: "number", page: "number", totalPages: "number" },
  },
  "/certificates": {
    method: "POST",
    requestBody: { recipientName: "string", courseName: "string", templateId: "string" },
    response: { certificate: { id: "string", certificateId: "string" } },
  },
  "/validate": {
    method: "GET",
    params: { code: "string" },
    response: { valid: "boolean", certificate: "object", message: "string" },
  },
}

describe("API Contract Verification", () => {
  let mock: MockAdapter

  beforeEach(() => {
    mock = new MockAdapter(apiClient)
  })

  afterEach(() => {
    mock.restore()
  })

  it("should match auth/login contract exactly", async () => {
    const expectedRequest = { email: "test@example.com", password: "password123" }
    const expectedResponse = {
      user: { id: "1", name: "Test User", email: "test@example.com", role: "admin" },
    }

    mock.onPost("/auth/login").reply((config) => {
      const requestData = JSON.parse(config.data)

      // Verify request structure matches spec
      expect(requestData).toMatchObject(expectedRequest)
      expect(typeof requestData.email).toBe("string")
      expect(typeof requestData.password).toBe("string")

      return [200, expectedResponse]
    })

    const result = await authApi.login("test@example.com", "password123")

    // Verify response structure matches spec
    expect(result).toMatchObject(expectedResponse.user)
    expect(typeof result.id).toBe("string")
    expect(typeof result.name).toBe("string")
    expect(typeof result.email).toBe("string")
    expect(typeof result.role).toBe("string")
  })

  it("should match certificates list contract exactly", async () => {
    const expectedParams = { page: 1, limit: 10, search: "test" }
    const expectedResponse = {
      certificates: [],
      total: 0,
      page: 1,
      totalPages: 1,
    }

    mock.onGet("/certificates").reply((config) => {
      // Verify params structure
      expect(config.params).toMatchObject(expectedParams)
      return [200, expectedResponse]
    })

    const result = await certificatesApi.getAll(expectedParams)

    // Verify response structure
    expect(result).toMatchObject(expectedResponse)
    expect(Array.isArray(result.certificates)).toBe(true)
    expect(typeof result.total).toBe("number")
    expect(typeof result.page).toBe("number")
    expect(typeof result.totalPages).toBe("number")
  })

  it("should match certificate validation contract exactly", async () => {
    const certificateId = "CERT-2024-001"
    const expectedResponse = {
      valid: true,
      certificate: { id: "1", certificateId: "CERT-2024-001" },
      message: "Certificate is valid",
    }

    mock.onGet(`/validate?code=${certificateId}`).reply(200, expectedResponse)

    const result = await certificatesApi.verify(certificateId)

    // Verify response structure
    expect(result).toMatchObject(expectedResponse)
    expect(typeof result.valid).toBe("boolean")
    expect(typeof result.message).toBe("string")
    if (result.certificate) {
      expect(typeof result.certificate.id).toBe("string")
    }
  })
})
