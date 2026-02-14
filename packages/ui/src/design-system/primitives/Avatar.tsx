'use client';

/**
 * Avatar Primitive - LOCKED 2026-01-10
 *
 * LOCKED: rounded-lg (8px), glass initials fallback, ring status
 * NEVER circles. Rounded squares differentiate HIVE.
 *
 * Recipe:
 *   shape: rounded-lg (8px) all sizes
 *   fallback: glass gradient with inset highlight
 *   status: ring indicator (not corner dot)
 *   groups: overlap stack with ring separator
 */

import * as React from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

// LOCKED: rounded-lg (8px) for ALL sizes
const avatarVariants = cva(
  [
    'relative',
    'flex shrink-0',
    'overflow-hidden',
    // LOCKED: rounded-lg (8px), NEVER circles
    'rounded-lg',
  ].join(' '),
  {
    variants: {
      size: {
        xs: 'h-6 w-6',      // 24px
        sm: 'h-8 w-8',      // 32px
        default: 'h-10 w-10', // 40px
        lg: 'h-12 w-12',    // 48px
        xl: 'h-16 w-16',    // 64px
        '2xl': 'h-20 w-20', // 80px
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
);

const avatarImageStyles = cn(
  'aspect-square h-full w-full object-cover'
);

// Flat fallback — no gradient
const fallbackBgClass = 'bg-white/[0.06]';

const avatarFallbackStyles = cn(
  'flex h-full w-full items-center justify-center',
  'text-white/80',
  'font-medium'
);

const avatarFallbackSizeVariants = cva('', {
  variants: {
    size: {
      xs: 'text-label-xs',
      sm: 'text-xs',
      default: 'text-sm',
      lg: 'text-base',
      xl: 'text-lg',
      '2xl': 'text-xl',
    },
  },
  defaultVariants: {
    size: 'default',
  },
});

// Types
export interface AvatarProps
  extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>,
    VariantProps<typeof avatarVariants> {}

export interface AvatarImageProps
  extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image> {}

export interface AvatarFallbackProps
  extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>,
    VariantProps<typeof avatarFallbackSizeVariants> {
  style?: React.CSSProperties;
}

// Components
const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  AvatarProps
>(({ className, size, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(avatarVariants({ size }), className)}
    {...props}
  />
));

Avatar.displayName = AvatarPrimitive.Root.displayName;

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  AvatarImageProps
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn(avatarImageStyles, className)}
    {...props}
  />
));

AvatarImage.displayName = AvatarPrimitive.Image.displayName;

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  AvatarFallbackProps
>(({ className, size, style, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      avatarFallbackStyles,
      avatarFallbackSizeVariants({ size }),
      fallbackBgClass,
      className
    )}
    style={style}
    {...props}
  />
));

AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

// Helper function to get initials from name
export function getInitials(name: string): string {
  const parts = name.split(' ').filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Status type for presence indicator
export type AvatarStatus = 'online' | 'away' | 'offline' | 'dnd';

// Simple Avatar component for common use case
export interface SimpleAvatarProps {
  /** Image source */
  src?: string | null;
  /** Alt text */
  alt?: string;
  /** Fallback initials or content */
  fallback?: string;
  /** Size variant */
  size?: 'xs' | 'sm' | 'default' | 'lg' | 'xl' | '2xl';
  /** Additional className */
  className?: string;
  /** Online status indicator */
  status?: AvatarStatus;
  /** Click handler */
  onClick?: () => void;
}

// Map avatar size to presence dot size
const statusSizeMap: Record<string, 'xs' | 'sm' | 'default' | 'lg'> = {
  xs: 'xs',
  sm: 'xs',
  default: 'sm',
  lg: 'default',
  xl: 'default',
  '2xl': 'lg',
};

// LOCKED: Ring status colors (not corner dot) - using CSS variables
const statusRingColors: Record<AvatarStatus, string> = {
  online: 'ring-[var(--status-success)]',
  away: 'ring-[var(--status-warning)]',
  offline: 'ring-white/20',
  dnd: 'ring-[var(--status-error)]',
};

const SimpleAvatar: React.FC<SimpleAvatarProps> = ({
  src,
  alt = '',
  fallback = '?',
  size = 'default',
  className,
  status,
  onClick,
}) => {
  // LOCKED: Ring status indicator - using CSS variable for offset color
  const statusClass = status ? cn(
    'ring-2 ring-offset-2 ring-offset-[var(--bg-surface)]',
    statusRingColors[status]
  ) : '';

  return (
    <Avatar
      size={size}
      className={cn(className, statusClass, onClick && 'cursor-pointer')}
      onClick={onClick}
    >
      {src && <AvatarImage src={src} alt={alt} />}
      <AvatarFallback size={size}>{fallback}</AvatarFallback>
    </Avatar>
  );
};

export {
  Avatar,
  AvatarImage,
  AvatarFallback,
  SimpleAvatar,
  avatarVariants,
};
