"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { SchoolLogoMarquee } from "../ui/SchoolLogoMarquee";

/**
 * Social Proof Strip
 *
 * MONOCHROME DISCIPLINE:
 * - Pure grayscale
 * - NO gold, green, blue
 * - Stats in white, labels in gray
 */
export function SocialProofStrip() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  const stats = [
    { value: "400+", label: "orgs pre-loaded" },
    { value: ".edu", label: "verified only" },
    { value: "UB", label: "built at Buffalo" },
  ];

  return (
    <section
      ref={ref}
      className="relative py-12 md:py-16 overflow-hidden"
      style={{ background: "#050505" }}
    >
      {/* Subtle top border */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      <div className="max-w-5xl mx-auto px-6">
        {/* Stats Strip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-wrap justify-center items-center gap-6 md:gap-12 mb-10"
        >
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className="flex items-center gap-6 md:gap-12"
            >
              <div className="text-center">
                <span className="text-[20px] md:text-[24px] font-semibold text-white/90 tracking-tight">
                  {stat.value}
                </span>
                <span className="ml-2 text-[14px] md:text-[15px] text-white/40">
                  {stat.label}
                </span>
              </div>
              {index < stats.length - 1 && (
                <span className="hidden md:block w-1 h-1 rounded-full bg-white/20" />
              )}
            </div>
          ))}
        </motion.div>

        {/* School Logo Marquee */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <SchoolLogoMarquee />
        </motion.div>
      </div>

      {/* Subtle bottom border */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
    </section>
  );
}
