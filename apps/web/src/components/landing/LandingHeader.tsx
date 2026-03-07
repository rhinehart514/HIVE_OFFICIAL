'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { buildEnterUrl } from './entry-url';

export function LandingHeader() {
  const searchParams = useSearchParams();
  const enterHref = buildEnterUrl(searchParams.get('redirect'));
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-black/80 backdrop-blur-2xl border-b border-white/[0.10]'
          : 'bg-transparent'
      }`}
    >
      <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5" aria-label="HIVE home">
          <svg
            width="20"
            height="20"
            viewBox="0 0 1500 1500"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M432.83,133.2l373.8,216.95v173.77s-111.81,64.31-111.81,64.31v-173.76l-262.47-150.64-262.27,150.84.28,303.16,259.55,150.31,5.53-.33,633.4-365.81,374.52,215.84v433.92l-372.35,215.04h-2.88l-372.84-215.99-.27-174.53,112.08-63.56v173.76c87.89,49.22,174.62,101.14,262.48,150.69l261.99-151.64v-302.41s-261.51-151.27-261.51-151.27l-2.58.31-635.13,366.97c-121.32-69.01-241.36-140.28-362.59-209.44-4.21-2.4-8.42-5.15-13.12-6.55v-433.92l375.23-216h.96Z"
              fill="#FFD700"
            />
          </svg>
          <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-white/60">
            HIVE
          </span>
        </Link>

        <Link
          href={enterHref}
          className="rounded-full bg-white px-5 py-2 text-[13px] font-semibold text-black transition-opacity hover:opacity-90"
        >
          Get started
        </Link>
      </div>
    </header>
  );
}
