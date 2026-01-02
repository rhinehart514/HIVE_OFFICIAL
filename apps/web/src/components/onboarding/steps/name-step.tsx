'use client';

import { useRef, useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import type { OnboardingData } from '../shared/types';

// Premium easing
const EASE_PREMIUM = [0.22, 1, 0.36, 1] as const;

interface NameStepProps {
  data: OnboardingData;
  onUpdate: (updates: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack?: () => void;
  error: string | null;
  setError: (error: string | null) => void;
}

/**
 * Step 2: Your Name - Edge-to-Edge Aesthetic
 * Underline input, centered, generous spacing
 */
export function NameStep({
  data,
  onUpdate,
  onNext,
  onBack,
  error,
  setError,
}: NameStepProps) {
  const { name } = data;
  const inputRef = useRef<HTMLInputElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const [isFocused, setIsFocused] = useState(false);

  // Auto-focus on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = () => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError('Please enter your name');
      return;
    }

    if (trimmedName.length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }

    if (trimmedName.length > 50) {
      setError('Name must be 50 characters or less');
      return;
    }

    setError(null);
    onNext();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ name: e.target.value });
    if (error) setError(null);
  };

  const isValid = name.trim().length >= 2;

  return (
    <motion.div
      initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={shouldReduceMotion ? {} : { duration: 0.4 }}
      className="flex flex-col"
      role="main"
      aria-labelledby="name-title"
    >
      {/* The question - clean typography */}
      <motion.h1
        id="name-title"
        initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={shouldReduceMotion ? {} : { delay: 0.1, duration: 0.5, ease: EASE_PREMIUM }}
        className="text-[clamp(1.75rem,4vw,2.25rem)] font-semibold tracking-[-0.02em] text-white mb-12 text-center"
      >
        What should we call you?
      </motion.h1>

      {/* Underline input - edge-to-edge style */}
      <motion.div
        initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={shouldReduceMotion ? {} : { delay: 0.2, duration: 0.5, ease: EASE_PREMIUM }}
        className="mb-10"
      >
        <input
          ref={inputRef}
          type="text"
          value={name}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Your name"
          autoComplete="name"
          autoCapitalize="words"
          className="w-full bg-transparent py-4 text-xl text-center outline-none transition-all duration-300 placeholder:text-white/20"
          style={{
            color: '#FFFFFF',
            borderBottom: error
              ? '1px solid #EF4444'
              : isFocused
                ? '1px solid rgba(255, 255, 255, 0.5)'
                : '1px solid rgba(255, 255, 255, 0.15)',
          }}
          aria-describedby={error ? 'name-error' : undefined}
          aria-invalid={!!error}
        />

        {/* Error message */}
        {error && (
          <motion.p
            id="name-error"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 text-[14px] text-red-400 text-center"
            role="alert"
          >
            {error}
          </motion.p>
        )}
      </motion.div>

      {/* Navigation - white pill button */}
      <motion.div
        initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={shouldReduceMotion ? {} : { delay: 0.3, duration: 0.5, ease: EASE_PREMIUM }}
        className="flex flex-col items-center gap-6"
      >
        <motion.button
          onClick={handleSubmit}
          disabled={!isValid}
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
