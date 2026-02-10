"use client";

/**
 * Calendar Page Components
 * Extracted to reduce calendar/page.tsx line count
 */

import React, { useState, useMemo } from "react";
import { Card, Badge, Button, MOTION } from "@hive/ui";
import { motion } from "@hive/ui/design-system/primitives";
import { AnimatePresence } from "framer-motion";
import {
  ClockIcon,
  MapPinIcon,
  UsersIcon,
  ExclamationTriangleIcon,
  CheckIcon,
  XMarkIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import type { CalendarEvent } from "@/hooks/use-calendar";
import { getTypeColor, getTypeIcon, formatTime, formatDate } from "@/hooks/use-calendar";

// ============================================
// PAGE CONTAINER
// ============================================

interface PageContainerProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  maxWidth?: string;
}

export function PageContainer({
  title,
  subtitle,
  children,
  actions,
  maxWidth = "6xl"
}: PageContainerProps) {
  return (
    <div className={`max-w-${maxWidth} mx-auto px-4 py-8`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-heading-lg text-[var(--text-primary)]">{title}</h1>
          {subtitle && <p className="text-body-sm text-[var(--text-secondary)] mt-1">{subtitle}</p>}
        </div>
        {actions}
      </div>
      {children}
    </div>
  );
}

// ============================================
// LOADING SKELETON
// ============================================

/**
 * CalendarLoadingSkeleton - Premium skeleton for calendar page
 *
 * Matches the calendar page layout:
 * - Header with title, subtitle, and action buttons
 * - View mode toggle (day/week/month)
 * - Navigation controls with month title
 * - Event cards grid
 *
 * Uses staggered wave animation (0.15s delay between elements)
 * Base color: white/[0.06] per design tokens
 */
export function CalendarLoadingSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <motion.div
            className="h-7 w-24 bg-white/[0.06] rounded mb-2"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: MOTION.ease.premium }}
          />
          <motion.div
            className="h-4 w-56 bg-white/[0.06] rounded"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.1, ease: MOTION.ease.premium }}
          />
        </div>
        {/* Action buttons */}
        <div className="flex items-center gap-3">
          <motion.div
            className="h-9 w-20 bg-white/[0.06] rounded-lg"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.15, ease: MOTION.ease.premium }}
          />
          <motion.div
            className="h-9 w-24 bg-white/[0.06] rounded-lg"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.2, ease: MOTION.ease.premium }}
          />
          <motion.div
            className="h-9 w-28 bg-[var(--life-gold)]/20 rounded-lg"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.25, ease: MOTION.ease.premium }}
          />
        </div>
      </div>

      {/* View mode toggle + Navigation */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          {/* Prev/Next + Month */}
          <div className="flex items-center gap-2">
            <motion.div
              className="h-9 w-9 bg-white/[0.06] rounded-lg"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.3, ease: MOTION.ease.premium }}
            />
            <motion.div
              className="h-7 w-44 bg-white/[0.06] rounded"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.35, ease: MOTION.ease.premium }}
            />
            <motion.div
              className="h-9 w-9 bg-white/[0.06] rounded-lg"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.4, ease: MOTION.ease.premium }}
            />
          </div>
          <motion.div
            className="h-9 w-16 bg-white/[0.06] rounded-lg"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.45, ease: MOTION.ease.premium }}
          />
        </div>

        {/* Filter dropdown */}
        <div className="flex items-center gap-2">
          <motion.div
            className="h-4 w-4 bg-white/[0.06] rounded"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.5, ease: MOTION.ease.premium }}
          />
          <motion.div
            className="h-8 w-32 bg-white/[0.06] rounded-lg"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.55, ease: MOTION.ease.premium }}
          />
        </div>
      </div>

      {/* Event cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <motion.div
            key={i}
            className="p-4 rounded-lg bg-white/[0.06] border border-white/[0.06]"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: 0.6 + i * 0.1,
              ease: MOTION.ease.premium,
            }}
          >
            {/* Event type indicator */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <motion.div
                  className="w-3 h-3 rounded-full bg-white/[0.06]"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.65 + i * 0.1, ease: MOTION.ease.premium }}
                />
                <motion.div
                  className="w-5 h-5 bg-white/[0.06] rounded"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.7 + i * 0.1, ease: MOTION.ease.premium }}
                />
              </div>
            </div>

            {/* Event title */}
            <motion.div
              className="h-5 w-3/4 bg-white/[0.06] rounded mb-3"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.75 + i * 0.1, ease: MOTION.ease.premium }}
            />

            {/* Event details */}
            <div className="space-y-2">
              <motion.div
                className="h-3 w-full bg-white/[0.06] rounded"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.8 + i * 0.1, ease: MOTION.ease.premium }}
              />
              <motion.div
                className="h-3 w-2/3 bg-white/[0.06] rounded"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.85 + i * 0.1, ease: MOTION.ease.premium }}
              />
            </div>

            {/* Footer badges */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.06]">
              <motion.div
                className="h-5 w-16 bg-white/[0.06] rounded-full"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.9 + i * 0.1, ease: MOTION.ease.premium }}
              />
              <motion.div
                className="h-5 w-14 bg-white/[0.06] rounded-full"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.95 + i * 0.1, ease: MOTION.ease.premium }}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// EVENT CARD
// ============================================

interface EventCardProps {
  event: CalendarEvent;
  onClick: () => void;
  index?: number;
}

export function EventCard({ event, onClick, index = 0 }: EventCardProps) {
  // Determine conflict styling based on severity
  const getConflictStyles = () => {
    if (!event.isConflict) {
      return 'bg-[var(--surface-elevated)] border-[var(--border-subtle)] hover:bg-[var(--surface-hover)]';
    }

    switch (event.conflictSeverity) {
      case 'overlap':
        return 'bg-[var(--hive-status-error)]/10 border-[var(--hive-status-error)]/40 hover:bg-[var(--hive-status-error)]/20';
      case 'adjacent':
        return 'bg-[var(--hive-status-warning)]/10 border-[var(--hive-status-warning)]/40 hover:bg-[var(--hive-status-warning)]/20';
      case 'close':
        return 'bg-[var(--hive-status-info)]/10 border-[var(--hive-status-info)]/40 hover:bg-[var(--hive-status-info)]/20';
      default:
        return 'bg-[var(--hive-status-error)]/10 border-[var(--hive-status-error)]/40 hover:bg-[var(--hive-status-error)]/20';
    }
  };

  const getConflictIconColor = () => {
    switch (event.conflictSeverity) {
      case 'overlap':
        return 'text-[var(--hive-status-error)]';
      case 'adjacent':
        return 'text-[var(--hive-status-warning)]';
      case 'close':
        return 'text-[var(--hive-status-info)]';
      default:
        return 'text-[var(--hive-status-error)]';
    }
  };

  const getConflictLabel = () => {
    switch (event.conflictSeverity) {
      case 'overlap':
        return 'Overlaps';
      case 'adjacent':
        return 'Back-to-back';
      case 'close':
        return 'Tight schedule';
      default:
        return 'Conflict';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.2,
        delay: index * 0.05,
        ease: MOTION.ease.premium,
      }}
      whileHover={{ opacity: 0.97 }}
      whileTap={{ scale: 0.99 }}
    >
      <Card
        className={`p-4 cursor-pointer transition-all duration-200 ${getConflictStyles()}`}
        onClick={onClick}
      >
        {/* Conflict indicator banner */}
        {event.isConflict && (
          <div className={`flex items-center gap-1.5 mb-3 pb-2 border-b border-current/10 ${getConflictIconColor()}`}>
            <ExclamationTriangleIcon className="h-3.5 w-3.5" />
            <span className="text-body-sm font-medium">{getConflictLabel()}</span>
          </div>
        )}

        {/* Space badge - prominent at top */}
        {event.space && (
          <div className="flex items-center justify-between mb-3">
            <Badge variant="gold" className="text-label">
              {event.space.name}
            </Badge>
          </div>
        )}

        {/* Header without space - just type indicator */}
        {!event.space && (
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${getTypeColor(event.type)}`} />
              <span className="text-lg">{getTypeIcon(event.type)}</span>
            </div>
          </div>
        )}

        <h3 className="text-label font-semibold text-[var(--text-primary)] mb-2 leading-tight">{event.title}</h3>

        <div className="space-y-2 text-body-sm text-[var(--text-secondary)]">
          <div className="flex items-center space-x-2">
            <ClockIcon className="h-3 w-3" />
            <span>
              {formatDate(event.startTime)} • {formatTime(event.startTime)} - {formatTime(event.endTime)}
            </span>
          </div>

          {event.location && (
            <div className="flex items-center space-x-2">
              <MapPinIcon className="h-3 w-3" />
              <span className="truncate">{event.location}</span>
            </div>
          )}

          {event.attendees && event.attendees.length > 0 && (
            <div className="flex items-center space-x-2">
              <UsersIcon className="h-3 w-3" />
              <span>{event.attendees.length} attending</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--border-subtle)]">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${getTypeColor(event.type)}`} />
            <span className="text-label text-[var(--text-tertiary)] capitalize">{event.type}</span>
          </div>
          {event.rsvpStatus && (
            <Badge
              variant={event.rsvpStatus === 'going' ? 'success' : 'secondary'}
              className="text-label capitalize"
            >
              {event.rsvpStatus}
            </Badge>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

// ============================================
// CONFLICT GROUP
// ============================================

interface ConflictGroupProps {
  events: CalendarEvent[];
  onResolve: (eventId: string, status: 'going' | 'interested' | 'not_going') => void;
  isResolving?: boolean;
}

/**
 * Groups overlapping events together visually
 */
function ConflictGroup({ events, onResolve, isResolving }: ConflictGroupProps) {
  const [expanded, setExpanded] = useState(true);

  // Find the earliest start time
  const timeRange = useMemo(() => {
    const starts = events.map(e => new Date(e.startTime).getTime());
    const ends = events.map(e => new Date(e.endTime).getTime());
    const earliest = new Date(Math.min(...starts));
    const latest = new Date(Math.max(...ends));
    return `${formatDate(earliest.toISOString())} ${formatTime(earliest.toISOString())} - ${formatTime(latest.toISOString())}`;
  }, [events]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="bg-[var(--hive-status-error)]/5 border border-[var(--hive-status-error)]/20 rounded-lg overflow-hidden"
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-[var(--hive-status-error)]/10 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[var(--hive-status-error)]/20 flex items-center justify-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-[var(--hive-status-error)]" />
          </div>
          <div className="text-left">
            <p className="text-label font-medium text-[var(--text-primary)]">
              {events.length} overlapping events
            </p>
            <p className="text-body-sm text-[var(--text-tertiary)]">{timeRange}</p>
          </div>
        </div>
        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDownIcon className="h-5 w-5 text-[var(--text-tertiary)]" />
        </motion.div>
      </button>

      {/* Expanded content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: MOTION.ease.premium }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              {events.map((event, index) => (
                <ConflictEventRow
                  key={event.id}
                  event={event}
                  onResolve={onResolve}
                  isResolving={isResolving}
                  index={index}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================
// CONFLICT EVENT ROW
// ============================================

interface ConflictEventRowProps {
  event: CalendarEvent;
  onResolve: (eventId: string, status: 'going' | 'interested' | 'not_going') => void;
  isResolving?: boolean;
  index: number;
}

function ConflictEventRow({ event, onResolve, isResolving, index }: ConflictEventRowProps) {
  const isNotGoing = event.rsvpStatus === 'not_going';

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.2, ease: MOTION.ease.premium }}
      className={`flex items-center justify-between p-3 rounded-lg transition-all ${
        isNotGoing
          ? 'bg-white/[0.06] opacity-60'
          : 'bg-[var(--surface-elevated)]'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Event indicator */}
        <div className={`w-1 h-10 rounded-full ${
          isNotGoing ? 'bg-white/[0.06]' : getTypeColor(event.type)
        }`} />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className={`text-label font-medium truncate ${
              isNotGoing ? 'text-[var(--text-muted)] line-through' : 'text-[var(--text-primary)]'
            }`}>
              {event.title}
            </h4>
            {event.space && (
              <Badge variant="gold" className="text-label shrink-0">
                {event.space.name}
              </Badge>
            )}
          </div>
          <p className="text-body-sm text-[var(--text-tertiary)]">
            {formatTime(event.startTime)} - {formatTime(event.endTime)}
            {event.location && ` • ${event.location}`}
          </p>
        </div>
      </div>

      {/* RSVP Actions */}
      <div className="flex items-center gap-2 shrink-0 ml-3">
        {isNotGoing ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onResolve(event.id, 'going')}
            disabled={isResolving}
            className="text-body-sm"
          >
            <CheckIcon className="h-3.5 w-3.5 mr-1.5" />
            Undo
          </Button>
        ) : (
          <>
            <Button
              variant={event.rsvpStatus === 'going' ? 'default' : 'secondary'}
              size="sm"
              onClick={() => onResolve(event.id, 'going')}
              disabled={isResolving || event.rsvpStatus === 'going'}
              className="text-body-sm"
            >
              <CheckIcon className="h-3.5 w-3.5 mr-1.5" />
              Going
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onResolve(event.id, 'not_going')}
              disabled={isResolving}
              className="text-body-sm text-[var(--hive-status-error)] hover:bg-[var(--hive-status-error)]/10"
            >
              <XMarkIcon className="h-3.5 w-3.5 mr-1.5" />
              Skip
            </Button>
          </>
        )}
      </div>
    </motion.div>
  );
}

// ============================================
// CONFLICT RESOLUTION PANEL
// ============================================

interface ConflictResolutionPanelProps {
  events: CalendarEvent[];
  conflictEvents: CalendarEvent[];
  onResolve: (eventId: string, status: 'going' | 'interested' | 'not_going', spaceId?: string) => void;
  isResolving?: boolean;
}

/**
 * ConflictResolutionPanel - Shows grouped conflicts and allows resolution
 *
 * Groups overlapping events together and shows them in a visual timeline.
 * Users can mark events as "not going" to resolve conflicts.
 */
export function ConflictResolutionPanel({
  events,
  conflictEvents,
  onResolve,
  isResolving,
}: ConflictResolutionPanelProps) {
  // Group conflicts by their overlap relationships
  const conflictGroups = useMemo(() => {
    if (conflictEvents.length === 0) return [];

    // Build a graph of connected conflicts
    const visited = new Set<string>();
    const groups: CalendarEvent[][] = [];

    const findGroup = (eventId: string, group: CalendarEvent[]) => {
      if (visited.has(eventId)) return;
      visited.add(eventId);

      const event = events.find(e => e.id === eventId);
      if (!event) return;

      group.push(event);

      // Find all events this one conflicts with
      if (event.conflictsWith) {
        for (const conflictId of event.conflictsWith) {
          findGroup(conflictId, group);
        }
      }
    };

    // Process each conflict event
    for (const event of conflictEvents) {
      if (!visited.has(event.id)) {
        const group: CalendarEvent[] = [];
        findGroup(event.id, group);
        if (group.length > 0) {
          // Sort by start time
          group.sort((a, b) =>
            new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
          );
          groups.push(group);
        }
      }
    }

    // Sort groups by earliest event start time
    groups.sort((a, b) =>
      new Date(a[0].startTime).getTime() - new Date(b[0].startTime).getTime()
    );

    return groups;
  }, [events, conflictEvents]);

  // Count unresolved conflicts (events that are still "going")
  const unresolvedCount = conflictEvents.filter(
    e => e.rsvpStatus !== 'not_going'
  ).length;

  const handleResolve = (eventId: string, status: 'going' | 'interested' | 'not_going') => {
    const event = events.find(e => e.id === eventId);
    onResolve(eventId, status, event?.space?.id);
  };

  if (conflictGroups.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-12"
      >
        <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-[var(--hive-status-success)]/10 flex items-center justify-center">
          <CheckIcon className="h-8 w-8 text-[var(--hive-status-success)]" />
        </div>
        <h3 className="text-heading-sm text-[var(--text-primary)] mb-2">
          No conflicts detected
        </h3>
        <p className="text-body text-[var(--text-secondary)]">
          Your schedule is clear. All your events have non-overlapping times.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-heading-sm text-[var(--text-primary)]">
            Schedule Conflicts
          </h3>
          <p className="text-body-sm text-[var(--text-secondary)] mt-1">
            {unresolvedCount === 0
              ? 'All conflicts resolved'
              : `${unresolvedCount} event${unresolvedCount !== 1 ? 's' : ''} need${unresolvedCount === 1 ? 's' : ''} attention`}
          </p>
        </div>
        {unresolvedCount > 0 && (
          <Badge variant="error" className="text-label">
            {unresolvedCount} unresolved
          </Badge>
        )}
      </div>

      {/* Conflict groups */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {conflictGroups.map((group, _index) => (
            <ConflictGroup
              key={group.map(e => e.id).join('-')}
              events={group}
              onResolve={handleResolve}
              isResolving={isResolving}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Help text */}
      <div className="flex items-start gap-3 p-4 rounded-lg bg-[var(--surface-elevated)] border border-[var(--border-subtle)]">
        <div className="w-8 h-8 rounded-lg bg-[var(--hive-status-info)]/10 flex items-center justify-center shrink-0">
          <svg className="h-4 w-4 text-[var(--hive-status-info)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <p className="text-label font-medium text-[var(--text-primary)]">
            How to resolve conflicts
          </p>
          <p className="text-body-sm text-[var(--text-tertiary)] mt-1">
            Mark events you cannot attend as "Skip" to clear the conflict.
            Events marked as skipped will appear dimmed in your calendar but remain visible.
          </p>
        </div>
      </div>
    </div>
  );
}
