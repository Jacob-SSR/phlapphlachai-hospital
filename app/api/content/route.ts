import { getDb } from "@/lib/server/db";
import { identity, requireStaff } from "@/lib/server/auth";
import { checkOrigin, fail, json, readJson } from "@/lib/server/http";
import { contentData, relations, serialize } from "@/lib/server/content";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    const user = await identity(request, true);
    const rows = await getDb().content.findMany({
      where: { deletedAt: null, ...(user?.role ? {} : { published: true }) },
      include: relations,
      orderBy: { createdAt: "desc" },
      take: 500,
    });
    return json({ items: rows.map(serialize) });
  } catch (e) {
    return fail(e);
  }
}
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const user = await requireStaff(request);
    const values = await contentData(await readJson(request));
    const row = await getDb().$transaction(async (tx) => {
      const item = await tx.content.create({
        data: {
          ...values,
          authorId: user.id,
          publishedAt: values.published ? new Date() : null,
        },
        include: relations,
      });
      await tx.auditLog.create({
        data: {
          contentId: item.id,
          actorId: user.id,
          action: "create",
          title: item.title,
        },
      });
      return item;
    });
    return json({ item: serialize(row) }, 201);
  } catch (e) {
    return fail(e);
  }
}
