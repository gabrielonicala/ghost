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
    
    // Only try Prisma if it's available
    if (prisma) {
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
        console.warn("Prisma connection failed, will try Supabase:", prismaError);
        // Don't set creator here - let it fall through to Supabase logic below
      }
    }

    // If creator not found via Prisma, try Supabase
    if (!creator) {
      if (!supabase) {
        throw new Error("Neither Prisma nor Supabase client is available. Please check your environment variables.");
      }
      
      // Use Supabase for queries
      const { data: existingCreator } = await supabase
        .from("Creator")
        .select("*")
        .eq("platform", platform)
        .eq("username", username)
        .single();

      if (existingCreator && !existingCreator.error) {
        creator = existingCreator as any;
      } else {
        // Generate ID using cuid-like format (Prisma uses cuid())
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 15);
        const creatorId = `c${timestamp}${random}`;
        
        const { data: newCreator, error } = await supabase
          .from("Creator")
          .insert({
            id: creatorId,
            platform,
            platformId: `test_${Date.now()}`,
            username,
            displayName: username,
            followerCount: 10000,
            verified: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) {
          console.error("Supabase insert error:", error);
          throw error;
        }
        creator = newCreator as any;
      }
    }

    // Generate a unique content ID
    const platformContentId = `test_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Create content item - try Prisma first, fallback to Supabase
    let contentItem;
    
    if (prisma) {
      try {
        contentItem = await prisma.contentItem.create({
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
      } catch (prismaError: any) {
        console.warn("Prisma content creation failed, using Supabase:", prismaError);
      }
    }
    
    // If content item not created via Prisma, use Supabase
    if (!contentItem) {
      if (!supabase) {
        throw new Error("Prisma connection failed and Supabase client is not available.");
      }
      
      // Generate content item ID
      const timestamp = Date.now().toString(36);
      const random = Math.random().toString(36).substring(2, 15);
      const contentItemId = `c${timestamp}${random}`;
      
      const { data: newContentItem, error: contentError } = await supabase
        .from("ContentItem")
        .insert({
          id: contentItemId,
          creatorId: creator.id,
          platform,
          platformContentId,
          contentType,
          mediaUrl,
          thumbnailUrl: thumbnailUrl || null,
          caption: caption || null,
          publishedAt: new Date().toISOString(),
          detectedAt: new Date().toISOString(),
          ingestedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .select()
        .single();

      if (contentError) {
        console.error("Supabase content insert error:", contentError);
        throw contentError;
      }
      contentItem = newContentItem as any;

      // Create metrics snapshot
      const metricsId = `c${Date.now().toString(36)}${Math.random().toString(36).substring(2, 15)}`;
      const { error: metricsError } = await supabase.from("ContentMetricsSnapshot").insert({
        id: metricsId,
        contentItemId: contentItem.id,
        views: Math.floor(Math.random() * 10000) + 1000,
        likes: Math.floor(Math.random() * 5000) + 500,
        comments: Math.floor(Math.random() * 500) + 50,
        shares: Math.floor(Math.random() * 200) + 20,
        saves: Math.floor(Math.random() * 300) + 30,
        snapshotAt: new Date().toISOString(),
      });

      if (metricsError) {
        console.warn("Failed to create metrics snapshot:", metricsError);
        // Don't throw - content was created successfully
      }
    }

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

