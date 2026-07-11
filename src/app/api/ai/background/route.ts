import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";
import fs from "fs";
import path from "path";
import crypto from "crypto";

// POST /api/ai/background
// Body: { prompt: string }
// Returns: { ok: true, url: string }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({} as any));
    const promptRaw = (body?.prompt ?? "").toString().trim();
    if (!promptRaw) {
      return NextResponse.json(
        { ok: false, error: "Missing prompt" },
        { status: 400 }
      );
    }

    // Sanitize + enrich the prompt for an Islamic-themed background.
    const safePrompt = `${promptRaw}, cinematic atmospheric background, no people, no text, no humans, no faces, peaceful, islamic art aesthetic, soft golden hour light, ultra wide, high detail`;
    const zai = await ZAI.create();
    const response: any = await zai.images.generations.create({
      prompt: safePrompt,
      size: "1344x768",
    });

    const base64 = response?.data?.[0]?.base64;
    if (!base64) {
      return NextResponse.json(
        { ok: false, error: "No image returned by AI" },
        { status: 500 }
      );
    }

    // Save the generated image under /public/generated/ and return its URL.
    const buffer = Buffer.from(base64, "base64");
    const hash = crypto.createHash("md5").update(safePrompt).digest("hex").slice(0, 12);
    const filename = `bg_${hash}_${Date.now()}.png`;
    const outputDir = path.join(process.cwd(), "public", "generated");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    const filePath = path.join(outputDir, filename);
    fs.writeFileSync(filePath, buffer);

    return NextResponse.json({ ok: true, url: `/generated/${filename}` });
  } catch (err: any) {
    console.error("ai/background error:", err);
    return NextResponse.json(
      { ok: false, error: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
