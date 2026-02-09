'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Logo } from '@hive/ui/design-system/primitives';
import { ArrowRight } from 'lucide-react';

export function LandingHeader() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-200"
      style={{
        background: scrolled ? 'rgba(0, 0, 0, 0.9)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid transparent',
      }}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Logo variant="mark" size="sm" color="gold" />
        <div className="flex items-center gap-6">
          <Link href="/about" className="text-sm text-white/50 hover:text-white transition-colors">
            About
          </Link>
          <button
            onClick={() => {
              const redirect = searchParams.get('redirect');
              const enterUrl = redirect
                ? `/enter?schoolId=ub-buffalo&domain=buffalo.edu&redirect=${encodeURIComponent(redirect)}`
                : '/enter?schoolId=ub-buffalo&domain=buffalo.edu';
              router.push(enterUrl);
            }}
            className="px-4 py-2 bg-[#FFD700] text-black text-sm font-medium rounded-lg hover:bg-[#FFD700]/90 transition-colors flex items-center gap-2"
          >
            Join UB
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
