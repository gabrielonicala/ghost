import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabaseClient = await createServerSupabaseClient();
    if (!supabaseClient) {
      return NextResponse.json(
        { error: "Supabase client not available" },
        { status: 500 }
      );
    }

    await supabaseClient.auth.signOut();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Signout error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

