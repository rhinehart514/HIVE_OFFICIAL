'use client';

/**
 * Tag Primitive - Interactive Selection Tag
 * LOCKED: Jan 14, 2026
 *
 * Purpose: Clickable tags for selection (interests, filters, categories)
 * NOT the same as TagBadge (which is display-only)
 *
 * Variants:
 * - default: Glass surface, clickable
 * - gold: Gold glass (selected state)
 * - muted: Subtle, disabled-like appearance
 *
 * RULES:
 * - Hover: opacity-90 (NO SCALE per DECISIONS.md)
 * - Focus: WHITE ring (never gold)
 * - Gold = selected/earned state
 */

import * as React from 'react';
import { X } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

// Flat surface classes — no gradients
const surfaceClasses = {
  default: 'bg-white/[0.06]',
  gold: 'bg-[#FFD700]/10',
  muted: 'bg-white/[0.02] border border-white/[0.06]',
};

const tagVariants = cva(
  [
    'inline-flex items-center justify-center gap-1.5',
    'rounded-full',
    'font-medium',
    'cursor-pointer',
    'select-none',
    // Premium easing (matches system)
    'transition-all duration-150 ease-out',
    // LOCKED: Opacity hover (NO SCALE)
    'hover:opacity-90',
    'active:opacity-80',
    // LOCKED: WHITE focus ring
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
  ].join(' '),
  {
    variants: {
      variant: {
        default: 'text-white/60 hover:text-white',
        gold: 'text-[#FFD700]',
        muted: 'text-white/40',
      },
      size: {
        sm: 'px-2.5 py-1 text-xs',
        default: 'px-3 py-1.5 text-body-sm',
        lg: 'px-4 py-2 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface TagProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'>,
    VariantProps<typeof tagVariants> {
  /** Tag content */
  children: React.ReactNode;
  /** Selected state (convenience prop - sets variant to gold) */
  selected?: boolean;
  /** Show remove X button */
  removable?: boolean;
  /** Remove handler (called when X clicked, stops propagation) */
  onRemove?: () => void;
}

const Tag = React.forwardRef<HTMLButtonElement, TagProps>(
  (
    {
      className,
      variant: variantProp,
      size,
      selected,
      removable,
      onRemove,
      children,
      disabled,
      style,
      ...props
    },
    ref
  ) => {
    // Selected prop overrides variant to gold
    const variant = selected ? 'gold' : (variantProp ?? 'default');
    const surfaceCls = surfaceClasses[variant];

    const handleRemove = (e: React.MouseEvent) => {
      e.stopPropagation();
      onRemove?.();
    };

    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled}
        className={cn(tagVariants({ variant, size }), surfaceCls, className)}
        style={style}
        aria-pressed={selected}
        {...props}
      >
        {children}
        {removable && (
          <span
            role="button"
            tabIndex={-1}
            onClick={handleRemove}
            className={cn(
              'inline-flex items-center justify-center',
              'w-3.5 h-3.5 -mr-0.5',
              'rounded-full',
              'transition-colors duration-100',
              variant === 'gold'
                ? 'hover:bg-[#FFD700]/20'
                : 'hover:bg-white/10'
            )}
          >
            <X className="w-3 h-3" strokeWidth={2.5} />
          </span>
        )}
      </button>
    );
  }
);

Tag.displayName = 'Tag';

export { Tag, tagVariants };
