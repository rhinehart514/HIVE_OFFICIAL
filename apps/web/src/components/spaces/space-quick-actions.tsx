'use client';

/**
 * SpaceQuickActions - Quick action buttons for homebase space cards
 *
 * Provides contextual actions accessible from the homebase view:
 * - Post: Create a new post/message
 * - Event: Create a new event
 * - Settings: Access space settings (leaders only)
 *
 * Designed to reduce friction for common operations without
 * requiring navigation into the space.
 *
 * @version 1.0.0 - Homebase Redesign (Jan 2026)
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import {
  PencilIcon,
  CalendarIcon,
  Cog6ToothIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { MOTION } from '@hive/tokens';

// ============================================================
// Types
// ============================================================

export interface SpaceQuickActionsProps {
  /** Space ID for actions */
  spaceId: string;
  /** Whether user is a leader */
  isLeader?: boolean;
  /** Handler for post action */
  onPost?: (spaceId: string) => void;
  /** Handler for event action */
  onEvent?: (spaceId: string) => void;
  /** Handler for settings action */
  onSettings?: (spaceId: string) => void;
  /** Handler for viewing space */
  onView: (spaceId: string) => void;
}

// ============================================================
// Action Button
// ============================================================

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'primary';
}

function ActionButton({
  icon,
  label,
  onClick,
  variant = 'default',
}: ActionButtonProps) {
  return (
    <motion.button
      onClick={(e) => {
        e.stopPropagation(); // Prevent space card click
        onClick();
      }}
      className={cn(
        'group relative px-3 py-1.5 rounded-lg',
        'flex items-center gap-1.5',
        'text-xs font-medium',
        'transition-all duration-150',
        variant === 'primary'
          ? 'bg-white/[0.06] hover:bg-white/[0.06] text-white'
          : 'bg-white/[0.06] hover:bg-white/[0.06] text-white/50 hover:text-white'
      )}
      whileHover={{ opacity: 0.96 }}
      whileTap={{ scale: 0.98 }}
    >
      <span className="flex-shrink-0">{icon}</span>
      <span>{label}</span>
    </motion.button>
  );
}

// ============================================================
// Main Component
// ============================================================

export function SpaceQuickActions({
  spaceId,
  isLeader = false,
  onPost,
  onEvent,
  onSettings,
  onView,
}: SpaceQuickActionsProps) {
  const handlePost = () => {
    if (onPost) {
      onPost(spaceId);
    } else {
      // Default: Navigate to space
      onView(spaceId);
    }
  };

  const handleEvent = () => {
    if (onEvent) {
      onEvent(spaceId);
    } else {
      // Default: Navigate to space
      onView(spaceId);
    }
  };

  const handleSettings = () => {
    if (onSettings) {
      onSettings(spaceId);
    } else {
      // Default: Navigate to space settings
      onView(spaceId);
    }
  };

  return (
    <motion.div
      className="flex items-center gap-2 flex-wrap"
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: MOTION.ease.premium }}
      onClick={(e) => e.stopPropagation()} // Prevent bubbling to parent
    >
      {/* Post Action */}
      <ActionButton
        icon={<PencilIcon className="w-3.5 h-3.5" />}
        label="Post"
        onClick={handlePost}
        variant="primary"
      />

      {/* Event Action (only for leaders or if handler provided) */}
      {(isLeader || onEvent) && (
        <ActionButton
          icon={<CalendarIcon className="w-3.5 h-3.5" />}
          label="Event"
          onClick={handleEvent}
        />
      )}

      {/* Settings Action (only for leaders) */}
      {isLeader && (
        <ActionButton
          icon={<Cog6ToothIcon className="w-3.5 h-3.5" />}
          label="Settings"
          onClick={handleSettings}
        />
      )}

      {/* View Space Action (always available) */}
      <motion.button
        onClick={(e) => {
          e.stopPropagation();
          onView(spaceId);
        }}
        className={cn(
          'group ml-auto px-3 py-1.5 rounded-lg',
          'flex items-center gap-1',
          'text-xs font-medium text-white/50 hover:text-white/50',
          'hover:bg-white/[0.06]',
          'transition-all duration-150'
        )}
        whileHover={{ opacity: 0.8 }}
      >
        <span>View</span>
        <ChevronRightIcon className="w-3 h-3" />
      </motion.button>
    </motion.div>
  );
}

export default SpaceQuickActions;
