import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supabase } from "@/lib/supabase";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!prisma) {
      // Use Supabase if Prisma not available
      if (!supabase) {
        return NextResponse.json(
          { error: "Database client not available. Please check environment variables." },
          { status: 500 }
        );
      }
      
      const { data: contentItem, error } = await supabase
        .from("ContentItem")
        .select("*, creator:Creator(*), conversionScores:ConversionConfidenceScore(*), authenticitySignals:AuthenticitySignal(*), trustMetrics:AudienceTrustMetric(*), fatigueMetrics:UgCFatigueMetric(*), metricsSnapshots:ContentMetricsSnapshot(*)")
        .eq("id", id)
        .single();
      
      if (error || !contentItem) {
        return NextResponse.json(
          { error: "Content not found" },
          { status: 404 }
        );
      }
      
      // Get latest scores
      const latestConversionScore = contentItem.conversionScores?.[0] || null;
      const latestAuthenticitySignal = contentItem.authenticitySignals?.[0] || null;
      const latestTrustMetric = contentItem.trustMetrics?.[0] || null;
      const latestFatigueMetric = contentItem.fatigueMetrics?.[0] || null;
      const latestMetricsSnapshot = contentItem.metricsSnapshots?.[0] || null;
      
      return NextResponse.json({
        ...contentItem,
        conversionScores: latestConversionScore ? [latestConversionScore] : [],
        authenticitySignals: latestAuthenticitySignal ? [latestAuthenticitySignal] : [],
        trustMetrics: latestTrustMetric ? [latestTrustMetric] : [],
        fatigueMetrics: latestFatigueMetric ? [latestFatigueMetric] : [],
        metricsSnapshots: latestMetricsSnapshot ? [latestMetricsSnapshot] : [],
      });
    }
    
    const contentItem = await prisma.contentItem.findUnique({
      where: { id },
      include: {
        creator: true,
      },
    });

    if (!contentItem) {
      return NextResponse.json(
        { error: "Content not found" },
        { status: 404 }
      );
    }

    // Fetch latest scores separately
    let latestConversionScore = null;
    let latestAuthenticitySignal = null;
    let latestTrustMetric = null;
    let latestFatigueMetric = null;
    let latestMetricsSnapshot = null;
    
    if (prisma) {
      [latestConversionScore, latestAuthenticitySignal, latestTrustMetric, latestFatigueMetric, latestMetricsSnapshot] = await Promise.all([
        prisma.conversionConfidenceScore.findFirst({
          where: { contentItemId: id },
          orderBy: { computedAt: "desc" },
        }),
        prisma.authenticitySignal.findFirst({
          where: { contentItemId: id },
          orderBy: { computedAt: "desc" },
        }),
        prisma.audienceTrustMetric.findFirst({
          where: { contentItemId: id },
          orderBy: { computedAt: "desc" },
        }),
        prisma.ugcFatigueMetric.findFirst({
          where: { contentItemId: id },
          orderBy: { computedAt: "desc" },
        }),
        prisma.contentMetricsSnapshot.findFirst({
          where: { contentItemId: id },
          orderBy: { snapshotAt: "desc" },
        }),
      ]);
    }

    return NextResponse.json({
      ...contentItem,
      conversionScores: latestConversionScore ? [latestConversionScore] : [],
      authenticitySignals: latestAuthenticitySignal ? [latestAuthenticitySignal] : [],
      trustMetrics: latestTrustMetric ? [latestTrustMetric] : [],
      fatigueMetrics: latestFatigueMetric ? [latestFatigueMetric] : [],
      metricsSnapshots: latestMetricsSnapshot ? [latestMetricsSnapshot] : [],
    });
  } catch (error: any) {
    console.error("Error fetching content:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

