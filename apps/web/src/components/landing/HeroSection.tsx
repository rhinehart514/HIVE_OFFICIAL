'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { buildEnterUrl } from './entry-url';

const clashDisplay = "font-[family-name:'Clash_Display',var(--font-clash)]";

export function HeroSection() {
  const searchParams = useSearchParams();
  const enterHref = buildEnterUrl(searchParams.get('redirect'));
  const [step, setStep] = useState(0); // 0=hidden, 1=headline, 2=subline, 3=cta

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) {
      setStep(3);
      return;
    }
    const t1 = setTimeout(() => setStep(1), 100);
    const t2 = setTimeout(() => setStep(2), 300);
    const t3 = setTimeout(() => setStep(3), 500);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  const show = (n: number) =>
    step >= n ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3';

  return (
    <section className="relative flex min-h-[100dvh] flex-col items-center justify-center bg-black px-6">
      <div className="mx-auto max-w-3xl text-center">
        <h1
          className={`${clashDisplay} mb-6 text-[clamp(40px,8vw,56px)] font-semibold leading-[1.05] tracking-[-0.03em] text-white transition-all duration-500 ${show(1)}`}
          style={{ transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)' }}
        >
          Say something.
          <br />
          Your campus responds.
        </h1>

        <p
          className={`mx-auto mb-10 max-w-md text-[15px] leading-relaxed text-white/50 transition-all duration-500 ${show(2)}`}
          style={{ transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)' }}
        >
          Type a sentence. HIVE turns it into a live app.{' '}
          Your campus uses it.
        </p>

        <div
          className={`flex flex-col items-center gap-4 transition-all duration-500 ${show(3)}`}
          style={{ transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)' }}
        >
          <Link
            href={enterHref}
            className="rounded-full bg-[#FFD700] px-8 py-3.5 text-[15px] font-semibold text-black transition-opacity hover:opacity-90"
          >
            Get started
          </Link>
          <p className="font-mono text-[11px] text-white/30">
            free · .edu email · takes 30 seconds
          </p>
        </div>
      </div>

      {/* Scroll indicator */}
      <div
        className={`absolute bottom-8 left-1/2 -translate-x-1/2 transition-opacity duration-700 delay-700 ${
          step >= 3 ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="flex flex-col items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/20">
            Scroll
          </span>
          <div className="h-6 w-px bg-white/10" />
        </div>
      </div>
    </section>
  );
}
