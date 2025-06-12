import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body

    // In a real app, validate credentials against a database
    // For now, we'll simulate authentication with mock data

    // Mock user data based on email
    let user
    if (email.includes("admin")) {
      user = {
        id: "admin-123",
        name: "Admin User",
        email,
        role: "admin",
      }
    } else if (email.includes("staff")) {
      user = {
        id: "staff-456",
        name: "Staff Member",
        email,
        role: "staff",
      }
    } else {
      user = {
        id: "student-789",
        name: "Almaz Tadesse",
        email,
        role: "student",
      }
    }

    // Set HTTP-only cookie with auth token
    // In a real app, this would be a JWT or session token
    const token = `mock-token-${Date.now()}`

    cookies().set({
      name: "auth-token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 1 week
    })

    // Also set a user-role cookie that is readable by client-side JS
    // This is for UI purposes only, actual authorization should happen server-side
    cookies().set({
      name: "user-role",
      value: user.role,
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 1 week
    })

    return NextResponse.json({ user }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: "Authentication failed" }, { status: 401 })
  }
}
