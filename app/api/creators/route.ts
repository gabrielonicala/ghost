import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const platform = searchParams.get("platform");
    const search = searchParams.get("search");

    if (!prisma) {
      // Use Supabase if Prisma not available
      if (!supabase) {
        return NextResponse.json(
          { error: "Database client not available. Please check environment variables." },
          { status: 500 }
        );
      }
      
      let query = supabase.from("Creator").select("*").limit(50);
      if (platform) {
        query = query.eq("platform", platform);
      }
      if (search) {
        query = query.or(`username.ilike.%${search}%,displayName.ilike.%${search}%`);
      }
      
      const { data: creators, error } = await query.order("createdAt", { ascending: false });
      if (error) throw error;
      return NextResponse.json({ creators: creators || [] });
    }

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

