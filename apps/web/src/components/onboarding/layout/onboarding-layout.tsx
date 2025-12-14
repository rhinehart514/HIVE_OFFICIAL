'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Check } from 'lucide-react';
import { HiveLogo } from '@hive/ui';

type OnboardingStep = 'userType' | 'profile' | 'interests' | 'spaces' | 'completion' | string;

interface OnboardingLayoutProps {
  children: React.ReactNode;
  /** Show HIVE logo (default: true) */
  showLogo?: boolean;
  /** Current step for progress indicator */
  currentStep?: OnboardingStep;
}

// 4-step flow: userType → profile → interests → spaces
const MAIN_STEPS = ['userType', 'profile', 'interests', 'spaces'] as const;

function getStepIndex(step: OnboardingStep | undefined): number {
  if (!step) return 0;
  const idx = MAIN_STEPS.indexOf(step as typeof MAIN_STEPS[number]);
  return idx >= 0 ? idx : (step === 'completion' ? MAIN_STEPS.length : 0);
}

/**
 * Premium onboarding layout wrapper
 * Full-screen black background with subtle ambient glow
 * YC/SF/OpenAI aesthetic
 */
export function OnboardingLayout({ children, showLogo = true, currentStep }: OnboardingLayoutProps) {
  const shouldReduceMotion = useReducedMotion();
  const stepIndex = getStepIndex(currentStep);
  const isCompletion = currentStep === 'completion';

  return (
    <div className="min-h-screen min-h-[100dvh] bg-black text-white relative overflow-hidden">
      {/* Ambient gold orb - breathing effect (elevated opacity for premium feel) */}
      {!shouldReduceMotion && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0.04, 0.08, 0.04],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] md:w-[800px] h-[400px] md:h-[600px] rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(255, 215, 0, 0.12) 0%, transparent 70%)',
            filter: 'blur(80px)',
          }}
          aria-hidden="true"
        />
      )}
      {/* Static ambient glow for reduced motion users */}
      {shouldReduceMotion && (
        <div
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] md:w-[800px] h-[400px] md:h-[600px] rounded-full pointer-events-none opacity-[0.06]"
          style={{
            background: 'radial-gradient(circle, rgba(255, 215, 0, 0.12) 0%, transparent 70%)',
            filter: 'blur(80px)',
          }}
          aria-hidden="true"
        />
      )}

      {/* Progress dots - top left on desktop, bottom center on mobile */}
      {currentStep && !isCompletion && (
        <motion.nav
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={shouldReduceMotion ? {} : { duration: 0.5, delay: 0.2 }}
          className="fixed top-4 left-4 md:top-6 md:left-6 z-50 flex items-center gap-1.5 md:gap-2"
          aria-label={`Step ${stepIndex + 1} of ${MAIN_STEPS.length}`}
          role="navigation"
        >
          {MAIN_STEPS.map((s, i) => {
            const isComplete = i < stepIndex;
            const isCurrent = i === stepIndex;
            return (
              <div key={s} className="flex items-center">
                <motion.div
                  initial={false}
                  animate={shouldReduceMotion ? {} : {
                    scale: isCurrent ? 1 : 0.85,
                    opacity: isComplete || isCurrent ? 1 : 0.3,
                  }}
                  className={`
                    w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center text-[10px] md:text-xs font-medium transition-colors
                    ${isComplete ? 'bg-gold-500/20 text-gold-500' : ''}
                    ${isCurrent ? 'bg-white/10 text-white border border-white/20' : ''}
                    ${!isComplete && !isCurrent ? 'bg-white/[0.03] text-gray-600 opacity-30' : ''}
                  `}
                  aria-current={isCurrent ? 'step' : undefined}
                  aria-label={`Step ${i + 1}${isComplete ? ' (completed)' : isCurrent ? ' (current)' : ''}`}
                >
                  {isComplete ? (
                    <Check className="w-2.5 h-2.5 md:w-3 md:h-3" aria-hidden="true" />
                  ) : (
                    <span aria-hidden="true">{i + 1}</span>
                  )}
                </motion.div>
                {i < MAIN_STEPS.length - 1 && (
                  <div
                    className={`w-2 md:w-4 h-px mx-0.5 md:mx-1 transition-colors ${
                      i < stepIndex ? 'bg-gold-500/40' : 'bg-white/[0.06]'
                    }`}
                    aria-hidden="true"
                  />
                )}
              </div>
            );
          })}
        </motion.nav>
      )}

      {/* Logo - top right, subtle */}
      {showLogo && (
        <motion.div
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={shouldReduceMotion ? {} : { duration: 0.5, delay: 0.2 }}
          className="fixed top-4 right-4 md:top-6 md:right-6 z-50"
        >
          <HiveLogo size="sm" variant="default" showIcon={false} showText />
        </motion.div>
      )}

      {/* Main content area - AnimatePresence handled by page */}
      <main className="relative z-10 min-h-screen min-h-[100dvh]">
        {children}
      </main>
    </div>
  );
}
