import { getDb } from "@/lib/server/db";
import { requireStaff } from "@/lib/server/auth";
import {
  checkOrigin,
  fail,
  HttpError,
  json,
  readJson,
} from "@/lib/server/http";
import { contentData, relations, serialize } from "@/lib/server/content";
import { validId } from "@/lib/security.mjs";
type Context = { params: Promise<{ id: string }> };
export const runtime = "nodejs";
export async function PATCH(request: Request, context: Context) {
  try {
    checkOrigin(request);
    const user = await requireStaff(request),
      { id } = await context.params;
    if (!validId(id)) throw new HttpError(400, "รหัสรายการไม่ถูกต้อง");
    const raw = await readJson(request);
    if (!Number.isInteger(raw.version))
      throw new HttpError(400, "กรุณาโหลดรายการใหม่");
    const data = await contentData(raw);
    const row = await getDb().$transaction(async (tx) => {
      const old = await tx.content.findFirst({
        where: { id, deletedAt: null },
      });
      if (!old) throw new HttpError(404, "ไม่พบรายการ");
      const result = await tx.content.updateMany({
        where: { id, version: raw.version, deletedAt: null },
        data: {
          ...data,
          publishedAt: data.published ? (old.publishedAt ?? new Date()) : null,
          version: { increment: 1 },
        },
      });
      if (result.count !== 1)
        throw new HttpError(
          409,
          "มีผู้แก้ไขรายการนี้แล้ว กรุณาปิดแล้วเปิดรายการใหม่ก่อนแก้ไข",
        );
      await tx.auditLog.create({
        data: {
          contentId: id,
          actorId: user.id,
          action: "update",
          title: data.title,
        },
      });
      return tx.content.findUniqueOrThrow({
        where: { id },
        include: relations,
      });
    });
    return json({ item: serialize(row) });
  } catch (e) {
    return fail(e);
  }
}
export async function DELETE(request: Request, context: Context) {
  try {
    checkOrigin(request);
    const user = await requireStaff(request),
      { id } = await context.params;
    if (!validId(id)) throw new HttpError(400, "รหัสรายการไม่ถูกต้อง");
    const raw = await readJson(request);
    if (!Number.isInteger(raw.version))
      throw new HttpError(400, "กรุณาโหลดรายการใหม่");
    await getDb().$transaction(async (tx) => {
      const old = await tx.content.findFirst({
        where: { id, deletedAt: null },
      });
      if (!old) throw new HttpError(404, "ไม่พบรายการ");
      const result = await tx.content.updateMany({
        where: { id, version: raw.version, deletedAt: null },
        data: {
          deletedAt: new Date(),
          published: false,
          publishedAt: null,
          version: { increment: 1 },
        },
      });
      if (result.count !== 1)
        throw new HttpError(409, "มีผู้แก้ไขรายการนี้แล้ว กรุณาโหลดรายการใหม่");
      await tx.auditLog.create({
        data: {
          contentId: id,
          actorId: user.id,
          action: "delete",
          title: old.title,
        },
      });
    });
    return json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}
