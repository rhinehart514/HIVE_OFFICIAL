"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { LegalContentModal } from "../legal-content-modal";

type LegalModalType = "privacy" | "terms" | null;

export function CtaFooterSection() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [openModal, setOpenModal] = useState<LegalModalType>(null);

  return (
    <section ref={ref} className="relative" style={{ background: "#050505" }}>
      {/* CTA Section */}
      <div className="relative py-32 md:py-40 overflow-hidden">
        {/* Subtle radial gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gold-500/[0.02] to-transparent pointer-events-none" />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.02] pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)
            `,
            backgroundSize: "64px 64px",
          }}
        />

        <div className="relative z-10 max-w-3xl mx-auto px-6 md:px-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="font-mono text-sm text-neutral-500 tracking-wide uppercase mb-6">
              // ready to start?
            </p>

            <h2 className="font-manifesto text-4xl sm:text-5xl md:text-6xl font-semibold text-white mb-8">
              Join the builders.
            </h2>

            <p className="text-lg text-neutral-400 mb-12 max-w-lg mx-auto">
              UB students only. Get early access and help shape what campus infrastructure becomes.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/auth/login?new=true"
                className="group relative inline-flex items-center gap-3 px-8 py-4 bg-white text-black font-medium rounded-lg transition-all duration-200 hover:bg-neutral-100 hover:scale-[1.02] active:scale-[0.98]"
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

              <span className="text-sm text-neutral-600">
                .edu email required
              </span>
            </div>
          </motion.div>

          {/* Trust signals */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-16 flex flex-wrap items-center justify-center gap-6 text-sm text-neutral-600"
          >
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500/60" />
              Free forever
            </span>
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500/60" />
              No ads
            </span>
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500/60" />
              Student-owned
            </span>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-6 md:px-12 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            {/* Logo */}
            <span className="flex items-center gap-3">
              <span className="relative w-7 h-7 flex items-center justify-center">
                <svg
                  viewBox="0 0 32 32"
                  className="w-full h-full text-neutral-600"
                  fill="currentColor"
                >
                  <path d="M16 2L28 9v14l-12 7-12-7V9l12-7z" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-[#050505]">
                  H
                </span>
              </span>
              <span className="font-manifesto text-base font-semibold text-neutral-500">
                HIVE
              </span>
            </span>

            {/* Links */}
            <div className="flex items-center gap-8 text-sm text-neutral-500">
              <button
                onClick={() => setOpenModal("privacy")}
                className="hover:text-white transition-colors duration-200"
              >
                Privacy
              </button>
              <button
                onClick={() => setOpenModal("terms")}
                className="hover:text-white transition-colors duration-200"
              >
                Terms
              </button>
              <a
                href="mailto:team@hivecampus.com"
                className="hover:text-white transition-colors duration-200"
              >
                Contact
              </a>
            </div>

            {/* Copyright */}
            <div className="text-sm text-neutral-600">
              &copy; {new Date().getFullYear()} HIVE
            </div>
          </div>

          {/* Tagline */}
          <div className="mt-8 pt-8 border-t border-white/[0.04] text-center">
            <p className="font-mono text-xs text-neutral-700">
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
