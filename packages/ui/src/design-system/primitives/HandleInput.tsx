'use client';

/**
 * HandleInput Primitive - LOCKED 2026-01-12
 *
 * Composite: Input + @ prefix + availability indicator
 * For username/handle entry with real-time availability checking
 *
 * Uses Pure Float style from Input primitive
 * Status indicator shows checking/available/taken/invalid states
 */

import * as React from 'react';
import { Check, X, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

// LOCKED: Pure Float shadow recipes (from Input primitive)
const shadowRecipes = {
  resting: '0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
  focused: '0 6px 20px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.12)',
  error: '0 0 20px rgba(239,68,68,0.15), 0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
  success: '0 0 20px rgba(34,197,94,0.15), 0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
};

const backgroundRecipes = {
  resting: 'linear-gradient(180deg, rgba(48,48,48,1) 0%, rgba(38,38,38,1) 100%)',
  focused: 'linear-gradient(180deg, rgba(56,56,56,1) 0%, rgba(44,44,44,1) 100%)',
  error: 'linear-gradient(180deg, rgba(55,40,42,1) 0%, rgba(42,32,34,1) 100%)',
  success: 'linear-gradient(180deg, rgba(40,55,42,1) 0%, rgba(32,42,34,1) 100%)',
};

export type HandleStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';

export interface HandleInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'> {
  /** Current handle availability status */
  status?: HandleStatus;
  /** Size variant */
  size?: 'sm' | 'default' | 'lg';
  /** Custom status message (optional, overrides default) */
  statusMessage?: string;
}

const sizeClasses = {
  sm: 'h-10 text-sm',
  default: 'h-12 text-base',
  lg: 'h-14 text-lg',
};

const HandleInput = React.forwardRef<HTMLInputElement, HandleInputProps>(
  ({ className, status = 'idle', size = 'default', statusMessage, onFocus, onBlur, onChange, value, ...props }, ref) => {
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

    // Strip @ prefix if user types it
    const handleChange = React.useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value.replace(/^@/, '').toLowerCase();
        // Create a synthetic event with the cleaned value
        const syntheticEvent = {
          ...e,
          target: { ...e.target, value: newValue },
          currentTarget: { ...e.currentTarget, value: newValue },
        };
        onChange?.(syntheticEvent as React.ChangeEvent<HTMLInputElement>);
      },
      [onChange]
    );

    // Determine visual state based on status
    const isError = status === 'taken' || status === 'invalid';
    const isSuccess = status === 'available';

    // LOCKED: Pure Float style with shadow-based focus
    const containerStyles = React.useMemo(() => {
      if (isError) {
        return {
          background: backgroundRecipes.error,
          boxShadow: shadowRecipes.error,
        };
      }
      if (isSuccess) {
        return {
          background: backgroundRecipes.success,
          boxShadow: shadowRecipes.success,
        };
      }
      return {
        background: isFocused ? backgroundRecipes.focused : backgroundRecipes.resting,
        boxShadow: isFocused ? shadowRecipes.focused : shadowRecipes.resting,
      };
    }, [isError, isSuccess, isFocused]);

    // Default status messages
    const defaultMessages: Record<HandleStatus, string | null> = {
      idle: null,
      checking: null,
      available: null,
      taken: 'Handle taken',
      invalid: '3-20 chars, letters/numbers only',
    };

    const displayMessage = statusMessage ?? defaultMessages[status];

    return (
      <div className="space-y-2">
        <div
          className={cn(
            'relative flex items-center rounded-xl backdrop-blur-sm',
            'transition-all duration-150 ease-out',
            sizeClasses[size],
            className
          )}
          style={containerStyles}
        >
          {/* @ prefix */}
          <span className="pl-4 text-white/30 font-medium select-none">@</span>

          <input
            ref={ref}
            type="text"
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            value={value}
            onChange={handleChange}
            className={cn(
              'flex-1 bg-transparent px-1 pr-10',
              'text-white placeholder:text-white/30',
              'outline-none border-0',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
            aria-invalid={isError}
            onFocus={handleFocus}
            onBlur={handleBlur}
            {...props}
          />

          {/* Status indicator */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            {status === 'checking' && (
              <Loader2 className="w-4 h-4 text-white/40 animate-spin" />
            )}
            {status === 'available' && (
              <Check className="w-4 h-4 text-green-500" />
            )}
            {(status === 'taken' || status === 'invalid') && (
              <X className="w-4 h-4 text-red-500" />
            )}
          </div>
        </div>

        {/* Status message */}
        {displayMessage && (
          <p
            className={cn(
              'text-sm text-center',
              isError ? 'text-red-400' : 'text-white/50'
            )}
          >
            {displayMessage}
          </p>
        )}
      </div>
    );
  }
);

HandleInput.displayName = 'HandleInput';

export { HandleInput };
