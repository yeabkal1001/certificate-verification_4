export interface Certificate {
  id: string
  certificateId: string
  recipientName: string
  recipientEmail?: string
  courseName: string
  institution: string
  issueDate: string
  expiryDate?: string
  grade?: string
  instructor?: string
  status: "active" | "revoked" | "expired"
  templateId: string
  createdBy: string
  createdAt: string
  updatedAt: string
  metadata?: Record<string, any>
  verificationCount?: number
}

export interface VerificationResult {
  isValid: boolean
  certificate?: Certificate
  verificationDate: string
  error?: string
}

export interface CertificateStats {
  total: number
  active: number
  revoked: number
  expired: number
  verifications: number
}
