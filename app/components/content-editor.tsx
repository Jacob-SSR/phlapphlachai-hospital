"use client";
import { useEffect, useRef, useState } from "react";
import { X, FileText, Upload, Trash2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { uploadImage, uploadPdf } from "@/lib/media";
import { validateContent } from "@/lib/validation.mjs";
import { categories, type Content } from "@/lib/content";
type Props = {
  kind: Content["kind"];
  item: Content | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
};
export default function ContentEditor({ kind, item, onClose, onSaved }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [title, setTitle] = useState(item?.title ?? ""),
    [body, setBody] = useState(item?.body ?? ""),
    [category, setCategory] = useState(
      item?.category ||
        (kind === "news"
          ? categories[0]
          : kind === "link"
            ? "สำหรับประชาชน"
            : "ข้อมูลทั่วไป"),
    ),
    [url, setUrl] = useState(item?.external_url ?? ""),
    [year, setYear] = useState(
      String(item?.fiscal_year ?? new Date().getFullYear() + 543),
    ),
    [published, setPublished] = useState(item?.published ?? false);
  const [image, setImage] = useState<File | null>(null),
    [pdf, setPdf] = useState<File | null>(null),
    [imageId, setImageId] = useState(item?.image_id ?? null),
    [fileId, setFileId] = useState(item?.file_id ?? null),
    [imageUrl, setImageUrl] = useState(item?.image_url ?? null),
    [fileName, setFileName] = useState(item?.file_name ?? null),
    [busy, setBusy] = useState(false),
    [progress, setProgress] = useState(""),
    [error, setError] = useState(""),
    [confirmDelete, setConfirmDelete] = useState(false);
  useEffect(() => {
    const el = dialog.current;
    el?.showModal();
    return () => el?.close();
  }, []);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      validateContent({
        kind,
        title,
        body,
        category,
        external_url: url,
        fiscal_year: year,
        published,
      });
      if (kind === "ita" && published && !pdf && !fileId)
        throw Error("กรุณาแนบ PDF ก่อนเผยแพร่เอกสาร ITA");
    } catch (e) {
      setError(e instanceof Error ? e.message : "ข้อมูลไม่ถูกต้อง");
      return;
    }
    setBusy(true);
    try {
      let nextImage = imageId,
        nextFile = fileId;
      if (image) {
        setProgress("กำลังอัปโหลดรูป…");
        const media = await uploadImage(image);
        nextImage = media.id;
        setImageId(media.id);
        setImageUrl(media.url);
        setImage(null);
      }
      if (pdf) {
        setProgress("กำลังอัปโหลด PDF…");
        const media = await uploadPdf(pdf);
        nextFile = media.id;
        setFileId(media.id);
        setFileName(media.name);
        setPdf(null);
      }
      setProgress("กำลังบันทึก…");
      await apiFetch(item ? `/api/content/${item.id}` : "/api/content", {
        method: item ? "PATCH" : "POST",
        body: JSON.stringify({
          kind,
          title,
          body,
          category,
          external_url: url,
          fiscal_year: year,
          published,
          image_id: nextImage,
          file_id: nextFile,
          version: item?.version,
        }),
      });
      await onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setBusy(false);
      setProgress("");
    }
  }
  async function remove() {
    if (!item) return;
    setBusy(true);
    setError("");
    try {
      await apiFetch(`/api/content/${item.id}`, {
        method: "DELETE",
        body: JSON.stringify({ version: item.version }),
      });
      await onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "ลบไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }
  const label =
    kind === "news" ? "ข่าวประชาสัมพันธ์" : kind === "ita" ? "เอกสาร ITA" : "ลิงก์";
  return (
    <dialog
      ref={dialog}
      className="editor-dialog"
      aria-labelledby="editor-title"
      onCancel={(e) => {
        if (busy) e.preventDefault();
        else onClose();
      }}
    >
      <div className="editor-top">
        <div>
          <span className="eyebrow">จัดการข้อมูลโรงพยาบาล</span>
          <h2 id="editor-title">
            {item ? "แก้ไข" : "เพิ่ม"}
            {label}
          </h2>
        </div>
        <button
          type="button"
          className="icon-button"
          aria-label="ปิดแบบฟอร์ม"
          onClick={onClose}
          disabled={busy}
        >
          <X />
        </button>
      </div>
      <form onSubmit={save} className="staff-form">
        <fieldset disabled={busy}>
          <label>
            ชื่อเรื่อง
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={200}
            />
          </label>
          <div className="form-columns">
            <label>
              หมวดหมู่
              {kind === "ita" ? (
                <input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                  maxLength={100}
                />
              ) : (
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {(kind === "news"
                    ? categories
                    : ["สำหรับประชาชน", "สำหรับบุคลากร", "หน่วยงานที่เกี่ยวข้อง"]
                  ).map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              )}
            </label>
            {kind === "ita" ? (
              <label>
                ปีงบประมาณ พ.ศ.
                <input
                  type="number"
                  min={2500}
                  max={2700}
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  required
                />
              </label>
            ) : (
              <label>
                สถานะ
                <select
                  value={published ? "published" : "draft"}
                  onChange={(e) => setPublished(e.target.value === "published")}
                >
                  <option value="draft">ฉบับร่าง</option>
                  <option value="published">เผยแพร่</option>
                </select>
              </label>
            )}
          </div>
          <label>
            {kind === "link" ? "รายละเอียดลิงก์" : "เนื้อหา"}
            <textarea
              rows={7}
              maxLength={30000}
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </label>
          {kind === "link" ? (
            <label>
              ลิงก์เว็บไซต์ (HTTPS)
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://"
                required
              />
            </label>
          ) : (
            <>
              <div className="upload-grid">
                {kind === "news" && (
                  <div className="upload-box">
                    <label>
                      <Upload size={18} /> รูปประกอบข่าว
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(e) => setImage(e.target.files?.[0] ?? null)}
                      />
                    </label>
                    <small>JPEG / PNG / WebP ไม่เกิน 3 MB</small>
                    {imageUrl && !image && (
                      <img src={imageUrl} alt="รูปประกอบข่าวที่แนบ" />
                    )}
                    {(image || imageId) && (
                      <button
                        type="button"
                        className="text-link"
                        onClick={() => {
                          setImage(null);
                          setImageId(null);
                          setImageUrl(null);
                        }}
                      >
                        นำรูปออก
                      </button>
                    )}
                  </div>
                )}
                <div className="upload-box">
                  <label>
                    <FileText size={18} /> เอกสาร PDF
                    <input
                      type="file"
                      accept="application/pdf,.pdf"
                      onChange={(e) => setPdf(e.target.files?.[0] ?? null)}
                    />
                  </label>
                  <small>PDF ไม่เกิน 20 MB</small>
                  {fileName && !pdf && (
                    <p className="attached-name">{fileName}</p>
                  )}
                  {(pdf || fileId) && (
                    <button
                      type="button"
                      className="text-link"
                      onClick={() => {
                        setPdf(null);
                        setFileId(null);
                        setFileName(null);
                      }}
                    >
                      นำเอกสารออก
                    </button>
                  )}
                </div>
              </div>
              {kind === "ita" && (
                <label>
                  สถานะ
                  <select
                    value={published ? "published" : "draft"}
                    onChange={(e) =>
                      setPublished(e.target.value === "published")
                    }
                  >
                    <option value="draft">ฉบับร่าง</option>
                    <option value="published">เผยแพร่</option>
                  </select>
                </label>
              )}
            </>
          )}
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <div className="editor-actions">
            <button className="primary" type="submit">
              {busy
                ? progress || "กำลังบันทึก…"
                : "บันทึก" + (published ? "และเผยแพร่" : "ฉบับร่าง")}
            </button>
            <button className="secondary" type="button" onClick={onClose}>
              ยกเลิก
            </button>
            {item && (
              <button
                type="button"
                className="danger-link"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 size={16} /> ลบรายการ
              </button>
            )}
          </div>
        </fieldset>
      </form>
      {confirmDelete && (
        <div className="delete-confirm" role="alert">
          <strong>ยืนยันลบ “{item?.title}” หรือไม่?</strong>
          <p>รายการจะถูกนำออกจากเว็บ ไฟล์ต้นฉบับยังเก็บไว้สำหรับการกู้คืน</p>
          <div>
            <button
              type="button"
              className="danger-button"
              disabled={busy}
              onClick={remove}
            >
              ยืนยันลบ
            </button>
            <button
              type="button"
              className="secondary"
              disabled={busy}
              onClick={() => setConfirmDelete(false)}
            >
              เก็บรายการไว้
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}
