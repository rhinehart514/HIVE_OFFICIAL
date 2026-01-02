"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useAnalytics } from "@hive/hooks";

/**
 * Hero Section - Ultra Premium Monochrome
 *
 * MONOCHROME DISCIPLINE:
 * - Pure grayscale throughout
 * - NO gold, green, blue, amber anywhere
 * - White CTA button
 * - Minimal, confident typography
 */

// Premium easing for buttery motion
const EASE_PREMIUM = [0.22, 1, 0.36, 1] as const;

/**
 * Animated chat preview - PURE GRAYSCALE
 * Shows the Space chat experience without any color
 */
function SpacePreview() {
  const [typingIndex, setTypingIndex] = useState(0);
  const messages = [
    { user: "Maya", text: "Who's going to the hackathon?", self: false },
    { user: "Jordan", text: "I'm in! Need a team?", self: false },
    { user: "You", text: "Let's do it", self: true },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setTypingIndex((prev) => (prev + 1) % (messages.length + 1));
    }, 2000);
    return () => clearInterval(timer);
  }, [messages.length]);

  return (
    <div className="relative">
      {/* Subtle glow behind the card - white only */}
      <div
        className="absolute -inset-4 rounded-3xl opacity-[0.03]"
        style={{
          background: "radial-gradient(ellipse at center, rgba(255,255,255,0.4) 0%, transparent 70%)",
        }}
      />

      <div className="relative rounded-2xl border border-white/[0.08] bg-[#0A0A0A]/80 backdrop-blur-sm overflow-hidden">
        {/* Space header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.04]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center">
              <span className="text-[10px] font-semibold text-white/60">CS</span>
            </div>
            <div>
              <div className="text-[13px] font-medium text-white/80">CS Club</div>
              <div className="text-[11px] text-white/30 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FFD700]" />
                <span className="text-[#FFD700]/70">127 active</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-white/20" />
            <div className="w-2 h-2 rounded-full bg-white/20" />
            <div className="w-2 h-2 rounded-full bg-white/20" />
          </div>
        </div>

        {/* Messages - pure grayscale */}
        <div className="p-4 space-y-3 min-h-[140px]">
          <AnimatePresence mode="wait">
            {messages.slice(0, typingIndex).map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: EASE_PREMIUM }}
                className={`flex gap-2.5 ${msg.self ? "justify-end" : ""}`}
              >
                {!msg.self && (
                  <div className="w-6 h-6 rounded-full bg-white/[0.04] flex-shrink-0 flex items-center justify-center text-[9px] text-white/30 font-medium">
                    {msg.user[0]}
                  </div>
                )}
                <div
                  className={`text-[13px] px-3 py-2 rounded-xl max-w-[200px] ${
                    msg.self
                      ? "bg-white/[0.06] text-white/70"
                      : "bg-white/[0.02] text-white/50"
                  }`}
                >
                  {msg.text}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing indicator */}
          {typingIndex === messages.length && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-2.5"
            >
              <div className="w-6 h-6 rounded-full bg-white/[0.04] flex-shrink-0" />
              <div className="flex items-center gap-1 px-3 py-2 bg-white/[0.02] rounded-xl">
                <motion.div
                  animate={{ opacity: [0.2, 0.5, 0.2] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="w-1.5 h-1.5 rounded-full bg-white/30"
                />
                <motion.div
                  animate={{ opacity: [0.2, 0.5, 0.2] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                  className="w-1.5 h-1.5 rounded-full bg-white/30"
                />
                <motion.div
                  animate={{ opacity: [0.2, 0.5, 0.2] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                  className="w-1.5 h-1.5 rounded-full bg-white/30"
                />
              </div>
            </motion.div>
          )}
        </div>

        {/* Input - monochrome */}
        <div className="px-4 pb-4">
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
            <input
              type="text"
              placeholder="Message CS Club..."
              className="flex-1 bg-transparent text-[13px] text-white/30 placeholder:text-white/15 outline-none"
              disabled
            />
            <div className="w-6 h-6 rounded-lg bg-white/[0.04] flex items-center justify-center">
              <svg
                className="w-3 h-3 text-white/20"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function HeroSection() {
  const containerRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const { track } = useAnalytics();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const contentY = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.4], [1, 0]);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section
      ref={containerRef}
      id="hero"
      className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden"
      style={{ background: "#050505" }}
    >
      {/* Subtle radial gradient for depth - white only */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(255,255,255,0.03) 0%, transparent 60%)",
        }}
      />

      <motion.div
        style={{ y: contentY, opacity: contentOpacity }}
        className="relative z-20 w-full max-w-6xl mx-auto px-6 md:px-12 py-24"
      >
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-center">
          {/* Left: Copy */}
          <div className="order-2 lg:order-1">
            {/* Badge - gold accent */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.1, duration: 0.5, ease: EASE_PREMIUM }}
              className="inline-flex items-center gap-2 px-3 py-1.5 mb-8 rounded-full border border-[#FFD700]/20 bg-[#FFD700]/[0.03]"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#FFD700] animate-pulse" />
              <span className="text-[11px] font-medium text-[#FFD700]/80 tracking-wide uppercase">
                Now at UB
              </span>
            </motion.div>

            {/* Headline - clean, confident */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={isVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2, duration: 0.7, ease: EASE_PREMIUM }}
              className="text-[clamp(2.5rem,6vw,4rem)] font-semibold text-white leading-[1.05] tracking-[-0.02em] mb-6"
            >
              Finally,{" "}
              <span className="relative">
                YOUR
                <span className="absolute -bottom-1 left-0 right-0 h-[2px] bg-[#FFD700]/60" />
              </span>{" "}
              campus.
            </motion.h1>

            {/* Subhead - hierarchy through opacity */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={isVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.35, duration: 0.6, ease: EASE_PREMIUM }}
              className="text-[17px] text-white/40 leading-relaxed max-w-md mb-10"
            >
              One place where every community lives.{" "}
              <span className="text-white/60">
                Spaces for clubs. Tools for leaders.
              </span>
            </motion.p>

            {/* CTAs - white primary, ghost secondary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.5, duration: 0.5, ease: EASE_PREMIUM }}
              className="flex flex-col sm:flex-row items-start gap-4 mb-10"
            >
              <Link
                href="/auth/login"
                onClick={() =>
                  track({
                    name: "cta_clicked",
                    properties: { section: "hero", cta: "get_started" },
                  })
                }
                className="group inline-flex items-center gap-3 px-6 py-3.5 bg-white text-black font-medium rounded-full transition-all duration-300 hover:bg-white/90 hover:shadow-[0_0_40px_rgba(255,255,255,0.15)] focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-[#050505]"
              >
                <span className="text-[15px]">Get Started</span>
                <svg
                  className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </Link>

              <button
                onClick={() => {
                  track({
                    name: "cta_clicked",
                    properties: { section: "hero", cta: "learn_more" },
                  });
                  document
                    .getElementById("product")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
                className="inline-flex items-center gap-2 px-4 py-3.5 text-[15px] text-white/30 hover:text-white/60 transition-colors duration-200"
              >
                <span>See how it works</span>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
            </motion.div>

            {/* Trust line - subtle */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={isVisible ? { opacity: 1 } : {}}
              transition={{ delay: 0.7, duration: 0.5 }}
              className="text-[11px] font-mono text-white/20 tracking-wide"
            >
              Requires verified @buffalo.edu email · Campus-only visibility
            </motion.p>
          </div>

          {/* Right: Product preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, x: 20 }}
            animate={isVisible ? { opacity: 1, scale: 1, x: 0 } : {}}
            transition={{ delay: 0.4, duration: 0.8, ease: EASE_PREMIUM }}
            className="order-1 lg:order-2"
          >
            <SpacePreview />

            <motion.p
              initial={{ opacity: 0 }}
              animate={isVisible ? { opacity: 1 } : {}}
              transition={{ delay: 0.9, duration: 0.5 }}
              className="text-center mt-6 text-[11px] font-mono text-white/20 tracking-[0.1em] uppercase flex items-center justify-center gap-2"
            >
              <span>Spaces</span>
              <span className="text-white/10">·</span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FFD700] animate-pulse" />
                <span className="text-[#FFD700]/70">Live</span>
              </span>
            </motion.p>
          </motion.div>
        </div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isVisible ? 0.2 : 0 }}
        transition={{ delay: 1.2, duration: 0.6 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="flex flex-col items-center gap-2"
        >
          <div className="w-px h-12 bg-gradient-to-b from-white/20 to-transparent" />
        </motion.div>
      </motion.div>
    </section>
  );
}
