"use client";

import { useState, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { AllInOne } from "@/components/landing/all-in-one";
import { Features } from "@/components/landing/features";
import { QuranEditor } from "@/components/editor/quran-editor";
import { FreeForever } from "@/components/landing/free-forever";
import { Pricing } from "@/components/landing/pricing";
import { Footer } from "@/components/landing/footer";
import dynamic from "next/dynamic";

const Dashboard = dynamic(
  () => import("@/components/dashboard/dashboard").then((mod) => mod.Dashboard),
  {
    loading: () => (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
          <p className="text-sm font-medium text-muted-foreground animate-pulse">Loading Studio...</p>
        </div>
      </div>
    ),
    ssr: false,
  }
);

export default function Home() {
  const [dashboardOpen, setDashboardOpen] = useState(false);

  const openDashboard = useCallback(() => setDashboardOpen(true), []);
  const closeDashboard = useCallback(() => setDashboardOpen(false), []);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar onStart={openDashboard} />
      <main className="flex-1">
        <Hero onStart={openDashboard} />
        <AllInOne />
        <Features />
        <FreeForever />
        <Pricing />
      </main>
      <Footer />

      <AnimatePresence>
        {dashboardOpen && <Dashboard onClose={closeDashboard} />}
      </AnimatePresence>
    </div>
  );
}
