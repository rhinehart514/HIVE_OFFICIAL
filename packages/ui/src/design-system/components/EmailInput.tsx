'use client';

/**
 * EmailInput Component
 * Source: Onboarding & Auth Vertical Slice
 *
 * Campus-specific email input with domain suffix displayed inside the input.
 * Clean, minimal design with error state handling.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * DESIGN PHILOSOPHY
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * The email input should feel effortless. The user only types their username,
 * the domain is always visible and non-editable. This prevents typos and
 * reinforces the campus-specific nature of HIVE.
 *
 * Visual treatment:
 * - Subtle glass-like background (rgba(255,255,255,0.04))
 * - Domain suffix in muted text (rgba(255,255,255,0.35))
 * - Error state with red border, not red background
 * - White pill button when input has value
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EASE_PREMIUM } from '../layout-tokens';

// ============================================
// TYPES
// ============================================

export interface EmailInputProps {
  /** Current email username (without domain) */
  value: string;
  /** Callback when value changes */
  onChange: (value: string) => void;
  /** Callback when form is submitted */
  onSubmit?: () => void;
  /** Domain suffix (e.g., "buffalo.edu") */
  domainSuffix: string;
  /** Error message to display */
  error?: string;
  /** Whether submission is in progress */
  isLoading?: boolean;
  /** Disable the input */
  disabled?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Submit button text */
  submitText?: string;
  /** Auto-focus on mount */
  autoFocus?: boolean;
  /** Additional CSS class */
  className?: string;
  /** Accessible label */
  label?: string;
}

// ============================================
// MAIN COMPONENT
// ============================================

/**
 * EmailInput - Campus email input with domain suffix
 *
 * The domain suffix is displayed inside the input, making it clear
 * this is a campus-specific authentication flow.
 *
 * @example
 * ```tsx
 * <EmailInput
 *   value={email}
 *   onChange={setEmail}
 *   onSubmit={handleSendCode}
 *   domainSuffix="buffalo.edu"
 *   error={error}
 *   isLoading={isSending}
 * />
 * ```
 */
export function EmailInput({
  value,
  onChange,
  onSubmit,
  domainSuffix,
  error,
  isLoading = false,
  disabled = false,
  placeholder = 'yourname',
  submitText = 'Continue',
  autoFocus = true,
  className,
  label = 'Email address',
}: EmailInputProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const hasValue = value.trim().length > 0;

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (hasValue && !isLoading && !disabled) {
      onSubmit?.();
    }
  };

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && hasValue && !isLoading && !disabled) {
      onSubmit?.();
    }
  };

  return (
    <div className={`space-y-4 ${className ?? ''}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email Input */}
        <div className="space-y-2">
          <div
            className="relative flex items-center rounded-xl transition-all duration-200"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              border: error
                ? '1px solid var(--color-status-error)'
                : '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <input
              ref={inputRef}
              type="text"
              autoComplete="email"
              autoFocus={autoFocus}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled || isLoading}
              aria-label={label}
              aria-describedby="email-domain"
              aria-invalid={!!error}
              className="
                flex-1 bg-transparent px-4 py-3.5 text-body
                outline-none transition-all duration-200
                disabled:opacity-50
                placeholder:text-white/25
              "
              style={{ color: 'var(--color-text-primary)' }}
            />
            <span
              id="email-domain"
              className="pr-4 text-body pointer-events-none select-none"
              style={{ color: 'rgba(255, 255, 255, 0.35)' }}
            >
              @{domainSuffix}
            </span>
          </div>

          {/* Error message */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="text-body-sm px-1"
                style={{ color: 'var(--color-status-error)' }}
                role="alert"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Submit Button - White Pill */}
        <motion.button
          type="submit"
          disabled={isLoading || disabled || !hasValue}
          whileTap={{ opacity: 0.8 }}
          className="
            group w-full py-3.5 px-6 rounded-xl
            font-medium text-body
            transition-all duration-200
            disabled:opacity-40 disabled:cursor-not-allowed
            flex items-center justify-center gap-2
          "
          style={{
            backgroundColor: hasValue ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.06)',
            color: hasValue ? '#000' : 'rgba(255, 255, 255, 0.4)',
          }}
        >
          {isLoading ? (
            <>
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
              <span>Sending code...</span>
            </>
          ) : (
            <>
              <span>{submitText}</span>
              <svg
                className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5"
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
            </>
          )}
        </motion.button>
      </form>
    </div>
  );
}

/**
 * Get the full email address from username and domain
 */
export function getFullEmail(username: string, domain: string): string {
  // If user already typed @, extract just the username
  const cleanUsername = username.includes('@')
    ? username.split('@')[0]
    : username;
  return `${cleanUsername}@${domain}`;
}

/**
 * Validate email format
 */
export function isValidEmailUsername(username: string): boolean {
  // Basic validation - no empty, no special characters except . and _
  if (!username.trim()) return false;
  return /^[a-zA-Z0-9._-]+$/.test(username);
}

// Default export for convenience
export default EmailInput;
