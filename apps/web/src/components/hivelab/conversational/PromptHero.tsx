'use client';

/**
 * PromptHero - Hero state for the conversational creation page.
 *
 * Full-screen centered input with heading and suggestion chips.
 * This is the first thing users see when they visit /lab/new.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Sparkles, ArrowUp } from 'lucide-react';
import { MOTION, durationSeconds } from '@hive/tokens';

const EASE = MOTION.ease.premium;

const SUGGESTION_CHIPS = [
  'Poll for my club',
  'Event RSVP',
  'Office hours signup',
  'Study group matcher',
  'Attendance tracker',
  'Meeting agenda',
  'Feedback form',
  'Budget tracker',
];

interface PromptHeroProps {
  onSubmit: (prompt: string) => void;
  initialPrompt?: string;
  disabled?: boolean;
  spaceName?: string;
}

export function PromptHero({ onSubmit, initialPrompt, disabled, spaceName }: PromptHeroProps) {
  const [value, setValue] = useState(initialPrompt || '');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const shouldReduceMotion = useReducedMotion();

  // Auto-focus after entrance animation
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, shouldReduceMotion ? 100 : 800);
    return () => clearTimeout(timer);
  }, [shouldReduceMotion]);

  // Auto-submit if initialPrompt is provided
  useEffect(() => {
    if (initialPrompt?.trim()) {
      setValue(initialPrompt);
      const timer = setTimeout(() => onSubmit(initialPrompt.trim()), 500);
      return () => clearTimeout(timer);
    }
  }, [initialPrompt, onSubmit]);

  const handleSubmit = useCallback(() => {
    if (!value.trim() || disabled) return;
    onSubmit(value.trim());
  }, [value, disabled, onSubmit]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  const handleChipClick = useCallback((chip: string) => {
    if (disabled) return;
    setValue(chip);
    onSubmit(chip);
  }, [disabled, onSubmit]);

  const contextLabel = spaceName
    ? `What do you want to build for ${spaceName}?`
    : 'What do you want to build?';

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-6">
      {/* Heading */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: durationSeconds.flowing, ease: EASE }}
        className="text-center mb-8 max-w-2xl"
      >
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-white tracking-tight leading-tight">
          {contextLabel}
        </h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: durationSeconds.standard, delay: 0.3 }}
          className="mt-3 text-white/40 text-base sm:text-lg"
        >
          Describe it in plain English. AI builds it for you.
        </motion.p>
      </motion.div>

      {/* Input */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: durationSeconds.smooth, delay: 0.2, ease: EASE }}
        className="w-full max-w-xl mb-6"
      >
        <div
          className={`
            relative rounded-2xl border transition-all duration-200
            ${isFocused
              ? 'border-[var(--life-gold)]/30 bg-white/[0.06] shadow-[0_0_0_1px_var(--life-gold)]/10'
              : 'border-white/10 bg-white/[0.03] hover:border-white/15'
            }
            ${disabled ? 'opacity-50 pointer-events-none' : ''}
          `}
        >
          <div className="flex items-start gap-3 px-4 py-4">
            <Sparkles className={`w-5 h-5 mt-0.5 flex-shrink-0 transition-colors duration-200 ${
              isFocused ? 'text-[var(--life-gold)]' : 'text-white/30'
            }`} />
            <textarea
              ref={inputRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              disabled={disabled}
              placeholder="A signup sheet for office hours with time slots..."
              rows={2}
              className="flex-1 bg-transparent text-white placeholder-white/25
                resize-none outline-none text-base leading-relaxed"
            />
            <motion.button
              onClick={handleSubmit}
              disabled={!value.trim() || disabled}
              className={`
                flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center
                transition-all duration-200 mt-0.5
                ${value.trim()
                  ? 'bg-[var(--life-gold)] text-black hover:brightness-110'
                  : 'bg-white/10 text-white/30 cursor-not-allowed'
                }
              `}
              whileTap={value.trim() ? { scale: 0.95 } : undefined}
            >
              <ArrowUp className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Suggestion Chips */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: durationSeconds.standard, delay: 0.4, ease: EASE }}
        className="flex flex-wrap gap-2 justify-center max-w-xl"
      >
        {SUGGESTION_CHIPS.map((chip, i) => (
          <motion.button
            key={chip}
            onClick={() => handleChipClick(chip)}
            disabled={disabled}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: durationSeconds.quick,
              delay: 0.5 + i * 0.04,
              ease: EASE,
            }}
            className="px-3 py-1.5 rounded-full text-sm
              bg-white/[0.05] text-white/50 border border-white/[0.08]
              hover:bg-white/[0.08] hover:text-white/70 hover:border-white/[0.12]
              transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {chip}
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
}
