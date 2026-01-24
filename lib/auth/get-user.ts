import { createServerSupabaseClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { supabase } from "@/lib/supabase";

export interface AuthenticatedUser {
  id: string;
  email: string;
  organizationId: string;
}

/**
 * Get the authenticated user and their organization
 * Returns null if not authenticated
 */
export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  try {
    const supabaseClient = await createServerSupabaseClient();
    if (!supabaseClient) {
      return null;
    }

    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return null;
    }

    // Get user's organization from database
    let organizationId: string | null = null;

    if (prisma) {
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { organizationId: true },
      });
      organizationId = dbUser?.organizationId || null;
    } else if (supabase) {
      const { data: dbUser } = await supabase
        .from("User")
        .select("organizationId")
        .eq("id", user.id)
        .single();
      organizationId = dbUser?.organizationId || null;
    }

    if (!organizationId) {
      // User exists but has no organization - create one
      organizationId = await createOrganizationForUser(user.id, user.email || "");
    }

    return {
      id: user.id,
      email: user.email || "",
      organizationId,
    };
  } catch (error) {
    console.error("Error getting authenticated user:", error);
    return null;
  }
}

/**
 * Create an organization for a user if they don't have one
 */
async function createOrganizationForUser(
  userId: string,
  userEmail: string
): Promise<string> {
  const orgName = `${userEmail.split("@")[0]}'s Organization`;

  if (prisma) {
    const org = await prisma.organization.create({
      data: {
        name: orgName,
        users: {
          connect: { id: userId },
        },
      },
    });
    return org.id;
  } else if (supabase) {
    const orgId = `c${Date.now().toString(36)}${Math.random().toString(36).substring(2, 15)}`;
    await supabase.from("Organization").insert({
      id: orgId,
      name: orgName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Update user with organizationId
    await supabase
      .from("User")
      .update({ organizationId: orgId })
      .eq("id", userId);

    return orgId;
  }

  throw new Error("No database client available");
}



