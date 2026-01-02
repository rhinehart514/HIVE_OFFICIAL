'use client';

/**
 * AvatarStack - Overlapping avatars with join animation
 *
 * Signature HIVE moment: Your avatar animates into the stack when you RSVP
 * Used for: Event attendees, space members, post reactions
 */

import { motion, AnimatePresence } from 'framer-motion';
import * as React from 'react';

import { cn } from '../../../lib/utils';

export interface AvatarStackUser {
  id: string;
  name: string;
  imageUrl?: string;
}

export interface AvatarStackProps {
  users: AvatarStackUser[];
  /** Maximum avatars to show before +N */
  max?: number;
  /** Size of avatars */
  size?: 'sm' | 'md' | 'lg';
  /** ID of newly joined user (triggers animation) */
  newUserId?: string;
  className?: string;
}

const sizeClasses = {
  sm: 'h-6 w-6 text-xs',
  md: 'h-8 w-8 text-sm',
  lg: 'h-10 w-10 text-base',
};

const overlapClasses = {
  sm: '-ml-2',
  md: '-ml-3',
  lg: '-ml-4',
};

export function AvatarStack({
  users,
  max = 5,
  size = 'md',
  newUserId,
  className,
}: AvatarStackProps) {
  const visibleUsers = users.slice(0, max);
  const remainingCount = Math.max(0, users.length - max);

  return (
    <div className={cn('flex items-center', className)}>
      <AnimatePresence mode="popLayout">
        {visibleUsers.map((user, index) => {
          const isNew = user.id === newUserId;

          return (
            <motion.div
              key={user.id}
              initial={isNew ? { scale: 0, x: -20 } : false}
              animate={{ scale: 1, x: 0 }}
              exit={{ scale: 0, x: -20 }}
              transition={{
                type: 'spring',
                stiffness: 500,
                damping: 30,
                mass: 0.8,
              }}
              className={cn(
                'relative rounded-full border-2 border-background-primary',
                sizeClasses[size],
                index > 0 && overlapClasses[size]
              )}
              style={{ zIndex: visibleUsers.length - index }}
            >
              {user.imageUrl ? (
                <img
                  src={user.imageUrl}
                  alt={user.name}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-full bg-background-interactive text-text-secondary font-medium">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}

              {/* Subtle pulse on new join */}
              {isNew && (
                <motion.div
                  initial={{ scale: 1, opacity: 0.6 }}
                  animate={{ scale: 1.5, opacity: 0 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  className="absolute inset-0 rounded-full bg-brand-primary"
                />
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Remaining count */}
      {remainingCount > 0 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={cn(
            'flex items-center justify-center rounded-full border-2 border-background-primary bg-background-interactive text-text-secondary font-medium',
            sizeClasses[size],
            overlapClasses[size]
          )}
          style={{ zIndex: 0 }}
        >
          +{remainingCount}
        </motion.div>
      )}
    </div>
  );
}

/**
 * AvatarStackWithCount - Avatar stack with animated counter
 */
export interface AvatarStackWithCountProps extends AvatarStackProps {
  label?: string;
}

export function AvatarStackWithCount({
  users,
  label = 'going',
  ...props
}: AvatarStackWithCountProps) {
  return (
    <div className="flex items-center gap-3">
      <AvatarStack users={users} {...props} />
      <div className="flex items-baseline gap-1.5">
        <motion.span
          key={users.length}
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-lg font-semibold text-text-primary tabular-nums"
        >
          {users.length}
        </motion.span>
        <span className="text-sm text-text-secondary">{label}</span>
      </div>
    </div>
  );
}
