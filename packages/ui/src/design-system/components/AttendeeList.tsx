'use client';

/**
 * AttendeeList Component
 * Source: docs/design-system/COMPONENTS.md
 *
 * Displays event attendees with RSVP status.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * VISUAL DESCRIPTION (for AI reference - no Playwright needed)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * FULL LIST VIEW:
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  Attendees                                                 [Invite]    │
 * │  24 going · 5 maybe                                                    │
 * ├─────────────────────────────────────────────────────────────────────────┤
 * │                                                                         │
 * │  GOING (24)                                                             │
 * │  ──────────────────────────────────────────────────────────────────────│
 * │  ┌────┐                                                                │
 * │  │ AV │  Jane Doe                                           ✓ Going    │
 * │  └────┘  @jane                                                         │
 * │                                                                         │
 * │  ┌────┐                                                                │
 * │  │ AV │  John Smith                                         ✓ Going    │
 * │  └────┘  @johnsmith                                                    │
 * │                                                                         │
 * │  MAYBE (5)                                                              │
 * │  ──────────────────────────────────────────────────────────────────────│
 * │  ┌────┐                                                                │
 * │  │ AV │  Alex Chen                                          ? Maybe    │
 * │  └────┘  @alexc                                                        │
 * │                                                                         │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * RSVP STATUS BADGES:
 * - ✓ Going: Gold (#FFD700) background
 * - ? Maybe: Dashed border, muted text
 * - ✕ Not going: Gray, crossed out (if showing)
 *
 * COMPACT VIEW (Event card footer):
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  [AV][AV][AV][AV]+20 going                                             │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * INLINE VIEW (Minimal):
 * 24 going · 5 maybe
 *
 * ORGANIZER ROW:
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  ┌────┐                                                                │
 * │  │ AV │  Jane Doe                                         ⭐ Organizer  │
 * │  └────┘  @jane                                                         │
 * └─────────────────────────────────────────────────────────────────────────┘
 * - Star icon for organizer
 * - Always shown at top
 *
 * EMPTY STATE:
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │              🎉                                                        │
 * │        No attendees yet                                                │
 * │   Be the first to RSVP!                                                │
 * │                                                                         │
 * │            [RSVP Now]                                                  │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import { Text } from '../primitives';
import { SimpleAvatar, getInitials } from '../primitives/Avatar';

type RSVPStatus = 'going' | 'maybe' | 'not_going';

export interface Attendee {
  id: string;
  name: string;
  handle: string;
  avatar?: string;
  status: RSVPStatus;
  isOrganizer?: boolean;
  respondedAt?: Date | string;
}

const attendeeListVariants = cva('', {
  variants: {
    variant: {
      full: '',
      compact: 'flex items-center gap-2',
      inline: 'flex items-center gap-2',
    },
  },
  defaultVariants: {
    variant: 'full',
  },
});

export interface AttendeeListProps extends VariantProps<typeof attendeeListVariants> {
  /** Attendees to display */
  attendees: Attendee[];
  /** Total counts by status */
  counts?: { going: number; maybe: number; notGoing?: number };
  /** Loading state */
  loading?: boolean;
  /** Show invite button */
  showInvite?: boolean;
  /** Invite handler */
  onInvite?: () => void;
  /** Show not going attendees */
  showNotGoing?: boolean;
  /** Attendee click handler */
  onAttendeeClick?: (attendee: Attendee) => void;
  /** Max visible in compact mode */
  maxVisible?: number;
  /** Group by status */
  groupByStatus?: boolean;
  /** Additional className */
  className?: string;
}

// Status display config
const statusConfig: Record<RSVPStatus, { icon: string; label: string; color: string }> = {
  going: { icon: '✓', label: 'Going', color: 'var(--life-gold)' },
  maybe: { icon: '?', label: 'Maybe', color: '#888888' },
  not_going: { icon: '✕', label: 'Not going', color: '#666666' },
};

/**
 * AttendeeList - Event attendee listing
 */
const AttendeeList: React.FC<AttendeeListProps> = ({
  variant = 'full',
  attendees,
  counts,
  loading = false,
  showInvite = false,
  onInvite,
  showNotGoing = false,
  onAttendeeClick,
  maxVisible = 4,
  groupByStatus = true,
  className,
}) => {
  // Calculate counts if not provided
  const actualCounts = counts || {
    going: attendees.filter((a) => a.status === 'going').length,
    maybe: attendees.filter((a) => a.status === 'maybe').length,
    notGoing: attendees.filter((a) => a.status === 'not_going').length,
  };

  // Inline variant
  if (variant === 'inline') {
    return (
      <div className={cn(attendeeListVariants({ variant }), className)}>
        <Text size="sm" tone="muted">
          {actualCounts.going} going
          {actualCounts.maybe > 0 && ` · ${actualCounts.maybe} maybe`}
        </Text>
      </div>
    );
  }

  // Compact variant (avatar stack)
  if (variant === 'compact') {
    const goingAttendees = attendees.filter((a) => a.status === 'going');
    const visibleAttendees = goingAttendees.slice(0, maxVisible);
    const overflow = goingAttendees.length - maxVisible;

    return (
      <div className={cn(attendeeListVariants({ variant }), className)}>
        <div className="flex -space-x-2">
          {visibleAttendees.map((attendee) => (
            <SimpleAvatar
              key={attendee.id}
              src={attendee.avatar}
              fallback={getInitials(attendee.name)}
              size="sm"
              className="ring-2 ring-[var(--color-bg-page)]"
              onClick={() => onAttendeeClick?.(attendee)}
            />
          ))}
        </div>
        <Text size="xs" tone="muted">
          {overflow > 0 ? `+${overflow} ` : ''}
          {actualCounts.going} going
        </Text>
      </div>
    );
  }

  // Full variant
  // Group attendees by status
  const organizers = attendees.filter((a) => a.isOrganizer);
  const going = attendees.filter((a) => a.status === 'going' && !a.isOrganizer);
  const maybe = attendees.filter((a) => a.status === 'maybe');
  const notGoing = showNotGoing ? attendees.filter((a) => a.status === 'not_going') : [];

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Text size="default" weight="semibold">Attendees</Text>
          <Text size="sm" tone="muted">
            {actualCounts.going} going
            {actualCounts.maybe > 0 && ` · ${actualCounts.maybe} maybe`}
          </Text>
        </div>
        {showInvite && (
          <button
            onClick={onInvite}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-[var(--color-border)] hover:bg-white/5 transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
            </svg>
            Invite
          </button>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <AttendeeRowSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && attendees.length === 0 && (
        <div className="p-8 text-center">
          <div className="text-4xl mb-3">🎉</div>
          <Text size="default" weight="medium">No attendees yet</Text>
          <Text size="sm" tone="muted" className="mt-1">Be the first to RSVP!</Text>
        </div>
      )}

      {/* Attendee list */}
      {!loading && attendees.length > 0 && (
        <>
          {/* Organizers */}
          {organizers.length > 0 && (
            <AttendeeGroup
              title="Organizer"
              attendees={organizers}
              onAttendeeClick={onAttendeeClick}
              isOrganizer
            />
          )}

          {/* Going */}
          {going.length > 0 && (
            <AttendeeGroup
              title="Going"
              count={actualCounts.going}
              attendees={going}
              onAttendeeClick={onAttendeeClick}
              status="going"
            />
          )}

          {/* Maybe */}
          {maybe.length > 0 && (
            <AttendeeGroup
              title="Maybe"
              count={actualCounts.maybe}
              attendees={maybe}
              onAttendeeClick={onAttendeeClick}
              status="maybe"
            />
          )}

          {/* Not going */}
          {notGoing.length > 0 && (
            <AttendeeGroup
              title="Not going"
              count={actualCounts.notGoing || 0}
              attendees={notGoing}
              onAttendeeClick={onAttendeeClick}
              status="not_going"
            />
          )}
        </>
      )}
    </div>
  );
};

AttendeeList.displayName = 'AttendeeList';

/**
 * AttendeeGroup - Group of attendees with heading
 */
interface AttendeeGroupProps {
  title: string;
  count?: number;
  attendees: Attendee[];
  onAttendeeClick?: (attendee: Attendee) => void;
  status?: RSVPStatus;
  isOrganizer?: boolean;
}

const AttendeeGroup: React.FC<AttendeeGroupProps> = ({
  title,
  count,
  attendees,
  onAttendeeClick,
  status,
  isOrganizer,
}) => (
  <div>
    <div className="flex items-center gap-2 mb-2">
      <Text size="xs" weight="medium" tone="muted">
        {title.toUpperCase()}
        {count !== undefined && ` (${count})`}
      </Text>
      <div className="flex-1 h-px bg-[var(--color-border)]" />
    </div>
    <div className="space-y-1">
      {attendees.map((attendee) => (
        <AttendeeRow
          key={attendee.id}
          attendee={attendee}
          onClick={() => onAttendeeClick?.(attendee)}
          showStatus={!isOrganizer}
          isOrganizer={isOrganizer || attendee.isOrganizer}
        />
      ))}
    </div>
  </div>
);

/**
 * AttendeeRow - Single attendee row
 */
interface AttendeeRowProps {
  attendee: Attendee;
  onClick?: () => void;
  showStatus?: boolean;
  isOrganizer?: boolean;
}

const AttendeeRow: React.FC<AttendeeRowProps> = ({
  attendee,
  onClick,
  showStatus = true,
  isOrganizer = false,
}) => {
  const config = statusConfig[attendee.status];

  return (
    <div
      className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
      onClick={onClick}
    >
      {/* Avatar */}
      <SimpleAvatar src={attendee.avatar} fallback={getInitials(attendee.name)} size="default" />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <Text size="sm" weight="medium" className="truncate">
          {attendee.name}
        </Text>
        <Text size="xs" tone="muted">
          @{attendee.handle}
        </Text>
      </div>

      {/* Status badge */}
      {isOrganizer ? (
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-life-gold/20 text-life-gold">
          <span>⭐</span>
          <span>Organizer</span>
        </div>
      ) : showStatus ? (
        <div
          className={cn(
            'flex items-center gap-1 px-2 py-0.5 rounded-full text-xs',
            attendee.status === 'going' && 'bg-life-gold/20 text-life-gold',
            attendee.status === 'maybe' && 'border border-dashed border-[var(--color-border)] text-[var(--color-text-muted)]',
            attendee.status === 'not_going' && 'text-[var(--color-text-muted)] line-through'
          )}
        >
          <span>{config.icon}</span>
          <span>{config.label}</span>
        </div>
      ) : null}
    </div>
  );
};

/**
 * AttendeeRowSkeleton - Loading state
 */
const AttendeeRowSkeleton: React.FC = () => (
  <div className="flex items-center gap-3 p-2 animate-pulse">
    <div className="w-10 h-10 rounded-xl bg-[var(--color-bg-elevated)]" />
    <div className="flex-1">
      <div className="h-4 w-24 bg-[var(--color-bg-elevated)] rounded mb-1" />
      <div className="h-3 w-16 bg-[var(--color-bg-elevated)] rounded" />
    </div>
    <div className="h-6 w-16 bg-[var(--color-bg-elevated)] rounded-full" />
  </div>
);

/**
 * AttendeeStack - Compact avatar stack with count
 */
export interface AttendeeStackProps {
  attendees: Attendee[];
  totalCount?: number;
  maxVisible?: number;
  size?: 'sm' | 'md';
  onClick?: () => void;
  className?: string;
}

const AttendeeStack: React.FC<AttendeeStackProps> = ({
  attendees,
  totalCount,
  maxVisible = 4,
  size = 'sm',
  onClick,
  className,
}) => {
  const goingAttendees = attendees.filter((a) => a.status === 'going');
  const visibleAttendees = goingAttendees.slice(0, maxVisible);
  const count = totalCount || goingAttendees.length;
  const overflow = count - maxVisible;
  // Map 'md' to 'default' for SimpleAvatar compatibility
  const avatarSize = size === 'md' ? 'default' : size;

  return (
    <button
      onClick={onClick}
      className={cn('flex items-center gap-2 group', className)}
    >
      <div className="flex -space-x-2">
        {visibleAttendees.map((attendee) => (
          <SimpleAvatar
            key={attendee.id}
            src={attendee.avatar}
            fallback={getInitials(attendee.name)}
            size={avatarSize}
            className="ring-2 ring-[var(--color-bg-page)] group-hover:ring-[var(--color-border)] transition-colors"
          />
        ))}
        {overflow > 0 && (
          <div
            className={cn(
              'flex items-center justify-center rounded-xl bg-[var(--color-bg-elevated)] ring-2 ring-[var(--color-bg-page)] group-hover:ring-[var(--color-border)] transition-colors',
              size === 'sm' ? 'w-6 h-6 text-xs' : 'w-8 h-8 text-sm'
            )}
          >
            <Text size="xs" tone="muted">+{overflow}</Text>
          </div>
        )}
      </div>
      <Text size="xs" tone="muted" className="group-hover:text-white transition-colors">
        {count} going
      </Text>
    </button>
  );
};

AttendeeStack.displayName = 'AttendeeStack';

export { AttendeeList, AttendeeRow, AttendeeRowSkeleton, AttendeeStack };
