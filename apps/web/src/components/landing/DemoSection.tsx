'use client';

import { useEffect, useRef, useState } from 'react';

const displayFont = "font-display";

const PROMPT_TEXT = '"Best late-night food near campus?"';
const CHAR_DELAY = 50;

const POLL_OPTIONS = [
  { label: "Jim's Steakout", pct: 42 },
  { label: "Danny's", pct: 31 },
  { label: 'Mighty Taco', pct: 18 },
  { label: 'Insomnia Cookies', pct: 9 },
];

export function DemoSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [phase, setPhase] = useState<'idle' | 'typing' | 'poll' | 'done'>('idle');
  const [typed, setTyped] = useState('');
  const [pollVisible, setPollVisible] = useState(false);
  const [barsAnimated, setBarsAnimated] = useState(false);
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) {
      setPrefersReduced(true);
      setTyped(PROMPT_TEXT);
      setPollVisible(true);
      setBarsAnimated(true);
      setPhase('done');
    }
  }, []);

  // Intersection observer — low threshold + delay so user sees the typing
  useEffect(() => {
    if (prefersReduced) return;
    const el = sectionRef.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && phase === 'idle') {
          obs.disconnect();
          // Small delay so the frame is in view before typing starts
          setTimeout(() => setPhase('typing'), 400);
        }
      },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [phase, prefersReduced]);

  // Typing animation
  useEffect(() => {
    if (phase !== 'typing') return;
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setTyped(PROMPT_TEXT.slice(0, i));
      if (i >= PROMPT_TEXT.length) {
        clearInterval(interval);
        setTimeout(() => {
          setPhase('poll');
          setPollVisible(true);
          setTimeout(() => setBarsAnimated(true), 300);
        }, 400);
      }
    }, CHAR_DELAY);
    return () => clearInterval(interval);
  }, [phase]);

  return (
    <section ref={sectionRef} className="bg-[var(--bg-void)] px-6 py-16 md:py-24">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <span className="mb-3 block font-mono text-[11px] uppercase tracking-[0.2em] text-[#FFD700]/70">
            Watch this
          </span>
          <h2
            className={`${displayFont} text-[clamp(28px,5vw,48px)] font-semibold tracking-tight text-white`}
          >
            Type it. Share it. Done.
          </h2>
        </div>

        {/* Demo frame */}
        <div className="relative mx-auto max-w-lg">
          {/* Gold radial glow behind demo */}
          <div
            className="pointer-events-none absolute -inset-12"
            style={{
              background: 'radial-gradient(circle at center, rgba(255,215,0,0.04), transparent 60%)',
            }}
          />
        <div className="relative rounded-2xl border border-white/[0.10] bg-[var(--bg-card)]">
          {/* Prompt area */}
          <div className="border-b border-white/[0.10] px-5 py-4">
            <div className="rounded-xl border border-white/[0.05] bg-[var(--bg-void)] px-4 py-3 font-mono text-[13px] text-white/50">
              {typed}
              {phase === 'typing' && (
                <span
                  className="ml-0.5 inline-block h-4 w-[2px] bg-[#FFD700]"
                  style={{ animation: 'pulse 1.2s cubic-bezier(0.4,0,0.6,1) infinite' }}
                />
              )}
              {phase === 'idle' && !prefersReduced && (
                <span className="ml-0.5 inline-block h-4 w-[2px] bg-white/30" />
              )}
            </div>
          </div>

          {/* Poll result */}
          <div
            className={`px-5 py-4 transition-opacity duration-300 ${
              pollVisible ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {/* LIVE indicator */}
            <div className="mb-3 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#FFD700] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#FFD700]" />
              </span>
              <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-white/30">
                Live
              </span>
            </div>

            {/* Poll options */}
            <div className="flex flex-col gap-2">
              {POLL_OPTIONS.map((opt) => (
                <div key={opt.label} className="flex items-center gap-3">
                  <span className="w-24 shrink-0 text-[13px] text-white/50">{opt.label}</span>
                  <div className="relative h-7 flex-1 overflow-hidden rounded-full bg-white/[0.05]">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full bg-white/[0.10] transition-[width] duration-700 ease-out"
                      style={{ width: barsAnimated ? `${opt.pct}%` : '0%' }}
                    />
                    <span
                      className={`absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[11px] text-white/30 transition-opacity duration-300 ${
                        barsAnimated ? 'opacity-100' : 'opacity-0'
                      }`}
                    >
                      {opt.pct}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        </div>
      </div>
    </section>
  );
}
