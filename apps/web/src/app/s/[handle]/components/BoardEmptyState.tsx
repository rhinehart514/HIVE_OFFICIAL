'use client';

/**
 * BoardEmptyState — Contextual empty states for space boards
 * CREATED: Jan 27, 2026
 *
 * Different empty states per board context:
 * - General: "Start the conversation"
 * - Announcements: "No announcements yet" (leaders only CTA)
 * - Events: "No upcoming events"
 * - Resources: "No resources shared"
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import {
  MessageCircle,
  Megaphone,
  Calendar,
  FileText,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@hive/ui';
import { MOTION, durationSeconds } from '@hive/tokens';

export type BoardType = 'general' | 'announcements' | 'events' | 'resources' | 'default';

interface BoardEmptyStateProps {
  boardType: BoardType;
  boardName?: string;
  isLeader?: boolean;
  onAction?: () => void;
  className?: string;
}

const BOARD_CONFIG: Record<
  BoardType,
  {
    icon: React.ElementType;
    title: string;
    subtitle: string;
    ctaLabel: string;
    leaderOnly?: boolean;
  }
> = {
  general: {
    icon: MessageCircle,
    title: 'Start the conversation',
    subtitle: 'Be the first to say something',
    ctaLabel: 'Post a message',
  },
  announcements: {
    icon: Megaphone,
    title: 'No announcements yet',
    subtitle: 'Important updates from space leaders will appear here',
    ctaLabel: 'Create announcement',
    leaderOnly: true,
  },
  events: {
    icon: Calendar,
    title: 'No upcoming events',
    subtitle: 'Gatherings, meetings, and activities will show up here',
    ctaLabel: 'Create an event',
  },
  resources: {
    icon: FileText,
    title: 'No resources shared',
    subtitle: 'Documents, links, and helpful materials appear here',
    ctaLabel: 'Share a resource',
  },
  default: {
    icon: Sparkles,
    title: 'Nothing here yet',
    subtitle: 'This board is waiting for its first post',
    ctaLabel: 'Add something',
  },
};

export function BoardEmptyState({
  boardType,
  boardName,
  isLeader = false,
  onAction,
  className,
}: BoardEmptyStateProps) {
  const config = BOARD_CONFIG[boardType] || BOARD_CONFIG.default;
  const Icon = config.icon;

  // Don't show CTA if board is leader-only and user is not a leader
  const showCta = onAction && (!config.leaderOnly || isLeader);

  return (
    <motion.div
      className={cn(
        'flex flex-col items-center justify-center py-16 px-6',
        className
      )}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: durationSeconds.standard,
        ease: MOTION.ease.premium,
      }}
    >
      {/* Icon */}
      <motion.div
        className="w-12 h-12 rounded-xl bg-white/[0.04] flex items-center justify-center mb-5"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          duration: durationSeconds.quick,
          delay: 0.1,
          ease: MOTION.ease.premium,
        }}
      >
        <Icon className="w-5 h-5 text-white/30" />
      </motion.div>

      {/* Title */}
      <motion.h3
        className="text-body font-medium text-white/80 mb-2 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: durationSeconds.quick, delay: 0.15 }}
      >
        {boardName ? `No messages in #${boardName} yet` : config.title}
      </motion.h3>

      {/* Subtitle */}
      <motion.p
        className="text-body-sm text-white/40 text-center max-w-xs mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: durationSeconds.quick, delay: 0.2 }}
      >
        {config.subtitle}
      </motion.p>

      {/* CTA */}
      {showCta && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: durationSeconds.quick, delay: 0.25 }}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={onAction}
            className="text-white/60 hover:text-white/80 hover:bg-white/[0.06]"
          >
            {config.ctaLabel}
          </Button>
        </motion.div>
      )}

      {/* Leader hint for announcements */}
      {boardType === 'announcements' && !isLeader && (
        <motion.p
          className="text-label text-white/20 mt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: durationSeconds.quick, delay: 0.3 }}
        >
          Only space leaders can post announcements
        </motion.p>
      )}
    </motion.div>
  );
}

/**
 * Helper to determine board type from board name
 */
export function getBoardType(boardName: string): BoardType {
  const name = boardName.toLowerCase();
  if (name === 'general' || name === 'main') return 'general';
  if (name === 'announcements' || name === 'news') return 'announcements';
  if (name === 'events' || name === 'calendar') return 'events';
  if (name === 'resources' || name === 'files' || name === 'docs') return 'resources';
  return 'default';
}

BoardEmptyState.displayName = 'BoardEmptyState';
