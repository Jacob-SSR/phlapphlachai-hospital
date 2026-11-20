import type { Metadata } from 'next';
import './globals.css';
import './reference.css';
import './staff.css';
export const metadata: Metadata = {title:'โรงพยาบาลพลับพลาชัย | ดูแลด้วยใจ ใกล้ชิดทุกช่วงชีวิต',description:'ข่าวสาร บริการ เอกสาร ITA และข้อมูลติดต่อโรงพยาบาลพลับพลาชัย'};
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="th"><body>{children}</body></html>}
