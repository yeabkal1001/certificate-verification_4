import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { initializeApp } from "./lib/init";
import { initRateLimiters } from "./lib/rate-limit";

// Initialize application
try {
  initializeApp();
  
  // Initialize rate limiters
  initRateLimiters().catch(error => {
    console.error('Failed to initialize rate limiters:', error);
  });
} catch (error) {
  console.error('Failed to initialize application:', error);
}

// Paths that don't require authentication
const publicPaths = [
  "/",
  "/verify",
  "/verify/(.*)",
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/api/auth/(.*)",
  "/api/health",
  "/api/instances",
  "/api/certificates/verify",
  "/api/auth/csrf-token",
];

// CORS preflight requests should always be allowed
const isPreflightRequest = (request: NextRequest) => {
  return request.method === 'OPTIONS' && 
         request.headers.get('access-control-request-method') !== null;
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Always allow CORS preflight requests
  if (isPreflightRequest(request)) {
    return new NextResponse(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': process.env.CORS_ALLOWED_ORIGINS || '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With',
        'Access-Control-Max-Age': '3600',
      },
    });
  }

  // Check if the path is public
  const isPublicPath = publicPaths.some(path => 
    new RegExp(`^${path.replace(/\(\.\*\)/g, ".*")}$`).test(pathname)
  );

  if (isPublicPath) {
    return NextResponse.next();
  }

  // Get the token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // If no token and not a public path, redirect to login
  if (!token) {
    const url = new URL("/auth/login", request.url);
    url.searchParams.set("callbackUrl", encodeURI(request.url));
    return NextResponse.redirect(url);
  }

  // Role-based access control
  const userRole = token.role as string;
  
  // Admin-only paths
  if (pathname.startsWith("/admin") && userRole !== "ADMIN") {
    return new NextResponse(
      JSON.stringify({ success: false, message: "Access denied" }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  // Staff-only paths (accessible by admins too)
  if (pathname.startsWith("/staff") && !["ADMIN", "STAFF"].includes(userRole)) {
    return new NextResponse(
      JSON.stringify({ success: false, message: "Access denied" }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  // Add security headers to all responses
  const response = NextResponse.next();
  
  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Add user ID header for CSRF protection
  if (token && token.sub) {
    response.headers.set('X-User-ID', token.sub as string);
  }
  
  return response;
}