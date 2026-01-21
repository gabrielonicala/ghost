import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { inngest } from "@/lib/inngest/client";

/**
 * Test endpoint to add sample content for testing
 * This bypasses platform APIs and creates content directly
 */
export async function POST(request: NextRequest) {
  try {
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

    // Create or find creator
    let creator = await prisma.creator.findFirst({
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
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

