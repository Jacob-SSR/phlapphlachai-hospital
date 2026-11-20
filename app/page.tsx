"use client";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
const HospitalMap = dynamic(() => import("./hospital-map"), {
  ssr: false,
  loading: () => <div className="map-loading">กำลังโหลดแผนที่…</div>,
});
import {
  Activity,
  ArrowUpRight,
  CalendarDays,
  Check,
  ChevronDown,
  ClipboardList,
  Clock,
  FileText,
  HeartPulse,
  Link as LinkIcon,
  LockKeyhole,
  Mail,
  MapPin,
  Menu,
  Phone,
  Search,
  ShieldCheck,
  Stethoscope,
  X,
  Leaf,
  Accessibility,
  ExternalLink,
  Heart,
  ClipboardCheck,
} from "lucide-react";
import { categories, demoNews, type Content } from "@/lib/content";
import { useContent } from "@/lib/use-content";
import { apiFetch } from "@/lib/api";
import { downloadPdf } from "@/lib/media";
import AuthDialog from "./components/auth-dialog";
import ContentEditor from "./components/content-editor";
import { DocumentList, LinkList } from "./components/content-lists";
function Tooth() {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M24 8c-7-5-17-1-17 9 0 7 5 11 6 19 1 7 5 7 7-1l2-9q2-4 4 0l2 9c2 8 6 8 7 1 1-8 6-12 6-19 0-10-10-14-17-9Z" />
      <path d="M18 9q6 4 12 0" />
    </svg>
  );
}
function Mortar() {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 22h36q-1 13-13 17H19Q7 35 6 22Z" />
      <path d="m25 22 11-17 5 4-9 13M17 39l-3 4h21l-3-4" />
      <path d="M21 32q7-3 9 6-7 2-9-6Z" />
    </svg>
  );
}
type View = "home" | "news" | "ita" | "links" | "about";
const services = [
  {
    icon: Stethoscope,
    title: "ตรวจโรคทั่วไป",
    text: "ข้อมูลบริการตรวจและรักษาโรคทั่วไป",
  },
  { icon: Tooth, title: "ทันตกรรม", text: "ข้อมูลบริการดูแลสุขภาพช่องปาก" },
  { icon: HeartPulse, title: "ส่งเสริมสุขภาพ", text: "ข้อมูลการดูแลและส่งเสริมสุขภาพ" },
  { icon: Mortar, title: "แพทย์แผนไทย", text: "ข้อมูลบริการด้านแพทย์แผนไทย" },
];
export default function Home() {
  const [view, setView] = useState<View>("home"),
    [mobile, setMobile] = useState(false),
    [query, setQuery] = useState(""),
    [category, setCategory] = useState("ทั้งหมด"),
    [modal, setModal] = useState<{
      title: string;
      body: string;
      item?: Content;
    } | null>(null),
    [large, setLarge] = useState(false);
  const data = useContent();
  const [loginOpen, setLoginOpen] = useState(false),
    [editor, setEditor] = useState<{
      kind: Content["kind"];
      item: Content | null;
    } | null>(null),
    [showDrafts, setShowDrafts] = useState(true);
  const isStaff = !!data.role;
  const visible = data.rows.filter(
    (row) => row.published || (isStaff && showDrafts),
  );
  const allNews = data.configured
    ? visible.filter((row) => row.kind === "news")
    : demoNews;
  const openNews = (item: Content) =>
    setModal({
      title: item.title,
      body:
        item.body +
        (item.id.startsWith("demo-")
          ? "\n\nตัวอย่างเนื้อหา — รอข้อมูลจากโรงพยาบาล"
          : ""),
      item,
    });
  const edit = (item: Content) => setEditor({ kind: item.kind, item });
  const download = async (item: Content) => {
    try {
      await downloadPdf(item.id);
    } catch (e) {
      setModal({
        title: "ดาวน์โหลดไม่สำเร็จ",
        body: e instanceof Error ? e.message : "กรุณาลองใหม่",
      });
    }
  };
  const logout = async () => {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
      await data.reload();
    } catch (e) {
      setModal({
        title: "ออกจากระบบไม่สำเร็จ",
        body: e instanceof Error ? e.message : "กรุณาลองใหม่",
      });
    }
  };
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (modal) dialog.current?.showModal();
    else dialog.current?.close();
  }, [modal]);
  useEffect(() => {
    const handle = () => {
      const v = location.hash.slice(1);
      if (["news", "ita", "links", "about"].includes(v)) setView(v as View);
      else setView("home");
    };
    handle();
    window.addEventListener("hashchange", handle);
    return () => window.removeEventListener("hashchange", handle);
  }, []);
  const go = (v: View) => {
    setView(v);
    setMobile(false);
    setQuery("");
    setCategory("ทั้งหมด");
    location.hash = v === "home" ? "home" : v;
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const section = (id: string) => {
    setView("home");
    setMobile(false);
    location.hash = id;
    setTimeout(
      () => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }),
      50,
    );
  };
  const info = (title: string, body: string) => setModal({ title, body });
  const news = allNews.filter(
    (n) =>
      (category === "ทั้งหมด" || n.category === category) &&
      (n.title + n.body + n.category).includes(query),
  );
  const newsCard = (n: Content, i: number) => (
    <article className="news-card" key={n.id}>
      <button
        className={
          n.image_url
            ? "news-art has-photo"
            : n.id.startsWith("demo-")
              ? "news-art art-" + i
              : "news-art no-photo"
        }
        style={
          n.image_url
            ? {
                backgroundImage:
                  'url("' + n.image_url.replaceAll('"', "%22") + '")',
              }
            : undefined
        }
        onClick={() => openNews(n)}
        aria-label={"อ่าน " + n.title}
      >
        <FileText />
        {n.id.startsWith("demo-") && <span>ภาพประกอบและเนื้อหาตัวอย่าง</span>}
      </button>
      <div className="news-copy">
        {!n.published && <span className="draft-badge">ฉบับร่าง</span>}
        <span className="category">{n.category}</span>
        <h3>
          <button onClick={() => openNews(n)}>{n.title}</button>
        </h3>
        <p>{n.body}</p>
        <div className="card-bottom">
          <span>
            <Clock size={14} />
            {n.published_at
              ? new Date(n.published_at).toLocaleDateString("th-TH")
              : n.id.startsWith("demo-")
                ? "รอการเผยแพร่"
                : "ฉบับร่าง"}
          </span>
          <button onClick={() => openNews(n)}>อ่านรายละเอียด</button>
        </div>
        {isStaff && !n.id.startsWith("demo-") && (
          <button className="inline-edit" onClick={() => edit(n)}>
            แก้ไขข่าว
          </button>
        )}
      </div>
    </article>
  );
  return (
    <div className={large ? "site large-type" : "site"}>
      <a className="skip" href="#main">
        ข้ามไปยังเนื้อหา
      </a>
      <div className="utility">
        <div className="container">
          <span>
            <ShieldCheck size={14} /> ต้นแบบเว็บไซต์ • อยู่ระหว่างจัดเตรียมข้อมูล
          </span>
          <button aria-pressed={large} onClick={() => setLarge(!large)}>
            <Accessibility size={15} />{" "}
            {large ? "ขนาดตัวอักษรปกติ" : "เพิ่มขนาดตัวอักษร"}
          </button>
        </div>
      </div>
      <header>
        <div className="container header-inner">
          <button
            className="brand"
            onClick={() => go("home")}
            aria-label="โรงพยาบาลพลับพลาชัย หน้าแรก"
          >
            <span className="brand-mark">
              <span className="cross-leaf" />
            </span>
            <span>
              <strong>โรงพยาบาลพลับพลาชัย</strong>
              <small>PHLAPPHLACHAI HOSPITAL</small>
            </span>
          </button>
          <button
            className="mobile-toggle"
            aria-label={mobile ? "ปิดเมนู" : "เปิดเมนู"}
            aria-expanded={mobile}
            onClick={() => setMobile(!mobile)}
          >
            {mobile ? <X /> : <Menu />}
          </button>
          <nav className={mobile ? "open" : ""} aria-label="เมนูหลัก">
            <button
              className={view === "home" ? "active" : ""}
              onClick={() => go("home")}
            >
              หน้าแรก
            </button>
            <button
              className={view === "about" ? "active" : ""}
              onClick={() => go("about")}
            >
              เกี่ยวกับเรา
            </button>
            <button onClick={() => section("services")}>บริการ</button>
            <button
              className={view === "news" ? "active" : ""}
              onClick={() => go("news")}
            >
              ประชาสัมพันธ์
            </button>
            <button onClick={() => section("contact")}>ติดต่อเรา</button>
            <button
              className={view === "ita" ? "active" : ""}
              onClick={() => go("ita")}
            >
              ITA
            </button>
            <button
              className={view === "links" ? "active" : ""}
              onClick={() => go("links")}
            >
              รวมลิงก์
            </button>
            <button
              className="login"
              onClick={() => (data.user ? void logout() : setLoginOpen(true))}
            >
              <LockKeyhole size={16} /> {data.user ? "ออกจากระบบ" : "เข้าสู่ระบบ"}
            </button>
          </nav>
        </div>
      </header>
      {isStaff && (
        <div className="staff-bar">
          <div className="container">
            <div className="staff-identity">
              {data.user?.name}
              <small>{data.role === "admin" ? "ผู้ดูแลระบบ" : "เจ้าหน้าที่"}</small>
            </div>
            <div className="staff-buttons">
              <button onClick={() => setEditor({ kind: "news", item: null })}>
                เพิ่มข่าว
              </button>
              <button onClick={() => setEditor({ kind: "ita", item: null })}>
                เพิ่มเอกสาร ITA
              </button>
              <button onClick={() => setEditor({ kind: "link", item: null })}>
                เพิ่มลิงก์
              </button>
            </div>
            <label className="staff-view-toggle">
              <input
                type="checkbox"
                checked={showDrafts}
                onChange={(e) => setShowDrafts(e.target.checked)}
              />
              แสดงฉบับร่าง
            </label>
          </div>
        </div>
      )}
      {(data.error || data.loading) && (
        <div className="data-message" role="status">
          <div className="container">
            <span>{data.loading ? "กำลังโหลดข้อมูล…" : data.error}</span>
            {!data.loading && (
              <button onClick={() => void data.reload()}>ลองใหม่</button>
            )}
          </div>
        </div>
      )}
      <main id="main">
        {view === "home" ? (
          <>
            <section className="hero">
              <div className="container hero-grid">
                <div className="hero-copy">
                  <h1>
                    ดูแลด้วยใจ
                    <br />
                    <em>ใกล้ชิดทุกช่วงชีวิต</em>
                  </h1>
                  <p>
                    โรงพยาบาลพลับพลาชัย
                    <br />
                    พร้อมดูแลสุขภาพของคุณและครอบครัว
                  </p>
                  <div className="hero-actions">
                    <button
                      className="primary"
                      onClick={() => section("services")}
                    >
                      ดูบริการของเรา
                    </button>
                    <button
                      className="secondary"
                      onClick={() => section("contact")}
                    >
                      ติดต่อโรงพยาบาล
                    </button>
                  </div>
                </div>
                <figure className="hero-image">
                  <img
                    src="/hero-concept.png"
                    alt="ภาพประกอบแนวคิดบุคลากรทางการแพทย์ในคลินิก"
                    fetchPriority="high"
                  />
                  <figcaption>
                    ภาพประกอบสร้างด้วย AI • รอภาพจริงจากโรงพยาบาล
                  </figcaption>
                </figure>
              </div>
            </section>
            <div className="container quick-links">
              <button onClick={() => go("ita")}>
                <ClipboardList />
                <span>
                  <strong>ITA</strong>
                </span>
                <ArrowUpRight />
              </button>
              <button
                onClick={() =>
                  info(
                    "ตารางออกตรวจ",
                    "ยังไม่ได้เผยแพร่ตารางออกตรวจ กรุณาตรวจสอบกับโรงพยาบาลก่อนเดินทาง",
                  )
                }
              >
                <CalendarDays />
                <span>
                  <strong>ตารางออกตรวจ</strong>
                </span>
                <ArrowUpRight />
              </button>
              <button
                onClick={() =>
                  info(
                    "สิทธิการรักษา",
                    "ข้อมูลสิทธิการรักษาจะเพิ่มหลังได้รับการตรวจสอบจากผู้รับผิดชอบของโรงพยาบาล",
                  )
                }
              >
                <ShieldCheck />
                <span>
                  <strong>สิทธิการรักษา</strong>
                </span>
                <ArrowUpRight />
              </button>
              <button onClick={() => go("links")}>
                <LinkIcon />
                <span>
                  <strong>รวมลิงก์</strong>
                </span>
                <ArrowUpRight />
              </button>
            </div>
            <section id="services" className="section services">
              <div className="container">
                <div className="section-heading">
                  <div>
                    <span className="eyebrow">HOSPITAL SERVICES</span>
                    <h2>บริการของเรา</h2>
                    <p>ใส่ใจทุกการดูแล เพื่อสุขภาพที่ดีของชุมชน</p>
                  </div>
                  <span className="muted-note">
                    รายการตัวอย่าง รอยืนยันข้อมูลบริการ
                  </span>
                </div>
                <div className="service-grid">
                  {services.map((s) => (
                    <button
                      className="service"
                      key={s.title}
                      onClick={() =>
                        info(
                          s.title,
                          "รายละเอียดบริการ เวลาให้บริการ และขั้นตอนการรับบริการ จะเผยแพร่หลังจากโรงพยาบาลตรวจสอบข้อมูลแล้ว",
                        )
                      }
                    >
                      <span className="service-icon">
                        <s.icon />
                      </span>
                      <h3>{s.title}</h3>
                      <p>{s.text}</p>
                      <span className="service-more">
                        รายละเอียดบริการ <ArrowUpRight size={16} />
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </section>
            <section className="section news-section" id="news">
              <div className="container">
                <div className="section-heading">
                  <div>
                    <span className="eyebrow">NEWS & ANNOUNCEMENTS</span>
                    <h2>ประชาสัมพันธ์</h2>
                    <p>ข่าวสาร กิจกรรม และข้อมูลจากโรงพยาบาล</p>
                  </div>
                  <button className="text-link" onClick={() => go("news")}>
                    ดูข่าวสารทั้งหมด <ArrowUpRight size={18} />
                  </button>
                </div>
                <div className="news-grid">
                  {allNews.slice(0, 3).map(newsCard)}
                </div>
                {data.configured && !allNews.length && !data.loading && (
                  <p className="staff-empty">ยังไม่มีข่าวที่เผยแพร่</p>
                )}
              </div>
            </section>
            <section className="section contact-section" id="contact">
              <div className="container">
                <div className="section-heading">
                  <div>
                    <span className="eyebrow">LOCATION & CONTACT</span>
                    <h2>แผนที่และข้อมูลติดต่อ</h2>
                    <p>ตรวจสอบข้อมูลและเส้นทางก่อนเดินทาง</p>
                  </div>
                </div>
                <div className="contact-grid">
                  <div className="map-shell">
                    <HospitalMap />
                  </div>
                  <div className="contact-card">
                    <h3>โรงพยาบาลพลับพลาชัย</h3>
                    {[
                      {
                        icon: MapPin,
                        title: "ที่ตั้งโรงพยาบาล",
                        value: process.env.NEXT_PUBLIC_HOSPITAL_ADDRESS,
                      },
                      {
                        icon: Phone,
                        title: "โทรศัพท์",
                        value: process.env.NEXT_PUBLIC_HOSPITAL_PHONE,
                      },
                      {
                        icon: Mail,
                        title: "อีเมล",
                        value: process.env.NEXT_PUBLIC_HOSPITAL_EMAIL,
                      },
                    ].map((c) => (
                      <div className="contact-row" key={c.title}>
                        <c.icon size={21} />
                        <div>
                          <strong>{c.title}</strong>
                          <p>{c.value || "อยู่ระหว่างยืนยันข้อมูล"}</p>
                        </div>
                      </div>
                    ))}
                    <div className="contact-notice">
                      <ShieldCheck size={18} />
                      <span>ข้อมูลติดต่ออยู่ระหว่างตรวจสอบ</span>
                    </div>
                    <button
                      className="primary directions-button"
                      onClick={() =>
                        info("ดูเส้นทาง", "จะเปิดเส้นทางได้เมื่อยืนยันพิกัดโรงพยาบาลแล้ว")
                      }
                    >
                      ดูเส้นทาง
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </>
        ) : (
          <>
            <section className="page-heading">
              <div className="container">
                <div className="breadcrumb">
                  <button onClick={() => go("home")}>หน้าแรก</button>
                  <span>/</span>
                  <span>
                    {view === "news"
                      ? "ประชาสัมพันธ์"
                      : view === "ita"
                        ? "ITA"
                        : view === "links"
                          ? "รวมลิงก์"
                          : "เกี่ยวกับเรา"}
                  </span>
                </div>
                <span className="eyebrow">
                  {view === "news"
                    ? "NEWS & ANNOUNCEMENTS"
                    : view === "ita"
                      ? "INTEGRITY & TRANSPARENCY"
                      : view === "links"
                        ? "USEFUL LINKS"
                        : "ABOUT THE HOSPITAL"}
                </span>
                <h1>
                  {view === "news"
                    ? "ประชาสัมพันธ์"
                    : view === "ita"
                      ? "ข้อมูลและเอกสาร ITA"
                      : view === "links"
                        ? "รวมลิงก์"
                        : "เกี่ยวกับโรงพยาบาล"}
                </h1>
                <p>
                  {view === "news"
                    ? "ติดตามข่าวสารและกิจกรรมของโรงพยาบาล"
                    : view === "ita"
                      ? "พื้นที่เผยแพร่ข้อมูลการประเมินคุณธรรมและความโปร่งใส"
                      : view === "links"
                        ? "ช่องทางเข้าถึงหน่วยงานและระบบที่เกี่ยวข้อง"
                        : "โรงพยาบาลพลับพลาชัย"}
                </p>
              </div>
            </section>
            <section className="section">
              <div className="container">
                {view === "news" ? (
                  <>
                    <div className="filters">
                      <label className="search">
                        <Search size={19} />
                        <input
                          placeholder="ค้นหาข่าวประชาสัมพันธ์"
                          aria-label="ค้นหาข่าว"
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                        />
                      </label>
                      <label className="select-wrap">
                        <select
                          aria-label="หมวดหมู่ข่าว"
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                        >
                          {["ทั้งหมด", ...categories].map((c) => (
                            <option key={c}>{c}</option>
                          ))}
                        </select>
                        <ChevronDown size={17} />
                      </label>
                    </div>
                    <p className="results">
                      พบ {news.length} รายการ{" "}
                      {data.configured ? "" : "· เนื้อหาตัวอย่างสำหรับตรวจรูปแบบ"}
                    </p>
                    <div className="news-grid">{news.map(newsCard)}</div>
                    {!news.length && (
                      <div className="empty">
                        <Search />
                        <h2>ไม่พบข่าวที่ค้นหา</h2>
                        <p>ลองเปลี่ยนคำค้นหรือเลือกหมวดหมู่ทั้งหมด</p>
                        <button
                          className="secondary"
                          onClick={() => {
                            setQuery("");
                            setCategory("ทั้งหมด");
                          }}
                        >
                          ล้างตัวกรอง
                        </button>
                      </div>
                    )}
                  </>
                ) : view === "ita" ? (
                  <DocumentList
                    items={visible.filter((row) => row.kind === "ita")}
                    staff={isStaff}
                    onEdit={edit}
                    onDownload={(item) => void download(item)}
                  />
                ) : view === "links" ? (
                  <LinkList
                    items={visible.filter((row) => row.kind === "link")}
                    staff={isStaff}
                    onEdit={edit}
                  />
                ) : (
                  <div className="about-content">
                    <span className="brand-mark">
                      <span className="cross-leaf" />
                    </span>
                    <h2>โรงพยาบาลพลับพลาชัย</h2>
                    <p>พื้นที่สำหรับข้อมูลโรงพยาบาล ประวัติ วิสัยทัศน์ และโครงสร้างหน่วยงาน</p>
                    <div className="info-strip">
                      <ShieldCheck />
                      <p>
                        ข้อมูลหน่วยงานจะเผยแพร่หลังจากได้รับการยืนยันจากโรงพยาบาล
                        เพื่อให้ประชาชนได้รับข้อมูลที่ถูกต้องและเป็นปัจจุบัน
                      </p>
                    </div>
                    <button
                      className="secondary"
                      onClick={() => section("contact")}
                    >
                      ข้อมูลติดต่อโรงพยาบาล
                    </button>
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </main>
      <footer>
        <div className="container footer-grid">
          <div className="footer-brand">
            <div className="brand">
              <span className="brand-mark">
                <span className="cross-leaf" />
              </span>
              <span>
                <strong>โรงพยาบาลพลับพลาชัย</strong>
                <small>PHLAPPHLACHAI HOSPITAL</small>
              </span>
            </div>
            <p>ดูแลด้วยใจ ใกล้ชิดทุกช่วงชีวิต</p>
            <span className="footer-status">
              ต้นแบบหน้าบ้าน • ยังไม่ใช่เว็บไซต์ทางการ
            </span>
          </div>
          <div>
            <h3>เมนูหลัก</h3>
            <button onClick={() => go("home")}>หน้าแรก</button>
            <button onClick={() => go("about")}>เกี่ยวกับเรา</button>
            <button onClick={() => section("services")}>บริการของเรา</button>
            <button onClick={() => go("news")}>ประชาสัมพันธ์</button>
          </div>
          <div>
            <h3>ข้อมูลและบริการ</h3>
            <button onClick={() => go("ita")}>ข้อมูลและเอกสาร ITA</button>
            <button onClick={() => go("links")}>รวมลิงก์</button>
            <button onClick={() => section("contact")}>แผนที่และข้อมูลติดต่อ</button>
          </div>
        </div>
        <div className="container footer-bottom">
          <span>โรงพยาบาลพลับพลาชัย</span>
          <button
            onClick={() =>
              info(
                "เกี่ยวกับต้นแบบเว็บไซต์",
                "เว็บไซต์นี้เป็นต้นแบบหน้าบ้านสำหรับตรวจแบบและการใช้งาน\nข่าว บริการ และภาพประกอบยังเป็นข้อมูลตัวอย่าง\nไม่มีการเก็บข้อมูลผู้ป่วยในเว็บไซต์นี้",
              )
            }
          >
            เกี่ยวกับต้นแบบเว็บไซต์
          </button>
          <a href="#main">กลับด้านบน</a>
        </div>
      </footer>
      <AuthDialog
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        onSuccess={data.reload}
      />
      {editor && (
        <ContentEditor
          key={editor.item?.id ?? editor.kind}
          kind={editor.kind}
          item={editor.item}
          onClose={() => setEditor(null)}
          onSaved={data.reload}
        />
      )}
      <dialog
        ref={dialog}
        onCancel={() => setModal(null)}
        onClick={(e) => {
          if (e.target === dialog.current) setModal(null);
        }}
        aria-labelledby="dialog-title"
      >
        <div className="modal-head">
          <span className="service-icon">
            <FileText />
          </span>
          <button
            className="icon-button"
            aria-label="ปิดหน้าต่าง"
            onClick={() => setModal(null)}
          >
            <X />
          </button>
        </div>
        <h2 id="dialog-title">{modal?.title}</h2>
        {modal?.item?.image_url && (
          <img
            className="detail-photo"
            src={modal.item.image_url}
            alt={modal.title}
          />
        )}
        <p className="detail-content">{modal?.body}</p>
        {modal?.item?.file_id && (
          <div className="detail-actions">
            <button
              className="secondary"
              onClick={() => void download(modal.item!)}
            >
              ดาวน์โหลด PDF
            </button>
          </div>
        )}
        <button className="primary" onClick={() => setModal(null)}>
          รับทราบ
        </button>
      </dialog>
    </div>
  );
}
