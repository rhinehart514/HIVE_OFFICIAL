"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";

// Simple honeycomb grid fragment for brand texture
function GridFragment({ size = 100, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      fill="none"
    >
      <path
        d="M50 5L90 27.5V72.5L50 95L10 72.5V27.5L50 5Z"
        stroke="currentColor"
        strokeWidth="0.5"
      />
      <path
        d="M50 20L75 35V65L50 80L25 65V35L50 20Z"
        stroke="currentColor"
        strokeWidth="0.5"
      />
    </svg>
  );
}

// Stagger animation for manifesto lines
const lineVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.15 + i * 0.12,
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

const ctaVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: 0.9,
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

export function HeroSection() {
  const containerRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const y = useTransform(scrollYProgress, [0, 0.5], [0, 100]);

  useEffect(() => {
    // Trigger animations after mount
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative min-h-[100dvh] flex flex-col justify-center overflow-hidden"
      style={{ background: "#050505" }}
    >
      {/* HIVE honeycomb texture - unique to brand */}
      <div className="absolute inset-0 overflow-hidden opacity-[0.015] pointer-events-none">
        <div className="absolute top-[10%] left-[5%]">
          <GridFragment size={120} className="text-white" />
        </div>
        <div className="absolute top-[30%] right-[10%]">
          <GridFragment size={80} className="text-white" />
        </div>
        <div className="absolute bottom-[20%] left-[15%]">
          <GridFragment size={100} className="text-white" />
        </div>
        <div className="absolute bottom-[10%] right-[20%]">
          <GridFragment size={60} className="text-white" />
        </div>
      </div>

      {/* Single accent line - architectural */}
      <div className="absolute top-0 left-[15%] w-px h-[40vh] bg-gradient-to-b from-transparent via-gold-500/20 to-transparent" />

      {/* Content */}
      <motion.div
        style={{ opacity, y }}
        className="relative z-10 w-full max-w-6xl mx-auto px-6 md:px-12"
      >
        {/* Manifesto */}
        <div className="space-y-2 md:space-y-3">
          {/* Line 1 - Monospace, rebellious */}
          <motion.p
            custom={0}
            initial="hidden"
            animate={isVisible ? "visible" : "hidden"}
            variants={lineVariants}
            className="font-mono text-sm md:text-base text-neutral-500 tracking-wide uppercase"
          >
            // the old paths are dying
          </motion.p>

          {/* Line 2 - Main statement */}
          <motion.h1
            custom={1}
            initial="hidden"
            animate={isVisible ? "visible" : "hidden"}
            variants={lineVariants}
            className="font-manifesto text-[clamp(2.5rem,8vw,6rem)] font-semibold text-white leading-[0.95] tracking-tight"
          >
            Build your own.
          </motion.h1>

          {/* Line 3 - Supporting manifesto */}
          <motion.p
            custom={2}
            initial="hidden"
            animate={isVisible ? "visible" : "hidden"}
            variants={lineVariants}
            className="font-manifesto text-[clamp(1.5rem,4vw,2.5rem)] font-medium text-neutral-400 leading-tight max-w-2xl"
          >
            Campus infrastructure for students
            <br className="hidden sm:block" />
            who aren&apos;t waiting around.
          </motion.p>
        </div>

        {/* Stats bar - social proof, minimal */}
        <motion.div
          custom={3}
          initial="hidden"
          animate={isVisible ? "visible" : "hidden"}
          variants={lineVariants}
          className="mt-12 md:mt-16 flex items-center gap-8 md:gap-12"
        >
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-2xl md:text-3xl font-medium text-white">400+</span>
            <span className="text-sm text-neutral-500">orgs</span>
          </div>
          <div className="w-px h-6 bg-neutral-800" />
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-2xl md:text-3xl font-medium text-white">32K</span>
            <span className="text-sm text-neutral-500">students</span>
          </div>
          <div className="w-px h-6 bg-neutral-800 hidden sm:block" />
          <div className="hidden sm:flex items-baseline gap-2">
            <span className="font-mono text-2xl md:text-3xl font-medium text-white">UB</span>
            <span className="text-sm text-neutral-500">first</span>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial="hidden"
          animate={isVisible ? "visible" : "hidden"}
          variants={ctaVariants}
          className="mt-12 md:mt-16 flex flex-col sm:flex-row items-start gap-4"
        >
          <Link
            href="/auth/login?new=true"
            className="group relative inline-flex items-center gap-3 px-6 py-3.5 bg-white text-black font-medium rounded-lg transition-all duration-200 hover:bg-neutral-100"
          >
            <span>Get early access</span>
            <svg
              className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>

          <span className="text-sm text-neutral-600 self-center">
            .edu email required
          </span>
        </motion.div>
      </motion.div>

      {/* Bottom accent - asymmetric */}
      <div className="absolute bottom-0 right-[20%] w-px h-[20vh] bg-gradient-to-t from-gold-500/30 to-transparent" />

      {/* Scroll indicator - minimal */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isVisible ? 0.4 : 0 }}
        transition={{ delay: 1.2, duration: 0.6 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="text-xs font-mono text-neutral-600 tracking-wider uppercase">Scroll</span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-px h-8 bg-gradient-to-b from-neutral-600 to-transparent"
        />
      </motion.div>
    </section>
  );
}
