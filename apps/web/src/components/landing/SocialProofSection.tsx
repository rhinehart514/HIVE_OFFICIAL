'use client';

import { useState, useEffect, useRef } from 'react';

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

export function SocialProofSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  const [stats, setStats] = useState<{ students: number; spaces: number; apps: number } | null>(
    null
  );

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/campus/stats', { signal: controller.signal, cache: 'force-cache' })
      .then((r) => r.json())
      .then((d) => {
        if (d.data) setStats(d.data);
      })
      .catch(() => {
        /* use fallbacks */
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) {
      setVisible(true);
      return;
    }
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="bg-black px-6 py-24 md:py-32">
      <div className="mx-auto max-w-7xl">
        <div
          className={`mb-12 text-center transition-all duration-500 ease-out ${
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <h2
            className={`${clashDisplay} text-[clamp(28px,5vw,48px)] font-semibold tracking-tight text-white`}
          >
            Your campus is already here.
          </h2>
        </div>

        {/* Org name ticker */}
        <div
          className={`relative overflow-hidden py-6 transition-opacity duration-500 ${
            visible ? 'opacity-100' : 'opacity-0'
          }`}
        >
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
        </div>

        {/* Stats row */}
        <div
          className={`mt-8 flex flex-wrap items-center justify-center gap-8 md:gap-16 transition-all duration-500 ease-out delay-100 ${
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <StatBlock
            label="organizations"
            value={stats ? `${stats.spaces.toLocaleString()}+` : '600+'}
          />
          <div className="hidden h-8 w-px bg-white/[0.06] sm:block" />
          <StatBlock label="students" value={stats ? stats.students.toLocaleString() : '—'} />
          <div className="hidden h-8 w-px bg-white/[0.06] sm:block" />
          <StatBlock label="idea to live app" value={stats ? '<60s' : '<60s'} />
        </div>
      </div>

      {/* Marquee animation */}
      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-marquee {
            animation: none;
          }
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
      <div className="mt-1 font-mono text-[11px] uppercase tracking-[0.1em] text-white/30">
        {label}
      </div>
    </div>
  );
}
