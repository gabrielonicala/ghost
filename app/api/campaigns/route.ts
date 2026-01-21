import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const organizationId = searchParams.get("organizationId");

    if (!organizationId) {
      return NextResponse.json(
        { error: "organizationId is required" },
        { status: 400 }
      );
    }

    const campaigns = await prisma.campaign.findMany({
      where: { organizationId },
      include: {
        creators: {
          include: {
            creator: true,
          },
        },
        _count: {
          select: { contentItems: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ campaigns });
  } catch (error: any) {
    console.error("Error fetching campaigns:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { organizationId, name, brief, startDate, endDate } = body;

    if (!organizationId || !name) {
      return NextResponse.json(
        { error: "organizationId and name are required" },
        { status: 400 }
      );
    }

    const campaign = await prisma.campaign.create({
      data: {
        organizationId,
        name,
        brief,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        status: "draft",
      },
    });

    return NextResponse.json({ campaign });
  } catch (error: any) {
    console.error("Error creating campaign:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

