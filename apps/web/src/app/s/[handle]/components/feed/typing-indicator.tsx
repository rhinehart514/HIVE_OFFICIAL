'use client';

/**
 * TypingIndicator - Shows who is currently typing
 *
 * Displays animated dots with user names.
 * Positioned above the chat input.
 *
 * @version 1.0.0 - P1 Retention Sprint (Feb 2026)
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TypingIndicatorProps {
  /** Array of user names currently typing */
  typingUsers: string[];
  className?: string;
}

export function TypingIndicator({ typingUsers, className }: TypingIndicatorProps) {
  // Format the typing message (must be above early return - rules of hooks)
  const typingMessage = React.useMemo(() => {
    if (typingUsers.length === 1) {
      return `${typingUsers[0]} is typing`;
    } else if (typingUsers.length === 2) {
      return `${typingUsers[0]} and ${typingUsers[1]} are typing`;
    } else if (typingUsers.length === 3) {
      return `${typingUsers[0]}, ${typingUsers[1]}, and ${typingUsers[2]} are typing`;
    } else {
      return `${typingUsers[0]}, ${typingUsers[1]}, and ${typingUsers.length - 2} others are typing`;
    }
  }, [typingUsers]);

  if (typingUsers.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 4 }}
        transition={{ duration: 0.15 }}
        className={cn(
          'flex items-center gap-2 px-4 py-1.5',
          'text-xs text-white/50',
          className
        )}
      >
        {/* Animated dots */}
        <span className="flex items-center gap-0.5">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-white/40"
              animate={{
                opacity: [0.4, 1, 0.4],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </span>
        <span>{typingMessage}</span>
      </motion.div>
    </AnimatePresence>
  );
}

TypingIndicator.displayName = 'TypingIndicator';

export default TypingIndicator;
