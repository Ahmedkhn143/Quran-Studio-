import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";

export const runtime = "nodejs";

const MAX_SIZE_BYTES = 50 * 1024 * 1024; // 50MB
const ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
]);

function uploadsDir() {
  return path.join(process.cwd(), "public", "uploads");
}

function ensureUploadsDir() {
  const dir = uploadsDir();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

function safeFileName(original: string) {
  const ext = path.extname(original).toLowerCase() || ".png";
  const base = path.basename(original, ext).replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 60) || "bg";
  const hash = crypto.randomBytes(6).toString("hex");
  return `${base}_${Date.now()}_${hash}${ext}`;
}

// GET /api/upload/background
export async function GET() {
  try {
    const dir = ensureUploadsDir();
    const files = fs.readdirSync(dir, { withFileTypes: true })
      .filter((d) => d.isFile())
      .map((d) => d.name);

    const backgrounds = files
      .map((name) => {
        const full = path.join(dir, name);
        const st = fs.statSync(full);
        return {
          url: `/uploads/${name}`,
          filename: name,
          size: st.size,
          uploadedAt: st.mtime.toISOString(),
          _sort: st.mtimeMs,
        };
      })
      .sort((a, b) => b._sort - a._sort)
      .map(({ _sort, ...rest }) => rest);

    return NextResponse.json({ ok: true, backgrounds });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Failed to list uploads" },
      { status: 500 }
    );
  }
}

// POST /api/upload/background (multipart/form-data with file)
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "No file uploaded" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ ok: false, error: "Unsupported file type (images and mp4/webm videos only)" }, { status: 400 });
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ ok: false, error: "File too large (max 10MB)" }, { status: 400 });
    }

    const dir = ensureUploadsDir();
    const filename = safeFileName(file.name);
    const target = path.join(dir, filename);

    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(target, buffer);

    return NextResponse.json({
      ok: true,
      url: `/uploads/${filename}`,
      filename,
      size: file.size,
      uploadedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Upload failed" },
      { status: 500 }
    );
  }
}

// DELETE /api/upload/background?filename=<name>
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const filename = searchParams.get("filename")?.trim();

  if (!filename) {
    return NextResponse.json({ ok: false, error: "Missing filename" }, { status: 400 });
  }

  if (filename.includes("/") || filename.includes("\\")) {
    return NextResponse.json({ ok: false, error: "Invalid filename" }, { status: 400 });
  }

  try {
    const full = path.join(uploadsDir(), filename);
    if (!fs.existsSync(full)) {
      return NextResponse.json({ ok: false, error: "File not found" }, { status: 404 });
    }
    fs.unlinkSync(full);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Delete failed" },
      { status: 500 }
    );
  }
}
