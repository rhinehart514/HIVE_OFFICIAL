'use client';

import { motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowRight, Sparkles } from 'lucide-react';
import { buildUbEnterUrl } from './entry-url';

const clashDisplay = "font-[family-name:'Clash_Display',var(--font-clash)]";

const fade = (delay: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1], delay },
});

export function HeroSection() {
  const searchParams = useSearchParams();
  const enterHref = buildUbEnterUrl(searchParams.get('redirect'), '/lab');
  const prefersReduced = useReducedMotion();

  const motionProps = (delay: number) =>
    prefersReduced ? {} : fade(delay);

  return (
    <section className="relative min-h-[100dvh] flex items-center bg-black px-6 pt-20 pb-16 overflow-hidden">
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full opacity-[0.07]"
        style={{
          background: 'radial-gradient(ellipse, #FFD700 0%, transparent 70%)',
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto w-full max-w-7xl">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[1fr_1fr] lg:gap-16">
          {/* Copy */}
          <div>
            <motion.div {...motionProps(0)} className="mb-5 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#FFD700]/20 bg-[#FFD700]/[0.06] px-3 py-1">
                <Sparkles className="h-3 w-3 text-[#FFD700]" />
                <span className="text-[11px] font-medium text-[#FFD700]/80">AI-powered</span>
              </span>
            </motion.div>

            <motion.h1
              {...motionProps(0.05)}
              className={`${clashDisplay} mb-5 text-[clamp(40px,7vw,72px)] font-semibold leading-[0.95] tracking-tight text-white`}
            >
              Describe it.
              <br />
              <span className="text-[#FFD700]">HIVE builds it.</span>
            </motion.h1>

            <motion.p
              {...motionProps(0.1)}
              className="mb-8 max-w-md text-base leading-relaxed text-white/45"
            >
              Polls, signups, countdowns, leaderboards — real apps for your student org.
              No code. No templates. Just describe what you need.
            </motion.p>

            <motion.div {...motionProps(0.15)} className="flex flex-col items-start gap-5">
              <div className="flex flex-col items-start gap-3 sm:flex-row">
                <Link
                  href={enterHref}
                  className="flex items-center gap-2 rounded-full bg-[#FFD700] px-7 py-3.5 text-[15px] font-medium text-black transition-opacity hover:opacity-90"
                >
                  Start creating
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="#how-it-works"
                  className="rounded-full bg-white/[0.06] px-7 py-3.5 text-[15px] font-medium text-white transition-colors hover:bg-white/[0.1]"
                >
                  See how it works
                </Link>
              </div>
              <p className="font-mono text-[11px] text-white/20">
                free · @buffalo.edu · no code required
              </p>
            </motion.div>
          </div>

          {/* Creation mockup */}
          <motion.div {...motionProps(0.2)} className="flex justify-center lg:justify-end">
            <CreationMockup />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────────── */
/* AI creation flow mockup                                */
/* ────────────────────────────────────────────────────── */

function CreationMockup() {
  return (
    <div className="w-full max-w-[420px] select-none">
      {/* Window chrome */}
      <div className="flex items-center gap-3 rounded-t-2xl border border-b-0 border-white/[0.06] bg-[#0A0A0A] px-4 py-2.5">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-white/[0.08]" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/[0.08]" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/[0.08]" />
        </div>
        <div className="flex flex-1 justify-center">
          <div className="rounded-md bg-white/[0.04] px-4 py-1 font-mono text-[10px] text-white/25">
            hive.college/lab
          </div>
        </div>
        <div className="w-[46px]" />
      </div>

      {/* Content */}
      <div className="rounded-b-2xl border border-t-0 border-white/[0.06] bg-black">
        {/* Prompt area */}
        <div className="border-b border-white/[0.06] px-5 py-4">
          <div className="mb-2 flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-[#FFD700]/60" />
            <span className="text-[11px] font-medium text-white/40">What do you want to make?</span>
          </div>
          <div className="rounded-xl border border-[#FFD700]/20 bg-[#FFD700]/[0.03] px-4 py-3">
            <span className="text-[13px] text-white/70">
              &quot;A poll where members vote on our next meeting topic&quot;
            </span>
            <span className="ml-0.5 inline-block h-3.5 w-[2px] animate-pulse bg-[#FFD700]" />
          </div>
        </div>

        {/* Streaming result */}
        <div className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-[#22C55E] animate-pulse" />
            <span className="text-[10px] font-mono text-[#22C55E]/70">Building your app...</span>
          </div>

          {/* Generated poll preview */}
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[12px] font-semibold text-white/80">Next Meeting Topic</span>
              <span className="rounded-full bg-[#FFD700]/10 px-2 py-0.5 text-[9px] font-medium text-[#FFD700]/70">
                LIVE
              </span>
            </div>
            <div className="space-y-1.5">
              {[
                { label: 'Workshop: Intro to Figma', pct: 45 },
                { label: 'Guest speaker series', pct: 32 },
                { label: 'Portfolio review night', pct: 23 },
              ].map((opt) => (
                <div key={opt.label} className="relative overflow-hidden rounded-lg bg-white/[0.02]">
                  <div
                    className="absolute inset-y-0 left-0 bg-[#FFD700]/[0.08]"
                    style={{ width: `${opt.pct}%` }}
                  />
                  <div className="relative flex items-center justify-between px-3 py-2">
                    <span className="text-[11px] text-white/55">{opt.label}</span>
                    <span className="font-mono text-[10px] text-[#FFD700]/60">{opt.pct}%</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="font-mono text-[9px] text-white/20">24 votes</span>
              <div className="flex gap-1.5">
                <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[9px] font-medium text-white/40">
                  Share
                </span>
                <span className="rounded-full bg-[#FFD700] px-2.5 py-1 text-[9px] font-medium text-black">
                  Deploy
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
