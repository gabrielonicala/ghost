import { PrismaClient } from "@/src/generated/prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaInitialized: boolean;
};

// Skip Prisma on Vercel - direct PostgreSQL connections don't work reliably
// Use Supabase client instead (which works via HTTP/REST)
const isVercel = process.env.VERCEL === "1";
let prisma: PrismaClient | null = null;

// Only initialize Prisma if:
// 1. Not on Vercel (where direct connections fail)
// 2. DATABASE_URL is available
// 3. Not already initialized
if (!isVercel && process.env.DATABASE_URL && !globalForPrisma.prismaInitialized) {
  try {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
      max: 1,
    });

    const adapter = new PrismaPg(pool);

    prisma = new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    });

    if (process.env.NODE_ENV !== "production") {
      globalForPrisma.prisma = prisma;
    }
    globalForPrisma.prismaInitialized = true;
  } catch (error) {
    console.warn("Prisma initialization failed, will use Supabase client:", error);
    prisma = null;
  }
} else if (globalForPrisma.prisma && !isVercel) {
  prisma = globalForPrisma.prisma;
} else if (isVercel) {
  // On Vercel, Prisma won't work - use Supabase client
  console.log("Running on Vercel - Prisma disabled, using Supabase client");
}

// Export prisma - it may be null if initialization failed
export { prisma };

