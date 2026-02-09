'use client';

import { motion } from 'framer-motion';
import { MessageSquare, Calendar, Wrench, Users } from 'lucide-react';
import { cn } from '../../../lib/utils';

export type SpaceMode = 'hub' | 'chat' | 'events' | 'tools' | 'members';

interface ModeCardProps {
  mode: Exclude<SpaceMode, 'hub'>;
  title: string;
  preview: React.ReactNode;
  hasActivity?: boolean;
  activityCount?: number;
  onClick: () => void;
  className?: string;
}

const modeIcons: Record<Exclude<SpaceMode, 'hub'>, React.ComponentType<{ className?: string }>> = {
  chat: MessageSquare,
  events: Calendar,
  tools: Wrench,
  members: Users,
};

const modeLabels: Record<Exclude<SpaceMode, 'hub'>, string> = {
  chat: 'Chat',
  events: 'Events',
  tools: 'Tools',
  members: 'Members',
};

export function ModeCard({
  mode,
  title,
  preview,
  hasActivity = false,
  activityCount,
  onClick,
  className,
}: ModeCardProps) {
  const Icon = modeIcons[mode];
  const label = modeLabels[mode];

  return (
    <motion.button
      onClick={onClick}
      className={cn(
        // Base card styling
        'relative w-full rounded-2xl p-6 text-left',
        'bg-[#141312] border border-white/[0.06]',
        // Transitions
        'transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
        // Hover state
        'hover:border-white/[0.12] hover:opacity-95',
        // Focus state (white, not gold)
        'focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-[var(--bg-ground,#0A0A09)]',
        // Activity state (gold edge warmth)
        hasActivity && 'shadow-[inset_0_0_0_1px_rgba(255,215,0,0.15)]',
        className
      )}
      whileTap={{ opacity: 0.8 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-white/[0.04]">
            <Icon className="w-5 h-5 text-[#A3A19E]" />
          </div>
          <span className="text-sm font-medium text-[#A3A19E] uppercase tracking-wide">
            {label}
          </span>
        </div>

        {/* Activity indicator */}
        {hasActivity && (
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#FFD700] animate-pulse" />
            {activityCount !== undefined && activityCount > 0 && (
              <span className="text-xs text-[#FFD700]">{activityCount}</span>
            )}
          </div>
        )}
      </div>

      {/* Title */}
      <h3 className="text-lg font-medium text-white mb-3 line-clamp-1">
        {title}
      </h3>

      {/* Preview content */}
      <div className="text-sm text-[#6B6B70] line-clamp-2">
        {preview}
      </div>

      {/* Hover arrow indicator */}
      <motion.div
        className="absolute bottom-6 right-6 text-[#3D3D42]"
        initial={{ opacity: 0, x: -4 }}
        whileHover={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.15 }}
      >
        →
      </motion.div>
    </motion.button>
  );
}

// Preset variants for each mode
export function ChatModeCard({
  latestMessage,
  unreadCount,
  onClick,
  className,
}: {
  latestMessage?: { author: string; content: string };
  unreadCount?: number;
  onClick: () => void;
  className?: string;
}) {
  return (
    <ModeCard
      mode="chat"
      title={latestMessage?.author ? `${latestMessage.author}` : 'Start the conversation'}
      preview={latestMessage?.content || 'No messages yet'}
      hasActivity={unreadCount !== undefined && unreadCount > 0}
      activityCount={unreadCount}
      onClick={onClick}
      className={className}
    />
  );
}

export function EventsModeCard({
  nextEvent,
  eventCount,
  onClick,
  className,
}: {
  nextEvent?: { title: string; when: string };
  eventCount?: number;
  onClick: () => void;
  className?: string;
}) {
  return (
    <ModeCard
      mode="events"
      title={nextEvent?.title || 'No upcoming events'}
      preview={nextEvent?.when || 'Create an event to get started'}
      hasActivity={nextEvent !== undefined}
      activityCount={eventCount}
      onClick={onClick}
      className={className}
    />
  );
}

export function ToolsModeCard({
  activeTool,
  toolCount,
  onClick,
  className,
}: {
  activeTool?: { name: string; type: string };
  toolCount?: number;
  onClick: () => void;
  className?: string;
}) {
  return (
    <ModeCard
      mode="tools"
      title={activeTool?.name || 'No active tools'}
      preview={activeTool?.type || 'Deploy a tool to get started'}
      hasActivity={activeTool !== undefined}
      activityCount={toolCount}
      onClick={onClick}
      className={className}
    />
  );
}

export function MembersModeCard({
  onlineCount,
  totalCount,
  onClick,
  className,
}: {
  onlineCount?: number;
  totalCount?: number;
  onClick: () => void;
  className?: string;
}) {
  const preview = onlineCount !== undefined && totalCount !== undefined
    ? `${onlineCount} online · ${totalCount} members`
    : 'View members';

  return (
    <ModeCard
      mode="members"
      title={onlineCount && onlineCount > 0 ? `${onlineCount} people here` : 'Members'}
      preview={preview}
      hasActivity={onlineCount !== undefined && onlineCount > 0}
      activityCount={onlineCount}
      onClick={onClick}
      className={className}
    />
  );
}
