import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
const globalDb = globalThis as unknown as { hospitalDb?: PrismaClient };
export function getDb() {
  if (!process.env.DATABASE_URL) throw Error("Database is not configured");
  return (globalDb.hospitalDb ??= new PrismaClient({
    adapter: new PrismaPg({
      connectionString: process.env.DATABASE_URL,
      max: 3,
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 10000,
    }),
  }));
}
