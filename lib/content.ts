export type Content = {
  id: string;
  kind: "news" | "ita" | "link";
  title: string;
  body: string;
  category: string;
  image_url: string | null;
  image_public_id: string | null;
  file_path: string | null;
  file_name: string | null;
  external_url: string | null;
  published: boolean;
  created_at: string;
  updated_at?: string;
  published_at?: string | null;
  fiscal_year?: number | null;
  image_id?: string | null;
  file_id?: string | null;
  version?: number;
};
export const categories = ["ข่าวสารโรงพยาบาล", "กิจกรรมเพื่อชุมชน", "ความรู้สุขภาพ"];
export const demoNews: Content[] = [
  {
    id: "demo-1",
    kind: "news",
    title: "ใส่ใจสุขภาพ เริ่มต้นได้ในทุกวัน",
    body: "พื้นที่สำหรับเผยแพร่ความรู้และคำแนะนำด้านสุขภาพให้ประชาชนเข้าถึงได้ง่าย",
    category: "ความรู้สุขภาพ",
    image_url: null,
    image_public_id: null,
    file_path: null,
    file_name: null,
    external_url: null,
    published: true,
    created_at: "",
  },
  {
    id: "demo-2",
    kind: "news",
    title: "เชื่อมโยงการดูแล ใกล้ชิดชุมชน",
    body: "พื้นที่สำหรับข่าวกิจกรรมของโรงพยาบาลและการส่งเสริมสุขภาพในชุมชน",
    category: "กิจกรรมเพื่อชุมชน",
    image_url: null,
    image_public_id: null,
    file_path: null,
    file_name: null,
    external_url: null,
    published: true,
    created_at: "",
  },
  {
    id: "demo-3",
    kind: "news",
    title: "ข่าวสารและประกาศจากโรงพยาบาล",
    body: "ติดตามข้อมูลบริการและประกาศประชาสัมพันธ์ของโรงพยาบาลได้ที่นี่",
    category: "ข่าวสารโรงพยาบาล",
    image_url: null,
    image_public_id: null,
    file_path: null,
    file_name: null,
    external_url: null,
    published: true,
    created_at: "",
  },
];
