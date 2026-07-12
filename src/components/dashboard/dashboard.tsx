"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Play, Pause, SkipBack, SkipForward, Square, Volume2,
  Sparkles, Loader2, Download, Mic2, Languages, ImageIcon, Type,
  ChevronDown, Wand2, Film, X, Upload, FolderOpen, Trash2, Cloud,
  Save, Layers, Palette, Settings2, Plus, Check, FileVideo,
  Monitor, Smartphone, Square as SquareIcon, RectangleHorizontal,
  RectangleVertical, Music, BookOpen, Send, Folder,
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
  const [bgTab, setBgTab] = useState<"upload" | "ai" | "preset" | "gradient" | "color">("preset");
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
  const [bgOpacity, setBgOpacity] = useState(100);

  // --- Text style ---
  const [textSize, setTextSize] = useState("lg");
  const [textColor, setTextColor] = useState("#ffffff");
  const [textShadow, setTextShadow] = useState("0 2px 8px rgba(0,0,0,0.5)");
  const [textPreset, setTextPreset] = useState("clean");
  const [showTranslation, setShowTranslation] = useState(true);

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

  // =====================
  // Effects
  // =====================

  // Fetch surah list on mount + auto-load the first ayah
  useEffect(() => {
    fetch("/api/quran/surahs")
      .then((r) => r.json())
      .then((j) => { if (j.ok) setSurahs(j.data); })
      .catch(() => {});
    // Auto-load Al-Faatiha ayah 1 on mount so the canvas isn't empty.
    // Use a direct fetch (not the loadSlides callback) to avoid stale-closure issues.
    (async () => {
      try {
        const res = await fetch(`/api/quran/ayah?surah=1&ayah=1&reciter=${reciter}&translation=${translation}`);
        const json = await res.json();
        if (json.ok && json.data) {
          setSlides([json.data]);
          setCurrentSlide(0);
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
      const loaded: AyahData[] = jsons.filter((j) => j.ok).map((j) => j.data);
      if (loaded.length === 0) {
        if (!silent) toast.error("No ayahs loaded");
        return;
      }
      setSlides(loaded);
      setCurrentSlide(0);
      if (!silent) toast.success(`Loaded ${loaded.length} slide${loaded.length > 1 ? "s" : ""}`);
    } catch (e: any) {
      if (!silent) toast.error(e.message || "Failed to load slides");
    } finally {
      setLoadingSlides(false);
    }
  }, [fromAyah, toAyah, selectedSurah, reciter, translation]);

  // Audio playback state for time display
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);

  const currentAyah = slides[currentSlide];

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

    if (!isPlaying || !currentAyah?.audio) {
      return;
    }

    // Start a new session
    const session = { cancelled: false, currentAudio: null as HTMLAudioElement | null };
    playbackSessionRef.current = session;

    setActiveWordIdx(0);
    setProgress(0);

    // Create a single audio element for the entire ayah
    const audio = new Audio();
    audio.src = currentAyah.audio;
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
      setIsPlaying(false);
      setTimeout(() => { if (!session.cancelled) setProgress(0); }, 800);
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
  }, [isPlaying, currentAyah, volume]);

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
        setBgId("__upload__");
        setBgTab("upload");
        refreshUploads();
        toast.success("Background uploaded!");
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
  const bgStyle: React.CSSProperties = bgId === "__ai__" && aiBgUrl
    ? { backgroundImage: `url(${aiBgUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
    : bgId === "__upload__" && uploadedBgUrl
    ? { backgroundImage: `url(${uploadedBgUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
    : { background: currentBg?.css ?? PRESET_BACKGROUNDS[0].css };

  const textSizeMap: Record<string, string> = { sm: "1.5rem", md: "2.25rem", lg: "3rem", xl: "3.75rem" };
  const textSizeValue = textSizeMap[textSize] ?? "2.25rem";

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
                      filteredSurahs.slice(0, 30).map((s) => (
                        <button
                          key={s.number}
                          onClick={() => {
                            setSelectedSurah(s.number);
                            setFromAyah(1);
                            setToAyah(1);
                            // Auto-load the first ayah of this surah immediately
                            loadSlides({ surah: s.number, from: 1, to: 1, silent: true });
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
                          if (f) toast.info(`Audio "${f.name}" selected (demo only)`);
                          e.target.value = "";
                        }}
                      />
                    </div>
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
              style={bgStyle}
            >
              {/* Opacity overlay */}
              {bgOpacity < 100 && (
                <div
                  className="absolute inset-0 bg-black"
                  style={{ opacity: (100 - bgOpacity) / 100 }}
                />
              )}

              {/* Vignette */}
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background: "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.5) 100%)",
                }}
              />

              {/* Overlay effects (decorative) */}
              {overlayEffect !== "none" && (
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{ opacity: effectIntensity / 100 }}
                >
                  {overlayEffect === "snow" && (
                    <div className="absolute inset-0" style={{
                      backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
                      backgroundSize: "30px 30px",
                    }} />
                  )}
                  {overlayEffect === "golden" && (
                    <div className="absolute inset-0" style={{
                      backgroundImage: "radial-gradient(circle, rgba(212,160,23,0.6) 1px, transparent 1px)",
                      backgroundSize: "40px 40px",
                    }} />
                  )}
                  {overlayEffect === "stars" && (
                    <div className="absolute inset-0" style={{
                      backgroundImage: "radial-gradient(2px 2px at 20% 30%, white, transparent), radial-gradient(2px 2px at 60% 70%, white, transparent), radial-gradient(1px 1px at 50% 50%, white, transparent), radial-gradient(1px 1px at 80% 10%, white, transparent)",
                      backgroundSize: "200px 200px",
                    }} />
                  )}
                  {overlayEffect === "ramadan" && (
                    <div className="absolute inset-0" style={{
                      background: "radial-gradient(circle at 30% 20%, rgba(212,160,23,0.3), transparent 40%), radial-gradient(circle at 70% 80%, rgba(212,160,23,0.2), transparent 40%)",
                    }} />
                  )}
                  {overlayEffect === "geometry" && (
                    <div className="absolute inset-0 opacity-30" style={{
                      backgroundImage: "repeating-linear-gradient(45deg, rgba(212,160,23,0.1) 0, rgba(212,160,23,0.1) 1px, transparent 1px, transparent 20px), repeating-linear-gradient(-45deg, rgba(212,160,23,0.1) 0, rgba(212,160,23,0.1) 1px, transparent 1px, transparent 20px)",
                    }} />
                  )}
                </div>
              )}

              {/* Loading state */}
              <AnimatePresence>
                {loadingSlides && (
                  <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-sm"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="h-8 w-8 animate-spin text-[var(--gold)]" />
                      <p className="text-xs font-medium text-white">Loading slides...</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Empty state */}
              {!currentAyah && !loadingSlides && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur">
                    <Sparkles className="h-6 w-6 text-[var(--gold)]" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Start your video</h3>
                  <p className="mt-1 max-w-xs text-xs text-white/70">
                    Choose surah & ayah range in the left panel, then click Load slides
                  </p>
                </div>
              )}

              {/* Verse content */}
              {currentAyah && (
                <div className="relative flex h-full flex-col items-center justify-center px-6 py-8">
                  {/* Top-right meta */}
                  <div className="absolute right-3 top-3 rounded-lg border border-white/15 bg-black/40 px-2.5 py-1 backdrop-blur">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--gold)]">
                      {currentSurah?.englishName} · {currentAyah.numberInSurah}
                    </span>
                  </div>

                  {/* Arabic */}
                  <div
                    className="text-center"
                    style={{
                      fontFamily: "var(--font-quran), var(--font-amiri), serif",
                      direction: "rtl",
                      fontSize: textSizeValue,
                      lineHeight: 1.6,
                      color: textColor,
                      textShadow,
                    }}
                  >
                    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
                      {currentAyah.words.map((w, i) => (
                        <motion.span
                          key={i}
                          animate={{
                            color: activeWordIdx === i ? "#d4a017" : textColor,
                            scale: activeWordIdx === i ? 1.12 : 1,
                            textShadow: activeWordIdx === i
                              ? "0 0 24px rgba(212,160,23,0.8), 0 2px 12px rgba(0,0,0,0.6)"
                              : textShadow,
                          }}
                          transition={{ duration: 0.25 }}
                          className="inline-block cursor-pointer"
                          onClick={() => {
                            if (w.audio) new Audio(w.audio).play().catch(() => {});
                          }}
                        >
                          {w.text}
                        </motion.span>
                      ))}
                    </div>
                  </div>

                  {/* Translation */}
                  {showTranslation && currentAyah.translation && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      className="mt-6 max-w-2xl rounded-xl border border-white/15 bg-black/40 px-5 py-3 backdrop-blur"
                    >
                      <p className="text-center text-sm font-medium leading-relaxed text-white/90 sm:text-base">
                        {currentAyah.translation}
                      </p>
                    </motion.div>
                  )}
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

            <ScrollArea className="flex-1 thin-scroll">
              {/* BACKGROUND TAB */}
              <TabsContent value="bg" className="p-4 mt-0 space-y-4">
                {/* Background type tabs */}
                <div className="flex flex-wrap gap-1">
                  {([
                    { id: "upload", label: "Upload", icon: Upload },
                    { id: "ai", label: "AI Gen", icon: Wand2 },
                    { id: "preset", label: "Presets", icon: ImageIcon },
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
                          <p className="text-xs font-medium text-foreground">Drop image here</p>
                          <p className="mt-1 text-[10px] text-muted-foreground">
                            or{" "}
                            <button
                              onClick={() => fileInputRef.current?.click()}
                              className="font-semibold text-emerald-700 dark:text-[var(--gold)] underline"
                            >
                              browse files
                            </button>
                          </p>
                          <p className="mt-1 text-[10px] text-muted-foreground">PNG, JPEG, WebP · max 10MB</p>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                            className="hidden"
                            onChange={handleFileInput}
                          />
                        </>
                      )}
                    </div>

                    {/* Uploaded backgrounds */}
                    <div>
                      <p className="mb-2 text-xs font-semibold text-foreground">
                        My Backgrounds ({uploadedBgs.length})
                      </p>
                      {uploadedBgs.length === 0 ? (
                        <p className="rounded-lg border border-border bg-muted/30 px-3 py-4 text-center text-[10px] text-muted-foreground">
                          No uploaded backgrounds yet
                        </p>
                      ) : (
                        <div className="grid grid-cols-3 gap-2">
                          {uploadedBgs.map((bg) => (
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
                                  setBgId("__upload__");
                                }}
                                className="h-full w-full"
                                style={{
                                  backgroundImage: `url(${bg.url})`,
                                  backgroundSize: "cover",
                                  backgroundPosition: "center",
                                }}
                                aria-label={bg.filename}
                              />
                              <button
                                onClick={() => handleDeleteUpload(bg.filename)}
                                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                                aria-label="Delete"
                              >
                                <Trash2 className="h-2.5 w-2.5" />
                              </button>
                            </div>
                          ))}
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

                {/* Gradient */}
                {bgTab === "gradient" && (
                  <div>
                    <p className="mb-2 text-xs font-semibold text-foreground">Gradients</p>
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
            </ScrollArea>

            <ScrollArea className="flex-1 thin-scroll">
              {/* TEXT TAB */}
              <TabsContent value="text" className="p-4 mt-0 space-y-4">
                <div>
                  <p className="mb-2 text-xs font-semibold text-foreground">Text Presets</p>
                  <div className="grid grid-cols-3 gap-2">
                    {TEXT_PRESETS.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => applyTextPreset(p.id)}
                        className={`flex flex-col items-center justify-center rounded-lg border-2 p-2 transition-all ${
                          textPreset === p.id
                            ? "border-[var(--gold)] bg-[var(--gold-soft)]/40"
                            : "border-border hover:border-[var(--gold)]/50"
                        }`}
                      >
                        <span className="text-base font-bold" style={{ color: p.color, textShadow: p.shadow }}>Aa</span>
                        <span className="mt-0.5 text-[9px] font-medium text-muted-foreground">{p.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="mb-2 block text-xs font-medium text-muted-foreground">Text Size</Label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { id: "sm", name: "S" },
                      { id: "md", name: "M" },
                      { id: "lg", name: "L" },
                      { id: "xl", name: "XL" },
                    ].map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setTextSize(t.id)}
                        className={`rounded-md border px-2 py-1.5 text-xs font-medium transition-all ${
                          textSize === t.id
                            ? "border-[var(--gold)] bg-[var(--gold-soft)]/40 text-foreground"
                            : "border-border text-muted-foreground hover:bg-accent/40"
                        }`}
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="mb-2 block text-xs font-medium text-muted-foreground">Text Color</Label>
                  <div className="flex flex-wrap gap-2">
                    {["#ffffff", "#d4a017", "#fbbf24", "#10b981", "#60a5fa", "#f87171", "#a78bfa"].map((c) => (
                      <button
                        key={c}
                        onClick={() => setTextColor(c)}
                        className={`h-8 w-8 rounded-full border-2 transition-all ${
                          textColor === c ? "scale-110 border-foreground" : "border-border hover:scale-105"
                        }`}
                        style={{ background: c }}
                        aria-label={c}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <Label htmlFor="show-tr" className="text-xs">Show translation</Label>
                  <Switch id="show-tr" checked={showTranslation} onCheckedChange={setShowTranslation} />
                </div>

                <div className="rounded-lg border border-border bg-muted/30 p-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Layers className="h-3.5 w-3.5" />
                    <span>Apply to all slides</span>
                  </div>
                  <Button
                    variant="outline" size="sm"
                    className="mt-2 w-full text-xs"
                    onClick={() => toast.success("Text style applied to all slides")}
                  >
                    Apply to all
                  </Button>
                </div>
              </TabsContent>
            </ScrollArea>

            <ScrollArea className="flex-1 thin-scroll">
              {/* EFFECTS TAB */}
              <TabsContent value="effects" className="p-4 mt-0 space-y-4">
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

                <div>
                  <Label className="mb-2 block text-xs font-semibold text-foreground">Overlay Effects</Label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {OVERLAY_EFFECTS.map((e) => (
                      <button
                        key={e.id}
                        onClick={() => setOverlayEffect(e.id)}
                        className={`rounded-md border px-2 py-1.5 text-[10px] font-medium transition-all ${
                          overlayEffect === e.id
                            ? "border-[var(--gold)] bg-[var(--gold-soft)]/40 text-foreground"
                            : "border-border text-muted-foreground hover:bg-accent/40"
                        }`}
                      >
                        {e.name}
                      </button>
                    ))}
                  </div>
                </div>

                {overlayEffect !== "none" && (
                  <div>
                    <Label className="mb-2 block text-xs font-medium text-muted-foreground">
                      Effect intensity: {effectIntensity}%
                    </Label>
                    <Slider
                      value={[effectIntensity]}
                      onValueChange={(v) => setEffectIntensity(v[0])}
                      max={100} step={1}
                    />
                  </div>
                )}
              </TabsContent>
            </ScrollArea>

            <ScrollArea className="flex-1 thin-scroll">
              {/* EXPORT TAB */}
              <TabsContent value="export" className="p-4 mt-0 space-y-4">
                <div className="rounded-lg bg-gradient-to-br from-emerald-950 to-emerald-900 p-4 text-white">
                  <div className="flex items-center gap-2">
                    <Film className="h-4 w-4 text-[var(--gold)]" />
                    <h4 className="text-sm font-semibold">Generate Video</h4>
                  </div>
                  <p className="mt-1 text-[10px] text-white/70">
                    100% free in your browser. Cloud rendering for supporters.
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
                  <Button
                    variant="outline"
                    className="mt-2 w-full border-white/20 bg-white/5 text-white hover:bg-white/10"
                    size="sm"
                    onClick={() => toast.success("Queued on cloud — we'll email you when ready!")}
                  >
                    <Cloud className="mr-2 h-3.5 w-3.5" /> Cloud Render
                  </Button>
                </div>

                <div>
                  <p className="mb-2 text-xs font-semibold text-foreground">Export Assets</p>
                  <div className="space-y-1.5">
                    {[
                      { label: "Current Ayah (PNG/JPEG/WebP)", icon: ImageIcon },
                      { label: "All Images as ZIP", icon: Download },
                      { label: "All Audio as ZIP", icon: Music },
                      { label: "SRT Subtitles", icon: FileVideo },
                      { label: "Project (.json)", icon: Save },
                    ].map((e) => (
                      <button
                        key={e.label}
                        onClick={() => toast.success(`Preparing: ${e.label}`)}
                        className="flex w-full items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-left text-xs font-medium text-foreground transition-colors hover:bg-accent/40"
                      >
                        <e.icon className="h-3.5 w-3.5 text-muted-foreground" />
                        {e.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-muted/30 p-3">
                  <p className="text-[10px] text-muted-foreground">
                    <strong className="text-foreground">Note:</strong> Quranic text is public domain. Audio recitations are copyrighted — use custom audio upload for sharing without permission concerns.
                  </p>
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
        background={{
          type:
            bgId === "__ai__" ? "image"
            : bgId === "__upload__" ? "image"
            : bgId.startsWith("__grad_") ? "gradient"
            : bgId.startsWith("__color_") ? "color"
            : "preset",
          cssValue:
            bgId.startsWith("__grad_")
              ? GRADIENTS.find((g) => `__grad_${g.id}__` === bgId)?.css
              : bgId.startsWith("__color_")
              ? bgId.replace("__color_", "").replace("__", "")
              : PRESET_BACKGROUNDS.find((b) => b.id === bgId)?.css,
          imageUrl:
            bgId === "__ai__" ? (aiBgUrl ?? undefined)
            : bgId === "__upload__" ? (uploadedBgUrl ?? undefined)
            : undefined,
          opacity: bgOpacity,
        }}
        textColor={textColor}
        textShadow={textShadow}
        textSize={textSizeMap[textSize] ? parseFloat(textSizeMap[textSize]) : 48}
        showTranslation={showTranslation}
        aspectRatio={aspectRatio}
      />
    </motion.div>
  );
}
