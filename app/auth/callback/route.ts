import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { redirect } from "next/navigation";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/";

  if (code) {
    const supabase = await createServerSupabaseClient();
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        // Redirect to the home page or the next parameter
        return NextResponse.redirect(new URL(next, requestUrl.origin));
      }
    }
  }

  // If there's an error or no code, redirect to login
  return NextResponse.redirect(new URL("/login?error=auth_failed", requestUrl.origin));
}

