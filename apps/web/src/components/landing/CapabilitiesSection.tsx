'use client';

import { useEffect, useRef, useState } from 'react';

const displayFont = "font-sans";

export function CapabilitiesSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

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
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="bg-black px-6 py-16 md:py-24">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <span className="mb-3 block font-mono text-[11px] uppercase tracking-[0.2em] text-white/50">
            What students are making
          </span>
          <h2
            className={`${displayFont} text-[clamp(28px,5vw,48px)] font-semibold tracking-tight text-white`}
          >
            Apps your campus actually uses.
          </h2>
        </div>

        {/* 3-col grid */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card delay={0} visible={visible}>
            <PollCard />
          </Card>
          <Card delay={100} visible={visible}>
            <RSVPCard />
          </Card>
          <Card delay={200} visible={visible}>
            <BracketCard />
          </Card>
        </div>
      </div>
    </section>
  );
}

function Card({
  children,
  delay,
  visible,
}: {
  children: React.ReactNode;
  delay: number;
  visible: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border border-white/[0.08] bg-[#0A0A0A] p-6 transition-all duration-500 ease-out ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
      style={{
        transitionDelay: `${delay}ms`,
        transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
      }}
    >
      {children}
    </div>
  );
}

function PollCard() {
  const options = [
    { label: "Jim's Steakout", pct: 42 },
    { label: "Danny's", pct: 31 },
    { label: 'Mighty Taco', pct: 18 },
    { label: 'Insomnia Cookies', pct: 9 },
  ];

  return (
    <div>
      <div className="mb-1 flex items-center gap-2">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#FFD700] opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#FFD700]" />
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/50">
          Live poll
        </span>
      </div>
      <h3 className={`${displayFont} mb-4 text-[20px] font-semibold text-white`}>
        Best late-night food?
      </h3>
      <div className="flex flex-col gap-2">
        {options.map((opt, i) => (
          <div
            key={opt.label}
            className="group relative h-10 overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.03]"
          >
            {/* Fill bar */}
            <div
              className={`absolute inset-y-0 left-0 rounded-xl ${
                i === 0 ? 'bg-white/[0.12]' : 'bg-white/[0.06]'
              }`}
              style={{ width: `${opt.pct}%` }}
            />
            {/* Content */}
            <div className="relative z-10 flex h-full items-center justify-between px-3">
              <span className={`text-[13px] ${i === 0 ? 'text-white font-medium' : 'text-white/60'}`}>
                {opt.label}
              </span>
              <span className={`font-mono text-[12px] tabular-nums ${i === 0 ? 'text-white' : 'text-white/40'}`}>
                {opt.pct}%
              </span>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[12px] text-white/30">
        284 votes
      </p>
    </div>
  );
}

function RSVPCard() {
  const total = 200;
  const confirmed = 147;
  const pct = Math.round((confirmed / total) * 100);

  return (
    <div>
      <div className="mb-1">
        <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/50">
          RSVP
        </span>
      </div>
      <h3 className={`${displayFont} mb-4 text-[20px] font-semibold text-white`}>
        SGA Town Hall
      </h3>

      {/* Attendance bar */}
      <div className="mb-4">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[13px] text-white/60">
            <span className="text-white font-medium">{confirmed}</span> going
          </span>
          <span className="font-mono text-[12px] text-white/30">{total} spots</span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className="h-full rounded-full bg-white/30"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Meta pills */}
      <div className="flex gap-2">
        <span className="rounded-full border border-white/[0.10] bg-white/[0.04] px-3 py-1.5 text-[12px] text-white/50">
          Sat, Apr 12
        </span>
        <span className="rounded-full border border-white/[0.10] bg-white/[0.04] px-3 py-1.5 text-[12px] text-white/50">
          Student Union 230
        </span>
      </div>
    </div>
  );
}

function BracketCard() {
  const matchups = [
    { a: 'Hertz', b: 'Alphonce', winner: 'b' },
    { a: 'Hartloff', b: 'Sridhar', winner: 'b' },
    { a: 'Nasri', b: 'Lund', winner: 'a' },
  ];

  return (
    <div>
      <div className="mb-1">
        <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/50">
          Bracket
        </span>
      </div>
      <h3 className={`${displayFont} mb-4 text-[20px] font-semibold text-white`}>
        Best CSE professor
      </h3>
      <div className="flex flex-col gap-2">
        {matchups.map((m, i) => {
          const winnerName = m.winner === 'a' ? m.a : m.b;
          return (
            <div
              key={i}
              className="flex items-center overflow-hidden rounded-xl border border-white/[0.08]"
            >
              {/* Side A */}
              <div
                className={`flex-1 px-3 py-2.5 text-[13px] ${
                  m.winner === 'a'
                    ? 'bg-white/[0.08] text-white font-medium'
                    : 'bg-white/[0.02] text-white/30'
                }`}
              >
                {m.a}
              </div>
              {/* Divider */}
              <span className="shrink-0 bg-white/[0.04] px-2 py-2.5 font-mono text-[10px] text-white/20">
                vs
              </span>
              {/* Side B */}
              <div
                className={`flex-1 px-3 py-2.5 text-right text-[13px] ${
                  m.winner === 'b'
                    ? 'bg-white/[0.08] text-white font-medium'
                    : 'bg-white/[0.02] text-white/30'
                }`}
              >
                {m.b}
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-[12px] text-white/30">
        Round 2 of 4
      </p>
    </div>
  );
}
