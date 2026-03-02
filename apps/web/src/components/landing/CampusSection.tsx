'use client';

import { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

const clashDisplay = "font-[family-name:'Clash_Display',var(--font-clash)]";

const UB_ORGS = [
  'SWE Club',
  'Dance Marathon',
  'Alpha Phi',
  'UB Esports',
  'Society of Asian Scientists & Engineers',
  'UB Hacking',
  'Pre-Med Society',
  'Black Student Union',
  'Residence Hall Association',
  'Club Running',
  'UB Debate',
  'Engineers Without Borders',
] as const;

export function CampusSection() {
  const prefersReduced = useReducedMotion();
  const [stats, setStats] = useState<{ students: number; spaces: number; apps: number } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/campus/stats', { signal: controller.signal, cache: 'force-cache' })
      .then((r) => r.json())
      .then((d) => {
        if (d.data) setStats(d.data);
      })
      .catch(() => {/* use fallbacks */});
    return () => controller.abort();
  }, []);

  const reveal = (delay = 0) =>
    prefersReduced
      ? {}
      : {
          initial: { opacity: 0, y: 20 } as const,
          whileInView: { opacity: 1, y: 0 } as const,
          viewport: { once: true, margin: '-60px' } as const,
          transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1], delay },
        };

  return (
    <section className="bg-black px-6 py-24 md:py-32">
      <div className="mx-auto max-w-7xl">
        <motion.div {...reveal()} className="mb-12 text-center">
          <span className="mb-3 block font-mono text-[11px] uppercase tracking-[0.2em] text-[#FFD700]/70">
            Live at University at Buffalo
          </span>
          <h2
            className={`${clashDisplay} text-[clamp(28px,5vw,48px)] font-semibold tracking-tight text-white`}
          >
            HIVE at UB
          </h2>
          <p className="mt-4 mx-auto max-w-lg text-base text-white/40">
            600+ student organizations already on HIVE. Your club, your frat, your study group — they&apos;re all here.
          </p>
        </motion.div>

        {/* Org name ticker */}
        <motion.div {...reveal(0.1)} className="relative overflow-hidden py-6">
          {/* Fade edges */}
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-black to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-black to-transparent" />

          <div className="flex gap-3 animate-marquee">
            {[...UB_ORGS, ...UB_ORGS].map((org, i) => (
              <span
                key={`${org}-${i}`}
                className="shrink-0 rounded-full border border-white/[0.06] bg-white/[0.02] px-4 py-2 text-[13px] text-white/50"
              >
                {org}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Stats row */}
        <motion.div
          {...reveal(0.15)}
          className="mt-8 flex flex-wrap items-center justify-center gap-8 md:gap-16"
        >
          <StatBlock label="organizations" value={stats ? `${stats.spaces.toLocaleString()}+` : '600+'} />
          <div className="h-8 w-px bg-white/[0.06] hidden sm:block" />
          <StatBlock label="students" value={stats ? stats.students.toLocaleString() : '—'} />
          <div className="h-8 w-px bg-white/[0.06] hidden sm:block" />
          <StatBlock label="apps made" value={stats ? `${stats.apps}` : '—'} />
        </motion.div>
      </div>

      {/* Marquee animation */}
      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
      `}</style>
    </section>
  );
}

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div className={`${clashDisplay} text-[clamp(28px,4vw,40px)] font-semibold text-white`}>
        {value}
      </div>
      <div className="mt-1 text-[12px] text-white/30 uppercase tracking-[0.1em]">{label}</div>
    </div>
  );
}
