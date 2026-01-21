import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supabase } from "@/lib/supabase";

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

    if (!prisma) {
      // Use Supabase if Prisma not available
      if (!supabase) {
        return NextResponse.json(
          { error: "Database client not available. Please check environment variables." },
          { status: 500 }
        );
      }
      const { data: campaigns, error } = await supabase
        .from("Campaign")
        .select("*, creators:CampaignCreator(*, creator:Creator(*))")
        .eq("organizationId", organizationId)
        .order("createdAt", { ascending: false });
      
      if (error) throw error;
      return NextResponse.json({ campaigns: campaigns || [] });
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

    if (!prisma) {
      if (!supabase) {
        return NextResponse.json(
          { error: "Database client not available. Please check environment variables." },
          { status: 500 }
        );
      }
      // Generate ID
      const timestamp = Date.now().toString(36);
      const random = Math.random().toString(36).substring(2, 15);
      const campaignId = `c${timestamp}${random}`;
      
      const { data: campaign, error } = await supabase
        .from("Campaign")
        .insert({
          id: campaignId,
          organizationId,
          name,
          brief: brief || null,
          startDate: startDate ? new Date(startDate).toISOString() : null,
          endDate: endDate ? new Date(endDate).toISOString() : null,
          status: "draft",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .select()
        .single();
      
      if (error) throw error;
      return NextResponse.json({ campaign });
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

