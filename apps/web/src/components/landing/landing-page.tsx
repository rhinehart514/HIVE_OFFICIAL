"use client";

import { useEffect, useRef, useState } from "react";
import Lenis from "lenis";
import { motion, useScroll, useSpring } from "framer-motion";

import { Navbar } from "./sections/navbar";
import { HeroSection } from "./sections/hero";
import { ProductShowcase } from "./sections/product-showcase";
import { CredibilitySection } from "./sections/credibility";
import { CtaFooterSection } from "./sections/cta-footer";

/**
 * Landing Page - Premium Monochrome Design
 *
 * MONOCHROME DISCIPLINE (99% grayscale, 1% gold):
 * - Gold appears ONLY on the final CTA button
 * - All other elements are grayscale
 * - White text hierarchy creates depth
 * - No blue, green, amber, or any other colors
 *
 * Section Flow:
 * 1. Navbar - Clean, minimal
 * 2. Hero - Statement + preview
 * 3. Product - Spaces + HiveLab demos
 * 4. Credibility - Trust grid
 * 5. CTA Footer - THE gold moment
 */

function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[2px] z-[100] origin-left"
      style={{
        scaleX,
        background: "rgba(255, 255, 255, 0.4)",
      }}
    />
  );
}

export function LandingPage() {
  const mainRef = useRef<HTMLDivElement>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) {
      return;
    }

    const lenis = new Lenis({
      duration: 1.0,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      smoothWheel: true,
      touchMultiplier: 2,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, [prefersReducedMotion]);

  return (
    <div
      ref={mainRef}
      className="min-h-screen antialiased"
      style={{ background: "#050505" }}
    >
      {/* Scroll Progress - White, not gold */}
      {!prefersReducedMotion && <ScrollProgress />}

      {/* Navigation */}
      <Navbar />

      {/* 1. Hero - The statement */}
      <HeroSection />

      {/* 2. Product - Spaces + HiveLab */}
      <ProductShowcase />

      {/* 3. Credibility - Trust grid */}
      <CredibilitySection />

      {/* 4. CTA Footer - THE gold moment */}
      <CtaFooterSection />
    </div>
  );
}
