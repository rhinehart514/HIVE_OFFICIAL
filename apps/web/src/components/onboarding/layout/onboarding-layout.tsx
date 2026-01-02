'use client';

import { motion, useReducedMotion } from 'framer-motion';

type OnboardingStep = 'userType' | 'name' | 'handleSelection' | 'interestsCloud' | 'spaces' | 'completion' | string;

interface OnboardingLayoutProps {
  children: React.ReactNode;
  /** Show HIVE logo (default: true) */
  showLogo?: boolean;
  /** Current step for progress indicator */
  currentStep?: OnboardingStep;
}

// 5-step flow: userType → name → handleSelection → interestsCloud → spaces
const MAIN_STEPS = ['userType', 'name', 'handleSelection', 'interestsCloud', 'spaces'] as const;

function getStepIndex(step: OnboardingStep | undefined): number {
  if (!step) return 0;
  const idx = MAIN_STEPS.indexOf(step as typeof MAIN_STEPS[number]);
  // Handle legacy steps - map to new flow
  if (idx < 0) {
    if (step === 'completion') return MAIN_STEPS.length;
    if (step === 'profile') return 1; // Map to name step
    if (step === 'interests') return 3; // Map to interestsCloud step
    return 0;
  }
  return idx;
}

/**
 * Edge-to-Edge Onboarding Layout
 *
 * Matches landing page aesthetic:
 * - #050505 background (same as landing)
 * - No cards or containers
 * - Content floats directly on background
 * - Gold only on achievements
 */
export function OnboardingLayout({ children, showLogo = true, currentStep }: OnboardingLayoutProps) {
  const shouldReduceMotion = useReducedMotion();
  const stepIndex = getStepIndex(currentStep);
  const isCompletion = currentStep === 'completion';

  return (
    <div
      className="min-h-screen min-h-[100dvh] relative overflow-hidden"
      style={{ background: '#050505' }}
    >
      {/* Subtle top gradient - barely visible, matches landing */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(255,255,255,0.03) 0%, transparent 60%)',
        }}
        aria-hidden="true"
      />

      {/* Minimal header - just "HIVE" text */}
      {showLogo && (
        <motion.div
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={shouldReduceMotion ? {} : { duration: 0.5, delay: 0.2 }}
          className="fixed top-6 left-6 md:top-8 md:left-8 z-50"
        >
          <span className="text-[13px] font-medium tracking-[0.15em] text-white/30">
            HIVE
          </span>
        </motion.div>
      )}

      {/* Main content area - AnimatePresence handled by page */}
      <main className="relative z-10 min-h-screen min-h-[100dvh] flex items-center justify-center">
        <div className="w-full max-w-md px-6">
          {children}
        </div>
      </main>

      {/* Progress dots - bottom center */}
      {currentStep && !isCompletion && (
        <motion.nav
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={shouldReduceMotion ? {} : { duration: 0.5, delay: 0.3 }}
          className="fixed bottom-8 left-0 right-0 z-50 flex justify-center"
          aria-label={`Step ${stepIndex + 1} of ${MAIN_STEPS.length}`}
          role="navigation"
        >
          <div className="flex items-center gap-2.5">
            {MAIN_STEPS.map((s, i) => {
              const isCurrent = i === stepIndex;
              const isComplete = i < stepIndex;
              return (
                <motion.div
                  key={s}
                  animate={shouldReduceMotion ? {} : {
                    scale: isCurrent ? [1, 1.15, 1] : 1,
                  }}
                  transition={{
                    scale: { duration: 2, repeat: isCurrent ? Infinity : 0, ease: 'easeInOut' },
                  }}
                  className="w-1.5 h-1.5 rounded-full transition-all duration-300"
                  style={{
                    backgroundColor: isCurrent
                      ? 'rgba(255, 215, 0, 0.9)'
                      : isComplete
                        ? 'rgba(255, 255, 255, 0.4)'
                        : 'rgba(255, 255, 255, 0.15)',
                    boxShadow: isCurrent ? '0 0 8px rgba(255, 215, 0, 0.5)' : 'none',
                  }}
                  aria-current={isCurrent ? 'step' : undefined}
                  aria-label={`Step ${i + 1}${isCurrent ? ' (current)' : ''}`}
                />
              );
            })}
          </div>
        </motion.nav>
      )}
    </div>
  );
}
