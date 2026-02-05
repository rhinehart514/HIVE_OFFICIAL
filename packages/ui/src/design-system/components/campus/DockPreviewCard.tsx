'use client';

/**
 * DockPreviewCard - Rich hover preview for dock orbs
 *
 * Shows when hovering over a space or tool orb:
 * - Space: name, description, online count, recent message, upcoming event, tools
 * - Tool: name, description, creator, run count, active users
 */

import * as React from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../lib/utils';
import { useCampusOptional } from './CampusProvider';

// ============================================
// CONSTANTS
// ============================================

const PREVIEW_WIDTH = 280;

const previewVariants = {
  hidden: {
    opacity: 0,
    y: 10,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.2,
      ease: [0.22, 1, 0.36, 1],
    },
  },
  exit: {
    opacity: 0,
    y: 5,
    scale: 0.98,
    transition: {
      duration: 0.15,
    },
  },
};

// ============================================
// TYPES
// ============================================

export interface SpacePreviewData {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  memberCount: number;
  onlineCount: number;
  recentMessage?: {
    user: string;
    content: string;
    time: string;
  };
  upcomingEvent?: {
    name: string;
    date: string;
    rsvpCount: number;
  };
  deployedTools?: Array<{
    id: string;
    name: string;
    icon?: string;
  }>;
}

export interface ToolPreviewData {
  id: string;
  name: string;
  description?: string;
  preview?: string;
  creator: {
    name: string;
    avatar?: string;
  };
  runCount: number;
  activeUsers: number;
  lastRun?: string;
}

export interface DockPreviewCardProps {
  type: 'space' | 'tool';
  data: SpacePreviewData | ToolPreviewData | null;
  position: { x: number; y: number } | null;
  isLoading?: boolean;
  onNavigate?: () => void;
  onQuickAction?: () => void;
  className?: string;
}

// ============================================
// ICONS
// ============================================

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  );
}

function ChatBubbleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
    </svg>
  );
}

function WrenchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75a4.5 4.5 0 01-4.884 4.484c-1.076-.091-2.264.071-2.95.904l-7.152 8.684a2.548 2.548 0 11-3.586-3.586l8.684-7.152c.833-.686.995-1.874.904-2.95a4.5 4.5 0 016.336-4.486l-3.276 3.276a3.004 3.004 0 002.25 2.25l3.276-3.276c.256.565.398 1.192.398 1.852z" />
    </svg>
  );
}

// ============================================
// SUBCOMPONENTS
// ============================================

function LoadingSkeleton() {
  return (
    <div className="p-4 space-y-3 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-[var(--bg-surface)]" />
        <div className="flex-1 space-y-1.5">
          <div className="h-4 w-24 rounded bg-[var(--bg-surface)]" />
          <div className="h-3 w-16 rounded bg-[var(--bg-surface)]" />
        </div>
      </div>
      <div className="h-12 rounded bg-[var(--bg-surface)]" />
    </div>
  );
}

function SpacePreview({ data, onNavigate }: { data: SpacePreviewData; onNavigate?: () => void }) {
  return (
    <div className="p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-[var(--bg-elevated)] overflow-hidden flex-shrink-0">
          {data.avatar ? (
            <Image src={data.avatar} alt="" width={40} height={40} className="object-cover" sizes="40px" />
          ) : (
            <span className="w-full h-full flex items-center justify-center text-sm font-medium text-[var(--text-muted)]">
              {data.name[0]?.toUpperCase()}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-[var(--text-primary)] truncate">
            {data.name}
          </h3>
          <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--life-gold)]" />
              {data.onlineCount} online
            </span>
            <span className="text-[var(--text-muted)]">·</span>
            <span>{data.memberCount} members</span>
          </div>
        </div>
      </div>

      {/* Description */}
      {data.description && (
        <p className="text-xs text-[var(--text-secondary)] line-clamp-2">
          {data.description}
        </p>
      )}

      {/* Recent Message */}
      {data.recentMessage && (
        <div className="p-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
          <div className="flex items-center gap-1.5 mb-1">
            <ChatBubbleIcon className="w-3 h-3 text-[var(--text-muted)]" />
            <span className="text-label-xs text-[var(--text-muted)]">Recent</span>
          </div>
          <p className="text-xs text-[var(--text-secondary)]">
            <span className="font-medium text-[var(--text-primary)]">
              {data.recentMessage.user}:
            </span>{' '}
            {data.recentMessage.content.slice(0, 50)}
            {data.recentMessage.content.length > 50 && '...'}
          </p>
        </div>
      )}

      {/* Upcoming Event */}
      {data.upcomingEvent && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
          <CalendarIcon className="w-4 h-4 text-[var(--life-gold)]" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-[var(--text-primary)] truncate">
              {data.upcomingEvent.name}
            </p>
            <p className="text-label-xs text-[var(--text-muted)]">
              {data.upcomingEvent.date} · {data.upcomingEvent.rsvpCount} going
            </p>
          </div>
        </div>
      )}

      {/* Deployed Tools */}
      {data.deployedTools && data.deployedTools.length > 0 && (
        <div className="flex items-center gap-2">
          <WrenchIcon className="w-3 h-3 text-[var(--text-muted)]" />
          <span className="text-label-xs text-[var(--text-muted)]">
            {data.deployedTools.length} tool{data.deployedTools.length !== 1 && 's'} deployed
          </span>
        </div>
      )}

      {/* Enter Button */}
      <button
        onClick={onNavigate}
        className={cn(
          'w-full py-2 mt-2',
          'text-sm font-medium',
          'bg-[var(--life-gold)] text-black',
          'rounded-lg',
          'hover:bg-[var(--life-gold-hover)]',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
          'transition-colors duration-150'
        )}
      >
        Enter Space
      </button>
    </div>
  );
}

function ToolPreview({ data, onNavigate, onQuickAction }: { data: ToolPreviewData; onNavigate?: () => void; onQuickAction?: () => void }) {
  return (
    <div className="p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-[var(--bg-elevated)] flex items-center justify-center flex-shrink-0">
          <WrenchIcon className="w-5 h-5 text-[var(--text-secondary)]" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-[var(--text-primary)] truncate">
            {data.name}
          </h3>
          <p className="text-xs text-[var(--text-muted)]">
            by {data.creator.name}
          </p>
        </div>
      </div>

      {/* Description */}
      {data.description && (
        <p className="text-xs text-[var(--text-secondary)] line-clamp-2">
          {data.description}
        </p>
      )}

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs text-[var(--text-secondary)]">
        <span className="flex items-center gap-1">
          <UsersIcon className="w-3.5 h-3.5" />
          {data.activeUsers} using now
        </span>
        <span>{data.runCount} runs</span>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-2">
        <button
          onClick={onQuickAction}
          className={cn(
            'flex-1 py-2',
            'text-sm font-medium',
            'bg-[var(--life-gold)] text-black',
            'rounded-lg',
            'hover:bg-[var(--life-gold-hover)]',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
            'transition-colors duration-150'
          )}
        >
          Run
        </button>
        <button
          onClick={onNavigate}
          className={cn(
            'px-4 py-2',
            'text-sm',
            'bg-[var(--bg-surface)]',
            'border border-[var(--border-default)]',
            'text-[var(--text-secondary)]',
            'rounded-lg',
            'hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
            'transition-colors duration-150'
          )}
        >
          View
        </button>
      </div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function DockPreviewCard({
  type,
  data,
  position,
  isLoading = false,
  onNavigate,
  onQuickAction,
  className,
}: DockPreviewCardProps) {
  const campus = useCampusOptional();

  // Calculate position (center above the orb)
  const style = React.useMemo(() => {
    if (!position) return {};

    return {
      left: position.x - PREVIEW_WIDTH / 2,
      bottom: `calc(100vh - ${position.y}px + 16px)`,
    };
  }, [position]);

  // Don't render if no position
  if (!position) return null;

  return (
    <AnimatePresence>
      {(campus?.hoveredOrbId || isLoading) && (
        <motion.div
          variants={previewVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          style={{ ...style, width: PREVIEW_WIDTH }}
          className={cn(
            'fixed z-50',
            'bg-[var(--bg-elevated)]',
            'border border-[var(--border-default)]',
            'rounded-xl',
            'shadow-[0_8px_32px_rgba(0,0,0,0.5)]',
            'backdrop-blur-xl',
            'overflow-hidden',
            className
          )}
          onMouseEnter={() => campus?.setHoveredOrbId(campus.hoveredOrbId)}
          onMouseLeave={() => {
            campus?.setHoveredOrbId(null);
            campus?.setPreviewPosition(null);
          }}
        >
          {isLoading ? (
            <LoadingSkeleton />
          ) : type === 'space' && data ? (
            <SpacePreview data={data as SpacePreviewData} onNavigate={onNavigate} />
          ) : type === 'tool' && data ? (
            <ToolPreview
              data={data as ToolPreviewData}
              onNavigate={onNavigate}
              onQuickAction={onQuickAction}
            />
          ) : (
            <LoadingSkeleton />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default DockPreviewCard;
