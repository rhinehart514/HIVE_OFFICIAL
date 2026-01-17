'use client';

/**
 * AvatarGroup Primitive
 * LOCKED: January 2026
 *
 * Decisions:
 * - Overlap: Medium (-10px / -space-x-2.5)
 * - Ring: Page color ring for clean cutout
 * - Overflow: Glass match indicator
 * - Z-index: First avatar on top, descending
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import { Avatar, AvatarImage, AvatarFallback, getInitials } from './Avatar';

const avatarGroupVariants = cva(
  'flex -space-x-2', // Negative space for overlap
  {
    variants: {
      size: {
        xs: '-space-x-1.5',
        sm: '-space-x-2',
        default: '-space-x-2.5',
        lg: '-space-x-3',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
);

// Ring around each avatar for separation
const avatarRingVariants = cva(
  'ring-2 ring-[var(--color-bg-page)]',
  {
    variants: {
      size: {
        xs: 'ring-1',
        sm: 'ring-2',
        default: 'ring-2',
        lg: 'ring-[3px]',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
);

// Overflow indicator styles
const overflowIndicatorVariants = cva(
  [
    'flex items-center justify-center',
    'bg-[var(--color-bg-elevated)]',
    'text-[var(--color-text-secondary)]',
    'font-medium',
    // ROUNDED SQUARE like avatars
    'rounded-xl',
    'ring-2 ring-[var(--color-bg-page)]',
  ].join(' '),
  {
    variants: {
      size: {
        xs: 'h-6 w-6 text-[10px] rounded-lg ring-1',
        sm: 'h-8 w-8 text-xs rounded-lg ring-2',
        default: 'h-10 w-10 text-sm rounded-xl ring-2',
        lg: 'h-12 w-12 text-base rounded-xl ring-[3px]',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
);

export interface AvatarGroupUser {
  /** User's image URL */
  src?: string | null;
  /** User's name (for alt text and fallback) */
  name: string;
}

export interface AvatarGroupProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof avatarGroupVariants> {
  /** Array of users to display */
  users: AvatarGroupUser[];
  /** Maximum avatars to show before overflow */
  max?: number;
  /** Show "+X more" overflow indicator */
  showOverflow?: boolean;
}

const AvatarGroup = React.forwardRef<HTMLDivElement, AvatarGroupProps>(
  (
    {
      className,
      size = 'default',
      users,
      max = 4,
      showOverflow = true,
      ...props
    },
    ref
  ) => {
    const displayedUsers = users.slice(0, max);
    const overflow = users.length - max;
    const hasOverflow = overflow > 0 && showOverflow;

    // Map size to avatar size
    const avatarSize = size as 'xs' | 'sm' | 'default' | 'lg';

    return (
      <div
        ref={ref}
        className={cn(avatarGroupVariants({ size }), className)}
        {...props}
      >
        {displayedUsers.map((user, index) => (
          <Avatar
            key={index}
            size={avatarSize}
            className={cn(avatarRingVariants({ size }), 'relative')}
            style={{ zIndex: displayedUsers.length - index }}
          >
            {user.src && <AvatarImage src={user.src} alt={user.name} />}
            <AvatarFallback size={avatarSize}>
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
        ))}
        {hasOverflow && (
          <div
            className={cn(overflowIndicatorVariants({ size }), 'relative')}
            style={{ zIndex: 0 }}
          >
            +{overflow}
          </div>
        )}
      </div>
    );
  }
);

AvatarGroup.displayName = 'AvatarGroup';

export { AvatarGroup, avatarGroupVariants };
