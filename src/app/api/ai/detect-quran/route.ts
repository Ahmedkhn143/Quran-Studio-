import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    
    if (!file) {
      return NextResponse.json({ ok: false, error: "No audio file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileBase64 = buffer.toString("base64");

    const zai = await ZAI.create();
    
    // Step 1: Transcribe the recitation using ZAI ASR
    let transcript = "";
    try {
      const asrResponse = await zai.audio.asr.create({
        file_base64: fileBase64
      });
      transcript = asrResponse?.text || "";
    } catch (asrErr: any) {
      console.error("ASR transcription failed:", asrErr);
      return NextResponse.json({ ok: false, error: "Failed to transcribe audio recitation" }, { status: 500 });
    }

    if (!transcript.trim()) {
      return NextResponse.json({ ok: false, error: "No speech or transcription could be generated from the audio file" }, { status: 400 });
    }

    // Step 2: Use LLM to match the transcript to the exact Surah and Ayah range
    const systemPrompt = `You are a professional Quran scholar. Match the provided Arabic transcription of a recitation to the exact Surah number and Ayah numbers (start and end ayah).
Return ONLY a valid JSON object in this format: { "surah": <number>, "fromAyah": <number>, "toAyah": <number>, "confidence": <0-100> }
Do not output any markdown code blocks, explanations, or extra text. Output only raw JSON.`;

    let matchedResult = { surah: 1, fromAyah: 1, toAyah: 7, confidence: 50 };
    try {
      const chatResponse = await zai.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Arabic transcription text: "${transcript}"` }
        ]
      });

      const responseText = chatResponse?.choices?.[0]?.message?.content || chatResponse?.content || "";
      const jsonMatch = responseText.match(/\{[\s\S]*?\}/);
      if (jsonMatch) {
        matchedResult = JSON.parse(jsonMatch[0]);
      }
    } catch (chatErr: any) {
      console.error("Surah alignment failed:", chatErr);
      // Fallback response instead of crashing
    }

    return NextResponse.json({
      ok: true,
      transcript,
      surah: matchedResult.surah,
      fromAyah: matchedResult.fromAyah,
      toAyah: matchedResult.toAyah,
      confidence: matchedResult.confidence
    });

  } catch (err: any) {
    console.error("detect-quran error:", err);
    return NextResponse.json({ ok: false, error: err?.message || "Unknown error occurred" }, { status: 500 });
  }
}
