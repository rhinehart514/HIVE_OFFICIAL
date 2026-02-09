'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  motion,
  WordReveal,
  FadeUp,
  ScrollIndicator,
  Parallax,
  Magnetic,
  Button,
} from '@hive/ui/design-system/primitives';
import { ArrowRight } from 'lucide-react';

const clashDisplay = "font-[family-name:'Clash_Display',var(--hive-font-display)]";

export function HeroSection() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const handleJoinUB = useCallback(() => {
    const redirect = searchParams.get('redirect');
    const enterUrl = redirect
      ? `/enter?schoolId=ub-buffalo&domain=buffalo.edu&redirect=${encodeURIComponent(redirect)}`
      : '/enter?schoolId=ub-buffalo&domain=buffalo.edu';
    router.push(enterUrl);
  }, [router, searchParams]);

  const handleCreateSpace = useCallback(() => {
    router.push(`/enter?redirect=${encodeURIComponent('/spaces?create=true')}`);
  }, [router]);

  if (!mounted) return <section className="min-h-screen" />;

  return (
    <section className="min-h-screen relative flex flex-col">
      <div className="max-w-7xl mx-auto px-6 pt-32 pb-24 flex-1 flex flex-col">
        {/* Eyebrow */}
        <motion.div
          className="mb-auto flex items-center gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <span className="w-2 h-2 rounded-full bg-[#FFD700]" />
          <p className="text-[11px] uppercase tracking-[0.3em] text-white/30">
            Live at University at Buffalo
          </p>
        </motion.div>

        {/* Giant headline */}
        <div className="flex-1 flex items-center py-12">
          <div className="relative">
            <h1 className={`${clashDisplay} text-[clamp(52px,13vw,150px)] font-semibold leading-[0.88] tracking-[-0.03em]`}>
              <span className="block">
                <WordReveal text="build it." delay={0.3} stagger={0.08} className="text-white/30" />
              </span>
              <span className="text-white block">
                <WordReveal text="share it." delay={0.5} stagger={0.08} />
              </span>
            </h1>

            {/* Gold accent line */}
            <motion.div
              className="absolute -left-6 top-1/2 -translate-y-1/2 w-px h-16 bg-gradient-to-b from-transparent via-[#FFD700]/40 to-transparent"
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: 1, delay: 0.8 }}
            />
          </div>
        </div>

        {/* Bottom row */}
        <FadeUp delay={0.6} className="mt-auto">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-12">
            <div className="md:max-w-md">
              <p className="text-base text-white/40 leading-relaxed mb-8">
                Your campus, your spaces, your tools. Build in seconds, share anywhere, and run live tools your community actually uses.
              </p>
              <div className="flex flex-wrap gap-4">
                <Magnetic>
                  <Button
                    variant="primary"
                    size="lg"
                    className="rounded-full"
                    trailingIcon={<ArrowRight />}
                    onClick={handleJoinUB}
                  >
                    Join UB
                  </Button>
                </Magnetic>
                <Button
                  variant="secondary"
                  size="lg"
                  className="rounded-full"
                  onClick={handleCreateSpace}
                >
                  Create a space
                </Button>
              </div>
            </div>

            {/* Parallax ghost number */}
            <Parallax speed={-0.3} className="hidden md:block">
              <p className={`${clashDisplay} text-[100px] font-semibold leading-none text-[#FFD700]/[0.04] select-none`}>
                01
              </p>
            </Parallax>
          </div>
        </FadeUp>
      </div>

      {/* Scroll indicator */}
      <ScrollIndicator
        className="absolute bottom-8 left-6"
        text="Scroll"
        pulse
      />
    </section>
  );
}
