import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, password, role } = body

    // In a real app, validate input and create user in database
    // For now, we'll simulate user creation with mock data

    // Mock user creation
    const user = {
      id: `user-${Date.now()}`,
      name,
      email,
      role,
    }

    // Set HTTP-only cookie with auth token
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
    cookies().set({
      name: "user-role",
      value: user.role,
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 1 week
    })

    return NextResponse.json({ user }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Registration failed" }, { status: 400 })
  }
}
