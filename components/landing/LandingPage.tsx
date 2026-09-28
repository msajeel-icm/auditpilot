"use client";

import { motion } from "framer-motion";
import { LandingHeader } from "./LandingHeader";
import { Hero } from "./Hero";
import { HowItWorks } from "./HowItWorks";
import { MetricStrip } from "./MetricStrip";
import { LandingFooter } from "./LandingFooter";

export function LandingPage() {
  return (
    <div className="min-h-dvh bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <LandingHeader />
      <motion.main
        initial={false}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        <Hero />
        <HowItWorks />
        <MetricStrip />
      </motion.main>
      <LandingFooter />
    </div>
  );
}
