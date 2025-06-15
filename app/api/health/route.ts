import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    return NextResponse.json(
      {
        status: "ok",
        timestamp: new Date().toISOString(),
        services: {
          database: "up",
          api: "up",
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Health check failed:", error);
    
    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        services: {
          database: error instanceof Error ? "down" : "unknown",
          api: "up",
        },
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}