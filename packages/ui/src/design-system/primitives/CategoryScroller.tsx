'use client';

/**
 * CategoryScroller Primitive - LOCKED 2026-01-14
 *
 * LOCKED: Horizontal scrolling category pills with edge fades
 * Matches Badge/Tabs glass treatment, white pill for selected.
 *
 * Recipe:
 *   container: Horizontal scroll, hide scrollbar
 *   items: Pill buttons (rounded-full)
 *   selected: White background, dark text
 *   unselected: Glass surface on hover
 *   fades: Gradient overlays on scroll edges
 *   motion: Smooth scroll behavior
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

// LOCKED: Glass pill surface for hover
const glassPillSurface = {
  background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 100%)',
};

// Container variants
const categoryScrollerContainerVariants = cva(
  [
    'relative',
    'w-full',
  ].join(' '),
  {
    variants: {
      size: {
        sm: '',
        default: '',
        lg: '',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
);

// Scroll area variants
const categoryScrollerScrollAreaVariants = cva(
  [
    'flex items-center',
    'overflow-x-auto',
    'scroll-smooth',
    // Hide scrollbar
    'scrollbar-none',
    '[&::-webkit-scrollbar]:hidden',
    '[-ms-overflow-style:none]',
    '[scrollbar-width:none]',
  ].join(' '),
  {
    variants: {
      size: {
        sm: 'gap-1.5 py-1',
        default: 'gap-2 py-1.5',
        lg: 'gap-2.5 py-2',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
);

// Item variants
const categoryScrollerItemVariants = cva(
  [
    'shrink-0',
    'rounded-full',
    'font-medium',
    'whitespace-nowrap',
    'transition-all duration-150',
    // Focus (WHITE, never gold)
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
    'focus-visible:ring-offset-2 focus-visible:ring-offset-[#000000]',
    // Disabled
    'disabled:pointer-events-none disabled:opacity-50',
    // Touch
    'touch-action-manipulation',
  ].join(' '),
  {
    variants: {
      size: {
        sm: 'px-3 py-1 text-xs',
        default: 'px-4 py-1.5 text-sm',
        lg: 'px-5 py-2 text-base',
      },
      selected: {
        true: [
          'bg-white text-[#0A0A09]',
          'shadow-sm',
        ].join(' '),
        false: [
          'text-white/60',
          'hover:text-white/80',
          'hover:bg-white/[0.06]',
        ].join(' '),
      },
    },
    defaultVariants: {
      size: 'default',
      selected: false,
    },
  }
);

// Fade overlay variants
const fadeOverlayVariants = cva(
  [
    'absolute top-0 bottom-0',
    'w-8 pointer-events-none',
    'z-10',
    'transition-opacity duration-200',
  ].join(' '),
  {
    variants: {
      side: {
        left: 'left-0 bg-gradient-to-r from-[#0A0A09] to-transparent',
        right: 'right-0 bg-gradient-to-l from-[#0A0A09] to-transparent',
      },
      visible: {
        true: 'opacity-100',
        false: 'opacity-0',
      },
    },
    defaultVariants: {
      visible: false,
    },
  }
);

// Types
export interface CategoryItem {
  /** Unique identifier */
  value: string;
  /** Display label */
  label: string;
  /** Optional count badge */
  count?: number;
  /** Optional icon (before label) */
  icon?: React.ReactNode;
  /** Disabled state */
  disabled?: boolean;
}

export interface CategoryScrollerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Category items */
  items: CategoryItem[];
  /** Selected category value */
  value?: string;
  /** Change handler */
  onValueChange?: (value: string) => void;
  /** Size variant */
  size?: 'sm' | 'default' | 'lg';
  /** Show count badges */
  showCounts?: boolean;
  /** Show edge fade overlays */
  showFades?: boolean;
  /** Enable multi-select mode */
  multiple?: boolean;
  /** Selected values (for multi-select mode) */
  values?: string[];
  /** Multi-select change handler */
  onValuesChange?: (values: string[]) => void;
}

// Main component
const CategoryScroller = React.forwardRef<HTMLDivElement, CategoryScrollerProps>(
  (
    {
      className,
      items,
      value,
      onValueChange,
      size = 'default',
      showCounts = false,
      showFades = true,
      multiple = false,
      values = [],
      onValuesChange,
      ...props
    },
    ref
  ) => {
    const scrollRef = React.useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = React.useState(false);
    const [canScrollRight, setCanScrollRight] = React.useState(false);

    // Check scroll position for fades
    const updateScrollState = React.useCallback(() => {
      const el = scrollRef.current;
      if (!el) return;

      const { scrollLeft, scrollWidth, clientWidth } = el;
      setCanScrollLeft(scrollLeft > 4);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 4);
    }, []);

    // Initialize and listen for scroll
    React.useEffect(() => {
      const el = scrollRef.current;
      if (!el) return;

      updateScrollState();
      el.addEventListener('scroll', updateScrollState, { passive: true });

      // Also check on resize
      const resizeObserver = new ResizeObserver(updateScrollState);
      resizeObserver.observe(el);

      return () => {
        el.removeEventListener('scroll', updateScrollState);
        resizeObserver.disconnect();
      };
    }, [updateScrollState, items]);

    // Handle selection
    const handleSelect = (itemValue: string) => {
      if (multiple) {
        const newValues = values.includes(itemValue)
          ? values.filter((v) => v !== itemValue)
          : [...values, itemValue];
        onValuesChange?.(newValues);
      } else {
        onValueChange?.(itemValue);
      }
    };

    // Check if item is selected
    const isSelected = (itemValue: string) => {
      if (multiple) {
        return values.includes(itemValue);
      }
      return value === itemValue;
    };

    return (
      <div
        ref={ref}
        className={cn(categoryScrollerContainerVariants({ size }), className)}
        {...props}
      >
        {/* Left fade */}
        {showFades && (
          <div
            className={cn(fadeOverlayVariants({ side: 'left', visible: canScrollLeft }))}
            aria-hidden="true"
          />
        )}

        {/* Scroll area */}
        <div
          ref={scrollRef}
          className={cn(categoryScrollerScrollAreaVariants({ size }))}
          role="listbox"
          aria-label="Categories"
          aria-multiselectable={multiple}
        >
          {items.map((item) => {
            const selected = isSelected(item.value);

            return (
              <button
                key={item.value}
                type="button"
                role="option"
                aria-selected={selected}
                className={cn(categoryScrollerItemVariants({ size, selected }))}
                onClick={() => handleSelect(item.value)}
                disabled={item.disabled}
              >
                {item.icon && <span className="mr-1.5">{item.icon}</span>}
                {item.label}
                {showCounts && item.count !== undefined && (
                  <span
                    className={cn(
                      'ml-1.5 tabular-nums',
                      selected ? 'text-[#0A0A09]/60' : 'text-white/40'
                    )}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right fade */}
        {showFades && (
          <div
            className={cn(fadeOverlayVariants({ side: 'right', visible: canScrollRight }))}
            aria-hidden="true"
          />
        )}
      </div>
    );
  }
);

CategoryScroller.displayName = 'CategoryScroller';

// Utility to scroll to selected item
const scrollToSelected = (container: HTMLElement | null, value: string) => {
  if (!container) return;

  const selectedButton = container.querySelector(`[aria-selected="true"]`) as HTMLElement;
  if (selectedButton) {
    selectedButton.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    });
  }
};

export {
  CategoryScroller,
  // Export variants
  categoryScrollerContainerVariants,
  categoryScrollerScrollAreaVariants,
  categoryScrollerItemVariants,
  fadeOverlayVariants,
  // Export utilities
  scrollToSelected,
};
