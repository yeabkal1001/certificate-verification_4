// Mock verification service
interface VerificationResult {
  isValid: boolean
  certificate?: {
    id: string
    recipientName: string
    courseName: string
    institution: string
    issueDate: string
    expiryDate: string
    grade: string
    instructor: string
    certificateNumber: string
  }
  verificationDate: string
  error?: string
}

class VerifyAPI {
  async verifyCertificate(certificateId: string): Promise<VerificationResult> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Mock verification logic
    const isValid = Math.random() > 0.2 // 80% success rate

    if (!isValid) {
      return {
        isValid: false,
        verificationDate: new Date().toISOString(),
        error: "Certificate not found or has been revoked",
      }
    }

    return {
      isValid: true,
      certificate: {
        id: certificateId,
        recipientName: "Almaz Tadesse",
        courseName: "Advanced Makeup Artistry",
        institution: "Ethiopian Beauty Institute",
        issueDate: "2024-01-15",
        expiryDate: "2026-01-15",
        grade: "A+",
        instructor: "Dr. Sarah Johnson",
        certificateNumber: certificateId,
      },
      verificationDate: new Date().toISOString(),
    }
  }
}

export const verifyAPI = new VerifyAPI()
