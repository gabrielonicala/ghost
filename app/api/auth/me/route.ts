import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/get-user";

export async function GET() {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      organizationId: user.organizationId,
    });
  } catch (error: any) {
    console.error("Error getting user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

