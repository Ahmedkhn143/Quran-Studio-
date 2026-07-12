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
import { Dashboard } from "@/components/dashboard/dashboard";

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
        <QuranEditor />
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
