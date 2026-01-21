import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supabase } from "@/lib/supabase";
import { inngest } from "@/lib/inngest/client";

/**
 * Test endpoint to add sample content for testing
 * This bypasses platform APIs and creates content directly
 */
export async function POST(request: NextRequest) {
  try {
    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        {
          error: "DATABASE_URL is not set in environment variables",
          hint: "Please add DATABASE_URL to your Vercel environment variables",
        },
        { status: 500 }
      );
    }

    const body = await request.json();
    const {
      platform = "instagram",
      username = "test_creator",
      caption = "Check out this amazing product! #sponsored",
      mediaUrl = "https://via.placeholder.com/1080x1080",
      thumbnailUrl = "https://via.placeholder.com/400x400",
      contentType = "image",
      organizationId,
    } = body;

    // Create or find creator - try Prisma first, fallback to Supabase
    let creator;
    try {
      creator = await prisma.creator.findFirst({
        where: {
          platform,
          username,
        },
      });

      if (!creator) {
        creator = await prisma.creator.create({
          data: {
            platform,
            platformId: `test_${Date.now()}`,
            username,
            displayName: username,
            followerCount: 10000,
            verified: false,
          },
        });
      }
    } catch (prismaError: any) {
      // If Prisma fails and Supabase is available, try using Supabase client
      if (!supabase) {
        throw new Error("Prisma connection failed and Supabase client is not available. Please check your environment variables.");
      }
      
      console.warn("Prisma connection failed, trying Supabase client:", prismaError);
      
      // Use Supabase for queries if Prisma doesn't work
      const { data: existingCreator } = await supabase
        .from("Creator")
        .select("*")
        .eq("platform", platform)
        .eq("username", username)
        .single();

      if (existingCreator) {
        creator = existingCreator as any;
      } else {
        const { data: newCreator, error } = await supabase
          .from("Creator")
          .insert({
            platform,
            platformId: `test_${Date.now()}`,
            username,
            displayName: username,
            followerCount: 10000,
            verified: false,
          })
          .select()
          .single();

        if (error) throw error;
        creator = newCreator as any;
      }
    }

    // Generate a unique content ID
    const platformContentId = `test_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Create content item
    const contentItem = await prisma.contentItem.create({
      data: {
        creatorId: creator.id,
        platform,
        platformContentId,
        contentType,
        mediaUrl,
        thumbnailUrl,
        caption,
        publishedAt: new Date(),
      },
    });

    // Create initial metrics snapshot
    await prisma.contentMetricsSnapshot.create({
      data: {
        contentItemId: contentItem.id,
        views: Math.floor(Math.random() * 10000) + 1000,
        likes: Math.floor(Math.random() * 5000) + 500,
        comments: Math.floor(Math.random() * 500) + 50,
        shares: Math.floor(Math.random() * 200) + 20,
        saves: Math.floor(Math.random() * 300) + 30,
      },
    });

    // Trigger background processing (ACCS scoring)
    if (organizationId) {
      await inngest.send({
        name: "content/process",
        data: {
          contentItemId: contentItem.id,
          organizationId,
        },
      });
    }

    return NextResponse.json({
      success: true,
      contentItemId: contentItem.id,
      message: "Test content created successfully",
    });
  } catch (error: any) {
    console.error("Error creating test content:", error);
    
    // Provide helpful error messages
    if (error.code === "P1001") {
      return NextResponse.json(
        {
          error: "Cannot reach database server",
          details: error.message,
          troubleshooting: [
            "1. Check if Supabase project is paused (go to Supabase dashboard and resume if needed)",
            "2. Verify DATABASE_URL is set correctly in Vercel environment variables",
            "3. Make sure DATABASE_URL is enabled for all environments (Production, Preview, Development)",
            "4. Check that the connection string uses direct connection (port 5432, not 6543)",
          ],
        },
        { status: 500 }
      );
    }

    if (error.message?.includes("DATABASE_URL")) {
      return NextResponse.json(
        {
          error: "Database configuration error",
          details: error.message,
          hint: "DATABASE_URL environment variable is missing or incorrect",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

