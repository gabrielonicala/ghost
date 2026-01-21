import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/**
 * Test database connection endpoint using Supabase client
 */
export async function GET() {
  try {
    // Check if Supabase env vars are set
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !supabase) {
      return NextResponse.json(
        {
          success: false,
          error: "Supabase environment variables not set",
          hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
          message: "Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY to Vercel",
        },
        { status: 500 }
      );
    }

    // Test Supabase client connection
    // Just verify the client is initialized - actual queries will be tested elsewhere
    return NextResponse.json({
      success: true,
      message: "Supabase client initialized successfully",
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      note: "Supabase client is ready. Add these env vars to Vercel to fix Prisma connection issues.",
    });
  } catch (error: any) {
    console.error("Database connection test failed:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        code: error.code,
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
        troubleshooting: [
          "1. Check if Supabase project is active",
          "2. Verify NEXT_PUBLIC_SUPABASE_URL is set correctly",
          "3. Verify NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY is set",
          "4. Make sure environment variables are set for all environments in Vercel",
        ],
      },
      { status: 500 }
    );
  }
}

