import { NextResponse } from "next/server";
import { fetchSurahList } from "@/lib/quran-api";

// GET /api/quran/surahs — returns list of 114 surahs.
export async function GET() {
  try {
    const list = await fetchSurahList();
    return NextResponse.json({ ok: true, data: list });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
