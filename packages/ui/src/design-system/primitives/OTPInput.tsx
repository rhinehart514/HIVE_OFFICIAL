'use client';

/**
 * OTPInput Primitive - LOCKED 2026-01-12
 *
 * 6-digit one-time password input
 * Auto-advances on digit entry
 * Backspace navigates to previous
 * Auto-submits when complete
 *
 * Clean glass style with subtle borders
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export interface OTPInputProps {
  /** Number of digits (default: 6) */
  length?: number;
  /** Current value array */
  value: string[];
  /** Change handler */
  onChange: (value: string[]) => void;
  /** Called when all digits are filled */
  onComplete?: (code: string) => void;
  /** Error state */
  error?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Auto-focus first input on mount */
  autoFocus?: boolean;
  /** Additional className */
  className?: string;
  /** Reduce motion for accessibility */
  reduceMotion?: boolean;
}

const OTPInput = React.forwardRef<HTMLDivElement, OTPInputProps>(
  (
    {
      length = 6,
      value,
      onChange,
      onComplete,
      error,
      disabled,
      autoFocus,
      className,
      reduceMotion,
    },
    ref
  ) => {
    const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

    // Handle digit change
    const handleChange = React.useCallback(
      (index: number, digit: string) => {
        const sanitized = digit.replace(/\D/g, '').slice(-1);
        const newValue = [...value];
        newValue[index] = sanitized;
        onChange(newValue);

        // Auto-advance to next input
        if (sanitized && index < length - 1) {
          inputRefs.current[index + 1]?.focus();
        }

        // Check if complete
        const codeString = newValue.join('');
        if (codeString.length === length && !newValue.includes('')) {
          onComplete?.(codeString);
        }
      },
      [value, onChange, onComplete, length]
    );

    // Handle backspace
    const handleKeyDown = React.useCallback(
      (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !value[index] && index > 0) {
          inputRefs.current[index - 1]?.focus();
        }
      },
      [value]
    );

    // Handle paste
    const handlePaste = React.useCallback(
      (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
        if (pastedData) {
          const newValue = [...value];
          pastedData.split('').forEach((char, i) => {
            if (i < length) {
              newValue[i] = char;
            }
          });
          onChange(newValue);

          // Focus last filled or next empty
          const nextEmptyIndex = newValue.findIndex((v) => !v);
          const focusIndex = nextEmptyIndex === -1 ? length - 1 : nextEmptyIndex;
          inputRefs.current[focusIndex]?.focus();

          // Check if complete
          const codeString = newValue.join('');
          if (codeString.length === length && !newValue.includes('')) {
            onComplete?.(codeString);
          }
        }
      },
      [value, onChange, onComplete, length]
    );

    return (
      <div
        ref={ref}
        className={cn('flex items-center justify-center gap-3', className)}
        onPaste={handlePaste}
      >
        {Array.from({ length }).map((_, index) => (
          <motion.input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={1}
            value={value[index] || ''}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            disabled={disabled}
            autoFocus={autoFocus && index === 0}
            aria-label={`Digit ${index + 1} of ${length}`}
            initial={reduceMotion ? {} : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
            className={cn(
              'w-12 h-12',
              'text-center text-title-lg font-semibold',
              'text-white',
              'rounded-lg',
              'border border-white/20',
              'bg-white/[0.04]',
              'outline-none',
              'transition-all duration-300 ease-out',
              'focus:border-white/40 focus:bg-white/[0.06] focus:ring-2 focus:ring-white/20',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              error && 'border-red-500/50 animate-shake'
            )}
          />
        ))}
      </div>
    );
  }
);

OTPInput.displayName = 'OTPInput';

export { OTPInput };
