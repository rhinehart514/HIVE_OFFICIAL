'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { buildUbEnterUrl } from './entry-url';

export function LandingHeader() {
  const searchParams = useSearchParams();
  const enterHref = buildUbEnterUrl(searchParams.get('redirect'));

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/60 backdrop-blur-xl">
      <div className="px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2" aria-label="HIVE home">
          <span className="h-5 w-5 rounded-full bg-[#FFD700]" aria-hidden />
          <span className="font-sans text-[11px] font-medium uppercase tracking-[0.18em] text-white/50">
            HIVE
          </span>
        </Link>

        {/* Single CTA */}
        <Link
          href={enterHref}
          className="px-5 py-2 bg-[#FFD700] text-black text-[13px] font-medium rounded-full hover:opacity-90 transition-opacity"
        >
          Join UB
        </Link>
      </div>
    </header>
  );
}
