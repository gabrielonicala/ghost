import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
          conversionScores: {
            orderBy: { computedAt: "desc" },
            take: 1,
          },
          metricsSnapshots: {
            orderBy: { snapshotAt: "desc" },
            take: 1,
          },
        },
        orderBy: sortBy === "score"
          ? {
              conversionScores: {
                _count: "desc",
              },
            }
          : { [sortBy]: order },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.contentItem.count({ where }),
    ]);

    return NextResponse.json({
      contentItems,
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

