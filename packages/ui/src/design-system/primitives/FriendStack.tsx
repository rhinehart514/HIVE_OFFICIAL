'use client';

/**
 * FriendStack Primitive
 *
 * Overlapping avatar pile showing friends/mutual connections in a space.
 * Enhanced version of AvatarGroup specifically for friend/social proof displays.
 *
 * Features:
 * - Overlapping avatars with page-color ring
 * - +N overflow indicator with gold accent for friends
 * - Optional "X friends here" label
 * - Compact and inline variants
 *
 * Design Notes:
 * - Rounded square avatars (matching HIVE system)
 * - Page-color ring for clean cutout
 * - Gold used sparingly for friend count (social proof = gold budget)
 *
 * @version 1.0.0 - January 2026
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import { Avatar, AvatarImage, AvatarFallback, getInitials } from './Avatar';

// ============================================
// CVA VARIANTS
// ============================================

const friendStackContainerVariants = cva(
  'inline-flex items-center',
  {
    variants: {
      size: {
        xs: '-space-x-1.5 gap-0',
        sm: '-space-x-2 gap-0',
        default: '-space-x-2.5 gap-0',
        lg: '-space-x-3 gap-0',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
);

const friendAvatarRingVariants = cva(
  'ring-[var(--color-bg-page,#0a0a0a)] relative',
  {
    variants: {
      size: {
        xs: 'ring-1',
        sm: 'ring-[1.5px]',
        default: 'ring-2',
        lg: 'ring-[2.5px]',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
);

const overflowIndicatorVariants = cva(
  [
    'flex items-center justify-center',
    'bg-[var(--color-bg-elevated,#1a1a1a)]',
    'font-medium',
    'rounded-xl', // Rounded square like avatars
    'relative',
  ].join(' '),
  {
    variants: {
      size: {
        xs: 'h-5 w-5 text-[9px] rounded-lg ring-1',
        sm: 'h-6 w-6 text-[10px] rounded-lg ring-[1.5px]',
        default: 'h-7 w-7 text-[11px] rounded-xl ring-2',
        lg: 'h-8 w-8 text-xs rounded-xl ring-[2.5px]',
      },
      variant: {
        default: 'text-[var(--color-text-secondary,#a3a3a3)] ring-[var(--color-bg-page,#0a0a0a)]',
        gold: 'text-[var(--color-accent-gold,#FFD700)] ring-[var(--color-bg-page,#0a0a0a)] bg-[var(--color-accent-gold,#FFD700)]/10',
      },
    },
    defaultVariants: {
      size: 'default',
      variant: 'default',
    },
  }
);

const labelVariants = cva(
  'text-[var(--color-accent-gold,#FFD700)] font-medium',
  {
    variants: {
      size: {
        xs: 'text-[10px] ml-1.5',
        sm: 'text-[11px] ml-2',
        default: 'text-xs ml-2',
        lg: 'text-sm ml-2.5',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
);

// ============================================
// TYPES
// ============================================

export interface Friend {
  /** Unique identifier */
  id?: string;
  /** Friend's display name */
  name: string;
  /** Friend's avatar URL */
  avatarUrl?: string | null;
}

export interface FriendStackProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'>,
    VariantProps<typeof friendStackContainerVariants> {
  /** Array of friends to display */
  friends: Friend[];
  /** Maximum avatars to show before overflow (default: 3) */
  max?: number;
  /** Show overflow indicator */
  showOverflow?: boolean;
  /** Use gold styling for overflow (social proof emphasis) */
  goldOverflow?: boolean;
  /** Show "X friends here" label */
  showLabel?: boolean;
  /** Custom label text (default: "{count} friends here") */
  labelText?: (count: number) => string;
}

// ============================================
// COMPONENT
// ============================================

const FriendStack = React.forwardRef<HTMLDivElement, FriendStackProps>(
  (
    {
      className,
      size = 'default',
      friends,
      max = 3,
      showOverflow = true,
      goldOverflow = true,
      showLabel = false,
      labelText,
      ...props
    },
    ref
  ) => {
    if (!friends || friends.length === 0) {
      return null;
    }

    const displayedFriends = friends.slice(0, max);
    const overflowCount = friends.length - max;
    const hasOverflow = overflowCount > 0 && showOverflow;
    const totalCount = friends.length;

    // Map size to avatar size
    const avatarSizeMap: Record<string, 'xs' | 'sm' | 'default' | 'lg'> = {
      xs: 'xs',
      sm: 'sm',
      default: 'sm', // Use slightly smaller avatars for better density
      lg: 'default',
    };
    const avatarSize = avatarSizeMap[size || 'default'];

    // Generate label
    const defaultLabel = (count: number) =>
      `${count} friend${count !== 1 ? 's' : ''} here`;
    const label = labelText ? labelText(totalCount) : defaultLabel(totalCount);

    return (
      <div
        ref={ref}
        className={cn('inline-flex items-center', className)}
        {...props}
      >
        {/* Avatar stack */}
        <div className={cn(friendStackContainerVariants({ size }))}>
          {displayedFriends.map((friend, index) => (
            <Avatar
              key={friend.id ?? index}
              size={avatarSize}
              className={cn(friendAvatarRingVariants({ size }))}
              style={{ zIndex: displayedFriends.length - index }}
            >
              {friend.avatarUrl && (
                <AvatarImage src={friend.avatarUrl} alt={friend.name} />
              )}
              <AvatarFallback size={avatarSize}>
                {getInitials(friend.name)}
              </AvatarFallback>
            </Avatar>
          ))}

          {/* Overflow indicator */}
          {hasOverflow && (
            <div
              className={cn(
                overflowIndicatorVariants({
                  size,
                  variant: goldOverflow ? 'gold' : 'default',
                })
              )}
              style={{ zIndex: 0 }}
            >
              +{overflowCount}
            </div>
          )}
        </div>

        {/* Label */}
        {showLabel && (
          <span className={cn(labelVariants({ size }))}>
            {label}
          </span>
        )}
      </div>
    );
  }
);

FriendStack.displayName = 'FriendStack';

// ============================================
// INLINE VARIANT (for cards with text)
// ============================================

export interface FriendStackInlineProps extends Omit<FriendStackProps, 'showLabel' | 'labelText'> {
  /** Singular/plural friend label */
  friendLabel?: { singular: string; plural: string };
}

const FriendStackInline = React.forwardRef<HTMLDivElement, FriendStackInlineProps>(
  (
    {
      friends,
      friendLabel = { singular: 'friend', plural: 'friends' },
      size = 'sm',
      max = 3,
      ...props
    },
    ref
  ) => {
    if (!friends || friends.length === 0) {
      return null;
    }

    const count = friends.length;
    const label = count === 1 ? friendLabel.singular : friendLabel.plural;

    return (
      <div ref={ref} className="inline-flex items-center gap-2" {...props}>
        <FriendStack
          friends={friends}
          size={size}
          max={max}
          showLabel={false}
          goldOverflow
        />
        <span className={cn(labelVariants({ size }))}>
          {count} {label}
        </span>
      </div>
    );
  }
);

FriendStackInline.displayName = 'FriendStackInline';

// ============================================
// EXPORTS
// ============================================

export {
  FriendStack,
  FriendStackInline,
  friendStackContainerVariants,
  friendAvatarRingVariants,
  overflowIndicatorVariants,
  labelVariants,
};
