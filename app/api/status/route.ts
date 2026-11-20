import { json } from "@/lib/server/http";
export const dynamic = "force-dynamic";
export async function GET() {
  return json({
    auth: !!(process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 32),
    database: !!process.env.DATABASE_URL,
    images: !!(
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    ),
    documents: !!process.env.UPLOAD_DIR,
  });
}
