import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";

// POST /api/upload/background
// Accepts multipart/form-data with a "file" field.
// Saves the image to /public/uploads/ and returns its URL.
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { ok: false, error: "No file uploaded" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp",
      "image/gif",
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          ok: false,
          error: `Unsupported file type: ${file.type}. Allowed: PNG, JPEG, WebP, GIF`,
        },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { ok: false, error: "File too large. Maximum size: 10MB" },
        { status: 400 }
      );
    }

    // Read file buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename
    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    const hash = crypto.createHash("md5").update(buffer).digest("hex").slice(0, 12);
    const filename = `bg_${hash}_${Date.now()}.${ext}`;

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    const filePath = path.join(uploadDir, filename);
    fs.writeFileSync(filePath, buffer);

    return NextResponse.json({
      ok: true,
      url: `/uploads/${filename}`,
      filename,
      size: file.size,
      type: file.type,
    });
  } catch (err: any) {
    console.error("upload/background error:", err);
    return NextResponse.json(
      { ok: false, error: err?.message ?? "Upload failed" },
      { status: 500 }
    );
  }
}

// GET /api/upload/background — list uploaded backgrounds
export async function GET() {
  try {
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadDir)) {
      return NextResponse.json({ ok: true, backgrounds: [] });
    }
    const files = fs.readdirSync(uploadDir);
    const backgrounds = files
      .filter((f) => /\.(png|jpe?g|webp|gif)$/i.test(f))
      .map((f) => {
        const stat = fs.statSync(path.join(uploadDir, f));
        return {
          url: `/uploads/${f}`,
          filename: f,
          size: stat.size,
          uploadedAt: stat.mtime.toISOString(),
        };
      })
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

    return NextResponse.json({ ok: true, backgrounds });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message ?? "Failed to list" },
      { status: 500 }
    );
  }
}

// DELETE /api/upload/background?filename=xxx.png
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filename = searchParams.get("filename");
    if (!filename) {
      return NextResponse.json(
        { ok: false, error: "Missing filename" },
        { status: 400 }
      );
    }
    // Prevent path traversal
    const safe = path.basename(filename);
    const filePath = path.join(process.cwd(), "public", "uploads", safe);
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { ok: false, error: "File not found" },
        { status: 404 }
      );
    }
    fs.unlinkSync(filePath);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message ?? "Delete failed" },
      { status: 500 }
    );
  }
}
