import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
    const [latestConversionScore, latestAuthenticitySignal, latestTrustMetric, latestFatigueMetric, latestMetricsSnapshot] = await Promise.all([
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

