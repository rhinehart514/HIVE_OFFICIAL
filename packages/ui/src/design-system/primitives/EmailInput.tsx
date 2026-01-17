'use client';

/**
 * EmailInput Primitive - LOCKED 2026-01-12
 *
 * Composite: Input + domain suffix
 * For campus email entry: "username" + "@buffalo.edu"
 *
 * Uses Pure Float style from Input primitive
 * Suffix is non-editable, visually integrated
 */

import * as React from 'react';
import { cn } from '../../lib/utils';

// LOCKED: Pure Float shadow recipes (from Input primitive)
const shadowRecipes = {
  resting: '0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
  focused: '0 6px 20px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.12)',
  error: '0 0 20px rgba(239,68,68,0.15), 0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
};

const backgroundRecipes = {
  resting: 'linear-gradient(180deg, rgba(48,48,48,1) 0%, rgba(38,38,38,1) 100%)',
  focused: 'linear-gradient(180deg, rgba(56,56,56,1) 0%, rgba(44,44,44,1) 100%)',
  error: 'linear-gradient(180deg, rgba(55,40,42,1) 0%, rgba(42,32,34,1) 100%)',
};

export interface EmailInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'> {
  /** Domain suffix (e.g., "buffalo.edu") */
  domain: string;
  /** Error state styling */
  error?: boolean;
  /** Size variant */
  size?: 'sm' | 'default' | 'lg';
}

const sizeClasses = {
  sm: 'h-10 text-sm',
  default: 'h-12 text-base',
  lg: 'h-14 text-lg',
};

const EmailInput = React.forwardRef<HTMLInputElement, EmailInputProps>(
  ({ className, domain, error, size = 'default', onFocus, onBlur, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);

    const handleFocus = React.useCallback(
      (e: React.FocusEvent<HTMLInputElement>) => {
        setIsFocused(true);
        onFocus?.(e);
      },
      [onFocus]
    );

    const handleBlur = React.useCallback(
      (e: React.FocusEvent<HTMLInputElement>) => {
        setIsFocused(false);
        onBlur?.(e);
      },
      [onBlur]
    );

    // LOCKED: Pure Float style with shadow-based focus
    const containerStyles = React.useMemo(() => {
      if (error) {
        return {
          background: backgroundRecipes.error,
          boxShadow: shadowRecipes.error,
        };
      }
      return {
        background: isFocused ? backgroundRecipes.focused : backgroundRecipes.resting,
        boxShadow: isFocused ? shadowRecipes.focused : shadowRecipes.resting,
      };
    }, [error, isFocused]);

    return (
      <div
        className={cn(
          'flex items-center rounded-xl backdrop-blur-sm',
          'transition-all duration-150 ease-out',
          sizeClasses[size],
          className
        )}
        style={containerStyles}
      >
        <input
          ref={ref}
          type="text"
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          className={cn(
            'flex-1 bg-transparent pl-4 pr-1',
            'text-white placeholder:text-white/30',
            'outline-none border-0',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
          aria-invalid={error}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
        <span className="pr-4 text-white/50 font-medium select-none">
          @{domain}
        </span>
      </div>
    );
  }
);

EmailInput.displayName = 'EmailInput';

export { EmailInput };
