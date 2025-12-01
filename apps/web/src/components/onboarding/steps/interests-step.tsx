'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import { Button } from '@hive/ui';
import {
  staggerContainer,
  staggerItem,
  transitionSilk,
  transitionSpring,
  GLOW_GOLD_SUBTLE,
} from '@/lib/motion-primitives';
import { INTEREST_TAGS } from '../shared/constants';
import type { OnboardingData } from '../shared/types';

interface InterestsStepProps {
  data: OnboardingData;
  onUpdate: (updates: Partial<OnboardingData>) => void;
  onNext: () => void;
  error: string | null;
  setError: (error: string | null) => void;
  isSubmitting: boolean;
}

export function InterestsStep({
  data,
  onUpdate,
  onNext,
  error,
  isSubmitting,
}: InterestsStepProps) {
  const { interests, termsAccepted } = data;
  const MAX_INTERESTS = 5;

  const toggleInterest = (interest: string) => {
    const newInterests = interests.includes(interest)
      ? interests.filter((i) => i !== interest)
      : interests.length < MAX_INTERESTS
      ? [...interests, interest]
      : interests;
    onUpdate({ interests: newInterests });
  };

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={staggerItem} transition={transitionSilk}>
        <p className="text-sm text-neutral-400 text-center">
          Pick up to {MAX_INTERESTS} interests to personalize your feed
        </p>
      </motion.div>

      {/* Interest tags - wrapped flexbox */}
      <motion.div variants={staggerItem} transition={transitionSilk}>
        <div className="flex flex-wrap gap-2 justify-center">
          {INTEREST_TAGS.map((interest, index) => {
            const isSelected = interests.includes(interest);
            const isDisabled = !isSelected && interests.length >= MAX_INTERESTS;

            return (
              <motion.button
                key={interest}
                type="button"
                onClick={() => !isDisabled && toggleInterest(interest)}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ ...transitionSpring, delay: index * 0.02 }}
                whileHover={!isDisabled ? { scale: 1.05 } : {}}
                whileTap={!isDisabled ? { scale: 0.95 } : {}}
                className={`relative rounded-full px-4 py-2.5 text-sm font-medium transition-all duration-200 border ${
                  isSelected
                    ? 'border-gold-500 text-gold-500 bg-gold-500/10'
                    : isDisabled
                    ? 'border-neutral-800 text-neutral-600 cursor-not-allowed bg-neutral-900'
                    : 'border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-600 bg-black'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  {isSelected && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={transitionSpring}
                    >
                      <Check className="h-3.5 w-3.5 text-gold-500" />
                    </motion.span>
                  )}
                  {interest}
                </span>
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Counter */}
      <motion.div variants={staggerItem} transition={transitionSilk}>
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-900/50 border border-neutral-800/50">
            <div className="flex gap-1">
              {Array.from({ length: MAX_INTERESTS }).map((_, i) => (
                <motion.div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i < interests.length
                      ? 'border border-gold-500 bg-gold-500/20'
                      : 'border border-neutral-700 bg-transparent'
                  }`}
                  animate={i < interests.length ? { scale: [1, 1.2, 1] } : {}}
                  transition={{ duration: 0.2 }}
                />
              ))}
            </div>
            <span className="text-xs text-neutral-400">
              {interests.length}/{MAX_INTERESTS}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="text-sm font-medium text-red-400 text-center"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Terms checkbox */}
      <motion.div variants={staggerItem} transition={transitionSilk}>
        <label className="flex items-start gap-3 cursor-pointer group">
          <div className="relative mt-0.5">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => onUpdate({ termsAccepted: e.target.checked })}
              className="sr-only"
            />
            <motion.div
              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                termsAccepted
                  ? 'bg-gold-500/10 border-gold-500'
                  : 'bg-transparent border-neutral-700 group-hover:border-neutral-500'
              }`}
              whileTap={{ scale: 0.9 }}
            >
              <AnimatePresence>
                {termsAccepted && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={transitionSpring}
                  >
                    <Check className="h-3.5 w-3.5 text-gold-500" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
          <span className="text-xs text-neutral-500 leading-relaxed group-hover:text-neutral-400 transition-colors">
            I agree to the{' '}
            <a
              href="/legal/terms"
              className="underline hover:text-gold-500 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              Terms
            </a>{' '}
            and{' '}
            <a
              href="/legal/privacy"
              className="underline hover:text-gold-500 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              Privacy Policy
            </a>
          </span>
        </label>
      </motion.div>

      {/* Submit button */}
      <motion.div variants={staggerItem} transition={transitionSilk}>
        <Button
          onClick={onNext}
          state={isSubmitting ? 'loading' : 'idle'}
          disabled={!termsAccepted}
          showArrow
          fullWidth
          size="lg"
        >
          Continue
        </Button>
      </motion.div>
    </motion.div>
  );
}
