'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LandingNav, Logo, NoiseOverlay, Button } from '@hive/ui/design-system/primitives';
import { ArrowRight } from 'lucide-react';

export function LandingHeader() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <NoiseOverlay />
      <header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: scrolled ? 'rgba(10, 10, 9, 0.8)' : 'transparent',
          backdropFilter: scrolled ? 'blur(12px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(12px)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid transparent',
        }}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Logo variant="mark" size="sm" color="gold" />
          <div className="flex items-center gap-6">
            <Link href="/about" className="text-sm text-white/40 hover:text-white/60 transition-colors">
              About
            </Link>
            <Button
              variant="primary"
              size="sm"
              className="rounded-full"
              trailingIcon={<ArrowRight />}
              onClick={() => router.push('/enter?schoolId=ub-buffalo&domain=buffalo.edu')}
            >
              Enter HIVE
            </Button>
          </div>
        </div>
      </header>
    </>
  );
}
