import { createHash, randomUUID } from "node:crypto";
import { getDb } from "@/lib/server/db";
import { requireStaff } from "@/lib/server/auth";
import { checkOrigin, fail, HttpError, json } from "@/lib/server/http";
import { detectImage, IMAGE_LIMIT } from "@/lib/validation.mjs";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const user = await requireStaff(request);
    if (Number(request.headers.get("content-length")) > IMAGE_LIMIT + 65536)
      throw new HttpError(413, "รูปภาพต้องไม่เกิน 3 MB");
    const cloud = process.env.CLOUDINARY_CLOUD_NAME,
      key = process.env.CLOUDINARY_API_KEY,
      secret = process.env.CLOUDINARY_API_SECRET;
    if (!cloud || !key || !secret)
      throw new HttpError(503, "ยังไม่ได้ตั้งค่า Cloudinary");
    const form = await request.formData(),
      file = form.get("file");
    if (!(file instanceof File) || file.size > IMAGE_LIMIT || file.size === 0)
      throw new HttpError(400, "กรุณาเลือกรูปภาพไม่เกิน 3 MB");
    if (!detectImage(new Uint8Array(await file.slice(0, 12).arrayBuffer())))
      throw new HttpError(400, "รองรับเฉพาะ JPEG, PNG และ WebP");
    const params = {
      public_id: `hospital-news/${randomUUID()}`,
      timestamp: Math.floor(Date.now() / 1000).toString(),
      overwrite: "false",
    };
    const canonical = Object.entries(params)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join("&");
    const body = new FormData();
    body.append("file", file);
    for (const [k, v] of Object.entries(params)) body.append(k, v);
    body.append("api_key", key);
    body.append(
      "signature",
      createHash("sha256")
        .update(canonical + secret)
        .digest("hex"),
    );
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloud)}/image/upload`,
      { method: "POST", body, signal: AbortSignal.timeout(30000) },
    );
    const result = await response.json();
    if (
      !response.ok ||
      typeof result.secure_url !== "string" ||
      !result.secure_url.startsWith(`https://res.cloudinary.com/${cloud}/`) ||
      result.public_id !== params.public_id
    )
      throw new HttpError(502, "อัปโหลดรูปไม่สำเร็จ กรุณาลองใหม่");
    const media = await getDb().media.create({
      data: {
        kind: "image",
        storageKey: result.public_id,
        url: result.secure_url,
        name: file.name.slice(0, 255),
        size: file.size,
        uploadedBy: user.id,
      },
    });
    return json({ id: media.id, url: media.url, name: media.name }, 201);
  } catch (e) {
    return fail(e);
  }
}
