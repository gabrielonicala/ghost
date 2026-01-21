import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const platform = searchParams.get("platform");
    const search = searchParams.get("search");

    const where: any = {};
    if (platform) {
      where.platform = platform;
    }
    if (search) {
      where.OR = [
        { username: { contains: search, mode: "insensitive" } },
        { displayName: { contains: search, mode: "insensitive" } },
      ];
    }

    const creators = await prisma.creator.findMany({
      where,
      include: {
        _count: {
          select: { contentItems: true },
        },
        authenticitySignals: {
          orderBy: { computedAt: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ creators });
  } catch (error: any) {
    console.error("Error fetching creators:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

