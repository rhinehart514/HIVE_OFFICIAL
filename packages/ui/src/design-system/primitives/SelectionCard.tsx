'use client';

/**
 * SelectionCard Primitive - Large Selection Button
 * LOCKED: Jan 14, 2026
 *
 * Purpose: "Pick one of these" UI patterns (onboarding choices, settings options)
 *
 * Layout: [Icon] [Title + Description] [Arrow →]
 *
 * RULES:
 * - Hover: brightness-110 OR gold-edge-warmth (goldHover prop)
 * - Focus: WHITE ring (never gold)
 * - Selected: gold border + gold text
 * - NO SCALE transforms
 */

import * as React from 'react';
import { ArrowRight } from 'lucide-react';
import { cn } from '../../lib/utils';

// LOCKED: Apple Glass Dark surface (matches Card)
const surfaces = {
  default: {
    background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  hover: {
    background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.04) 100%)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.15)',
  },
  goldHover: {
    background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.04) 100%)',
    boxShadow: 'inset 0 1px 0 rgba(255,215,0,0.1), 0 0 20px rgba(255,215,0,0.1)',
    border: '1px solid rgba(255,215,0,0.3)',
  },
  selected: {
    background: 'linear-gradient(135deg, rgba(255,215,0,0.08) 0%, rgba(255,215,0,0.03) 100%)',
    boxShadow: 'inset 0 1px 0 rgba(255,215,0,0.15), 0 0 20px rgba(255,215,0,0.15)',
    border: '1px solid rgba(255,215,0,0.4)',
  },
};

export interface SelectionCardProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'title'> {
  /** Main title text */
  title: React.ReactNode;
  /** Description text (smaller, below title) */
  description?: React.ReactNode;
  /** Icon element (left side) */
  icon?: React.ReactNode;
  /** Show arrow on right (default: true) */
  showArrow?: boolean;
  /** Gold edge glow on hover (for premium/leader options) */
  goldHover?: boolean;
  /** Selected state (gold border + text) */
  selected?: boolean;
  /** Size variant */
  size?: 'default' | 'compact';
}

const SelectionCard = React.forwardRef<HTMLButtonElement, SelectionCardProps>(
  (
    {
      className,
      title,
      description,
      icon,
      showArrow = true,
      goldHover = false,
      selected = false,
      size = 'default',
      disabled,
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      default: 'h-[72px] px-5',
      compact: 'h-14 px-4',
    };

    // Dynamic styles based on state
    const [isHovered, setIsHovered] = React.useState(false);

    const currentSurface = React.useMemo(() => {
      if (selected) return surfaces.selected;
      if (isHovered) {
        return goldHover ? surfaces.goldHover : surfaces.hover;
      }
      return surfaces.default;
    }, [selected, isHovered, goldHover]);

    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          'group w-full rounded-full',
          'flex items-center gap-4',
          sizeClasses[size],
          // Typography
          'font-medium text-[15px]',
          // LOCKED: Smooth transition
          'transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
          // LOCKED: WHITE focus ring
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
          // Disabled
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
          className
        )}
        style={{
          ...currentSurface,
        }}
        aria-pressed={selected}
        {...props}
      >
        {/* Icon */}
        {icon && (
          <span
            className={cn(
              'flex-shrink-0',
              'w-10 h-10 rounded-xl',
              'flex items-center justify-center',
              'transition-colors duration-300',
              selected || (isHovered && goldHover)
                ? 'bg-[#FFD700]/10 text-[#FFD700]'
                : 'bg-white/[0.06] text-white/40 group-hover:text-white/60'
            )}
          >
            {icon}
          </span>
        )}

        {/* Content */}
        <div className="flex-1 text-left min-w-0">
          <span
            className={cn(
              'block truncate transition-colors duration-300',
              selected || (isHovered && goldHover)
                ? 'text-[#FFD700]'
                : 'text-white'
            )}
          >
            {title}
          </span>
          {description && (
            <span
              className={cn(
                'block text-[13px] truncate transition-colors duration-300',
                selected || (isHovered && goldHover)
                  ? 'text-[#FFD700]/50'
                  : 'text-white/40'
              )}
            >
              {description}
            </span>
          )}
        </div>

        {/* Arrow */}
        {showArrow && (
          <ArrowRight
            className={cn(
              'w-4 h-4 flex-shrink-0',
              'transition-all duration-300',
              selected || (isHovered && goldHover)
                ? 'text-[#FFD700] opacity-100'
                : 'text-white/50 opacity-50 group-hover:opacity-100'
            )}
          />
        )}
      </button>
    );
  }
);

SelectionCard.displayName = 'SelectionCard';

export { SelectionCard };
