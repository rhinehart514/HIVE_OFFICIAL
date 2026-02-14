'use client';

/**
 * EmailInput Primitive
 * REFINED: Feb 14, 2026 - Premium minimal, matches Input
 *
 * Composite: Input + domain suffix
 * For campus email entry: "username" + "@buffalo.edu"
 */

import * as React from 'react';
import { cn } from '../../lib/utils';

export interface EmailInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'> {
  domain: string;
  error?: boolean;
  size?: 'sm' | 'default' | 'lg';
}

const sizeClasses = {
  sm: 'h-10 text-sm',
  default: 'h-12 text-[15px]',
  lg: 'h-14 text-[15px]',
};

const EmailInput = React.forwardRef<HTMLInputElement, EmailInputProps>(
  ({ className, domain, error, size = 'default', ...props }, ref) => (
    <div
      className={cn(
        'flex items-center',
        'bg-[#080808]',
        'border border-white/[0.06]',
        'rounded-[12px]',
        'transition-all duration-150 ease-[cubic-bezier(0.22,1,0.36,1)]',
        'focus-within:border-white/[0.15] focus-within:bg-[#0D0D0D]',
        error && 'border-[#EF4444]',
        sizeClasses[size],
        className
      )}
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
          'text-white placeholder:text-white/40',
          'outline-none border-0',
          'disabled:opacity-40 disabled:cursor-not-allowed'
        )}
        aria-invalid={error}
        {...props}
      />
      <span className="pr-4 text-white/40 font-medium select-none">
        @{domain}
      </span>
    </div>
  )
);

EmailInput.displayName = 'EmailInput';

export { EmailInput };
