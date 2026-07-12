import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const ALLOWED_AUDIO_HOSTS = new Set([
  "cdn.islamic.network",
  "audio.qurancdn.com",
  "download.quranicaudio.com",
]);

// GET /api/audio?src=<encoded-audio-url>
// Proxies remote recitation audio so browser-side fetch/decode works reliably.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const src = searchParams.get("src")?.trim();

  if (!src) {
    return NextResponse.json({ ok: false, error: "Missing src" }, { status: 400 });
  }

  let remote: URL;
  try {
    remote = new URL(src);
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid src url" }, { status: 400 });
  }

  if (remote.protocol !== "https:") {
    return NextResponse.json({ ok: false, error: "Only https audio urls are allowed" }, { status: 400 });
  }

  if (!ALLOWED_AUDIO_HOSTS.has(remote.hostname)) {
    return NextResponse.json({ ok: false, error: "Audio host is not allowed" }, { status: 403 });
  }

  try {
    const upstream = await fetch(remote.toString(), { cache: "no-store" });
    if (!upstream.ok) {
      return NextResponse.json(
        { ok: false, error: `Upstream audio failed (${upstream.status})` },
        { status: 502 }
      );
    }

    const contentType = upstream.headers.get("content-type") || "audio/mpeg";
    const arrayBuffer = await upstream.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        "content-type": contentType,
        "cache-control": "public, max-age=86400",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Failed to proxy audio" },
      { status: 500 }
    );
  }
}
