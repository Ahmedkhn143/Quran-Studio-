"use client";

import { useRef, useCallback } from "react";
import { Navbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { AllInOne } from "@/components/landing/all-in-one";
import { Features } from "@/components/landing/features";
import { QuranEditor } from "@/components/editor/quran-editor";
import { FreeForever } from "@/components/landing/free-forever";
import { Pricing } from "@/components/landing/pricing";
import { Footer } from "@/components/landing/footer";

export default function Home() {
  const editorRef = useRef<HTMLDivElement>(null);

  const scrollToEditor = useCallback(() => {
    const el = document.getElementById("editor");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar onStart={scrollToEditor} />
      <main className="flex-1">
        <Hero onStart={scrollToEditor} />
        <AllInOne />
        <div ref={editorRef}>
          <QuranEditor />
        </div>
        <Features />
        <FreeForever />
        <Pricing />
      </main>
      <Footer />
    </div>
  );
}
