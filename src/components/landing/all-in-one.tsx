"use client";

import { motion } from "framer-motion";
import {
  AudioLines,
  Languages,
  Sparkles,
  Film,
  Download,
  Layers,
} from "lucide-react";

const PILLARS = [
  {
    icon: AudioLines,
    title: "Sync Audio & Text",
    desc: "Word-by-word timing automatically aligned with the reciter's audio.",
  },
  {
    icon: Languages,
    title: "22 Translations",
    desc: "Multi-language support — English, Urdu, French, Spanish, Indonesian, and more.",
  },
  {
    icon: Sparkles,
    title: "AI Backgrounds",
    desc: "Describe any scene — mosque at sunset, desert, nature — and AI generates it.",
  },
  {
    icon: Film,
    title: "Export HD Video",
    desc: "MP4, PNG, SRT subtitles — export up to 4K from your browser or our cloud.",
  },
  {
    icon: Download,
    title: "Easy Download",
    desc: "One-click export — no watermarks on browser exports, ever.",
  },
  {
    icon: Layers,
    title: "Design Like a Pro",
    desc: "Drag-and-drop editor with custom backgrounds, gradients, text effects, and shadows.",
  },
];

export function AllInOne() {
  return (
    <section className="relative bg-background py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="mx-auto max-w-3xl text-center">
          <motion.span
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block rounded-full border border-[var(--gold)]/30 bg-[var(--gold-soft)]/40 px-3 py-1 text-xs font-medium uppercase tracking-wider text-emerald-900"
          >
            All-in-One Editor
          </motion.span>

          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.05 }}
            className="mt-5 text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl"
          >
            All-in-One Quran Video Editor
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mt-5 text-base text-muted-foreground sm:text-lg"
          >
            Load surahs, pick reciters, chat with AI, sync word-by-word audio,
            and export — everything in one place. Built for creators who want
            professional results without leaving the browser.
          </motion.p>

          {/* Pill badges */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
            className="mt-7 flex flex-wrap justify-center gap-2"
          >
            {["42 reciters", "Word-by-word auto sync", "AI backgrounds", "Export up to 4K", "YouTube · TikTok · Instagram"].map(
              (pill) => (
                <span
                  key={pill}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground shadow-sm"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                  {pill}
                </span>
              )
            )}
          </motion.div>
        </div>

        {/* Pillars grid */}
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {PILLARS.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg hover:border-[var(--gold)]/40"
            >
              <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-[var(--gold)]/10 to-emerald-700/10 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100" />

              <div className="relative">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-700/10 to-emerald-900/10 text-emerald-700 ring-1 ring-emerald-700/15 transition-transform group-hover:scale-110 dark:from-[var(--gold)]/15 dark:to-[var(--gold)]/5 dark:text-[var(--gold)] dark:ring-[var(--gold)]/20">
                  <p.icon className="h-5 w-5" strokeWidth={2.2} />
                </div>

                <h3 className="mt-4 text-lg font-semibold text-foreground">
                  {p.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {p.desc}
                </p>
              </div>

              {/* Bottom accent */}
              <span className="absolute inset-x-6 bottom-0 h-0.5 origin-left scale-x-0 rounded-full bg-gradient-to-r from-[var(--gold)] to-emerald-700 transition-transform duration-300 group-hover:scale-x-100" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
