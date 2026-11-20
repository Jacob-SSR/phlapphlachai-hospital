export const IMAGE_LIMIT = 3 * 1024 * 1024;
export const PDF_LIMIT = 20 * 1024 * 1024;
export function validateContent(values) {
  if (!["news", "ita", "link"].includes(values.kind))
    throw new Error("ประเภทข้อมูลไม่ถูกต้อง");
  const title = String(values.title ?? "").trim();
  const body = String(values.body ?? "").trim();
  const category = String(values.category ?? "").trim();
  if (!title || title.length > 200)
    throw new Error("กรุณากรอกชื่อเรื่องไม่เกิน 200 ตัวอักษร");
  if (body.length > 30000) throw new Error("เนื้อหาต้องไม่เกิน 30,000 ตัวอักษร");
  if (category.length > 100) throw new Error("หมวดหมู่ต้องไม่เกิน 100 ตัวอักษร");
  let external_url = null;
  if (values.kind === "link") {
    try {
      const u = new URL(values.external_url);
      if (u.protocol !== "https:" || u.username || u.password) throw Error();
      external_url = u.href;
    } catch {
      throw new Error("กรุณาใส่ลิงก์ HTTPS ที่ถูกต้อง");
    }
  }
  const fiscal_year = values.kind === "ita" ? Number(values.fiscal_year) : null;
  if (
    values.kind === "ita" &&
    (!Number.isInteger(fiscal_year) || fiscal_year < 2500 || fiscal_year > 2700)
  )
    throw new Error("กรุณาใส่ปีงบประมาณ พ.ศ. ให้ถูกต้อง");
  if (typeof values.published !== "boolean")
    throw new Error("สถานะเผยแพร่ไม่ถูกต้อง");
  return {
    kind: values.kind,
    title,
    body,
    category,
    external_url,
    fiscal_year,
    published: values.published,
  };
}
export async function validatePdf(file) {
  if (file.size > PDF_LIMIT) throw new Error("PDF ต้องไม่เกิน 20 MB");
  const header = new TextDecoder().decode(await file.slice(0, 5).arrayBuffer());
  if (file.type !== "application/pdf" || header !== "%PDF-")
    throw new Error("กรุณาเลือกไฟล์ PDF ที่ถูกต้อง");
}
export function detectImage(bytes) {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)
    return "image/jpeg";
  if ([137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => bytes[i] === v))
    return "image/png";
  const text = new TextDecoder().decode(bytes.slice(0, 12));
  if (text.startsWith("RIFF") && text.slice(8, 12) === "WEBP")
    return "image/webp";
  return null;
}
