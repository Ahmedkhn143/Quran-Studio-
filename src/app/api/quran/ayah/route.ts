import { NextRequest, NextResponse } from "next/server";
import { fetchAyah } from "@/lib/quran-api";

// GET /api/quran/ayah?surah=1&ayah=1&reciter=ar.alafasy&translation=en.sahih
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const surah = Number(searchParams.get("surah") ?? "1");
  const ayah = Number(searchParams.get("ayah") ?? "1");
  const reciter = searchParams.get("reciter") ?? "ar.alafasy";
  const translation = searchParams.get("translation") || undefined;

  if (!Number.isFinite(surah) || surah < 1 || surah > 114) {
    return NextResponse.json(
      { ok: false, error: "Invalid surah number" },
      { status: 400 }
    );
  }
  if (!Number.isFinite(ayah) || ayah < 1) {
    return NextResponse.json(
      { ok: false, error: "Invalid ayah number" },
      { status: 400 }
    );
  }

  try {
    const result = await fetchAyah(surah, ayah, reciter, translation);
    if (!result) {
      return NextResponse.json(
        { ok: false, error: "Ayah not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ ok: true, data: result });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
