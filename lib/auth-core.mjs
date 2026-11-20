import {
  scrypt as scryptCallback,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import { SignJWT, jwtVerify } from "jose";
const scrypt = promisify(scryptCallback);
const options = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
export const COOKIE_NAME = "hospital_session";
export const SESSION_SECONDS = 8 * 60 * 60;
export async function hashPassword(password) {
  if (
    typeof password !== "string" ||
    password.length < 12 ||
    password.length > 256
  )
    throw Error("รหัสผ่านต้องยาว 12–256 ตัวอักษร");
  const salt = randomBytes(16).toString("hex"),
    hash = await scrypt(password, salt, 64, options);
  return `scrypt$${salt}$${hash.toString("hex")}`;
}
export async function verifyPassword(password, stored) {
  const parts = String(stored ?? "").split("$");
  const valid =
    parts[0] === "scrypt" &&
    /^[a-f0-9]{32}$/.test(parts[1] ?? "") &&
    /^[a-f0-9]{128}$/.test(parts[2] ?? "");
  const salt = valid ? parts[1] : "00000000000000000000000000000000";
  const expected = Buffer.from(valid ? parts[2] : "00".repeat(64), "hex");
  const actual = await scrypt(password, salt, 64, options);
  return timingSafeEqual(actual, expected) && valid;
}
function key(secret) {
  if (!secret || Buffer.byteLength(secret) < 32)
    throw Error("JWT_SECRET must be at least 32 bytes");
  return new TextEncoder().encode(secret);
}
export async function signSession(userId, sessionId, secret) {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(userId)
    .setJti(sessionId)
    .setIssuer("phlapphlachai-hospital")
    .setAudience("hospital-staff")
    .setIssuedAt()
    .setExpirationTime(`${SESSION_SECONDS}s`)
    .sign(key(secret));
}
export async function verifySession(token, secret) {
  const { payload } = await jwtVerify(token, key(secret), {
    algorithms: ["HS256"],
    issuer: "phlapphlachai-hospital",
    audience: "hospital-staff",
  });
  if (!validId(payload.sub) || !validId(payload.jti))
    throw Error("Invalid session");
  return payload;
}
export function sessionCookie(token, secure) {
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${token ? SESSION_SECONDS : 0}${secure ? "; Secure" : ""}`;
}
export function readCookie(header) {
  return (
    String(header ?? "")
      .split(";")
      .map((s) => s.trim())
      .find((s) => s.startsWith(`${COOKIE_NAME}=`))
      ?.slice(COOKIE_NAME.length + 1) || null
  );
}
export function validId(value) {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}
export function contentVisible(row, isStaff) {
  return !row.deletedAt && (isStaff || row.published);
}
