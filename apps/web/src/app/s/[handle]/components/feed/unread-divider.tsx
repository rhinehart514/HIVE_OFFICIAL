'use client';

/**
 * UnreadDivider - "Since you left" marker in feed
 *
 * Shows:
 * - Horizontal line
 * - Unread count badge
 * - Jump to bottom / dismiss actions
 *
 * @version 2.0.0 - Split Panel Rebuild (Jan 2026)
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import { ArrowDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SPACE_COMPONENTS } from '@hive/tokens';

interface UnreadDividerProps {
  /** Number of unread messages */
  count: number;
  /** Dismiss/mark as read handler */
  onDismiss?: () => void;
  /** Jump to newest handler */
  onJumpToNewest?: () => void;
  className?: string;
}

export function UnreadDivider({
  count,
  onDismiss,
  onJumpToNewest,
  className,
}: UnreadDividerProps) {
  const { unreadDivider } = SPACE_COMPONENTS;

  return (
    <motion.div
      initial={{ opacity: 0, scaleX: 0 }}
      animate={{ opacity: 1, scaleX: 1 }}
      exit={{ opacity: 0, scaleX: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={cn(
        'relative flex items-center',
        className
      )}
      style={{ margin: `${unreadDivider.marginY}px 0` }}
    >
      {/* Line */}
      <div
        className="flex-1"
        style={{
          height: `${unreadDivider.height}px`,
          background: 'var(--color-gold, #FFD700)',
          opacity: 0.06,
        }}
      />

      {/* Badge */}
      <div
        className={cn(
          'flex items-center gap-2 mx-3',
          'bg-[var(--color-gold)]/10 text-[var(--color-gold)]',
          'rounded-full'
        )}
        style={{ padding: unreadDivider.badgePadding }}
      >
        <span className="text-xs font-medium">
          {count} new {count === 1 ? 'message' : 'messages'}
        </span>

        {/* Jump button */}
        {onJumpToNewest && (
          <button
            onClick={onJumpToNewest}
            className="p-0.5 hover:bg-[var(--color-gold)]/20 rounded transition-colors"
            title="Jump to newest"
          >
            <ArrowDown className="w-3 h-3" />
          </button>
        )}

        {/* Dismiss button */}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="p-0.5 hover:bg-[var(--color-gold)]/20 rounded transition-colors"
            title="Mark as read"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Line */}
      <div
        className="flex-1"
        style={{
          height: `${unreadDivider.height}px`,
          background: 'var(--color-gold, #FFD700)',
          opacity: 0.06,
        }}
      />
    </motion.div>
  );
}

UnreadDivider.displayName = 'UnreadDivider';

export default UnreadDivider;
