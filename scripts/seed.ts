import { loadEnvConfig } from "@next/env";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "../lib/auth-core.mjs";
import { mkdir } from "node:fs/promises";
loadEnvConfig(process.cwd());
async function main() {
  const { DATABASE_URL, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD, UPLOAD_DIR } =
    process.env;
  const missing = Object.entries({
    DATABASE_URL,
    JWT_SECRET,
    ADMIN_EMAIL,
    ADMIN_PASSWORD,
    UPLOAD_DIR,
  })
    .filter(([, v]) => !v)
    .map(([k]) => k);
  if (missing.length) throw Error("กรุณาตั้งค่า: " + missing.join(", "));
  if (Buffer.byteLength(JWT_SECRET!) < 32)
    throw Error("JWT_SECRET ต้องยาวอย่างน้อย 32 bytes");
  const passwordHash = await hashPassword(ADMIN_PASSWORD!),
    email = ADMIN_EMAIL!.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw Error("ADMIN_EMAIL ไม่ถูกต้อง");
  await mkdir(UPLOAD_DIR!, { recursive: true });
  const db = new PrismaClient({
    adapter: new PrismaPg({ connectionString: DATABASE_URL }),
  });
  try {
    if (await db.user.findUnique({ where: { email } })) {
      console.log("มีบัญชีนี้แล้ว ไม่เปลี่ยนรหัสผ่านหรือสิทธิ์เดิม");
      return;
    }
    await db.user.create({
      data: {
        email,
        passwordHash,
        name: process.env.ADMIN_NAME || "ผู้ดูแลระบบ",
        role: "admin",
      },
    });
    console.log("สร้างบัญชีผู้ดูแลระบบแล้ว");
  } finally {
    await db.$disconnect();
  }
}
main().catch(() => {
  console.error(
    "ตั้งค่าบัญชีไม่สำเร็จ ตรวจ env, migration และการเชื่อมฐานข้อมูล โดยไม่ต้องส่งรหัสลับในแชต",
  );
  process.exitCode = 1;
});
