'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

const displayFont = "font-display";

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

const STUDENT_THRESHOLD = 50; // Don't show student count below this

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
      { threshold: 0.2 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const showStudents = stats && stats.students >= STUDENT_THRESHOLD;

  return (
    <section ref={sectionRef} className="bg-[var(--bg-void)] px-6 py-16 md:py-24">
      <div className="mx-auto max-w-7xl">
        <div
          className={`mb-8 text-center transition-[opacity,transform] duration-500 ease-out ${
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
          }`}
        >
          <h2
            className={`${displayFont} text-[clamp(28px,5vw,48px)] font-semibold tracking-tight text-white`}
          >
            Your campus is already here.
          </h2>
        </div>

        {/* Org name ticker */}
        <div
          className={`relative overflow-hidden py-4 transition-opacity duration-500 ${
            visible ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-black to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-black to-transparent" />

          <div className="flex gap-3 animate-marquee">
            {[...UB_ORGS, ...UB_ORGS].map((org, i) => (
              <span
                key={`${org}-${i}`}
                className="shrink-0 rounded-full border border-white/[0.12] bg-white/[0.06] px-4 py-2 text-[13px] text-white/70"
              >
                {org}
              </span>
            ))}
          </div>
        </div>

        {/* Stats row */}
        <div
          className={`mt-6 flex flex-wrap items-center justify-center gap-8 md:gap-16 transition-[opacity,transform] duration-500 ease-out delay-100 ${
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
          }`}
        >
          <CountUpStat
            label="organizations"
            target={stats ? Math.max(stats.spaces, 650) : 650}
            suffix="+"
            visible={visible}
          />
          {showStudents && (
            <>
              <div className="hidden h-8 w-px bg-white/[0.06] sm:block" />
              <CountUpStat
                label="students"
                target={stats.students}
                visible={visible}
              />
            </>
          )}
          <div className="hidden h-8 w-px bg-white/[0.06] sm:block" />
          <StatBlock label="idea to live app" value="<60s" />
        </div>
      </div>

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

function CountUpStat({
  label,
  target,
  suffix = '',
  visible,
}: {
  label: string;
  target: number;
  suffix?: string;
  visible: boolean;
}) {
  const [count, setCount] = useState(0);
  const hasAnimated = useRef(false);

  const animate = useCallback(() => {
    if (hasAnimated.current) return;
    hasAnimated.current = true;

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) {
      setCount(target);
      return;
    }

    const duration = 1200;
    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target]);

  useEffect(() => {
    if (visible && target > 0) animate();
  }, [visible, target, animate]);

  return (
    <div className="text-center">
      <div className={`${displayFont} text-[clamp(28px,4vw,40px)] font-semibold text-white`}>
        {count.toLocaleString()}{suffix}
      </div>
      <div className="mt-1 font-mono text-[11px] uppercase tracking-label text-white/30">
        {label}
      </div>
    </div>
  );
}

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div className={`${displayFont} text-[clamp(28px,4vw,40px)] font-semibold text-white`}>
        {value}
      </div>
      <div className="mt-1 font-mono text-[11px] uppercase tracking-label text-white/30">
        {label}
      </div>
    </div>
  );
}
