'use client';

/**
 * /welcome/claimed - Celebration / Completion
 *
 * "It's yours." or "You're all set."
 *
 * Emotional arc: POTENTIAL → ACTION
 * - Celebrate completion
 * - Clear next action (go to feed)
 * - Optional: show what's next
 */

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@hive/auth-logic';
import {
  WelcomeShell,
  WelcomeAction,
} from '@/components/onboarding';
import { GradientText, MOTION, PulseBorder } from '@hive/ui/design-system/primitives';
import { cn } from '@/lib/utils';

// Confetti animation (simple CSS-based)
function Confetti() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            backgroundColor: i % 2 === 0 ? 'var(--life-gold)' : 'white',
            opacity: 0.6,
          }}
          initial={{ y: -20, opacity: 0 }}
          animate={{
            y: '100vh',
            opacity: [0, 0.8, 0],
            rotate: Math.random() * 360,
          }}
          transition={{
            duration: 2 + Math.random() * 2,
            delay: Math.random() * 0.5,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  );
}

export default function ClaimedPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [showConfetti, setShowConfetti] = useState(true);

  // Check if user just claimed a space (from URL params)
  const claimedHandle = searchParams.get('claimed');
  const isFirstSpace = searchParams.get('first') === 'true';

  // Hide confetti after animation
  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleGoToFeed = () => {
    router.push('/feed');
  };

  const handleGoToSpace = () => {
    if (claimedHandle) {
      router.push(`/s/${claimedHandle}`);
    } else {
      router.push('/feed');
    }
  };

  const firstName = user?.displayName?.split(' ')[0] || 'there';

  return (
    <WelcomeShell currentStep={3} showSkip={false}>
      {showConfetti && <Confetti />}

      <div className="space-y-12 text-center">
        {/* Celebration Icon */}
        <motion.div
          className="flex justify-center"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            type: 'spring',
            stiffness: 200,
            damping: 15,
            delay: 0.2,
          }}
        >
          <PulseBorder color="gold" active className="rounded-full">
            <div className="w-20 h-20 rounded-full bg-[var(--life-gold)]/10 flex items-center justify-center">
              <motion.span
                className="text-4xl"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4, type: 'spring' }}
              >
                ✨
              </motion.span>
            </div>
          </PulseBorder>
        </motion.div>

        {/* Main Message */}
        <div className="space-y-4">
          <motion.h1
            className="text-heading-lg lg:text-display-sm font-semibold tracking-tight text-white"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: MOTION.duration.slow, delay: 0.3, ease: MOTION.ease.premium }}
          >
            {claimedHandle ? (
              <>
                <GradientText variant="gold">It&apos;s yours.</GradientText>
              </>
            ) : (
              <>
                You&apos;re{' '}
                <GradientText variant="gold">all set</GradientText>
              </>
            )}
          </motion.h1>

          <motion.p
            className="text-body-lg text-white/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: MOTION.duration.base, delay: 0.5, ease: MOTION.ease.premium }}
          >
            {claimedHandle
              ? `Welcome to @${claimedHandle}. Your community awaits.`
              : `Welcome to HIVE, ${firstName}. Time to explore.`}
          </motion.p>
        </div>

        {/* What's Next */}
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: MOTION.duration.base, delay: 0.7, ease: MOTION.ease.premium }}
        >
          {/* Quick Tips */}
          <div className="grid gap-3 text-left max-w-sm mx-auto">
            <QuickTip
              icon="🏠"
              text="Your feed shows activity from your spaces"
            />
            <QuickTip
              icon="🔍"
              text="Explore to discover more spaces and people"
            />
            <QuickTip
              icon="🛠️"
              text="HiveLab lets you build tools for your community"
            />
          </div>
        </motion.div>

        {/* CTAs */}
        <motion.div
          className="space-y-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: MOTION.duration.base, delay: 0.9, ease: MOTION.ease.premium }}
        >
          {claimedHandle ? (
            <>
              <WelcomeAction onClick={handleGoToSpace}>
                Go to @{claimedHandle}
              </WelcomeAction>
              <WelcomeAction variant="secondary" onClick={handleGoToFeed}>
                Go to feed
              </WelcomeAction>
            </>
          ) : (
            <WelcomeAction onClick={handleGoToFeed}>
              Go to feed
            </WelcomeAction>
          )}
        </motion.div>
      </div>
    </WelcomeShell>
  );
}

// Quick tip component
function QuickTip({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-center gap-3 text-body-sm">
      <span className="text-lg">{icon}</span>
      <span className="text-white/40">{text}</span>
    </div>
  );
}
