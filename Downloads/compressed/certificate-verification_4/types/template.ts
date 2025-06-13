export interface CertificateTemplate {
  id: string
  name: string
  description: string
  category: "modern" | "professional" | "artistic" | "academic"
  backgroundImage: string
  orientation: "landscape" | "portrait"
  status: "active" | "draft" | "archived"
  createdAt: string
  updatedAt: string

  // Layout configuration
  layout: {
    // Text field positions (percentage-based)
    recipientName: { x: number; y: number; width: number; height: number }
    courseName: { x: number; y: number; width: number; height: number }
    issueDate: { x: number; y: number; width: number; height: number }
    certificateId: { x: number; y: number; width: number; height: number }
    grade?: { x: number; y: number; width: number; height: number }
    institution: { x: number; y: number; width: number; height: number }

    // Signature and QR positions
    signature: { x: number; y: number; width: number; height: number }
    qrCode: { x: number; y: number; width: number; height: number }

    // Logo position (optional)
    logo?: { x: number; y: number; width: number; height: number }
  }

  // Styling configuration
  styling: {
    recipientName: TextStyle
    courseName: TextStyle
    issueDate: TextStyle
    certificateId: TextStyle
    grade?: TextStyle
    institution: TextStyle
    signatureName: TextStyle
    signatureTitle: TextStyle
  }

  // Template variables
  variables: string[] // e.g., ['{{recipientName}}', '{{courseName}}', etc.]
}

export interface TextStyle {
  fontFamily: string
  fontSize: number
  fontWeight: "normal" | "bold" | "light"
  color: string
  textAlign: "left" | "center" | "right"
  textTransform?: "uppercase" | "lowercase" | "capitalize"
}

export interface Signature {
  id: string
  name: string
  title: string
  imageUrl: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface BulkCertificateData {
  recipientName: string
  recipientEmail?: string
  courseName: string
  grade?: string
  issueDate?: string
  additionalData?: Record<string, string>
}
