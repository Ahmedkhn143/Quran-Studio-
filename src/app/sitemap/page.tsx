import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import {
  Video,
  FileCode2,
  Sparkles,
  BookOpen,
  Volume2,
  Languages,
  Palette,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Film,
  Layers,
  Search,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Sitemap — Quran Studio",
  description:
    "Explore the complete sitemap and directory of Quran Studio features, tools, 114 Surahs, 42 reciters, 22 translations, and video generation capabilities.",
  alternates: {
    canonical: "/sitemap",
  },
  openGraph: {
    title: "Sitemap — Quran Studio",
    description:
      "Directory of Quran Studio pages, features, tools, reciters, translations, and machine-readable XML feeds.",
    url: "https://quran.studio/sitemap",
  },
};

interface SitemapSection {
  title: string;
  description: string;
  icon: React.ElementType;
  links: {
    name: string;
    url: string;
    description: string;
    badge?: string;
    isExternal?: boolean;
  }[];
}

const SECTIONS: SitemapSection[] = [
  {
    title: "Core Pages & Navigation",
    description: "Main portal entry points, product highlights, and information.",
    icon: BookOpen,
    links: [
      {
        name: "Home",
        url: "/",
        description: "Homepage, introduction, and studio launch portal",
        badge: "Main",
      },
      {
        name: "Studio & Video Generator",
        url: "/#editor",
        description: "In-browser Quran video generator with canvas rendering & preview",
        badge: "Web App",
      },
      {
        name: "Key Features",
        url: "/#features",
        description: "Breakdown of AI backgrounds, word-by-word highlights, and audio sync",
      },
      {
        name: "Free Forever Commitment",
        url: "/#free-forever",
        description: "Zero watermark, 100% free in-browser rendering for the global Ummah",
        badge: "Free",
      },
      {
        name: "Pricing & Support",
        url: "/#pricing",
        description: "Free tier and optional community donations to keep servers running",
      },
    ],
  },
  {
    title: "Studio Tools & Video Engine",
    description: "Capabilities available inside the Quran video creation suite.",
    icon: Video,
    links: [
      {
        name: "Word-by-Word Synchronizer",
        url: "/#editor",
        description: "Real-time sync between audio recitation and highlighted Arabic text",
        badge: "Featured",
      },
      {
        name: "AI & Stock Backgrounds",
        url: "/#editor",
        description: "Stunning 4K nature, mosque, starry night, and custom uploaded video backdrops",
      },
      {
        name: "42 Renowned Reciters",
        url: "/#editor",
        description: "Crystal clear audio recitations from Alafasy, Abdul Basit, Sudais, Minshawi & more",
        badge: "42 Reciters",
      },
      {
        name: "22+ Global Translations",
        url: "/#editor",
        description: "Multilingual translations including English (Sahih), Urdu, French, Spanish, Turkish, etc.",
        badge: "22 Languages",
      },
      {
        name: "Custom Ayah End Markers",
        url: "/#editor",
        description: "5 decorative ayah end symbols: Ornate Floral, Diamond, Circle, Bracketed, and Pill",
        badge: "New",
      },
      {
        name: "Multi-Aspect Export (9:16, 16:9, 1:1)",
        url: "/#editor",
        description: "Export high-bitrate MP4 videos optimized for TikTok, Reels, YouTube & Instagram",
      },
      {
        name: "Audio Trimmer & Timestamps",
        url: "/#editor",
        description: "Upload your own audio or trim pre-selected surahs with millisecond precision",
      },
    ],
  },
  {
    title: "Typography & Calligraphy Styles",
    description: "Authentic Quranic typefaces with full Harakat and ligatures.",
    icon: Palette,
    links: [
      {
        name: "Amiri Quran Calligraphy",
        url: "/#editor",
        description: "Classic Naskh typeface designed for elegant Quranic typesetting",
        badge: "Arabic",
      },
      {
        name: "Scheherazade New",
        url: "/#editor",
        description: "Traditional Othmani script inspired by classic Quranic prints",
        badge: "Othmani",
      },
      {
        name: "Noto Nastaliq Urdu",
        url: "/#editor",
        description: "Calligraphic Nastaliq typeface optimized for Urdu translation display",
        badge: "Urdu",
      },
      {
        name: "Noto Naskh Arabic",
        url: "/#editor",
        description: "Crisp modern font ensuring readability on all mobile and desktop screens",
      },
      {
        name: "Arab Quran Islamic Display",
        url: "/#editor",
        description: "Specialized ornate calligraphy font for dramatic title slides and verses",
        badge: "Display",
      },
    ],
  },
  {
    title: "Search Engines & Developer Feeds",
    description: "Machine-readable schemas, crawler endpoints, and verification files.",
    icon: FileCode2,
    links: [
      {
        name: "XML Sitemap",
        url: "/sitemap.xml",
        description: "Official sitemaps.org XML index for Google Search Console and Bing",
        badge: "XML",
        isExternal: true,
      },
      {
        name: "Robots.txt",
        url: "/robots.txt",
        description: "Crawler instructions allowing full indexing and pointing to sitemap.xml",
        badge: "TXT",
        isExternal: true,
      },
      {
        name: "Google Search Console Verification",
        url: "/google6ea23c10c93f9b0b.html",
        description: "Verification token confirming ownership for Google Search Console",
        badge: "HTML",
        isExternal: true,
      },
      {
        name: "AlQuran Cloud API",
        url: "https://alquran.cloud",
        description: "Quranic text data source providing authentic Uthmani scripture and verse metadata",
        badge: "API",
        isExternal: true,
      },
    ],
  },
];

export default function SitemapPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1">
        {/* Header Hero */}
        <div className="relative border-b border-border bg-gradient-to-b from-background via-[var(--cream)]/40 to-background py-16 sm:py-20">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--gold)]/40 to-transparent" />
          
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--gold)]">
              <Link href="/" className="hover:underline">Home</Link>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="text-muted-foreground">Sitemap</span>
            </div>

            <div className="mt-4 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl text-foreground">
                  Website <span className="text-[var(--gold)]">Sitemap</span>
                </h1>
                <p className="mt-3 max-w-2xl text-base text-muted-foreground leading-relaxed">
                  A structured overview of all pages, features, fonts, reciters, and search engine endpoints
                  available across Quran Studio.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href="/sitemap.xml"
                  target="_blank"
                  className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-[var(--gold)]/60 hover:text-[var(--gold)] shadow-sm"
                >
                  <FileCode2 className="h-4 w-4 text-[var(--gold)]" />
                  View sitemap.xml
                  <ExternalLink className="h-3.5 w-3.5 opacity-60" />
                </Link>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-700 to-emerald-800 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:from-emerald-800 hover:to-emerald-900"
                >
                  <Sparkles className="h-4 w-4" />
                  Open Studio
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Content Directory */}
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2">
            {SECTIONS.map((section) => {
              const Icon = section.icon;
              return (
                <section
                  key={section.title}
                  className="rounded-2xl border border-border/80 bg-card/60 p-6 sm:p-8 backdrop-blur-sm shadow-sm transition-all hover:border-[var(--gold)]/30 hover:shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-800/15 to-emerald-900/30 text-[var(--gold)] border border-emerald-700/20">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-foreground tracking-tight">
                        {section.title}
                      </h2>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {section.description}
                      </p>
                    </div>
                  </div>

                  <ul className="mt-6 divide-y divide-border/60">
                    {section.links.map((link) => (
                      <li key={link.name} className="group py-3.5 first:pt-0 last:pb-0">
                        {link.isExternal ? (
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-start justify-between gap-4 transition-colors"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-foreground group-hover:text-[var(--gold)] transition-colors">
                                  {link.name}
                                </span>
                                <ExternalLink className="h-3 w-3 text-muted-foreground opacity-60 group-hover:opacity-100" />
                                {link.badge && (
                                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                                    {link.badge}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground leading-relaxed">
                                {link.description}
                              </p>
                            </div>
                            <span className="font-mono text-[11px] text-muted-foreground/70 shrink-0">
                              {link.url}
                            </span>
                          </a>
                        ) : (
                          <Link
                            href={link.url}
                            className="flex items-start justify-between gap-4 transition-colors"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-foreground group-hover:text-[var(--gold)] transition-colors">
                                  {link.name}
                                </span>
                                {link.badge && (
                                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                                    {link.badge}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground leading-relaxed">
                                {link.description}
                              </p>
                            </div>
                            <span className="font-mono text-[11px] text-muted-foreground/70 shrink-0">
                              {link.url}
                            </span>
                          </Link>
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>

          {/* Search Engine Information Card */}
          <div className="mt-12 rounded-2xl border border-[var(--gold)]/30 bg-gradient-to-r from-emerald-900/10 via-[var(--cream)]/20 to-emerald-900/10 p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-[var(--gold)]" />
                  <h3 className="text-base font-bold text-foreground">
                    Search Engine Optimization & Indexing
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground max-w-2xl">
                  This sitemap is automatically kept in sync with Next.js dynamic routing and Google Search Console standards.
                  C-crawlers and indexing bots can directly access the raw XML index at{" "}
                  <code className="rounded bg-background/80 px-1.5 py-0.5 font-mono text-[11px] text-foreground border border-border">
                    https://quran.studio/sitemap.xml
                  </code>.
                </p>
              </div>
              <Link
                href="/sitemap.xml"
                target="_blank"
                className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--gold)] px-4 py-2 text-xs font-bold text-slate-900 shadow-sm hover:brightness-105 transition-all shrink-0"
              >
                Inspect XML
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
