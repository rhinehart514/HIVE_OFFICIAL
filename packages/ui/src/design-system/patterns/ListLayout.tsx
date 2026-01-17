'use client';

/**
 * ListLayout Pattern
 * Source: docs/design-system/COMPONENTS.md
 *
 * Reusable list layout patterns for displaying items in various configurations.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * VISUAL DESCRIPTION (for AI reference)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * BASIC LIST:
 * ┌──────────────────────────────────────────┐
 * │ ┌──────────────────────────────────────┐ │
 * │ │ List Item 1                          │ │
 * │ └──────────────────────────────────────┘ │
 * │ ┌──────────────────────────────────────┐ │
 * │ │ List Item 2                          │ │
 * │ └──────────────────────────────────────┘ │
 * │ ┌──────────────────────────────────────┐ │
 * │ │ List Item 3                          │ │
 * │ └──────────────────────────────────────┘ │
 * └──────────────────────────────────────────┘
 *
 * GROUPED LIST:
 * ┌──────────────────────────────────────────┐
 * │  Group A                                 │
 * │ ┌──────────────────────────────────────┐ │
 * │ │ Item 1                               │ │
 * │ │ Item 2                               │ │
 * │ └──────────────────────────────────────┘ │
 * │                                          │
 * │  Group B                                 │
 * │ ┌──────────────────────────────────────┐ │
 * │ │ Item 3                               │ │
 * │ │ Item 4                               │ │
 * │ └──────────────────────────────────────┘ │
 * └──────────────────────────────────────────┘
 *
 * DENSE LIST (compact):
 * ┌──────────────────────────────────────────┐
 * │ Item 1                                   │
 * │ Item 2                                   │
 * │ Item 3                                   │
 * │ Item 4                                   │
 * └──────────────────────────────────────────┘
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

// ============================================
// LIST VARIANTS
// ============================================

const listLayoutVariants = cva('w-full', {
  variants: {
    variant: {
      basic: 'space-y-2',
      grouped: 'space-y-6',
      dense: 'divide-y divide-[var(--border-subtle)]',
      card: 'space-y-3',
    },
    size: {
      sm: '',
      md: '',
      lg: '',
    },
  },
  defaultVariants: {
    variant: 'basic',
    size: 'md',
  },
});

const listItemVariants = cva(
  'w-full transition-colors duration-150',
  {
    variants: {
      variant: {
        basic: 'p-3 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)]',
        grouped: 'p-3 first:rounded-t-lg last:rounded-b-lg hover:bg-[var(--bg-muted)]',
        dense: 'py-2 px-3 hover:bg-[var(--bg-subtle)]',
        card: 'p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[var(--border-default)]',
      },
      interactive: {
        true: 'cursor-pointer',
        false: '',
      },
      selected: {
        true: 'ring-1 ring-white/20',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'basic',
      interactive: false,
      selected: false,
    },
  }
);

const listGroupVariants = cva('', {
  variants: {
    variant: {
      basic: '',
      grouped: 'rounded-lg bg-[var(--bg-surface)] overflow-hidden',
      dense: '',
      card: '',
    },
  },
  defaultVariants: {
    variant: 'grouped',
  },
});

// ============================================
// TYPES
// ============================================

export interface ListLayoutProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof listLayoutVariants> {
  /** Enable staggered animation */
  animated?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Empty state content */
  emptyContent?: React.ReactNode;
  /** Number of items (for empty check) */
  itemCount?: number;
}

export interface ListItemProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof listItemVariants> {
  /** Leading content (icon, avatar) */
  leading?: React.ReactNode;
  /** Trailing content (badge, action) */
  trailing?: React.ReactNode;
  /** Primary text */
  primary?: React.ReactNode;
  /** Secondary text */
  secondary?: React.ReactNode;
  /** Animation index for stagger */
  index?: number;
}

export interface ListGroupProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof listGroupVariants> {
  /** Group title */
  title?: string;
  /** Group subtitle */
  subtitle?: string;
  /** Group action (e.g., "See all") */
  action?: React.ReactNode;
}

export interface ListHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Title */
  title?: string;
  /** Subtitle */
  subtitle?: string;
  /** Action button/link */
  action?: React.ReactNode;
}

// ============================================
// CONTEXT
// ============================================

interface ListLayoutContextValue {
  variant: 'basic' | 'grouped' | 'dense' | 'card';
  animated: boolean;
}

const ListLayoutContext = React.createContext<ListLayoutContextValue>({
  variant: 'basic',
  animated: false,
});

const useListLayout = () => React.useContext(ListLayoutContext);

// ============================================
// ANIMATION CONFIG
// ============================================

const itemAnimation = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

// ============================================
// COMPONENTS
// ============================================

/**
 * ListLayout - Container for list items
 */
const ListLayout = React.forwardRef<HTMLDivElement, ListLayoutProps>(
  (
    {
      className,
      variant = 'basic',
      size,
      animated = false,
      loading,
      emptyContent,
      itemCount,
      children,
      ...props
    },
    ref
  ) => {
    const isEmpty = itemCount === 0;

    return (
      <ListLayoutContext.Provider value={{ variant: variant ?? 'basic', animated }}>
        <div
          ref={ref}
          className={cn(listLayoutVariants({ variant, size }), className)}
          role="list"
          {...props}
        >
          {loading ? (
            <ListSkeleton count={5} variant={variant ?? 'basic'} />
          ) : isEmpty && emptyContent ? (
            <div className="py-8 text-center text-[var(--text-tertiary)]">
              {emptyContent}
            </div>
          ) : animated ? (
            <AnimatePresence mode="popLayout">{children}</AnimatePresence>
          ) : (
            children
          )}
        </div>
      </ListLayoutContext.Provider>
    );
  }
);
ListLayout.displayName = 'ListLayout';

/**
 * ListItem - Individual list item
 */
const ListItem = React.forwardRef<HTMLDivElement, ListItemProps>(
  (
    {
      className,
      variant: variantProp,
      interactive,
      selected,
      leading,
      trailing,
      primary,
      secondary,
      index = 0,
      onClick,
      children,
      ...props
    },
    ref
  ) => {
    const { variant: contextVariant, animated } = useListLayout();
    const variant = variantProp ?? contextVariant;
    const isInteractive = interactive ?? !!onClick;

    const content = (
      <div
        ref={ref}
        className={cn(
          listItemVariants({ variant, interactive: isInteractive, selected }),
          'flex items-center gap-3',
          className
        )}
        role="listitem"
        onClick={onClick}
        {...props}
      >
        {leading && <div className="flex-shrink-0">{leading}</div>}
        <div className="flex-1 min-w-0">
          {primary || secondary ? (
            <>
              {primary && (
                <div className="text-sm font-medium text-[var(--text-primary)] truncate">
                  {primary}
                </div>
              )}
              {secondary && (
                <div className="text-xs text-[var(--text-tertiary)] truncate">
                  {secondary}
                </div>
              )}
            </>
          ) : (
            children
          )}
        </div>
        {trailing && <div className="flex-shrink-0">{trailing}</div>}
      </div>
    );

    if (animated) {
      return (
        <motion.div
          {...itemAnimation}
          transition={{
            duration: 0.2,
            delay: index * 0.05,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          {content}
        </motion.div>
      );
    }

    return content;
  }
);
ListItem.displayName = 'ListItem';

/**
 * ListGroup - Group of list items with header
 */
const ListGroup = React.forwardRef<HTMLDivElement, ListGroupProps>(
  (
    { className, variant: variantProp, title, subtitle, action, children, ...props },
    ref
  ) => {
    const { variant: contextVariant } = useListLayout();
    const variant = variantProp ?? contextVariant;

    return (
      <div ref={ref} className={cn('space-y-2', className)} {...props}>
        {(title || subtitle || action) && (
          <div className="flex items-center justify-between px-1">
            <div>
              {title && (
                <h3 className="text-sm font-medium text-[var(--text-secondary)]">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-xs text-[var(--text-tertiary)]">{subtitle}</p>
              )}
            </div>
            {action && <div>{action}</div>}
          </div>
        )}
        <div className={cn(listGroupVariants({ variant }))}>{children}</div>
      </div>
    );
  }
);
ListGroup.displayName = 'ListGroup';

/**
 * ListHeader - Header for the entire list
 */
const ListHeader = React.forwardRef<HTMLDivElement, ListHeaderProps>(
  ({ className, title, subtitle, action, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex items-center justify-between pb-3 mb-3 border-b border-[var(--border-subtle)]',
        className
      )}
      {...props}
    >
      <div>
        {title && (
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            {title}
          </h2>
        )}
        {subtitle && (
          <p className="text-sm text-[var(--text-tertiary)]">{subtitle}</p>
        )}
        {children}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
);
ListHeader.displayName = 'ListHeader';

/**
 * ListDivider - Visual separator between items
 */
const ListDivider = React.forwardRef<
  HTMLHRElement,
  React.HTMLAttributes<HTMLHRElement>
>(({ className, ...props }, ref) => (
  <hr
    ref={ref}
    className={cn('border-[var(--border-subtle)] my-2', className)}
    {...props}
  />
));
ListDivider.displayName = 'ListDivider';

/**
 * ListSkeleton - Loading skeleton for list
 */
interface ListSkeletonProps {
  count?: number;
  variant?: 'basic' | 'grouped' | 'dense' | 'card';
}

const ListSkeleton: React.FC<ListSkeletonProps> = ({
  count = 5,
  variant = 'basic',
}) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className={cn(
          'animate-pulse',
          variant === 'card'
            ? 'p-4 rounded-xl bg-[var(--bg-surface)]'
            : variant === 'dense'
            ? 'py-2 px-3'
            : 'p-3 rounded-lg bg-[var(--bg-surface)]'
        )}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/[0.06]" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 rounded bg-white/[0.06]" />
            <div className="h-3 w-1/2 rounded bg-white/[0.06]" />
          </div>
        </div>
      </div>
    ))}
  </>
);

export {
  ListLayout,
  ListItem,
  ListGroup,
  ListHeader,
  ListDivider,
  ListSkeleton,
  listLayoutVariants,
  listItemVariants,
  listGroupVariants,
};
