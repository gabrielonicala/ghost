import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, organizationName } = body;

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

    // Sign up user
    const {
      data: { user },
      error: signUpError,
    } = await supabaseClient.auth.signUp({
      email,
      password,
    });

    if (signUpError || !user) {
      return NextResponse.json(
        { error: signUpError?.message || "Failed to create user" },
        { status: 400 }
      );
    }

    // Create organization
    const orgName = organizationName || `${email.split("@")[0]}'s Organization`;
    let organizationId: string;

    if (prisma) {
      // Create organization first
      const org = await prisma.organization.create({
        data: {
          name: orgName,
        },
      });
      organizationId = org.id;

      // Then create user record with Supabase Auth UUID
      await prisma.user.create({
        data: {
          id: user.id, // Use Supabase Auth UUID
          email: user.email || email,
          organizationId: org.id,
        },
      });
    } else if (supabase) {
      const orgId = `c${Date.now().toString(36)}${Math.random().toString(36).substring(2, 15)}`;
      await supabase.from("Organization").insert({
        id: orgId,
        name: orgName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Create user record with Supabase Auth UUID
      await supabase.from("User").insert({
        id: user.id, // Use Supabase Auth UUID
        email: user.email || email,
        organizationId: orgId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      organizationId = orgId;
    } else {
      throw new Error("No database client available");
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
      },
      organizationId,
    });
  } catch (error: any) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

