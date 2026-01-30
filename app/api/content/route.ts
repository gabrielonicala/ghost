import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const sortBy = searchParams.get("sortBy") || "publishedAt";
    const order = searchParams.get("order") || "desc";
    const minScore = searchParams.get("minScore")
      ? parseInt(searchParams.get("minScore")!)
      : undefined;

    if (!prisma) {
      // Use Supabase if Prisma not available
      if (!supabase) {
        return NextResponse.json(
          { error: "Database client not available. Please check environment variables." },
          { status: 500 }
        );
      }
      
      let query = supabase
        .from("ContentItem")
        .select("*, creator:Creator(*), conversionScores:ConversionConfidenceScore(*), metricsSnapshots:ContentMetricsSnapshot(*, order:snapshotAt.desc), ocrFrames:ContentOcrFrame(*), transcripts:ContentTranscript(*, order:createdAt.desc)")
        .range((page - 1) * limit, page * limit - 1)
        .limit(limit);
      
      if (minScore !== undefined) {
        // Filter by score using a join
        query = query.eq("conversionScores.score", minScore);
      }
      
      const { data: contentItems, error, count } = await query.order(sortBy, { ascending: order === "asc" });
      if (error) throw error;
      
      return NextResponse.json({
        contentItems: contentItems || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        },
      });
    }

    const where: any = {};
    if (minScore !== undefined) {
      where.conversionScores = {
        some: {
          score: { gte: minScore },
        },
      };
    }

    const [contentItems, total] = await Promise.all([
      prisma.contentItem.findMany({
        where,
        include: {
          creator: true,
          conversionScores: true,
          metricsSnapshots: {
            orderBy: { snapshotAt: "desc" }, // Get latest metrics first
            take: 1, // Only need the latest
          },
          ocrFrames: true, // Include OCR frames
          transcripts: {
            orderBy: { createdAt: "desc" }, // Get latest transcript first
            take: 1, // Only need the latest (avoid duplicates)
          },
          authenticitySignals: true,
          trustMetrics: true,
        },
        orderBy: { [sortBy]: order },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.contentItem.count({ where }),
    ]);

    // Get latest scores for each item (simplified - just return what we have)
    const itemsWithLatestScores = contentItems;

    return NextResponse.json({
      contentItems: itemsWithLatestScores,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Error fetching content:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

