"use client";

import { motion } from "framer-motion";
import { Sparkles, Play, ArrowRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const FLOATING_WORDS = [
  { text: "اهْدِنَا", delay: 0 },
  { text: "الصِّرَاطَ", delay: 0.4 },
  { text: "الْمُسْتَقِيمَ", delay: 0.8 },
];

const STATS = [
  { value: "42", label: "Reciters" },
  { value: "22", label: "Translations" },
  { value: "114", label: "Surahs" },
  { value: "0", label: "Downloads" },
];

export function Hero({ onStart }: { onStart: () => void }) {
  return (
    <section
      id="top"
      className="relative overflow-hidden bg-gradient-to-b from-[var(--cream)] via-[var(--cream)] to-background pattern-islamic"
    >
      {/* Decorative blurs */}
      <div className="pointer-events-none absolute -left-32 top-10 h-96 w-96 rounded-full bg-emerald-600/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 top-40 h-96 w-96 rounded-full bg-[var(--gold)]/15 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/2 h-72 w-[800px] -translate-x-1/2 rounded-full bg-emerald-700/10 blur-3xl" />

      {/* Decorative islamic arches */}
      <svg
        className="pointer-events-none absolute inset-x-0 top-16 mx-auto hidden h-[440px] w-[440px] text-emerald-800/5 lg:block"
        viewBox="0 0 200 200"
        fill="currentColor"
        aria-hidden
      >
        <path d="M100 20 L180 100 L100 180 L20 100 Z" />
      </svg>

      <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-12 sm:px-6 lg:px-8 lg:pt-20">
        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_1fr]">
          {/* Left copy */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center lg:text-left"
          >
            <Badge
              variant="outline"
              className="mb-5 gap-1.5 border-[var(--gold)]/40 bg-[var(--gold-soft)]/40 px-3 py-1.5 text-xs font-medium text-emerald-900"
            >
              <Sparkles className="h-3.5 w-3.5 text-[var(--gold)]" />
              New — AI-generated background images
            </Badge>

            <h1 className="text-balance text-4xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Create Quran Videos
              <br />
              for{" "}
              <span className="text-gold-gradient bg-gradient-to-r from-[var(--gold)] via-amber-500 to-emerald-700 bg-clip-text text-transparent">
                Social Media
              </span>
            </h1>

            <p className="mt-5 text-pretty text-base text-muted-foreground sm:text-lg lg:mx-0 mx-auto max-w-xl">
              Free online video maker — describe a scene and AI creates your
              background, then sync word-by-word recitation and export MP4
              right in your browser. No downloads, no registration.
            </p>

            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:justify-start justify-center">
              <Button
                onClick={onStart}
                size="lg"
                className="group h-12 w-full bg-gradient-to-r from-emerald-700 to-emerald-800 px-7 text-white shadow-lg shadow-emerald-700/20 hover:from-emerald-800 hover:to-emerald-900 hover:shadow-emerald-700/30 sm:w-auto"
              >
                <Play className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
                Launch Editor
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
              <a
                href="#features"
                className="inline-flex h-12 w-full items-center justify-center rounded-lg border border-border bg-background/60 px-6 text-sm font-medium text-foreground backdrop-blur hover:bg-accent/40 sm:w-auto"
              >
                See Features
              </a>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground lg:justify-start">
              <span className="inline-flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                Free to use
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                No registration
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-700" />
                No downloads
              </span>
            </div>
          </motion.div>

          {/* Right preview card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative mx-auto w-full max-w-md lg:max-w-none"
          >
            <div className="relative">
              {/* Outer glow */}
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-tr from-emerald-700/20 via-[var(--gold)]/20 to-emerald-700/20 blur-xl" />

              {/* Preview card */}
              <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-950 shadow-2xl">
                {/* Top bar */}
                <div className="flex items-center justify-between border-b border-white/10 bg-black/20 px-4 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
                  </div>
                  <span className="text-[11px] font-medium text-white/60">
                    Surah Al-Fātiḥah · Ayah 6 · Word-by-word
                  </span>
                  <span className="text-[10px] font-semibold text-[var(--gold)]">
                    ● REC
                  </span>
                </div>

                {/* Preview area */}
                <div className="relative aspect-video bg-gradient-to-br from-[#0a2e22] via-[#0b3a2a] to-[#061d16] px-6 py-8">
                  {/* Background pattern */}
                  <div
                    className="pointer-events-none absolute inset-0 opacity-15"
                    style={{
                      backgroundImage:
                        "radial-gradient(circle at 25% 30%, rgba(212,160,23,0.4) 0%, transparent 40%), radial-gradient(circle at 75% 70%, rgba(16,82,60,0.6) 0%, transparent 50%)",
                    }}
                  />

                  {/* Light beams */}
                  <div className="pointer-events-none absolute -top-10 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-[var(--gold)]/20 blur-3xl" />

                  <div className="relative flex h-full flex-col items-center justify-center text-center">
                    <span className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--gold)]/80">
                      Show us the straight path
                    </span>
                    <div
                      className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-3xl font-bold text-white sm:text-4xl"
                      style={{ direction: "rtl" }}
                    >
                      {FLOATING_WORDS.map((w, i) => (
                        <motion.span
                          key={i}
                          initial={{ opacity: 0.3, y: 4 }}
                          animate={{
                            opacity: [0.3, 1, 1, 0.6],
                            y: [4, 0, 0, 2],
                            color: ["#ffffff", "#d4a017", "#ffffff", "#ffffff"],
                          }}
                          transition={{
                            duration: 3.6,
                            repeat: Infinity,
                            delay: w.delay,
                            ease: "easeInOut",
                          }}
                          className="font-quran"
                          style={{ fontFamily: "var(--font-quran)" }}
                        >
                          {w.text}
                        </motion.span>
                      ))}
                    </div>

                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                      className="mt-5 h-0.5 w-32 origin-left rounded-full bg-gradient-to-r from-[var(--gold)] via-amber-400 to-transparent"
                    />

                    <span className="mt-3 text-[10px] text-white/50">
                      اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ
                    </span>
                  </div>

                  {/* Bottom toolbar */}
                  <div className="absolute inset-x-3 bottom-3 flex items-center justify-between rounded-xl border border-white/10 bg-black/40 px-3 py-1.5 backdrop-blur">
                    <div className="flex items-center gap-2 text-[10px] text-white/70">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--gold)]/30 text-[var(--gold)]">
                        ▶
                      </span>
                      00:02 / 00:04
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] text-white/80">
                        HD
                      </span>
                      <span className="rounded bg-emerald-500/30 px-1.5 py-0.5 text-[9px] text-emerald-200">
                        AI BG
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer chips */}
                <div className="grid grid-cols-3 gap-px bg-white/10 text-center">
                  {[
                    { label: "Reciter", value: "Alafasy" },
                    { label: "Translation", value: "Sahih" },
                    { label: "Export", value: "MP4 4K" },
                  ].map((c) => (
                    <div
                      key={c.label}
                      className="bg-emerald-950/80 px-2 py-2.5"
                    >
                      <div className="text-[9px] uppercase tracking-wider text-white/40">
                        {c.label}
                      </div>
                      <div className="mt-0.5 text-xs font-semibold text-white">
                        {c.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Floating stat card */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 }}
                className="absolute -left-4 -top-4 hidden rounded-2xl border border-border bg-background/90 px-3 py-2 shadow-xl backdrop-blur sm:block"
              >
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/15">
                    <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground">
                      Cloud videos
                    </div>
                    <div className="text-xs font-bold text-foreground">
                      4K · No watermark
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1 }}
                className="absolute -bottom-5 -right-4 hidden rounded-2xl border border-border bg-background/90 px-3 py-2 shadow-xl backdrop-blur sm:block"
              >
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/15">
                    <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground">
                      AI Background
                    </div>
                    <div className="text-xs font-bold text-foreground">
                      Mosque at sunset
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Stats strip */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-16 grid grid-cols-2 gap-4 rounded-2xl border border-border/60 bg-background/60 p-6 backdrop-blur sm:grid-cols-4 sm:gap-2"
        >
          {STATS.map((s, i) => (
            <div
              key={s.label}
              className={`text-center ${
                i < STATS.length - 1 ? "sm:border-r sm:border-border/60" : ""
              }`}
            >
              <div className="text-3xl font-bold text-foreground sm:text-4xl">
                {s.value}
              </div>
              <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
                {s.label}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
