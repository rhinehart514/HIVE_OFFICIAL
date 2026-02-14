'use client';

/**
 * HandleInput Primitive
 * REFINED: Feb 14, 2026 - Premium minimal, matches Input
 *
 * Composite: @ prefix + input + availability indicator
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import { Check, X, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export type HandleStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';

export interface HandleInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'> {
  status?: HandleStatus;
  size?: 'sm' | 'default' | 'lg';
  statusMessage?: string;
}

const sizeClasses = {
  sm: 'h-10 text-sm',
  default: 'h-12 text-[15px]',
  lg: 'h-14 text-[15px]',
};

const HandleInput = React.forwardRef<HTMLInputElement, HandleInputProps>(
  ({ className, status = 'idle', size = 'default', statusMessage, onChange, value, ...props }, ref) => {
    const isError = status === 'taken' || status === 'invalid';
    const isSuccess = status === 'available';

    const handleChange = React.useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value.replace(/^@/, '').toLowerCase();
        const syntheticEvent = {
          ...e,
          target: { ...e.target, value: newValue },
          currentTarget: { ...e.currentTarget, value: newValue },
        };
        onChange?.(syntheticEvent as React.ChangeEvent<HTMLInputElement>);
      },
      [onChange]
    );

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
            'relative flex items-center',
            'bg-[#080808]',
            'border',
            isError ? 'border-[#EF4444]' : isSuccess ? 'border-[#FFD700]/30' : 'border-white/[0.06]',
            'rounded-[12px]',
            'transition-all duration-150 ease-[cubic-bezier(0.22,1,0.36,1)]',
            'focus-within:border-white/[0.15] focus-within:bg-[#0D0D0D]',
            isSuccess && 'focus-within:border-[#FFD700]/30',
            sizeClasses[size],
            className
          )}
        >
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
              'text-white placeholder:text-white/40',
              'outline-none border-0',
              'disabled:opacity-40 disabled:cursor-not-allowed'
            )}
            aria-invalid={isError}
            {...props}
          />

          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            {status === 'checking' && (
              <Loader2 className="w-4 h-4 text-white/40 animate-spin" />
            )}
            {status === 'available' && (
              <Check className="w-4 h-4 text-[#FFD700]" />
            )}
            {(status === 'taken' || status === 'invalid') && (
              <X className="w-4 h-4 text-red-500" />
            )}
          </div>
        </div>

        {displayMessage && (
          <motion.p
            className={cn(
              'text-sm text-center',
              isError ? 'text-red-400' : '',
              status === 'available' ? 'text-[#FFD700] font-medium' : 'text-white/50'
            )}
            initial={status === 'available' ? { opacity: 0, y: 8 } : {}}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: status === 'available' ? 0.4 : 0.2,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {displayMessage}
          </motion.p>
        )}
      </div>
    );
  }
);

HandleInput.displayName = 'HandleInput';

export { HandleInput };
