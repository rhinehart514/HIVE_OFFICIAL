"use client";

import { useEffect, useRef } from "react";
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

  useEffect(() => {
    // Initialize Lenis smooth scroll
    const lenis = new Lenis({
      duration: 1.2,
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

    // Refresh ScrollTrigger after layout settles
    const timeout = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 100);

    return () => {
      clearTimeout(timeout);
      lenis.destroy();
      gsap.ticker.remove(lenis.raf);
      ScrollTrigger.getAll().forEach((st) => st.kill());
    };
  }, []);

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
