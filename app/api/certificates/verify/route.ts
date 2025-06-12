import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { certificateId } = body

    // In a real app, verify certificate against database
    // For now, we'll simulate verification with mock data

    // Mock verification result
    const isValid = certificateId.startsWith("CERT-")

    if (!isValid) {
      return NextResponse.json(
        {
          isValid: false,
          error: "Certificate not found or invalid",
        },
        { status: 200 },
      )
    }

    // Generate mock certificate data
    const certificate = {
      id: certificateId,
      recipientName: "Almaz Tadesse",
      courseName: certificateId.includes("001")
        ? "Basic Makeup Course"
        : certificateId.includes("002")
          ? "Advanced Artistry"
          : "Bridal Makeup Specialist",
      institution: "Ethiopian Beauty Institute",
      issueDate: "2024-01-15",
      expiryDate: "2026-01-15",
      grade: "A+",
      instructor: "Dr. Sarah Johnson",
      certificateNumber: certificateId,
      status: "active",
      verificationCount: Math.floor(Math.random() * 10) + 1,
    }

    return NextResponse.json(
      {
        isValid: true,
        certificate,
        verificationDate: new Date().toISOString(),
      },
      { status: 200 },
    )
  } catch (error) {
    return NextResponse.json({ error: "Verification failed" }, { status: 400 })
  }
}
