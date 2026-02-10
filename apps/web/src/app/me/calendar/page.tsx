"use client";

/**
 * /me/calendar — Calendar
 *
 * Read-only calendar showing events from user's spaces.
 * Personal event creation removed — use Google Calendar for personal events.
 *
 * @version 3.0.0 - Spaces-first calendar (Feb 2026)
 */

// Force dynamic rendering to avoid SSG issues with auth context
export const dynamic = 'force-dynamic';

import { useState, useMemo, useEffect, useCallback } from "react";
import { Button, HiveModal, toast } from "@hive/ui";
import { useAuth } from "@hive/auth-logic";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline";
import { EventDetailsModal } from "@/components/events/event-details-modal";
import { PageContainer, CalendarLoadingSkeleton, EventCard, ConflictResolutionPanel } from "@/components/calendar/calendar-components";
import { CalendarEmptyState } from "@/components/ui/CalendarEmptyState";
import {
  useCalendar,
  type CalendarEvent,
  getEventDataType,
} from "@/hooks/use-calendar";

// Icon aliases
const ChevronLeft = ChevronLeftIcon;
const ChevronRight = ChevronRightIcon;
const AlertTriangle = ExclamationTriangleIcon;
const Filter = FunnelIcon;

export default function CalendarPage() {
  const { user } = useAuth();

  // Use centralized calendar hook for state and data management
  const {
    viewMode,
    events,
    eventTypeFilter,
    isLoading,
    viewEvents,
    conflictEvents,
    viewTitle,
    setViewMode,
    setEventTypeFilter,
    navigateDate,
    goToToday,
    updateEventRSVP,
  } = useCalendar();

  // Local UI state for modals
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [showConflicts, setShowConflicts] = useState(false);
  const [isResolvingConflict, setIsResolvingConflict] = useState(false);

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const tag = (document.activeElement?.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        navigateDate('prev');
        break;
      case 'ArrowRight':
        e.preventDefault();
        navigateDate('next');
        break;
      case 't':
        e.preventDefault();
        goToToday();
        break;
      case 'd':
        e.preventDefault();
        setViewMode('day');
        break;
      case 'w':
        e.preventDefault();
        setViewMode('week');
        break;
      case 'm':
        e.preventDefault();
        setViewMode('month');
        break;
    }
  }, [navigateDate, goToToday, setViewMode]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Memoize selected event data for modal
  const selectedEventData = useMemo(() => {
    if (!selectedEvent) return null;

    const event = events.find(e => e.id === selectedEvent);
    if (!event) return null;

    return {
      id: event.id,
      title: event.title,
      description: event.description || '',
      type: getEventDataType(event.type),
      organizer: {
        id: user?.id || 'organizer-unknown',
        name: user?.fullName || 'Event Organizer',
        handle: user?.handle || 'organizer',
        verified: false
      },
      space: event.space ? {
        ...event.space,
        type: 'general'
      } : undefined,
      datetime: {
        start: event.startTime,
        end: event.endTime,
        timezone: 'America/New_York'
      },
      location: {
        type: 'physical' as const,
        name: event.location || 'TBD',
        address: event.location
      },
      capacity: {
        max: 50,
        current: 12,
        waitlist: 0
      },
      tools: event.tools || [],
      tags: [],
      visibility: 'public' as const,
      rsvpStatus: (event.rsvpStatus as 'going' | 'interested' | 'not_going') || 'interested',
      isBookmarked: false,
      engagement: {
        going: 12,
        interested: 8,
        comments: 3,
        shares: 1
      },
      requirements: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }, [selectedEvent, events, user]);

  if (isLoading) {
    return <CalendarLoadingSkeleton />;
  }

  return (
      <PageContainer
        title="Calendar"
        subtitle="Events from your spaces"
        actions={
          <div className="flex items-center space-x-3">
            {/* Conflict Warning */}
            {conflictEvents.length > 0 && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowConflicts(true)}
                className="border-red-500 text-red-400 hover:bg-red-500/10"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                {conflictEvents.length} Conflicts
              </Button>
            )}

            {/* View Mode Toggle */}
            <div className="flex items-center bg-[var(--surface-elevated)] rounded-lg p-1">
              {['day', 'week', 'month'].map((mode) => (
                <Button
                  key={mode}
                  variant={viewMode === mode ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode(mode as 'month' | 'week' | 'day')}
                  className="text-label capitalize transition-all duration-200"
                >
                  {mode}
                </Button>
              ))}
            </div>
          </div>
        }
        maxWidth="7xl"
      >
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigateDate('prev')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <h2 className="text-heading-lg text-[var(--text-primary)] min-w-[200px] text-center">
                {viewTitle}
              </h2>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigateDate('next')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={goToToday}
            >
              Today
            </Button>
          </div>

          {/* Event Type Filter */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-[var(--text-tertiary)]" />
              <select
                value={eventTypeFilter}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setEventTypeFilter(e.target.value as CalendarEvent['type'] | 'all')}
                className="bg-[var(--surface-elevated)] border border-[var(--border-subtle)] rounded-lg px-3 py-1 text-[var(--text-primary)] text-body-sm focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]"
              >
                <option value="all">All Events</option>
                <option value="event">Campus Events</option>
                <option value="class">Classes</option>
                <option value="assignment">Assignments</option>
                <option value="meeting">Meetings</option>
                <option value="personal">Personal</option>
              </select>
            </div>

            {/* Keyboard Shortcut Hints */}
            <span className="hidden md:flex items-center gap-2 text-xs text-white/50">
              <kbd className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-white/[0.06] border border-white/[0.06]">&larr;</kbd>
              <kbd className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-white/[0.06] border border-white/[0.06]">&rarr;</kbd>
              <span>navigate</span>
              <kbd className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-white/[0.06] border border-white/[0.06]">t</kbd>
              <span>today</span>
              <kbd className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-white/[0.06] border border-white/[0.06]">d</kbd>
              <kbd className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-white/[0.06] border border-white/[0.06]">w</kbd>
              <kbd className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-white/[0.06] border border-white/[0.06]">m</kbd>
              <span>view</span>
            </span>
          </div>
        </div>

        {/* Events List/Grid */}
        <div className="space-y-4">
          {viewEvents.length === 0 ? (
            <CalendarEmptyState
              variant={eventTypeFilter !== 'all' ? 'filtered' : viewMode as 'day' | 'week' | 'month'}
              filterType={eventTypeFilter !== 'all' ? eventTypeFilter : undefined}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {viewEvents.map((event, index) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onClick={() => setSelectedEvent(event.id)}
                  index={index}
                />
              ))}
            </div>
          )}
        </div>

        {/* Conflicts Modal */}
        <HiveModal open={showConflicts} onOpenChange={setShowConflicts} size="lg">
          <ConflictResolutionPanel
            events={events}
            conflictEvents={conflictEvents}
            onResolve={async (eventId, status, spaceId) => {
              setIsResolvingConflict(true);
              try {
                await updateEventRSVP(eventId, status, spaceId);
                // If all conflicts are resolved, close the modal
                const remainingConflicts = conflictEvents.filter(
                  e => e.id !== eventId && e.rsvpStatus !== 'not_going'
                );
                if (remainingConflicts.length === 0 && status === 'not_going') {
                  toast.success('All conflicts resolved', 'Your schedule is now clear.');
                }
              } catch {
                toast.error('Failed to update RSVP', 'Please try again.');
              } finally {
                setIsResolvingConflict(false);
              }
            }}
            isResolving={isResolvingConflict}
          />
        </HiveModal>

        {/* Event Details Modal */}
        <EventDetailsModal
          isOpen={!!selectedEvent}
          onClose={() => setSelectedEvent(null)}
          event={selectedEventData}
          currentUserId={user?.id}
          onRSVP={(eventId: string, status: CalendarEvent["rsvpStatus"]) => {
            const event = events.find(e => e.id === eventId);
            updateEventRSVP(eventId, status, event?.space?.id);
          }}
          onBookmark={() => {
            toast.info('Bookmarks coming soon', 'Event bookmarking will be available in a future update.');
          }}
        />
      </PageContainer>
  );
}
