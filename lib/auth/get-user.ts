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

    // Get or create user in database
    let organizationId: string | null = null;

    if (prisma) {
      // Check if user exists by id first
      let dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { organizationId: true },
      });

      // If not found by id, check by email (in case of data inconsistency)
      if (!dbUser && user.email) {
        const userByEmail = await prisma.user.findUnique({
          where: { email: user.email },
          select: { id: true, organizationId: true },
        });
        
        // If found by email but id is different, update the id
        if (userByEmail) {
          if (userByEmail.id !== user.id) {
            await prisma.user.update({
              where: { id: userByEmail.id },
              data: { id: user.id },
            });
          }
          // Use the found user's data
          dbUser = { organizationId: userByEmail.organizationId };
        }
      }

      // If user doesn't exist in database, create them
      if (!dbUser) {
        // Create user first, then create organization
        organizationId = await createUserAndOrganization(user.id, user.email || "");
      } else {
        organizationId = dbUser.organizationId || null;
        
        // If user exists but has no organization, create one
        if (!organizationId) {
          organizationId = await createOrganizationForUser(user.id, user.email || "");
        }
      }
    } else if (supabase) {
      const { data: dbUser } = await supabase
        .from("User")
        .select("organizationId")
        .eq("id", user.id)
        .single();
      
      if (!dbUser) {
        // Create user first, then create organization
        organizationId = await createUserAndOrganization(user.id, user.email || "");
      } else {
        organizationId = dbUser.organizationId || null;
        
        if (!organizationId) {
          organizationId = await createOrganizationForUser(user.id, user.email || "");
        }
      }
    }

    // Ensure we have an organizationId (should never be null at this point, but TypeScript needs it)
    if (!organizationId) {
      throw new Error("Failed to get or create organization for user");
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
 * Create a user and organization for a new user
 */
async function createUserAndOrganization(
  userId: string,
  userEmail: string
): Promise<string> {
  const orgName = `${userEmail.split("@")[0]}'s Organization`;

  if (prisma) {
    // Create organization first
    const org = await prisma.organization.create({
      data: {
        name: orgName,
      },
    });

    // Use upsert to handle case where user might exist by email but not id
    await prisma.user.upsert({
      where: { id: userId },
      update: {
        organizationId: org.id,
        email: userEmail, // Update email in case it changed
      },
      create: {
        id: userId,
        email: userEmail,
        organizationId: org.id,
      },
    });

    return org.id;
  } else if (supabase) {
    const orgId = `c${Date.now().toString(36)}${Math.random().toString(36).substring(2, 15)}`;
    
    // Create organization
    await supabase.from("Organization").insert({
      id: orgId,
      name: orgName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Create user with organizationId
    await supabase.from("User").insert({
      id: userId,
      email: userEmail,
      organizationId: orgId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return orgId;
  }

  throw new Error("No database client available");
}

/**
 * Create an organization for a user if they don't have one
 * (User already exists in database)
 */
async function createOrganizationForUser(
  userId: string,
  userEmail: string
): Promise<string> {
  const orgName = `${userEmail.split("@")[0]}'s Organization`;

  if (prisma) {
    // Create organization
    const org = await prisma.organization.create({
      data: {
        name: orgName,
      },
    });

    // Update user with organizationId
    await prisma.user.update({
      where: { id: userId },
      data: { organizationId: org.id },
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



