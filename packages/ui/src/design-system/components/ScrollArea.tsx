'use client';

/**
 * ScrollArea Primitive
 * LOCKED: January 11, 2026
 *
 * Decisions:
 * - Thumb opacity: Subtle (`bg-white/20` → `bg-white/40` on hover)
 * - Width: Thin 6px default (`w-1.5`) - minimal footprint
 * - Visibility: Auto (shows when content overflows)
 * - Shape: Fully rounded (`rounded-full`) - pill shape
 *
 * Custom scrollable container with styled scrollbars.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * VISUAL DESCRIPTION (for AI reference - no Playwright needed)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * SCROLL AREA CONCEPT:
 * ┌─────────────────────────────────────────┐
 * │                                         │░  ← Vertical scrollbar track
 * │         Scrollable Content              │█  ← Scrollbar thumb (draggable)
 * │                                         │░
 * │         - Item 1                        │░
 * │         - Item 2                        │░
 * │         - Item 3                        │░
 * │         - Item 4                        │░
 * │         - Item 5                        │░
 * │                                         │░
 * └─────────────────────────────────────────┘
 *
 * SCROLLBAR VARIANTS:
 *
 * Default (thin, subtle):
 * ┌────────────────────────────────┐
 * │ Content                        │░  ← 6px track, muted thumb
 * │ Content                        │█
 * │ Content                        │░
 * └────────────────────────────────┘
 *
 * Wide:
 * ┌────────────────────────────────┐
 * │ Content                        │░░  ← 10px track
 * │ Content                        │██
 * │ Content                        │░░
 * └────────────────────────────────┘
 *
 * Minimal:
 * ┌────────────────────────────────┐
 * │ Content                        │·  ← 4px, only visible on hover
 * │ Content                        │█
 * │ Content                        │·
 * └────────────────────────────────┘
 *
 * HORIZONTAL SCROLL:
 * ┌────────────────────────────────┐
 * │  Item 1   Item 2   Item 3  →→  │
 * │░░░░░░░████░░░░░░░░░░░░░░░░░░░░│ ← Horizontal scrollbar
 * └────────────────────────────────┘
 *
 * BOTH DIRECTIONS:
 * ┌────────────────────────────────┐░
 * │                                │█
 * │    Large Content Area          │░
 * │                                │░
 * │                                │░
 * │░░░░████░░░░░░░░░░░░░░░░░░░░░░░│■  ← Corner area
 * └────────────────────────────────┘
 *
 * SCROLLBAR STATES:
 *
 * Idle:
 * │░  Muted track, subtle thumb
 *
 * Hover:
 * │█  Brighter thumb on hover
 *
 * Dragging:
 * │█  Active thumb while scrolling
 *
 * SCROLLBAR VISIBILITY:
 *
 * Always:
 * │█  Always visible
 *
 * Auto (default):
 * │█  Shows when content overflows
 *
 * Hover:
 * │   Hidden until hover over container
 *
 * Never:
 *     No visible scrollbar (still scrollable)
 *
 * COLORS:
 * - Track: transparent or var(--color-bg-elevated)
 * - Thumb: white/20 → white/40 on hover
 * - Corner: transparent
 *
 * USE CASES:
 * - Dropdown menus with many items
 * - Sidebars with long navigation
 * - Chat message containers
 * - Code blocks
 * - Modal content
 * - Table containers
 *
 * ACCESSIBILITY:
 * - Native scrolling behavior preserved
 * - Keyboard scrolling works
 * - Touch scrolling works
 * - Focus management for scroll containers
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

import * as React from 'react';
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const scrollbarVariants = cva(
  'flex touch-none select-none transition-colors',
  {
    variants: {
      orientation: {
        vertical: 'h-full w-2.5 border-l border-l-transparent p-[1px]',
        horizontal: 'h-2.5 flex-col border-t border-t-transparent p-[1px]',
      },
      size: {
        thin: '',
        default: '',
        wide: '',
      },
    },
    compoundVariants: [
      { orientation: 'vertical', size: 'thin', className: 'w-1.5' },
      { orientation: 'vertical', size: 'default', className: 'w-2.5' },
      { orientation: 'vertical', size: 'wide', className: 'w-3.5' },
      { orientation: 'horizontal', size: 'thin', className: 'h-1.5' },
      { orientation: 'horizontal', size: 'default', className: 'h-2.5' },
      { orientation: 'horizontal', size: 'wide', className: 'h-3.5' },
    ],
    defaultVariants: {
      orientation: 'vertical',
      size: 'thin',
    },
  }
);

const thumbVariants = cva(
  'relative flex-1 rounded-full transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-white/20 hover:bg-white/40',
        light: 'bg-white/30 hover:bg-white/50',
        dark: 'bg-black/20 hover:bg-black/40',
        accent: 'bg-white/30 hover:bg-white/50',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface ScrollAreaProps
  extends React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root> {
  /** Scrollbar size */
  scrollbarSize?: 'thin' | 'default' | 'wide';
  /** Scrollbar thumb variant */
  thumbVariant?: 'default' | 'light' | 'dark' | 'accent';
  /** Scrollbar visibility */
  scrollbarVisibility?: 'always' | 'auto' | 'hover' | 'scroll';
  /** Show vertical scrollbar */
  showVertical?: boolean;
  /** Show horizontal scrollbar */
  showHorizontal?: boolean;
  /** Additional class for viewport */
  viewportClassName?: string;
}

/**
 * ScrollArea - Custom scrollable container
 */
const ScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  ScrollAreaProps
>(
  (
    {
      className,
      children,
      scrollbarSize = 'default',
      thumbVariant = 'default',
      scrollbarVisibility = 'auto',
      showVertical = true,
      showHorizontal = false,
      viewportClassName,
      ...props
    },
    ref
  ) => {
    const scrollbarType =
      scrollbarVisibility === 'always'
        ? 'always'
        : scrollbarVisibility === 'hover'
        ? 'hover'
        : scrollbarVisibility === 'scroll'
        ? 'scroll'
        : 'auto';

    return (
      <ScrollAreaPrimitive.Root
        ref={ref}
        className={cn('relative overflow-hidden', className)}
        type={scrollbarType}
        {...props}
      >
        <ScrollAreaPrimitive.Viewport
          className={cn('h-full w-full rounded-[inherit]', viewportClassName)}
        >
          {children}
        </ScrollAreaPrimitive.Viewport>
        {showVertical && (
          <ScrollAreaPrimitive.Scrollbar
            orientation="vertical"
            className={cn(scrollbarVariants({ orientation: 'vertical', size: scrollbarSize }))}
          >
            <ScrollAreaPrimitive.Thumb className={cn(thumbVariants({ variant: thumbVariant }))} />
          </ScrollAreaPrimitive.Scrollbar>
        )}
        {showHorizontal && (
          <ScrollAreaPrimitive.Scrollbar
            orientation="horizontal"
            className={cn(scrollbarVariants({ orientation: 'horizontal', size: scrollbarSize }))}
          >
            <ScrollAreaPrimitive.Thumb className={cn(thumbVariants({ variant: thumbVariant }))} />
          </ScrollAreaPrimitive.Scrollbar>
        )}
        <ScrollAreaPrimitive.Corner className="bg-transparent" />
      </ScrollAreaPrimitive.Root>
    );
  }
);
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName;

/**
 * ScrollAreaScrollbar - Standalone scrollbar for custom implementations
 */
const ScrollAreaScrollbar = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Scrollbar>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Scrollbar> &
    VariantProps<typeof scrollbarVariants>
>(({ className, orientation = 'vertical', size, ...props }, ref) => (
  <ScrollAreaPrimitive.Scrollbar
    ref={ref}
    orientation={orientation}
    className={cn(scrollbarVariants({ orientation, size }), className)}
    {...props}
  />
));
ScrollAreaScrollbar.displayName = ScrollAreaPrimitive.Scrollbar.displayName;

/**
 * ScrollAreaThumb - Standalone thumb for custom implementations
 */
const ScrollAreaThumb = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Thumb>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Thumb> &
    VariantProps<typeof thumbVariants>
>(({ className, variant, ...props }, ref) => (
  <ScrollAreaPrimitive.Thumb
    ref={ref}
    className={cn(thumbVariants({ variant }), className)}
    {...props}
  />
));
ScrollAreaThumb.displayName = ScrollAreaPrimitive.Thumb.displayName;

/**
 * ScrollAreaViewport - Access to viewport for custom implementations
 */
const ScrollAreaViewport = ScrollAreaPrimitive.Viewport;
const ScrollAreaCorner = ScrollAreaPrimitive.Corner;
const ScrollAreaRoot = ScrollAreaPrimitive.Root;

export {
  ScrollArea,
  ScrollAreaRoot,
  ScrollAreaViewport,
  ScrollAreaScrollbar,
  ScrollAreaThumb,
  ScrollAreaCorner,
  scrollbarVariants,
  thumbVariants,
};
