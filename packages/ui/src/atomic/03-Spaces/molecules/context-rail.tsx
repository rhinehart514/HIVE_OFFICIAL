'use client';

/**
 * ContextRail - Always-visible 48px context strip
 *
 * Shows essentials when ContextPanel is closed (desktop only):
 * - Online member avatars (top 3)
 * - Tools badge with count
 * - Events badge with count
 * - Expand button to open full ContextPanel
 *
 * Part of "The Hub" layout - quick context at a glance.
 *
 * @version 1.0.0
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Wrench, ChevronLeft, Users } from 'lucide-react';
import { cn } from '../../../lib/utils';
import type { SpaceMemberItem, SpaceEventItem, SpaceToolItem } from '../organisms/context-panel';

// Premium spring
const SPRING_BUTTER = {
  type: 'spring' as const,
  stiffness: 200,
  damping: 28,
  mass: 1,
};

export interface ContextRailProps {
  /** Online members to show */
  onlineMembers?: SpaceMemberItem[];
  /** Total online count (if different from onlineMembers.length) */
  onlineCount?: number;
  /** Upcoming events */
  events?: SpaceEventItem[];
  /** Available tools */
  tools?: SpaceToolItem[];
  /** Whether the full ContextPanel is currently open */
  isPanelOpen?: boolean;
  /** Callback to open the ContextPanel */
  onOpenPanel: () => void;
  /** Callback when a specific section should be focused */
  onOpenPanelSection?: (section: 'members' | 'events' | 'tools') => void;
  /** Additional CSS classes */
  className?: string;
}

export function ContextRail({
  onlineMembers = [],
  onlineCount,
  events = [],
  tools = [],
  isPanelOpen = false,
  onOpenPanel,
  onOpenPanelSection,
  className,
}: ContextRailProps) {
  const effectiveOnlineCount = onlineCount ?? onlineMembers.filter(m => m.isOnline).length;
  const hasOnline = effectiveOnlineCount > 0;
  const hasEvents = events.length > 0;
  const hasTools = tools.length > 0;

  // Don't show rail if panel is open
  if (isPanelOpen) {
    return null;
  }

  return (
    <motion.aside
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={SPRING_BUTTER}
      className={cn(
        // Layout
        'hidden lg:flex flex-col',
        'w-12 py-4',
        'items-center gap-4',
        // Visual
        'bg-white/[0.02] border-l border-white/[0.06]',
        className
      )}
    >
      {/* Online Members */}
      {hasOnline && (
        <button
          onClick={() => onOpenPanelSection?.('members') ?? onOpenPanel()}
          className="group flex flex-col items-center gap-1 hover:bg-white/[0.04] rounded-lg p-1.5 transition-colors"
          aria-label={`${effectiveOnlineCount} online`}
          title={`${effectiveOnlineCount} online`}
        >
          {/* Avatar stack (up to 3) */}
          <div className="flex flex-col -space-y-1.5">
            {onlineMembers.slice(0, 3).map((member, i) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05, ...SPRING_BUTTER }}
                className={cn(
                  'w-6 h-6 rounded-full bg-white/[0.08] border-2 border-[#0A0A0A]',
                  'flex items-center justify-center overflow-hidden',
                  'ring-1 ring-white/[0.08]'
                )}
                style={{ zIndex: 3 - i }}
              >
                {member.avatarUrl ? (
                  <img
                    src={member.avatarUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-[9px] font-medium text-white/60">
                    {member.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </motion.div>
            ))}
          </div>
          {/* Online count badge */}
          <span className="text-[10px] text-[#FFD700] font-medium tabular-nums">
            {effectiveOnlineCount}
          </span>
        </button>
      )}

      {/* Divider */}
      {hasOnline && (hasEvents || hasTools) && (
        <div className="w-6 h-px bg-white/[0.08]" />
      )}

      {/* Tools */}
      {hasTools && (
        <button
          onClick={() => onOpenPanelSection?.('tools') ?? onOpenPanel()}
          className="group relative flex items-center justify-center w-9 h-9 hover:bg-white/[0.06] rounded-lg transition-colors"
          aria-label={`${tools.length} tools`}
          title={`${tools.length} tools available`}
        >
          <Wrench className="w-4 h-4 text-white/40 group-hover:text-white/60 transition-colors" />
          {/* Count badge */}
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-white/[0.12] text-[9px] font-medium text-white/60 flex items-center justify-center">
            {tools.length}
          </span>
        </button>
      )}

      {/* Events */}
      {hasEvents && (
        <button
          onClick={() => onOpenPanelSection?.('events') ?? onOpenPanel()}
          className="group relative flex items-center justify-center w-9 h-9 hover:bg-white/[0.06] rounded-lg transition-colors"
          aria-label={`${events.length} upcoming events`}
          title={`${events.length} upcoming events`}
        >
          <Calendar className="w-4 h-4 text-white/40 group-hover:text-white/60 transition-colors" />
          {/* Count badge */}
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#FFD700]/20 text-[9px] font-medium text-[#FFD700] flex items-center justify-center">
            {events.length}
          </span>
        </button>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Member count (if no online shown) */}
      {!hasOnline && (
        <button
          onClick={() => onOpenPanelSection?.('members') ?? onOpenPanel()}
          className="group flex items-center justify-center w-9 h-9 hover:bg-white/[0.06] rounded-lg transition-colors"
          aria-label="View members"
          title="View members"
        >
          <Users className="w-4 h-4 text-white/40 group-hover:text-white/60 transition-colors" />
        </button>
      )}

      {/* Expand button */}
      <button
        onClick={onOpenPanel}
        className={cn(
          'w-9 h-9 rounded-lg',
          'flex items-center justify-center',
          'bg-white/[0.04] hover:bg-white/[0.08]',
          'border border-white/[0.06]',
          'text-white/40 hover:text-white/60',
          'transition-all duration-150'
        )}
        aria-label="Open space info panel"
        title="Open space info"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
    </motion.aside>
  );
}

export default ContextRail;
