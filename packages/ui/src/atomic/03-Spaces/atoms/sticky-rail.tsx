/**
 * StickyRail - Sticky sidebar wrapper for right-rail content
 *
 * Provides a sticky container that scrolls independently within its bounds.
 * Used for sidebar widgets that should remain visible while scrolling main content.
 *
 * Features:
 * - Sticky positioning with configurable top offset
 * - Independent scroll with max-height constraint
 * - Smooth fade-out at bottom when content overflows
 * - Respects parent container bounds
 *
 * @example
 * <StickyRail>
 *   <SpaceAboutWidget />
 *   <SpaceToolsWidget />
 *   <SpaceMembersWidget />
 * </StickyRail>
 */
'use client';

import * as React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '../../../lib/utils';
import { railWidgetVariants } from '../../../lib/motion-variants-spaces';

export interface StickyRailProps extends Omit<HTMLMotionProps<'aside'>, 'children'> {
  /** Top offset for sticky positioning (accounts for header height) */
  topOffset?: number;
  /** Maximum height calculation offset (header + padding) */
  maxHeightOffset?: number;
  /** Gap between child widgets */
  gap?: 'sm' | 'md' | 'lg';
  /** Whether to show fade gradient at bottom when overflowing */
  showFadeGradient?: boolean;
  /** Whether to animate on mount */
  animate?: boolean;
  /** Children widgets */
  children: React.ReactNode;
}

const GAP_CLASSES: Record<string, string> = {
  sm: 'gap-3',
  md: 'gap-4',
  lg: 'gap-6',
};

export const StickyRail = React.forwardRef<HTMLElement, StickyRailProps>(
  (
    {
      topOffset = 120,
      maxHeightOffset = 144,
      gap = 'md',
      showFadeGradient = true,
      animate = true,
      className,
      children,
      style,
      ...props
    },
    ref
  ) => {
    const [isOverflowing, setIsOverflowing] = React.useState(false);
    const contentRef = React.useRef<HTMLDivElement>(null);

    // Check if content overflows
    React.useEffect(() => {
      const checkOverflow = () => {
        if (contentRef.current) {
          const { scrollHeight, clientHeight } = contentRef.current;
          setIsOverflowing(scrollHeight > clientHeight);
        }
      };

      checkOverflow();
      window.addEventListener('resize', checkOverflow);
      return () => window.removeEventListener('resize', checkOverflow);
    }, [children]);

    const computedStyle = {
      top: `${topOffset}px`,
      maxHeight: `calc(100vh - ${maxHeightOffset}px)`,
      ...style,
    };

    return (
      <motion.aside
        ref={ref}
        className={cn(
          'sticky self-start',
          'overflow-y-auto overflow-x-hidden',
          // Hide scrollbar but keep functionality
          'scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-transparent',
          'hover:scrollbar-thumb-neutral-600',
          className
        )}
        style={computedStyle}
        variants={animate ? railWidgetVariants : undefined}
        initial={animate ? 'initial' : undefined}
        animate={animate ? 'animate' : undefined}
        {...props}
      >
        {/* Content container with gap */}
        <div ref={contentRef} className={cn('flex flex-col', GAP_CLASSES[gap])}>
          {children}
        </div>

        {/* Fade gradient overlay when overflowing */}
        {showFadeGradient && isOverflowing && (
          <div
            className={cn(
              'pointer-events-none absolute bottom-0 left-0 right-0 h-16',
              'bg-gradient-to-t from-neutral-950 via-neutral-950/80 to-transparent'
            )}
            aria-hidden="true"
          />
        )}
      </motion.aside>
    );
  }
);

StickyRail.displayName = 'StickyRail';

// Preset for standard space sidebar
export interface SpaceSidebarRailProps extends Omit<StickyRailProps, 'topOffset' | 'maxHeightOffset'> {
  /** Whether header is collapsed (adjusts offset) */
  headerCollapsed?: boolean;
}

export const SpaceSidebarRail = React.forwardRef<HTMLElement, SpaceSidebarRailProps>(
  ({ headerCollapsed = false, ...props }, ref) => {
    // Adjust offsets based on header state
    const topOffset = headerCollapsed ? 80 : 120;
    const maxHeightOffset = headerCollapsed ? 104 : 144;

    return (
      <StickyRail
        ref={ref}
        topOffset={topOffset}
        maxHeightOffset={maxHeightOffset}
        {...props}
      />
    );
  }
);

SpaceSidebarRail.displayName = 'SpaceSidebarRail';
