'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { buildUbEnterUrl } from './entry-url';

export function LandingHeader() {
  const searchParams = useSearchParams();
  const enterHref = buildUbEnterUrl(searchParams.get('redirect'));
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
          ? 'bg-black/80 backdrop-blur-2xl border-b border-white/[0.06]'
          : 'bg-transparent'
      }`}
    >
      <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5" aria-label="HIVE home">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M12 2L3 7v10l9 5 9-5V7l-9-5z"
              fill="#FFD700"
              fillOpacity="0.9"
            />
          </svg>
          <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-white/60">
            HIVE
          </span>
        </Link>

        <Link
          href={enterHref}
          className="rounded-full bg-[#FFD700] px-5 py-2 text-[13px] font-medium text-black transition-opacity hover:opacity-90"
        >
          Join your campus
        </Link>
      </div>
    </header>
  );
}
