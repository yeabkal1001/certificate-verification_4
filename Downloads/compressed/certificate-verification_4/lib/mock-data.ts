export interface Certificate {
  id: string
  certificateId: string
  recipientName: string
  courseName: string
  issueDate: string
  issuer: string
  grade: string
  status: "active" | "revoked" | "expired"
  createdAt: string
  updatedAt: string
}

export interface User {
  id: string
  name: string
  email: string
  role: "admin" | "student"
  createdAt: string
}

export interface VerificationLog {
  id: string
  certificateId: string
  timestamp: string
  ipAddress: string
  userAgent: string
  status: "success" | "failed"
}

export const mockCertificates: Certificate[] = [
  {
    id: "cert_1",
    certificateId: "CERT-2024-0001",
    recipientName: "Emma Johnson",
    courseName: "Professional Makeup Artistry",
    issueDate: "2024-03-15",
    issuer: "Glamour Academy",
    grade: "Distinction",
    status: "active",
    createdAt: "2024-03-15T10:00:00Z",
    updatedAt: "2024-03-15T10:00:00Z",
  },
  {
    id: "cert_2",
    certificateId: "CERT-2024-0002",
    recipientName: "Sophia Williams",
    courseName: "Advanced SFX Makeup Techniques",
    issueDate: "2024-02-28",
    issuer: "Glamour Academy",
    grade: "Excellence",
    status: "active",
    createdAt: "2024-02-28T14:30:00Z",
    updatedAt: "2024-02-28T14:30:00Z",
  },
  {
    id: "cert_3",
    certificateId: "CERT-2024-0003",
    recipientName: "Olivia Davis",
    courseName: "Bridal Makeup Masterclass",
    issueDate: "2024-04-10",
    issuer: "Glamour Academy",
    grade: "Distinction",
    status: "active",
    createdAt: "2024-04-10T09:15:00Z",
    updatedAt: "2024-04-10T09:15:00Z",
  },
  {
    id: "cert_4",
    certificateId: "CERT-2024-0004",
    recipientName: "Admin User",
    courseName: "Fashion Makeup Artistry",
    issueDate: "2024-01-20",
    issuer: "Glamour Academy",
    grade: "Excellence",
    status: "active",
    createdAt: "2024-01-20T11:45:00Z",
    updatedAt: "2024-01-20T11:45:00Z",
  },
]

export const mockUsers: User[] = [
  {
    id: "1",
    name: "Admin User",
    email: "admin@ims.com",
    role: "admin",
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "2",
    name: "Student User",
    email: "student@ims.com",
    role: "student",
    createdAt: "2024-01-15T00:00:00Z",
  },
  {
    id: "3",
    name: "Emma Johnson",
    email: "emma.johnson@email.com",
    role: "student",
    createdAt: "2024-02-01T00:00:00Z",
  },
  {
    id: "4",
    name: "Sophia Williams",
    email: "sophia.williams@email.com",
    role: "student",
    createdAt: "2024-02-15T00:00:00Z",
  },
  {
    id: "5",
    name: "Olivia Davis",
    email: "olivia.davis@email.com",
    role: "student",
    createdAt: "2024-03-01T00:00:00Z",
  },
]

export const mockVerificationLogs: VerificationLog[] = [
  {
    id: "log_1",
    certificateId: "CERT-2024-0001",
    timestamp: "2024-04-15T10:30:00Z",
    ipAddress: "192.168.1.100",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    status: "success",
  },
  {
    id: "log_2",
    certificateId: "CERT-2024-0002",
    timestamp: "2024-04-15T11:15:00Z",
    ipAddress: "192.168.1.101",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    status: "success",
  },
  {
    id: "log_3",
    certificateId: "CERT-INVALID-001",
    timestamp: "2024-04-15T12:00:00Z",
    ipAddress: "192.168.1.102",
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X)",
    status: "failed",
  },
  {
    id: "log_4",
    certificateId: "CERT-2024-0003",
    timestamp: "2024-04-15T13:45:00Z",
    ipAddress: "192.168.1.103",
    userAgent: "Mozilla/5.0 (Android 11; Mobile; rv:68.0) Gecko/68.0 Firefox/88.0",
    status: "success",
  },
]
