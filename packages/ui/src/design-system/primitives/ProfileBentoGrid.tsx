'use client';

/**
 * ProfileBentoGrid Primitive - LOCKED 2026-01-14
 *
 * LOCKED: Responsive bento grid layout for profile dashboards
 * Mobile: 1 column stacked
 * Tablet: 2 columns, drag disabled
 * Desktop: 3+ columns with flexible spans
 *
 * Recipe:
 *   container: CSS Grid with responsive columns
 *   items: Optional span controls (1-3 columns)
 *   animation: Staggered fade-up entrance
 *   responsive: Automatic column collapse on mobile
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

// LOCKED: Spring animation config
const springConfig = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 30,
};

// LOCKED: Premium easing
const EASE = [0.22, 1, 0.36, 1] as const;

// Container variants
const bentogridContainerVariants = cva(
  [
    'grid',
    'gap-4',
    // Responsive columns
    'grid-cols-1',
    'sm:grid-cols-2',
    'lg:grid-cols-3',
  ].join(' '),
  {
    variants: {
      columns: {
        2: 'lg:grid-cols-2',
        3: 'lg:grid-cols-3',
        4: 'lg:grid-cols-3 xl:grid-cols-4',
      },
      gap: {
        sm: 'gap-3',
        default: 'gap-4',
        lg: 'gap-6',
      },
    },
    defaultVariants: {
      columns: 3,
      gap: 'default',
    },
  }
);

// Item variants
const bentogridItemVariants = cva('', {
  variants: {
    colSpan: {
      1: 'col-span-1',
      2: 'col-span-1 sm:col-span-2',
      3: 'col-span-1 sm:col-span-2 lg:col-span-3',
      full: 'col-span-full',
    },
    rowSpan: {
      1: 'row-span-1',
      2: 'row-span-1 lg:row-span-2',
    },
  },
  defaultVariants: {
    colSpan: 1,
    rowSpan: 1,
  },
});

// Animation variants for staggered entrance
const containerAnimationVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemAnimationVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: EASE,
    },
  },
};

// Types
export interface ProfileBentoGridProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Number of columns at desktop width */
  columns?: 2 | 3 | 4;
  /** Gap size between items */
  gap?: 'sm' | 'default' | 'lg';
  /** Enable staggered animation on mount */
  animated?: boolean;
  /** Custom animation delay offset */
  animationDelay?: number;
}

export interface ProfileBentoItemProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Column span (1-3 or full width) */
  colSpan?: 1 | 2 | 3 | 'full';
  /** Row span (1-2) */
  rowSpan?: 1 | 2;
  /** Animation order (for custom delays) */
  order?: number;
  /** Custom animation delay override */
  delay?: number;
}

// Main grid component
const ProfileBentoGrid = React.forwardRef<HTMLDivElement, ProfileBentoGridProps>(
  (
    {
      className,
      children,
      columns = 3,
      gap = 'default',
      animated = true,
      animationDelay = 0,
      ...props
    },
    ref
  ) => {
    if (animated) {
      return (
        <motion.div
          ref={ref}
          className={cn(bentogridContainerVariants({ columns, gap }), className)}
          variants={containerAnimationVariants}
          initial="hidden"
          animate="visible"
          {...(props as any)}
        >
          {React.Children.map(children, (child, index) => {
            if (!React.isValidElement(child)) return child;
            return React.cloneElement(child as React.ReactElement<any>, {
              _animationIndex: index,
              _baseDelay: animationDelay,
            });
          })}
        </motion.div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(bentogridContainerVariants({ columns, gap }), className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

ProfileBentoGrid.displayName = 'ProfileBentoGrid';

// Grid item component
const ProfileBentoItem = React.forwardRef<
  HTMLDivElement,
  ProfileBentoItemProps & { _animationIndex?: number; _baseDelay?: number }
>(
  (
    {
      className,
      children,
      colSpan = 1,
      rowSpan = 1,
      order,
      delay,
      _animationIndex = 0,
      _baseDelay = 0,
      ...props
    },
    ref
  ) => {
    // If this is used inside an animated grid, wrap in motion.div
    const animationDelay = delay ?? _baseDelay + _animationIndex * 0.08;

    return (
      <motion.div
        ref={ref}
        className={cn(bentogridItemVariants({ colSpan, rowSpan }), className)}
        variants={itemAnimationVariants}
        custom={animationDelay}
        {...(props as any)}
      >
        {children}
      </motion.div>
    );
  }
);

ProfileBentoItem.displayName = 'ProfileBentoItem';

// Sidebar slot - fixed width column on desktop, stacks on mobile
const ProfileBentoSidebar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { width?: number }
>(({ className, children, width = 280, style, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        'w-full lg:w-auto lg:shrink-0',
        className
      )}
      style={{
        ...style,
        '--sidebar-width': `${width}px`,
      } as React.CSSProperties}
      {...props}
    >
      <div className="lg:w-[var(--sidebar-width)] lg:sticky lg:top-24">
        {children}
      </div>
    </div>
  );
});

ProfileBentoSidebar.displayName = 'ProfileBentoSidebar';

// Main content area - takes remaining space
const ProfileBentoMain = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn('flex-1 min-w-0', className)}
      {...props}
    >
      {children}
    </div>
  );
});

ProfileBentoMain.displayName = 'ProfileBentoMain';

// Layout container for sidebar + main pattern
const ProfileBentoLayout = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { sidebarPosition?: 'left' | 'right' }
>(({ className, children, sidebarPosition = 'left', ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        'flex flex-col lg:flex-row gap-6',
        sidebarPosition === 'right' && 'lg:flex-row-reverse',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});

ProfileBentoLayout.displayName = 'ProfileBentoLayout';

export {
  ProfileBentoGrid,
  ProfileBentoItem,
  ProfileBentoSidebar,
  ProfileBentoMain,
  ProfileBentoLayout,
  // Export variants
  bentogridContainerVariants,
  bentogridItemVariants,
  // Export animation variants
  containerAnimationVariants as profileBentoContainerAnimationVariants,
  itemAnimationVariants as profileBentoItemAnimationVariants,
};
