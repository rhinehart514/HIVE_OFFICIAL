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

import { useState, useMemo } from "react";
import { Button, HiveModal, toast } from "@hive/ui";
import { useAuth } from "@hive/auth-logic";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon,
  CheckIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline";
import { EventDetailsModal } from "@/components/events/event-details-modal";
import { PageContainer, CalendarLoadingSkeleton, EventCard } from "@/components/calendar/calendar-components";
import { CalendarEmptyState } from "@/components/ui/CalendarEmptyState";
import {
  useCalendar,
  type CalendarEvent,
  formatTime,
  formatDate,
  getEventDataType,
} from "@/hooks/use-calendar";

// Icon aliases
const ChevronLeft = ChevronLeftIcon;
const ChevronRight = ChevronRightIcon;
const AlertTriangle = ExclamationTriangleIcon;
const Check = CheckIcon;
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
          <div className="space-y-4">
            <h2 className="text-heading-sm text-[var(--text-primary)] mb-4">Schedule Conflicts</h2>
            {conflictEvents.length === 0 ? (
              <div className="text-center py-8">
                <Check className="h-12 w-12 text-[var(--hive-status-success)] mx-auto mb-3" />
                <p className="text-body text-[var(--text-secondary)]">No conflicts detected</p>
                <p className="text-body-sm text-[var(--text-muted)] mt-1">Your schedule is clear</p>
              </div>
            ) : (
              conflictEvents.map((event) => (
                <div key={event.id} className="p-4 bg-[var(--hive-status-error)]/10 border border-[var(--hive-status-error)]/30 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-label font-semibold text-[var(--text-primary)]">{event.title}</h3>
                    <AlertTriangle className="h-5 w-5 text-[var(--hive-status-error)]" />
                  </div>
                  <p className="text-body-sm text-[var(--text-tertiary)] mb-3">
                    {formatDate(event.startTime)} • {formatTime(event.startTime)} - {formatTime(event.endTime)}
                  </p>
                  <p className="text-label text-[var(--text-muted)]">
                    Conflict resolution coming soon
                  </p>
                </div>
              ))
            )}
          </div>
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
