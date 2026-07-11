"use client";

import { motion } from "framer-motion";
import {
  Type,
  ImageIcon,
  Sparkles,
  Mic2,
  Languages,
  Palette,
  Film,
  Cloud,
  Smartphone,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Feature {
  icon: React.ElementType;
  isNew?: boolean;
  title: string;
  desc: string;
  accent: "gold" | "emerald";
}

const FEATURES: Feature[] = [
  {
    icon: Type,
    isNew: true,
    title: "Word-by-Word Video",
    desc: "Preview each Arabic word lighting up in sync with recitation, then export full MP4 videos with per-word highlights — in your browser or on our cloud servers.",
    accent: "gold",
  },
  {
    icon: ImageIcon,
    isNew: true,
    title: "AI Background Images",
    desc: "Describe any scene — mosque at sunset, desert, nature — and AI generates a unique background for your video. Saved automatically under Background → AI Generated.",
    accent: "emerald",
  },
  {
    icon: Sparkles,
    isNew: true,
    title: "Create with AI",
    desc: "Describe your vision and let AI suggest surah, reciter, format, colors, and layout — then fine-tune everything in the editor.",
    accent: "gold",
  },
  {
    icon: Mic2,
    title: "42 Reciters + Custom Upload",
    desc: "Choose from 42 renowned reciters or upload your own audio and mark each ayah timing manually — perfect for personal recordings.",
    accent: "emerald",
  },
  {
    icon: Languages,
    isNew: true,
    title: "22 Language Translations",
    desc: "English, Urdu, French, Spanish, Indonesian, Turkish, Russian, Bengali, Malay, Chinese, Portuguese, and 11 more — newly expanded from 10 languages.",
    accent: "gold",
  },
  {
    icon: Palette,
    title: "Design Like a Pro",
    desc: "Drag-and-drop editor with custom backgrounds, gradients, text effects, shadows, and position control. Design one ayah, apply to all.",
    accent: "emerald",
  },
  {
    icon: Film,
    title: "SD to 4K Export",
    desc: "Export MP4 videos from SD through 4K — free in your browser, up to 4K on cloud. Also PNG, JPEG, audio ZIP, SRT subtitles, and transparent MOV/WebM.",
    accent: "gold",
  },
  {
    icon: Cloud,
    title: "Cloud Video Rendering",
    desc: "Queue long or high-quality renders on our servers while you keep working. Supporters get monthly cloud credits; browser rendering stays free for everyone.",
    accent: "emerald",
  },
  {
    icon: Smartphone,
    isBeta: undefined,
    title: "Mobile Quick Create",
    desc: "Mobile beta — streamlined phone workflow with live preview and one-tap placement. The complete editor with word-by-word, AI, and all tools is on desktop.",
    accent: "gold",
  } as Feature,
];

export function Features() {
  return (
    <section
      id="features"
      className="relative overflow-hidden bg-gradient-to-b from-background via-[var(--cream)] to-background py-20 sm:py-28"
    >
      {/* Decorative */}
      <div className="pointer-events-none absolute right-0 top-20 h-72 w-72 rounded-full bg-[var(--gold)]/10 blur-3xl" />
      <div className="pointer-events-none absolute left-0 bottom-20 h-72 w-72 rounded-full bg-emerald-700/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">
          <motion.span
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block rounded-full border border-emerald-700/30 bg-emerald-700/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-emerald-800 dark:text-[var(--gold)]"
          >
            Powerful Features
          </motion.span>

          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.05 }}
            className="mt-5 text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl"
          >
            The Most Powerful Online
            <br className="hidden sm:block" />
            <span className="text-gold-gradient bg-gradient-to-r from-[var(--gold)] via-amber-500 to-emerald-700 bg-clip-text text-transparent">
              {" "}Quran Video Creator
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mt-5 text-base text-muted-foreground sm:text-lg"
          >
            No downloads, no installation — everything runs in your browser.
            Design, customize, and generate complete Quran videos with audio,
            all in one place.
          </motion.p>
        </div>

        {/* Features grid */}
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => {
            const accentColor =
              f.accent === "gold" ? "var(--gold)" : "var(--emerald-deep)";
            return (
              <motion.article
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (i % 3) * 0.08 }}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl"
              >
                {/* Decorative corner */}
                <div
                  className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100"
                  style={{
                    background:
                      f.accent === "gold"
                        ? "radial-gradient(circle, oklch(0.82 0.15 85 / 0.25), transparent 70%)"
                        : "radial-gradient(circle, oklch(0.45 0.13 160 / 0.2), transparent 70%)",
                  }}
                />

                <div className="relative flex items-start justify-between">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-xl ring-1 transition-transform group-hover:scale-110"
                    style={{
                      background:
                        f.accent === "gold"
                          ? "linear-gradient(135deg, oklch(0.92 0.08 90 / 0.6), oklch(0.78 0.15 85 / 0.15))"
                          : "linear-gradient(135deg, oklch(0.95 0.02 95 / 0.6), oklch(0.45 0.13 160 / 0.1))",
                      color: accentColor,
                      // @ts-ignore custom property is fine
                      "--tw-ring-color":
                        f.accent === "gold"
                          ? "oklch(0.78 0.15 85 / 0.25)"
                          : "oklch(0.45 0.13 160 / 0.2)",
                    }}
                  >
                    <f.icon className="h-5 w-5" strokeWidth={2.2} />
                  </div>

                  {f.isNew && (
                    <Badge
                      variant="outline"
                      className="border-[var(--gold)]/40 bg-[var(--gold-soft)]/60 text-[10px] font-semibold uppercase tracking-wider text-emerald-900"
                    >
                      New
                    </Badge>
                  )}
                </div>

                <h3 className="relative mt-5 text-lg font-semibold text-foreground">
                  {f.title}
                </h3>
                <p className="relative mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {f.desc}
                </p>

                {/* Bottom accent line */}
                <span
                  className="absolute inset-x-6 bottom-0 h-0.5 origin-left scale-x-0 rounded-full transition-transform duration-300 group-hover:scale-x-100"
                  style={{
                    background:
                      f.accent === "gold"
                        ? "linear-gradient(to right, var(--gold), transparent)"
                        : "linear-gradient(to right, var(--emerald-deep), transparent)",
                  }}
                />
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
