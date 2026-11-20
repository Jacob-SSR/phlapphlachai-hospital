import { randomUUID } from "node:crypto";
import { getDb } from "@/lib/server/db";
import { requireStaff } from "@/lib/server/auth";
import { checkOrigin, fail, HttpError, json } from "@/lib/server/http";
import { savePdf } from "@/lib/server/storage";
import { validatePdf, PDF_LIMIT } from "@/lib/validation.mjs";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const user = await requireStaff(request);
    if (Number(request.headers.get("content-length")) > PDF_LIMIT + 65536)
      throw new HttpError(413, "PDF ต้องไม่เกิน 20 MB");
    const form = await request.formData(),
      file = form.get("file");
    if (!(file instanceof File) || !file.size || file.name.length > 255)
      throw new HttpError(400, "กรุณาเลือกไฟล์ PDF");
    try {
      await validatePdf(file);
    } catch (e) {
      throw new HttpError(400, e instanceof Error ? e.message : "ไฟล์ไม่ถูกต้อง");
    }
    const key = `${randomUUID()}.pdf`;
    await savePdf(key, new Uint8Array(await file.arrayBuffer()));
    const media = await getDb().media.create({
      data: {
        kind: "pdf",
        storageKey: key,
        name: file.name,
        size: file.size,
        uploadedBy: user.id,
      },
    });
    return json({ id: media.id, name: media.name }, 201);
  } catch (e) {
    return fail(e);
  }
}
