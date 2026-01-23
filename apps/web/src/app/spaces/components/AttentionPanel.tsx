'use client';

/**
 * AttentionPanel — Actions + Live Activity
 *
 * Two sections:
 * - Actions: Votes, RSVPs, deadlines with time urgency
 * - Live: Currently active spaces with participant counts
 */

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Vote, Calendar, Clock, AlertCircle, Users } from 'lucide-react';
import {
  motion,
  MOTION,
  Avatar,
  AvatarImage,
  AvatarFallback,
  getInitials,
} from '@hive/ui/design-system/primitives';
import { cn } from '@/lib/utils';
import type { AttentionItem, LiveSpace } from '../hooks/useSpacesHQ';

// ============================================================
// Types
// ============================================================

interface AttentionPanelProps {
  actions: AttentionItem[];
  liveSpaces: LiveSpace[];
}

// ============================================================
// Action Item
// ============================================================

const ACTION_ICONS = {
  vote: Vote,
  rsvp: Calendar,
  deadline: Clock,
  mention: AlertCircle,
};

const URGENCY_COLORS = {
  low: 'text-white/40',
  medium: 'text-amber-400',
  high: 'text-rose-400',
};

function ActionItem({ item, index }: { item: AttentionItem; index: number }) {
  const router = useRouter();
  const Icon = ACTION_ICONS[item.type];

  // Format time urgency
  const formatUrgency = () => {
    if (!item.deadline) return null;
    const now = new Date();
    const diff = item.deadline.getTime() - now.getTime();
    const hours = Math.floor(diff / 3600000);

    if (hours < 1) return 'Now';
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  return (
    <motion.button
      onClick={() => router.push(`/s/${item.spaceId}`)}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/[0.03] transition-colors"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: MOTION.duration.fast,
        delay: index * MOTION.stagger.tight,
        ease: MOTION.ease.premium,
      }}
    >
      {/* Icon */}
      <div className={cn('shrink-0', URGENCY_COLORS[item.urgency])}>
        <Icon size={14} />
      </div>

      {/* Space avatar */}
      <Avatar size="xs" className="ring-1 ring-white/[0.06] shrink-0">
        {item.spaceAvatarUrl && <AvatarImage src={item.spaceAvatarUrl} />}
        <AvatarFallback className="text-[9px]">
          {getInitials(item.spaceName)}
        </AvatarFallback>
      </Avatar>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <span className="text-[13px] text-white/60 truncate block">
          {item.title}
        </span>
      </div>

      {/* Time */}
      {item.deadline && (
        <span className={cn('text-[11px] shrink-0', URGENCY_COLORS[item.urgency])}>
          {formatUrgency()}
        </span>
      )}
    </motion.button>
  );
}

// ============================================================
// Live Space Item
// ============================================================

function LiveSpaceItem({ space, index }: { space: LiveSpace; index: number }) {
  const router = useRouter();

  return (
    <motion.button
      onClick={() => router.push(`/s/${space.id}`)}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/[0.03] transition-colors"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: MOTION.duration.fast,
        delay: 0.1 + index * MOTION.stagger.tight,
        ease: MOTION.ease.premium,
      }}
    >
      {/* Pulsing dot */}
      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />

      {/* Avatar */}
      <Avatar size="xs" className="ring-1 ring-white/[0.06] shrink-0">
        {space.avatarUrl && <AvatarImage src={space.avatarUrl} />}
        <AvatarFallback className="text-[9px]">
          {getInitials(space.name)}
        </AvatarFallback>
      </Avatar>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <span className="text-[13px] text-white/60 truncate block">
          {space.eventName || space.name}
        </span>
      </div>

      {/* Participant count */}
      <div className="flex items-center gap-1 shrink-0">
        <Users size={12} className="text-white/20" />
        <span className="text-[11px] text-white/30 tabular-nums">
          {space.participantCount}
        </span>
      </div>
    </motion.button>
  );
}

// ============================================================
// Empty States
// ============================================================

function EmptyActions() {
  return (
    <div className="py-4 px-3 text-center">
      <p className="text-[12px] text-white/20">No pending actions</p>
    </div>
  );
}

function EmptyLive() {
  return (
    <div className="py-4 px-3 text-center">
      <p className="text-[12px] text-white/20">No live activity</p>
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================

export function AttentionPanel({ actions, liveSpaces }: AttentionPanelProps) {
  return (
    <motion.div
      className="h-full rounded-2xl backdrop-blur-xl overflow-hidden flex flex-col"
      style={{
        background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 0 0 1px rgba(255,255,255,0.03)',
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: MOTION.duration.base,
        delay: 0.15,
        ease: MOTION.ease.premium,
      }}
    >
      {/* Actions Section */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="px-4 py-3 border-b border-white/[0.04] shrink-0">
          <span className="text-[11px] font-medium text-white/40 uppercase tracking-wider">
            Actions
          </span>
        </div>
        <div className="flex-1 overflow-y-auto p-1.5 min-h-0">
          {actions.length === 0 ? (
            <EmptyActions />
          ) : (
            <div className="space-y-0.5">
              {actions.slice(0, 5).map((action, i) => (
                <ActionItem key={action.id} item={action} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Live Section */}
      <div className="flex-1 flex flex-col border-t border-white/[0.04] min-h-0">
        <div className="px-4 py-3 shrink-0 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] font-medium text-white/40 uppercase tracking-wider">
            Live
          </span>
        </div>
        <div className="flex-1 overflow-y-auto p-1.5 min-h-0">
          {liveSpaces.length === 0 ? (
            <EmptyLive />
          ) : (
            <div className="space-y-0.5">
              {liveSpaces.slice(0, 4).map((space, i) => (
                <LiveSpaceItem key={space.id} space={space} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
