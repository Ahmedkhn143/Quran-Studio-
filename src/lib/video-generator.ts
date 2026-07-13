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
  showArabic?: boolean;
  highlightColor?: string;
  highlightGradientStart?: string;
  highlightGradientEnd?: string;
  highlightGlowColor?: string;
  // Output
  width: number;
  height: number;
  fps: number;
  format: "webm" | "mp4";
  arabicFont?: string;
  translationFont?: string;
  overlayText?: string;
  overlayTextColor?: string;
  overlayTextSize?: number;
  overlayTextPosition?: "top" | "bottom";
  
  // Custom video enhancements
  backgroundEffect?: "none" | "ken_burns" | "particles" | "blur" | "color_overlay";
  textEntranceEffect?: "none" | "fade" | "typewriter" | "slide_in";
  transitionEffect?: "none" | "crossfade" | "slide" | "wipe";
  showAudioVisualizer?: boolean;
  showHighlight?: boolean;
  elements?: CanvasElement[];

  // Custom text locations offsets
  arabicYOffset?: number;
  translationYOffset?: number;

  // Callbacks
  onProgress?: (percent: number, status: string) => void;
  onComplete?: (blob: Blob, url: string) => void;
  onError?: (err: Error) => void;
}

export interface CanvasElement {
  id: string;
  type: "text" | "image" | "shape" | "logo";
  shapeType?: "rectangle" | "circle" | "triangle";
  x: number; // percentage (0 to 100)
  y: number; // percentage (0 to 100)
  width: number; // percentage (0 to 100)
  height: number; // percentage (0 to 100)
  rotation?: number; // degrees
  content?: string;
  color?: string;
  fontSize?: number;
  fontFamily?: string;
  opacity?: number;
  imageUrl?: string;
  zIndex: number;
}

export interface SlideData {
  arabicWords: { text: string; audio?: string; durationMs?: number }[];
  translation?: string;
  surahName: string;
  ayahNumber: number;
  audio?: string; // full ayah audio fallback
  audioStart?: number;
  audioEnd?: number;
}

export interface BackgroundSpec {
  type: "preset" | "image" | "gradient" | "color" | "video";
  // For preset/gradient/color
  cssValue?: string;
  // For image/video
  imageUrl?: string;
  videoUrl?: string;
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
export function drawSlide(
  ctx: CanvasRenderingContext2D,
  slide: SlideData,
  opts: VideoGenOptions,
  activeWordIdx: number,
  bgImage: HTMLImageElement | null,
  bgVideo: HTMLVideoElement | null = null,
  slideProgress = 0
) {
  const { width: w, height: h } = opts;

  // Background
  if (opts.background.type === "video" && bgVideo) {
    const vRatio = bgVideo.videoWidth / bgVideo.videoHeight || 16/9;
    const cRatio = w / h;
    let sx = 0, sy = 0, sw = bgVideo.videoWidth || w, sh = bgVideo.videoHeight || h;
    if (vRatio > cRatio) {
      sw = sh * cRatio;
      sx = ((bgVideo.videoWidth || w) - sw) / 2;
    } else {
      sh = sw / cRatio;
      sy = ((bgVideo.videoHeight || h) - sh) / 2;
    }
    ctx.drawImage(bgVideo, sx, sy, sw, sh, 0, 0, w, h);
  } else if (bgImage) {
    const isKenBurns = opts.backgroundEffect === "ken_burns";
    const scale = isKenBurns ? 1 + 0.08 * slideProgress : 1;
    const dx = isKenBurns ? -((w * scale - w) / 2) * slideProgress : 0;
    const dy = isKenBurns ? -((h * scale - h) / 2) * slideProgress : 0;
    ctx.drawImage(bgImage, dx, dy, w * scale, h * scale);
  } else {
    paintBackground(ctx, opts.background, w, h, bgImage);
  }

  // Background effects: color overlay, particles
  if (opts.backgroundEffect === "color_overlay") {
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(0, 0, w, h);
  }
  
  if (opts.backgroundEffect === "particles") {
    ctx.fillStyle = "rgba(255, 215, 0, 0.3)";
    for (let i = 0; i < 20; i++) {
      const px = ((Math.sin(i * 123 + slideProgress * 2) + 1) / 2) * w;
      const py = h - ((i * 45 + slideProgress * 200) % h);
      const size = 1.5 + (i % 3);
      ctx.beginPath();
      ctx.arc(px, py, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Opacity overlay
  const opacity = (100 - (opts.background.opacity ?? 100)) / 100;
  if (opacity > 0) {
    ctx.fillStyle = `rgba(0,0,0,${opacity})`;
    ctx.fillRect(0, 0, w, h);
  }

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
  const showArabic = opts.showArabic !== false;
  const arabicFontSize = opts.textSize;
  const arabicFont = opts.arabicFont || '"Scheherazade New", "Amiri", serif';
  ctx.font = `bold ${arabicFontSize}px ${arabicFont}`;
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
  const lineHeight = showArabic ? arabicFontSize * 1.6 : 0;
  const totalArabicHeight = showArabic ? lines.length * lineHeight : 0;
  
  // Apply Y location offsets: (arabicYOffset is percentage of height, -100 to 100)
  const yOffsetPx = opts.arabicYOffset ? (opts.arabicYOffset / 100) * h : 0;
  const arabicStartY = h / 2 - totalArabicHeight / 2 + yOffsetPx;

  if (showArabic) {
    // Draw each line
    lines.forEach((line, lineIdx) => {
      const lineY = arabicStartY + lineIdx * lineHeight + lineHeight / 2;
      // Calculate total line width
      let lineW = 0;
      for (const item of line) {
        lineW += ctx.measureText(item.word).width;
      }
      lineW += spaceW * (line.length - 1);
      
      // Starting X at center + half width, rendering RTL (moving leftwards)
      let x = w / 2 + lineW / 2;
      for (let j = 0; j < line.length; j++) {
        const item = line[j];
        const ww = ctx.measureText(item.word).width;
        const isActive = item.idx === activeWordIdx;
        const isHighlighted = isActive && (opts.showHighlight !== false);
        
        // Shadow
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillText(item.word, x - ww / 2 + 2, lineY + 2);
        
        // Word Color & Glow
        let highlightStyle: string | CanvasGradient = opts.highlightColor || "#d4a017";
        if (opts.highlightGradientStart && opts.highlightGradientEnd) {
          const grad = ctx.createLinearGradient(x - ww, lineY, x, lineY);
          grad.addColorStop(0, opts.highlightGradientStart);
          grad.addColorStop(1, opts.highlightGradientEnd);
          highlightStyle = grad;
        }
        
        ctx.fillStyle = isHighlighted ? highlightStyle : opts.textColor;
        ctx.fillText(item.word, x - ww / 2, lineY);
        
        if (isHighlighted) {
          ctx.save();
          ctx.shadowColor = opts.highlightGlowColor || "rgba(212,160,23,0.8)";
          ctx.shadowBlur = 24;
          ctx.fillStyle = highlightStyle;
          ctx.fillText(item.word, x - ww / 2, lineY);
          ctx.restore();
        }
        x -= (ww + spaceW);
      }
    });
  }

  // Translation
  if (opts.showTranslation && slide.translation) {
    const transFontSize = Math.round(h * 0.035);
    const translationFont = opts.translationFont || "Inter, sans-serif";
    ctx.font = `500 ${transFontSize}px ${translationFont}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    
    const transYOffsetPx = opts.translationYOffset ? (opts.translationYOffset / 100) * h : 0;
    // Wrap translation
    const transMaxW = w * 0.7;
    const transLines = wrapText(ctx, slide.translation, transMaxW);
    // Background box
    const padX = h * 0.03;
    const padY = h * 0.015;
    const lineH = transFontSize * 1.4;
    const boxH = transLines.length * lineH + padY * 2;
    
    let transY = arabicStartY + totalArabicHeight + h * 0.04 + transYOffsetPx;
    if (!showArabic) {
      transY = h / 2 - boxH / 2 + transYOffsetPx;
    }

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

  // Watermark/Custom Overlay Text
  if (opts.overlayText) {
    const size = opts.overlayTextSize || Math.round(h * 0.03);
    ctx.font = `${size}px Inter, sans-serif`;
    ctx.fillStyle = opts.overlayTextColor || "rgba(255,255,255,0.7)";
    ctx.textAlign = "center";
    if (opts.overlayTextPosition === "top") {
      ctx.textBaseline = "top";
      ctx.fillText(opts.overlayText, w / 2, Math.round(h * 0.05));
    } else {
      ctx.textBaseline = "bottom";
      ctx.fillText(opts.overlayText, w / 2, h - Math.round(h * 0.05));
    }
  }

  // Draw custom canvas elements
  if (opts.elements && opts.elements.length > 0) {
    const sorted = [...opts.elements].sort((a, b) => a.zIndex - b.zIndex);
    sorted.forEach((el) => {
      ctx.save();
      
      const elX = (el.x / 100) * w;
      const elY = (el.y / 100) * h;
      const elW = (el.width / 100) * w;
      const elH = (el.height / 100) * h;
      const opacity = el.opacity !== undefined ? el.opacity / 100 : 1;
      
      ctx.globalAlpha = opacity;
      
      // Translate to element center for rotation
      ctx.translate(elX + elW / 2, elY + elH / 2);
      if (el.rotation) {
        ctx.rotate((el.rotation * Math.PI) / 180);
      }
      
      if (el.type === "text" && el.content) {
        ctx.fillStyle = el.color || "#ffffff";
        const fSize = el.fontSize || 24;
        const fFamily = el.fontFamily || "Inter, sans-serif";
        ctx.font = `${fSize}px ${fFamily}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(el.content, 0, 0);
      } else if (el.type === "shape") {
        ctx.fillStyle = el.color || "rgba(255,255,255,0.5)";
        if (el.shapeType === "circle") {
          ctx.beginPath();
          ctx.arc(0, 0, Math.min(elW, elH) / 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (el.shapeType === "triangle") {
          ctx.beginPath();
          ctx.moveTo(0, -elH / 2);
          ctx.lineTo(elW / 2, elH / 2);
          ctx.lineTo(-elW / 2, elH / 2);
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.fillRect(-elW / 2, -elH / 2, elW, elH);
        }
      } else if ((el.type === "image" || el.type === "logo") && el.imageUrl) {
        const imgId = `el_img_${el.id}`;
        let img = (window as any)[imgId] as HTMLImageElement | null;
        if (!img) {
          img = new Image();
          img.crossOrigin = "anonymous";
          img.src = el.imageUrl;
          img.onload = () => { (window as any)[imgId] = img; };
        }
        if (img && img.complete) {
          ctx.drawImage(img, -elW / 2, -elH / 2, elW, elH);
        } else {
          ctx.fillStyle = "rgba(255,255,255,0.1)";
          ctx.fillRect(-elW / 2, -elH / 2, elW, elH);
        }
      }
      
      ctx.restore();
    });
  }

  // Audio Visualizer synced wave
  if (opts.showAudioVisualizer) {
    const waveH = h * 0.07;
    const waveY = h - waveH - h * 0.08;
    ctx.strokeStyle = "rgba(212, 160, 23, 0.75)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (let x = 0; x < w; x += 6) {
      const offset = Math.sin(x * 0.015 + slideProgress * 60) * Math.cos(x * 0.004) * (waveH * 0.4);
      if (x === 0) ctx.moveTo(x, waveY + offset);
      else ctx.lineTo(x, waveY + offset);
    }
    ctx.stroke();
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
 * 2. Running a CONTINUOUS rendering loop that repaints the canvas every frame
 * 3. Playing per-word audio sequentially, updating shared render state
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

  // Load background video if needed
  let bgVideo: HTMLVideoElement | null = null;
  if (opts.background.type === "video" && opts.background.videoUrl) {
    try {
      bgVideo = document.createElement("video");
      bgVideo.src = opts.background.videoUrl;
      bgVideo.muted = true;
      bgVideo.playsInline = true;
      bgVideo.crossOrigin = "anonymous";
      bgVideo.load();
      await new Promise<void>((resolve) => {
        bgVideo!.onloadedmetadata = () => resolve();
        bgVideo!.onerror = () => resolve();
        setTimeout(resolve, 2000);
      });
    } catch {
      bgVideo = null;
    }
  }

  // ─── Shared mutable render state ───────────────────────────────────────────
  // This state is read by the continuous render loop and written by the audio
  // playback code. This decouples frame painting from audio timing.
  const renderState = {
    currentSlideIdx: 0,
    activeWordIdx: -1,
    currentTimeMs: 0,
    slideProgress: 0,
    isRunning: true,
  };

  // Initial frame
  drawSlide(ctx, opts.slides[0], opts, -1, bgImage, bgVideo, 0);

  // ─── Audio pipeline ────────────────────────────────────────────────────────
  let audioCtx: AudioContext | null = null;
  let audioDest: MediaStreamAudioDestinationNode | null = null;
  let masterGain: GainNode | null = null;

  try {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (audioCtx.state === "suspended") {
      await audioCtx.resume();
    }
    audioDest = audioCtx.createMediaStreamDestination();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 1.0;
    masterGain.connect(audioDest);
  } catch {
    audioCtx = null;
    audioDest = null;
    masterGain = null;
  }

  // ─── Canvas stream ──────────────────────────────────────────────────────────
  // @ts-ignore - captureStream exists on HTMLCanvasElement in modern browsers
  const canvasStream: MediaStream = canvas.captureStream(0);
  // Using captureStream(0) = manual frame request mode for more reliable capture

  // Build the combined stream — add audio track BEFORE creating MediaRecorder
  const combinedStream = new MediaStream();
  canvasStream.getVideoTracks().forEach((t) => combinedStream.addTrack(t));
  if (audioDest) {
    audioDest.stream.getAudioTracks().forEach((t) => combinedStream.addTrack(t));
  }

  // ─── Bitrate calculation ───────────────────────────────────────────────────
  // Scale bitrate based on resolution for proper quality at all sizes
  const pixelCount = width * height;
  let videoBitsPerSecond: number;
  if (pixelCount <= 854 * 480) {
    videoBitsPerSecond = 2_500_000;       // 480p: 2.5 Mbps
  } else if (pixelCount <= 1280 * 720) {
    videoBitsPerSecond = 5_000_000;       // 720p: 5 Mbps
  } else if (pixelCount <= 1920 * 1080) {
    videoBitsPerSecond = 10_000_000;      // 1080p: 10 Mbps
  } else if (pixelCount <= 2560 * 1440) {
    videoBitsPerSecond = 20_000_000;      // 2K: 20 Mbps
  } else if (pixelCount <= 3840 * 2160) {
    videoBitsPerSecond = 40_000_000;      // 4K: 40 Mbps
  } else {
    videoBitsPerSecond = 80_000_000;      // 8K: 80 Mbps
  }

  // ─── MediaRecorder ─────────────────────────────────────────────────────────
  const recorderOptions: MediaRecorderOptions = {
    mimeType,
    videoBitsPerSecond,
  };
  if (audioDest) {
    recorderOptions.audioBitsPerSecond = 192_000;
  }

  const recorder = new MediaRecorder(combinedStream, recorderOptions);

  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };

  // ─── Continuous frame rendering loop ───────────────────────────────────────
  // This is the KEY fix: we continuously repaint the canvas at the target FPS
  // so MediaRecorder always has fresh frames to capture. Without this, the
  // canvas goes stale during audio playback waits and the video is blank.
  const frameIntervalMs = Math.round(1000 / fps);
  const frameLoop = setInterval(() => {
    if (!renderState.isRunning) return;
    const slide = opts.slides[renderState.currentSlideIdx];
    if (!slide) return;
    drawSlide(
      ctx,
      slide,
      opts,
      renderState.activeWordIdx,
      bgImage,
      bgVideo,
      renderState.slideProgress
    );
    // Request a frame capture from the stream (manual mode with captureStream(0))
    try {
      const videoTrack = canvasStream.getVideoTracks()[0];
      if (videoTrack && 'requestFrame' in videoTrack) {
        (videoTrack as any).requestFrame();
      }
    } catch { /* some browsers don't support requestFrame */ }
  }, frameIntervalMs);

  return new Promise<GenResult>(async (resolve, reject) => {
    let startTime = Date.now();

    recorder.onstop = async () => {
      try {
        let blob = new Blob(chunks, { type: mimeType });
        if (opts.format === "webm") {
          try {
            const fixWebM = (await import("fix-webm-duration")).default;
            const duration = Date.now() - startTime;
            blob = await fixWebM(blob, duration);
          } catch (e) {
            console.error("Failed to fix WebM duration:", e);
          }
        }
        const url = URL.createObjectURL(blob);
        onProgress?.(100, "Done");
        resolve({ blob, url, mimeType, ext });
      } catch (e) {
        reject(e as Error);
      }
    };

    recorder.onerror = (e: any) => {
      clearInterval(frameLoop);
      renderState.isRunning = false;
      reject(e?.error || new Error("Recorder error"));
    };

    try {
      startTime = Date.now();
      recorder.start(500); // Smaller timeslice for more frequent data chunks
      onProgress?.(0, "Starting...");

      let totalDurationMs = 0;
      // Pre-calculate total duration
      for (const slide of opts.slides) {
        if (slide.arabicWords.length > 0 && slide.arabicWords.every((w) => w.audio)) {
          totalDurationMs += slide.arabicWords.length * 900;
        } else if (slide.audio) {
          totalDurationMs += 5000;
        } else {
          totalDurationMs += 3000;
        }
      }

      let elapsedMs = 0;

      for (let s = 0; s < opts.slides.length; s++) {
        // Update shared render state for this slide
        renderState.currentSlideIdx = s;
        renderState.activeWordIdx = -1;
        renderState.slideProgress = 0;

        const slide = opts.slides[s];
        const statusText = `Rendering ayah ${s + 1}/${opts.slides.length}`;
        onProgress?.(Math.round((elapsedMs / totalDurationMs) * 100), statusText);

        if (slide.arabicWords.length > 0 && slide.arabicWords.every((w) => w.audio)) {
          // ─── Word-by-word with per-word audio ─────────────────────────
          for (let i = 0; i < slide.arabicWords.length; i++) {
            // Update render state — the continuous loop will pick this up
            renderState.activeWordIdx = i;
            renderState.slideProgress = i / Math.max(slide.arabicWords.length - 1, 1);

            const word = slide.arabicWords[i];
            try {
              const buf = await fetchAudioBuffer(word.audio!, audioCtx);
              if (audioCtx && masterGain && buf) {
                const src = audioCtx.createBufferSource();
                src.buffer = buf;
                src.connect(masterGain);
                src.start();
                // Wait for the word audio to finish + small gap
                const dur = buf.duration * 1000;
                const gap = 80; // Small gap between words for natural pacing
                await new Promise((r) => setTimeout(r, dur + gap));
                elapsedMs += dur + gap;
              } else {
                await new Promise((r) => setTimeout(r, 600));
                elapsedMs += 600;
              }
            } catch {
              await new Promise((r) => setTimeout(r, 400));
              elapsedMs += 400;
            }
            onProgress?.(Math.min(99, Math.round((elapsedMs / totalDurationMs) * 100)), statusText);
          }
        } else if (slide.audio) {
          // ─── Full ayah audio — animate word highlights over duration ───
          try {
            const buf = await fetchAudioBuffer(slide.audio, audioCtx);
            if (audioCtx && masterGain && buf) {
              const src = audioCtx.createBufferSource();
              src.buffer = buf;
              src.connect(masterGain);
              const startSec = slide.audioStart || 0;
              const durationSec = (slide.audioEnd && slide.audioEnd > startSec)
                ? (slide.audioEnd - startSec) : buf.duration;
              src.start(0, startSec, durationSec);
              const dur = durationSec * 1000;
              const wordCount = slide.arabicWords.length;
              const wordInterval = dur / Math.max(wordCount, 1);
              const playStartMs = Date.now();

              // Update render state in a tight loop while audio plays
              while (Date.now() - playStartMs < dur) {
                const t = Date.now() - playStartMs;
                const idx = Math.min(wordCount - 1, Math.floor(t / wordInterval));
                renderState.activeWordIdx = idx;
                renderState.slideProgress = t / dur;
                renderState.currentTimeMs = elapsedMs + t;
                onProgress?.(
                  Math.min(99, Math.round(((elapsedMs + t) / totalDurationMs) * 100)),
                  statusText
                );
                // Yield to the render loop — don't monopolize the thread
                await new Promise((r) => setTimeout(r, 50));
              }
              elapsedMs += dur;
            } else {
              renderState.activeWordIdx = -1;
              await new Promise((r) => setTimeout(r, 3000));
              elapsedMs += 3000;
            }
          } catch {
            renderState.activeWordIdx = -1;
            await new Promise((r) => setTimeout(r, 3000));
            elapsedMs += 3000;
          }
        } else {
          // ─── No audio — render static for 3 seconds ───────────────────
          renderState.activeWordIdx = -1;
          await new Promise((r) => setTimeout(r, 3000));
          elapsedMs += 3000;
        }
      }

      onProgress?.(99, "Finalizing...");
      // Wait for the final audio to flush through the pipeline
      await new Promise((r) => setTimeout(r, 1000));
      // Stop the continuous rendering loop
      clearInterval(frameLoop);
      renderState.isRunning = false;
      recorder.stop();
      if (audioCtx) {
        try { await audioCtx.close(); } catch {}
      }
    } catch (err) {
      clearInterval(frameLoop);
      renderState.isRunning = false;
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
