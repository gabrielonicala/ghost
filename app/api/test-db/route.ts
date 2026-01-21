import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Test database connection endpoint
 */
export async function GET() {
  try {
    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        {
          success: false,
          error: "DATABASE_URL is not set",
          message: "Please add DATABASE_URL to your Vercel environment variables",
        },
        { status: 500 }
      );
    }

    // Try a simple query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    
    return NextResponse.json({
      success: true,
      message: "Database connection successful",
      hasDatabaseUrl: true,
      databaseHost: process.env.DATABASE_URL?.split("@")[1]?.split(":")[0] || "unknown",
    });
  } catch (error: any) {
    console.error("Database connection test failed:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        code: error.code,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        databaseHost: process.env.DATABASE_URL?.split("@")[1]?.split(":")[0] || "unknown",
        troubleshooting: error.code === "P1001" ? [
          "1. Supabase project might be paused - check dashboard and resume",
          "2. DATABASE_URL might be incorrect in Vercel",
          "3. Connection string format might be wrong",
        ] : [],
      },
      { status: 500 }
    );
  }
}

