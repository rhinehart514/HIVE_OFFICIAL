'use client';

/**
 * TypingIndicator - AI thinking animation
 *
 * Features:
 * - Three pulsing dots
 * - Smooth animation
 * - Matches message bubble layout
 * - Minimal, clean design
 */

import { motion } from 'framer-motion';
import React from 'react';
import { durationSeconds } from '@hive/tokens';

import { cn } from '../../lib/utils';
import { Avatar, AvatarFallback } from '../00-Global/atoms/avatar';

export interface TypingIndicatorProps {
  /** Additional CSS classes */
  className?: string;
}

/**
 * TypingIndicator Component
 *
 * Shows a pulsing "..." animation when AI is generating response:
 * - Matches MessageBubble layout for consistency
 * - Subtle, non-distracting animation
 * - Clean, minimal styling
 */
export function TypingIndicator({ className }: TypingIndicatorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: durationSeconds.quick }}
      className={cn(
        'w-full py-6 px-4 bg-white/[0.02]',
        className
      )}
    >
      <div className="max-w-3xl mx-auto flex gap-4">
        {/* Avatar (matches AI message bubble) */}
        <div className="flex-shrink-0">
          <Avatar className="h-8 w-8 bg-white/5">
            <AvatarFallback className="bg-transparent">
              <div className="h-4 w-4 rounded-full bg-gradient-to-br from-white/20 to-white/5" />
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Typing dots */}
        <div className="flex-1 min-w-0 flex items-center">
          <div className="flex gap-1 items-center h-6">
            {[0, 1, 2].map((index) => (
              <motion.div
                key={index}
                className="w-1.5 h-1.5 rounded-full bg-white/40"
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.4, 0.8, 0.4]
                }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  delay: index * 0.15,
                  ease: 'easeInOut'
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
