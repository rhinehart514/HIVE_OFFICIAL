'use client';

/**
 * BuilderOnboarding — 3-step tooltip tour for first-time tool builders.
 *
 * Steps:
 * 1. "This is your canvas — drag elements to build"
 * 2. "Elements are building blocks — polls, forms, counters, lists"
 * 3. "When you're done, hit Deploy to share with your space"
 *
 * Dismissible, stored in localStorage, max 3 steps.
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../lib/utils';

const STORAGE_KEY = 'hivelab_onboarding_dismissed';

interface OnboardingStep {
  title: string;
  description: string;
  icon: React.ReactNode;
}

const STEPS: OnboardingStep[] = [
  {
    title: 'This is your canvas',
    description: 'Drag elements from the palette to build your tool. Arrange them however you want.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
  },
  {
    title: 'Elements are building blocks',
    description: 'Polls, forms, counters, lists, leaderboards — combine them to create tools your space needs.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0l4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0l-5.571 3-5.571-3" />
      </svg>
    ),
  },
  {
    title: 'Deploy to share',
    description: 'When you\'re done, hit Deploy to make your tool live in any space you lead.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
      </svg>
    ),
  },
];

export interface BuilderOnboardingProps {
  show: boolean;
  onDismiss: () => void;
  className?: string;
}

export function BuilderOnboarding({ show, onDismiss, className }: BuilderOnboardingProps) {
  const [currentStep, setCurrentStep] = React.useState(0);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleDismiss();
    }
  };

  const handleDismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      // localStorage may be unavailable
    }
    onDismiss();
  };

  const step = STEPS[currentStep];

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={cn(
            'fixed inset-0 z-50 flex items-center justify-center',
            className
          )}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleDismiss}
          />

          {/* Card */}
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.96 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 max-w-sm w-full mx-4"
          >
            <div
              className="rounded-2xl p-6 border"
              style={{
                backgroundColor: 'var(--hivelab-panel, #1a1a1a)',
                borderColor: 'var(--hivelab-border, rgba(255,255,255,0.08))',
              }}
            >
              {/* Icon */}
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                style={{
                  backgroundColor: 'var(--hivelab-connection, #D4AF37)',
                  color: '#000',
                }}
              >
                {step.icon}
              </div>

              {/* Content */}
              <h3
                className="text-lg font-semibold mb-2"
                style={{ color: 'var(--hivelab-text-primary, #FAF9F7)' }}
              >
                {step.title}
              </h3>
              <p
                className="text-sm leading-relaxed mb-6"
                style={{ color: 'var(--hivelab-text-secondary, #8A8A8A)' }}
              >
                {step.description}
              </p>

              {/* Footer */}
              <div className="flex items-center justify-between">
                {/* Progress dots */}
                <div className="flex items-center gap-1.5">
                  {STEPS.map((_, i) => (
                    <div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full transition-colors duration-200"
                      style={{
                        backgroundColor: i === currentStep
                          ? 'var(--hivelab-connection, #D4AF37)'
                          : 'var(--hivelab-text-tertiary, rgba(255,255,255,0.2))',
                      }}
                    />
                  ))}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleDismiss}
                    className="text-xs transition-colors"
                    style={{ color: 'var(--hivelab-text-tertiary, rgba(255,255,255,0.3))' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'var(--hivelab-text-secondary, #8A8A8A)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'var(--hivelab-text-tertiary, rgba(255,255,255,0.3))';
                    }}
                  >
                    Skip
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-4 py-1.5 rounded-lg text-sm font-medium text-black transition-all duration-200"
                    style={{
                      backgroundColor: 'var(--hivelab-connection, #D4AF37)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    {currentStep < STEPS.length - 1 ? 'Next' : 'Got it'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Hook to check if onboarding should be shown for first-time builders.
 * Returns true if: no tools created AND onboarding not previously dismissed.
 */
export function useBuilderOnboarding(hasTools: boolean): {
  showOnboarding: boolean;
  dismissOnboarding: () => void;
} {
  const [showOnboarding, setShowOnboarding] = React.useState(false);

  React.useEffect(() => {
    if (!hasTools) {
      try {
        const dismissed = localStorage.getItem(STORAGE_KEY);
        if (!dismissed) {
          setShowOnboarding(true);
        }
      } catch {
        // localStorage unavailable
      }
    }
  }, [hasTools]);

  const dismissOnboarding = React.useCallback(() => {
    setShowOnboarding(false);
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      // localStorage unavailable
    }
  }, []);

  return { showOnboarding, dismissOnboarding };
}

BuilderOnboarding.displayName = 'BuilderOnboarding';
