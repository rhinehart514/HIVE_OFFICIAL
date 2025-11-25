/**
 * Example Molecule: UserPresence
 *
 * DEMONSTRATES:
 * - Molecule using semantic tokens (backgrounds, text, borders)
 * - Composition of atoms (Avatar + StatusIndicator)
 * - Proper TypeScript patterns with strict types
 * - Responsive sizing with consistent patterns
 *
 * USAGE:
 * <UserPresence
 *   user={{ name: "Sarah Chen", avatarUrl: "/avatar.jpg", handle: "sarahc" }}
 *   status="online"
 *   showHandle
 * />
 */

import * as React from 'react';
import { cn } from '../../../lib/utils';
import { StatusIndicator } from './example-status-indicator';

/**
 * User data interface with strict types
 */
export interface User {
  name: string;
  avatarUrl?: string;
  handle?: string;
}

/**
 * UserPresence component props
 * Strict typing ensures type safety at call sites
 */
export interface UserPresenceProps {
  /**
   * User data
   */
  user: User;

  /**
   * Online status
   */
  status: 'online' | 'away' | 'offline';

  /**
   * Show user handle below name
   * @default false
   */
  showHandle?: boolean;

  /**
   * Size variant
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Additional class names
   */
  className?: string;

  /**
   * Click handler
   */
  onClick?: () => void;
}

/**
 * Size configuration object for consistent patterns
 */
const sizeConfig = {
  sm: {
    avatar: 'w-8 h-8',
    text: 'text-sm',
    gap: 'gap-2',
  },
  md: {
    avatar: 'w-10 h-10',
    text: 'text-base',
    gap: 'gap-3',
  },
  lg: {
    avatar: 'w-12 h-12',
    text: 'text-lg',
    gap: 'gap-4',
  },
} as const;

/**
 * UserPresence component
 * Example of a well-typed molecule using semantic tokens
 */
export function UserPresence({
  user,
  status,
  showHandle = false,
  size = 'md',
  className,
  onClick,
}: UserPresenceProps) {
  const config = sizeConfig[size];

  return (
    <div
      className={cn(
        "flex items-center",
        config.gap,
        onClick && "cursor-pointer hover:opacity-80 transition-opacity",
        className
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {/* Avatar with status indicator */}
      <div className="relative">
        <div
          className={cn(
            "rounded-full overflow-hidden",
            "bg-background-secondary",          // Semantic token
            "border-2 border-border-default",   // Semantic token
            config.avatar
          )}
        >
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className={cn(
              "w-full h-full flex items-center justify-center",
              "bg-background-tertiary",          // Semantic token
              "text-text-primary font-semibold"  // Semantic token
            )}>
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Status indicator (atom composition) */}
        <StatusIndicator
          status={status}
          size="sm"
          className="absolute bottom-0 right-0 ring-2 ring-background-primary"
        />
      </div>

      {/* Text content */}
      <div className="flex flex-col">
        <span className={cn(
          "font-medium",
          "text-text-primary",                  // Semantic token
          config.text
        )}>
          {user.name}
        </span>

        {showHandle && user.handle && (
          <span className={cn(
            "text-text-secondary",              // Semantic token
            "text-xs"
          )}>
            @{user.handle}
          </span>
        )}
      </div>
    </div>
  );
}

UserPresence.displayName = 'UserPresence';
