'use client';

/**
 * SpacePanel Component
 *
 * The 40% sidebar for Space pages containing:
 * - NOW: Online members
 * - NEXT UP: Upcoming events
 * - PINNED: Pinned resources
 *
 * Design Notes:
 * - Collapsible via ⌘⇧P
 * - Sections are collapsible individually
 * - Mobile: becomes a bottom sheet
 * - Content is always contextually relevant
 *
 * Layout Philosophy:
 * - Context that prevents tab-switching
 * - "Who's here? What's happening? What do I need?"
 * - Secondary to chat but visible in peripheral vision
 */

import * as React from 'react';
import { ChevronDown, ChevronRight, Pin, Calendar, Users, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import {
  Card,
  Text,
  Avatar,
  AvatarImage,
  AvatarFallback,
  Button,
  Separator,
  getInitials,
} from '../primitives';

// ============================================
// SECTION COMPONENTS
// ============================================

/**
 * Collapsible section header
 */
interface SectionHeaderProps {
  title: string;
  icon?: React.ReactNode;
  count?: number;
  isOpen: boolean;
  onToggle: () => void;
  action?: React.ReactNode;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  icon,
  count,
  isOpen,
  onToggle,
  action,
}) => (
  <button
    className={cn(
      'w-full flex items-center gap-2 py-2 px-1',
      'text-left text-sm font-medium text-muted-foreground',
      'hover:text-foreground transition-colors',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 rounded'
    )}
    onClick={onToggle}
    aria-expanded={isOpen}
  >
    {isOpen ? (
      <ChevronDown className="h-3 w-3 flex-shrink-0" />
    ) : (
      <ChevronRight className="h-3 w-3 flex-shrink-0" />
    )}
    {icon}
    <span className="uppercase text-label-xs tracking-wider">{title}</span>
    {count !== undefined && count > 0 && (
      <span className="text-label-xs tabular-nums text-muted-foreground/60">
        {count}
      </span>
    )}
    {action && (
      <div className="ml-auto" onClick={(e) => e.stopPropagation()}>
        {action}
      </div>
    )}
  </button>
);

// ============================================
// NOW SECTION (Online Members)
// ============================================

export interface OnlineMember {
  id: string;
  handle: string;
  name?: string;
  avatar?: string;
}

interface NowSectionProps {
  members: OnlineMember[];
  total: number;
  onMemberClick?: (memberId: string) => void;
  maxDisplay?: number;
}

const NowSection: React.FC<NowSectionProps> = ({
  members,
  total,
  onMemberClick,
  maxDisplay = 5,
}) => {
  const [isOpen, setIsOpen] = React.useState(true);
  const displayMembers = members.slice(0, maxDisplay);
  const remaining = total - displayMembers.length;

  return (
    <div>
      <SectionHeader
        title="Now"
        icon={<span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent-gold)]" />}
        count={total}
        isOpen={isOpen}
        onToggle={() => setIsOpen(!isOpen)}
      />
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="space-y-1 py-1">
              {displayMembers.map((member) => (
                <button
                  key={member.id}
                  className={cn(
                    'w-full flex items-center gap-2 px-2 py-1.5 rounded-lg',
                    'hover:bg-white/[0.04] transition-colors',
                    'text-left'
                  )}
                  onClick={() => onMemberClick?.(member.id)}
                >
                  <Avatar size="xs">
                    {member.avatar && <AvatarImage src={member.avatar} />}
                    <AvatarFallback>
                      {getInitials(member.name || member.handle)}
                    </AvatarFallback>
                  </Avatar>
                  <Text size="sm" className="truncate">
                    {member.handle}
                  </Text>
                </button>
              ))}
              {remaining > 0 && (
                <Text size="xs" tone="muted" className="px-2 py-1">
                  +{remaining} more
                </Text>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ============================================
// NEXT UP SECTION (Upcoming Events)
// ============================================

export interface UpcomingEvent {
  id: string;
  title: string;
  time: string;
  goingCount: number;
}

interface NextUpSectionProps {
  events: UpcomingEvent[];
  onEventClick?: (eventId: string) => void;
  onRsvp?: (eventId: string) => void;
}

const NextUpSection: React.FC<NextUpSectionProps> = ({
  events,
  onEventClick,
  onRsvp,
}) => {
  const [isOpen, setIsOpen] = React.useState(true);

  if (events.length === 0) {
    return null; // Don't show section if no events
  }

  return (
    <div>
      <SectionHeader
        title="Next Up"
        icon={<Calendar className="h-3 w-3" />}
        count={events.length}
        isOpen={isOpen}
        onToggle={() => setIsOpen(!isOpen)}
      />
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="space-y-2 py-1">
              {events.map((event) => (
                <Card
                  key={event.id}
                  interactive
                  warmth="none"
                  className="p-3 cursor-pointer"
                  onClick={() => onEventClick?.(event.id)}
                >
                  <Text size="sm" weight="medium" className="mb-1 line-clamp-1">
                    {event.title}
                  </Text>
                  <div className="flex items-center justify-between">
                    <Text size="xs" tone="muted">
                      {event.time}
                    </Text>
                    <div className="flex items-center gap-2">
                      <Text size="xs" tone="muted">
                        {event.goingCount} going
                      </Text>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRsvp?.(event.id);
                        }}
                      >
                        RSVP
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ============================================
// PINNED SECTION (Pinned Resources)
// ============================================

export interface PinnedItem {
  id: string;
  title: string;
  type: 'message' | 'link' | 'file';
}

interface PinnedSectionProps {
  items: PinnedItem[];
  onItemClick?: (itemId: string) => void;
}

const getItemIcon = (type: PinnedItem['type']) => {
  switch (type) {
    case 'message':
      return '💬';
    case 'link':
      return '🔗';
    case 'file':
      return '📄';
    default:
      return '📌';
  }
};

const PinnedSection: React.FC<PinnedSectionProps> = ({
  items,
  onItemClick,
}) => {
  const [isOpen, setIsOpen] = React.useState(true);

  if (items.length === 0) {
    return null;
  }

  return (
    <div>
      <SectionHeader
        title="Pinned"
        icon={<Pin className="h-3 w-3" />}
        count={items.length}
        isOpen={isOpen}
        onToggle={() => setIsOpen(!isOpen)}
      />
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="space-y-1 py-1">
              {items.map((item) => (
                <button
                  key={item.id}
                  className={cn(
                    'w-full flex items-center gap-2 px-2 py-1.5 rounded-lg',
                    'hover:bg-white/[0.04] transition-colors',
                    'text-left'
                  )}
                  onClick={() => onItemClick?.(item.id)}
                >
                  <span className="text-sm">{getItemIcon(item.type)}</span>
                  <Text size="sm" className="truncate">
                    {item.title}
                  </Text>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

export interface SpacePanelProps {
  /** Online members data */
  now: {
    members: OnlineMember[];
    total: number;
  };
  /** Upcoming events */
  nextUp: UpcomingEvent[];
  /** Pinned resources */
  pinned: PinnedItem[];
  /** Whether panel is collapsed */
  collapsed?: boolean;
  /** Callback when collapse toggle is clicked */
  onToggle?: () => void;
  /** Callback when member is clicked */
  onMemberClick?: (memberId: string) => void;
  /** Callback when event is clicked */
  onEventClick?: (eventId: string) => void;
  /** Callback when RSVP is clicked */
  onRsvp?: (eventId: string) => void;
  /** Callback when pinned item is clicked */
  onPinnedClick?: (itemId: string) => void;
  /** Additional className */
  className?: string;
}

const SpacePanel = React.forwardRef<HTMLDivElement, SpacePanelProps>(
  (
    {
      now,
      nextUp,
      pinned,
      collapsed = false,
      onToggle,
      onMemberClick,
      onEventClick,
      onRsvp,
      onPinnedClick,
      className,
    },
    ref
  ) => {
    if (collapsed) {
      return null; // When collapsed, panel is hidden (parent handles width)
    }

    return (
      <div
        ref={ref}
        className={cn(
          'h-full flex flex-col',
          'border-l border-white/[0.06]',
          'bg-[var(--color-bg-page)]',
          'overflow-hidden',
          className
        )}
      >
        {/* Header with collapse toggle */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
          <Text size="xs" tone="muted" className="uppercase tracking-wider">
            Context
          </Text>
          {onToggle && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={onToggle}
            >
              <X className="h-3 w-3" />
              <span className="sr-only">Collapse panel (⌘⇧P)</span>
            </Button>
          )}
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
          <NowSection
            members={now.members}
            total={now.total}
            onMemberClick={onMemberClick}
          />

          {nextUp.length > 0 && (
            <>
              <Separator className="my-2" />
              <NextUpSection
                events={nextUp}
                onEventClick={onEventClick}
                onRsvp={onRsvp}
              />
            </>
          )}

          {pinned.length > 0 && (
            <>
              <Separator className="my-2" />
              <PinnedSection
                items={pinned}
                onItemClick={onPinnedClick}
              />
            </>
          )}
        </div>

        {/* Footer with keyboard hint */}
        <div className="px-4 py-2 border-t border-white/[0.06]">
          <Text size="xs" tone="muted" className="text-center">
            <span className="font-sans">⌘⇧P</span> to toggle
          </Text>
        </div>
      </div>
    );
  }
);

SpacePanel.displayName = 'SpacePanel';

// ============================================
// SKELETON
// ============================================

interface SpacePanelSkeletonProps {
  className?: string;
}

const SpacePanelSkeleton: React.FC<SpacePanelSkeletonProps> = ({ className }) => {
  return (
    <div
      className={cn(
        'h-full flex flex-col',
        'border-l border-white/[0.06]',
        'bg-[var(--color-bg-page)]',
        className
      )}
    >
      <div className="px-4 py-3 border-b border-white/[0.06]">
        <div className="h-3 w-16 rounded bg-white/[0.06] animate-pulse" />
      </div>
      <div className="flex-1 px-4 py-3 space-y-4">
        {/* NOW section skeleton */}
        <div className="space-y-2">
          <div className="h-3 w-12 rounded bg-white/[0.06] animate-pulse" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-lg bg-white/[0.06] animate-pulse" />
              <div className="h-4 w-20 rounded bg-white/[0.06] animate-pulse" />
            </div>
          ))}
        </div>
        {/* NEXT UP section skeleton */}
        <div className="space-y-2">
          <div className="h-3 w-16 rounded bg-white/[0.06] animate-pulse" />
          <div className="h-16 rounded-xl bg-white/[0.04] animate-pulse" />
        </div>
        {/* PINNED section skeleton */}
        <div className="space-y-2">
          <div className="h-3 w-14 rounded bg-white/[0.06] animate-pulse" />
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="h-4 w-4 rounded bg-white/[0.06] animate-pulse" />
              <div className="h-4 w-24 rounded bg-white/[0.06] animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

SpacePanelSkeleton.displayName = 'SpacePanelSkeleton';

// ============================================
// EXPORTS
// ============================================

export {
  SpacePanel,
  SpacePanelSkeleton,
  NowSection,
  NextUpSection,
  PinnedSection,
};
