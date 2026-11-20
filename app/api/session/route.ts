import { requireStaff } from "@/lib/server/auth";
import { fail, json } from "@/lib/server/http";
export async function GET(request: Request) {
  try {
    return json(await requireStaff(request));
  } catch (e) {
    return fail(e);
  }
}
