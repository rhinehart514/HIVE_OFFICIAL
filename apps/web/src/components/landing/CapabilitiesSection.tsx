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
      { threshold: 0.2 }
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
    { label: 'Sizzles', pct: 42 },
    { label: 'C3', pct: 31 },
    { label: 'Crossroads', pct: 18 },
    { label: 'Governors', pct: 9 },
  ];

  return (
    <div>
      <div className="mb-1 flex items-center gap-2">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#FFD700] opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#FFD700]" />
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/30">
          Live poll
        </span>
      </div>
      <h3 className={`${displayFont} mb-4 text-[20px] font-semibold text-white`}>
        Best dining hall?
      </h3>
      <div className="flex flex-col gap-2">
        {options.map((opt) => (
          <div key={opt.label} className="flex items-center gap-3">
            <span className="w-20 shrink-0 text-[12px] text-white/50">{opt.label}</span>
            <div className="relative h-6 flex-1 overflow-hidden rounded-full bg-white/[0.04]">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-white/[0.08]"
                style={{ width: `${opt.pct}%` }}
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 font-mono text-[10px] text-white/30">
                {opt.pct}%
              </span>
            </div>
          </div>
        ))}
      </div>
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
        <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/30">
          RSVP
        </span>
      </div>
      <h3 className={`${displayFont} mb-4 text-[20px] font-semibold text-white`}>
        Spring Formal
      </h3>
      <div className="mb-3">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[12px] text-white/50">{confirmed} confirmed</span>
          <span className="font-mono text-[11px] text-white/30">{total} spots</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/[0.04]">
          <div
            className="h-full rounded-full bg-white/[0.12]"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <div className="flex gap-2">
        <span className="rounded-full border border-white/[0.06] bg-white/[0.02] px-3 py-1 text-[11px] text-white/40">
          Sat, Apr 12
        </span>
        <span className="rounded-full border border-white/[0.06] bg-white/[0.02] px-3 py-1 text-[11px] text-white/40">
          Center for the Arts
        </span>
      </div>
    </div>
  );
}

function BracketCard() {
  const matchups = [
    { a: 'Dr. Smith', b: 'Dr. Lee', winner: 'a' },
    { a: 'Dr. Patel', b: 'Dr. Kim', winner: 'b' },
    { a: 'Dr. Chen', b: 'Dr. Jones', winner: 'a' },
  ];

  return (
    <div>
      <div className="mb-1">
        <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/30">
          Bracket
        </span>
      </div>
      <h3 className={`${displayFont} mb-4 text-[20px] font-semibold text-white`}>
        Best professor
      </h3>
      <div className="flex flex-col gap-2">
        {matchups.map((m, i) => (
          <div
            key={i}
            className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2"
          >
            <span
              className={`flex-1 text-[12px] ${m.winner === 'a' ? 'text-white' : 'text-white/30'}`}
            >
              {m.a}
            </span>
            <span className="font-mono text-[10px] text-white/20">vs</span>
            <span
              className={`flex-1 text-right text-[12px] ${m.winner === 'b' ? 'text-white' : 'text-white/30'}`}
            >
              {m.b}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
