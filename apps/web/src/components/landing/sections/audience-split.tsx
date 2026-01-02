"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import { Crown, Compass, Wrench, BarChart3, Users, MessageCircle, Zap, Search } from "lucide-react";

/**
 * Audience Split Section
 *
 * MONOCHROME DISCIPLINE:
 * - Pure grayscale throughout
 * - NO gold on either card
 * - Gold reserved for THE final CTA in footer
 * - Both CTAs are white/grayscale
 */
export function AudienceSplitSection() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const audiences = [
    {
      id: "leaders",
      icon: Crown,
      title: "For Leaders",
      subtitle: "Run your community in one place",
      features: [
        { icon: Wrench, text: "Build custom tools for your org" },
        { icon: Users, text: "Member management & roles" },
        { icon: BarChart3, text: "Real-time engagement analytics" },
      ],
      cta: {
        text: "Claim your space",
        href: "/auth/login",
        primary: true,
      },
    },
    {
      id: "students",
      icon: Compass,
      title: "For Students",
      subtitle: "Find your people",
      features: [
        { icon: Search, text: "Browse 400+ pre-loaded orgs" },
        { icon: Zap, text: "Join instantly, no approval wait" },
        { icon: MessageCircle, text: "Real-time chat with your communities" },
      ],
      cta: {
        text: "Explore spaces",
        href: "/spaces/browse",
        primary: false,
      },
    },
  ];

  return (
    <section
      ref={ref}
      id="audience"
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
          <p className="font-mono text-[11px] text-white/40 tracking-wide uppercase mb-4">
            Built for you
          </p>
          <h2 className="text-[28px] md:text-[36px] font-semibold text-white tracking-[-0.02em]">
            Built for how you work
          </h2>
        </motion.div>

        {/* Audience cards - MONOCHROME */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {audiences.map((audience, index) => (
            <motion.div
              key={audience.id}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{
                duration: 0.6,
                delay: index * 0.15,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="group relative"
            >
              {/* Card */}
              <div className="relative h-full rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-sm p-8 transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.04]">
                {/* Icon and title - MONOCHROME */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/[0.06] border border-white/[0.08]">
                    <audience.icon className="w-5 h-5 text-white/70" />
                  </div>
                  <div>
                    <h3 className="text-[20px] font-semibold text-white">
                      {audience.title}
                    </h3>
                    <p className="text-[13px] text-white/50">
                      {audience.subtitle}
                    </p>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-4 mb-8">
                  {audience.features.map((feature) => (
                    <li key={feature.text} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center flex-shrink-0 mt-0.5">
                        <feature.icon className="w-4 h-4 text-white/50" />
                      </div>
                      <span className="text-[13px] text-white/60 leading-relaxed pt-1.5">
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA - MONOCHROME (both variants) */}
                <Link
                  href={audience.cta.href}
                  className={`inline-flex items-center justify-center w-full px-6 py-3 rounded-xl text-[14px] font-medium transition-all duration-200 ${
                    audience.cta.primary
                      ? "bg-white text-black hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-[#050505]"
                      : "bg-white/[0.06] text-white border border-white/[0.08] hover:bg-white/[0.08] hover:border-white/[0.12] focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-[#050505]"
                  }`}
                >
                  {audience.cta.text}
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
