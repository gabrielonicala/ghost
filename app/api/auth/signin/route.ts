import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const supabaseClient = await createServerSupabaseClient();
    if (!supabaseClient) {
      return NextResponse.json(
        { error: "Supabase client not available" },
        { status: 500 }
      );
    }

    const {
      data: { user, session },
      error,
    } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !user || !session) {
      return NextResponse.json(
        { error: error?.message || "Invalid credentials" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (error: any) {
    console.error("Signin error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

