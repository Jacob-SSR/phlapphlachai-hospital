"use client";
import { useState } from "react";
import {
  FileText,
  Link as LinkIcon,
  Search,
  ExternalLink,
  HeartPulse,
  Stethoscope,
} from "lucide-react";
import type { Content } from "@/lib/content";
export function DocumentList({
  items,
  staff,
  onEdit,
  onDownload,
}: {
  items: Content[];
  staff: boolean;
  onEdit: (item: Content) => void;
  onDownload: (item: Content) => void;
}) {
  const [query, setQuery] = useState(""),
    [year, setYear] = useState("ทั้งหมด");
  const years = Array.from(
    new Set(
      items
        .map((i) => String(i.fiscal_year))
        .filter((y) => y !== "null" && y !== "undefined"),
    ),
  )
    .sort()
    .reverse();
  const filtered = items.filter(
    (i) =>
      (year === "ทั้งหมด" || String(i.fiscal_year) === year) &&
      (i.title + i.category + i.body)
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <>
      <div className="filters document-filters">
        <label className="search">
          <Search size={18} />
          <input
            aria-label="ค้นหาเอกสาร ITA"
            placeholder="ค้นหาชื่อเอกสารหรือหมวดหมู่"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <label className="select-wrap">
          <select
            aria-label="ปีงบประมาณ"
            value={year}
            onChange={(e) => setYear(e.target.value)}
          >
            <option>ทั้งหมด</option>
            {years.map((y) => (
              <option key={y}>{y}</option>
            ))}
          </select>
        </label>
      </div>
      <p className="results">พบ {filtered.length} เอกสาร</p>
      <div className="document-list">
        {filtered.map((item) => (
          <article className="document-row" key={item.id}>
            <span className="service-icon">
              <FileText />
            </span>
            <div>
              {!item.published && <span className="draft-badge">ฉบับร่าง</span>}
              <small>
                ปีงบประมาณ {item.fiscal_year} · {item.category}
              </small>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
              {item.published_at && (
                <small>
                  เผยแพร่{" "}
                  {new Date(item.published_at).toLocaleDateString("th-TH")}
                </small>
              )}
            </div>
            <div className="document-actions">
              <button
                className="primary"
                disabled={!item.file_id}
                onClick={() => onDownload(item)}
              >
                ดาวน์โหลด PDF
              </button>
              {staff && (
                <button className="secondary" onClick={() => onEdit(item)}>
                  แก้ไข
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
      {!filtered.length && (
        <div className="empty">
          <FileText />
          <h3>{items.length ? "ไม่พบเอกสารที่ค้นหา" : "ยังไม่มีเอกสารเผยแพร่"}</h3>
          <p>
            {items.length
              ? "ลองเปลี่ยนคำค้นหรือปีงบประมาณ"
              : "เอกสารที่เผยแพร่จะแสดงที่นี่ พร้อมปีงบประมาณและไฟล์ดาวน์โหลด"}
          </p>
        </div>
      )}
    </>
  );
}
export function LinkList({
  items,
  staff,
  onEdit,
}: {
  items: Content[];
  staff: boolean;
  onEdit: (item: Content) => void;
}) {
  return (
    <>
      <div className="link-intro">
        <LinkIcon />
        <p>ช่องทางสำหรับประชาชน บุคลากร และหน่วยงานที่เกี่ยวข้อง</p>
      </div>
      <div className="link-groups">
        {["สำหรับประชาชน", "สำหรับบุคลากร", "หน่วยงานที่เกี่ยวข้อง"].map(
          (category, index) => (
            <section className="link-group" key={category}>
              <span className="service-icon">
                {index === 0 ? (
                  <HeartPulse />
                ) : index === 1 ? (
                  <Stethoscope />
                ) : (
                  <ExternalLink />
                )}
              </span>
              <h2>{category}</h2>
              {items
                .filter((i) => i.category === category)
                .map((item) => (
                  <div key={item.id} className="link-entry">
                    {!item.published && (
                      <span className="draft-badge">ฉบับร่าง</span>
                    )}
                    <a
                      href={item.external_url ?? "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {item.title}
                      <ExternalLink size={15} />
                    </a>
                    {item.body && <p>{item.body}</p>}
                    {staff && (
                      <button
                        className="inline-edit"
                        onClick={() => onEdit(item)}
                      >
                        แก้ไขลิงก์
                      </button>
                    )}
                  </div>
                ))}
              {!items.some((i) => i.category === category) && (
                <p>ยังไม่มีลิงก์ที่เผยแพร่</p>
              )}
            </section>
          ),
        )}
      </div>
    </>
  );
}
