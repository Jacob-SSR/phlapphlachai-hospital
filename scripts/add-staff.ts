import { loadEnvConfig } from "@next/env";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "../lib/auth-core.mjs";
loadEnvConfig(process.cwd());
async function main() {
  const {
    DATABASE_URL,
    STAFF_EMAIL,
    STAFF_PASSWORD,
    STAFF_NAME,
    STAFF_ROLE = "editor",
  } = process.env;
  if (
    !DATABASE_URL ||
    !STAFF_EMAIL ||
    !STAFF_PASSWORD ||
    !STAFF_NAME ||
    !["admin", "editor"].includes(STAFF_ROLE)
  )
    throw Error("กรุณากรอก DATABASE_URL และ STAFF_* ให้ครบ");
  const email = STAFF_EMAIL.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw Error("อีเมลไม่ถูกต้อง");
  const passwordHash = await hashPassword(STAFF_PASSWORD),
    db = new PrismaClient({
      adapter: new PrismaPg({ connectionString: DATABASE_URL }),
    });
  try {
    await db.user.create({
      data: { email, passwordHash, name: STAFF_NAME, role: STAFF_ROLE },
    });
    console.log("เพิ่มบัญชีเจ้าหน้าที่แล้ว");
  } finally {
    await db.$disconnect();
  }
}
main().catch(() => {
  console.error("เพิ่มบัญชีไม่สำเร็จ ตรวจ STAFF_* และตรวจว่ามีอีเมลนี้อยู่แล้วหรือไม่");
  process.exitCode = 1;
});
