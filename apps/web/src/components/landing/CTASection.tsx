'use client';

import { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import {
  RevealSection,
  FadeUp,
  Magnetic,
  Button,
} from '@hive/ui/design-system/primitives';
import { ArrowRight } from 'lucide-react';
import { WaitlistModal } from './WaitlistModal';

const clashDisplay = "font-[family-name:'Clash_Display',var(--hive-font-display)]";

export function CTASection() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [requestSchool, setRequestSchool] = useState<{ id: string; name: string; domain: string; isActive?: boolean } | null>(null);

  const handleEnter = useCallback(() => {
    const redirect = searchParams.get('redirect');
    const enterUrl = redirect
      ? `/enter?schoolId=ub-buffalo&domain=buffalo.edu&redirect=${encodeURIComponent(redirect)}`
      : '/enter?schoolId=ub-buffalo&domain=buffalo.edu';
    router.push(enterUrl);
  }, [router, searchParams]);

  const handleWaitlist = useCallback(() => {
    setRequestSchool({ id: 'other', name: 'your school', domain: '', isActive: false });
  }, []);

  return (
    <RevealSection className="py-32 md:py-40 border-t border-white/[0.04]">
      <div className="max-w-7xl mx-auto px-6">
        {/* Gold gradient line */}
        <div className="w-16 h-px bg-gradient-to-r from-[#FFD700]/40 to-transparent mb-12" />

        <FadeUp>
          <h2 className={`${clashDisplay} text-[clamp(28px,4.5vw,40px)] font-semibold leading-[1.1] tracking-[-0.02em] mb-4`}>
            <span className="text-white">What will you</span>
            <br />
            <span className="text-white/20">build first?</span>
          </h2>
          <p className="text-base text-white/30 mb-10">
            Pick a template. Make it yours. Share the link.
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
                onClick={handleEnter}
              >
                Start building
              </Button>
            </Magnetic>
            <Button
              variant="secondary"
              size="xl"
              className="rounded-full"
              onClick={handleWaitlist}
            >
              Get notified
            </Button>
          </div>
        </FadeUp>
      </div>

      <AnimatePresence>
        {requestSchool && <WaitlistModal school={requestSchool} onClose={() => setRequestSchool(null)} />}
      </AnimatePresence>
    </RevealSection>
  );
}
