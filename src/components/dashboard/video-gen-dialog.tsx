"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, FileVideo, Loader2, Check, Download, AlertCircle, Film,
  Monitor, Cloud, Settings2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  generateQuranVideo,
  type SlideData, type BackgroundSpec, type CanvasElement
} from "@/lib/video-generator";
import { toast } from "sonner";

interface AyahData {
  numberInSurah: number;
  text: string;
  audio: string;
  words: { text: string; audio?: string; translation?: string }[];
  translation?: string;
  globalNumber: number;
}

interface VideoGenDialogProps {
  open: boolean;
  onClose: () => void;
  slides: AyahData[];
  surahName: string;
  customAudioUrl?: string | null;
  background: BackgroundSpec;
  textColor: string;
  textShadow: string;
  textSize: number;
  showTranslation: boolean;
  aspectRatio: string;
  arabicFont: string;
  translationFont: string;
  overlayText?: string;
  overlayTextColor?: string;
  overlayTextSize?: number;
  overlayTextPosition?: "top" | "bottom";
  elements?: CanvasElement[];
  backgroundEffect?: "none" | "ken_burns" | "particles" | "blur" | "color_overlay";
  textEntranceEffect?: "none" | "fade" | "typewriter" | "slide_in";
  transitionEffect?: "none" | "crossfade" | "slide" | "wipe";
  showAudioVisualizer?: boolean;
  showHighlight?: boolean;
}

const QUALITY_PRESETS = [
  { id: "720p", name: "720p HD", w: 1280, h: 720, fps: 30 },
  { id: "1080p", name: "1080p Full HD", w: 1920, h: 1080, fps: 30 },
  { id: "480p", name: "480p SD", w: 854, h: 480, fps: 24 },
];

const ASPECT_DIMS: Record<string, (w: number, h: number) => { w: number; h: number }> = {
  "16:9": (w, h) => ({ w, h }),
  "9:16": (w, h) => ({ w: Math.round(h * 9 / 16), h }),
  "1:1": (w, h) => ({ w: Math.min(w, h), h: Math.min(w, h) }),
  "4:5": (w, h) => ({ w: Math.round(h * 4 / 5), h }),
};

type GenState = "idle" | "preparing" | "rendering" | "done" | "error";

export function VideoGenDialog({
  open, onClose, slides, surahName, background,
  textColor, textShadow, textSize, showTranslation, aspectRatio, customAudioUrl,
  arabicFont, translationFont,
  overlayText, overlayTextColor, overlayTextSize, overlayTextPosition,
  elements, backgroundEffect, textEntranceEffect, transitionEffect, showAudioVisualizer, showHighlight
}: VideoGenDialogProps) {
  const [quality, setQuality] = useState("720p");
  const [format, setFormat] = useState<"webm" | "mp4">("webm");
  const [state, setState] = useState<GenState>("idle");
  const [progress, setProgress] = useState(0);
  const [statusMsg, setStatusMsg] = useState("");
  const [result, setResult] = useState<{ url: string; ext: string; size: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const keepTabRef = useRef(false);

  // Reset on close
  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => {
        setState("idle");
        setProgress(0);
        setStatusMsg("");
        setResult(null);
        setErrorMsg("");
      }, 300);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Warn before leaving during render
  useEffect(() => {
    if (state === "rendering") {
      const handler = (e: BeforeUnloadEvent) => {
        e.preventDefault();
        e.returnValue = "";
      };
      window.addEventListener("beforeunload", handler);
      return () => window.removeEventListener("beforeunload", handler);
    }
  }, [state]);

  const canGenerate = slides.length > 0 && state !== "rendering" && state !== "preparing";

  const handleGenerate = async () => {
    if (!slides.length) {
      toast.error("Load slides first");
      return;
    }

    setState("preparing");
    setProgress(0);
    setStatusMsg("Preparing slides...");
    setErrorMsg("");
    setResult(null);

    // Build slide data
    const slideData: SlideData[] = slides.map((s) => ({
      arabicWords: s.words.map((w) => ({
        text: w.text,
        audio: customAudioUrl ? undefined : w.audio,
      })),
      translation: s.translation,
      surahName,
      ayahNumber: s.numberInSurah,
      audio: customAudioUrl || s.audio,
    }));

    // Calculate dimensions from aspect ratio + quality preset
    const preset = QUALITY_PRESETS.find((q) => q.id === quality) ?? QUALITY_PRESETS[0];
    const aspectFn = ASPECT_DIMS[aspectRatio] ?? ASPECT_DIMS["16:9"];
    const dims = aspectFn(preset.w, preset.h);

    // Determine effective text size based on canvas height
    const effectiveTextSize = Math.round((textSize / 900) * dims.h);

    try {
      setState("rendering");
      setStatusMsg("Starting video generation...");
      const res = await generateQuranVideo({
        slides: slideData,
        background,
        textColor,
        textShadow,
        textSize: effectiveTextSize,
        showTranslation,
        width: dims.w,
        height: dims.h,
        fps: preset.fps,
        format,
        onProgress: (pct, msg) => {
          setProgress(pct);
          setStatusMsg(msg);
        },
        arabicFont,
        translationFont,
        overlayText,
        overlayTextColor,
        overlayTextSize: overlayTextSize ? Math.round((overlayTextSize / 900) * dims.h) : undefined,
        overlayTextPosition,
        elements,
        backgroundEffect,
        textEntranceEffect,
        transitionEffect,
        showAudioVisualizer,
        showHighlight
      });

      setState("done");
      setResult({
        url: res.url,
        ext: res.ext,
        size: res.blob.size,
      });
      toast.success("Video generated successfully!");
    } catch (e: any) {
      console.error("Video gen error:", e);
      setState("error");
      setErrorMsg(e?.message || "Unknown error");
      toast.error(e?.message || "Video generation failed");
    }
  };

  const handleDownload = () => {
    if (!result) return;
    // Fetch the blob from the URL (we stored it as object URL)
    const a = document.createElement("a");
    a.href = result.url;
    const safeName = surahName.replace(/[^a-zA-Z0-9]/g, "_");
    a.download = `Quran_${safeName}_${Date.now()}.${result.ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success("Download started!");
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && state !== "rendering") onClose();
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border bg-gradient-to-r from-emerald-950 to-emerald-900 px-5 py-4 text-white">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--gold)]/20 text-[var(--gold)]">
                  <FileVideo className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold">Generate Video</h3>
                  <p className="text-[11px] text-white/60">
                    {slides.length} slide{slides.length !== 1 ? "s" : ""} · {surahName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => state !== "rendering" && onClose()}
                disabled={state === "rendering"}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-white/70 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-30"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="max-h-[70vh] overflow-y-auto thin-scroll p-5">
              {state === "idle" && (
                <div className="space-y-5">
                  {/* Slides preview */}
                  {slides.length === 0 ? (
                    <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-400">
                      <AlertCircle className="mr-1.5 inline h-3.5 w-3.5" />
                      No slides loaded. Close this dialog, choose surah/ayah range in the left panel, then click "Load Slides".
                    </div>
                  ) : (
                    <div className="rounded-lg border border-emerald-700/30 bg-emerald-700/5 p-3 text-xs text-emerald-800 dark:text-[var(--gold)]">
                      <Check className="mr-1.5 inline h-3.5 w-3.5" />
                      Ready to generate. {slides.length} slide{slides.length !== 1 ? "s" : ""} will be rendered with audio.
                    </div>
                  )}

                  {/* Quality */}
                  <div>
                    <Label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Quality
                    </Label>
                    <div className="grid grid-cols-3 gap-2">
                      {QUALITY_PRESETS.map((q) => (
                        <button
                          key={q.id}
                          onClick={() => setQuality(q.id)}
                          disabled={state !== "idle"}
                          className={`rounded-lg border-2 px-2 py-2 text-center transition-all disabled:opacity-50 ${
                            quality === q.id
                              ? "border-[var(--gold)] bg-[var(--gold-soft)]/40"
                              : "border-border hover:border-[var(--gold)]/50"
                          }`}
                        >
                          <div className="text-xs font-bold text-foreground">{q.name.split(" ")[0]}</div>
                          <div className="text-[10px] text-muted-foreground">{q.w}×{q.h}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Format */}
                  <div>
                    <Label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Format
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setFormat("webm")}
                        disabled={state !== "idle"}
                        className={`flex items-center gap-2 rounded-lg border-2 px-3 py-2 text-left transition-all disabled:opacity-50 ${
                          format === "webm"
                            ? "border-[var(--gold)] bg-[var(--gold-soft)]/40"
                            : "border-border hover:border-[var(--gold)]/50"
                        }`}
                      >
                        <Monitor className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="text-xs font-semibold text-foreground">WebM</div>
                          <div className="text-[10px] text-muted-foreground">Smaller, supported in Chrome</div>
                        </div>
                      </button>
                      <button
                        onClick={() => setFormat("mp4")}
                        disabled={state !== "idle"}
                        className={`flex items-center gap-2 rounded-lg border-2 px-3 py-2 text-left transition-all disabled:opacity-50 ${
                          format === "mp4"
                            ? "border-[var(--gold)] bg-[var(--gold-soft)]/40"
                            : "border-border hover:border-[var(--gold)]/50"
                        }`}
                      >
                        <Film className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="text-xs font-semibold text-foreground">MP4</div>
                          <div className="text-[10px] text-muted-foreground">Best for YouTube/Social</div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Aspect ratio */}
                  <div className="rounded-lg bg-muted/40 p-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Aspect ratio</span>
                      <span className="font-semibold text-foreground">{aspectRatio}</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-muted-foreground">Approx. duration</span>
                      <span className="font-semibold text-foreground">
                        ~{Math.max(3, slides.length * 8)} seconds
                      </span>
                    </div>
                  </div>

                  {/* Info box */}
                  <div className="rounded-lg border border-border bg-muted/30 p-3">
                    <div className="flex items-start gap-2">
                      <Settings2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <p className="text-[11px] leading-relaxed text-muted-foreground">
                        Video renders in your browser using Canvas + MediaRecorder. <strong className="text-foreground">Keep this tab open</strong> until done. Audio from your selected reciter is mixed in. For higher resolutions or longer videos, consider cloud rendering.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Preparing state */}
              {(state === "preparing" || state === "rendering") && (
                <div className="space-y-5 py-4">
                  <div className="flex flex-col items-center text-center">
                    <div className="relative mb-4 flex h-20 w-20 items-center justify-center">
                      <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 80 80">
                        <circle cx="40" cy="40" r="34" fill="none" stroke="currentColor" strokeWidth="4" className="text-muted/30" />
                        <circle
                          cx="40" cy="40" r="34" fill="none" stroke="url(#progGrad)" strokeWidth="4"
                          strokeDasharray={`${2 * Math.PI * 34}`}
                          strokeDashoffset={`${2 * Math.PI * 34 * (1 - progress / 100)}`}
                          strokeLinecap="round"
                          className="transition-all duration-300"
                        />
                        <defs>
                          <linearGradient id="progGrad" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="oklch(0.82 0.15 85)" />
                            <stop offset="100%" stopColor="oklch(0.45 0.13 162)" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="flex flex-col items-center">
                        <span className="text-lg font-bold text-foreground">{progress}%</span>
                      </div>
                    </div>
                    <Loader2 className="mb-2 h-4 w-4 animate-spin text-[var(--gold)]" />
                    <p className="text-sm font-medium text-foreground">{statusMsg || "Working..."}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Keep this tab open. Switching tabs may pause rendering.
                    </p>
                  </div>

                  {/* Progress bar */}
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-[var(--gold)] to-emerald-700"
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>

                  {/* Warning */}
                  <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-[11px] text-amber-700 dark:text-amber-400">
                    <AlertCircle className="mr-1.5 inline h-3 w-3" />
                    Don't close this tab or dialog until rendering completes.
                  </div>
                </div>
              )}

              {/* Done state */}
              {state === "done" && result && (
                <div className="space-y-5 py-2">
                  <div className="flex flex-col items-center text-center">
                    <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600/15 text-emerald-700 dark:text-[var(--gold)]">
                      <Check className="h-7 w-7" strokeWidth={3} />
                    </div>
                    <h4 className="text-base font-semibold text-foreground">Video generated!</h4>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Size: {formatSize(result.size)} · Format: {result.ext.toUpperCase()}
                    </p>
                  </div>

                  {/* Video preview */}
                  <div className="overflow-hidden rounded-lg border border-border bg-black">
                    <video
                      src={result.url}
                      controls
                      className="w-full"
                      style={{ maxHeight: 240 }}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleDownload}
                      className="flex-1 bg-gradient-to-r from-emerald-700 to-emerald-800 text-white hover:from-emerald-800 hover:to-emerald-900"
                    >
                      <Download className="mr-2 h-4 w-4" /> Download Video
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setState("idle");
                        setResult(null);
                      }}
                    >
                      Generate Again
                    </Button>
                  </div>
                </div>
              )}

              {/* Error state */}
              {state === "error" && (
                <div className="space-y-4 py-4">
                  <div className="flex flex-col items-center text-center">
                    <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/15 text-red-600">
                      <AlertCircle className="h-7 w-7" />
                    </div>
                    <h4 className="text-base font-semibold text-foreground">Generation failed</h4>
                    <p className="mt-1 max-w-xs text-xs text-muted-foreground">{errorMsg}</p>
                  </div>
                  <Button
                    onClick={() => {
                      setState("idle");
                      setErrorMsg("");
                    }}
                    className="w-full"
                    variant="outline"
                  >
                    Try Again
                  </Button>
                </div>
              )}
            </div>

            {/* Footer */}
            {state === "idle" && (
              <div className="border-t border-border bg-muted/30 px-5 py-3">
                <Button
                  onClick={handleGenerate}
                  disabled={!canGenerate}
                  className="w-full bg-gradient-to-r from-emerald-700 to-emerald-800 text-white hover:from-emerald-800 hover:to-emerald-900 disabled:opacity-50"
                >
                  <FileVideo className="mr-2 h-4 w-4" />
                  {slides.length === 0 ? "Load slides first" : `Generate ${format.toUpperCase()} Video`}
                </Button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
