'use client';

import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { ProgressBar } from './progress-bar';
import { transitionSilk, transitionSpring, GLOW_GOLD_SUBTLE } from '@/lib/motion-primitives';
import type { OnboardingStep } from '../shared/types';

interface OnboardingHeaderProps {
  step: OnboardingStep;
  stepNumber: number;
  totalSteps: number;
  onBack: () => void;
}

export function OnboardingHeader({
  step,
  stepNumber,
  totalSteps,
  onBack,
}: OnboardingHeaderProps) {
  const showBackButton = step !== 'userType';
  const showProgress = step !== 'userType' && step !== 'alumniWaitlist';

  return (
    <header className="relative z-20 sticky top-0 backdrop-blur-xl bg-black/80 border-b border-neutral-800/30">
      <div className="max-w-xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between mb-3">
          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={transitionSilk}
          >
            {showBackButton && (
              <motion.button
                onClick={onBack}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 -ml-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-900/80 transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </motion.button>
            )}
            <motion.div
              className="flex items-center gap-2"
              whileHover={{ scale: 1.02 }}
              transition={transitionSpring}
            >
              <div
                className="w-8 h-8 rounded-lg border-2 border-gold-500 bg-gold-500/10 flex items-center justify-center"
                style={{ boxShadow: GLOW_GOLD_SUBTLE }}
              >
                <img src="/assets/hive-logo-gold.svg" alt="" className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                HIVE
              </span>
            </motion.div>
          </motion.div>
        </div>
        {showProgress && <ProgressBar current={stepNumber} total={totalSteps} />}
      </div>
    </header>
  );
}
