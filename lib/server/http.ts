import "server-only";
import {originAllowed} from '../security.mjs';
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
export function fail(error: unknown) {
  if (error instanceof HttpError)
    return json({ error: error.message }, error.status);
  return json(
    { error: "ระบบยังไม่พร้อมใช้งาน กรุณาตรวจการตั้งค่าหรือลองใหม่ภายหลัง" },
    503,
  );
}
export function checkOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!originAllowed(origin,request.headers.get('host'),process.env.APP_ORIGIN))
    throw new HttpError(403, "ไม่อนุญาตให้ส่งข้อมูลจากเว็บไซต์อื่น");
}
export async function readJson(request: Request) {
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    throw new HttpError(415, "รูปแบบข้อมูลไม่ถูกต้อง");
  const text = await request.text();
  if (text.length > 70000) throw new HttpError(413, "ข้อมูลมีขนาดใหญ่เกินไป");
  try {
    const body = JSON.parse(text);
    if (!body || typeof body !== "object" || Array.isArray(body)) throw Error();
    return body;
  } catch {
    throw new HttpError(400, "รูปแบบข้อมูลไม่ถูกต้อง");
  }
}
