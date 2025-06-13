import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET() {
  try {
    // Get auth token from cookies
    const token = cookies().get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // In a real app, validate token and get user from database
    // For now, we'll simulate user data based on token

    // Mock user data
    let user
    if (token.includes("admin")) {
      user = {
        id: "admin-123",
        name: "Admin User",
        email: "admin@ims-certify.com",
        role: "admin",
      }
    } else if (token.includes("staff")) {
      user = {
        id: "staff-456",
        name: "Staff Member",
        email: "staff@ims-certify.com",
        role: "staff",
      }
    } else {
      user = {
        id: "student-789",
        name: "Almaz Tadesse",
        email: "almaz@example.com",
        role: "student",
      }
    }

    return NextResponse.json({ user }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: "Authentication failed" }, { status: 401 })
  }
}
