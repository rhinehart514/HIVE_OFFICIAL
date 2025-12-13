"use client";

import { useEffect, useRef, useState } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { Navbar } from "./sections/navbar";
import { HeroSection } from "./sections/hero";
import { ProofSection } from "./sections/proof";
import { ProblemSection } from "./sections/problem";
import { SolutionSection } from "./sections/solution";
import { WhySection } from "./sections/why";
import { CtaFooterSection } from "./sections/cta-footer";

gsap.registerPlugin(ScrollTrigger);

export function LandingPage() {
  const mainRef = useRef<HTMLElement>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    // Skip smooth scroll animations if user prefers reduced motion
    if (prefersReducedMotion) {
      return;
    }

    // Initialize Lenis smooth scroll
    const lenis = new Lenis({
      duration: 1.0,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      smoothWheel: true,
      touchMultiplier: 2,
    });

    // Connect Lenis to GSAP ScrollTrigger
    lenis.on("scroll", ScrollTrigger.update);

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);

    // Refresh ScrollTrigger multiple times to ensure triggers fire
    const refresh1 = setTimeout(() => ScrollTrigger.refresh(), 50);
    const refresh2 = setTimeout(() => ScrollTrigger.refresh(), 200);
    const refresh3 = setTimeout(() => ScrollTrigger.refresh(), 500);

    return () => {
      clearTimeout(refresh1);
      clearTimeout(refresh2);
      clearTimeout(refresh3);
      lenis.destroy();
      gsap.ticker.remove(lenis.raf);
      ScrollTrigger.getAll().forEach((st) => st.kill());
    };
  }, [prefersReducedMotion]);

  return (
    <main
      ref={mainRef}
      className="min-h-screen bg-black antialiased"
      data-lenis-prevent
    >
      {/* Navigation */}
      <Navbar />

      {/* 1. The Manifesto */}
      <HeroSection />

      {/* 2. Social Proof */}
      <ProofSection />

      {/* 3. The Problem */}
      <ProblemSection />

      {/* 4. The Solution */}
      <SolutionSection />

      {/* 5. The Why */}
      <WhySection />

      {/* 6. The Action */}
      <CtaFooterSection />
    </main>
  );
}
