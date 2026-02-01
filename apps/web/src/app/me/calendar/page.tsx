"use client";

/**
 * /me/calendar — Personal Calendar
 *
 * Canonical calendar URL under the "You" pillar.
 *
 * @version 2.0.0 - IA Unification (Jan 2026)
 */

// Force dynamic rendering to avoid SSG issues with auth context
export const dynamic = 'force-dynamic';

import { useState, useMemo } from "react";
import { Button, Card, HiveModal, Input, Label, toast } from "@hive/ui";
import { logger } from "@/lib/logger";
import { useAuth } from "@hive/auth-logic";
import {
  CalendarIcon,
  PlusIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon,
  CheckIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";
import { EventDetailsModal } from "@/components/events/event-details-modal";
import { CreateEventModal, type CreateEventData } from "@/components/events/create-event-modal";
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
const Calendar = CalendarIcon;
const Plus = PlusIcon;
const ChevronLeft = ChevronLeftIcon;
const ChevronRight = ChevronRightIcon;
const AlertTriangle = ExclamationTriangleIcon;
const Check = CheckIcon;
const Filter = FunnelIcon;
const Download = ArrowDownTrayIcon;
const Settings = Cog6ToothIcon;

// Edit Event Form Component
function EditEventForm({
  event,
  onSave,
  onCancel,
}: {
  event: CalendarEvent;
  onSave: (updates: Partial<CalendarEvent>) => Promise<void>;
  onCancel: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState(event.title);
  const [description, setDescription] = useState(event.description || '');
  const [location, setLocation] = useState(event.location || '');
  const [startDate, setStartDate] = useState(
    event.startTime ? new Date(event.startTime).toISOString().slice(0, 10) : ''
  );
  const [startTime, setStartTime] = useState(
    event.startTime ? new Date(event.startTime).toTimeString().slice(0, 5) : ''
  );
  const [endDate, setEndDate] = useState(
    event.endTime ? new Date(event.endTime).toISOString().slice(0, 10) : ''
  );
  const [endTime, setEndTime] = useState(
    event.endTime ? new Date(event.endTime).toTimeString().slice(0, 5) : ''
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Title required", "Please enter an event title.");
      return;
    }

    setIsSubmitting(true);
    try {
      const startDateTime = startDate && startTime
        ? new Date(`${startDate}T${startTime}`).toISOString()
        : event.startTime;
      const endDateTime = endDate && endTime
        ? new Date(`${endDate}T${endTime}`).toISOString()
        : event.endTime;

      await onSave({
        title: title.trim(),
        description: description.trim(),
        location: location.trim(),
        startTime: startDateTime,
        endTime: endDateTime,
      });
    } catch (err) {
      toast.error("Update failed", err instanceof Error ? err.message : "Could not update event.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-heading-sm text-[var(--text-primary)] mb-1">Edit Event</h2>
        <p className="text-body-sm text-[var(--text-tertiary)]">Update your event details</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="edit-title" className="text-label text-[var(--text-secondary)]">
            Event Title *
          </Label>
          <Input
            id="edit-title"
            value={title}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
            placeholder="Event title"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-description" className="text-label text-[var(--text-secondary)]">
            Description
          </Label>
          <textarea
            id="edit-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Event description"
            rows={3}
            className="w-full px-4 py-3 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] resize-none"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-location" className="text-label text-[var(--text-secondary)]">
            Location
          </Label>
          <Input
            id="edit-location"
            value={location}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocation(e.target.value)}
            placeholder="Event location"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-label text-[var(--text-secondary)]">Start</Label>
            <div className="flex gap-2">
              <Input
                type="date"
                value={startDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStartDate(e.target.value)}
                className="flex-1"
              />
              <Input
                type="time"
                value={startTime}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStartTime(e.target.value)}
                className="w-28"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-label text-[var(--text-secondary)]">End</Label>
            <div className="flex gap-2">
              <Input
                type="date"
                value={endDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEndDate(e.target.value)}
                className="flex-1"
              />
              <Input
                type="time"
                value={endTime}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEndTime(e.target.value)}
                className="w-28"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-subtle)]">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="brand" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}

export default function CalendarPage() {
  const { user } = useAuth();

  // Use centralized calendar hook for state and data management
  const {
    viewMode,
    events,
    integrations,
    eventTypeFilter,
    isLoading,
    viewEvents,
    conflictEvents,
    viewTitle,
    setViewMode,
    setEventTypeFilter,
    navigateDate,
    goToToday,
    addEvent,
    updateEventRSVP,
    updateEvent,
    deleteEvent,
  } = useCalendar();

  // Local UI state for modals
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [showIntegrations, setShowIntegrations] = useState(false);
  const [showConflicts, setShowConflicts] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

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
        subtitle="Your personal schedule and campus coordination hub"
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

            {/* Settings */}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowIntegrations(true)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Sync
            </Button>

            {/* Add Event */}
            <Button
              onClick={() => setShowAddEvent(true)}
              className="bg-life-gold text-ground hover:bg-life-gold/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Event
            </Button>
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

        {/* Integration Status */}
        {integrations.some(i => i.isConnected && (i.eventCount ?? 0) > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {integrations.filter(i => i.isConnected && (i.eventCount ?? 0) > 0).map((integration) => (
              <Card key={integration.id} className="p-4 bg-[var(--surface-subtle)] border-[var(--border-subtle)]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-[var(--hive-status-success)] rounded-full"></div>
                    <div>
                      <div className="text-label text-[var(--text-primary)]">{integration.name}</div>
                      <div className="text-label text-[var(--text-tertiary)]">
                        {integration.eventCount} events • Last sync: {integration.lastSync && new Date(integration.lastSync).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                  <Check className="h-4 w-4 text-[var(--hive-status-success)]" />
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Events List/Grid */}
        <div className="space-y-4">
          {viewEvents.length === 0 ? (
            <CalendarEmptyState
              variant={eventTypeFilter !== 'all' ? 'filtered' : viewMode as 'day' | 'week' | 'month'}
              filterType={eventTypeFilter !== 'all' ? eventTypeFilter : undefined}
              onCreateEvent={() => setShowAddEvent(true)}
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

        {/* Add Event Modal */}
        <CreateEventModal
          isOpen={showAddEvent}
          onClose={() => setShowAddEvent(false)}
          onCreateEvent={async (eventData: CreateEventData) => {
            const newEvent: CalendarEvent = {
              id: '',
              title: eventData.title,
              description: eventData.description,
              startTime: eventData.datetime.start,
              endTime: eventData.datetime.end,
              location: eventData.location.name,
              type: eventData.type === 'academic' ? 'class' :
                     eventData.type === 'social' ? 'event' :
                     eventData.type === 'professional' ? 'meeting' :
                     eventData.type === 'recreational' ? 'event' : 'personal',
              color: eventData.type === 'academic' ? 'var(--hive-status-info)' :
                     eventData.type === 'social' ? 'var(--hive-brand-primary)' :
                     eventData.type === 'professional' ? 'var(--hive-status-success)' :
                     eventData.type === 'recreational' ? 'var(--hive-status-warning)' : 'var(--hive-status-info)',
              source: 'hive',
              attendees: [],
              rsvpStatus: 'going',
              tools: [],
              space: undefined
            };
            try {
              await addEvent(newEvent);
            } catch (err) {
              toast.error('Failed to create event', err instanceof Error ? err.message : 'Please try again.');
              throw err;
            }
          }}
        />

        {/* Calendar Integrations Modal */}
        <HiveModal
          open={showIntegrations}
          onOpenChange={setShowIntegrations}
          size="lg"
        >
          <div className="space-y-6">
            <div>
              <h2 className="text-heading-sm text-[var(--text-primary)] mb-1">Calendar Integrations</h2>
              <p className="text-body-sm text-[var(--text-tertiary)]">External calendar sync is coming soon</p>
            </div>

            {/* Coming Soon Banner */}
            <div className="p-4 bg-life-gold/5 rounded-lg border border-life-gold/20">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-full bg-life-gold/10 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-4 h-4 text-life-gold" />
                </div>
                <div>
                  <p className="text-label text-[var(--text-primary)] mb-1">
                    Integrations launching soon
                  </p>
                  <p className="text-body-sm text-[var(--text-tertiary)]">
                    We&apos;re building connections to Google Calendar, Canvas LMS, and Outlook. For now, create events directly in HIVE.
                  </p>
                </div>
              </div>
            </div>

            {/* Planned Integrations */}
            <div>
              <p className="text-label text-[var(--text-muted)] uppercase tracking-wider mb-3">Planned Integrations</p>
              <div className="space-y-3">
                {integrations.map((integration) => (
                  <div key={integration.id} className="flex items-center justify-between p-4 bg-[var(--surface-subtle)] rounded-lg border border-[var(--border-subtle)] opacity-60">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-lg bg-[var(--surface-elevated)] flex items-center justify-center">
                        {integration.type === 'google' && (
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                          </svg>
                        )}
                        {integration.type === 'canvas' && (
                          <span className="text-orange-400 text-lg font-bold">C</span>
                        )}
                        {integration.type === 'outlook' && (
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                            <path d="M24 7.387v10.478c0 .23-.08.424-.238.576a.805.805 0 01-.588.234h-8.479v-6.12l1.036.852c.104.086.229.13.373.13a.562.562 0 00.396-.165l5.63-4.625a.478.478 0 01.336-.13.51.51 0 01.345.13c.104.087.165.208.165.366a.478.478 0 01-.13.336l-5.666 4.66 5.666 4.66a.478.478 0 01.13.336c0 .157-.061.278-.165.365a.51.51 0 01-.345.13.478.478 0 01-.336-.13l-5.63-4.624a.562.562 0 00-.396-.166.544.544 0 00-.373.13l-1.036.853v1.609h8.479c.231 0 .428-.078.588-.234a.782.782 0 00.238-.576V7.387z" fill="#0072C6"/>
                            <path d="M14.695 4.696v14.608H1.565a.78.78 0 01-.576-.234.805.805 0 01-.234-.588V5.518c0-.23.078-.426.234-.588a.78.78 0 01.576-.234h13.13z" fill="#0072C6"/>
                            <ellipse cx="7.826" cy="12" rx="3.913" ry="4.174" fill="white"/>
                          </svg>
                        )}
                      </div>
                      <div>
                        <div className="text-label text-[var(--text-primary)]">{integration.name}</div>
                        <div className="text-label text-[var(--text-muted)]">Not connected</div>
                      </div>
                    </div>
                    <span className="text-label text-[var(--text-muted)] bg-[var(--surface-elevated)] px-2 py-1 rounded">
                      Coming Soon
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-[var(--border-subtle)]">
              <Button
                className="w-full"
                variant="secondary"
                disabled
              >
                <Download className="h-4 w-4 mr-2" />
                Export Calendar
                <span className="ml-2 text-label text-[var(--text-muted)]">(Coming Soon)</span>
              </Button>
            </div>
          </div>
        </HiveModal>

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

        {/* Edit Event Modal */}
        <HiveModal
          open={!!editingEvent}
          onOpenChange={(open) => !open && setEditingEvent(null)}
          size="lg"
        >
          {editingEvent && (
            <EditEventForm
              event={editingEvent}
              onSave={async (updates) => {
                await updateEvent(editingEvent.id, updates);
                toast.success("Event updated", "Your changes have been saved.");
                setEditingEvent(null);
              }}
              onCancel={() => setEditingEvent(null)}
            />
          )}
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
          onEdit={(eventId: string) => {
            const event = events.find(e => e.id === eventId);
            if (event) {
              setEditingEvent(event);
              setSelectedEvent(null);
            }
          }}
          onDelete={async (eventId: string) => {
            await deleteEvent(eventId);
          }}
        />
      </PageContainer>
  );
}
