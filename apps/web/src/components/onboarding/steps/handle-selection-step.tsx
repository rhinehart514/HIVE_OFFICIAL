'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, RefreshCw, Loader2, Check } from 'lucide-react';
import type { OnboardingData } from '../shared/types';

// Premium easing
const EASE_PREMIUM = [0.22, 1, 0.36, 1] as const;

interface HandleSelectionStepProps {
  data: OnboardingData;
  onUpdate: (updates: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack?: () => void;
  error: string | null;
  setError: (error: string | null) => void;
}

/**
 * Step 3: Pick your @ - Edge-to-Edge Aesthetic
 * THE GOLD MOMENT - gold appears when handle is claimed
 */
export function HandleSelectionStep({
  data,
  onUpdate,
  onNext,
  onBack,
  error,
  setError,
}: HandleSelectionStepProps) {
  const { name, handle } = data;
  const [options, setOptions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [selectedHandle, setSelectedHandle] = useState<string | null>(handle || null);
  const shouldReduceMotion = useReducedMotion();

  // Track if user just selected (for animation trigger)
  const isUnlocked = !!selectedHandle && !isLoading;

  // Fetch handle options
  const fetchHandles = useCallback(async (isRegenerate = false) => {
    if (isRegenerate) {
      setIsRegenerating(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const response = await fetch('/api/onboarding/generate-handles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        setError(result.error || 'Failed to generate handles');
        return;
      }

      if (result.handles && result.handles.length > 0) {
        setOptions(result.handles);
        // Auto-select first option if no handle selected yet
        if (!selectedHandle || isRegenerate) {
          setSelectedHandle(result.handles[0]);
          onUpdate({ handle: result.handles[0] });
        }
      } else {
        setError('No handles available. Please try again.');
      }
    } catch {
      setError('Failed to load handle options');
    } finally {
      setIsLoading(false);
      setIsRegenerating(false);
    }
  }, [name, onUpdate, selectedHandle, setError]);

  // Fetch on mount
  useEffect(() => {
    if (name) {
      fetchHandles();
    }
  }, []); // Only run once on mount

  const handleSelect = (handleOption: string) => {
    setSelectedHandle(handleOption);
    onUpdate({ handle: handleOption });
    setError(null);
  };

  const handleRegenerate = () => {
    setSelectedHandle(null);
    fetchHandles(true);
  };

  const handleSubmit = () => {
    if (!selectedHandle) {
      setError('Please select a handle');
      return;
    }
    onNext();
  };

  const isValid = !!selectedHandle;

  return (
    <motion.div
      initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={shouldReduceMotion ? {} : { duration: 0.4 }}
      className="flex flex-col relative"
      role="main"
      aria-labelledby="handle-title"
    >
      {/* Subtle gold glow - only appears on unlock */}
      <AnimatePresence>
        {isUnlocked && !shouldReduceMotion && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.04, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: EASE_PREMIUM }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full pointer-events-none"
            style={{
              background: 'radial-gradient(circle, rgba(255, 215, 0, 0.5) 0%, transparent 60%)',
              filter: 'blur(60px)',
            }}
          />
        )}
      </AnimatePresence>

      {/* The question - changes to gold "It's yours." on unlock */}
      <motion.h1
        id="handle-title"
        initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0, color: isUnlocked ? '#FFD700' : '#FFFFFF' }}
        transition={shouldReduceMotion ? {} : { delay: 0.1, duration: 0.5, ease: EASE_PREMIUM }}
        className="text-[clamp(1.75rem,4vw,2.25rem)] font-semibold tracking-[-0.02em] mb-3 text-center"
      >
        {isUnlocked ? "It's yours." : 'Pick your @'}
      </motion.h1>

      <motion.p
        initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={shouldReduceMotion ? {} : { delay: 0.15, duration: 0.5, ease: EASE_PREMIUM }}
        className="text-center text-[15px] text-white/40 mb-10"
      >
        This is how people will find you
      </motion.p>

      {/* Handle options - glass cards */}
      <motion.div
        initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={shouldReduceMotion ? {} : { delay: 0.2, duration: 0.5, ease: EASE_PREMIUM }}
        className="space-y-3 mb-6"
      >
        {isLoading ? (
          // Loading skeleton
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-14 rounded-xl bg-white/[0.03] border border-white/[0.08] animate-pulse flex items-center justify-center"
              >
                <Loader2 className="w-5 h-5 text-white/20 animate-spin" />
              </div>
            ))}
          </div>
        ) : (
          // Handle options
          options.map((option) => {
            const isSelected = selectedHandle === option;
            return (
              <motion.button
                key={option}
                whileHover={shouldReduceMotion ? {} : { scale: 1.01 }}
                whileTap={shouldReduceMotion ? {} : { scale: 0.99 }}
                onClick={() => handleSelect(option)}
                className={`
                  w-full h-14 px-5 rounded-xl text-left
                  flex items-center justify-between
                  transition-all duration-300
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50
                  ${isSelected
                    ? 'bg-white/[0.05] border border-[#FFD700]/30'
                    : 'bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.05] hover:border-white/[0.16]'
                  }
                `}
                style={isSelected ? { boxShadow: '0 0 20px rgba(255, 215, 0, 0.08)' } : undefined}
                aria-pressed={isSelected}
                aria-label={`Select handle @${option}`}
              >
                <span className={`text-lg font-medium transition-colors duration-300 ${isSelected ? 'text-[#FFD700]' : 'text-white'}`}>
                  @{option}
                </span>
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3, ease: EASE_PREMIUM }}
                    className="w-6 h-6 rounded-full bg-[#FFD700]/15 flex items-center justify-center"
                  >
                    <Check className="w-3.5 h-3.5 text-[#FFD700]" />
                  </motion.div>
                )}
              </motion.button>
            );
          })
        )}
      </motion.div>

      {/* Regenerate button */}
      <motion.div
        initial={shouldReduceMotion ? {} : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={shouldReduceMotion ? {} : { delay: 0.3, duration: 0.4 }}
        className="flex justify-center mb-10"
      >
        <button
          onClick={handleRegenerate}
          disabled={isLoading || isRegenerating}
          className="flex items-center gap-2 text-[13px] text-white/40 hover:text-white/70 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
          {isRegenerating ? 'Generating...' : 'Different options'}
        </button>
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
        transition={shouldReduceMotion ? {} : { delay: 0.35, duration: 0.5, ease: EASE_PREMIUM }}
        className="flex flex-col items-center gap-6"
      >
        <motion.button
          onClick={handleSubmit}
          disabled={!isValid || isLoading}
          whileHover={shouldReduceMotion || !isValid ? {} : { scale: 1.02 }}
          whileTap={shouldReduceMotion || !isValid ? {} : { scale: 0.98 }}
          className="w-full py-4 px-8 rounded-full font-medium text-[15px] transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          style={{
            backgroundColor: isValid ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.06)',
            color: isValid ? '#000' : 'rgba(255, 255, 255, 0.4)',
          }}
        >
          <span>Continue</span>
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

        {onBack && (
          <button
            onClick={onBack}
            className="text-[13px] text-white/40 hover:text-white/70 transition-colors duration-200 flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </button>
        )}
      </motion.div>
    </motion.div>
  );
}
