import { getDb } from "@/lib/server/db";
import { identity } from "@/lib/server/auth";
import { checkOrigin, fail, json } from "@/lib/server/http";
import { sessionCookie } from "@/lib/auth-core.mjs";
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    try {
      const user = await identity(request);
      if (user)
        await getDb().session.updateMany({
          where: { id: user.sessionId },
          data: { revokedAt: new Date() },
        });
    } catch (e) {
      if (!(e instanceof Error && "status" in e && e.status === 401)) throw e;
    }
    const response = json({ ok: true });
    response.headers.set(
      "Set-Cookie",
      sessionCookie("", process.env.NODE_ENV === "production"),
    );
    return response;
  } catch (e) {
    return fail(e);
  }
}
