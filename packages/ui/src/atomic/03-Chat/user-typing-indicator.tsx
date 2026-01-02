'use client';

/**
 * UserTypingIndicator - Shows who's typing in a space chat
 *
 * Phase 4: Chat Polish
 *
 * Design direction:
 * - Minimal dots in sidebar (space-aware)
 * - Names on hover only (reduces noise)
 * - Smooth animation, not distracting
 * - Multiple users handled gracefully
 *
 * Variants:
 * - inline: Shows in message area (compact)
 * - sidebar: Shows in space sidebar
 * - minimal: Just dots
 */

import { motion, AnimatePresence } from 'framer-motion';
import * as React from 'react';
import { durationSeconds } from '@hive/tokens';

import { cn } from '../../lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '../00-Global/atoms/avatar';

// ============================================
// Types
// ============================================

export interface TypingUser {
  id: string;
  name: string;
  avatarUrl?: string;
}

export interface UserTypingIndicatorProps {
  /** Users currently typing */
  typingUsers: TypingUser[];
  /** Display variant */
  variant?: 'inline' | 'sidebar' | 'minimal';
  /** Additional className */
  className?: string;
}

// ============================================
// Typing Dots Animation
// ============================================

function TypingDots({ className }: { className?: string }) {
  return (
    <div className={cn('flex gap-1 items-center', className)}>
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          className="w-1 h-1 rounded-full bg-white/50"
          animate={{
            y: [0, -3, 0],
            opacity: [0.4, 0.8, 0.4],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: index * 0.12,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

// ============================================
// Inline Typing Indicator
// ============================================

function InlineTypingIndicator({
  typingUsers,
  className,
}: Pick<UserTypingIndicatorProps, 'typingUsers' | 'className'>) {
  const [showNames, setShowNames] = React.useState(false);

  const displayText = React.useMemo(() => {
    if (typingUsers.length === 0) return '';
    if (typingUsers.length === 1) {
      return `${typingUsers[0].name} is typing`;
    }
    if (typingUsers.length === 2) {
      return `${typingUsers[0].name} and ${typingUsers[1].name} are typing`;
    }
    return `${typingUsers[0].name} and ${typingUsers.length - 1} others are typing`;
  }, [typingUsers]);

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: durationSeconds.quick }}
      className={cn('px-4 py-2', className)}
      onMouseEnter={() => setShowNames(true)}
      onMouseLeave={() => setShowNames(false)}
    >
      <div className="max-w-3xl mx-auto flex items-center gap-2">
        {/* Stacked avatars */}
        <div className="flex -space-x-2">
          {typingUsers.slice(0, 3).map((user) => (
            <Avatar key={user.id} className="h-5 w-5 ring-2 ring-[#0A0A0A]">
              {user.avatarUrl ? (
                <AvatarImage src={user.avatarUrl} alt={user.name} />
              ) : (
                <AvatarFallback className="bg-white/[0.08] text-[9px] text-white/60">
                  {user.name.charAt(0)}
                </AvatarFallback>
              )}
            </Avatar>
          ))}
        </div>

        {/* Typing dots */}
        <TypingDots />

        {/* Names (on hover) */}
        <AnimatePresence>
          {showNames && (
            <motion.span
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -4 }}
              transition={{ duration: 0.15 }}
              className="text-[12px] text-white/40"
            >
              {displayText}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ============================================
// Sidebar Typing Indicator
// ============================================

function SidebarTypingIndicator({
  typingUsers,
  className,
}: Pick<UserTypingIndicatorProps, 'typingUsers' | 'className'>) {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      transition={{ duration: durationSeconds.quick }}
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg',
        'bg-white/[0.02] border border-white/[0.04]',
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Stacked avatars */}
      <div className="flex -space-x-1.5">
        {typingUsers.slice(0, 3).map((user) => (
          <Avatar key={user.id} className="h-5 w-5 ring-1 ring-[#141414]">
            {user.avatarUrl ? (
              <AvatarImage src={user.avatarUrl} alt={user.name} />
            ) : (
              <AvatarFallback className="bg-white/[0.08] text-[8px] text-white/60">
                {user.name.charAt(0)}
              </AvatarFallback>
            )}
          </Avatar>
        ))}
      </div>

      {/* Dots or names */}
      <div className="flex-1 min-w-0">
        <AnimatePresence mode="wait">
          {isHovered ? (
            <motion.span
              key="names"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
              className="text-[11px] text-white/50 truncate"
            >
              {typingUsers.map((u) => u.name).join(', ')}
            </motion.span>
          ) : (
            <motion.div key="dots" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <TypingDots />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ============================================
// Minimal Typing Indicator
// ============================================

function MinimalTypingIndicator({
  typingUsers,
  className,
}: Pick<UserTypingIndicatorProps, 'typingUsers' | 'className'>) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: durationSeconds.micro }}
      className={cn('flex items-center gap-1', className)}
      title={typingUsers.map((u) => u.name).join(', ')}
    >
      <TypingDots className="scale-75" />
      {typingUsers.length > 1 && (
        <span className="text-[9px] text-white/30">{typingUsers.length}</span>
      )}
    </motion.div>
  );
}

// ============================================
// Main Component
// ============================================

export function UserTypingIndicator({
  typingUsers,
  variant = 'inline',
  className,
}: UserTypingIndicatorProps) {
  if (typingUsers.length === 0) return null;

  return (
    <AnimatePresence>
      {variant === 'inline' && (
        <InlineTypingIndicator typingUsers={typingUsers} className={className} />
      )}
      {variant === 'sidebar' && (
        <SidebarTypingIndicator typingUsers={typingUsers} className={className} />
      )}
      {variant === 'minimal' && (
        <MinimalTypingIndicator typingUsers={typingUsers} className={className} />
      )}
    </AnimatePresence>
  );
}

export default UserTypingIndicator;
