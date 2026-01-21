import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supabase } from "@/lib/supabase";
import { calculateACCS } from "@/lib/scoring/accs";

/**
 * Calculate and save ACCS score for a content item
 * This is a direct endpoint that runs immediately (no background job needed)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { organizationId } = body;

    if (!organizationId) {
      return NextResponse.json(
        { error: "organizationId is required" },
        { status: 400 }
      );
    }

    // Fetch content item
    let contentItem: any;
    let latestMetrics: any = null;
    let creatorPromotions: any[] = [];
    let similarContent: any[] = [];

    if (prisma) {
      contentItem = await prisma.contentItem.findUnique({
        where: { id },
        include: { creator: true },
      });

      if (!contentItem) {
        return NextResponse.json(
          { error: "Content not found" },
          { status: 404 }
        );
      }

      latestMetrics = await prisma.contentMetricsSnapshot.findFirst({
        where: { contentItemId: id },
        orderBy: { snapshotAt: "desc" },
      });

      creatorPromotions = await prisma.contentItem.findMany({
        where: {
          creatorId: contentItem.creatorId,
          id: { not: id },
          publishedAt: { lt: contentItem.publishedAt },
        },
        orderBy: { publishedAt: "desc" },
        take: 20,
        select: {
          caption: true,
          publishedAt: true,
        },
      });

      similarContent = await prisma.contentItem.findMany({
        where: {
          creatorId: contentItem.creatorId,
          id: { not: id },
        },
        take: 10,
      });
    } else if (supabase) {
      const { data: item, error: itemError } = await supabase
        .from("ContentItem")
        .select("*, creator:Creator(*)")
        .eq("id", id)
        .single();

      if (itemError || !item) {
        return NextResponse.json(
          { error: "Content not found" },
          { status: 404 }
        );
      }
      contentItem = item;

      const { data: metrics } = await supabase
        .from("ContentMetricsSnapshot")
        .select("*")
        .eq("contentItemId", id)
        .order("snapshotAt", { ascending: false })
        .limit(1)
        .single();
      latestMetrics = metrics;

      const { data: promotions } = await supabase
        .from("ContentItem")
        .select("caption, publishedAt")
        .eq("creatorId", contentItem.creatorId)
        .neq("id", id)
        .lt("publishedAt", contentItem.publishedAt)
        .order("publishedAt", { ascending: false })
        .limit(20);
      creatorPromotions = promotions || [];

      const { data: similar } = await supabase
        .from("ContentItem")
        .select("id")
        .eq("creatorId", contentItem.creatorId)
        .neq("id", id)
        .limit(10);
      similarContent = (similar || []).map((item: { id: string }) => ({
        id: item.id,
        structure: {},
        similarity: 0.5,
      }));
    } else {
      return NextResponse.json(
        { error: "Database client not available" },
        { status: 500 }
      );
    }

    // Calculate ACCS score
    const score = await calculateACCS({
      contentItemId: contentItem.id,
      transcript: undefined, // Would come from ContentTranscript
      caption: contentItem.caption || undefined,
      engagementMetrics: latestMetrics
        ? {
            views: latestMetrics.views || undefined,
            likes: latestMetrics.likes || undefined,
            comments: latestMetrics.comments || undefined,
            shares: latestMetrics.shares || undefined,
            saves: latestMetrics.saves || undefined,
          }
        : undefined,
      creatorHistory: {
        previousPromotions: creatorPromotions
          .map((p: { caption: string | null }) => p.caption || "")
          .filter((c: string) => c.length > 0),
        scriptPatterns: [],
        promotionalPosts: creatorPromotions.map((p: { publishedAt: Date | string }) => ({
          date: typeof p.publishedAt === "string" ? new Date(p.publishedAt) : p.publishedAt,
        })),
      },
      similarContent: similarContent.map((item: { id: string }) => ({
        id: item.id,
        structure: {},
        similarity: 0.5,
      })),
    });

    // Save scores to database
    if (prisma) {
      await prisma.conversionConfidenceScore.create({
        data: {
          contentItemId: contentItem.id,
          score: score.score,
          authenticityScore: score.authenticity.score,
          audienceTrustScore: score.audienceTrust.score,
          promotionSaturationScore: score.promotionSaturation.score,
          fatigueRiskScore: score.fatigueRisk.score,
          predictedPerformanceTier: score.predictedPerformanceTier,
          recommendedUse: score.recommendedUse,
          confidenceInterval: score.confidenceInterval,
          reasonAttribution: score.reasonAttribution,
        },
      });

      await prisma.authenticitySignal.create({
        data: {
          contentItemId: contentItem.id,
          creatorId: contentItem.creatorId,
          score: score.authenticity.score,
          scriptLikelihood: score.authenticity.scriptLikelihood,
          reusedHookDetected: score.authenticity.reusedHookDetected,
          reasonBreakdown: { reasons: score.authenticity.reasons },
        },
      });

      if (latestMetrics) {
        await prisma.audienceTrustMetric.create({
          data: {
            contentItemId: contentItem.id,
            trustIndex: score.audienceTrust.score,
            engagementQualityGrade: score.audienceTrust.engagementQualityGrade,
            purchaseIntentConfidence: score.audienceTrust.purchaseIntentConfidence,
          },
        });
      }
    } else if (supabase) {
      const scoreId = `c${Date.now().toString(36)}${Math.random().toString(36).substring(2, 15)}`;
      await supabase.from("ConversionConfidenceScore").insert({
        id: scoreId,
        contentItemId: contentItem.id,
        score: score.score,
        authenticityScore: score.authenticity.score,
        audienceTrustScore: score.audienceTrust.score,
        promotionSaturationScore: score.promotionSaturation.score,
        fatigueRiskScore: score.fatigueRisk.score,
        predictedPerformanceTier: score.predictedPerformanceTier,
        recommendedUse: score.recommendedUse,
        confidenceInterval: score.confidenceInterval,
        reasonAttribution: score.reasonAttribution,
        computedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const authId = `c${Date.now().toString(36)}${Math.random().toString(36).substring(2, 15)}`;
      await supabase.from("AuthenticitySignal").insert({
        id: authId,
        contentItemId: contentItem.id,
        creatorId: contentItem.creatorId,
        score: score.authenticity.score,
        scriptLikelihood: score.authenticity.scriptLikelihood,
        reusedHookDetected: score.authenticity.reusedHookDetected,
        reasonBreakdown: { reasons: score.authenticity.reasons },
        computedAt: new Date().toISOString(),
      });

      if (latestMetrics) {
        const trustId = `c${Date.now().toString(36)}${Math.random().toString(36).substring(2, 15)}`;
        await supabase.from("AudienceTrustMetric").insert({
          id: trustId,
          contentItemId: contentItem.id,
          trustIndex: score.audienceTrust.score,
          engagementQualityGrade: score.audienceTrust.engagementQualityGrade,
          purchaseIntentConfidence: score.audienceTrust.purchaseIntentConfidence,
          computedAt: new Date().toISOString(),
        });
      }
    }

    return NextResponse.json({
      success: true,
      score,
      message: "ACCS score calculated and saved",
    });
  } catch (error: any) {
    console.error("Error calculating ACCS score:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

