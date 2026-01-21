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
        conversionScores: {
          orderBy: { computedAt: "desc" },
          take: 1,
        },
        authenticitySignals: {
          orderBy: { computedAt: "desc" },
          take: 1,
        },
        trustMetrics: {
          orderBy: { computedAt: "desc" },
          take: 1,
        },
        fatigueMetrics: {
          orderBy: { computedAt: "desc" },
          take: 1,
        },
        metricsSnapshots: {
          orderBy: { snapshotAt: "desc" },
          take: 1,
        },
      },
    });

    if (!contentItem) {
      return NextResponse.json(
        { error: "Content not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(contentItem);
  } catch (error: any) {
    console.error("Error fetching content:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

