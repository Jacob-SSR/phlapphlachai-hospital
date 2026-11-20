import { createHash, randomUUID } from "node:crypto";
import { getDb } from "@/lib/server/db";
import {
  parseLoginIdentifier,
  throttleSubject,
} from "@/lib/login-identity.mjs";
import {
  checkOrigin,
  fail,
  HttpError,
  json,
  readJson,
} from "@/lib/server/http";
import {
  verifyPassword,
  signSession,
  sessionCookie,
  SESSION_SECONDS,
} from "@/lib/auth-core.mjs";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)
      throw new HttpError(503, "ยังไม่ได้ตั้งค่า JWT_SECRET");
    const body = await readJson(request),
      password = body.password;
    let login;
    try {
      login = parseLoginIdentifier(body.identifier ?? body.email);
    } catch (error) {
      throw new HttpError(
        400,
        error instanceof Error ? error.message : "ข้อมูลเข้าสู่ระบบไม่ถูกต้อง",
      );
    }
    if (typeof password !== "string" || !password || password.length > 256)
      throw new HttpError(400, "กรุณากรอกชื่อผู้ใช้หรืออีเมลและรหัสผ่านให้ถูกต้อง");
    const db = getDb(),
      user = await db.user.findUnique({ where: login.where }),
      window = Math.floor(Date.now() / 900000),
      key = createHash("sha256")
        .update(`${throttleSubject(user, login.identifier)}:${window}`)
        .digest("hex");
    const attempts = await db.loginAttempt.upsert({
      where: { id: key },
      create: {
        id: key,
        attempts: 1,
        expiresAt: new Date((window + 1) * 900000),
      },
      update: { attempts: { increment: 1 } },
    });
    if (attempts.attempts > 5)
      throw new HttpError(429, "เข้าสู่ระบบไม่สำเร็จหลายครั้ง กรุณารอ 15 นาทีแล้วลองใหม่");
    const valid = await verifyPassword(password, user?.passwordHash);
    if (
      !valid ||
      !user ||
      !user.active ||
      !["admin", "editor"].includes(user.role)
    )
      throw new HttpError(401, "ชื่อผู้ใช้ อีเมล หรือรหัสผ่านไม่ถูกต้อง");
    const sessionId = randomUUID(),
      token = await signSession(user.id, sessionId, process.env.JWT_SECRET);
    await db.$transaction([
      db.session.create({
        data: {
          id: sessionId,
          userId: user.id,
          expiresAt: new Date(Date.now() + SESSION_SECONDS * 1000),
        },
      }),
      db.loginAttempt.deleteMany({ where: { id: key } }),
    ]);
    const response = json({
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
    });
    response.headers.set(
      "Set-Cookie",
      sessionCookie(token, process.env.NODE_ENV === "production"),
    );
    return response;
  } catch (e) {
    return fail(e);
  }
}
