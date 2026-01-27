import { NextResponse } from "next/server";

/**
 * Debug endpoint to check if environment variables are set
 * Only shows whether vars exist, not their values (safe for production)
 */
export async function GET() {
  return NextResponse.json({
    nodeEnv: process.env.NODE_ENV,
    vercel: !!process.env.VERCEL,
    // Database
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    // APIs
    hasOpenAiKey: !!process.env.OPENAI_API_KEY,
    hasGoogleCloudKey: !!process.env.GOOGLE_CLOUD_API_KEY,
    hasGoogleApplicationCredentials: !!process.env.GOOGLE_APPLICATION_CREDENTIALS,
    hasGoogleServiceAccountKey: !!process.env.GOOGLE_SERVICE_ACCOUNT_KEY,
    hasApifyToken: !!process.env.APIFY_API_TOKEN,
    apifyTokenLength: process.env.APIFY_API_TOKEN?.length || 0,
    // Supabase
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
    hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    // Inngest
    hasInngestEventKey: !!process.env.INNGEST_EVENT_KEY,
    hasInngestSigningKey: !!process.env.INNGEST_SIGNING_KEY,
    // App
    hasAppUrl: !!process.env.NEXT_PUBLIC_APP_URL,
  });
}




