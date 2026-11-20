import { apiFetch } from "./api";
import { detectImage, IMAGE_LIMIT, validatePdf } from "./validation.mjs";
export async function uploadImage(file: File) {
  if (file.size > IMAGE_LIMIT) throw Error("รูปภาพต้องไม่เกิน 3 MB");
  if (!detectImage(new Uint8Array(await file.slice(0, 12).arrayBuffer())))
    throw Error("รองรับเฉพาะรูป JPEG, PNG และ WebP");
  const form = new FormData();
  form.append("file", file);
  return apiFetch("/api/uploads/image", { method: "POST", body: form });
}
export async function uploadPdf(file: File) {
  await validatePdf(file);
  const form = new FormData();
  form.append("file", file);
  return apiFetch("/api/uploads/pdf", { method: "POST", body: form });
}
export async function downloadPdf(id: string) {
  const response = await fetch(`/api/content/${id}/download`, {
    credentials: "same-origin",
  });
  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "ไม่สามารถดาวน์โหลดเอกสารได้" }));
    throw Error(error.error);
  }
  const blob = await response.blob(),
    url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  const name = response.headers.get("X-Document-Name");
  try {
    a.download = name ? decodeURIComponent(name) : "document.pdf";
  } catch {
    a.download = "document.pdf";
  }
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
