'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Logo } from '@hive/ui/design-system/primitives';
import { ArrowRight } from 'lucide-react';
import { buildUbEnterUrl } from './entry-url';

export function LandingHeader() {
  const searchParams = useSearchParams();
  const [scrolled, setScrolled] = useState(false);
  const claimHref = buildUbEnterUrl(searchParams.get('redirect'), '/spaces?claim=true');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-200"
      style={{
        background: scrolled ? 'rgba(0, 0, 0, 0.95)' : 'transparent',
        borderBottom: scrolled ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid transparent',
      }}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Logo variant="mark" size="sm" color="gold" />
        <div className="flex items-center gap-6">
          <Link href="/about" className="text-sm text-white/50 hover:text-white transition-colors">
            About
          </Link>
          <Link href="/leaders" className="text-sm text-white/50 hover:text-white transition-colors">
            Leaders
          </Link>
          <Link
            href={claimHref}
            className="px-4 py-2 bg-[var(--life-gold,#FFD700)] text-black text-sm font-medium rounded-full hover:bg-[var(--life-gold,#FFD700)]/90 transition-colors flex items-center gap-2"
          >
            Claim your club
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}
