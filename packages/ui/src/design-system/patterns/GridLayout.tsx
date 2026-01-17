'use client';

/**
 * GridLayout Pattern
 * Source: docs/design-system/COMPONENTS.md
 *
 * Simple, responsive grid layout pattern for arranging content.
 * For page-level grid templates, see templates/Grid.tsx
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * VISUAL DESCRIPTION (for AI reference)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * AUTO-FIT GRID (default):
 * ┌─────────────────────────────────────────────────────────┐
 * │ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐            │
 * │ │        │ │        │ │        │ │        │            │
 * │ │  Item  │ │  Item  │ │  Item  │ │  Item  │            │
 * │ │        │ │        │ │        │ │        │            │
 * │ └────────┘ └────────┘ └────────┘ └────────┘            │
 * │ ┌────────┐ ┌────────┐ ┌────────┐                       │
 * │ │        │ │        │ │        │                       │
 * │ │  Item  │ │  Item  │ │  Item  │                       │
 * │ │        │ │        │ │        │                       │
 * │ └────────┘ └────────┘ └────────┘                       │
 * └─────────────────────────────────────────────────────────┘
 *
 * FIXED COLUMNS:
 * ┌─────────────────────────────────────────────────────────┐
 * │ ┌──────────────────┐ ┌──────────────────┐               │
 * │ │                  │ │                  │               │
 * │ │       Item       │ │       Item       │               │
 * │ │                  │ │                  │               │
 * │ └──────────────────┘ └──────────────────┘               │
 * │ ┌──────────────────┐ ┌──────────────────┐               │
 * │ │                  │ │                  │               │
 * │ │       Item       │ │       Item       │               │
 * │ │                  │ │                  │               │
 * │ └──────────────────┘ └──────────────────┘               │
 * └─────────────────────────────────────────────────────────┘
 *
 * MASONRY (variable height):
 * ┌─────────────────────────────────────────────────────────┐
 * │ ┌────────┐ ┌────────┐ ┌────────┐                       │
 * │ │        │ │        │ │  Tall  │                       │
 * │ │  Item  │ │  Tall  │ │  Item  │                       │
 * │ │        │ │  Item  │ │        │                       │
 * │ └────────┘ │        │ │        │                       │
 * │ ┌────────┐ │        │ │        │                       │
 * │ │  Item  │ └────────┘ └────────┘                       │
 * │ │        │ ┌────────┐ ┌────────┐                       │
 * │ └────────┘ │  Item  │ │  Item  │                       │
 * │            └────────┘ └────────┘                       │
 * └─────────────────────────────────────────────────────────┘
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

// ============================================
// GRID VARIANTS
// ============================================

const gridLayoutVariants = cva('w-full', {
  variants: {
    variant: {
      autoFit: 'grid',
      fixed: 'grid',
      masonry: 'columns-1 sm:columns-2 lg:columns-3 xl:columns-4',
    },
    columns: {
      1: 'grid-cols-1',
      2: 'grid-cols-1 sm:grid-cols-2',
      3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
      4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
      5: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
      6: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6',
    },
    gap: {
      none: 'gap-0',
      xs: 'gap-1',
      sm: 'gap-2',
      md: 'gap-4',
      lg: 'gap-6',
      xl: 'gap-8',
    },
  },
  compoundVariants: [
    {
      variant: 'masonry',
      gap: 'xs',
      className: 'gap-1 [&>*]:mb-1',
    },
    {
      variant: 'masonry',
      gap: 'sm',
      className: 'gap-2 [&>*]:mb-2',
    },
    {
      variant: 'masonry',
      gap: 'md',
      className: 'gap-4 [&>*]:mb-4',
    },
    {
      variant: 'masonry',
      gap: 'lg',
      className: 'gap-6 [&>*]:mb-6',
    },
    {
      variant: 'masonry',
      gap: 'xl',
      className: 'gap-8 [&>*]:mb-8',
    },
  ],
  defaultVariants: {
    variant: 'fixed',
    columns: 3,
    gap: 'md',
  },
});

const gridItemVariants = cva('', {
  variants: {
    span: {
      1: 'col-span-1',
      2: 'col-span-1 sm:col-span-2',
      3: 'col-span-1 sm:col-span-2 lg:col-span-3',
      4: 'col-span-1 sm:col-span-2 lg:col-span-3 xl:col-span-4',
      full: 'col-span-full',
    },
    rowSpan: {
      1: 'row-span-1',
      2: 'row-span-2',
      3: 'row-span-3',
    },
  },
  defaultVariants: {
    span: 1,
    rowSpan: 1,
  },
});

// ============================================
// TYPES
// ============================================

export interface GridLayoutProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof gridLayoutVariants> {
  /** Enable staggered animation */
  animated?: boolean;
  /** Minimum item width for autoFit mode */
  minItemWidth?: string;
  /** Loading state */
  loading?: boolean;
  /** Empty state content */
  emptyContent?: React.ReactNode;
  /** Number of items (for empty check) */
  itemCount?: number;
}

export interface GridItemProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof gridItemVariants> {
  /** Animation index for stagger */
  index?: number;
}

// ============================================
// CONTEXT
// ============================================

interface GridLayoutContextValue {
  variant: 'autoFit' | 'fixed' | 'masonry';
  animated: boolean;
}

const GridLayoutContext = React.createContext<GridLayoutContextValue>({
  variant: 'fixed',
  animated: false,
});

const useGridLayout = () => React.useContext(GridLayoutContext);

// ============================================
// ANIMATION CONFIG
// ============================================

const itemAnimation = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

// ============================================
// COMPONENTS
// ============================================

/**
 * GridLayout - Container for grid items
 */
const GridLayout = React.forwardRef<HTMLDivElement, GridLayoutProps>(
  (
    {
      className,
      variant = 'fixed',
      columns,
      gap,
      animated = false,
      minItemWidth = '250px',
      loading,
      emptyContent,
      itemCount,
      children,
      style,
      ...props
    },
    ref
  ) => {
    const isEmpty = itemCount === 0;

    // For autoFit, use CSS grid auto-fit with minmax
    const gridStyle: React.CSSProperties =
      variant === 'autoFit'
        ? {
            ...style,
            display: 'grid',
            gridTemplateColumns: `repeat(auto-fit, minmax(${minItemWidth}, 1fr))`,
          }
        : (style ?? {});

    return (
      <GridLayoutContext.Provider
        value={{ variant: variant ?? 'fixed', animated }}
      >
        <div
          ref={ref}
          className={cn(
            gridLayoutVariants({
              variant,
              columns: variant === 'autoFit' ? undefined : columns,
              gap,
            }),
            className
          )}
          style={gridStyle}
          {...props}
        >
          {loading ? (
            <GridSkeleton
              count={6}
              columns={typeof columns === 'number' ? columns : 3}
            />
          ) : isEmpty && emptyContent ? (
            <div className="col-span-full py-12 text-center text-[var(--text-tertiary)]">
              {emptyContent}
            </div>
          ) : (
            children
          )}
        </div>
      </GridLayoutContext.Provider>
    );
  }
);
GridLayout.displayName = 'GridLayout';

/**
 * GridItem - Individual grid item with optional spanning
 */
const GridItem = React.forwardRef<HTMLDivElement, GridItemProps>(
  ({ className, span, rowSpan, index = 0, children, ...props }, ref) => {
    const { variant, animated } = useGridLayout();

    // Masonry items don't use grid spans
    const isMasonry = variant === 'masonry';

    const content = (
      <div
        ref={ref}
        className={cn(
          !isMasonry && gridItemVariants({ span, rowSpan }),
          isMasonry && 'break-inside-avoid',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );

    if (animated) {
      return (
        <motion.div
          {...itemAnimation}
          transition={{
            duration: 0.3,
            delay: index * 0.05,
            ease: [0.22, 1, 0.36, 1],
          }}
          className={cn(
            !isMasonry && gridItemVariants({ span, rowSpan }),
            isMasonry && 'break-inside-avoid'
          )}
        >
          {children}
        </motion.div>
      );
    }

    return content;
  }
);
GridItem.displayName = 'GridItem';

/**
 * GridSkeleton - Loading skeleton for grid
 */
interface GridSkeletonProps {
  count?: number;
  columns?: number;
}

const GridSkeleton: React.FC<GridSkeletonProps> = ({ count = 6 }) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className="animate-pulse rounded-xl bg-[var(--bg-surface)] aspect-video"
      >
        <div className="h-full w-full bg-white/[0.03]" />
      </div>
    ))}
  </>
);

/**
 * BentoGrid - Special layout for bento-style grids with featured items
 */
export interface BentoGridProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Gap between items */
  gap?: 'sm' | 'md' | 'lg';
}

const BentoGrid = React.forwardRef<HTMLDivElement, BentoGridProps>(
  ({ className, gap = 'md', children, ...props }, ref) => {
    const gapClasses = {
      sm: 'gap-2',
      md: 'gap-4',
      lg: 'gap-6',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'grid grid-cols-2 md:grid-cols-4 auto-rows-[200px]',
          gapClasses[gap],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
BentoGrid.displayName = 'BentoGrid';

/**
 * BentoItem - Item within a BentoGrid
 */
export interface BentoItemProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Size preset */
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const BentoItem = React.forwardRef<HTMLDivElement, BentoItemProps>(
  ({ className, size = 'sm', children, ...props }, ref) => {
    const sizeClasses = {
      sm: 'col-span-1 row-span-1',
      md: 'col-span-1 md:col-span-2 row-span-1',
      lg: 'col-span-1 row-span-2',
      xl: 'col-span-2 row-span-2',
    };

    return (
      <div
        ref={ref}
        className={cn(
          sizeClasses[size],
          'rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]',
          'overflow-hidden',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
BentoItem.displayName = 'BentoItem';

export {
  GridLayout,
  GridItem,
  GridSkeleton,
  BentoGrid,
  BentoItem,
  gridLayoutVariants,
  gridItemVariants,
};
