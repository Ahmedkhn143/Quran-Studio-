"use client";

import {
  BookOpen,
  Github,
  Twitter,
  Youtube,
  Mail,
  Heart,
} from "lucide-react";

const LINKS = {
  Product: [
    { label: "Editor", href: "#editor" },
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#pricing" },
    { label: "Changelog", href: "#" },
  ],
  Resources: [
    { label: "Documentation", href: "#" },
    { label: "Tutorials", href: "#" },
    { label: "API Reference", href: "#" },
    { label: "Community", href: "#" },
  ],
  Company: [
    { label: "About", href: "#about" },
    { label: "Contact", href: "#" },
    { label: "Privacy", href: "#" },
    { label: "Terms", href: "#" },
  ],
};

const SOCIALS = [
  { icon: Youtube, href: "#", label: "YouTube" },
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Github, href: "#", label: "GitHub" },
  { icon: Mail, href: "#", label: "Email" },
];

export function Footer() {
  return (
    <footer className="relative mt-auto overflow-hidden border-t border-border bg-gradient-to-b from-background to-[var(--cream)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--gold)]/40 to-transparent" />

      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-700 to-emerald-900 text-[var(--gold)] shadow-md">
                <BookOpen className="h-5 w-5" strokeWidth={2.2} />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-base font-bold text-foreground">
                  Quran<span className="text-[var(--gold)]"> Studio</span>
                </span>
                <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground -mt-0.5">
                  v3.0
                </span>
              </div>
            </div>

            <p className="mt-4 max-w-xs text-sm text-muted-foreground leading-relaxed">
              Create stunning Quran videos effortlessly. Free for all uses —
              donations optional. Built with care for the global ummah.
            </p>

            <div className="mt-5 flex items-center gap-2">
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:border-[var(--gold)]/50 hover:text-[var(--gold)]"
                >
                  <s.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([title, items]) => (
            <div key={title}>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                {title}
              </h4>
              <ul className="mt-4 space-y-2.5">
                {items.map((item) => (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-[var(--gold)]"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom strip */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Quran Studio. All rights reserved.
            Quran text from{" "}
            <a
              href="https://alquran.cloud"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground hover:text-[var(--gold)]"
            >
              AlQuran Cloud
            </a>
            .
          </p>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            Built with
            <Heart className="h-3 w-3 fill-red-500 text-red-500" />
            for the Ummah
          </p>
        </div>
      </div>
    </footer>
  );
}
