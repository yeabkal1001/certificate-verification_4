import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST() {
  // Clear auth cookies
  cookies().set({
    name: "auth-token",
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0, // Expire immediately
  })

  cookies().set({
    name: "user-role",
    value: "",
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0, // Expire immediately
  })

  return NextResponse.json({ success: true }, { status: 200 })
}
