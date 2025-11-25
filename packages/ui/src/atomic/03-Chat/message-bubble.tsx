'use client';

/**
 * MessageBubble - OpenAI-style chat message component
 *
 * Features:
 * - User/AI variants with distinct styling
 * - Subtle backgrounds, no heavy borders
 * - Avatar + timestamp + content layout
 * - Markdown support for AI responses
 * - Fade-in animation
 * - Accessible, keyboard navigable
 */

import { motion } from 'framer-motion';
import { User } from 'lucide-react';
import React from 'react';
import { durationSeconds, easingArrays } from '@hive/tokens';

import { cn } from '../../lib/utils';
import { Avatar, AvatarFallback } from '../00-Global/atoms/avatar';

export interface MessageBubbleProps {
  /** Message variant - user or AI */
  variant: 'user' | 'ai';

  /** Message content (plain text or markdown for AI) */
  content: string;

  /** Timestamp */
  timestamp?: string;

  /** User name (for user messages) */
  userName?: string;

  /** User avatar URL (optional) */
  avatarUrl?: string;

  /** Is this message currently streaming in? */
  isStreaming?: boolean;

  /** Additional CSS classes */
  className?: string;
}

/**
 * MessageBubble Component
 *
 * Renders a chat message with OpenAI-inspired styling:
 * - Clean, minimal design
 * - Subtle backgrounds
 * - Clear typography hierarchy
 * - Avatar + content layout
 */
export function MessageBubble({
  variant,
  content,
  timestamp,
  userName = 'You',
  avatarUrl,
  isStreaming = false,
  className
}: MessageBubbleProps) {
  const isUser = variant === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: durationSeconds.standard, ease: easingArrays.default }}
      className={cn(
        'group w-full py-4 px-4',
        isUser ? 'bg-transparent' : 'bg-white/[0.02]',
        className
      )}
    >
      <div className="max-w-3xl mx-auto flex gap-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <Avatar className={cn(
            'h-8 w-8',
            isUser ? 'ring-1 ring-white/10' : 'bg-white/5'
          )}>
            {avatarUrl ? (
              <img src={avatarUrl} alt={userName} />
            ) : (
              <AvatarFallback className="bg-transparent">
                {isUser ? (
                  <User className="h-4 w-4 text-white/60" />
                ) : (
                  <div className="h-4 w-4 rounded-full bg-[var(--hive-gold-cta)]" />
                )}
              </AvatarFallback>
            )}
          </Avatar>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-1">
          {/* Header: Name + Timestamp */}
          <div className="flex items-baseline gap-2">
            <span className={cn(
              'text-sm font-medium',
              isUser ? 'text-white' : 'text-white/90'
            )}>
              {isUser ? userName : 'HIVE AI'}
            </span>
            {timestamp && (
              <span className="text-xs text-white/30">
                {timestamp}
              </span>
            )}
          </div>

          {/* Message Content */}
          <div className={cn(
            'text-[15px] leading-relaxed',
            isUser ? 'text-white/90' : 'text-white/80'
          )}>
            {/* For now, render as plain text. In production, use markdown parser for AI messages */}
            <p className="whitespace-pre-wrap break-words">
              {content}
            </p>

            {/* Streaming cursor */}
            {isStreaming && (
              <motion.span
                className="inline-block w-[2px] h-5 bg-white/60 ml-0.5"
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.8, repeat: Infinity, repeatType: 'reverse' }}
              />
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Message list container helper
 */
export function MessageList({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('divide-y divide-white/[0.03]', className)}>
      {children}
    </div>
  );
}
