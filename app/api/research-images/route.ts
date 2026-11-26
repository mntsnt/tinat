import { NextResponse } from "next/server";
import sharp from "sharp";
import { requireUser } from "@/lib/authGuard";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

export async function POST(request: Request) {
  const auth = await requireUser(request);
  if (!auth.ok) return auth.response;
  if (auth.user.role !== "RESEARCHER" && auth.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Only researchers and administrators can upload research images." }, { status: 403 });
  }

  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json({ error: "Multipart image upload is required." }, { status: 400 });
  }

  const formData = await request.formData();
  const file = formData.get("image");
  if (!(file instanceof File)) return NextResponse.json({ error: "No image file provided." }, { status: 400 });
  if (!ALLOWED_TYPES.has(file.type)) return NextResponse.json({ error: "Use JPEG, PNG or WebP." }, { status: 400 });
  if (file.size > MAX_UPLOAD_BYTES) return NextResponse.json({ error: "Images must be 8 MB or smaller." }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  try {
    const processed = await sharp(buffer)
      .rotate()
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
    const dataUrl = `data:image/webp;base64,${processed.toString("base64")}`;
    if (dataUrl.length > 2_500_000) return NextResponse.json({ error: "The optimized image is too large." }, { status: 413 });
    return NextResponse.json({ success: true, dataUrl, bytes: processed.length });
  } catch {
    return NextResponse.json({ error: "The uploaded file is not a readable image." }, { status: 400 });
  }
}
