import { NextResponse } from "next/server";

/**
 * Debug endpoint to check if environment variables are set
 * Remove this in production!
 */
export async function GET() {
  // Don't expose sensitive data in production
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({
      error: "This endpoint is disabled in production",
    }, { status: 403 });
  }

  return NextResponse.json({
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    databaseUrlLength: process.env.DATABASE_URL?.length || 0,
    databaseUrlPreview: process.env.DATABASE_URL
      ? `${process.env.DATABASE_URL.substring(0, 30)}...`
      : "NOT SET",
    nodeEnv: process.env.NODE_ENV,
    hasOpenAiKey: !!process.env.OPENAI_API_KEY,
    hasAppUrl: !!process.env.NEXT_PUBLIC_APP_URL,
  });
}


