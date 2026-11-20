export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
export async function apiFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  if (typeof init.body === "string")
    headers.set("Content-Type", "application/json");
  let response: Response;
  try {
    response = await fetch(path, {
      ...init,
      headers,
      credentials: "same-origin",
      cache: "no-store",
    });
  } catch {
    throw new ApiError("เชื่อมต่อไม่ได้ กรุณาตรวจอินเทอร์เน็ตแล้วลองใหม่", 0);
  }
  const result = await response
    .json()
    .catch(() => ({ error: "ระบบตอบกลับไม่สมบูรณ์ กรุณาลองใหม่" }));
  if (!response.ok)
    throw new ApiError(result.error || "ดำเนินการไม่สำเร็จ", response.status);
  return result;
}
