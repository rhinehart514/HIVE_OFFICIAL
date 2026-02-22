'use client';

/**
 * Textarea Primitive — LOCKED 2026-02-21
 *
 * Matches Input: focus white/50, text 15px, placeholder white/35.
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const textareaVariants = cva(
  [
    'w-full',
    'bg-[#080808]',
    'text-white',
    'placeholder:text-white/[0.35]',
    'border border-white/[0.06]',
    'rounded-[12px]',
    'resize-none',
    'outline-none',
    'transition-all duration-150 ease-[cubic-bezier(0.22,1,0.36,1)]',
    'focus:border-white/50 focus:bg-[#0D0D0D]',
    'disabled:cursor-not-allowed disabled:opacity-40',
  ].join(' '),
  {
    variants: {
      size: {
        sm: 'px-3 py-2 text-sm',
        default: 'px-4 py-3 text-[15px]',
        lg: 'px-4 py-3 text-[15px]',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
);

export interface TextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'>,
    VariantProps<typeof textareaVariants> {
  error?: boolean;
  autoGrow?: boolean;
  minRows?: number;
  maxRows?: number;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      size,
      error = false,
      autoGrow = false,
      minRows = 3,
      maxRows = 0,
      rows,
      style,
      onChange,
      ...props
    },
    ref
  ) => {
    const internalRef = React.useRef<HTMLTextAreaElement>(null);
    const textareaRef = (ref as React.RefObject<HTMLTextAreaElement>) || internalRef;

    const adjustHeight = React.useCallback(() => {
      const textarea = textareaRef.current;
      if (!textarea || !autoGrow) return;

      textarea.style.height = 'auto';
      const lineHeight = parseInt(getComputedStyle(textarea).lineHeight) || 20;
      const paddingY = parseInt(getComputedStyle(textarea).paddingTop) +
                       parseInt(getComputedStyle(textarea).paddingBottom);
      const minHeight = lineHeight * minRows + paddingY;
      const maxHeight = maxRows > 0 ? lineHeight * maxRows + paddingY : Infinity;
      const newHeight = Math.min(Math.max(textarea.scrollHeight, minHeight), maxHeight);
      textarea.style.height = `${newHeight}px`;
    }, [autoGrow, minRows, maxRows, textareaRef]);

    React.useEffect(() => {
      adjustHeight();
    }, [props.value, adjustHeight]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange?.(e);
      if (autoGrow) requestAnimationFrame(adjustHeight);
    };

    return (
      <textarea
        ref={textareaRef}
        rows={autoGrow ? minRows : (rows ?? 4)}
        className={cn(
          textareaVariants({ size }),
          error && 'border-[#EF4444]',
          autoGrow && 'overflow-hidden',
          className
        )}
        style={autoGrow ? { ...style, transition: 'height 150ms ease-out, border-color 150ms, background-color 150ms' } : style}
        onChange={handleChange}
        {...props}
      />
    );
  }
);

Textarea.displayName = 'Textarea';

export { Textarea, textareaVariants };
