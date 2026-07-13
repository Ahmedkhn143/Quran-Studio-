"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Play, Pause, SkipBack, SkipForward, Square, Volume2,
  Sparkles, Loader2, Download, Mic2, Languages, ImageIcon, Type,
  ChevronDown, Wand2, Film, X, Upload, FolderOpen, Trash2, Cloud,
  Save, Layers, Palette, Settings2, Plus, Check, FileVideo,
  Monitor, Smartphone, Square as SquareIcon, RectangleHorizontal,
  RectangleVertical, Music, BookOpen, Send, Folder, Undo, Redo, ZoomIn, ZoomOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import { SimpleSelect } from "@/components/dashboard/simple-select";
import { VideoGenDialog } from "@/components/dashboard/video-gen-dialog";
import { toast } from "sonner";
import {
  RECITERS, TRANSLATIONS, type SurahListItem,
} from "@/lib/quran-api";
import { drawSlide, type CanvasElement } from "@/lib/video-generator";
import { SURAHS_DB } from "@/lib/surahs-db";
import { autoRemoveBackground, eraseAt } from "@/lib/bg-remover";
import { decodeAudioFile, detectSurahFromAudio, drawWaveform } from "@/lib/audio-detector";

interface AyahData {
  numberInSurah: number;
  text: string;
  audio: string;
  words: { text: string; audio?: string; translation?: string }[];
  translation?: string;
  globalNumber: number;
}

interface UploadedBg {
  url: string;
  filename: string;
  size: number;
  uploadedAt: string;
}

const PRESET_BACKGROUNDS = [
  {
    id: "sunset", name: "Sunset Mosque",
    css: "linear-gradient(135deg, #1a0f1f 0%, #4a1f2a 30%, #8b3a2a 60%, #d4a017 100%)",
  },
  {
    id: "night", name: "Starry Night",
    css: "radial-gradient(ellipse at 50% 100%, #0a2e4a 0%, #050a18 60%, #000000 100%)",
  },
  {
    id: "ocean", name: "Calm Ocean",
    css: "linear-gradient(180deg, #0a1f3a 0%, #1a3a5a 50%, #2a5a7a 100%)",
  },
  {
    id: "desert", name: "Desert Dunes",
    css: "linear-gradient(180deg, #f4a460 0%, #cd853f 40%, #8b4513 80%, #4a2010 100%)",
  },
  {
    id: "greenery", name: "Lush Greenery",
    css: "linear-gradient(180deg, #0a2a1a 0%, #1a4a2a 50%, #2a6a3a 100%)",
  },
  {
    id: "mountains", name: "Misty Mountains",
    css: "linear-gradient(180deg, #2c3e50 0%, #4a6878 40%, #95a5a6 80%, #bdc3c7 100%)",
  },
  {
    id: "emerald", name: "Emerald Glow",
    css: "radial-gradient(ellipse at center, #0d4d3a 0%, #052e22 60%, #021510 100%)",
  },
  {
    id: "royal", name: "Royal Purple",
    css: "linear-gradient(135deg, #1a0a2e 0%, #2d1b4e 40%, #4a2c6e 80%, #6b3d8e 100%)",
  },
  {
    id: "golden", name: "Golden Hour",
    css: "linear-gradient(180deg, #2d1810 0%, #6b3d1a 30%, #b8862e 60%, #f4c542 100%)",
  },
];

const GRADIENTS = [
  { id: "g1", name: "Sunset", css: "linear-gradient(135deg, #ff6b6b, #feca57, #ff9ff3)" },
  { id: "g2", name: "Ocean", css: "linear-gradient(135deg, #06beb6, #48b1bf)" },
  { id: "g3", name: "Purple", css: "linear-gradient(135deg, #667eea, #764ba2)" },
  { id: "g4", name: "Forest", css: "linear-gradient(135deg, #134e5e, #71b280)" },
  { id: "g5", name: "Fire", css: "linear-gradient(135deg, #f12711, #f5af19)" },
  { id: "g6", name: "Night", css: "linear-gradient(135deg, #2c3e50, #4ca1af)" },
  { id: "g7", name: "Rose", css: "linear-gradient(135deg, #ee9ca7, #ffdde1)" },
  { id: "g8", name: "Mint", css: "linear-gradient(135deg, #00b09b, #96c93d)" },
];

const SOLID_COLORS = [
  "#000000", "#0a2e22", "#1a0f1f", "#2c3e50",
  "#8b3a2a", "#d4a017", "#0d4d3a", "#4a2c6e",
];

const ASPECT_RATIOS = [
  { id: "16:9", name: "YouTube", icon: RectangleHorizontal, className: "aspect-16-9" },
  { id: "9:16", name: "TikTok / Reels", icon: RectangleVertical, className: "aspect-9-16" },
  { id: "1:1", name: "Instagram Square", icon: SquareIcon, className: "aspect-1-1" },
  { id: "4:5", name: "Instagram Portrait", icon: Smartphone, className: "aspect-4-5" },
];

const OVERLAY_EFFECTS = [
  { id: "none", name: "None" },
  { id: "snow", name: "Snow" },
  { id: "golden", name: "Golden Particles" },
  { id: "bokeh", name: "Soft Bokeh" },
  { id: "stars", name: "Twinkling Stars" },
  { id: "embers", name: "Floating Embers" },
  { id: "ramadan", name: "Ramadan Lanterns" },
  { id: "geometry", name: "Islamic Geometry" },
];

const TEXT_PRESETS = [
  { id: "clean", name: "Clean", color: "#ffffff", shadow: "0 2px 8px rgba(0,0,0,0.5)" },
  { id: "soft", name: "Soft", color: "#ffffff", shadow: "0 4px 16px rgba(0,0,0,0.4)" },
  { id: "bold", name: "Bold", color: "#ffffff", shadow: "0 0 0 2px rgba(0,0,0,0.6), 0 4px 12px rgba(0,0,0,0.7)" },
  { id: "glow", name: "Glow", color: "#ffd700", shadow: "0 0 20px rgba(255,215,0,0.6), 0 0 40px rgba(255,215,0,0.3)" },
  { id: "outline", name: "Outline", color: "#ffffff", shadow: "-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000" },
  { id: "cinema", name: "Cinema", color: "#ffffff", shadow: "0 8px 24px rgba(0,0,0,0.8), 0 0 60px rgba(0,0,0,0.5)" },
  { id: "golden_glow", name: "Royal Gold", color: "#ffd700", shadow: "0 2px 10px rgba(212,160,23,0.8), 0 4px 15px rgba(0,0,0,0.9)" },
  { id: "neon_cyan", name: "Neon Cyan", color: "#00f2fe", shadow: "0 0 10px rgba(0,242,254,0.6), 0 0 20px rgba(0,242,254,0.3)" },
  { id: "sunset_rose", name: "Sunset Rose", color: "#ff758c", shadow: "0 2px 12px rgba(255,117,140,0.5), 0 4px 8px rgba(0,0,0,0.6)" },
];

const PRESET_VIDEOS = [
  { id: "v_starry", name: "Starry Sky", url: "https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3ccee8d3d2a09c2a611956637b3f9ff69&profile_id=139&oauth2_token_id=57447761" },
  { id: "v_particles", name: "Glow Loop", url: "https://player.vimeo.com/external/451837836.sd.mp4?s=d1d8858349285098ad8e92a2a0d922cfb940989f&profile_id=139&oauth2_token_id=57447761" },
  { id: "v_water", name: "Dawn Water", url: "https://player.vimeo.com/external/403842180.sd.mp4?s=4e4d588523c14d5e90d8985f39f906f30d074b1e&profile_id=139&oauth2_token_id=57447761" }
];

export function Dashboard({ onClose }: { onClose: () => void }) {
  // --- Surah list state ---
  const [surahs, setSurahs] = useState<SurahListItem[]>([]);
  const [surahQuery, setSurahQuery] = useState("");
  const [selectedSurah, setSelectedSurah] = useState(1);
  const [fromAyah, setFromAyah] = useState(1);
  const [toAyah, setToAyah] = useState(1);
  const [reciter, setReciter] = useState("ar.alafasy");
  const [translation, setTranslation] = useState("en.sahih");

  // --- Slides state ---
  const [slides, setSlides] = useState<AyahData[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loadingSlides, setLoadingSlides] = useState(false);

  // --- Audio state ---
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeWordIdx, setActiveWordIdx] = useState(-1);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(80);

  // --- Background state ---
  const [bgTab, setBgTab] = useState<"upload" | "ai" | "preset" | "gradient" | "color" | "video">("preset");
  const [bgId, setBgId] = useState<string>("sunset");
  const [aiBgUrl, setAiBgUrl] = useState<string | null>(null);
  const [uploadedBgUrl, setUploadedBgUrl] = useState<string | null>(null);
  const [uploadedBgs, setUploadedBgs] = useState<UploadedBg[]>([]);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const audioFileInputRef = useRef<HTMLInputElement | null>(null);
  const [customAudioUrl, setCustomAudioUrl] = useState<string | null>(null);
  const [customAudioName, setCustomAudioName] = useState<string | null>(null);
  const [bgOpacity, setBgOpacity] = useState(100);

  // Custom gradient state
  const [customGradientStart, setCustomGradientStart] = useState("#8b3a2a");
  const [customGradientEnd, setCustomGradientEnd] = useState("#d4a017");
  const [customGradientAngle, setCustomGradientAngle] = useState(135);

  // --- Text style ---
  const [textSize, setTextSize] = useState("lg");
  const [arabicTextSize, setArabicTextSize] = useState(48);
  const [translationTextSize, setTranslationTextSize] = useState(24);
  const [textColor, setTextColor] = useState("#ffffff");
  const [textShadow, setTextShadow] = useState("0 2px 8px rgba(0,0,0,0.5)");
  const [textPreset, setTextPreset] = useState("clean");
  const [showTranslation, setShowTranslation] = useState(true);
  const [arabicFont, setArabicFont] = useState<string>("Cairo");
  const [translationFont, setTranslationFont] = useState<string>("Inter");
  const [showArabic, setShowArabic] = useState(true);
  const [highlightType, setHighlightType] = useState<"color" | "gradient">("color");
  const [highlightColor, setHighlightColor] = useState("#d4a017");
  const [highlightGradientStart, setHighlightGradientStart] = useState("#ffe066");
  const [highlightGradientEnd, setHighlightGradientEnd] = useState("#f5af19");
  const [highlightGlowColor, setHighlightGlowColor] = useState("rgba(212,160,23,0.8)");

  // Watermark/Overlay Text
  const [customOverlayText, setCustomOverlayText] = useState("");
  const [customOverlayTextColor, setCustomOverlayTextColor] = useState("#ffffff");
  const [customOverlayTextSize, setCustomOverlayTextSize] = useState(20);
  const [customOverlayTextPosition, setCustomOverlayTextPosition] = useState<"top" | "bottom">("bottom");

  // Location/position offsets
  const [arabicYOffset, setArabicYOffset] = useState<number>(0);
  const [translationYOffset, setTranslationYOffset] = useState<number>(0);

  // Canvas elements state
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [history, setHistory] = useState<CanvasElement[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

  // Bismillah prepend
  const [prependBismillah, setPrependBismillah] = useState(false);

  // Audio alignment & detection
  const [peaks, setPeaks] = useState<number[]>([]);
  const [detectedSurah, setDetectedSurah] = useState<number | null>(null);
  const [detectionConfidence, setDetectionConfidence] = useState<number | null>(null);
  const [showHighlight, setShowHighlight] = useState(true);

  // Background removal properties
  const [bgRemoverTolerance, setBgRemoverTolerance] = useState(30);
  const [isErasing, setIsErasing] = useState(false);
  const [eraserBrushSize, setEraserBrushSize] = useState(20);

  // Custom Effects
  const [backgroundEffect, setBackgroundEffect] = useState<"none" | "ken_burns" | "particles" | "blur" | "color_overlay">("none");
  const [textEntranceEffect, setTextEntranceEffect] = useState<"none" | "fade" | "typewriter" | "slide_in">("none");
  const [transitionEffect, setTransitionEffect] = useState<"none" | "crossfade" | "slide" | "wipe">("none");
  const [showAudioVisualizer, setShowAudioVisualizer] = useState(false);

  // Redraw preview
  const [redrawCount, setRedrawCount] = useState(0);

  // --- Video output ---
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [overlayEffect, setOverlayEffect] = useState("none");
  const [effectIntensity, setEffectIntensity] = useState(60);

  // --- Video generation dialog ---
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);

  // --- Left panel tab ---
  const [leftTab, setLeftTab] = useState<"content" | "ai">("content");

  // --- AI chat state ---
  const [aiMessages, setAiMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([
    {
      role: "assistant",
      content:
        "Hi! Describe the video you want — surah, ayahs, reciter, format, background. I'll set everything up for you.",
    },
  ]);
  const [aiChatInput, setAiChatInput] = useState("");



  // Fetch surah list on mount + auto-load the first ayah
  useEffect(() => {
    fetch("/api/quran/surahs")
      .then((r) => r.json())
      .then((j) => { if (j.ok) setSurahs(j.data); })
      .catch(() => {});
    // Auto-load Al-Faatiha ayahs 1 to 7 on mount so the canvas isn't empty.
    (async () => {
      try {
        const promises: Promise<any>[] = [];
        for (let i = 1; i <= 7; i++) {
          promises.push(fetch(`/api/quran/ayah?surah=1&ayah=${i}&reciter=${reciter}&translation=${translation}`).then(r => r.json()));
        }
        const results = await Promise.all(promises);
        let loaded = results.filter(r => r.ok).map(r => r.data);
        if (loaded.length > 0) {
          if (prependBismillah && selectedSurah !== 9) {
            const bismillahSlide: AyahData = {
              numberInSurah: 0,
              text: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
              audio: `/api/audio?src=${encodeURIComponent(`https://cdn.islamic.network/quran/audio/128/${reciter}/1.mp3`)}`,
              words: [{ text: "بِسْمِ" }, { text: "اللَّهِ" }, { text: "الرَّحْمَٰنِ" }, { text: "الرَّحِيمِ" }],
              translation: "In the name of Allah, the Entirely Merciful, the Especially Merciful",
              globalNumber: 1
            };
            loaded = [bismillahSlide, ...loaded];
          }
          setSlides(loaded);
          setCurrentSlide(0);
          setFromAyah(1);
          setToAyah(7);
        }
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  // Load uploaded backgrounds on mount
  const refreshUploads = useCallback(() => {
    fetch("/api/upload/background")
      .then((r) => r.json())
      .then((j) => { if (j.ok) setUploadedBgs(j.backgrounds); })
      .catch(() => {});
  }, []);
  useEffect(() => { refreshUploads(); }, [refreshUploads]);

  // Lock body scroll while dashboard open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // Cleanup object URL for uploaded custom audio
  useEffect(() => {
    return () => {
      if (customAudioUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(customAudioUrl);
      }
    };
  }, [customAudioUrl]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // =====================
  // Slide loading
  // =====================
  const loadSlides = useCallback(async (opts?: { surah?: number; from?: number; to?: number; silent?: boolean }) => {
    const surah = opts?.surah ?? selectedSurah;
    const from = opts?.from ?? fromAyah;
    const to = opts?.to ?? toAyah;
    const silent = opts?.silent ?? false;

    setLoadingSlides(true);
    setIsPlaying(false);
    setActiveWordIdx(-1);
    setProgress(0);
    try {
      const promises: Promise<Response>[] = [];
      for (let i = from; i <= to; i++) {
        promises.push(
          fetch(`/api/quran/ayah?surah=${surah}&ayah=${i}&reciter=${reciter}&translation=${translation}`)
        );
      }
      const responses = await Promise.all(promises);
      const jsons = await Promise.all(responses.map((r) => r.json()));
      let loaded: AyahData[] = jsons.filter((j) => j.ok).map((j) => j.data);
      if (loaded.length === 0) {
        if (!silent) toast.error("No ayahs loaded");
        return;
      }
      if (prependBismillah && surah !== 9) {
        const bismillahSlide: AyahData = {
          numberInSurah: 0,
          text: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
          audio: `/api/audio?src=${encodeURIComponent(`https://cdn.islamic.network/quran/audio/128/${reciter}/1.mp3`)}`,
          words: [{ text: "بِسْمِ" }, { text: "اللَّهِ" }, { text: "الرَّحْمَٰنِ" }, { text: "الرَّحِيمِ" }],
          translation: "In the name of Allah, the Entirely Merciful, the Especially Merciful",
          globalNumber: 1
        };
        loaded = [bismillahSlide, ...loaded];
      }
      setSlides(loaded);
      setCurrentSlide(0);
      if (!silent) toast.success(`Loaded ${loaded.length} slide${loaded.length > 1 ? "s" : ""}`);
    } catch (e: any) {
      if (!silent) toast.error(e.message || "Failed to load slides");
    } finally {
      setLoadingSlides(false);
    }
  }, [fromAyah, toAyah, selectedSurah, reciter, translation, prependBismillah]);

  // Auto-reload slides when translation, reciter, or prependBismillah changes
  useEffect(() => {
    // Only trigger auto-reload if slides are already loaded to avoid mount conflicts
    if (slides.length > 1 || (slides.length === 1 && slides[0].numberInSurah !== 0)) {
      loadSlides({ silent: true });
    }
  }, [translation, reciter, prependBismillah]);

  // Audio playback state for time display
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);

  const currentAyah = slides[currentSlide];
  const currentAudioSrc = customAudioUrl || currentAyah?.audio || "";

  // --- Canvas Rendering & Element Actions ---
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const waveformCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // PREVIEW CANVAS DRAWING EFFECT
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !slides[currentSlide]) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const currentAyah = slides[currentSlide];
    const slideData = {
      arabicWords: currentAyah.words.map((w: any) => ({ text: w.text, audio: w.audio })),
      translation: showTranslation ? currentAyah.translation : "",
      surahName: currentSurah?.englishName || "Surah",
      ayahNumber: currentAyah.numberInSurah,
      audio: currentAyah.audio
    };
    
    // Background Image
    let bgImage: HTMLImageElement | null = null;
    const bgUrl = bgId === "__ai__" && aiBgUrl ? aiBgUrl : bgId === "__upload__" && uploadedBgUrl ? uploadedBgUrl : null;
    if (bgUrl) {
      const imgId = `preload_bg_${bgId}`;
      bgImage = (window as any)[imgId];
      if (!bgImage) {
        bgImage = new Image();
        bgImage.crossOrigin = "anonymous";
        bgImage.src = bgUrl;
        bgImage.onload = () => {
          (window as any)[imgId] = bgImage;
          setRedrawCount((c) => c + 1);
        };
      }
    }

    const genOpts = {
      slides: [slideData],
      background: (() => {
        if (bgId.startsWith("v_") || bgId === "__video_upload__") {
          return { type: "video" as const, videoUrl: bgId === "__video_upload__" ? uploadedBgUrl || "" : PRESET_VIDEOS.find(v => v.id === bgId)?.url || "", opacity: bgOpacity };
        }
        if (bgId === "__custom_grad__") {
          return { type: "gradient" as const, cssValue: `linear-gradient(${customGradientAngle}deg, ${customGradientStart}, ${customGradientEnd})`, opacity: bgOpacity };
        }
        const preset = PRESET_BACKGROUNDS.find((b) => b.id === bgId) ?? PRESET_BACKGROUNDS[0];
        return { type: "preset" as const, cssValue: preset.css, opacity: bgOpacity };
      })(),
      textColor,
      textShadow,
      textSize: arabicTextSize,
      showTranslation,
      width: canvas.width,
      height: canvas.height,
      fps: 30,
      format: "webm" as const,
      arabicFont: arabicFontFamily,
      translationFont: translationFontFamily,
      overlayText: customOverlayText,
      overlayTextColor: customOverlayTextColor,
      overlayTextSize: customOverlayTextSize,
      overlayTextPosition: customOverlayTextPosition,
      showHighlight,
      elements,
      backgroundEffect,
      textEntranceEffect,
      transitionEffect,
      showAudioVisualizer,
      arabicYOffset,
      translationYOffset,
      showArabic,
      highlightColor,
      highlightGradientStart: highlightType === "gradient" ? highlightGradientStart : undefined,
      highlightGradientEnd: highlightType === "gradient" ? highlightGradientEnd : undefined,
      highlightGlowColor
    };

    const slideProgress = audioDuration ? progress / 100 : 0;
    drawSlide(ctx, slideData, genOpts, activeWordIdx, bgImage, null, slideProgress);
  }, [
    slides, currentSlide, bgId, aiBgUrl, uploadedBgUrl, bgOpacity, customGradientStart, customGradientEnd,
    customGradientAngle, textColor, textShadow, arabicTextSize, showTranslation, arabicFont,
    translationFont, customOverlayText, customOverlayTextColor, customOverlayTextSize,
    customOverlayTextPosition, showHighlight, elements, activeWordIdx, redrawCount, progress,
    audioDuration, backgroundEffect, textEntranceEffect, transitionEffect, showAudioVisualizer,
    arabicYOffset, translationYOffset, showArabic, highlightType, highlightColor, highlightGradientStart,
    highlightGradientEnd, highlightGlowColor
  ]);

  // History & Undo/Redo
  const pushHistory = (currentElements = elements) => {
    const newHistory = history.slice(0, historyIndex + 1);
    setHistory([...newHistory, currentElements]);
    setHistoryIndex(newHistory.length);
  };
  
  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setElements(history[historyIndex - 1]);
    }
  };
  
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setElements(history[historyIndex + 1]);
    }
  };

  // Element Actions
  const updateElement = (id: string, updates: Partial<CanvasElement>) => {
    const nextElements = elements.map((el) => {
      if (el.id === id) {
        return { ...el, ...updates };
      }
      return el;
    });
    setElements(nextElements);
  };

  const addTextElement = () => {
    const newEl: CanvasElement = {
      id: Math.random().toString(36).substr(2, 9),
      type: "text",
      x: 35,
      y: 45,
      width: 30,
      height: 10,
      content: "Custom Text Box",
      color: "#ffffff",
      fontSize: 24,
      fontFamily: "Inter",
      zIndex: elements.length,
    };
    const nextElements = [...elements, newEl];
    setElements(nextElements);
    pushHistory(nextElements);
  };

  const addShapeElement = (shapeType: "rectangle" | "circle" | "triangle") => {
    const newEl: CanvasElement = {
      id: Math.random().toString(36).substr(2, 9),
      type: "shape",
      shapeType,
      x: 40,
      y: 40,
      width: 20,
      height: 20,
      color: "rgba(255, 215, 0, 0.4)",
      zIndex: elements.length,
    };
    const nextElements = [...elements, newEl];
    setElements(nextElements);
    pushHistory(nextElements);
  };

  const addImageElement = (imageUrl: string) => {
    const newEl: CanvasElement = {
      id: Math.random().toString(36).substr(2, 9),
      type: "image",
      x: 40,
      y: 40,
      width: 15,
      height: 15,
      imageUrl,
      opacity: 100,
      zIndex: elements.length,
    };
    const nextElements = [...elements, newEl];
    setElements(nextElements);
    pushHistory(nextElements);
  };

  const removeElementBg = async (id: string) => {
    const el = elements.find(e => e.id === id);
    if (!el || !el.imageUrl) return;
    try {
      toast.info("Removing background from element...");
      const res = await autoRemoveBackground(el.imageUrl, bgRemoverTolerance);
      updateElement(id, { imageUrl: res.url });
      toast.success("Element background removed!");
      pushHistory();
    } catch (e: any) {
      toast.error("Failed to remove element background: " + e.message);
    }
  };

  const duplicateElement = (id: string) => {
    const el = elements.find((e) => e.id === id);
    if (!el) return;
    const newEl: CanvasElement = {
      ...el,
      id: Math.random().toString(36).substr(2, 9),
      x: Math.min(90, el.x + 4),
      y: Math.min(90, el.y + 4),
      zIndex: elements.length,
    };
    const nextElements = [...elements, newEl];
    setElements(nextElements);
    pushHistory(nextElements);
  };

  const deleteElement = (id: string) => {
    const nextElements = elements.filter((e) => e.id !== id);
    setElements(nextElements);
    setSelectedElementId(null);
    pushHistory(nextElements);
  };

  const changeZIndex = (id: string, direction: "up" | "down") => {
    const el = elements.find((e) => e.id === id);
    if (!el) return;
    const diff = direction === "up" ? 1 : -1;
    const nextElements = elements.map((e) => {
      if (e.id === id) {
        return { ...e, zIndex: Math.max(0, e.zIndex + diff) };
      }
      return e;
    });
    setElements(nextElements);
    pushHistory(nextElements);
  };

  // Background Remover Action
  const handleBgRemoval = async () => {
    const url = bgId === "__upload__" && uploadedBgUrl ? uploadedBgUrl : null;
    if (!url) {
      toast.error("Please upload and select an image background first");
      return;
    }
    try {
      toast.info("Extracting subject from background...");
      const res = await autoRemoveBackground(url, bgRemoverTolerance);
      setUploadedBgUrl(res.url);
      toast.success("Background removed!");
      setRedrawCount((c) => c + 1);
    } catch (e: any) {
      toast.error("Failed to remove background: " + e.message);
    }
  };

  // Audio Upload & Detection handler
  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      toast.info("Decoding audio waveform...");
      const decoded = await decodeAudioFile(file);
      setPeaks(decoded.peaks);
      setAudioDuration(decoded.duration);
      
      const detection = detectSurahFromAudio(decoded.duration);
      setDetectedSurah(detection.surahNumber);
      setDetectionConfidence(detection.confidence);
      
      const localUrl = URL.createObjectURL(file);
      setCustomAudioUrl(localUrl);
      setCustomAudioName(file.name);
      
      setSelectedSurah(detection.surahNumber);
      setFromAyah(1);
      const toAy = Math.min(10, SURAHS_DB.find(s => s.number === detection.surahNumber)?.numberOfAyahs || 1);
      setToAyah(toAy);
      
      toast.success(`Detected: ${SURAHS_DB.find(s => s.number === detection.surahNumber)?.englishName} (${detection.confidence}% confidence)`);
      
      // Auto-load detected surah slides immediately
      setTimeout(() => {
        loadSlides({ surah: detection.surahNumber, from: 1, to: toAy, silent: true });
      }, 200);
    } catch (err: any) {
      toast.error("Audio decoding failed: " + err.message);
    }
  };

  // Draw timeline waveform effect
  useEffect(() => {
    const canvas = waveformCanvasRef.current;
    if (!canvas || peaks.length === 0) return;
    const playProgress = isPlaying ? progress / 100 : 0;
    drawWaveform(canvas, peaks, playProgress);
  }, [peaks, progress, isPlaying]);

  // Save/Load Project State
  const saveProject = () => {
    const project = {
      surah: selectedSurah,
      from: fromAyah,
      to: toAyah,
      reciter,
      translation,
      textSize,
      arabicTextSize,
      translationTextSize,
      textColor,
      textShadow,
      arabicFont,
      translationFont,
      bgId,
      bgOpacity,
      elements,
      backgroundEffect,
      textEntranceEffect,
      transitionEffect,
      showAudioVisualizer,
      arabicYOffset,
      translationYOffset
    };
    localStorage.setItem("quran_project_save", JSON.stringify(project));
    toast.success("Project saved successfully!");
  };

  const loadProject = () => {
    const raw = localStorage.getItem("quran_project_save");
    if (!raw) {
      toast.error("No saved project found");
      return;
    }
    try {
      const p = JSON.parse(raw);
      if (p.surah) setSelectedSurah(p.surah);
      if (p.from) setFromAyah(p.from);
      if (p.to) setToAyah(p.to);
      if (p.reciter) setReciter(p.reciter);
      if (p.translation) setTranslation(p.translation);
      if (p.arabicTextSize) setArabicTextSize(p.arabicTextSize);
      if (p.translationTextSize) setTranslationTextSize(p.translationTextSize);
      if (p.textColor) setTextColor(p.textColor);
      if (p.textShadow) setTextShadow(p.textShadow);
      if (p.arabicFont) setArabicFont(p.arabicFont);
      if (p.translationFont) setTranslationFont(p.translationFont);
      if (p.bgId) setBgId(p.bgId);
      if (p.bgOpacity) setBgOpacity(p.bgOpacity);
      if (p.elements) setElements(p.elements);
      if (p.backgroundEffect) setBackgroundEffect(p.backgroundEffect);
      if (p.textEntranceEffect) setTextEntranceEffect(p.textEntranceEffect);
      if (p.transitionEffect) setTransitionEffect(p.transitionEffect);
      if (p.showAudioVisualizer !== undefined) setShowAudioVisualizer(p.showAudioVisualizer);
      if (p.arabicYOffset !== undefined) setArabicYOffset(p.arabicYOffset);
      if (p.translationYOffset !== undefined) setTranslationYOffset(p.translationYOffset);
      toast.success("Project loaded successfully!");
    } catch {
      toast.error("Failed to parse saved project");
    }
  };

  // =====================
  // Audio playback — continuous full-ayah audio + word highlighting
  // =====================
  // Strategy: play the FULL ayah audio (one continuous stream, no gaps between words).
  // Highlight words by dividing the audio duration evenly across words.
  // This gives a smooth, continuous playback instead of choppy per-word audio.
  const playbackSessionRef = useRef<{ cancelled: boolean; currentAudio: HTMLAudioElement | null }>({
    cancelled: false,
    currentAudio: null,
  });

  useEffect(() => {
    // Cancel any previous session
    playbackSessionRef.current.cancelled = true;
    if (playbackSessionRef.current.currentAudio) {
      try { playbackSessionRef.current.currentAudio.pause(); } catch {}
      playbackSessionRef.current.currentAudio = null;
    }
    setCurrentTime(0);
    setAudioDuration(0);

    if (!isPlaying || !currentAudioSrc) {
      return;
    }

    // Start a new session
    const session = { cancelled: false, currentAudio: null as HTMLAudioElement | null };
    playbackSessionRef.current = session;

    setActiveWordIdx(0);
    setProgress(0);

    // Create a single audio element for the entire ayah
    const audio = new Audio();
    audio.src = currentAudioSrc;
    audio.crossOrigin = "anonymous";
    audio.preload = "auto";
    audio.volume = volume / 100;
    session.currentAudio = audio;

    const totalWords = currentAyah.words.length;

    // Highlight words based on audio currentTime
    // Each word gets an equal slice of the audio duration
    const updateHighlight = () => {
      if (session.cancelled || !audio.duration) return;
      const t = audio.currentTime;
      const dur = audio.duration;
      setCurrentTime(t);
      setAudioDuration(dur);
      // Map current time to word index (even slices)
      const idx = Math.min(totalWords - 1, Math.floor((t / dur) * totalWords));
      setActiveWordIdx(idx);
      setProgress(Math.round((t / dur) * 100));
    };

    audio.ontimeupdate = updateHighlight;
    audio.onloadedmetadata = () => {
      if (!session.cancelled && audio.duration) setAudioDuration(audio.duration);
    };

    audio.onended = () => {
      if (session.cancelled) return;
      setActiveWordIdx(-1);
      setProgress(100);
      setTimeout(() => {
        if (session.cancelled) return;
        setProgress(0);
        if (currentSlide < slides.length - 1) {
          setCurrentSlide((s) => s + 1);
          setIsPlaying(true);
        } else {
          setIsPlaying(false);
        }
      }, 800);
    };

    audio.onerror = () => {
      if (session.cancelled) return;
      toast.error("Audio failed to load. Try another reciter.");
      setIsPlaying(false);
      setActiveWordIdx(-1);
    };

    // Play (may reject due to autoplay policy — handle gracefully)
    const ready = new Promise<void>((resolve) => {
      if (audio.readyState >= 2) {
        resolve();
        return;
      }
      audio.oncanplay = () => resolve();
      audio.onloadeddata = () => resolve();
      // Safety timeout
      setTimeout(resolve, 2000);
    });

    ready.then(() => {
      if (session.cancelled) return;
      audio.play().catch((err: any) => {
        if (err?.name === "NotAllowedError") {
          toast.error("Browser blocked autoplay. Click Play again.");
        } else {
          toast.error("Couldn't play audio: " + (err?.message || "unknown error"));
        }
        setIsPlaying(false);
        setActiveWordIdx(-1);
      });
    });

    return () => {
      session.cancelled = true;
      try { audio.pause(); } catch {}
    };
  }, [isPlaying, currentAyah, currentAudioSrc, volume]);

  // Format seconds as m:ss
  const formatTime = (s: number) => {
    if (!s || !isFinite(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  // =====================
  // File upload handler
  // =====================
  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload/background", { method: "POST", body: fd });
      const json = await res.json();
      if (json.ok) {
        setUploadedBgUrl(json.url);
        const isVideo = file.type.startsWith("video/");
        setBgId(isVideo ? "__video_upload__" : "__upload__");
        setBgTab("upload");
        refreshUploads();
        toast.success(isVideo ? "Video background uploaded!" : "Background uploaded!");
      } else {
        toast.error(json.error || "Upload failed");
      }
    } catch (e: any) {
      toast.error(e.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFileUpload(f);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFileUpload(f);
  };

  const handleDeleteUpload = async (filename: string) => {
    try {
      const res = await fetch(`/api/upload/background?filename=${encodeURIComponent(filename)}`, { method: "DELETE" });
      const json = await res.json();
      if (json.ok) {
        refreshUploads();
        if (uploadedBgUrl?.includes(filename)) {
          setUploadedBgUrl(null);
          setBgId("sunset");
        }
        toast.success("Deleted");
      } else {
        toast.error(json.error || "Delete failed");
      }
    } catch (e: any) {
      toast.error(e.message || "Delete failed");
    }
  };

  // =====================
  // AI background
  // =====================
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

  // =====================
  // AI chat handler (simulated)
  // =====================
  const sendAiChat = async () => {
    if (!aiChatInput.trim()) return;
    const userMsg = aiChatInput;
    setAiMessages((m) => [...m, { role: "user", content: userMsg }]);
    setAiChatInput("");

    // Parse simple commands
    const lower = userMsg.toLowerCase();
    const surahMatch = userMsg.match(/surah\s+(\d+)/i) || userMsg.match(/s(\d+)/i);
    const ayahMatch = userMsg.match(/ayah\s+(\d+)/i) || userMsg.match(/a(\d+)/i) || userMsg.match(/verse\s+(\d+)/i);
    const formatMatch = lower.match(/youtube|16:9|tiktok|reels|9:16|instagram|square|1:1|portrait|4:5/);

    let response = "Got it! Here's what I configured:\n";
    const actions: string[] = [];

    if (surahMatch) {
      const n = Number(surahMatch[1]);
      if (n >= 1 && n <= 114) {
        setSelectedSurah(n);
        setFromAyah(1);
        setToAyah(1);
        actions.push(`• Surah: ${n}`);
      }
    }
    if (ayahMatch) {
      const n = Number(ayahMatch[1]);
      setFromAyah(n);
      setToAyah(n);
      actions.push(`• Ayah: ${n}`);
    }
    if (formatMatch) {
      const f = formatMatch[0];
      if (f.includes("youtube") || f === "16:9") { setAspectRatio("16:9"); actions.push("• Format: YouTube (16:9)"); }
      else if (f.includes("tiktok") || f.includes("reels") || f === "9:16") { setAspectRatio("9:16"); actions.push("• Format: TikTok/Reels (9:16)"); }
      else if (f.includes("square") || f === "1:1") { setAspectRatio("1:1"); actions.push("• Format: Square (1:1)"); }
      else if (f.includes("portrait") || f === "4:5") { setAspectRatio("4:5"); actions.push("• Format: Portrait (4:5)"); }
    }
    if (lower.includes("sunset")) { setBgId("sunset"); setBgTab("preset"); actions.push("• Background: Sunset Mosque"); }
    if (lower.includes("night")) { setBgId("night"); setBgTab("preset"); actions.push("• Background: Starry Night"); }
    if (lower.includes("ocean")) { setBgId("ocean"); setBgTab("preset"); actions.push("• Background: Calm Ocean"); }
    if (lower.includes("desert")) { setBgId("desert"); setBgTab("preset"); actions.push("• Background: Desert Dunes"); }

    if (actions.length === 0) {
      response = "I can help with: surah number, ayah number, format (YouTube/TikTok/Instagram), background (sunset/night/ocean/desert). Try: 'Surah 112 ayah 1 for TikTok with night background'";
    } else {
      response += actions.join("\n") + "\n\nClick 'Load slides' to fetch the ayahs, then style and generate your video!";
    }

    setTimeout(() => {
      setAiMessages((m) => [...m, { role: "assistant", content: response }]);
    }, 600);
  };

  // =====================
  // Derived values
  // =====================
  const currentSurah = surahs.find((s) => s.number === selectedSurah);
  const maxAyah = currentSurah?.numberOfAyahs ?? 7;
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

  const currentBg = PRESET_BACKGROUNDS.find((b) => b.id === bgId);
  const currentVideo = PRESET_VIDEOS.find((v) => v.id === bgId);
  const isVideoBg = bgId.startsWith("v_") || bgId === "__video_upload__";

  const bgStyle: React.CSSProperties = isVideoBg
    ? {}
    : bgId === "__custom_grad__"
    ? { backgroundImage: `linear-gradient(${customGradientAngle}deg, ${customGradientStart}, ${customGradientEnd})` }
    : bgId === "__ai__" && aiBgUrl
    ? { backgroundImage: `url(${aiBgUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
    : bgId === "__upload__" && uploadedBgUrl
    ? { backgroundImage: `url(${uploadedBgUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
    : bgId.startsWith("__grad_")
    ? (() => {
        const gradId = bgId.replace("__grad_", "").replace("__", "");
        const grad = GRADIENTS.find((g) => g.id === gradId);
        return { backgroundImage: grad?.css ?? GRADIENTS[0].css };
      })()
    : { background: currentBg?.css ?? PRESET_BACKGROUNDS[0].css };

  const textSizeMap: Record<string, string> = { sm: "1.5rem", md: "2.25rem", lg: "3rem", xl: "3.75rem" };
  const textSizeValue = textSizeMap[textSize] ?? "2.25rem";

  const arabicFontFamily = (() => {
    switch (arabicFont) {
      case "KFGQPC Uthmanic Script Hafs":
        return '"Scheherazade New", "Amiri", serif';
      case "Amiri Quran":
        return '"Amiri Quran", "Amiri", serif';
      case "Scheherazade":
        return '"Scheherazade", "Scheherazade New", serif';
      case "me_quran":
        return '"Scheherazade New", "Amiri", serif';
      case "PDMS Saleem Quran Font":
        return '"Noto Naskh Arabic", "Amiri", serif';
      case "LPMQ Isep Misbah":
        return '"Noto Naskh Arabic", "Amiri", serif';
      default:
        return arabicFont;
    }
  })();
  const translationFontFamily = translationFont;

  const aspectClass = ASPECT_RATIOS.find((a) => a.id === aspectRatio)?.className ?? "aspect-16-9";

  const handlePlay = () => {
    if (!currentAyah) {
      toast.error("Load slides first");
      return;
    }
    setIsPlaying((p) => !p);
  };
  const handleStop = () => {
    setIsPlaying(false); setActiveWordIdx(-1); setProgress(0);
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
  };
  const goNextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide((s) => s + 1);
      setIsPlaying(false); setActiveWordIdx(-1); setProgress(0);
    }
  };
  const goPrevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide((s) => s - 1);
      setIsPlaying(false); setActiveWordIdx(-1); setProgress(0);
    }
  };

  const applyTextPreset = (presetId: string) => {
    const preset = TEXT_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setTextPreset(presetId);
      setTextColor(preset.color);
      setTextShadow(preset.shadow);
    }
  };

  // =====================
  // Render
  // =====================
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-[100] flex flex-col bg-background"
    >
      {/* Top Bar */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-700 to-emerald-900 text-[var(--gold)]">
              <BookOpen className="h-4 w-4" strokeWidth={2.2} />
            </div>
            <div className="hidden flex-col leading-tight sm:flex">
              <span className="text-sm font-bold text-foreground">
                Quran<span className="text-[var(--gold)]"> Studio</span>
              </span>
              <span className="text-[10px] text-muted-foreground">Editor</span>
            </div>
          </div>
          <div className="ml-3 hidden items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 md:flex">
            <Folder className="h-3.5 w-3.5 text-muted-foreground" />
            <input
              defaultValue="My Quran Video"
              className="w-40 bg-transparent text-sm font-medium text-foreground outline-none"
            />
            <Badge variant="outline" className="ml-2 text-[10px]">Auto-saved</Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Save className="mr-1.5 h-3.5 w-3.5" /> Save
          </Button>
          <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
            <FolderOpen className="mr-1.5 h-3.5 w-3.5" /> Projects
          </Button>
          <Button variant="ghost" size="sm">
            <Cloud className="mr-1.5 h-3.5 w-3.5" /> Donate
          </Button>
          <Button
            size="sm"
            className="bg-gradient-to-r from-emerald-700 to-emerald-800 text-white hover:from-emerald-800 hover:to-emerald-900"
            onClick={() => {
              if (slides.length === 0) {
                toast.error("Load slides first in the left panel");
                return;
              }
              setVideoDialogOpen(true);
            }}
          >
            <FileVideo className="mr-1.5 h-3.5 w-3.5" /> Generate Video
          </Button>
        </div>
      </header>

      {/* Main 3-panel layout */}
      <div className="grid flex-1 overflow-hidden bg-background lg:grid-cols-[320px_1fr_340px] xl:grid-cols-[320px_1fr_340px] md:grid-cols-1">
        {/* ============ LEFT PANEL ============ */}
        <aside className="flex flex-col border-r border-border bg-card overflow-hidden">
          <Tabs value={leftTab} onValueChange={(v) => setLeftTab(v as any)} className="flex h-full flex-col">
            <TabsList className="grid w-full shrink-0 grid-cols-2 rounded-none border-b border-border bg-card p-0">
              <TabsTrigger value="content" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[var(--gold)] text-xs">
                <BookOpen className="mr-1.5 h-3.5 w-3.5" /> Content
              </TabsTrigger>
              <TabsTrigger value="ai" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[var(--gold)] text-xs">
                <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Create with AI
              </TabsTrigger>
            </TabsList>

            {/* CONTENT TAB */}
            <TabsContent value="content" className="flex-1 overflow-hidden mt-0">
              <ScrollArea className="h-full thin-scroll">
                <div className="p-4 space-y-4">
                  {/* Surah search */}
                  <div>
                    <Label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <Search className="mr-1 inline h-3 w-3" /> Search Surah
                    </Label>
                    <Input
                      placeholder="Name or number..."
                      value={surahQuery}
                      onChange={(e) => setSurahQuery(e.target.value)}
                      className="h-9 text-sm"
                    />
                  </div>

                  {/* Surah list */}
                  <div className="rounded-lg border border-border max-h-56 overflow-y-auto thin-scroll">
                    {filteredSurahs.length === 0 ? (
                      <div className="p-3 text-center text-xs text-muted-foreground">
                        {surahs.length === 0 ? "Loading..." : "No matches"}
                      </div>
                    ) : (
                      filteredSurahs.map((s) => (
                        <button
                          key={s.number}
                          onClick={() => {
                            setSelectedSurah(s.number);
                            setFromAyah(1);
                            setToAyah(s.numberOfAyahs);
                            // Auto-load all ayahs of this surah immediately
                            loadSlides({ surah: s.number, from: 1, to: s.numberOfAyahs, silent: true });
                          }}
                          className={`flex w-full items-center justify-between border-b border-border px-2.5 py-2 text-left transition-colors last:border-0 ${
                            selectedSurah === s.number ? "bg-emerald-700/10" : "hover:bg-accent/40"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold ${
                              selectedSurah === s.number
                                ? "bg-emerald-700 text-white dark:bg-[var(--gold)] dark:text-emerald-950"
                                : "bg-muted text-muted-foreground"
                            }`}>
                              {s.number}
                            </span>
                            <div className="flex flex-col leading-tight">
                              <span className="text-xs font-medium text-foreground">{s.englishName}</span>
                              <span className="text-[10px] text-muted-foreground">{s.englishNameTranslation}</span>
                            </div>
                          </div>
                          <span className="text-sm text-muted-foreground" style={{ fontFamily: "var(--font-quran)" }}>
                            {s.name}
                          </span>
                        </button>
                      ))
                    )}
                  </div>

                  {/* Ayah range */}
                  <div>
                    <Label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Ayah Range (max {maxAyah})
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="mb-1 block text-[10px] text-muted-foreground">From</span>
                        <Input
                          type="number" min={1} max={maxAyah}
                          value={fromAyah}
                          onChange={(e) => {
                            const n = Number(e.target.value);
                            if (n >= 1 && n <= maxAyah) {
                              setFromAyah(n);
                              if (n > toAyah) setToAyah(n);
                            }
                          }}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div>
                        <span className="mb-1 block text-[10px] text-muted-foreground">To</span>
                        <Input
                          type="number" min={fromAyah} max={maxAyah}
                          value={toAyah}
                          onChange={(e) => {
                            const n = Number(e.target.value);
                            if (n >= fromAyah && n <= maxAyah) setToAyah(n);
                          }}
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Reciter */}
                  <div>
                    <Label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <Mic2 className="mr-1 inline h-3 w-3" /> Reciter
                    </Label>
                    <SimpleSelect
                      value={reciter}
                      onValueChange={setReciter}
                      options={RECITERS.map((r) => ({
                        value: r.id,
                        label: r.englishName,
                        sublabel: r.style,
                      }))}
                    />
                  </div>

                  {/* Custom audio upload */}
                  <div>
                    <Label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <Music className="mr-1 inline h-3 w-3" /> Your Recording (optional)
                    </Label>
                    <div
                      className={`drop-zone rounded-lg border-2 border-dashed border-border p-3 text-center ${dragOver ? "dragging" : ""}`}
                      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={handleDrop}
                    >
                      <Upload className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
                      <p className="text-[10px] text-muted-foreground">
                        Drop MP3 here or{" "}
                        <button
                          onClick={() => audioFileInputRef.current?.click()}
                          className="font-semibold text-emerald-700 dark:text-[var(--gold)] underline"
                        >
                          browse
                        </button>
                      </p>
                      <input
                        ref={audioFileInputRef}
                        type="file"
                        accept="audio/mpeg,audio/mp3"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) {
                            if (customAudioUrl?.startsWith("blob:")) {
                              URL.revokeObjectURL(customAudioUrl);
                            }
                            const objectUrl = URL.createObjectURL(f);
                            setCustomAudioUrl(objectUrl);
                            setCustomAudioName(f.name);
                            toast.success(`Using custom audio: ${f.name}`);
                          }
                          e.target.value = "";
                        }}
                      />
                    </div>
                    {customAudioName && (
                      <p className="mt-1 text-[10px] text-emerald-700 dark:text-[var(--gold)]">
                        Active: {customAudioName}
                      </p>
                    )}
                  </div>

                  {/* Translation */}
                  <div>
                    <Label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <Languages className="mr-1 inline h-3 w-3" /> Translation
                    </Label>
                    <SimpleSelect
                      value={translation}
                      onValueChange={setTranslation}
                      options={TRANSLATIONS.map((t) => ({
                        value: t.id,
                        label: t.englishName,
                        sublabel: t.language,
                      }))}
                    />
                  </div>

                  {/* Load slides button */}
                  <div className="space-y-2">
                    <Button
                      onClick={() => loadSlides()}
                      disabled={loadingSlides}
                      className="w-full bg-gradient-to-r from-emerald-700 to-emerald-800 text-white shadow-md hover:shadow-lg"
                    >
                      {loadingSlides ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...</>
                      ) : (
                        <><Plus className="mr-2 h-4 w-4" /> Load Slides ({fromAyah}{toAyah !== fromAyah ? `–${toAyah}` : ""})</>
                      )}
                    </Button>
                    <p className="text-center text-[10px] text-muted-foreground">
                      Tip: Click a surah above to auto-load its first ayah
                    </p>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            {/* AI TAB */}
            <TabsContent value="ai" className="flex-1 overflow-hidden mt-0 flex flex-col">
              <ScrollArea className="flex-1 thin-scroll p-4">
                <div className="space-y-3">
                  {aiMessages.map((m, i) => (
                    <div
                      key={i}
                      className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-xl px-3 py-2 text-xs ${
                          m.role === "user"
                            ? "bg-emerald-700 text-white"
                            : "bg-muted text-foreground"
                        }`}
                      >
                        <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <div className="border-t border-border p-3">
                <div className="mb-2 flex flex-wrap gap-1">
                  {["Surah 112 Ayah 1-4", "Surah 1 for TikTok", "Al-Kahf sunset background"].map((p) => (
                    <button
                      key={p}
                      onClick={() => setAiChatInput(p)}
                      className="rounded-full border border-border bg-background px-2 py-0.5 text-[10px] text-muted-foreground hover:border-[var(--gold)]/50 hover:text-foreground"
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Describe your video..."
                    value={aiChatInput}
                    onChange={(e) => setAiChatInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") sendAiChat(); }}
                    className="h-9 text-sm"
                  />
                  <Button size="icon" className="h-9 w-9 shrink-0 bg-emerald-700 text-white" onClick={sendAiChat}>
                    <Send className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </aside>

        {/* ============ CENTER CANVAS ============ */}
        <main className="flex flex-col overflow-hidden bg-muted/30">
          {/* Canvas toolbar */}
          <div className="flex shrink-0 items-center justify-between border-b border-border bg-card px-4 py-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px]">
                Slide {currentSlide + 1} of {slides.length || 0}
              </Badge>
              {currentAyah && (
                <Badge variant="outline" className="text-[10px]">
                  {currentSurah?.englishName} · Ayah {currentAyah.numberInSurah}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost" size="sm" className="h-8 text-xs"
                onClick={() => toast.success("Design applied to all slides")}
                disabled={!currentAyah}
              >
                <Layers className="mr-1.5 h-3 w-3" /> Apply to all
              </Button>
            </div>
          </div>

          {/* Canvas area */}
          <div className="flex flex-1 items-center justify-center overflow-auto p-6">
            <div
              className={`relative w-full max-w-3xl overflow-hidden rounded-xl shadow-2xl ${aspectClass}`}
              style={{ position: "relative" }}
              onMouseDown={(e) => {
                if (e.target === e.currentTarget) {
                  setSelectedElementId(null);
                }
              }}
            >
              {/* WYSIWYG PREVIEW CANVAS */}
              <canvas
                ref={canvasRef}
                width={1280}
                height={720}
                className="h-full w-full object-contain bg-black"
              />

              {/* Elements Interactive Overlay Layer */}
              {/* Draggable Overlay for Arabic Verse */}
              <div
                className={`absolute cursor-move select-none flex items-center justify-center rounded border-2 border-dashed ${
                  selectedElementId === "__arabic_verse_pos__"
                    ? "border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/30"
                    : "border-transparent hover:border-white/30"
                }`}
                style={{
                  left: "10%",
                  width: "80%",
                  top: `${50 + (arabicYOffset || 0) - 15}%`,
                  height: "30%",
                  zIndex: 30,
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  setSelectedElementId("__arabic_verse_pos__");
                  const startY = e.clientY;
                  const startOffset = arabicYOffset || 0;
                  const handleMouseMove = (moveEvent: MouseEvent) => {
                    const dy = ((moveEvent.clientY - startY) / canvasRef.current!.clientHeight) * 100;
                    const newOffset = Math.max(-50, Math.min(50, Math.round(startOffset + dy)));
                    setArabicYOffset(newOffset);
                  };
                  const handleMouseUp = () => {
                    window.removeEventListener("mousemove", handleMouseMove);
                    window.removeEventListener("mouseup", handleMouseUp);
                  };
                  window.addEventListener("mousemove", handleMouseMove);
                  window.addEventListener("mouseup", handleMouseUp);
                }}
              >
                {selectedElementId === "__arabic_verse_pos__" && (
                  <span className="text-[10px] text-white bg-black/60 px-1 rounded absolute top-1 left-1">Arabic Verse Position</span>
                )}
              </div>

              {/* Draggable Overlay for Translation */}
              {showTranslation && currentAyah?.translation && (
                <div
                  className={`absolute cursor-move select-none flex items-center justify-center rounded border-2 border-dashed ${
                    selectedElementId === "__translation_pos__"
                      ? "border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/30"
                      : "border-transparent hover:border-white/30"
                  }`}
                  style={{
                    left: "15%",
                    width: "70%",
                    top: `${50 + (arabicYOffset || 0) + 15 + (translationYOffset || 0) - 8}%`,
                    height: "16%",
                    zIndex: 30,
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setSelectedElementId("__translation_pos__");
                    const startY = e.clientY;
                    const startOffset = translationYOffset || 0;
                    const handleMouseMove = (moveEvent: MouseEvent) => {
                      const dy = ((moveEvent.clientY - startY) / canvasRef.current!.clientHeight) * 100;
                      const newOffset = Math.max(-50, Math.min(50, Math.round(startOffset + dy)));
                      setTranslationYOffset(newOffset);
                    };
                    const handleMouseUp = () => {
                      window.removeEventListener("mousemove", handleMouseMove);
                      window.removeEventListener("mouseup", handleMouseUp);
                    };
                    window.addEventListener("mousemove", handleMouseMove);
                    window.addEventListener("mouseup", handleMouseUp);
                  }}
                >
                  {selectedElementId === "__translation_pos__" && (
                    <span className="text-[10px] text-white bg-black/60 px-1 rounded absolute top-1 left-1">Translation Position</span>
                  )}
                </div>
              )}

              {/* Elements Interactive Overlay Layer */}
              {elements.map((el) => {
                const isSelected = selectedElementId === el.id;
                return (
                  <div
                    key={el.id}
                    className={`absolute cursor-move select-none ${
                      isSelected ? "ring-2 ring-emerald-500 ring-offset-2 ring-offset-black" : "hover:ring-1 hover:ring-white/30"
                    }`}
                    style={{
                      left: `${el.x}%`,
                      top: `${el.y}%`,
                      width: `${el.width}%`,
                      height: `${el.height}%`,
                      transform: `rotate(${el.rotation || 0}deg)`,
                      zIndex: el.zIndex + 10,
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setSelectedElementId(el.id);
                      
                      const startX = e.clientX;
                      const startY = e.clientY;
                      const startElX = el.x;
                      const startElY = el.y;
                      
                      const handleMouseMove = (moveEvent: MouseEvent) => {
                        const dx = ((moveEvent.clientX - startX) / canvasRef.current!.clientWidth) * 100;
                        const dy = ((moveEvent.clientY - startY) / canvasRef.current!.clientHeight) * 100;
                        
                        let newX = Math.round(startElX + dx);
                        let newY = Math.round(startElY + dy);
                        
                        // Guides alignment (snap center and edges)
                        if (Math.abs(newX + el.width / 2 - 50) < 2.5) {
                          newX = 50 - el.width / 2;
                        }
                        if (Math.abs(newY + el.height / 2 - 50) < 2.5) {
                          newY = 50 - el.height / 2;
                        }
                        
                        updateElement(el.id, { x: newX, y: newY });
                      };
                      
                      const handleMouseUp = () => {
                        window.removeEventListener("mousemove", handleMouseMove);
                        window.removeEventListener("mouseup", handleMouseUp);
                        pushHistory();
                      };
                      
                      window.addEventListener("mousemove", handleMouseMove);
                      window.addEventListener("mouseup", handleMouseUp);
                    }}
                  >
                    {isSelected && (
                      <>
                        {/* Rotate handle */}
                        <div
                          className="absolute -top-6 left-1/2 h-4 w-4 -translate-x-1/2 cursor-alias rounded-full bg-emerald-500 flex items-center justify-center shadow-lg"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            const rect = e.currentTarget.parentElement!.getBoundingClientRect();
                            const centerX = rect.left + rect.width / 2;
                            const centerY = rect.top + rect.height / 2;
                            
                            const handleMouseMove = (moveEvent: MouseEvent) => {
                              const angle = Math.atan2(moveEvent.clientY - centerY, moveEvent.clientX - centerX);
                              const degrees = Math.round((angle * 180) / Math.PI) - 90;
                              updateElement(el.id, { rotation: degrees });
                            };
                            
                            const handleMouseUp = () => {
                              window.removeEventListener("mousemove", handleMouseMove);
                              window.removeEventListener("mouseup", handleMouseUp);
                              pushHistory();
                            };
                            
                            window.addEventListener("mousemove", handleMouseMove);
                            window.addEventListener("mouseup", handleMouseUp);
                          }}
                        >
                          <span className="text-[9px] text-white">⟳</span>
                        </div>
                        {/* Resize handle */}
                        <div
                          className="absolute bottom-0 right-0 h-3 w-3 translate-x-1/3 translate-y-1/3 cursor-se-resize bg-emerald-500 rounded shadow-lg"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            const startWidth = el.width;
                            const startHeight = el.height;
                            const startX = e.clientX;
                            const startY = e.clientY;
                            
                            const handleMouseMove = (moveEvent: MouseEvent) => {
                              const dw = ((moveEvent.clientX - startX) / canvasRef.current!.clientWidth) * 100;
                              const dh = ((moveEvent.clientY - startY) / canvasRef.current!.clientHeight) * 100;
                              updateElement(el.id, {
                                width: Math.max(5, Math.round(startWidth + dw)),
                                height: Math.max(5, Math.round(startHeight + dh))
                              });
                            };
                            
                            const handleMouseUp = () => {
                              window.removeEventListener("mousemove", handleMouseMove);
                              window.removeEventListener("mouseup", handleMouseUp);
                              pushHistory();
                            };
                            
                            window.addEventListener("mousemove", handleMouseMove);
                            window.addEventListener("mouseup", handleMouseUp);
                          }}
                        />
                      </>
                    )}
                  </div>
                );
              })}

              {/* Loading indicator */}
              {loadingSlides && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-[var(--gold)]" />
                    <p className="text-xs font-medium text-white">Loading...</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Slide thumbnails navigator */}
          {slides.length > 1 && (
            <div className="shrink-0 border-t border-border bg-card px-4 py-2">
              <div className="flex items-center gap-2 overflow-x-auto thin-scroll">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground shrink-0">
                  Slides:
                </span>
                {slides.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setCurrentSlide(i);
                      setIsPlaying(false);
                      setActiveWordIdx(-1);
                      setProgress(0);
                    }}
                    className={`group relative flex h-12 w-20 shrink-0 items-center justify-center overflow-hidden rounded-md border-2 text-[10px] font-bold transition-all ${
                      i === currentSlide
                        ? "border-[var(--gold)] bg-[var(--gold-soft)]/40 text-foreground"
                        : "border-border bg-muted/40 text-muted-foreground hover:border-[var(--gold)]/50"
                    }`}
                    title={`Ayah ${s.numberInSurah}`}
                  >
                    <span className="absolute left-1 top-0.5 text-[8px] font-bold opacity-60">
                      {s.numberInSurah}
                    </span>
                    <span className="mt-1 truncate px-1 font-quran text-xs" style={{ fontFamily: "var(--font-quran)" }}>
                      {s.words[0]?.text?.substring(0, 8) || "—"}
                    </span>
                    {i === currentSlide && (
                      <span className="absolute right-1 top-0.5 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Player controls */}
          <div className="flex shrink-0 items-center justify-between gap-3 border-t border-border bg-card px-4 py-3">
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={goPrevSlide} disabled={currentSlide === 0}>
                <SkipBack className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handleStop} disabled={!isPlaying && progress === 0}>
                <Square className="h-3.5 w-3.5" />
              </Button>
              <Button
                onClick={handlePlay}
                disabled={!currentAyah}
                className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-700 to-emerald-900 p-0 text-white shadow-md"
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 translate-x-0.5" />}
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={goNextSlide} disabled={currentSlide >= slides.length - 1}>
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-3">
              {/* Time display */}
              <div className="hidden items-center gap-1.5 text-xs font-medium tabular-nums text-muted-foreground sm:flex">
                <span className="text-foreground">{formatTime(currentTime)}</span>
                <span className="text-muted-foreground/60">/</span>
                <span>{formatTime(audioDuration)}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Volume2 className="h-3.5 w-3.5" />
                <Slider value={[volume]} onValueChange={(v) => setVolume(v[0])} max={100} step={1} className="w-20" />
                <span className="w-8 text-right tabular-nums">{volume}%</span>
              </div>
              <Badge variant="outline" className="hidden text-[10px] lg:inline-flex">
                {activeWordIdx >= 0
                  ? `Word ${activeWordIdx + 1}/${currentAyah?.words.length ?? 0}`
                  : `${progress}%`}
              </Badge>
            </div>
          </div>
        </main>

        {/* ============ RIGHT PANEL ============ */}
        <aside className="flex flex-col border-l border-border bg-card overflow-hidden">
          <Tabs defaultValue="bg" className="flex h-full flex-col">
            <TabsList className="grid w-full shrink-0 grid-cols-4 rounded-none border-b border-border bg-card p-0">
              <TabsTrigger value="bg" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[var(--gold)] text-[11px]">
                <ImageIcon className="mr-1 h-3 w-3" /> BG
              </TabsTrigger>
              <TabsTrigger value="text" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[var(--gold)] text-[11px]">
                <Type className="mr-1 h-3 w-3" /> Text
              </TabsTrigger>
              <TabsTrigger value="effects" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[var(--gold)] text-[11px]">
                <Sparkles className="mr-1 h-3 w-3" /> FX
              </TabsTrigger>
              <TabsTrigger value="export" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[var(--gold)] text-[11px]">
                <Download className="mr-1 h-3 w-3" /> Export
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1 h-[calc(100vh-7rem)] thin-scroll">
              {/* BACKGROUND TAB */}
              <TabsContent value="bg" className="p-4 mt-0 space-y-4">
                {/* Background type tabs */}
                <div className="flex flex-wrap gap-1">
                  {([
                    { id: "upload", label: "Upload", icon: Upload },
                    { id: "ai", label: "AI Gen", icon: Wand2 },
                    { id: "preset", label: "Presets", icon: ImageIcon },
                    { id: "video", label: "Video Loop", icon: Film },
                    { id: "gradient", label: "Gradient", icon: Palette },
                    { id: "color", label: "Color", icon: SquareIcon },
                  ] as const).map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setBgTab(t.id)}
                      className={`flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-medium transition-all ${
                        bgTab === t.id
                          ? "border-[var(--gold)] bg-[var(--gold-soft)]/40 text-foreground"
                          : "border-border text-muted-foreground hover:bg-accent/40"
                      }`}
                    >
                      <t.icon className="h-3 w-3" /> {t.label}
                    </button>
                  ))}
                </div>

                {/* Upload */}
                {bgTab === "upload" && (
                  <div className="space-y-3">
                    <div
                      className={`drop-zone rounded-lg border-2 border-dashed border-border p-4 text-center ${dragOver ? "dragging" : ""}`}
                      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={handleDrop}
                    >
                      {uploading ? (
                        <div className="flex flex-col items-center gap-2 py-2">
                          <Loader2 className="h-6 w-6 animate-spin text-[var(--gold)]" />
                          <p className="text-[11px] text-muted-foreground">Uploading...</p>
                        </div>
                      ) : (
                        <>
                          <Upload className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
                          <p className="text-xs font-medium text-foreground">Drop media file here</p>
                          <p className="mt-1 text-[10px] text-muted-foreground">
                            or{" "}
                            <button
                              onClick={() => fileInputRef.current?.click()}
                              className="font-semibold text-emerald-700 dark:text-[var(--gold)] underline"
                            >
                              browse files
                            </button>
                          </p>
                          <p className="mt-1 text-[10px] text-muted-foreground">Images or MP4/WebM videos · max 50MB</p>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/png,image/jpeg,image/jpg,image/webp,image/gif,video/mp4,video/webm"
                            className="hidden"
                            onChange={handleFileInput}
                          />
                        </>
                      )}
                    </div>

                    {/* Uploaded backgrounds */}
                    <div>
                      <p className="mb-2 text-xs font-semibold text-foreground">
                        My Uploaded Assets ({uploadedBgs.length})
                      </p>
                      {uploadedBgs.length === 0 ? (
                        <p className="rounded-lg border border-border bg-muted/30 px-3 py-4 text-center text-[10px] text-muted-foreground">
                          No uploaded assets yet
                        </p>
                      ) : (
                        <div className="grid grid-cols-3 gap-2">
                          {uploadedBgs.map((bg) => {
                            const isVideo = bg.filename.endsWith(".mp4") || bg.filename.endsWith(".webm");
                            return (
                              <div
                                key={bg.filename}
                                className={`group relative aspect-video overflow-hidden rounded-lg border-2 ${
                                  uploadedBgUrl === bg.url
                                    ? "border-[var(--gold)] ring-2 ring-[var(--gold)]/30"
                                    : "border-border"
                                }`}
                              >
                                <button
                                  onClick={() => {
                                    setUploadedBgUrl(bg.url);
                                    setBgId(isVideo ? "__video_upload__" : "__upload__");
                                  }}
                                  className="h-full w-full relative flex items-center justify-center bg-black overflow-hidden"
                                  aria-label={bg.filename}
                                >
                                  {isVideo ? (
                                    <video src={bg.url} className="h-full w-full object-cover pointer-events-none" />
                                  ) : (
                                    <div
                                      className="h-full w-full bg-cover bg-center"
                                      style={{ backgroundImage: `url(${bg.url})` }}
                                    />
                                  )}
                                </button>
                                <button
                                  onClick={() => handleDeleteUpload(bg.filename)}
                                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                                  aria-label="Delete"
                                >
                                  <Trash2 className="h-2.5 w-2.5" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* AI Gen */}
                {bgTab === "ai" && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Wand2 className="h-3.5 w-3.5 text-[var(--gold)]" />
                      <p className="text-xs font-semibold text-foreground">AI Background Generator</p>
                    </div>
                    <Input
                      placeholder="e.g. mosque at sunset..."
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") generateAIBackground(); }}
                      className="h-9 text-sm"
                    />
                    <div className="flex flex-wrap gap-1">
                      {["Mosque at sunset", "Desert night", "Mountain lake", "Garden of palms", "Starry sky"].map((p) => (
                        <button
                          key={p}
                          onClick={() => setAiPrompt(p)}
                          className="rounded-full border border-border bg-background px-2 py-0.5 text-[10px] text-muted-foreground hover:border-[var(--gold)]/50 hover:text-foreground"
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                    <Button
                      onClick={generateAIBackground}
                      disabled={aiLoading}
                      className="w-full bg-gradient-to-r from-[var(--gold)] to-amber-500 text-emerald-950 hover:from-amber-400 hover:to-amber-500"
                      size="sm"
                    >
                      {aiLoading ? (
                        <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Generating...</>
                      ) : (
                        <><Sparkles className="mr-2 h-3.5 w-3.5" /> Generate</>
                      )}
                    </Button>
                  </div>
                )}

                {/* Presets */}
                {bgTab === "preset" && (
                  <div>
                    <p className="mb-2 text-xs font-semibold text-foreground">Preset Backgrounds</p>
                    <div className="grid grid-cols-3 gap-2">
                      {PRESET_BACKGROUNDS.map((b) => (
                        <button
                          key={b.id}
                          onClick={() => {
                            setBgId(b.id);
                            setAiBgUrl(null);
                            setUploadedBgUrl(null);
                          }}
                          className={`group relative aspect-video overflow-hidden rounded-lg border-2 transition-all ${
                            bgId === b.id
                              ? "border-[var(--gold)] ring-2 ring-[var(--gold)]/30"
                              : "border-border hover:border-[var(--gold)]/50"
                          }`}
                          style={{ background: b.css }}
                        >
                          <div className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/70 to-transparent p-1.5">
                            <span className="text-[9px] font-semibold uppercase tracking-wider text-white">
                              {b.name}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Video presets */}
                {bgTab === "video" && (
                  <div>
                    <p className="mb-2 text-xs font-semibold text-foreground">Preset Video Loops</p>
                    <div className="grid grid-cols-3 gap-2">
                      {PRESET_VIDEOS.map((v) => (
                        <button
                          key={v.id}
                          onClick={() => {
                            setBgId(v.id);
                            setAiBgUrl(null);
                            setUploadedBgUrl(null);
                          }}
                          className={`group relative aspect-video overflow-hidden rounded-lg border-2 transition-all ${
                            bgId === v.id
                              ? "border-[var(--gold)] ring-2 ring-[var(--gold)]/30"
                              : "border-border hover:border-[var(--gold)]/50"
                          }`}
                        >
                          <video src={v.url} muted loop autoPlay className="h-full w-full object-cover pointer-events-none" />
                          <div className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/70 to-transparent p-1.5">
                            <span className="text-[9px] font-semibold text-white truncate max-w-full">
                              {v.name}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Gradient */}
                {bgTab === "gradient" && (
                  <div className="space-y-4">
                    <div>
                      <p className="mb-2 text-xs font-semibold text-foreground">Presets</p>
                      <div className="grid grid-cols-3 gap-2">
                        {GRADIENTS.map((g) => (
                          <button
                            key={g.id}
                            onClick={() => {
                              setBgId(`__grad_${g.id}__`);
                              setAiBgUrl(null);
                              setUploadedBgUrl(null);
                            }}
                            className={`group relative aspect-video overflow-hidden rounded-lg border-2 transition-all ${
                              bgId === `__grad_${g.id}__`
                                ? "border-[var(--gold)] ring-2 ring-[var(--gold)]/30"
                                : "border-border hover:border-[var(--gold)]/50"
                            }`}
                            style={{ background: g.css }}
                          >
                            <div className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/60 to-transparent p-1.5">
                              <span className="text-[9px] font-semibold text-white">{g.name}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-lg border border-border p-3 space-y-3">
                      <p className="text-xs font-semibold text-foreground">Custom Gradient Builder</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <span className="mb-1 block text-[10px] text-muted-foreground">Start Color</span>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="color"
                              value={customGradientStart}
                              onChange={(e) => {
                                setCustomGradientStart(e.target.value);
                                setBgId("__custom_grad__");
                              }}
                              className="h-8 w-10 cursor-pointer rounded border border-border"
                            />
                            <span className="text-[10px] font-mono uppercase">{customGradientStart}</span>
                          </div>
                        </div>
                        <div>
                          <span className="mb-1 block text-[10px] text-muted-foreground">End Color</span>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="color"
                              value={customGradientEnd}
                              onChange={(e) => {
                                setCustomGradientEnd(e.target.value);
                                setBgId("__custom_grad__");
                              }}
                              className="h-8 w-10 cursor-pointer rounded border border-border"
                            />
                            <span className="text-[10px] font-mono uppercase">{customGradientEnd}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <span className="mb-1 block text-[10px] text-muted-foreground">Angle ({customGradientAngle}°)</span>
                        <Slider
                          value={[customGradientAngle]}
                          onValueChange={(v) => {
                            setCustomGradientAngle(v[0]);
                            setBgId("__custom_grad__");
                          }}
                          max={360}
                          step={1}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Solid color */}
                {bgTab === "color" && (
                  <div>
                    <p className="mb-2 text-xs font-semibold text-foreground">Solid Colors</p>
                    <div className="grid grid-cols-4 gap-2">
                      {SOLID_COLORS.map((c) => (
                        <button
                          key={c}
                          onClick={() => {
                            setBgId(`__color_${c}__`);
                            setAiBgUrl(null);
                            setUploadedBgUrl(null);
                          }}
                          className={`aspect-square rounded-lg border-2 transition-all ${
                            bgId === `__color_${c}__`
                              ? "border-[var(--gold)] ring-2 ring-[var(--gold)]/30"
                              : "border-border hover:scale-105"
                          }`}
                          style={{ background: c }}
                          aria-label={c}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Background opacity */}
                <div className="border-t border-border pt-3">
                  <Label className="mb-2 block text-xs font-medium text-muted-foreground">
                    Background opacity: {bgOpacity}%
                  </Label>
                  <Slider
                    value={[bgOpacity]}
                    onValueChange={(v) => setBgOpacity(v[0])}
                    max={100} step={1}
                  />
                </div>
              </TabsContent>

              {/* TEXT TAB */}
              <TabsContent value="text" className="p-4 mt-0 space-y-4">
                {/* Save/Load Project Row */}
                <div className="grid grid-cols-2 gap-2 pb-2 border-b border-border">
                  <Button variant="outline" size="sm" onClick={saveProject} className="text-xs">
                    <Save className="mr-1.5 h-3.5 w-3.5" /> Save Project
                  </Button>
                  <Button variant="outline" size="sm" onClick={loadProject} className="text-xs">
                    <FolderOpen className="mr-1.5 h-3.5 w-3.5" /> Load Project
                  </Button>
                </div>

                {/* Prepend Bismillah */}
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div className="space-y-0.5">
                    <Label htmlFor="bismillah-prepend" className="text-xs font-semibold">Prepend Bismillah</Label>
                    <p className="text-[9px] text-muted-foreground">Prepend Bismillah for mid-surah ranges</p>
                  </div>
                  <Switch
                    id="bismillah-prepend"
                    checked={prependBismillah && selectedSurah !== 9}
                    disabled={selectedSurah === 9}
                    onCheckedChange={(checked) => {
                      if (selectedSurah === 9) {
                        toast.error("Bismillah is strictly excluded for Surah At-Tawbah (9)");
                        return;
                      }
                      setPrependBismillah(checked);
                      // Dynamically reload slides to reflect Bismillah state
                      setTimeout(() => loadSlides(), 100);
                    }}
                  />
                </div>

                {/* 20+ Fonts Dynamic Selection */}
                <div>
                  <Label className="mb-1.5 block text-xs font-semibold text-foreground">Arabic Font family</Label>
                  <SimpleSelect
                    value={arabicFont}
                    onValueChange={setArabicFont}
                    options={[
                      "KFGQPC Uthmanic Script Hafs",
                      "Amiri Quran",
                      "Scheherazade",
                      "me_quran",
                      "PDMS Saleem Quran Font",
                      "LPMQ Isep Misbah",
                      "Cairo",
                      "Amiri",
                      "Tajawal",
                      "Scheherazade New",
                      "Almarai",
                      "IBM Plex Sans Arabic",
                      "Qahiri",
                      "Reem Kufi",
                      "Aref Ruqaa",
                      "Changa",
                      "Lemonada",
                      "El Messiri",
                      "Lateef",
                      "Ruwudu",
                      "Jomhuria",
                      "Harmattan",
                      "Katibeh",
                      "Kufam",
                      "Lalezar",
                      "Mada",
                      "Markazi Text"
                    ].map(f => ({ value: f, label: f }))}
                  />
                </div>

                <div>
                  <Label className="mb-1.5 block text-xs font-semibold text-foreground">Translation Font family</Label>
                  <SimpleSelect
                    value={translationFont}
                    onValueChange={setTranslationFont}
                    options={(() => {
                      const isUrdu = translation.startsWith("ur");
                      const isHindi = translation.startsWith("hi");
                      const list = isUrdu
                        ? ["Noto Nastaliq Urdu", "Cairo", "Amiri", "Tajawal", "Scheherazade New", "Almarai", "IBM Plex Sans Arabic", "Qahiri", "Reem Kufi", "Aref Ruqaa", "Changa", "Lemonada", "El Messiri", "Lateef", "Ruwudu", "Jomhuria", "Harmattan", "Katibeh", "Kufam", "Lalezar", "Mada"]
                        : isHindi
                        ? ["Noto Sans Devanagari", "Rozha One", "Yatra One", "Rajdhani", "Hind", "Teko", "Khand", "Biryani", "Karma", "Kurale", "Amita", "Halant", "Gotu", "Mukta", "Modak", "Sarpanch", "Federo", "Asar", "Vesper Libre"]
                        : ["Inter", "Roboto", "Playfair Display", "Montserrat", "Poppins", "Merriweather", "Oswald", "Raleway", "Nunito", "Chelsea Market", "Pacifico", "Great Vibes", "Cinzel", "Ubuntu", "Caveat", "Lobster", "Bebas Neue", "Open Sans", "Lato", "Lora"];
                      return list.map(f => ({ value: f, label: f }));
                    })()}
                  />
                </div>

                {/* Interactive Elements Layer Manager */}
                <div className="rounded-lg border border-border p-3 space-y-2">
                  <p className="text-xs font-bold text-foreground">Canvas Elements layers</p>
                  <div className="flex flex-wrap gap-1">
                    <Button variant="outline" size="sm" onClick={addTextElement} className="text-[10px] h-7">
                      <Plus className="mr-1 h-3 w-3" /> Add Text
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => addShapeElement("rectangle")} className="text-[10px] h-7">
                      <Plus className="mr-1 h-3 w-3" /> Rect
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => addShapeElement("circle")} className="text-[10px] h-7">
                      <Plus className="mr-1 h-3 w-3" /> Circle
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => addShapeElement("triangle")} className="text-[10px] h-7">
                      <Plus className="mr-1 h-3 w-3" /> Triangle
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => {
                      const inp = document.createElement("input");
                      inp.type = "file";
                      inp.accept = "image/*";
                      inp.onchange = (e: any) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const rdr = new FileReader();
                          rdr.onload = () => addImageElement(rdr.result as string);
                          rdr.readAsDataURL(file);
                        }
                      };
                      inp.click();
                    }} className="text-[10px] h-7">
                      <Plus className="mr-1 h-3 w-3" /> Add Image/Logo
                    </Button>
                  </div>

                  {elements.length > 0 && (
                    <div className="space-y-1.5 mt-2 max-h-[160px] overflow-y-auto thin-scroll">
                      {elements.map((el) => {
                        const isSelected = selectedElementId === el.id;
                        return (
                          <div
                            key={el.id}
                            onClick={() => setSelectedElementId(el.id)}
                            className={`flex items-center justify-between rounded border px-2 py-1 cursor-pointer transition-colors text-[11px] ${
                              isSelected ? "border-emerald-500 bg-emerald-950/20" : "border-border hover:bg-accent/40"
                            }`}
                          >
                            <span className="capitalize font-medium truncate max-w-[80px]">
                              {el.type === "text" ? el.content : el.shapeType || el.type}
                            </span>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground hover:text-foreground"
                                onClick={(e) => { e.stopPropagation(); changeZIndex(el.id, "up"); }}
                              >
                                ▲
                              </Button>
                              <Button
                                variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground hover:text-foreground"
                                onClick={(e) => { e.stopPropagation(); changeZIndex(el.id, "down"); }}
                              >
                                ▼
                              </Button>
                              <Button
                                variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground hover:text-foreground"
                                onClick={(e) => { e.stopPropagation(); duplicateElement(el.id); }}
                              >
                                ⧉
                              </Button>
                              <Button
                                variant="ghost" size="icon" className="h-5 w-5 text-red-500 hover:text-red-400"
                                onClick={(e) => { e.stopPropagation(); deleteElement(el.id); }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Active Element Properties */}
                  {selectedElementId && (
                    <div className="border-t border-border pt-2 mt-2 space-y-2">
                      <p className="text-[10px] font-semibold text-muted-foreground">Selected Element Options</p>
                      {elements.find(e => e.id === selectedElementId)?.type === "text" && (
                        <div>
                          <Label className="text-[10px] mb-1 block">Content</Label>
                          <Input
                            className="h-7 text-xs"
                            value={elements.find(e => e.id === selectedElementId)?.content || ""}
                            onChange={(e) => updateElement(selectedElementId, { content: e.target.value })}
                          />
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-[10px] mb-1 block">Color</Label>
                          <input
                            type="color"
                            className="h-6 w-full rounded cursor-pointer"
                            value={elements.find(e => e.id === selectedElementId)?.color || "#ffffff"}
                            onChange={(e) => updateElement(selectedElementId, { color: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label className="text-[10px] mb-1 block">Opacity</Label>
                          <Slider
                            value={[elements.find(e => e.id === selectedElementId)?.opacity ?? 100]}
                            onValueChange={(v) => updateElement(selectedElementId, { opacity: v[0] })}
                            max={100}
                          />
                        </div>
                      </div>
                      {elements.find(e => e.id === selectedElementId)?.type === "image" && (
                        <div className="pt-2 border-t border-border mt-2 space-y-2">
                          <p className="text-[10px] font-semibold text-muted-foreground">Logo / Overlay Image Actions</p>
                          <Button
                            size="sm"
                            className="w-full bg-emerald-700 hover:bg-emerald-600 text-white text-[10px] h-7"
                            onClick={() => removeElementBg(selectedElementId)}
                          >
                            Remove Logo Background
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Manual Sizes & Text Presets */}
                <div className="rounded-lg border border-border p-3 space-y-3">
                  <p className="text-xs font-bold text-foreground">Manual Font Sizes</p>
                  <div>
                    <Label className="mb-1 block text-[10px] text-muted-foreground">Arabic Text Size ({arabicTextSize}px)</Label>
                    <Slider
                      value={[arabicTextSize]}
                      onValueChange={(v) => setArabicTextSize(v[0])}
                      min={24}
                      max={96}
                      step={1}
                    />
                  </div>
                  <div>
                    <Label className="mb-1 block text-[10px] text-muted-foreground">Translation Text Size ({translationTextSize}px)</Label>
                    <Slider
                      value={[translationTextSize]}
                      onValueChange={(v) => setTranslationTextSize(v[0])}
                      min={12}
                      max={64}
                      step={1}
                    />
                  </div>
                </div>

                {/* Vertical Position offsets controls */}
                <div className="rounded-lg border border-border p-3 space-y-3">
                  <p className="text-xs font-bold text-foreground">Vertical Position Offsets</p>
                  <div>
                    <Label className="mb-1 block text-[10px] text-muted-foreground">Arabic Y Location Offset ({arabicYOffset}%)</Label>
                    <Slider
                      value={[arabicYOffset]}
                      onValueChange={(v) => setArabicYOffset(v[0])}
                      min={-50}
                      max={50}
                      step={1}
                    />
                  </div>
                  <div>
                    <Label className="mb-1 block text-[10px] text-muted-foreground">Translation Y Location Offset ({translationYOffset}%)</Label>
                    <Slider
                      value={[translationYOffset]}
                      onValueChange={(v) => setTranslationYOffset(v[0])}
                      min={-50}
                      max={50}
                      step={1}
                    />
                  </div>
                </div>

                {/* Text Color / Shadow */}
                <div className="rounded-lg border border-border p-3 space-y-3">
                  <p className="text-xs font-bold text-foreground">Text Aesthetics</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="mb-1 block text-[10px] text-muted-foreground">Text Color</span>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={textColor}
                          onChange={(e) => setTextColor(e.target.value)}
                          className="h-8 w-10 cursor-pointer rounded border border-border"
                        />
                        <span className="text-[10px] font-mono uppercase">{textColor}</span>
                      </div>
                    </div>
                    <div>
                      <span className="mb-1 block text-[10px] text-muted-foreground">Text Shadow</span>
                      <Input
                        value={textShadow}
                        onChange={(e) => setTextShadow(e.target.value)}
                        placeholder="e.g. 0 2px 8px rgba(0,0,0,0.5)"
                        className="h-8 text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Direct text & translation editing options */}
                <div className="rounded-lg border border-border p-3 space-y-3">
                  <p className="text-xs font-bold text-foreground">Direct Verse & Translation Editor</p>
                  {currentAyah ? (
                    <div className="space-y-2">
                      <div>
                        <Label className="text-[10px] text-muted-foreground block mb-1">Edit Arabic Verse</Label>
                        <textarea
                          className="w-full text-xs p-1.5 border border-border rounded bg-background text-foreground"
                          rows={2}
                          value={currentAyah.text}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSlides(prev => prev.map((s, idx) => idx === currentSlide ? { ...s, text: val } : s));
                          }}
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground block mb-1">Edit Translation</Label>
                        <textarea
                          className="w-full text-xs p-1.5 border border-border rounded bg-background text-foreground"
                          rows={3}
                          value={currentAyah.translation || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSlides(prev => prev.map((s, idx) => idx === currentSlide ? { ...s, translation: val } : s));
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="text-[10px] text-muted-foreground">Load slides to edit verse content</p>
                  )}
                </div>

                {/* Show Translation Toggle */}
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <Label htmlFor="show-tr" className="text-xs">Show translation text</Label>
                  <Switch id="show-tr" checked={showTranslation} onCheckedChange={setShowTranslation} />
                </div>

                {/* Show Arabic Toggle */}
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <Label htmlFor="show-ar" className="text-xs">Show Arabic verse</Label>
                  <Switch id="show-ar" checked={showArabic} onCheckedChange={setShowArabic} />
                </div>

                {/* Word Highlight Aesthetics */}
                <div className="rounded-lg border border-border p-3 space-y-3">
                  <p className="text-xs font-bold text-foreground">Word-by-word Highlight Style</p>
                  
                  {/* Highlight Type Selector */}
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => setHighlightType("color")}
                      className={`rounded-md border py-1 text-[10px] font-medium transition-all ${
                        highlightType === "color"
                          ? "border-[var(--gold)] bg-[var(--gold-soft)]/30 text-foreground"
                          : "border-border text-muted-foreground hover:bg-accent/30"
                      }`}
                    >
                      Solid Color
                    </button>
                    <button
                      onClick={() => setHighlightType("gradient")}
                      className={`rounded-md border py-1 text-[10px] font-medium transition-all ${
                        highlightType === "gradient"
                          ? "border-[var(--gold)] bg-[var(--gold-soft)]/30 text-foreground"
                          : "border-border text-muted-foreground hover:bg-accent/30"
                      }`}
                    >
                      Gradient
                    </button>
                  </div>

                  {highlightType === "color" ? (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="mb-1 block text-[10px] text-muted-foreground">Highlight Color</span>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="color"
                            value={highlightColor}
                            onChange={(e) => setHighlightColor(e.target.value)}
                            className="h-8 w-10 cursor-pointer rounded border border-border"
                          />
                          <span className="text-[10px] font-mono uppercase">{highlightColor}</span>
                        </div>
                      </div>
                      <div>
                        <span className="mb-1 block text-[10px] text-muted-foreground">Glow Color</span>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="color"
                            value={highlightGlowColor}
                            onChange={(e) => setHighlightGlowColor(e.target.value)}
                            className="h-8 w-10 cursor-pointer rounded border border-border"
                          />
                          <span className="text-[10px] font-mono uppercase">{highlightGlowColor}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <span className="mb-1 block text-[10px] text-muted-foreground">Grad Start</span>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="color"
                              value={highlightGradientStart}
                              onChange={(e) => setHighlightGradientStart(e.target.value)}
                              className="h-8 w-10 cursor-pointer rounded border border-border"
                            />
                            <span className="text-[10px] font-mono uppercase">{highlightGradientStart}</span>
                          </div>
                        </div>
                        <div>
                          <span className="mb-1 block text-[10px] text-muted-foreground">Grad End</span>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="color"
                              value={highlightGradientEnd}
                              onChange={(e) => setHighlightGradientEnd(e.target.value)}
                              className="h-8 w-10 cursor-pointer rounded border border-border"
                            />
                            <span className="text-[10px] font-mono uppercase">{highlightGradientEnd}</span>
                          </div>
                        </div>
                      </div>

                      {/* Preset Highlight Gradients */}
                      <div>
                        <span className="mb-1.5 block text-[10px] text-muted-foreground">Presets</span>
                        <div className="grid grid-cols-4 gap-1">
                          {[
                            { name: "Gold", start: "#ffe066", end: "#f5af19" },
                            { name: "Sunset", start: "#ff758c", end: "#ff7eb3" },
                            { name: "Cyan", start: "#00f2fe", end: "#4facfe" },
                            { name: "Emerald", start: "#00ff87", end: "#60efff" },
                          ].map((preset) => (
                            <button
                              key={preset.name}
                              onClick={() => {
                                setHighlightGradientStart(preset.start);
                                setHighlightGradientEnd(preset.end);
                              }}
                              className="rounded-md border border-border py-1 text-[9px] font-medium text-muted-foreground hover:border-[var(--gold)]/50 hover:text-foreground"
                              style={{
                                background: `linear-gradient(135deg, ${preset.start}, ${preset.end})`,
                                color: "#000",
                                textShadow: "0 0 1px #fff"
                              }}
                            >
                              {preset.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </ScrollArea>

            <ScrollArea className="flex-1 thin-scroll">
              {/* EFFECTS TAB */}
              <TabsContent value="effects" className="p-4 mt-0 space-y-4">
                {/* Background Smart Remover (AI Background Removal tool) */}
                <div className="rounded-lg border border-border p-3 space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-emerald-500" />
                    <p className="text-xs font-bold text-foreground">Smart background remover</p>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Instantly clear background colors to create transparent subject overlays.
                  </p>
                  <div>
                    <Label className="text-[10px] mb-1 block">Color Tolerance ({bgRemoverTolerance})</Label>
                    <Slider
                      value={[bgRemoverTolerance]}
                      onValueChange={(v) => setBgRemoverTolerance(v[0])}
                      min={5}
                      max={100}
                    />
                  </div>
                  <Button
                    size="sm"
                    className="w-full bg-emerald-700 hover:bg-emerald-600 text-white"
                    onClick={handleBgRemoval}
                  >
                    Auto-remove background
                  </Button>
                </div>

                {/* Visualizer & Highlight Controls */}
                <div className="rounded-lg border border-border p-3 space-y-3">
                  <p className="text-xs font-bold text-foreground">Visualizer & highlights</p>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="show-visualizer" className="text-xs">Audio visualizer wave</Label>
                    <Switch id="show-visualizer" checked={showAudioVisualizer} onCheckedChange={setShowAudioVisualizer} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="show-highlight" className="text-xs">Word-by-word highlights</Label>
                    <Switch id="show-highlight" checked={showHighlight} onCheckedChange={setShowHighlight} />
                  </div>
                </div>

                {/* Ken Burns & Transitions */}
                <div className="rounded-lg border border-border p-3 space-y-3">
                  <p className="text-xs font-bold text-foreground">Cinematic Effects</p>
                  <div>
                    <Label className="text-[10px] mb-1 block">Background FX</Label>
                    <SimpleSelect
                      value={backgroundEffect}
                      onValueChange={(v) => setBackgroundEffect(v as any)}
                      options={[
                        { value: "none", label: "No Effect" },
                        { value: "ken_burns", label: "Ken Burns (Zoom/Pan)" },
                        { value: "particles", label: "Floating Particles" },
                        { value: "color_overlay", label: "Dark Color Overlay" }
                      ]}
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] mb-1 block">Slide Transitions</Label>
                    <SimpleSelect
                      value={transitionEffect}
                      onValueChange={(v) => setTransitionEffect(v as any)}
                      options={[
                        { value: "none", label: "Instant Cut" },
                        { value: "crossfade", label: "Crossfade Blend" },
                        { value: "slide", label: "Slide Left" },
                        { value: "wipe", label: "Linear Wipe" }
                      ]}
                    />
                  </div>
                </div>

                {/* Aspect Ratio */}
                <div>
                  <Label className="mb-2 block text-xs font-semibold text-foreground">Aspect Ratio</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {ASPECT_RATIOS.map((a) => (
                      <button
                        key={a.id}
                        onClick={() => setAspectRatio(a.id)}
                        className={`flex items-center gap-2 rounded-lg border-2 p-2 transition-all ${
                          aspectRatio === a.id
                            ? "border-[var(--gold)] bg-[var(--gold-soft)]/40"
                            : "border-border hover:border-[var(--gold)]/50"
                        }`}
                      >
                        <a.icon className="h-4 w-4 text-muted-foreground" />
                        <div className="text-left">
                          <div className="text-[10px] font-semibold text-foreground">{a.id}</div>
                          <div className="text-[9px] text-muted-foreground">{a.name}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </ScrollArea>

            <ScrollArea className="flex-1 thin-scroll">
              {/* EXPORT TAB */}
              <TabsContent value="export" className="p-4 mt-0 space-y-4">
                {/* Audio Detector / Waveform Grid Calibration */}
                <div className="rounded-lg border border-border p-3 space-y-3">
                  <p className="text-xs font-bold text-foreground">Audio Sync Calibration</p>
                  <div className="space-y-2">
                    <Label className="text-[10px] text-muted-foreground">Upload audio file to sync word highlights:</Label>
                    <Input
                      type="file"
                      accept="audio/*"
                      ref={audioFileInputRef}
                      onChange={handleAudioUpload}
                      className="h-8 text-xs cursor-pointer"
                    />
                  </div>

                  {peaks.length > 0 && (
                    <div className="space-y-2">
                      <div className="bg-black/60 border border-border p-2 rounded">
                        <p className="text-[9px] font-mono text-emerald-400 mb-1">
                          Detected: Surah {detectedSurah} ({detectionConfidence}% confidence)
                        </p>
                        <canvas
                          ref={waveformCanvasRef}
                          width={200}
                          height={40}
                          className="w-full h-10 bg-black/40 rounded"
                        />
                      </div>
                      <p className="text-[9px] text-muted-foreground leading-relaxed">
                        Slide playback is automatically advanced in sync with reciter audio timestamps.
                      </p>
                    </div>
                  )}
                </div>

                <div className="rounded-lg bg-gradient-to-br from-emerald-950 to-emerald-900 p-4 text-white">
                  <div className="flex items-center gap-2">
                    <Film className="h-4 w-4 text-[var(--gold)]" />
                    <h4 className="text-sm font-semibold">Generate Video</h4>
                  </div>
                  <p className="mt-1 text-[10px] text-white/70">
                    Render the exact WYSIWYG canvas frame-by-frame with transitions and audio layers.
                  </p>
                  <Button
                    className="mt-3 w-full bg-gradient-to-r from-[var(--gold)] to-amber-500 text-emerald-950 hover:from-amber-400 hover:to-amber-500"
                    size="sm"
                    onClick={() => {
                      if (slides.length === 0) {
                        toast.error("Load slides first in the left panel");
                        return;
                      }
                      setVideoDialogOpen(true);
                    }}
                  >
                    <FileVideo className="mr-2 h-3.5 w-3.5" /> Generate Video
                  </Button>
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </aside>
      </div>

      {/* Video Generation Dialog */}
      <VideoGenDialog
        open={videoDialogOpen}
        onClose={() => setVideoDialogOpen(false)}
        slides={slides}
        surahName={currentSurah?.englishName ?? "Quran"}
        customAudioUrl={customAudioUrl}
        background={(() => {
          if (bgId.startsWith("v_") || bgId === "__video_upload__") {
            return {
              type: "video" as const,
              videoUrl: bgId === "__video_upload__" ? uploadedBgUrl || "" : currentVideo?.url || "",
              opacity: bgOpacity
            };
          }
          if (bgId === "__custom_grad__") {
            return {
              type: "gradient" as const,
              cssValue: `linear-gradient(${customGradientAngle}deg, ${customGradientStart}, ${customGradientEnd})`,
              opacity: bgOpacity
            };
          }
          if (bgId === "__ai__" && aiBgUrl) {
            return { type: "image" as const, imageUrl: aiBgUrl, opacity: bgOpacity };
          }
          if (bgId === "__upload__" && uploadedBgUrl) {
            return { type: "image" as const, imageUrl: uploadedBgUrl, opacity: bgOpacity };
          }
          if (bgId.startsWith("__grad_")) {
            const gradId = bgId.replace("__grad_", "").replace("__", "");
            const grad = GRADIENTS.find((g) => g.id === gradId);
            return { type: "gradient" as const, cssValue: grad?.css ?? GRADIENTS[0].css, opacity: bgOpacity };
          }
          if (bgId.startsWith("__color_")) {
            const color = bgId.slice("__color_".length, -2);
            return { type: "color" as const, cssValue: color, opacity: bgOpacity };
          }
          const preset = PRESET_BACKGROUNDS.find((b) => b.id === bgId) ?? PRESET_BACKGROUNDS[0];
          return { type: "preset" as const, cssValue: preset.css, opacity: bgOpacity };
        })()}
        textColor={textColor}
        textShadow={textShadow}
        textSize={arabicTextSize}
        showTranslation={showTranslation}
        aspectRatio={aspectRatio}
        arabicFont={arabicFontFamily}
        translationFont={translationFontFamily}
        overlayText={customOverlayText}
        overlayTextColor={customOverlayTextColor}
        overlayTextSize={customOverlayTextSize}
        overlayTextPosition={customOverlayTextPosition}
        elements={elements}
        backgroundEffect={backgroundEffect}
        textEntranceEffect={textEntranceEffect}
        transitionEffect={transitionEffect}
        showAudioVisualizer={showAudioVisualizer}
        showHighlight={showHighlight}
        arabicYOffset={arabicYOffset}
        translationYOffset={translationYOffset}
        showArabic={showArabic}
        highlightColor={highlightColor}
        highlightGradientStart={highlightType === "gradient" ? highlightGradientStart : undefined}
        highlightGradientEnd={highlightType === "gradient" ? highlightGradientEnd : undefined}
        highlightGlowColor={highlightGlowColor}
      />
    </motion.div>
  );
}
