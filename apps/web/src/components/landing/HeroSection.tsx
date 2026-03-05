'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { buildEnterUrl } from './entry-url';

const clashDisplay = "font-[family-name:'Clash_Display',var(--font-clash)]";

export function HeroSection() {
  const searchParams = useSearchParams();
  const enterHref = buildEnterUrl(searchParams.get('redirect'));
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) {
      setVisible(true);
      return;
    }
    // Small delay so the fade-up feels intentional
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <section className="relative flex min-h-[100dvh] flex-col items-center justify-center bg-black px-6">
      <div
        className={`mx-auto max-w-3xl text-center transition-all duration-500 ease-out ${
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
        style={{ transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)' }}
      >
        <h1
          className={`${clashDisplay} mb-6 text-[clamp(40px,8vw,56px)] font-semibold leading-[1.05] tracking-[-0.03em] text-white`}
        >
          Say something.
          <br />
          Your campus responds.
        </h1>

        <p className="mx-auto mb-10 max-w-md text-[15px] leading-relaxed text-white/50">
          Type a sentence. HIVE turns it into a live app.
          <br className="hidden sm:block" />
          Your campus uses it.
        </p>

        <div className="flex flex-col items-center gap-4">
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
        className={`absolute bottom-8 left-1/2 -translate-x-1/2 transition-opacity duration-500 ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="flex flex-col items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/30">
            Scroll
          </span>
          <div className="h-8 w-px bg-white/10" />
        </div>
      </div>
    </section>
  );
}
