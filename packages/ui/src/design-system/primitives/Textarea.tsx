'use client';

/**
 * Textarea Primitive - LOCKED 2026-01-10
 *
 * LOCKED: Pure Float surface, shadow-based focus, smooth auto-grow
 * Matches Input exactly in every way.
 *
 * Recipe:
 *   surface: Pure Float (elevated, shadow-based)
 *   focus: Shadow deepen (no ring)
 *   radius: rounded-xl (12px)
 *   resize: None default, optional autoGrow with 150ms smooth transition
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

// LOCKED: Pure Float surfaces (matches Input)
const textareaSurfaces = {
  resting: {
    background: 'linear-gradient(180deg, rgba(48,48,48,1) 0%, rgba(38,38,38,1) 100%)',
    boxShadow: '0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
  },
  focused: {
    background: 'linear-gradient(180deg, rgba(56,56,56,1) 0%, rgba(44,44,44,1) 100%)',
    boxShadow: '0 6px 20px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.12)',
  },
  error: {
    background: 'linear-gradient(180deg, rgba(48,38,38,1) 0%, rgba(38,28,28,1) 100%)',
    boxShadow: '0 4px 16px rgba(239,68,68,0.2), inset 0 1px 0 rgba(255,255,255,0.08)',
  },
};

// Size variants
const textareaVariants = cva(
  [
    'w-full',
    // LOCKED: rounded-xl (matches Input)
    'rounded-xl',
    'text-white',
    'placeholder:text-white/40',
    'resize-none',
    'outline-none',
    // Focus (WHITE, never gold) - fallback for keyboard nav
    'focus-visible:ring-2 focus-visible:ring-white/50',
    'focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A09]',
    'disabled:cursor-not-allowed disabled:opacity-50',
  ].join(' '),
  {
    variants: {
      size: {
        sm: 'px-3 py-2 text-xs',
        default: 'px-4 py-3 text-sm',
        lg: 'px-4 py-3 text-base',
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
  /** Error state */
  error?: boolean;
  /** Auto-grow with content (smooth 150ms transition) */
  autoGrow?: boolean;
  /** Minimum rows for autoGrow */
  minRows?: number;
  /** Maximum rows for autoGrow (0 = unlimited) */
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
    const [isFocused, setIsFocused] = React.useState(false);
    const internalRef = React.useRef<HTMLTextAreaElement>(null);
    const textareaRef = (ref as React.RefObject<HTMLTextAreaElement>) || internalRef;

    // Get current surface based on state
    const getSurface = () => {
      if (error) return textareaSurfaces.error;
      if (isFocused) return textareaSurfaces.focused;
      return textareaSurfaces.resting;
    };

    // Auto-grow logic
    const adjustHeight = React.useCallback(() => {
      const textarea = textareaRef.current;
      if (!textarea || !autoGrow) return;

      // Reset height to measure scrollHeight
      textarea.style.height = 'auto';

      // Calculate line height (approximate)
      const lineHeight = parseInt(getComputedStyle(textarea).lineHeight) || 20;
      const paddingY = parseInt(getComputedStyle(textarea).paddingTop) +
                       parseInt(getComputedStyle(textarea).paddingBottom);

      // Calculate min/max heights
      const minHeight = lineHeight * minRows + paddingY;
      const maxHeight = maxRows > 0 ? lineHeight * maxRows + paddingY : Infinity;

      // Set new height within bounds
      const newHeight = Math.min(Math.max(textarea.scrollHeight, minHeight), maxHeight);
      textarea.style.height = `${newHeight}px`;
    }, [autoGrow, minRows, maxRows, textareaRef]);

    // Adjust on value change
    React.useEffect(() => {
      adjustHeight();
    }, [props.value, adjustHeight]);

    // Handle change with auto-grow
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange?.(e);
      if (autoGrow) {
        // Use requestAnimationFrame for smooth resize
        requestAnimationFrame(adjustHeight);
      }
    };

    return (
      <textarea
        ref={textareaRef}
        rows={autoGrow ? minRows : (rows ?? 4)}
        className={cn(textareaVariants({ size }), className)}
        style={{
          ...getSurface(),
          transition: autoGrow
            ? 'height 150ms ease-out, background 150ms ease, box-shadow 150ms ease'
            : 'background 150ms ease, box-shadow 150ms ease',
          overflow: autoGrow ? 'hidden' : undefined,
          ...style,
        }}
        onFocus={(e) => {
          setIsFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          props.onBlur?.(e);
        }}
        onChange={handleChange}
        {...props}
      />
    );
  }
);

Textarea.displayName = 'Textarea';

export { Textarea, textareaVariants, textareaSurfaces };
