"use client";

import { useEffect, useRef, useState } from "react";
import Lenis from "lenis";

import { Navbar } from "./sections/navbar";
import { HeroSection } from "./sections/hero";
import { ProductShowcase } from "./sections/product-showcase";
import { AboutSection } from "./sections/about";
import { CtaFooterSection } from "./sections/cta-footer";

export function LandingPage() {
  const mainRef = useRef<HTMLElement>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Check for reduced motion preference
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
      {/* Navigation */}
      <Navbar />

      {/* 1. Hero - The Manifesto */}
      <HeroSection />

      {/* 2. Product - Show, don't tell */}
      <ProductShowcase />

      {/* 3. About - The Why */}
      <AboutSection />

      {/* 4. CTA + Footer */}
      <CtaFooterSection />
    </div>
  );
}
