"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Sparkles,
  Loader2,
  Download,
  Settings2,
  Mic2,
  Languages,
  ImageIcon,
  Type,
  Volume2,
  Square,
  ChevronDown,
  Wand2,
  Layers,
  Film,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SimpleSelect } from "@/components/dashboard/simple-select";
import { toast } from "sonner";
import { RECITERS, TRANSLATIONS, type SurahListItem } from "@/lib/quran-api";
import {
  generateQuranVideo,
  type BackgroundSpec,
  type SlideData,
} from "@/lib/video-generator";

interface AyahData {
  numberInSurah: number;
  text: string;
  audio: string;
  words: { text: string; audio?: string; translation?: string }[];
  translation?: string;
  globalNumber: number;
}

const PRESET_BACKGROUNDS = [
  {
    id: "sunset",
    name: "Sunset Mosque",
    css: "linear-gradient(135deg, #1a0f1f 0%, #4a1f2a 30%, #8b3a2a 60%, #d4a017 100%)",
    prompt: "silhouette of a mosque at sunset with golden hour light",
  },
  {
    id: "night",
    name: "Starry Night",
    css: "radial-gradient(ellipse at 50% 100%, #0a2e4a 0%, #050a18 60%, #000000 100%), radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4) 0%, transparent 1%), radial-gradient(circle at 70% 20%, rgba(255,255,255,0.3) 0%, transparent 1%), radial-gradient(circle at 50% 60%, rgba(255,255,255,0.5) 0%, transparent 1%)",
    prompt: "starry desert night sky with crescent moon",
  },
  {
    id: "ocean",
    name: "Calm Ocean",
    css: "linear-gradient(180deg, #0a1f3a 0%, #1a3a5a 50%, #2a5a7a 100%)",
    prompt: "calm ocean reflecting a soft pink dawn sky",
  },
  {
    id: "desert",
    name: "Desert Dunes",
    css: "linear-gradient(180deg, #f4a460 0%, #cd853f 40%, #8b4513 80%, #4a2010 100%)",
    prompt: "rolling desert sand dunes at golden hour",
  },
  {
    id: "greenery",
    name: "Lush Greenery",
    css: "linear-gradient(180deg, #0a2a1a 0%, #1a4a2a 50%, #2a6a3a 100%)",
    prompt: "peaceful green meadow with soft sunlight filtering through trees",
  },
  {
    id: "mountains",
    name: "Misty Mountains",
    css: "linear-gradient(180deg, #2c3e50 0%, #4a6878 40%, #95a5a6 80%, #bdc3c7 100%)",
    prompt: "misty mountain peaks at dawn with fog in valleys",
  },
];

const TEXT_POSITIONS = [
  { id: "center", name: "Center" },
  { id: "top", name: "Top" },
  { id: "bottom", name: "Bottom" },
] as const;

const TEXT_SIZES = [
  { id: "sm", name: "Small", value: "1.5rem" },
  { id: "md", name: "Medium", value: "2.25rem" },
  { id: "lg", name: "Large", value: "3rem" },
  { id: "xl", name: "X-Large", value: "3.75rem" },
] as const;

export function QuranEditor({ onOpenDashboard }: { onOpenDashboard?: () => void }) {
  const [surahs, setSurahs] = useState<SurahListItem[]>([]);
  const [surahQuery, setSurahQuery] = useState("");
  const [selectedSurah, setSelectedSurah] = useState(1);
  const [selectedAyah, setSelectedAyah] = useState(1);
  const [reciter, setReciter] = useState("ar.alafasy");
  const [translation, setTranslation] = useState("en.sahih");
  const [showTranslation, setShowTranslation] = useState(true);
  const [showTransliteration, setShowTransliteration] = useState(false);

  const [ayahData, setAyahData] = useState<AyahData | null>(null);
  const [loading, setLoading] = useState(false);

  // Audio state
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeWordIdx, setActiveWordIdx] = useState(-1);
  const [progress, setProgress] = useState(0);

  // Background
  const [bgId, setBgId] = useState<string>("sunset");
  const [aiBgUrl, setAiBgUrl] = useState<string | null>(null);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  // Text style
  const [textSize, setTextSize] = useState<typeof TEXT_SIZES[number]["id"]>("lg");
  const [arabicTextSize, setArabicTextSize] = useState(48);
  const [translationTextSize, setTranslationTextSize] = useState(20);
  const [arabicFont, setArabicFont] = useState<"quran" | "naskh" | "amiri">("quran");
  const [translationFont, setTranslationFont] = useState<"sans" | "urdu" | "noto-sans" | "amiri">("sans");
  const [textPosition, setTextPosition] = useState<typeof TEXT_POSITIONS[number]["id"]>("center");
  const [textColor, setTextColor] = useState("#ffffff");
  const [showTranslationOverlay, setShowTranslationOverlay] = useState(true);
  const [renderingPreview, setRenderingPreview] = useState(false);
  const [renderedVideoUrl, setRenderedVideoUrl] = useState<string | null>(null);
  const [renderedVideoError, setRenderedVideoError] = useState<string | null>(null);
  const [renderedVideoProgress, setRenderedVideoProgress] = useState(0);
  const previewVideoRef = useRef<HTMLVideoElement | null>(null);

  // Volume
  const [volume, setVolume] = useState(80);

  // --- Fetch surah list on mount ---
  useEffect(() => {
    fetch("/api/quran/surahs")
      .then((r) => r.json())
      .then((j) => {
        if (j.ok) {
          setSurahs(j.data);
        }
      })
      .catch(() => {
        /* ignore — keep empty list */
      });
  }, []);

  // --- Fetch ayah whenever selection changes ---
  const loadAyah = useCallback(async () => {
    setLoading(true);
    setActiveWordIdx(-1);
    setProgress(0);
    setIsPlaying(false);
    try {
      const res = await fetch(
        `/api/quran/ayah?surah=${selectedSurah}&ayah=${selectedAyah}&reciter=${reciter}&translation=${translation}`
      );
      const json = await res.json();
      if (json.ok) {
        setAyahData(json.data);
      } else {
        toast.error(json.error || "Failed to load ayah");
      }
    } catch (e: any) {
      toast.error(e.message || "Network error");
    } finally {
      setLoading(false);
    }
  }, [selectedSurah, selectedAyah, reciter, translation]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadAyah();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadAyah]);

  // --- Continuous full-ayah audio playback with word highlighting ---
  const landingPlaybackRef = useRef<{ cancelled: boolean; audio: HTMLAudioElement | null }>({
    cancelled: false,
    audio: null,
  });

  useEffect(() => {
    // Cancel any previous session
    landingPlaybackRef.current.cancelled = true;
    if (landingPlaybackRef.current.audio) {
      try { landingPlaybackRef.current.audio.pause(); } catch {}
      landingPlaybackRef.current.audio = null;
    }

    const timer = setTimeout(() => {
      if (isPlaying && ayahData?.audio) {
        setActiveWordIdx(0);
        setProgress(0);
      }
    }, 0);

    if (!isPlaying || !ayahData?.audio) return () => clearTimeout(timer);

    const session = { cancelled: false, audio: null as HTMLAudioElement | null };
    landingPlaybackRef.current = session;

    const audio = new Audio();
    audio.src = ayahData.audio;
    audio.crossOrigin = "anonymous";
    audio.preload = "auto";
    audio.volume = volume / 100;
    session.audio = audio;

    const totalWords = ayahData.words.length;

    const updateHighlight = () => {
      if (session.cancelled || !audio.duration) return;
      const t = audio.currentTime;
      const dur = audio.duration;
      const idx = Math.min(totalWords - 1, Math.floor((t / dur) * totalWords));
      setActiveWordIdx(idx);
      setProgress(Math.round((t / dur) * 100));
    };

    audio.ontimeupdate = updateHighlight;
    audio.onended = () => {
      if (session.cancelled) return;
      setActiveWordIdx(-1);
      setProgress(100);
      setIsPlaying(false);
      setTimeout(() => { if (!session.cancelled) setProgress(0); }, 800);
    };
    audio.onerror = () => {
      if (session.cancelled) return;
      toast.error("Audio failed to load. Try another reciter.");
      setIsPlaying(false);
      setActiveWordIdx(-1);
    };

    const ready = new Promise<void>((resolve) => {
      if (audio.readyState >= 2) {
        resolve();
        return;
      }
      audio.oncanplay = () => resolve();
      audio.onloadeddata = () => resolve();
      setTimeout(resolve, 2000);
    });

    ready.then(() => {
      if (session.cancelled) return;
      audio.play().catch((err: any) => {
        if (err?.name === "NotAllowedError") {
          toast.error("Browser blocked autoplay. Click Play again.");
        } else {
          toast.error("Couldn't play audio.");
        }
        setIsPlaying(false);
        setActiveWordIdx(-1);
      });
    });

    return () => {
      session.cancelled = true;
      clearTimeout(timer);
      try { audio.pause(); } catch {}
    };
  }, [isPlaying, ayahData, volume]);

  // --- Volume sync ---
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume / 100;
  }, [volume]);

  // --- AI background generation ---
  const generateAIBackground = async () => {
    if (!aiPrompt.trim()) {
      toast.error("Please describe the scene you want");
      return;
    }
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai/background", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt }),
      });
      const json = await res.json();
      if (json.ok) {
        setAiBgUrl(json.url);
        setBgId("__ai__");
        toast.success("AI background generated!");
      } else {
        toast.error(json.error || "Generation failed");
      }
    } catch (e: any) {
      toast.error(e.message || "Network error");
    } finally {
      setAiLoading(false);
    }
  };

  // --- Surah search/filter ---
  const filteredSurahs = surahs.filter((s) => {
    const q = surahQuery.toLowerCase();
    if (!q) return true;
    return (
      s.englishName.toLowerCase().includes(q) ||
      s.name.includes(surahQuery) ||
      s.englishNameTranslation.toLowerCase().includes(q) ||
      String(s.number) === surahQuery
    );
  });

  const currentSurah = surahs.find((s) => s.number === selectedSurah);
  const maxAyah = currentSurah?.numberOfAyahs ?? 7;
  const currentBg = PRESET_BACKGROUNDS.find((b) => b.id === bgId);
  const bgStyle = aiBgUrl && bgId === "__ai__"
    ? { backgroundImage: `url(${aiBgUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
    : { background: currentBg?.css ?? PRESET_BACKGROUNDS[0].css };

  const textSizeValue = TEXT_SIZES.find((t) => t.id === textSize)?.value ?? "2.25rem";
  const arabicFontFamily =
    arabicFont === "naskh"
      ? "var(--font-arabic-naskh), serif"
      : arabicFont === "amiri"
      ? "var(--font-arabic), serif"
      : "var(--font-quran), serif";

  const translationFontFamily =
    translationFont === "urdu"
      ? "var(--font-urdu), serif"
      : translationFont === "noto-sans"
      ? "var(--font-latin-clean), sans-serif"
      : translationFont === "amiri"
      ? "var(--font-arabic), serif"
      : "var(--font-sans), sans-serif";
  const textSizePx = arabicTextSize;
  const translationLangCode = translation.split(".")[0] || "en";
  const translationClass =
    translationLangCode === "ur"
      ? "translation-ur"
      : translationLangCode === "ar"
      ? "translation-ar"
      : "translation-en";

  const handlePlay = () => {
    if (!ayahData) return;
    setIsPlaying((p) => !p);
  };

  const handleStop = () => {
    setIsPlaying(false);
    setActiveWordIdx(-1);
    setProgress(0);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const handleNext = () => {
    if (selectedAyah < maxAyah) {
      setSelectedAyah((a) => a + 1);
    } else if (selectedSurah < 114) {
      setSelectedSurah((s) => s + 1);
      setSelectedAyah(1);
    }
  };

  const handleGeneratePreviewVideo = async () => {
    if (!ayahData) {
      toast.error("Ayah not loaded yet");
      return;
    }

    setRenderedVideoError(null);
    setRenderedVideoProgress(0);
    setRenderingPreview(true);

    if (renderedVideoUrl) {
      URL.revokeObjectURL(renderedVideoUrl);
      setRenderedVideoUrl(null);
    }

    const currentBackground: BackgroundSpec = aiBgUrl && bgId === "__ai__"
      ? { type: "image", imageUrl: aiBgUrl, opacity: 100 }
      : { type: "preset", cssValue: currentBg?.css ?? PRESET_BACKGROUNDS[0].css, opacity: 100 };

    const slide: SlideData = {
      arabicWords: ayahData.words.map((w) => ({ text: w.text, audio: w.audio })),
      translation: showTranslationOverlay && showTranslation ? ayahData.translation : undefined,
      surahName: currentSurah?.englishName || "Quran",
      ayahNumber: selectedAyah,
      audio: ayahData.audio,
    };

    try {
      const result = await generateQuranVideo({
        slides: [slide],
        background: currentBackground,
        textColor,
        textShadow: "0 2px 12px rgba(0,0,0,0.6)",
        textSize: Math.max(38, Math.round((textSizePx / 900) * 720)),
        showTranslation: showTranslationOverlay && showTranslation,
        width: 1280,
        height: 720,
        fps: 30,
        format: "webm",
        onProgress: (pct) => setRenderedVideoProgress(pct),
        arabicFont: arabicFontFamily,
        translationFont: translationFontFamily,
      });

      setRenderedVideoUrl(result.url);
      toast.success("Preview video ready");
    } catch (e: any) {
      setRenderedVideoError(e?.message || "Failed to render preview video");
      toast.error(e?.message || "Video preview generation failed");
    } finally {
      setRenderingPreview(false);
    }
  };

  useEffect(() => {
    return () => {
      if (renderedVideoUrl) {
        URL.revokeObjectURL(renderedVideoUrl);
      }
    };
  }, [renderedVideoUrl]);

  const handlePrev = () => {
    if (selectedAyah > 1) {
      setSelectedAyah((a) => a - 1);
    } else if (selectedSurah > 1) {
      const prev = surahs.find((s) => s.number === selectedSurah - 1);
      if (prev) {
        setSelectedSurah(prev.number);
        setSelectedAyah(prev.numberOfAyahs);
      }
    }
  };

  const positionClass =
    textPosition === "top"
      ? "justify-start pt-12"
      : textPosition === "bottom"
      ? "justify-end pb-16"
      : "justify-center";

  return (
    <section
      id="editor"
      className="relative overflow-hidden bg-gradient-to-b from-[var(--cream)] to-background py-20 sm:py-28"
    >
      <div className="pointer-events-none absolute left-0 right-0 top-0 h-32 bg-gradient-to-b from-background/60 to-transparent" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">
          <motion.span
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block rounded-full border border-emerald-700/30 bg-emerald-700/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-emerald-800 dark:text-[var(--gold)]"
          >
            Interactive Demo
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.05 }}
            className="mt-5 text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl"
          >
            Try the Editor — Live
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mt-5 text-base text-muted-foreground sm:text-lg"
          >
            Pick a surah and ayah, choose a reciter, generate an AI background,
            and play word-by-word recitation with synced highlighting. This is a
            real, working preview of the editor.
          </motion.p>

          {onOpenDashboard && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 }}
              className="mt-6 flex justify-center"
            >
              <Button
                onClick={onOpenDashboard}
                size="lg"
                className="group bg-gradient-to-r from-emerald-700 to-emerald-800 text-white shadow-lg shadow-emerald-700/20 hover:from-emerald-800 hover:to-emerald-900"
              >
                <Sparkles className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
                Open Full Editor (Dashboard)
                <ChevronDown className="ml-2 h-4 w-4 rotate-[-90deg] transition-transform group-hover:translate-x-1" />
              </Button>
            </motion.div>
          )}
        </div>

        {/* Editor grid */}
        <div className="mt-12 grid gap-6 lg:grid-cols-[1fr_380px]">
          {/* LEFT: Preview canvas */}
          <div className="flex flex-col gap-4">
            {/* Preview */}
            <div className="relative overflow-hidden rounded-2xl border border-border shadow-xl">
              {/* Top bar */}
              <div className="flex items-center justify-between border-b border-border bg-card px-4 py-2.5">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-700/15 text-[10px] font-bold text-emerald-700 dark:text-[var(--gold)]">
                    {selectedSurah}
                  </span>
                  <span className="font-medium text-foreground">
                    {currentSurah?.englishName ?? "Loading..."}
                  </span>
                  <span className="text-muted-foreground">·</span>
                  <span>Ayah {selectedAyah}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
                    {RECITERS.find((r) => r.id === reciter)?.englishName ?? "Reciter"}
                  </Badge>
                  {bgId === "__ai__" && (
                    <Badge className="gap-1 bg-gradient-to-r from-[var(--gold)] to-amber-500 text-emerald-950 text-[10px]">
                      <Sparkles className="h-2.5 w-2.5" /> AI
                    </Badge>
                  )}
                </div>
              </div>

              {/* Canvas */}
              <div
                className="relative aspect-video w-full overflow-hidden"
                style={bgStyle as React.CSSProperties}
              >
                {/* Vignette overlay */}
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.5) 100%)",
                  }}
                />

                {/* Subtle pattern overlay for preset bgs */}
                {bgId !== "__ai__" && (
                  <div
                    className="pointer-events-none absolute inset-0 opacity-30"
                    style={{
                      backgroundImage:
                        "radial-gradient(circle at 20% 30%, rgba(255,255,255,0.05) 0%, transparent 30%), radial-gradient(circle at 80% 70%, rgba(212,160,23,0.08) 0%, transparent 35%)",
                    }}
                  />
                )}

                {/* Loading overlay */}
                <AnimatePresence>
                  {loading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-sm"
                    >
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="h-8 w-8 animate-spin text-[var(--gold)]" />
                        <p className="text-xs font-medium text-white/90">
                          Loading ayah...
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {renderedVideoUrl ? (
                  <div className="relative h-full w-full bg-black/90">
                    <video
                      ref={previewVideoRef}
                      src={renderedVideoUrl}
                      controls
                      playsInline
                      className="h-full w-full object-contain"
                    />
                    <div className="absolute left-3 top-3 rounded-lg border border-white/15 bg-black/55 px-2.5 py-1 backdrop-blur">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--gold)]">
                        Generated Preview
                      </span>
                    </div>
                  </div>
                ) : (
                  <div
                    className={`relative flex h-full flex-col items-center px-6 ${positionClass}`}
                  >
                    {/* Arabic */}
                    <div
                      className="text-center font-quran"
                      style={{
                        fontFamily: arabicFontFamily,
                        direction: "rtl",
                        fontSize: `${arabicTextSize}px`,
                        lineHeight: 1.6,
                        color: textColor,
                        textShadow: "0 2px 12px rgba(0,0,0,0.6), 0 0 1px rgba(0,0,0,0.4)",
                      }}
                    >
                      {ayahData?.words?.length ? (
                        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
                          {ayahData.words.map((w, i) => (
                            <motion.span
                              key={i}
                              animate={{
                                color: activeWordIdx === i ? "#d4a017" : textColor,
                                scale: activeWordIdx === i ? 1.12 : 1,
                                textShadow:
                                  activeWordIdx === i
                                    ? "0 0 24px rgba(212,160,23,0.8), 0 2px 12px rgba(0,0,0,0.6)"
                                    : "0 2px 12px rgba(0,0,0,0.6)",
                              }}
                              transition={{ duration: 0.25 }}
                              className="inline-block cursor-pointer"
                              onClick={() => {
                                if (w.audio) {
                                  new Audio(w.audio).play().catch(() => {});
                                }
                              }}
                            >
                              {w.text}
                            </motion.span>
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="h-8 w-64 rounded shimmer bg-white/10" />
                          <div className="h-8 w-48 rounded shimmer bg-white/10" />
                        </div>
                      )}
                    </div>

                    {/* Translation overlay */}
                    {showTranslationOverlay &&
                      showTranslation &&
                      ayahData?.translation && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-6 max-w-2xl rounded-xl border border-white/15 bg-black/40 px-5 py-3 backdrop-blur"
                        >
                          <p 
                            className={`text-center text-sm font-medium leading-relaxed text-white/90 sm:text-base ${translationClass}`}
                          style={{ fontFamily: translationFontFamily, fontSize: `${translationTextSize}px` }}
                          >
                            {ayahData.translation}
                          </p>
                        </motion.div>
                      )}

                    {/* Top-right meta */}
                    <div className="absolute right-3 top-3 rounded-lg border border-white/15 bg-black/40 px-2.5 py-1 backdrop-blur">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--gold)]">
                        {currentSurah?.englishName} · {selectedAyah}:{currentSurah?.numberOfAyahs}
                      </span>
                    </div>
                  </div>
                )}

                {/* Progress bar */}
                <div className="absolute inset-x-0 bottom-0 h-1 bg-black/30">
                  <motion.div
                    className="h-full bg-gradient-to-r from-[var(--gold)] to-amber-400"
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.2 }}
                  />
                </div>
              </div>

              {/* Player controls */}
              <div className="flex items-center justify-between gap-3 border-t border-border bg-card px-4 py-3">
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                    onClick={handlePrev}
                    disabled={loading}
                    aria-label="Previous ayah"
                  >
                    <SkipBack className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                    onClick={handleStop}
                    disabled={!isPlaying && progress === 0}
                    aria-label="Stop"
                  >
                    <Square className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    onClick={handlePlay}
                    disabled={loading || !ayahData}
                    className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-700 to-emerald-900 p-0 text-white shadow-md hover:from-emerald-800 hover:to-emerald-900"
                    aria-label={isPlaying ? "Pause" : "Play"}
                  >
                    {isPlaying ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4 translate-x-0.5" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                    onClick={handleNext}
                    disabled={loading}
                    aria-label="Next ayah"
                  >
                    <SkipForward className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Volume2 className="h-3.5 w-3.5" />
                    <Slider
                      value={[volume]}
                      onValueChange={(v) => setVolume(v[0])}
                      max={100}
                      step={1}
                      className="w-20"
                    />
                    <span className="w-8 text-right tabular-nums">{volume}%</span>
                  </div>
                  <Badge variant="outline" className="hidden text-[10px] uppercase tracking-wider sm:inline-flex">
                    {activeWordIdx >= 0
                      ? `Word ${activeWordIdx + 1}/${ayahData?.words.length ?? 0}`
                      : `${progress}%`}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Export bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-semibold text-foreground">Ready to export?</span>
                <span className="text-[10px] text-muted-foreground">Unlock 4K MP4 export, SRT subtitles, and multiple slides in the full editor.</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  onClick={handleGeneratePreviewVideo}
                  size="sm"
                  disabled={loading || renderingPreview || !ayahData}
                  className="bg-amber-600 hover:bg-amber-700 text-black gap-1.5 text-xs shadow-md"
                >
                  {renderingPreview ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Film className="h-3.5 w-3.5" />}
                  {renderingPreview ? `Rendering ${renderedVideoProgress}%` : "Generate Preview Video"}
                </Button>
                {renderedVideoUrl && (
                  <Button
                    onClick={() => {
                      if (renderedVideoUrl) {
                        URL.revokeObjectURL(renderedVideoUrl);
                        setRenderedVideoUrl(null);
                        setRenderedVideoError(null);
                      }
                    }}
                    size="sm"
                    variant="outline"
                    className="text-xs"
                  >
                    Back to Live Preview
                  </Button>
                )}
                {onOpenDashboard && (
                  <Button
                    onClick={onOpenDashboard}
                    size="sm"
                    className="bg-emerald-700 hover:bg-emerald-800 text-white gap-1.5 text-xs shadow-md"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Generate Video (Full Editor)
                  </Button>
                )}
              </div>
              {renderedVideoError && (
                <p className="w-full text-[11px] text-red-600 dark:text-red-400">{renderedVideoError}</p>
              )}
            </div>
          </div>

          {/* RIGHT: Settings panel */}
          <div className="flex flex-col gap-4">
            {/* Surah/Ayah selector */}
            <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-700/10 text-emerald-700 dark:text-[var(--gold)]">
                  <Search className="h-3.5 w-3.5" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">Select Verse</h3>
              </div>

              <div className="relative">
                <Input
                  placeholder="Search surah by name or number..."
                  value={surahQuery}
                  onChange={(e) => setSurahQuery(e.target.value)}
                  className="mb-2 h-9 text-sm"
                />
              </div>

              <ScrollArea className="h-40 rounded-lg border border-border">
                <div className="p-1">
                  {filteredSurahs.length === 0 ? (
                    <div className="p-4 text-center text-xs text-muted-foreground">
                      {surahs.length === 0 ? "Loading surahs..." : "No matches"}
                    </div>
                  ) : (
                    filteredSurahs.map((s) => (
                      <button
                        key={s.number}
                        onClick={() => {
                          setSelectedSurah(s.number);
                          setSelectedAyah(1);
                        }}
                        className={`flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left transition-colors ${
                          selectedSurah === s.number
                            ? "bg-emerald-700/10 text-foreground"
                            : "hover:bg-accent/40 text-muted-foreground"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold ${
                              selectedSurah === s.number
                                ? "bg-emerald-700 text-white dark:bg-[var(--gold)] dark:text-emerald-950"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {s.number}
                          </span>
                          <span className="text-xs font-medium text-foreground">
                            {s.englishName}
                          </span>
                        </div>
                        <span className="font-quran text-xs text-muted-foreground" style={{ fontFamily: "var(--font-quran)" }}>
                          {s.name}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </ScrollArea>

              {/* Ayah selector */}
              <div className="mt-3 flex items-center gap-2">
                <Label className="text-xs text-muted-foreground">Ayah</Label>
                <Input
                  type="number"
                  min={1}
                  max={maxAyah}
                  value={selectedAyah}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    if (n >= 1 && n <= maxAyah) setSelectedAyah(n);
                  }}
                  className="h-8 w-20 text-sm"
                />
                <span className="text-xs text-muted-foreground">
                  of {maxAyah}
                </span>
                <div className="ml-auto flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={handlePrev}
                  >
                    Prev
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={handleNext}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>

            {/* Minimum Quick Customization Options */}
            <div className="rounded-2xl border border-border bg-card p-4 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-1 border-b border-border">
                <Settings2 className="h-4 w-4 text-emerald-700" />
                <h3 className="text-sm font-semibold text-foreground">Quick Style</h3>
              </div>

              {/* Reciter */}
              <div>
                <Label className="mb-1 block text-[11px] font-medium text-muted-foreground">Reciter</Label>
                <SimpleSelect
                  value={reciter}
                  onValueChange={setReciter}
                  options={RECITERS.slice(0, 5).map((r) => ({
                    value: r.id,
                    label: r.englishName,
                    sublabel: r.style,
                  }))}
                />
              </div>

              {/* Translation language */}
              <div>
                <Label className="mb-1 block text-[11px] font-medium text-muted-foreground">Translation</Label>
                <SimpleSelect
                  value={translation}
                  onValueChange={setTranslation}
                  options={TRANSLATIONS.filter((t) => ["en", "ur", "fr", "es", "id", "tr", "ru", "bn"].includes(t.id.split(".")[0])).map((t) => ({
                    value: t.id,
                    label: t.englishName,
                    sublabel: t.language,
                  }))}
                />
              </div>

              {/* Arabic font style */}
              <div>
                <Label className="mb-1.5 block text-[11px] font-medium text-muted-foreground">Arabic Font</Label>
                <div className="grid grid-cols-3 gap-1">
                  <button
                    onClick={() => setArabicFont("quran")}
                    className={`rounded-md border py-1 text-[10px] font-medium transition-all ${
                      arabicFont === "quran"
                        ? "border-[var(--gold)] bg-[var(--gold-soft)]/30 text-foreground"
                        : "border-border text-muted-foreground hover:bg-accent/30"
                    }`}
                  >
                    Quran
                  </button>
                  <button
                    onClick={() => setArabicFont("naskh")}
                    className={`rounded-md border py-1 text-[10px] font-medium transition-all ${
                      arabicFont === "naskh"
                        ? "border-[var(--gold)] bg-[var(--gold-soft)]/30 text-foreground"
                        : "border-border text-muted-foreground hover:bg-accent/30"
                    }`}
                  >
                    Naskh
                  </button>
                  <button
                    onClick={() => setArabicFont("amiri")}
                    className={`rounded-md border py-1 text-[10px] font-medium transition-all ${
                      arabicFont === "amiri"
                        ? "border-[var(--gold)] bg-[var(--gold-soft)]/30 text-foreground"
                        : "border-border text-muted-foreground hover:bg-accent/30"
                    }`}
                  >
                    Amiri
                  </button>
                </div>
              </div>

              {/* Translation Font */}
              <div>
                <Label className="mb-1.5 block text-[11px] font-medium text-muted-foreground">Translation Font</Label>
                <div className="grid grid-cols-4 gap-1">
                  <button
                    onClick={() => setTranslationFont("sans")}
                    className={`rounded-md border py-1 text-[9px] font-medium transition-all ${
                      translationFont === "sans"
                        ? "border-[var(--gold)] bg-[var(--gold-soft)]/30 text-foreground"
                        : "border-border text-muted-foreground hover:bg-accent/30"
                    }`}
                  >
                    Inter
                  </button>
                  <button
                    onClick={() => setTranslationFont("noto-sans")}
                    className={`rounded-md border py-1 text-[9px] font-medium transition-all ${
                      translationFont === "noto-sans"
                        ? "border-[var(--gold)] bg-[var(--gold-soft)]/30 text-foreground"
                        : "border-border text-muted-foreground hover:bg-accent/30"
                    }`}
                  >
                    Noto
                  </button>
                  <button
                    onClick={() => setTranslationFont("urdu")}
                    className={`rounded-md border py-1 text-[9px] font-medium transition-all ${
                      translationFont === "urdu"
                        ? "border-[var(--gold)] bg-[var(--gold-soft)]/30 text-foreground"
                        : "border-border text-muted-foreground hover:bg-accent/30"
                    }`}
                  >
                    Urdu
                  </button>
                  <button
                    onClick={() => setTranslationFont("amiri")}
                    className={`rounded-md border py-1 text-[9px] font-medium transition-all ${
                      translationFont === "amiri"
                        ? "border-[var(--gold)] bg-[var(--gold-soft)]/30 text-foreground"
                        : "border-border text-muted-foreground hover:bg-accent/30"
                    }`}
                  >
                    Amiri
                  </button>
                </div>
              </div>

              {/* Basic Background Presets (only first 3) */}
              <div>
                <Label className="mb-1.5 block text-[11px] font-medium text-muted-foreground">Background Preset</Label>
                <div className="grid grid-cols-3 gap-1.5">
                  {PRESET_BACKGROUNDS.slice(0, 3).map((b) => (
                    <button
                      key={b.id}
                      onClick={() => {
                        setBgId(b.id);
                        setAiBgUrl(null);
                      }}
                      className={`group relative aspect-video overflow-hidden rounded-lg border-2 transition-all ${
                        bgId === b.id
                          ? "border-[var(--gold)] ring-1 ring-[var(--gold)]/30"
                          : "border-border hover:border-[var(--gold)]/50"
                      }`}
                      style={{ background: b.css }}
                    >
                      <div className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/80 to-transparent p-1">
                        <span className="text-[8px] font-medium uppercase tracking-wider text-white">
                          {b.name.split(" ")[0]}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Basic Text Sizes */}
              <div className="space-y-2">
                <Label className="mb-1 block text-[11px] font-medium text-muted-foreground">Text Size</Label>
                <div className="grid grid-cols-3 gap-1">
                  {TEXT_SIZES.slice(0, 3).map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setTextSize(t.id);
                        if (t.id === "sm") { setArabicTextSize(32); setTranslationTextSize(16); }
                        else if (t.id === "md") { setArabicTextSize(48); setTranslationTextSize(20); }
                        else if (t.id === "lg") { setArabicTextSize(64); setTranslationTextSize(24); }
                      }}
                      className={`rounded-md border py-1 text-[11px] font-medium transition-all ${
                        textSize === t.id
                          ? "border-[var(--gold)] bg-[var(--gold-soft)]/30 text-foreground"
                          : "border-border text-muted-foreground hover:bg-accent/30"
                      }`}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[9px] text-muted-foreground">
                    <span>Arabic Size:</span>
                    <span>{arabicTextSize}px</span>
                  </div>
                  <Slider
                    value={[arabicTextSize]}
                    onValueChange={(v) => setArabicTextSize(v[0])}
                    min={24}
                    max={96}
                    step={1}
                  />
                  <div className="flex justify-between text-[9px] text-muted-foreground pt-1">
                    <span>Translation Size:</span>
                    <span>{translationTextSize}px</span>
                  </div>
                  <Slider
                    value={[translationTextSize]}
                    onValueChange={(v) => setTranslationTextSize(v[0])}
                    min={12}
                    max={64}
                    step={1}
                  />
                </div>
              </div>
            </div>

            {/* High-visibility Prominent CTA */}
            {onOpenDashboard && (
              <Button
                onClick={onOpenDashboard}
                size="lg"
                className="w-full bg-gradient-to-r from-emerald-800 to-emerald-950 text-white font-semibold hover:from-emerald-900 hover:to-black gap-2 shadow-lg shadow-emerald-950/20 py-6"
              >
                <Sparkles className="h-4.5 w-4.5 text-[var(--gold)] animate-pulse" />
                Customize in Full Editor →
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
