import "server-only";
import { getDb } from "./db";
import { HttpError } from "./http";
import { readCookie, verifySession } from "../auth-core.mjs";
export async function identity(request: Request, optional = false) {
  const token = readCookie(request.headers.get("cookie"));
  if (!token) return null;
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)
    throw new HttpError(503, "ยังไม่ได้ตั้งค่าระบบเข้าสู่ระบบ");
  let payload;
  try {
    payload = await verifySession(token, process.env.JWT_SECRET);
  } catch {
    if (optional) return null;
    throw new HttpError(401, "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่");
  }
  const session = await getDb().session.findUnique({
    where: { id: payload.jti as string },
    include: { user: true },
  });
  if (
    !session ||
    session.userId !== payload.sub ||
    session.revokedAt ||
    session.expiresAt <= new Date() ||
    !session.user.active
  ) {
    if (optional) return null;
    throw new HttpError(401, "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่");
  }
  const user = session.user;
  if (!["admin", "editor"].includes(user.role))
    throw new HttpError(403, "บัญชีนี้ไม่มีสิทธิ์จัดการข้อมูล");
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    name: user.name,
    role: user.role,
    sessionId: session.id,
  };
}
export async function requireStaff(request: Request) {
  const user = await identity(request);
  if (!user) throw new HttpError(401, "กรุณาเข้าสู่ระบบ");
  if (!["admin", "editor"].includes(user.role))
    throw new HttpError(403, "บัญชีนี้ไม่มีสิทธิ์จัดการข้อมูลโรงพยาบาล");
  return user;
}
