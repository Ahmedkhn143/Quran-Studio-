"use client";

import { motion } from "framer-motion";
import { Check, Star, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Plan {
  id: string;
  name: string;
  price: number;
  period: string;
  tagline: string;
  popular?: boolean;
  features: string[];
  accent: "emerald" | "gold" | "dark";
}

const PLANS: Plan[] = [
  {
    id: "supporter",
    name: "Supporter",
    price: 10,
    period: "month",
    tagline: "Donation to cover server video rendering costs",
    accent: "emerald",
    features: [
      "15 cloud videos per month",
      "Up to 15 ayahs per video",
      "No watermark on browser & cloud exports",
      "Cloud quality up to 720p, 1080p, 2K",
      "Word-by-word cloud video",
      "Email when your video is ready",
    ],
  },
  {
    id: "supporter-plus",
    name: "Supporter Plus",
    price: 15,
    period: "month",
    tagline: "More server videos and higher ayah limits",
    popular: true,
    accent: "gold",
    features: [
      "40 cloud videos per month",
      "Up to 25 ayahs per video",
      "No watermark on browser & cloud exports",
      "Cloud quality up to 720p, 1080p, 2K, 4K",
      "Word-by-word cloud video",
      "Email when your video is ready",
    ],
  },
  {
    id: "supporter-pro",
    name: "Supporter Pro",
    price: 20,
    period: "month",
    tagline: "Highest limits for frequent creators",
    accent: "dark",
    features: [
      "80 cloud videos per month",
      "Up to 30 ayahs per video",
      "No watermark on browser & cloud exports",
      "Cloud quality up to 720p, 1080p, 2K, 4K",
      "Word-by-word cloud video",
      "Email when your video is ready",
    ],
  },
];

const ACCENTS: Record<
  Plan["accent"],
  { gradient: string; ring: string; check: string; badge: string }
> = {
  emerald: {
    gradient: "from-emerald-700/5 to-emerald-900/5",
    ring: "ring-emerald-700/20",
    check: "text-emerald-700 dark:text-[var(--gold)]",
    badge: "bg-emerald-700/15 text-emerald-800 dark:text-[var(--gold)]",
  },
  gold: {
    gradient: "from-[var(--gold)]/10 to-amber-500/5",
    ring: "ring-[var(--gold)]/50",
    check: "text-[var(--gold)]",
    badge: "bg-[var(--gold-soft)]/60 text-emerald-900",
  },
  dark: {
    gradient: "from-emerald-950 to-emerald-900",
    ring: "ring-white/10",
    check: "text-[var(--gold)]",
    badge: "bg-white/10 text-white",
  },
};

export function Pricing() {
  return (
    <section
      id="pricing"
      className="relative overflow-hidden bg-gradient-to-b from-background to-[var(--cream)] py-20 sm:py-28"
    >
      <div className="pointer-events-none absolute left-1/2 top-10 h-72 w-[700px] -translate-x-1/2 rounded-full bg-emerald-700/8 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">
          <motion.span
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block rounded-full border border-[var(--gold)]/30 bg-[var(--gold-soft)]/40 px-3 py-1 text-xs font-medium uppercase tracking-wider text-emerald-900"
          >
            Supporter Plans
          </motion.span>

          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.05 }}
            className="mt-5 text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl"
          >
            Pricing is managed live below.
            <br className="hidden sm:block" />
            <span className="text-gold-gradient bg-gradient-to-r from-[var(--gold)] via-amber-500 to-emerald-700 bg-clip-text text-transparent">
              {" "}Choose a plan in the editor.
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mt-5 text-base text-muted-foreground sm:text-lg"
          >
            No subscription required. Start creating for free anytime. Donate
            only if cloud rendering or extra perks help your workflow.
          </motion.p>
        </div>

        {/* Plans grid */}
        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {PLANS.map((plan, i) => {
            const accent = ACCENTS[plan.accent];
            const isDark = plan.accent === "dark";
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className={`relative flex flex-col overflow-hidden rounded-2xl border bg-gradient-to-br ${accent.gradient} p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl ${
                  plan.popular
                    ? "border-[var(--gold)]/50 ring-2 ring-[var(--gold)]/30 lg:scale-[1.03]"
                    : "border-border"
                } ${isDark ? "text-white" : ""}`}
              >
                {plan.popular && (
                  <div className="absolute right-4 top-4">
                    <Badge className="gap-1 bg-gradient-to-r from-[var(--gold)] to-amber-500 text-emerald-950">
                      <Star className="h-3 w-3 fill-current" />
                      Most popular
                    </Badge>
                  </div>
                )}

                <div className="relative">
                  <h3
                    className={`text-xl font-bold ${
                      isDark ? "text-white" : "text-foreground"
                    }`}
                  >
                    {plan.name}
                  </h3>
                  <p
                    className={`mt-1 text-xs ${
                      isDark ? "text-white/70" : "text-muted-foreground"
                    }`}
                  >
                    {plan.tagline}
                  </p>

                  <div className="mt-6 flex items-baseline gap-1">
                    <span
                      className={`text-4xl font-bold ${
                        isDark ? "text-[var(--gold)]" : "text-foreground"
                      }`}
                    >
                      ${plan.price}
                    </span>
                    <span
                      className={`text-sm ${
                        isDark ? "text-white/60" : "text-muted-foreground"
                      }`}
                    >
                      / {plan.period}
                    </span>
                  </div>

                  <Button
                    className={`mt-6 w-full ${
                      plan.popular
                        ? "bg-gradient-to-r from-[var(--gold)] to-amber-500 text-emerald-950 hover:from-amber-400 hover:to-amber-500"
                        : isDark
                        ? "bg-white/10 text-white hover:bg-white/20 border border-white/20"
                        : "bg-foreground text-background hover:bg-foreground/90"
                    }`}
                  >
                    <Heart className="mr-2 h-4 w-4" />
                    Donate in Editor
                  </Button>

                  <ul className="mt-6 space-y-3">
                    {plan.features.map((f) => (
                      <li
                        key={f}
                        className={`flex items-start gap-2.5 text-sm ${
                          isDark ? "text-white/85" : "text-foreground"
                        }`}
                      >
                        <Check
                          className={`mt-0.5 h-4 w-4 shrink-0 ${accent.check}`}
                          strokeWidth={2.5}
                        />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            );
          })}
        </div>

        <p className="mt-10 text-center text-xs text-muted-foreground">
          No subscription required. Start creating for free anytime. Donate only
          if cloud rendering or extra perks help your workflow — every tier is a
          one-time contribution for the period shown.
        </p>
      </div>
    </section>
  );
}
