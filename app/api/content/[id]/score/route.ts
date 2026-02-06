import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supabase } from "@/lib/supabase";
import { calculateACCS } from "@/lib/scoring/accs";

/** Simple word-overlap similarity between two texts (0–1). Used when we don't have embeddings. */
function captionSimilarity(a: string | null | undefined, b: string | null | undefined): number {
  if (!a || !b || !a.trim() || !b.trim()) return 0.5;
  const wordsA = new Set(a.toLowerCase().split(/\s+/).filter((w) => w.length > 1));
  const wordsB = new Set(b.toLowerCase().split(/\s+/).filter((w) => w.length > 1));
  if (wordsA.size === 0 || wordsB.size === 0) return 0.5;
  let overlap = 0;
  wordsA.forEach((w) => {
    if (wordsB.has(w)) overlap++;
  });
  return overlap / Math.max(wordsA.size, wordsB.size);
}

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

    // Fetch content item, latest transcript, metrics, and related content
    let contentItem: any;
    let latestMetrics: any = null;
    let latestTranscriptText: string | undefined;
    let creatorPromotions: any[] = [];
    let similarContent: Array<{ id: string; caption?: string | null; structure?: Record<string, unknown> }> = [];

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

      const latestTranscript = await prisma.contentTranscript.findFirst({
        where: { contentItemId: id },
        orderBy: { createdAt: "desc" },
        select: { text: true },
      });
      latestTranscriptText = latestTranscript?.text;

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
        select: { id: true, caption: true },
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

      const { data: transcriptRow } = await supabase
        .from("ContentTranscript")
        .select("text")
        .eq("contentItemId", id)
        .order("createdAt", { ascending: false })
        .limit(1)
        .maybeSingle();
      latestTranscriptText = transcriptRow?.text;

      const { data: similar } = await supabase
        .from("ContentItem")
        .select("id, caption")
        .eq("creatorId", contentItem.creatorId)
        .neq("id", id)
        .limit(10);
      similarContent = (similar || []).map((item: { id: string; caption?: string | null }) => ({
        id: item.id,
        caption: item.caption,
        structure: {},
      }));
    } else {
      return NextResponse.json(
        { error: "Database client not available" },
        { status: 500 }
      );
    }

    const currentCaption = contentItem.caption ?? undefined;
    const similarWithSimilarity = similarContent.map((item: { id: string; caption?: string | null }) => ({
      id: item.id,
      structure: {} as { hookType?: string; visualComposition?: string; audioTrend?: string },
      similarity: captionSimilarity(currentCaption, item.caption),
    }));

    // Calculate ACCS score (uses transcript when available for authenticity)
    const score = await calculateACCS({
      contentItemId: contentItem.id,
      transcript: latestTranscriptText,
      caption: currentCaption,
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
      similarContent: similarWithSimilarity,
    });

    // Save scores to database (upsert so recalculate updates existing row; DB allows only one score per content)
    if (prisma) {
      await prisma.conversionConfidenceScore.upsert({
        where: { contentItemId: contentItem.id },
        create: {
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
        update: {
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
      const now = new Date().toISOString();
      const { data: existingScore } = await supabase
        .from("ConversionConfidenceScore")
        .select("id")
        .eq("contentItemId", contentItem.id)
        .maybeSingle();

      const scorePayload = {
        score: score.score,
        authenticityScore: score.authenticity.score,
        audienceTrustScore: score.audienceTrust.score,
        promotionSaturationScore: score.promotionSaturation.score,
        fatigueRiskScore: score.fatigueRisk.score,
        predictedPerformanceTier: score.predictedPerformanceTier,
        recommendedUse: score.recommendedUse,
        confidenceInterval: score.confidenceInterval,
        reasonAttribution: score.reasonAttribution,
        computedAt: now,
        updatedAt: now,
      };

      if (existingScore?.id) {
        const { error: scoreError } = await supabase
          .from("ConversionConfidenceScore")
          .update(scorePayload)
          .eq("id", existingScore.id);
        if (scoreError) {
          console.error("ConversionConfidenceScore update error:", scoreError);
          return NextResponse.json(
            { error: scoreError.message || "Failed to update score" },
            { status: 500 }
          );
        }
      } else {
        const scoreId = `c${Date.now().toString(36)}${Math.random().toString(36).substring(2, 15)}`;
        const { error: scoreError } = await supabase.from("ConversionConfidenceScore").insert({
          id: scoreId,
          contentItemId: contentItem.id,
          ...scorePayload,
        });
        if (scoreError) {
          console.error("ConversionConfidenceScore insert error:", scoreError);
          return NextResponse.json(
            { error: scoreError.message || "Failed to save score" },
            { status: 500 }
          );
        }
      }

      const authId = `c${Date.now().toString(36)}${Math.random().toString(36).substring(2, 15)}`;
      const { error: authError } = await supabase.from("AuthenticitySignal").insert({
        id: authId,
        contentItemId: contentItem.id,
        creatorId: contentItem.creatorId,
        score: score.authenticity.score,
        scriptLikelihood: score.authenticity.scriptLikelihood,
        reusedHookDetected: score.authenticity.reusedHookDetected,
        reasonBreakdown: { reasons: score.authenticity.reasons },
        computedAt: now,
      });
      if (authError) console.warn("AuthenticitySignal insert (non-fatal):", authError.message);

      if (latestMetrics) {
        const trustId = `c${Date.now().toString(36)}${Math.random().toString(36).substring(2, 15)}`;
        const { error: trustError } = await supabase.from("AudienceTrustMetric").insert({
          id: trustId,
          contentItemId: contentItem.id,
          trustIndex: score.audienceTrust.score,
          engagementQualityGrade: score.audienceTrust.engagementQualityGrade,
          purchaseIntentConfidence: score.audienceTrust.purchaseIntentConfidence,
          computedAt: now,
        });
        if (trustError) console.warn("AudienceTrustMetric insert (non-fatal):", trustError.message);
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




