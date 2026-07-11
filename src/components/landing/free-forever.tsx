"use client";

import { motion } from "framer-motion";
import { Check, Heart, Cloud, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

const INCLUDED = [
  "Using the app is still 100% free",
  "Unlimited browser MP4 video generation",
  "42 reciters + upload your own audio",
  "22 translations & word-by-word video",
  "AI-generated background images",
  "PNG, JPEG, WebP, audio ZIP & SRT exports",
  "Drag-and-drop editor & cloud project save",
];

const DONATION_FOR = [
  "Donations are not a paywall — they help us pay for cloud video rendering servers (CPU, storage, and bandwidth).",
  "When you donate, you unlock optional perks like faster cloud renders, higher quality (up to 4K), no watermark, and more ayahs per video.",
  "You never need to pay to create Quran videos in your browser.",
];

export function FreeForever() {
  return (
    <section className="relative overflow-hidden bg-background py-20 sm:py-28">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--gold)]/40 to-transparent" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
          {/* Left: What's included */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-700/30 bg-emerald-700/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-emerald-800 dark:text-[var(--gold)]">
              <Heart className="h-3 w-3" />
              Free Forever — Donations Open
            </div>

            <h2 className="mt-5 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Quran Studio is completely free.
              <br />
              <span className="text-gold-gradient bg-gradient-to-r from-[var(--gold)] to-emerald-700 bg-clip-text text-transparent">
                Supporter subscriptions
              </span>{" "}
              include monthly cloud videos.
            </h2>

            <p className="mt-4 text-base text-muted-foreground">
              Pay-as-you-go credits (never expire) unlock with a subscription
              and are used only after your monthly quota runs out. Using the app
              is still 100% free for everyone.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {INCLUDED.map((item, i) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0, x: -8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-start gap-3 rounded-xl border border-border bg-card p-3 shadow-sm"
                >
                  <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-700/15">
                    <Check className="h-3 w-3 text-emerald-700 dark:text-[var(--gold)]" strokeWidth={3} />
                  </div>
                  <span className="text-sm font-medium text-foreground">{item}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right: What donations are for */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="relative"
          >
            <div className="sticky top-24 overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-950 p-8 text-white shadow-xl">
              {/* Decorative pattern */}
              <div
                className="pointer-events-none absolute inset-0 opacity-10"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 20% 20%, oklch(0.82 0.15 85) 0%, transparent 30%), radial-gradient(circle at 80% 60%, oklch(0.55 0.13 162) 0%, transparent 35%)",
                }}
              />

              <div className="relative">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--gold)]/20 text-[var(--gold)]">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">What donations are for</h3>
                    <p className="text-xs text-white/60">
                      Total transparency — no paywalls, no hidden tiers.
                    </p>
                  </div>
                </div>

                <ul className="mt-6 space-y-4">
                  {DONATION_FOR.map((p, i) => (
                    <li key={i} className="flex gap-3">
                      <Cloud className="mt-0.5 h-4 w-4 shrink-0 text-[var(--gold)]" />
                      <span className="text-sm leading-relaxed text-white/85">
                        {p}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="mt-7 rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="text-[10px] uppercase tracking-wider text-white/50">
                    Promise
                  </div>
                  <p className="mt-1 text-sm font-medium text-white">
                    Every tier is a one-time contribution for the period shown —
                    no auto-renewal surprises, no subscription traps.
                  </p>
                </div>

                <Button
                  className="mt-6 w-full bg-gradient-to-r from-[var(--gold)] to-amber-500 text-emerald-950 hover:from-amber-400 hover:to-amber-500"
                  size="lg"
                >
                  <Heart className="mr-2 h-4 w-4" />
                  Donate in Editor
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
