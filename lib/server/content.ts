import "server-only";
import { getDb } from "./db";
import { HttpError } from "./http";
import { validateContent } from "../validation.mjs";
import { validId } from "../security.mjs";
import type { Prisma } from "@/generated/prisma/client";
export const relations = { image: true, file: true } as const;
type Row = Prisma.ContentGetPayload<{ include: typeof relations }>;
export function serialize(row: Row) {
  return {
    id: row.id,
    kind: row.kind,
    title: row.title,
    body: row.body,
    category: row.category,
    external_url: row.externalUrl,
    fiscal_year: row.fiscalYear,
    published: row.published,
    published_at: row.publishedAt?.toISOString() ?? null,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
    version: row.version,
    image_id: row.imageId,
    file_id: row.fileId,
    image_url: row.image?.url ?? null,
    image_public_id: row.image?.storageKey ?? null,
    file_path: row.file?.storageKey ?? null,
    file_name: row.file?.name ?? null,
  };
}
export async function contentData(raw: Record<string, unknown>) {
  let values;
  try {
    values = validateContent(raw);
  } catch (e) {
    throw new HttpError(400, e instanceof Error ? e.message : "ข้อมูลไม่ถูกต้อง");
  }
  const mediaId = async (value: unknown, kind: string) => {
    if (value === null || value === undefined || value === "") return null;
    if (!validId(value)) throw new HttpError(400, "รหัสไฟล์ไม่ถูกต้อง");
    const media = await getDb().media.findUnique({
      where: { id: value as string },
    });
    if (!media || media.kind !== kind)
      throw new HttpError(400, "ไม่พบไฟล์แนบที่ถูกต้อง");
    if (kind === "pdf") {
      // The file must exist in Storage before publication/attachment.
      const { loadPdf } = await import("./storage");
      try {
        await loadPdf(media.storageKey);
      } catch {
        throw new HttpError(400, "ไม่พบไฟล์ PDF กรุณาอัปโหลดใหม่");
      }
    }
    return media.id;
  };
  const imageId =
    values.kind === "news" ? await mediaId(raw.image_id, "image") : null;
  const fileId =
    values.kind !== "link" ? await mediaId(raw.file_id, "pdf") : null;
  if (values.kind === "ita" && values.published && !fileId)
    throw new HttpError(400, "กรุณาแนบ PDF ก่อนเผยแพร่เอกสาร ITA");
  return {
    kind: values.kind,
    title: values.title,
    body: values.body,
    category: values.category,
    externalUrl: values.external_url,
    fiscalYear: values.fiscal_year,
    published: values.published,
    imageId,
    fileId,
  };
}
