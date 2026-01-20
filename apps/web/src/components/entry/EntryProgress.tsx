'use client';

/**
 * EntryProgress - Minimal Step Indicator
 *
 * Shows the user where they are in the entry journey.
 * Typography follows HIVE design system - subtle, not shouty.
 *
 * Steps: Email → Verify → Profile → Done
 */

import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EASE_PREMIUM, DURATION, GOLD } from './motion/entry-motion';

export type EntryStep = 'school' | 'email' | 'code' | 'role' | 'identity' | 'arrival' | 'alumni-waitlist';

interface StepConfig {
  id: EntryStep;
  label: string;
}

const STEPS: StepConfig[] = [
  { id: 'school', label: 'Campus' },
  { id: 'email', label: 'Email' },
  { id: 'role', label: 'Role' },
  { id: 'code', label: 'Verify' },
  { id: 'identity', label: 'Profile' },
];

interface EntryProgressProps {
  currentStep: EntryStep;
  className?: string;
}

export function EntryProgress({ currentStep, className }: EntryProgressProps) {
  const shouldReduceMotion = useReducedMotion();
  const currentIndex = STEPS.findIndex((s) => s.id === currentStep);

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {STEPS.map((step, index) => {
        const isComplete = index < currentIndex;
        const isCurrent = step.id === currentStep;
        const isPending = index > currentIndex;

        return (
          <React.Fragment key={step.id}>
            {/* Step indicator */}
            <div className="flex items-center gap-2">
              <motion.div
                initial={false}
                animate={{
                  backgroundColor: isComplete
                    ? GOLD.primary
                    : isCurrent
                    ? 'rgba(255, 255, 255, 0.12)'
                    : 'rgba(255, 255, 255, 0.04)',
                  borderColor: isCurrent
                    ? 'rgba(255, 255, 255, 0.2)'
                    : 'transparent',
                }}
                transition={
                  shouldReduceMotion
                    ? { duration: 0 }
                    : { duration: DURATION.smooth, ease: EASE_PREMIUM }
                }
                className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center border',
                  isComplete && 'shadow-[0_0_12px_rgba(255,215,0,0.2)]'
                )}
              >
                {isComplete ? (
                  <motion.div
                    initial={shouldReduceMotion ? { scale: 1 } : { scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={
                      shouldReduceMotion
                        ? { duration: 0 }
                        : { type: 'spring', stiffness: 400, damping: 20 }
                    }
                  >
                    <Check className="w-3.5 h-3.5 text-black" strokeWidth={2.5} />
                  </motion.div>
                ) : (
                  <span
                    className={cn(
                      'text-[11px] font-medium',
                      isCurrent ? 'text-white' : 'text-white/30'
                    )}
                  >
                    {index + 1}
                  </span>
                )}
              </motion.div>

              {/* Step label */}
              <motion.span
                initial={false}
                animate={{
                  opacity: isCurrent ? 0.7 : isComplete ? 0.4 : 0.25,
                }}
                transition={
                  shouldReduceMotion
                    ? { duration: 0 }
                    : { duration: DURATION.smooth, ease: EASE_PREMIUM }
                }
                className="hidden sm:block text-[12px] text-white"
              >
                {step.label}
              </motion.span>
            </div>

            {/* Connector line */}
            {index < STEPS.length - 1 && (
              <div className="flex-1 min-w-[24px] max-w-[48px] h-px bg-white/[0.06] relative overflow-hidden">
                <motion.div
                  initial={false}
                  animate={{
                    width: isComplete ? '100%' : isCurrent ? '50%' : '0%',
                    backgroundColor: isComplete
                      ? GOLD.primary
                      : 'rgba(255, 255, 255, 0.15)',
                  }}
                  transition={
                    shouldReduceMotion
                      ? { duration: 0 }
                      : { duration: DURATION.gentle, ease: EASE_PREMIUM }
                  }
                  className="absolute inset-y-0 left-0"
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

EntryProgress.displayName = 'EntryProgress';
