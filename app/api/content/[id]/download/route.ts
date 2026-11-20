import { getDb } from "@/lib/server/db";
import { identity } from "@/lib/server/auth";
import { fail, HttpError } from "@/lib/server/http";
import { loadPdf } from "@/lib/server/storage";
import { validId, contentVisible } from "@/lib/security.mjs";
export const runtime = "nodejs";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!validId(id)) throw new HttpError(404, "ไม่พบเอกสาร");
    const user = await identity(request, true),
      row = await getDb().content.findUnique({
        where: { id },
        include: { file: true },
      });
    if (!row || !contentVisible(row, !!user?.role) || !row.file)
      throw new HttpError(404, "ไม่พบเอกสารที่เผยแพร่");
    const file = await loadPdf(row.file.storageKey);
    return new Response(new Uint8Array(file), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="document.pdf"; filename*=UTF-8''${encodeURIComponent(row.file.name).replace(/'/g, "%27")}`,
        "X-Document-Name": encodeURIComponent(row.file.name),
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, no-store",
      },
    });
  } catch (e) {
    return fail(e);
  }
}
