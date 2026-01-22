'use client';

/**
 * /welcome - First step of onboarding
 *
 * "Welcome, [name]. You're in."
 *
 * Emotional arc: RECOGNITION → OWNERSHIP
 * - Show user's name (recognition of identity)
 * - Communicate they've made it (achievement)
 * - Single CTA to continue
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@hive/auth-logic';
import {
  WelcomeShell,
  WelcomeHeading,
  WelcomeAction,
} from '@/components/onboarding';
import { GradientText, MOTION } from '@hive/ui/design-system/primitives';

export default function WelcomePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isReady, setIsReady] = useState(false);

  // Extract first name from display name or email
  const firstName = user?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || 'there';

  // Delay entrance animation for dramatic effect
  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 300);
    return () => clearTimeout(timer);
  }, []);

  const handleContinue = () => {
    router.push('/welcome/identity');
  };

  return (
    <WelcomeShell currentStep={0} skipLabel="Skip setup">
      <div className="space-y-12">
        {/* Hero Message */}
        <div className="text-center space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isReady ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: MOTION.duration.slow, ease: MOTION.ease.premium }}
          >
            <h1 className="text-[40px] lg:text-[48px] font-semibold tracking-tight text-white">
              Welcome,{' '}
              <GradientText variant="gold">
                {firstName}
              </GradientText>
            </h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={isReady ? { opacity: 1 } : {}}
            transition={{ duration: MOTION.duration.base, delay: 0.4, ease: MOTION.ease.premium }}
          >
            <p className="text-[18px] text-white/60">
              You&apos;re in.
            </p>
          </motion.div>
        </div>

        {/* Supporting Copy */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={isReady ? { opacity: 1 } : {}}
          transition={{ duration: MOTION.duration.base, delay: 0.6, ease: MOTION.ease.premium }}
        >
          <p className="text-[14px] text-white/40 max-w-[280px] mx-auto leading-relaxed">
            Let&apos;s set up your space. It only takes a minute, and you&apos;ll be ready to connect with your campus.
          </p>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={isReady ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: MOTION.duration.base, delay: 0.8, ease: MOTION.ease.premium }}
        >
          <WelcomeAction onClick={handleContinue}>
            Let&apos;s go
          </WelcomeAction>
        </motion.div>
      </div>
    </WelcomeShell>
  );
}
