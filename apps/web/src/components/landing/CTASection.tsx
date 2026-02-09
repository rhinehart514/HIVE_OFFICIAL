'use client';

import { useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  RevealSection,
  FadeUp,
  Magnetic,
  Button,
} from '@hive/ui/design-system/primitives';
import { ArrowRight } from 'lucide-react';

const clashDisplay = "font-[family-name:'Clash_Display',var(--hive-font-display)]";

export function CTASection() {
  const router = useRouter();
  const searchParams = useSearchParams();

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

  return (
    <RevealSection className="py-32 md:py-40 border-t border-white/[0.04]">
      <div className="max-w-7xl mx-auto px-6">
        {/* Gold gradient line */}
        <div className="w-16 h-px bg-gradient-to-r from-[#FFD700]/40 to-transparent mb-12" />

        <FadeUp>
          <h2 className={`${clashDisplay} text-[clamp(28px,4.5vw,40px)] font-semibold leading-[1.1] tracking-[-0.02em] mb-4`}>
            <span className="text-white">Build something real.</span>
            <br />
            <span className="text-white/20">Share it everywhere.</span>
          </h2>
          <p className="text-base text-white/30 mb-10">
            From idea to live tool in 30 seconds. No code, no app store, no waiting.
          </p>
        </FadeUp>

        <FadeUp delay={0.2}>
          <div className="flex flex-wrap gap-4">
            <Magnetic>
              <Button
                variant="primary"
                size="xl"
                className="rounded-full"
                trailingIcon={<ArrowRight />}
                onClick={handleJoinUB}
              >
                Join UB
              </Button>
            </Magnetic>
            <Button
              variant="secondary"
              size="xl"
              className="rounded-full"
              onClick={handleCreateSpace}
            >
              Create a space
            </Button>
          </div>
        </FadeUp>
      </div>
    </RevealSection>
  );
}
