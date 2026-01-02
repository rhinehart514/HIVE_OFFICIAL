"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Mail, Users, Rocket } from "lucide-react";

/**
 * How It Works Section
 *
 * 3-step flow to reduce friction and show simplicity.
 * Replaces the outdated "Drop Schedule" section.
 */
export function HowItWorksSection() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const steps = [
    {
      number: "01",
      icon: Mail,
      title: "Verify",
      description: "Use your .edu email to prove you're a real student. Takes 30 seconds.",
    },
    {
      number: "02",
      icon: Users,
      title: "Join or claim",
      description: "Find your org in 400+ pre-loaded spaces, or claim one to lead.",
    },
    {
      number: "03",
      icon: Rocket,
      title: "Start building",
      description: "Chat with your community. Build tools. Make it yours.",
    },
  ];

  return (
    <section
      ref={ref}
      id="how-it-works"
      className="relative py-24 md:py-32 overflow-hidden"
      style={{ background: "#050505" }}
    >
      {/* Section divider */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="max-w-5xl mx-auto px-6 md:px-12">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-16 md:mb-20"
        >
          <p className="font-mono text-sm text-white/40 tracking-wide uppercase mb-4">
            Getting started
          </p>
          <h2 className="text-3xl md:text-4xl font-semibold text-white tracking-tight">
            How it works
          </h2>
        </motion.div>

        {/* Steps grid */}
        <div className="relative">
          {/* Connecting line (desktop only) */}
          <div className="hidden md:block absolute top-16 left-[16.67%] right-[16.67%] h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{
                  duration: 0.6,
                  delay: index * 0.15,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="relative flex flex-col items-center text-center"
              >
                {/* Step number with icon */}
                <div className="relative mb-6">
                  <div className="w-12 h-12 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
                    <step.icon className="w-5 h-5 text-white/70" />
                  </div>
                  {/* Number badge */}
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white/10 border border-white/[0.08] flex items-center justify-center text-[10px] font-mono text-white/60">
                    {index + 1}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-lg font-semibold text-white mb-2">
                  {step.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-white/50 max-w-[240px] leading-relaxed">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
