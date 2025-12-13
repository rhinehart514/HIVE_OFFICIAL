"use client";

import Link from "next/link";
import { HiveLogo } from "@hive/ui";
import { MagneticButton } from "../magnetic-button";

const SILK_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

export function CtaFooterSection() {
  return (
    <section className="relative py-24 md:py-32 px-6 bg-black overflow-hidden">
      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Gold glow - static */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-gold-500 opacity-[0.03] blur-[100px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-3xl mx-auto text-center">
        <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white">
          Ready?
        </h2>

        <div className="mt-10">
          <MagneticButton strength={0.2}>
            <Link
              href="/auth/login?new=true"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-black font-semibold rounded-xl transition-all duration-200 hover:bg-neutral-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              Get Started with your .edu
            </Link>
          </MagneticButton>
        </div>

        <p className="mt-6 text-sm text-neutral-500">
          Free forever. No ads. Student-owned.
        </p>
      </div>

      {/* Footer */}
      <div className="relative z-10 mt-24 pt-8 border-t border-neutral-800">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <HiveLogo size="default" variant="white" showIcon showText />
            <span className="text-neutral-700">|</span>
            <span className="text-sm text-neutral-500">Campus</span>
          </div>

          <div className="flex items-center gap-6 text-sm text-neutral-400">
            <Link
              href="/privacy"
              className="hover:text-white transition-colors duration-200"
              style={{ transitionTimingFunction: SILK_EASE }}
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="hover:text-white transition-colors duration-200"
              style={{ transitionTimingFunction: SILK_EASE }}
            >
              Terms
            </Link>
            <a
              href="mailto:team@hivecampus.com"
              className="hover:text-white transition-colors duration-200"
              style={{ transitionTimingFunction: SILK_EASE }}
            >
              Contact
            </a>
          </div>

          <p className="text-sm text-neutral-500">
            &copy; {new Date().getFullYear()} HIVE
          </p>
        </div>
      </div>
    </section>
  );
}
