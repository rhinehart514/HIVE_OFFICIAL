"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { useAnalytics } from "@hive/hooks";
import { LegalContentModal } from "../legal-content-modal";

type LegalModalType = "privacy" | "terms" | null;

/**
 * CTA Footer Section
 *
 * MONOCHROME DISCIPLINE - THE 1% GOLD RULE:
 * After an entire monochrome page, ONLY the "Enter HIVE" button is gold.
 * This is THE earned moment. Everything else is grayscale.
 *
 * The badge is white/gray - only the final CTA button rewards the user with gold.
 */
export function CtaFooterSection() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [openModal, setOpenModal] = useState<LegalModalType>(null);
  const { track } = useAnalytics();

  return (
    <section ref={ref} className="relative" style={{ background: "#050505" }}>
      {/* CTA Section */}
      <div className="relative py-32 md:py-40 overflow-hidden">
        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.015] pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)
            `,
            backgroundSize: "48px 48px",
          }}
        />

        <div className="relative z-10 max-w-3xl mx-auto px-6 md:px-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Badge - gold accent */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 mb-8 rounded-full border border-[#FFD700]/20 bg-[#FFD700]/[0.03]"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#FFD700] animate-pulse" />
              <span className="text-[11px] font-medium text-[#FFD700]/80 tracking-wide uppercase">
                Early Access Open
              </span>
            </motion.div>

            <h2 className="text-[clamp(2rem,5vw,3rem)] font-semibold text-white leading-[1.1] tracking-[-0.02em] mb-6">
              Your campus is waiting.
            </h2>

            <p className="text-[17px] text-white/40 mb-10 max-w-md mx-auto">
              Claim your handle. Join your communities.
              <span className="text-white/60"> Start building.</span>
            </p>

            {/* THE GOLD CTA - THE ONLY GOLD ON THE PAGE */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
              <Link
                href="/auth/login"
                onClick={() =>
                  track({
                    name: "cta_clicked",
                    properties: { section: "footer", cta: "enter_hive" },
                  })
                }
                className="group relative inline-flex items-center gap-3 px-8 py-4 bg-[#FFD700] text-black font-medium rounded-full transition-all duration-300 hover:bg-[#E6C200] hover:scale-[1.02] hover:shadow-[0_0_60px_rgba(255,215,0,0.25)] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-[#050505]"
              >
                <span className="text-[15px]">Enter HIVE</span>
                <svg
                  className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1"
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
            </div>

            {/* Trust line - monochrome */}
            <p className="text-[11px] font-mono text-white/25">
              Requires @buffalo.edu email · Campus-only visibility · Free forever
            </p>
          </motion.div>
        </div>
      </div>

      {/* Footer - monochrome */}
      <footer className="border-t border-white/[0.04]">
        <div className="max-w-6xl mx-auto px-6 md:px-12 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            {/* Logo - monochrome */}
            <span className="flex items-center gap-3">
              <span className="relative w-7 h-7 flex items-center justify-center">
                <svg
                  viewBox="0 0 32 32"
                  className="w-full h-full text-white/30"
                  fill="currentColor"
                >
                  <path d="M16 2L28 9v14l-12 7-12-7V9l12-7z" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-[#050505]">
                  H
                </span>
              </span>
              <span className="text-[15px] font-semibold text-white/40">
                HIVE
              </span>
            </span>

            {/* Links - monochrome */}
            <div className="flex items-center gap-8 text-[13px] text-white/30">
              <button
                onClick={() => setOpenModal("privacy")}
                className="hover:text-white/70 transition-colors duration-200"
              >
                Privacy
              </button>
              <button
                onClick={() => setOpenModal("terms")}
                className="hover:text-white/70 transition-colors duration-200"
              >
                Terms
              </button>
              <a
                href="mailto:team@hivecampus.com"
                className="hover:text-white/70 transition-colors duration-200"
              >
                Contact
              </a>
            </div>

            {/* Copyright */}
            <div className="text-[13px] text-white/25">
              &copy; {new Date().getFullYear()} HIVE
            </div>
          </div>

          {/* Tagline */}
          <div className="mt-8 pt-8 border-t border-white/[0.03] text-center">
            <p className="font-mono text-[11px] text-white/15">
              Built by students, for students. University at Buffalo.
            </p>
          </div>
        </div>
      </footer>

      {/* Legal Content Modal */}
      <LegalContentModal type={openModal} onClose={() => setOpenModal(null)} />
    </section>
  );
}
