'use client';

/**
 * RefinementBar - Bottom input for iterative refinements.
 *
 * Shown after initial generation completes. User types
 * changes and they get applied via the generate API with isIteration: true.
 */

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowUp } from 'lucide-react';
import { MOTION, durationSeconds } from '@hive/tokens';

const EASE = MOTION.ease.premium;

interface RefinementBarProps {
  onSubmit: (prompt: string) => void;
  isGenerating?: boolean;
  disabled?: boolean;
}

export function RefinementBar({ onSubmit, isGenerating, disabled }: RefinementBarProps) {
  const [value, setValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = useCallback(() => {
    if (!value.trim() || isGenerating || disabled) return;
    onSubmit(value.trim());
    setValue('');
  }, [value, isGenerating, disabled, onSubmit]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: durationSeconds.standard, ease: EASE }}
      className="w-full max-w-xl mx-auto"
    >
      <div
        className={`
          flex items-center gap-3 px-4 py-3 rounded-xl
          border transition-all duration-200
          ${isFocused
            ? 'border-white/20 bg-white/[0.06]'
            : 'border-white/[0.08] bg-white/[0.03] hover:border-white/[0.12]'
          }
          ${disabled ? 'opacity-50 pointer-events-none' : ''}
        `}
      >
        {/* Icon */}
        <div className="flex-shrink-0">
          {isGenerating ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            >
              <Sparkles className="w-4 h-4 text-[var(--life-gold)]" />
            </motion.div>
          ) : (
            <Sparkles className={`w-4 h-4 transition-colors duration-150 ${
              isFocused ? 'text-[var(--life-gold)]' : 'text-white/30'
            }`} />
          )}
        </div>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={disabled || isGenerating}
          placeholder={isGenerating ? 'Updating...' : 'Want to change anything?'}
          className="flex-1 bg-transparent text-white placeholder-white/25
            text-sm outline-none disabled:cursor-not-allowed"
        />

        {/* Submit */}
        <AnimatePresence>
          {value.trim() && !isGenerating && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.1 }}
              onClick={handleSubmit}
              disabled={disabled}
              className="flex-shrink-0 w-7 h-7 rounded-lg
                bg-[var(--life-gold)] text-black
                flex items-center justify-center
                hover:brightness-110 transition-all duration-150"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
