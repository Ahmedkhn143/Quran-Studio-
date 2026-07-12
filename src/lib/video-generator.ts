"use client";

/**
 * Client-side Quran video generator.
 *
 * Uses Canvas 2D to render each frame (background + Arabic verse + translation),
 * and MediaRecorder API to capture the canvas + audio into a downloadable video.
 *
 * Works fully in the browser — no server rendering needed.
 */

export interface VideoGenOptions {
  // Slides to render
  slides: SlideData[];
  // Background
  background: BackgroundSpec;
  // Text style
  textColor: string;
  textShadow: string;
  textSize: number; // px
  showTranslation: boolean;
  // Output
  width: number;
  height: number;
  fps: number;
  format: "webm" | "mp4";
  // Callbacks
  onProgress?: (percent: number, status: string) => void;
  onComplete?: (blob: Blob, url: string) => void;
  onError?: (err: Error) => void;
}

export interface SlideData {
  arabicWords: { text: string; audio?: string; durationMs?: number }[];
  translation?: string;
  surahName: string;
  ayahNumber: number;
  audio?: string; // full ayah audio fallback
}

export interface BackgroundSpec {
  type: "preset" | "image" | "gradient" | "color";
  // For preset/gradient/color
  cssValue?: string;
  // For image
  imageUrl?: string;
  // Opacity 0-100
  opacity?: number;
}

// Parse a CSS gradient/color string into something canvas can use.
// Returns either a fillable color OR a function that paints onto ctx.
function paintBackground(
  ctx: CanvasRenderingContext2D,
  bg: BackgroundSpec,
  w: number,
  h: number,
  bgImage: HTMLImageElement | null
) {
  // Black base
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, w, h);

  if (bg.type === "image" && bgImage) {
    // Cover-fit
    const imgRatio = bgImage.width / bgImage.height;
    const canvasRatio = w / h;
    let sx = 0, sy = 0, sw = bgImage.width, sh = bgImage.height;
    if (imgRatio > canvasRatio) {
      // image wider — crop sides
      sw = bgImage.height * canvasRatio;
      sx = (bgImage.width - sw) / 2;
    } else {
      sh = bgImage.width / canvasRatio;
      sy = (bgImage.height - sh) / 2;
    }
    ctx.drawImage(bgImage, sx, sy, sw, sh, 0, 0, w, h);
    // Apply opacity by drawing black overlay
    const opacity = (100 - (bg.opacity ?? 100)) / 100;
    if (opacity > 0) {
      ctx.fillStyle = `rgba(0,0,0,${opacity})`;
      ctx.fillRect(0, 0, w, h);
    }
    return;
  }

  // Try parsing CSS gradient — supports linear-gradient and radial-gradient.
  // We'll fallback to a solid color if not parseable.
  const css = bg.cssValue ?? "";
  if (css.includes("linear-gradient")) {
    paintLinearGradient(ctx, css, w, h);
  } else if (css.includes("radial-gradient")) {
    paintRadialGradient(ctx, css, w, h);
  } else {
    // Solid color
    ctx.fillStyle = css || "#0a2e22";
    ctx.fillRect(0, 0, w, h);
  }
  const opacity = (100 - (bg.opacity ?? 100)) / 100;
  if (opacity > 0) {
    ctx.fillStyle = `rgba(0,0,0,${opacity})`;
    ctx.fillRect(0, 0, w, h);
  }
}

function parseColorStops(stopsStr: string): { pos: number; color: string }[] {
  // Split by comma but respect parentheses
  const stops: { pos: number; color: string }[] = [];
  let depth = 0;
  let buf = "";
  for (const ch of stopsStr) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === "," && depth === 0) {
      stops.push(parseStop(buf.trim()));
      buf = "";
    } else {
      buf += ch;
    }
  }
  if (buf.trim()) stops.push(parseStop(buf.trim()));
  // Fill in missing positions
  if (stops.length > 0) {
    if (stops[0].pos === -1) stops[0].pos = 0;
    if (stops[stops.length - 1].pos === -1) stops[stops.length - 1].pos = 1;
    // Interpolate missing middle positions
    for (let i = 1; i < stops.length - 1; i++) {
      if (stops[i].pos === -1) {
        let prev = i - 1;
        let next = i + 1;
        while (next < stops.length && stops[next].pos === -1) next++;
        const startPos = stops[prev].pos;
        const endPos = stops[next].pos;
        const range = next - prev;
        stops[i].pos = startPos + ((endPos - startPos) * (i - prev)) / range;
      }
    }
  }
  return stops;
}

function parseStop(s: string): { pos: number; color: string } {
  // e.g. "rgba(0,0,0,0.5) 30%" or "#fff 50%" or "red"
  const match = s.match(/^(.+?)\s+(\d+(?:\.\d+)?%?)$/);
  if (match) {
    const color = match[1].trim();
    let posStr = match[2].trim();
    let pos = -1;
    if (posStr.endsWith("%")) {
      pos = parseFloat(posStr.slice(0, -1)) / 100;
    } else {
      pos = parseFloat(posStr);
    }
    return { pos, color };
  }
  return { pos: -1, color: s };
}

function colorToRgba(c: string): string {
  // Convert hex / rgb / rgba / named to rgba string. Best-effort.
  c = c.trim();
  if (c.startsWith("#")) {
    const hex = c.slice(1);
    let r, g, b, a = 1;
    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } else if (hex.length === 6 || hex.length === 8) {
      r = parseInt(hex.slice(0, 2), 16);
      g = parseInt(hex.slice(2, 4), 16);
      b = parseInt(hex.slice(4, 6), 16);
      if (hex.length === 8) a = parseInt(hex.slice(6, 8), 16) / 255;
    } else {
      r = 0; g = 0; b = 0;
    }
    return `rgba(${r},${g},${b},${a})`;
  }
  return c;
}

function paintLinearGradient(ctx: CanvasRenderingContext2D, css: string, w: number, h: number) {
  // linear-gradient(135deg, color1 0%, color2 100%)
  const m = css.match(/linear-gradient\(([^,]+),(.+)\)/i);
  if (!m) {
    ctx.fillStyle = "#0a2e22";
    ctx.fillRect(0, 0, w, h);
    return;
  }
  const angleStr = m[1].trim();
  let angle = 180; // default: top to bottom
  if (angleStr.endsWith("deg")) {
    angle = parseFloat(angleStr);
  } else if (angleStr === "to right") angle = 90;
  else if (angleStr === "to left") angle = 270;
  else if (angleStr === "to top") angle = 0;
  else if (angleStr === "to bottom") angle = 180;
  // Convert CSS angle to canvas coordinates
  const rad = (angle - 90) * Math.PI / 180;
  const cx = w / 2, cy = h / 2;
  const len = Math.sqrt(w * w + h * h) / 2;
  const x1 = cx - Math.cos(rad) * len;
  const y1 = cy - Math.sin(rad) * len;
  const x2 = cx + Math.cos(rad) * len;
  const y2 = cy + Math.sin(rad) * len;
  const grad = ctx.createLinearGradient(x1, y1, x2, y2);
  const stops = parseColorStops(m[2]);
  stops.forEach((s) => grad.addColorStop(s.pos, colorToRgba(s.color)));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

function paintRadialGradient(ctx: CanvasRenderingContext2D, css: string, w: number, h: number) {
  const m = css.match(/radial-gradient\((?:[^,]+,\s*)?(.+)\)/i);
  if (!m) {
    ctx.fillStyle = "#0a2e22";
    ctx.fillRect(0, 0, w, h);
    return;
  }
  const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) / 1.5);
  const stops = parseColorStops(m[1]);
  stops.forEach((s) => grad.addColorStop(s.pos, colorToRgba(s.color)));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

// Draw Arabic text with word highlighting. Returns the y position after drawing.
function drawSlide(
  ctx: CanvasRenderingContext2D,
  slide: SlideData,
  opts: VideoGenOptions,
  activeWordIdx: number,
  bgImage: HTMLImageElement | null
) {
  const { width: w, height: h } = opts;

  // Background
  paintBackground(ctx, opts.background, w, h, bgImage);

  // Vignette
  const vignette = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) / 3, w / 2, h / 2, Math.max(w, h) / 1.2);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,0.5)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);

  // Top-right meta badge
  ctx.font = `bold ${Math.round(h * 0.025)}px Inter, sans-serif`;
  ctx.textAlign = "right";
  ctx.textBaseline = "top";
  const meta = `${slide.surahName} · ${slide.ayahNumber}`;
  const metaPad = Math.round(h * 0.02);
  const metaW = ctx.measureText(meta.toUpperCase()).width + metaPad * 2;
  const metaH = Math.round(h * 0.045);
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.fillRect(w - metaW - metaPad, metaPad, metaW, metaH);
  ctx.fillStyle = "#d4a017";
  ctx.fillText(meta.toUpperCase(), w - metaPad - metaPad, metaPad + metaH / 2 - 2);

  // Arabic words — center
  const arabicFontSize = opts.textSize;
  ctx.font = `bold ${arabicFontSize}px "Scheherazade New", "Amiri", serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Word wrap: split words into lines that fit within w * 0.85
  const maxWidth = w * 0.85;
  const words = slide.arabicWords;
  const lines: { word: string; idx: number }[][] = [];
  let currentLine: { word: string; idx: number }[] = [];
  let currentWidth = 0;
  const spaceW = ctx.measureText(" ").width;

  for (let i = 0; i < words.length; i++) {
    const wWidth = ctx.measureText(words[i].text).width;
    if (currentWidth + wWidth > maxWidth && currentLine.length > 0) {
      lines.push(currentLine);
      currentLine = [];
      currentWidth = 0;
    }
    currentLine.push({ word: words[i].text, idx: i });
    currentWidth += wWidth + spaceW;
  }
  if (currentLine.length > 0) lines.push(currentLine);

  // Calculate total height
  const lineHeight = arabicFontSize * 1.6;
  const totalArabicHeight = lines.length * lineHeight;
  const arabicStartY = h / 2 - totalArabicHeight / 2;

  // Draw each line
  lines.forEach((line, lineIdx) => {
    const lineY = arabicStartY + lineIdx * lineHeight + lineHeight / 2;
    // Calculate total line width
    let lineW = 0;
    for (const item of line) {
      lineW += ctx.measureText(item.word).width;
    }
    lineW += spaceW * (line.length - 1);
    let x = w / 2 - lineW / 2;
    for (const item of line) {
      const ww = ctx.measureText(item.word).width;
      const isActive = item.idx === activeWordIdx;
      // Shadow
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillText(item.word, x + ww / 2 + 2, lineY + 2);
      // Word
      ctx.fillStyle = isActive ? "#d4a017" : opts.textColor;
      ctx.fillText(item.word, x + ww / 2, lineY);
      // Active glow
      if (isActive) {
        ctx.shadowColor = "rgba(212,160,23,0.8)";
        ctx.shadowBlur = 24;
        ctx.fillStyle = "#d4a017";
        ctx.fillText(item.word, x + ww / 2, lineY);
        ctx.shadowBlur = 0;
      }
      x += ww + spaceW;
    }
  });

  // Translation
  if (opts.showTranslation && slide.translation) {
    const transFontSize = Math.round(h * 0.035);
    ctx.font = `500 ${transFontSize}px Inter, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    const transY = arabicStartY + totalArabicHeight + h * 0.04;
    // Wrap translation
    const transMaxW = w * 0.7;
    const transLines = wrapText(ctx, slide.translation, transMaxW);
    // Background box
    const padX = h * 0.03;
    const padY = h * 0.015;
    const lineH = transFontSize * 1.4;
    const boxH = transLines.length * lineH + padY * 2;
    let maxLineW = 0;
    for (const line of transLines) {
      const lw = ctx.measureText(line).width;
      if (lw > maxLineW) maxLineW = lw;
    }
    const boxW = maxLineW + padX * 2;
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.fillRect(w / 2 - boxW / 2, transY, boxW, boxH);
    // Text
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    transLines.forEach((line, i) => {
      ctx.fillText(line, w / 2, transY + padY + i * lineH);
    });
  }
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const test = current ? current + " " + word : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

// Load image helper
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

// Pick a MediaRecorder-supported mime type
function pickMimeType(format: "webm" | "mp4"): string {
  const candidates = format === "mp4"
    ? [
        "video/mp4;codecs=h264,aac",
        "video/mp4;codecs=avc1",
        "video/mp4",
      ]
    : [
        "video/webm;codecs=vp9,opus",
        "video/webm;codecs=vp8,opus",
        "video/webm;codecs=vp9",
        "video/webm;codecs=vp8",
        "video/webm",
      ];
  for (const c of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(c)) {
      return c;
    }
  }
  return format === "mp4" ? "video/mp4" : "video/webm";
}

export interface GenResult {
  blob: Blob;
  url: string;
  mimeType: string;
  ext: string;
}

/**
 * Generate a Quran video by:
 * 1. Setting up a canvas at the target resolution
 * 2. Playing per-word audio sequentially
 * 3. Rendering each frame to canvas with active word highlighted
 * 4. Capturing canvas stream via MediaRecorder
 * 5. Mixing in audio via Web Audio API
 * 6. Returning a downloadable Blob
 */
export async function generateQuranVideo(opts: VideoGenOptions): Promise<GenResult> {
  if (typeof window === "undefined") {
    throw new Error("Video generation requires a browser environment");
  }
  if (!opts.slides.length) {
    throw new Error("No slides to render");
  }
  if (typeof MediaRecorder === "undefined") {
    throw new Error("Your browser does not support MediaRecorder. Try Chrome or Edge.");
  }

  const { width, height, fps, onProgress } = opts;
  const mimeType = pickMimeType(opts.format);
  const ext = opts.format === "mp4" ? "mp4" : "webm";

  // Load background image if needed
  let bgImage: HTMLImageElement | null = null;
  if (opts.background.type === "image" && opts.background.imageUrl) {
    try {
      bgImage = await loadImage(opts.background.imageUrl);
    } catch {
      // proceed without image
    }
  }

  // Setup canvas
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) throw new Error("Canvas 2D context not available");

  // Initial frame
  drawSlide(ctx, opts.slides[0], opts, -1, bgImage);

  // Setup MediaRecorder with canvas stream
  // @ts-ignore - captureStream exists on HTMLCanvasElement in modern browsers
  const stream: MediaStream = canvas.captureStream(fps);

  // Setup audio mixing via Web Audio API
  let audioCtx: AudioContext | null = null;
  let audioDest: MediaStreamAudioDestinationNode | null = null;
  try {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioDest = audioCtx.createMediaStreamDestination();
    const audioTrack = audioDest.stream.getAudioTracks()[0];
    if (audioTrack) stream.addTrack(audioTrack);
  } catch {
    // proceed without audio
  }

  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: width * height * fps * 0.15, // ~0.15 bits per pixel per frame
  });

  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };

  return new Promise<GenResult>(async (resolve, reject) => {
    recorder.onstop = () => {
      try {
        const blob = new Blob(chunks, { type: mimeType });
        const url = URL.createObjectURL(blob);
        onProgress?.(100, "Done");
        resolve({ blob, url, mimeType, ext });
      } catch (e) {
        reject(e as Error);
      }
    };

    recorder.onerror = (e: any) => reject(e?.error || new Error("Recorder error"));

    try {
      recorder.start(1000);
      onProgress?.(0, "Starting...");

      let totalDurationMs = 0;
      // Pre-calculate total duration
      for (const slide of opts.slides) {
        if (slide.arabicWords.length > 0 && slide.arabicWords.every((w) => w.audio)) {
          // We'll measure during playback; estimate 800ms per word for now
          totalDurationMs += slide.arabicWords.length * 900;
        } else if (slide.audio) {
          totalDurationMs += 5000;
        } else {
          totalDurationMs += 3000;
        }
      }

      let elapsedMs = 0;

      for (let s = 0; s < opts.slides.length; s++) {
        const slide = opts.slides[s];
        const statusText = `Rendering slide ${s + 1}/${opts.slides.length}`;
        onProgress?.(Math.round((elapsedMs / totalDurationMs) * 100), statusText);

        // Render this slide
        if (slide.arabicWords.length > 0 && slide.arabicWords.every((w) => w.audio)) {
          // Word-by-word with per-word audio
          for (let i = 0; i < slide.arabicWords.length; i++) {
            drawSlide(ctx, slide, opts, i, bgImage);
            // Play word audio
            const word = slide.arabicWords[i];
            try {
              const buf = await fetchAudioBuffer(word.audio!, audioCtx);
              if (audioCtx && audioDest && buf) {
                const src = audioCtx.createBufferSource();
                src.buffer = buf;
                src.connect(audioDest);
                src.start();
                const dur = buf.duration * 1000;
                await new Promise((r) => setTimeout(r, dur + 150));
                elapsedMs += dur + 150;
              } else {
                await new Promise((r) => setTimeout(r, 600));
                elapsedMs += 600;
              }
            } catch {
              await new Promise((r) => setTimeout(r, 500));
              elapsedMs += 500;
            }
            onProgress?.(Math.min(99, Math.round((elapsedMs / totalDurationMs) * 100)), statusText);
          }
        } else if (slide.audio) {
          // Full ayah audio — play and animate word rotation
          try {
            const buf = await fetchAudioBuffer(slide.audio, audioCtx);
            if (audioCtx && audioDest && buf) {
              const src = audioCtx.createBufferSource();
              src.buffer = buf;
              src.connect(audioDest);
              src.start();
              const dur = buf.duration * 1000;
              const wordCount = slide.arabicWords.length;
              const interval = dur / Math.max(wordCount, 1);
              const startMs = Date.now();
              while (Date.now() - startMs < dur) {
                const t = Date.now() - startMs;
                const idx = Math.min(wordCount - 1, Math.floor(t / interval));
                drawSlide(ctx, slide, opts, idx, bgImage);
                await new Promise((r) => setTimeout(r, Math.min(100, interval)));
                onProgress?.(
                  Math.min(99, Math.round(((elapsedMs + t) / totalDurationMs) * 100)),
                  statusText
                );
              }
              elapsedMs += dur;
            } else {
              // No audio — just render for 3 seconds
              drawSlide(ctx, slide, opts, -1, bgImage);
              await new Promise((r) => setTimeout(r, 3000));
              elapsedMs += 3000;
            }
          } catch {
            drawSlide(ctx, slide, opts, -1, bgImage);
            await new Promise((r) => setTimeout(r, 3000));
            elapsedMs += 3000;
          }
        } else {
          // No audio — render static for 3 seconds
          drawSlide(ctx, slide, opts, -1, bgImage);
          await new Promise((r) => setTimeout(r, 3000));
          elapsedMs += 3000;
        }
      }

      onProgress?.(99, "Finalizing...");
      // Wait a bit for last frames to flush
      await new Promise((r) => setTimeout(r, 500));
      recorder.stop();
      if (audioCtx) {
        try { await audioCtx.close(); } catch {}
      }
    } catch (err) {
      try { recorder.stop(); } catch {}
      if (audioCtx) { try { await audioCtx.close(); } catch {} }
      reject(err as Error);
    }
  });
}

// Fetch audio and decode to AudioBuffer
async function fetchAudioBuffer(
  url: string,
  audioCtx: AudioContext | null
): Promise<AudioBuffer | null> {
  if (!audioCtx || !url) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const arr = await res.arrayBuffer();
    return await audioCtx.decodeAudioData(arr);
  } catch {
    return null;
  }
}

// Helper to trigger browser download
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
