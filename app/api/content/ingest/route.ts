import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supabase } from "@/lib/supabase";
import { getPlatformAdapter } from "@/lib/ingestion/platform-adapters";
import { detectBrandContent } from "@/lib/detection/brand-detection";
import { inngest } from "@/lib/inngest/client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { platform, contentId, organizationId } = body;

    if (!platform || !contentId || !organizationId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!prisma && !supabase) {
      return NextResponse.json(
        { error: "Database client not available. Please check environment variables." },
        { status: 500 }
      );
    }

    // Fetch content from platform
    const adapter = getPlatformAdapter(platform);
    const platformContent = await adapter.fetchContent(contentId);

    if (!platformContent) {
      return NextResponse.json(
        { error: "Content not found" },
        { status: 404 }
      );
    }

    // Resolve or create creator
    let creator;
    if (prisma) {
      creator = await prisma.creator.findUnique({
      where: {
        platform_platformId: {
          platform: platformContent.platform,
          platformId: platformContent.creator.platformId,
        },
      },
    });

      if (!creator) {
        creator = await prisma.creator.create({
          data: {
            platform: platformContent.platform,
            platformId: platformContent.creator.platformId,
            username: platformContent.creator.username,
            displayName: platformContent.creator.displayName,
            profileImageUrl: platformContent.creator.profileImageUrl,
            followerCount: platformContent.creator.followerCount,
            verified: platformContent.creator.verified || false,
          },
        });
      }
    } else {
      // Use Supabase if Prisma not available
      if (!supabase) {
        return NextResponse.json(
          { error: "Database client not available. Please check environment variables." },
          { status: 500 }
        );
      }
      
      // Find or create creator using Supabase
      const { data: existingCreator } = await supabase
        .from("Creator")
        .select("*")
        .eq("platform", platformContent.platform)
        .eq("platformId", platformContent.creator.platformId)
        .single();
      
      if (existingCreator) {
        creator = existingCreator as any;
      } else {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 15);
        const creatorId = `c${timestamp}${random}`;
        
        const { data: newCreator, error: creatorError } = await supabase
          .from("Creator")
          .insert({
            id: creatorId,
            platform: platformContent.platform,
            platformId: platformContent.creator.platformId,
            username: platformContent.creator.username,
            displayName: platformContent.creator.displayName,
            profileImageUrl: platformContent.creator.profileImageUrl,
            followerCount: platformContent.creator.followerCount,
            verified: platformContent.creator.verified || false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
          .select()
          .single();
        
        if (creatorError) throw creatorError;
        creator = newCreator as any;
      }
    }

    // Check if content already exists and create content item
    let contentItem;
    if (prisma) {
      const existingContent = await prisma.contentItem.findUnique({
        where: {
          platform_platformContentId: {
            platform: platformContent.platform,
            platformContentId: platformContent.platformContentId,
          },
        },
      });

      if (existingContent) {
        return NextResponse.json(
          { error: "Content already ingested", contentId: existingContent.id },
          { status: 409 }
        );
      }

      contentItem = await prisma.contentItem.create({
        data: {
          creatorId: creator.id,
          platform: platformContent.platform,
          platformContentId: platformContent.platformContentId,
          contentType: platformContent.contentType,
          mediaUrl: platformContent.mediaUrl,
          thumbnailUrl: platformContent.thumbnailUrl,
          caption: platformContent.caption,
          publishedAt: platformContent.publishedAt,
        },
      });

      if (platformContent.metrics) {
        await prisma.contentMetricsSnapshot.create({
          data: {
            contentItemId: contentItem.id,
            views: platformContent.metrics.views,
            likes: platformContent.metrics.likes,
            comments: platformContent.metrics.comments,
            shares: platformContent.metrics.shares,
            saves: platformContent.metrics.saves,
          },
        });
      }
    } else {
      // Use Supabase
      if (!supabase) {
        return NextResponse.json(
          { error: "Database client not available." },
          { status: 500 }
        );
      }
      
      // Check if content exists
      const { data: existingContent } = await supabase
        .from("ContentItem")
        .select("id")
        .eq("platform", platformContent.platform)
        .eq("platformContentId", platformContent.platformContentId)
        .single();
      
      if (existingContent) {
        return NextResponse.json(
          { error: "Content already ingested", contentId: existingContent.id },
          { status: 409 }
        );
      }
      
      // Create content item
      const timestamp = Date.now().toString(36);
      const random = Math.random().toString(36).substring(2, 15);
      const contentItemId = `c${timestamp}${random}`;
      
      const { data: newContentItem, error: contentError } = await supabase
        .from("ContentItem")
        .insert({
          id: contentItemId,
          creatorId: creator.id,
          platform: platformContent.platform,
          platformContentId: platformContent.platformContentId,
          contentType: platformContent.contentType,
          mediaUrl: platformContent.mediaUrl,
          thumbnailUrl: platformContent.thumbnailUrl || null,
          caption: platformContent.caption || null,
          publishedAt: platformContent.publishedAt.toISOString(),
          detectedAt: new Date().toISOString(),
          ingestedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .select()
        .single();
      
      if (contentError) throw contentError;
      contentItem = newContentItem as any;
      
      // Create metrics snapshot
      if (platformContent.metrics) {
        const metricsId = `c${Date.now().toString(36)}${Math.random().toString(36).substring(2, 15)}`;
        await supabase.from("ContentMetricsSnapshot").insert({
          id: metricsId,
          contentItemId: contentItem.id,
          views: platformContent.metrics.views,
          likes: platformContent.metrics.likes,
          comments: platformContent.metrics.comments,
          shares: platformContent.metrics.shares,
          saves: platformContent.metrics.saves,
          snapshotAt: new Date().toISOString(),
        });
      }
    }

    // Trigger background processing
    await inngest.send({
      name: "content/process",
      data: {
        contentItemId: contentItem.id,
        organizationId,
      },
    });

    return NextResponse.json({
      success: true,
      contentItemId: contentItem.id,
    });
  } catch (error: any) {
    console.error("Content ingestion error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

