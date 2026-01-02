'use client';

import { useState, useMemo } from 'react';
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, X } from 'lucide-react';
import { CLOUD_INTERESTS } from '../shared/constants';
import type { OnboardingData } from '../shared/types';

// Premium easing
const EASE_PREMIUM = [0.22, 1, 0.36, 1] as const;

interface InterestsCloudStepProps {
  data: OnboardingData;
  onUpdate: (updates: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack?: () => void;
  error: string | null;
  setError: (error: string | null) => void;
}

/**
 * Shuffle array deterministically using a seed
 * This ensures consistent layout across renders
 */
function shuffleWithSeed(array: readonly string[], seed: number): string[] {
  const shuffled = [...array];
  let currentIndex = shuffled.length;
  let randomValue: number;

  // Simple seeded random
  const seededRandom = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  while (currentIndex !== 0) {
    randomValue = Math.floor(seededRandom() * currentIndex);
    currentIndex--;
    [shuffled[currentIndex], shuffled[randomValue]] = [shuffled[randomValue], shuffled[currentIndex]];
  }

  return shuffled;
}

/**
 * Step 4: What are you into? - Edge-to-Edge Aesthetic
 * Floating tags on #050505, gold on selected (earned moment)
 */
export function InterestsCloudStep({
  data,
  onUpdate,
  onNext,
  onBack,
  error,
  setError,
}: InterestsCloudStepProps) {
  const { interests } = data;
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  // Shuffle interests once (deterministic)
  const shuffledInterests = useMemo(() => {
    return shuffleWithSeed(CLOUD_INTERESTS, 42);
  }, []);

  // Filter by search
  const filteredInterests = useMemo(() => {
    if (!searchQuery.trim()) return shuffledInterests;
    const query = searchQuery.toLowerCase();
    return shuffledInterests.filter(interest =>
      interest.toLowerCase().includes(query)
    );
  }, [shuffledInterests, searchQuery]);

  const toggleInterest = (interest: string) => {
    if (interests.includes(interest)) {
      onUpdate({ interests: interests.filter(i => i !== interest) });
    } else {
      onUpdate({ interests: [...interests, interest] });
    }
    setError(null);
  };

  const removeInterest = (interest: string) => {
    onUpdate({ interests: interests.filter(i => i !== interest) });
  };

  const handleSkip = () => {
    onNext();
  };

  const handleContinue = () => {
    onNext();
  };

  const hasSelections = interests.length > 0;

  return (
    <motion.div
      initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={shouldReduceMotion ? {} : { duration: 0.4 }}
      className="flex flex-col relative"
      role="main"
      aria-labelledby="interests-title"
    >
      {/* Header */}
      <motion.h1
        id="interests-title"
        initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={shouldReduceMotion ? {} : { delay: 0.1, duration: 0.5, ease: EASE_PREMIUM }}
        className="text-[clamp(1.75rem,4vw,2.25rem)] font-semibold tracking-[-0.02em] text-white mb-3 text-center"
      >
        What are you into?
      </motion.h1>

      <motion.p
        initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={shouldReduceMotion ? {} : { delay: 0.15, duration: 0.5, ease: EASE_PREMIUM }}
        className="text-center text-[15px] text-white/40 mb-8"
      >
        Tap as many as you want
      </motion.p>

      {/* Selected interests - gold tags (earned) */}
      <AnimatePresence>
        {hasSelections && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: EASE_PREMIUM }}
            className="mb-6 flex flex-wrap gap-2 justify-center overflow-hidden"
          >
            {interests.map((interest) => (
              <motion.button
                key={interest}
                initial={shouldReduceMotion ? {} : { scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                onClick={() => removeInterest(interest)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FFD700]/10 border border-[#FFD700]/30 text-[#FFD700] text-sm font-medium hover:bg-[#FFD700]/15 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                style={{ boxShadow: '0 0 12px rgba(255, 215, 0, 0.08)' }}
              >
                {interest}
                <X className="w-3.5 h-3.5" />
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search - underline style */}
      <motion.div
        initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={shouldReduceMotion ? {} : { delay: 0.2, duration: 0.5, ease: EASE_PREMIUM }}
        className="mb-6"
      >
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsSearchFocused(true)}
          onBlur={() => setIsSearchFocused(false)}
          placeholder="Search interests..."
          className="w-full bg-transparent py-3 text-base text-center outline-none transition-all duration-300 placeholder:text-white/20"
          style={{
            color: '#FFFFFF',
            borderBottom: isSearchFocused
              ? '1px solid rgba(255, 255, 255, 0.5)'
              : '1px solid rgba(255, 255, 255, 0.15)',
          }}
        />
      </motion.div>

      {/* Word Cloud - floating tags */}
      <motion.div
        initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={shouldReduceMotion ? {} : { delay: 0.25, duration: 0.5, ease: EASE_PREMIUM }}
        className="flex-1 overflow-y-auto mb-8 min-h-[240px] max-h-[320px] sm:max-h-[360px]"
      >
        <div className="flex flex-wrap gap-2 justify-center content-start">
          {filteredInterests.map((interest, index) => {
            const isSelected = interests.includes(interest);
            // Vary sizes slightly for visual interest
            const sizeClass = index % 7 === 0 ? 'text-[15px]' : index % 5 === 0 ? 'text-[12px]' : 'text-[13px]';

            return (
              <motion.button
                key={interest}
                onClick={() => toggleInterest(interest)}
                whileHover={shouldReduceMotion ? {} : { scale: 1.05 }}
                whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
                className={`
                  px-3 py-1.5 rounded-full transition-all duration-200
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50
                  ${sizeClass}
                  ${isSelected
                    ? 'bg-[#FFD700]/10 border border-[#FFD700]/30 text-[#FFD700]'
                    : 'bg-white/[0.03] border border-white/[0.08] text-white/50 hover:bg-white/[0.06] hover:border-white/[0.16] hover:text-white/80'
                  }
                `}
                style={isSelected ? { boxShadow: '0 0 12px rgba(255, 215, 0, 0.08)' } : undefined}
                aria-pressed={isSelected}
              >
                {interest}
              </motion.button>
            );
          })}
        </div>

        {filteredInterests.length === 0 && (
          <div className="flex items-center justify-center h-32 text-white/30 text-[14px]">
            No interests match &quot;{searchQuery}&quot;
          </div>
        )}
      </motion.div>

      {/* Error message */}
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 text-[14px] text-red-400 text-center"
          role="alert"
        >
          {error}
        </motion.p>
      )}

      {/* Navigation - white pill button */}
      <motion.div
        initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={shouldReduceMotion ? {} : { delay: 0.3, duration: 0.5, ease: EASE_PREMIUM }}
        className="flex flex-col items-center gap-6"
      >
        <motion.button
          onClick={handleContinue}
          whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
          whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
          className="w-full py-4 px-8 rounded-full font-medium text-[15px] transition-all duration-300 flex items-center justify-center gap-3"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            color: '#000',
          }}
        >
          <span>{hasSelections ? `Continue with ${interests.length}` : 'Continue'}</span>
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
        </motion.button>

        <div className="flex items-center gap-4">
          {onBack && (
            <button
              onClick={onBack}
              className="text-[13px] text-white/40 hover:text-white/70 transition-colors duration-200 flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </button>
          )}
          <span className="text-white/15">·</span>
          <button
            onClick={handleSkip}
            className="text-[13px] text-white/40 hover:text-white/70 transition-colors duration-200"
          >
            Skip for now
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
