"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const values = [
  "Student-owned",
  "Zero ads, forever",
  "Open roadmap",
];

export function WhySection() {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(contentRef, { once: true, margin: "-100px" });

  return (
    <section ref={sectionRef} className="relative py-24 md:py-32 px-6 bg-black overflow-hidden">
      {/* Subtle gold glow */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 0.03 } : {}}
        transition={{ duration: 1 }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-[#FFD700] blur-[120px] rounded-full pointer-events-none"
      />

      <div ref={contentRef} className="relative z-10 max-w-3xl mx-auto text-center">
        {/* Headline */}
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-3xl sm:text-4xl md:text-5xl font-bold text-white"
        >
          Student-run. Built for tonight.
        </motion.h2>

        {/* Body text */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="mt-6 text-lg md:text-xl text-neutral-400 leading-relaxed"
        >
          Campus life should be owned by the students who live it.
          <br className="hidden sm:block" />
          <span className="sm:hidden"> </span>
          We built HIVE because we needed it.
        </motion.p>

        {/* Value pills */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="mt-10 flex flex-wrap justify-center gap-3"
        >
          {values.map((value, index) => (
            <motion.div
              key={value}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{
                duration: 0.4,
                delay: 0.4 + index * 0.1,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-900 border border-neutral-800"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-[#FFD700]" />
              <span className="text-sm font-medium text-white">{value}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
