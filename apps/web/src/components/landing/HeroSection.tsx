'use client';

import { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { buildEnterUrl } from './entry-url';
import { GRAIN_SVG, colors } from '@hive/tokens';
import { TEMPLATE_IDEAS } from '@/lib/build-prompt-ideas';

const clashDisplay = "font-[family-name:'Clash_Display',var(--font-clash)]";

const fade = (delay: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1], delay },
});

export function HeroSection() {
  const searchParams = useSearchParams();
  const enterHref = buildEnterUrl(searchParams.get('redirect'));
  const prefersReduced = useReducedMotion();

  const motionProps = (delay: number) =>
    prefersReduced ? {} : fade(delay);

  return (
    <section className="relative min-h-[100dvh] flex items-center bg-black px-6 pt-20 pb-16 overflow-hidden">
      {/* Subtle grain texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03] mix-blend-overlay"
        style={{
          backgroundImage: GRAIN_SVG,
          backgroundSize: '256px 256px',
        }}
        aria-hidden="true"
      />

      {/* Colored ambient glow — green for creation energy */}
      <div
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full opacity-[0.05]"
        style={{
          background: `radial-gradient(ellipse, ${colors.accentGreen} 0%, transparent 70%)`,
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto w-full max-w-7xl">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[1fr_1fr] lg:gap-16">
          {/* Copy */}
          <div>
            <motion.div {...motionProps(0)} className="mb-5 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/[0.06] px-3 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] font-medium text-emerald-500/80">Live at UB</span>
              </span>
            </motion.div>

            <motion.h1
              {...motionProps(0.05)}
              className={`${clashDisplay} mb-5 text-[clamp(40px,7vw,72px)] font-semibold leading-[0.95] tracking-[-0.03em] text-white`}
            >
              Your campus
              <br />
              runs on what
              <br />
              <span style={{ color: colors.accentGreen }}>you build.</span>
            </motion.h1>

            <motion.p
              {...motionProps(0.1)}
              className="mb-8 max-w-md text-base leading-relaxed text-white/45"
            >
              Every campus has problems no one&apos;s solved yet. HIVE gives you the tools
              to build the apps your campus actually needs — and share them with everyone.
            </motion.p>

            <motion.div {...motionProps(0.15)} className="flex flex-col items-start gap-5">
              <div className="flex flex-col items-start gap-3 sm:flex-row">
                <Link
                  href={enterHref}
                  className="flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-[15px] font-medium text-black transition-opacity hover:opacity-90"
                >
                  Start building
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="#what-you-can-build"
                  className="rounded-full bg-white/[0.06] px-7 py-3.5 text-[15px] font-medium text-white transition-colors hover:bg-white/[0.1]"
                >
                  See what&apos;s possible
                </Link>
              </div>
              <p className="font-mono text-[11px] text-white/20">
                free · .edu email · takes 30 seconds
              </p>
            </motion.div>
          </div>

          {/* What you can build — template ideas */}
          <motion.div {...motionProps(0.2)} className="flex justify-center lg:justify-end">
            <BuildPreview />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────────── */
/* Build preview — shows what students can create         */
/* ────────────────────────────────────────────────────── */

function BuildPreview() {
  return (
    <div className="w-full max-w-[420px] select-none" id="what-you-can-build">
      {/* Window chrome */}
      <div className="flex items-center gap-3 rounded-t-2xl border border-b-0 border-white/[0.10] bg-[#0A0A0A] px-4 py-2.5">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-white/[0.08]" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/[0.08]" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/[0.08]" />
        </div>
        <div className="flex flex-1 justify-center">
          <div className="rounded-md bg-white/[0.04] px-4 py-1 font-mono text-[10px] text-white/25">
            hive.college/build
          </div>
        </div>
        <div className="w-[46px]" />
      </div>

      {/* Content — what could exist */}
      <div className="rounded-b-2xl border border-t-0 border-white/[0.10] bg-black">
        {/* Chat prompt */}
        <div className="border-b border-white/[0.10] px-5 py-4">
          <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/[0.03] px-4 py-3">
            <span className="text-[12px] text-white/50">
              &quot;Build a rush RSVP tracker for my fraternity&quot;
            </span>
            <span className="ml-0.5 inline-block h-3 w-[2px] animate-pulse bg-emerald-500" />
          </div>
        </div>

        {/* Template ideas grid */}
        <div className="px-5 py-4">
          <div className="mb-3 text-[11px] font-medium text-white/30 uppercase tracking-[0.1em]">
            What students are building
          </div>
          <div className="grid grid-cols-2 gap-2">
            {TEMPLATE_IDEAS.map((idea) => (
              <div
                key={idea.label}
                className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 hover:bg-white/[0.04] transition-colors"
              >
                <span className="text-sm">{idea.emoji}</span>
                <span className="text-[11px] text-white/55">{idea.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Social proof — live stats */}
        <SocialProofBar />
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────── */
/* Social proof bar — real stats from /api/campus/stats   */
/* ────────────────────────────────────────────────────── */

function SocialProofBar() {
  const [stats, setStats] = useState<{ students: number; spaces: number; apps: number } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/campus/stats', { signal: controller.signal, cache: 'force-cache' })
      .then((r) => r.json())
      .then((d) => {
        if (d.data) setStats(d.data);
      })
      .catch(() => setStats({ students: 0, spaces: 0, apps: 0 }));
    return () => controller.abort();
  }, []);

  const hasActivity = stats && (stats.students > 0 || stats.spaces > 0 || stats.apps > 0);

  return (
    <div className="border-t border-white/[0.06] px-5 py-3">
      <div className="flex items-center gap-3">
        {!stats ? (
          <span className="text-[10px] text-white/20">Loading...</span>
        ) : hasActivity ? (
          <>
            <span className="text-[10px] text-white/40">
              <span className="text-white/60 font-medium">{stats.students}</span> students
            </span>
            <span className="text-[10px] text-white/15">|</span>
            <span className="text-[10px] text-white/40">
              <span className="text-white/60 font-medium">{stats.spaces}</span> spaces
            </span>
            <span className="text-[10px] text-white/15">|</span>
            <span className="text-[10px] text-white/40">
              <span className="text-white/60 font-medium">{stats.apps}</span> apps built
            </span>
          </>
        ) : (
          <span className="text-[10px] text-white/25">Be the first to build at your campus</span>
        )}
      </div>
    </div>
  );
}
