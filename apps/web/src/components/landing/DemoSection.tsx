'use client';

import { useEffect, useRef, useState } from 'react';

const clashDisplay = "font-[family-name:'Clash_Display',var(--font-clash)]";

const PROMPT_TEXT = '"Best dining hall on campus?"';
const CHAR_DELAY = 50;

const POLL_OPTIONS = [
  { label: 'Sizzles', pct: 42 },
  { label: 'C3', pct: 31 },
  { label: 'Crossroads', pct: 18 },
  { label: 'Governors', pct: 9 },
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

  // Intersection observer to trigger animation
  useEffect(() => {
    if (prefersReduced) return;
    const el = sectionRef.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && phase === 'idle') {
          setPhase('typing');
          obs.disconnect();
        }
      },
      { threshold: 0.4 }
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
    <section ref={sectionRef} className="bg-black px-6 py-24 md:py-32">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <span className="mb-3 block font-mono text-[11px] uppercase tracking-[0.2em] text-[#FFD700]/70">
            How it works
          </span>
          <h2
            className={`${clashDisplay} text-[clamp(28px,5vw,48px)] font-semibold tracking-tight text-white`}
          >
            One sentence. Live app.
          </h2>
        </div>

        {/* Demo frame */}
        <div className="mx-auto max-w-lg rounded-2xl border border-white/[0.08] bg-[#0A0A0A]">
          {/* Prompt area */}
          <div className="border-b border-white/[0.08] px-5 py-4">
            <div className="rounded-xl border border-white/[0.06] bg-black px-4 py-3 font-mono text-[13px] text-white/50">
              {typed}
              {phase === 'typing' && (
                <span className="ml-0.5 inline-block h-4 w-[2px] bg-[#FFD700] animate-pulse" />
              )}
              {phase === 'idle' && !prefersReduced && (
                <span className="ml-0.5 inline-block h-4 w-[2px] bg-white/20" />
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
              <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/30">
                Live
              </span>
            </div>

            {/* Poll options */}
            <div className="flex flex-col gap-2">
              {POLL_OPTIONS.map((opt) => (
                <div key={opt.label} className="flex items-center gap-3">
                  <span className="w-24 shrink-0 text-[13px] text-white/50">{opt.label}</span>
                  <div className="relative h-7 flex-1 overflow-hidden rounded-full bg-white/[0.04]">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full bg-white/[0.08] transition-all duration-700 ease-out"
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

        {/* Stats row */}
        <div className="mt-8 flex items-center justify-center gap-8 text-center">
          <div>
            <div className={`${clashDisplay} text-[24px] font-semibold text-white`}>600+</div>
            <div className="mt-1 font-mono text-[11px] uppercase tracking-[0.1em] text-white/30">
              spaces
            </div>
          </div>
          <div className="h-8 w-px bg-white/[0.06]" />
          <div>
            <div className={`${clashDisplay} text-[24px] font-semibold text-white`}>&lt;60s</div>
            <div className="mt-1 font-mono text-[11px] uppercase tracking-[0.1em] text-white/30">
              idea to live app
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
