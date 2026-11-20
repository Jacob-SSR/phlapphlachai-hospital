import "server-only";
import { resolve, join, sep } from "node:path";
import { mkdir, readFile, writeFile } from "node:fs/promises";
export function pdfDirectory() {
  if (!process.env.UPLOAD_DIR) throw Error("UPLOAD_DIR is not configured");
  const target = resolve(process.env.UPLOAD_DIR);
  const publicRoot = join(process.cwd(), "public"),
    exportRoot = join(process.cwd(), "out");
  if (
    target === publicRoot ||
    target.startsWith(publicRoot + sep) ||
    target === exportRoot ||
    target.startsWith(exportRoot + sep)
  )
    throw Error("UPLOAD_DIR must be outside public web directories");
  return target;
}
export async function savePdf(key: string, bytes: Uint8Array) {
  if (!/^[a-f0-9-]{36}\.pdf$/.test(key)) throw Error("Invalid PDF key");
  const directory = pdfDirectory();
  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, key), bytes, { flag: "wx", mode: 0o600 });
}
export async function loadPdf(key: string) {
  if (!/^[a-f0-9-]{36}\.pdf$/.test(key)) throw Error("Invalid PDF key");
  return readFile(join(pdfDirectory(), key));
}
