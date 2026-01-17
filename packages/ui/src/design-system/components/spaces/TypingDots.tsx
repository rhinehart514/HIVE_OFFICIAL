'use client';

/**
 * ChatTypingDots Component (Theater Mode)
 *
 * Gold breathing dots for typing indicator in chat/theater mode.
 * Escalates to gold when 3+ users are typing.
 *
 * Design principles:
 * - Subtle by default (white/gray)
 * - Gold breathing when 3+ users (emphasis)
 * - Compact, doesn't take much space
 * - Shows typing users' names
 *
 * Note: Named with "Chat" prefix to avoid conflict with primitives/TypingDots
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../../lib/utils';

// ============================================================
// Types
// ============================================================

export interface TypingUser {
  id: string;
  name: string;
  avatarUrl?: string;
}

export interface ChatTypingDotsProps {
  /** Users currently typing */
  users: TypingUser[];
  /** Maximum names to show before "and X others" */
  maxNames?: number;
  /** Additional className */
  className?: string;
}

// ============================================================
// Animation Variants
// ============================================================

const dotVariants = {
  animate: (i: number) => ({
    opacity: [0.3, 1, 0.3],
    scale: [0.8, 1, 0.8],
    transition: {
      duration: 1.2,
      repeat: Infinity,
      delay: i * 0.2,
      ease: 'easeInOut',
    },
  }),
};

const goldDotVariants = {
  animate: (i: number) => ({
    opacity: [0.4, 1, 0.4],
    scale: [0.85, 1.1, 0.85],
    transition: {
      duration: 1.0,
      repeat: Infinity,
      delay: i * 0.15,
      ease: 'easeInOut',
    },
  }),
};

// ============================================================
// Component
// ============================================================

export function ChatTypingDots({
  users,
  maxNames = 2,
  className,
}: ChatTypingDotsProps) {
  if (users.length === 0) return null;

  // Gold mode when 3+ users typing
  const isGold = users.length >= 3;

  // Format typing text
  const typingText = React.useMemo(() => {
    if (users.length === 1) {
      return `${users[0].name} is typing`;
    }
    if (users.length === 2) {
      return `${users[0].name} and ${users[1].name} are typing`;
    }
    if (users.length <= maxNames + 1) {
      const names = users.slice(0, -1).map((u) => u.name).join(', ');
      return `${names}, and ${users[users.length - 1].name} are typing`;
    }
    const names = users.slice(0, maxNames).map((u) => u.name).join(', ');
    const remaining = users.length - maxNames;
    return `${names}, and ${remaining} others are typing`;
  }, [users, maxNames]);

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-6 py-2',
        'text-sm',
        isGold ? 'text-[#FFD700]' : 'text-[#6B6B70]',
        className
      )}
    >
      {/* Animated dots */}
      <div className="flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            custom={i}
            variants={isGold ? goldDotVariants : dotVariants}
            animate="animate"
            className={cn(
              'w-2 h-2 rounded-full',
              isGold ? 'bg-[#FFD700]' : 'bg-[#6B6B70]'
            )}
          />
        ))}
      </div>

      {/* Typing text */}
      <span className="truncate">{typingText}</span>
    </div>
  );
}

// ============================================================
// Compact Variant (dots only, no text)
// ============================================================

export interface ChatTypingDotsCompactProps {
  /** Number of users typing */
  count: number;
  /** Additional className */
  className?: string;
}

export function ChatTypingDotsCompact({
  count,
  className,
}: ChatTypingDotsCompactProps) {
  if (count === 0) return null;

  const isGold = count >= 3;

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          custom={i}
          variants={isGold ? goldDotVariants : dotVariants}
          animate="animate"
          className={cn(
            'w-1.5 h-1.5 rounded-full',
            isGold ? 'bg-[#FFD700]' : 'bg-[#6B6B70]'
          )}
        />
      ))}
    </div>
  );
}

// ============================================================
// Inline Variant (for hub mode cards)
// ============================================================

export interface ChatTypingDotsInlineProps {
  /** Users currently typing */
  users: TypingUser[];
  /** Additional className */
  className?: string;
}

export function ChatTypingDotsInline({
  users,
  className,
}: ChatTypingDotsInlineProps) {
  if (users.length === 0) return null;

  const isGold = users.length >= 3;

  // Show first user's avatar and dots
  const firstUser = users[0];

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* First user avatar (small) */}
      <div className="w-5 h-5 rounded-md bg-[#141312] overflow-hidden flex-shrink-0">
        {firstUser.avatarUrl ? (
          <img
            src={firstUser.avatarUrl}
            alt={firstUser.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#6B6B70] text-[10px]">
            {firstUser.name[0]}
          </div>
        )}
      </div>

      {/* Dots */}
      <div className="flex items-center gap-0.5">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            custom={i}
            variants={isGold ? goldDotVariants : dotVariants}
            animate="animate"
            className={cn(
              'w-1 h-1 rounded-full',
              isGold ? 'bg-[#FFD700]' : 'bg-[#6B6B70]'
            )}
          />
        ))}
      </div>

      {/* Count if multiple */}
      {users.length > 1 && (
        <span className={cn(
          'text-xs',
          isGold ? 'text-[#FFD700]' : 'text-[#6B6B70]'
        )}>
          +{users.length - 1}
        </span>
      )}
    </div>
  );
}
