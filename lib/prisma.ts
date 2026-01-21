import { PrismaClient } from "@/src/generated/prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Check if DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL environment variable is not set. " +
    "Please set it in your .env file or Vercel environment variables."
  );
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Add connection timeout and retry settings for serverless
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  max: 1, // Limit connections for serverless
});

const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

