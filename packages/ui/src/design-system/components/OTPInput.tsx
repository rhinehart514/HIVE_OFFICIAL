'use client';

/**
 * OTPInput Component
 * Source: Onboarding & Auth Vertical Slice
 *
 * Premium 6-digit OTP input with progressive gold animation.
 * As digits are entered, gold intensity increases across all filled inputs.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * DESIGN PHILOSOPHY
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * The OTP experience should feel like unlocking something special.
 * Each digit entered adds warmth. By the 6th digit, the entire input
 * glows with anticipation.
 *
 * Gold rules (from LANGUAGE.md):
 * - Gold indicates "life" and achievement
 * - Progressive intensity = building toward completion
 * - Never decorative, always earned through action
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

import * as React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

// ============================================
// TYPES
// ============================================

export interface OTPInputProps {
  /** Number of digits (default: 6) */
  length?: number;
  /** Current value as array of digits */
  value: string[];
  /** Callback when value changes */
  onChange: (value: string[]) => void;
  /** Callback when all digits entered */
  onComplete?: (code: string) => void;
  /** Error message to display */
  error?: string;
  /** Whether verification is in progress */
  isVerifying?: boolean;
  /** Disable all inputs */
  disabled?: boolean;
  /** Auto-focus first input on mount */
  autoFocus?: boolean;
  /** Show progress dots below input */
  showProgress?: boolean;
  /** Additional CSS class */
  className?: string;
  /** Accessible label */
  label?: string;
}

// ============================================
// CONSTANTS
// ============================================

// Premium easing from LANGUAGE.md
const EASE_PREMIUM = [0.22, 1, 0.36, 1] as const;

// ============================================
// MAIN COMPONENT
// ============================================

/**
 * OTPInput - Premium 6-digit verification code input
 *
 * Features progressive gold animation as digits are entered.
 * Each filled digit intensifies the warmth across all inputs.
 *
 * @example
 * ```tsx
 * const [code, setCode] = useState(['', '', '', '', '', '']);
 *
 * <OTPInput
 *   value={code}
 *   onChange={setCode}
 *   onComplete={(fullCode) => verifyCode(fullCode)}
 *   error={error}
 *   isVerifying={isLoading}
 * />
 * ```
 */
export function OTPInput({
  length = 6,
  value,
  onChange,
  onComplete,
  error,
  isVerifying = false,
  disabled = false,
  autoFocus = true,
  showProgress = true,
  className,
  label = 'Verification code',
}: OTPInputProps) {
  const shouldReduceMotion = useReducedMotion();
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  // Calculate gold intensity based on filled count
  const filledCount = value.filter(Boolean).length;
  const goldIntensity = filledCount / length;

  // Handle digit input
  const handleChange = (index: number, inputValue: string) => {
    const digit = inputValue.replace(/\D/g, '').slice(-1);
    const newValue = [...value];
    newValue[index] = digit;
    onChange(newValue);

    // Auto-focus next input
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Check for completion
    const codeString = newValue.join('');
    if (codeString.length === length && !newValue.includes('')) {
      onComplete?.(codeString);
    }
  };

  // Handle backspace navigation
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle paste
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);

    if (pastedData) {
      const newValue = [...value];
      for (let i = 0; i < pastedData.length; i++) {
        newValue[i] = pastedData[i];
      }
      onChange(newValue);

      // Focus last filled input or next empty
      const lastFilledIndex = Math.min(pastedData.length, length) - 1;
      if (pastedData.length === length) {
        inputRefs.current[lastFilledIndex]?.blur();
        onComplete?.(pastedData);
      } else {
        inputRefs.current[pastedData.length]?.focus();
      }
    }
  };

  return (
    <div className={`space-y-4 ${className ?? ''}`} role="group" aria-label={label}>
      {/* OTP Input Grid */}
      <div className="flex items-center justify-center gap-2.5 sm:gap-3">
        {Array.from({ length }).map((_, index) => {
          const isFilled = !!value[index];

          return (
            <motion.div
              key={index}
              initial={shouldReduceMotion ? {} : { opacity: 0, y: 12, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                delay: index * 0.06,
                duration: 0.4,
                ease: EASE_PREMIUM
              }}
              className="relative"
            >
              {/* Glow effect behind filled inputs */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                  opacity: isFilled ? 0.4 + (goldIntensity * 0.3) : 0,
                  scale: isFilled ? 1.2 : 0.8
                }}
                transition={{
                  type: 'spring',
                  stiffness: 400,
                  damping: 25
                }}
                className="absolute inset-0 rounded-xl pointer-events-none"
                style={{
                  background: `radial-gradient(circle, rgba(255, 215, 0, ${0.15 + goldIntensity * 0.1}) 0%, transparent 70%)`,
                  filter: 'blur(8px)',
                }}
                aria-hidden="true"
              />

              <motion.input
                ref={(el) => { inputRefs.current[index] = el; }}
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={1}
                value={value[index]}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                disabled={disabled || isVerifying}
                autoFocus={autoFocus && index === 0}
                aria-label={`Digit ${index + 1} of ${length}`}
                aria-invalid={!!error}
                animate={{
                  scale: isFilled ? [1, 1.1, 1] : 1,
                  backgroundColor: isFilled
                    ? `rgba(255, 215, 0, ${0.08 + goldIntensity * 0.04})`
                    : 'rgba(255, 255, 255, 0.03)',
                  borderColor: error
                    ? 'var(--color-status-error)'
                    : isFilled
                      ? `rgba(255, 215, 0, ${0.4 + goldIntensity * 0.3})`
                      : 'rgba(255, 255, 255, 0.1)',
                }}
                transition={{
                  scale: {
                    type: 'spring',
                    stiffness: 500,
                    damping: 15,
                    mass: 0.5
                  },
                  backgroundColor: {
                    duration: 0.3,
                    ease: EASE_PREMIUM
                  },
                  borderColor: {
                    duration: 0.2,
                    ease: 'easeOut'
                  }
                }}
                className="
                  relative w-11 sm:w-12 h-14 sm:h-16
                  text-center text-2xl sm:text-3xl font-semibold
                  rounded-xl outline-none border
                  disabled:opacity-50 disabled:cursor-not-allowed
                  focus:border-white/40
                "
                style={{
                  color: isFilled
                    ? `rgb(255, ${215 + (1 - goldIntensity) * 40}, ${(1 - goldIntensity) * 100})`
                    : 'rgba(255, 255, 255, 0.8)',
                  textShadow: isFilled
                    ? `0 0 ${8 + goldIntensity * 12}px rgba(255, 215, 0, ${0.3 + goldIntensity * 0.3})`
                    : 'none',
                }}
              />
            </motion.div>
          );
        })}
      </div>

      {/* Progress dots */}
      {showProgress && (
        <div className="flex justify-center gap-1.5 pt-2">
          {Array.from({ length }).map((_, index) => (
            <motion.div
              key={index}
              animate={{
                backgroundColor: value[index]
                  ? 'var(--color-gold)'
                  : 'rgba(255, 255, 255, 0.15)',
                scale: value[index] ? 1 : 0.8,
              }}
              transition={{
                type: 'spring',
                stiffness: 500,
                damping: 25
              }}
              className="w-1.5 h-1.5 rounded-full"
              aria-hidden="true"
            />
          ))}
        </div>
      )}

      {/* Error message */}
      <AnimatePresence mode="wait">
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="text-sm text-center"
            style={{ color: 'var(--color-status-error)' }}
            role="alert"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Verifying indicator */}
      {isVerifying && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center gap-2"
          style={{ color: 'var(--color-gold)' }}
        >
          <svg
            className="w-4 h-4 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span className="text-sm">Verifying</span>
        </motion.div>
      )}
    </div>
  );
}

// Default export for convenience
export default OTPInput;
