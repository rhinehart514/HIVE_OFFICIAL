"use client";

/**
 * Profile Calendar Page
 *
 * Shows the user's personal calendar combined with space events.
 * Uses the centralized /api/calendar endpoint which merges:
 * - Personal events (from personalEvents collection)
 * - Space events (from spaces the user is a member of)
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Badge, Input, Textarea } from '@hive/ui';
import { useAuth } from '@hive/auth-logic';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';
import {
  CalendarIcon,
  PlusIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MapPinIcon,
  ClockIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

// ============================================
// Types
// ============================================

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  location?: string;
  isAllDay?: boolean;
  type: 'personal' | 'space';
  source?: string;
  spaceId?: string;
  spaceName?: string;
  canEdit: boolean;
  eventType?: string;
  organizerName?: string;
}

interface TimeBlock {
  hour: number;
  events: CalendarEvent[];
  isFreeTime: boolean;
}

// ============================================
// Helpers
// ============================================

const getEventColor = (event: CalendarEvent) => {
  if (event.type === 'space') {
    return 'bg-blue-500/80';
  }
  switch (event.eventType) {
    case 'class': return 'bg-green-500/80';
    case 'study': return 'bg-emerald-500/80';
    case 'assignment': return 'bg-yellow-500/80';
    case 'meeting': return 'bg-purple-500/80';
    default: return 'bg-white/50';
  }
};

const formatTimeLabel = (hour: number) => {
  if (hour === 0) return '12 AM';
  if (hour === 12) return '12 PM';
  return hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
};

// ============================================
// Component
// ============================================

export default function ProfileCalendarPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  // State
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // New event form state
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    location: '',
    eventType: 'personal',
    isAllDay: false,
  });

  // Fetch calendar events from API
  const fetchEvents = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/calendar', {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch calendar: ${response.status}`);
      }

      const data = await response.json();
      setEvents(data.events || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load calendar';
      logger.error('Failed to fetch calendar events', { component: 'ProfileCalendarPage' }, err instanceof Error ? err : undefined);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load events on mount
  useEffect(() => {
    if (user) {
      fetchEvents();
    }
  }, [user, fetchEvents]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/enter?redirect=/profile/calendar');
    }
  }, [user, authLoading, router]);

  // Create new event via API
  const createEvent = async () => {
    if (!user || !newEvent.title || !newEvent.startDate || !newEvent.endDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);

    try {
      const response = await fetch('/api/calendar', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newEvent.title,
          description: newEvent.description,
          startDate: new Date(newEvent.startDate).toISOString(),
          endDate: new Date(newEvent.endDate).toISOString(),
          location: newEvent.location,
          isAllDay: newEvent.isAllDay,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create event');
      }

      toast.success('Event created');
      setShowAddEvent(false);
      setNewEvent({
        title: '',
        description: '',
        startDate: '',
        endDate: '',
        location: '',
        eventType: 'personal',
        isAllDay: false,
      });
      fetchEvents();
    } catch (err) {
      logger.error('Failed to create event', { component: 'ProfileCalendarPage' }, err instanceof Error ? err : undefined);
      toast.error(err instanceof Error ? err.message : 'Failed to create event');
    } finally {
      setSaving(false);
    }
  };

  // Get events for a specific day
  const getEventsForDay = useCallback((date: Date): CalendarEvent[] => {
    return events.filter(event => {
      const eventDate = new Date(event.startDate);
      return eventDate.toDateString() === date.toDateString();
    });
  }, [events]);

  // Get time blocks for week view
  const getTimeBlocks = useCallback((date: Date): TimeBlock[] => {
    const dayEvents = getEventsForDay(date);
    const blocks: TimeBlock[] = [];

    for (let hour = 8; hour < 22; hour++) {
      const hourEvents = dayEvents.filter(event => {
        const eventHour = new Date(event.startDate).getHours();
        return eventHour === hour;
      });

      blocks.push({
        hour,
        events: hourEvents,
        isFreeTime: hourEvents.length === 0,
      });
    }

    return blocks;
  }, [getEventsForDay]);

  // Get week dates
  const weekDates = useMemo(() => {
    const dates: Date[] = [];
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(date.getDate() + i);
      dates.push(date);
    }

    return dates;
  }, [currentDate]);

  // Navigate dates
  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    } else {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    }
    setCurrentDate(newDate);
  };

  // Free time analysis
  const freeTimeByDay = useMemo(() => {
    return weekDates.map(date => ({
      date,
      freeBlocks: getTimeBlocks(date).filter(b => b.isFreeTime),
    })).filter(d => d.freeBlocks.length > 0);
  }, [weekDates, getTimeBlocks]);

  // Stats
  const stats = useMemo(() => {
    const personal = events.filter(e => e.type === 'personal').length;
    const space = events.filter(e => e.type === 'space').length;
    return { personal, space, total: events.length };
  }, [events]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-ground)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-white/[0.06] border-t-white/50 rounded-full  mx-auto mb-4" />
          <p className="text-[var(--text-secondary)]">Loading calendar...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--bg-ground)] flex items-center justify-center p-8">
        <Card className="max-w-md p-8 bg-[var(--bg-surface)] border-[var(--border-subtle)] text-center">
          <CalendarIcon className="w-12 h-12 text-[var(--text-tertiary)] mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">Couldn't load calendar</h2>
          <p className="text-[var(--text-secondary)] mb-6">{error}</p>
          <Button onClick={fetchEvents}>Try Again</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-ground)] text-[var(--text-primary)] p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Calendar</h1>
            <p className="text-[var(--text-secondary)]">
              {stats.total === 0
                ? 'No events scheduled'
                : `${stats.personal} personal, ${stats.space} space events`
              }
            </p>
          </div>
          <Button
            onClick={() => setShowAddEvent(!showAddEvent)}
            className="bg-[var(--life-gold)] text-[var(--bg-ground)] hover:bg-[var(--life-gold)]/90"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Add Event
          </Button>
        </div>

        {/* Add Event Form */}
        {showAddEvent && (
          <Card className="mb-6 p-6 bg-[var(--bg-surface)] border-[var(--border-subtle)]">
            <h3 className="text-lg font-semibold mb-4">Add New Event</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                placeholder="Event title *"
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                className="bg-[var(--bg-muted)] border-[var(--border-subtle)]"
              />
              <select
                value={newEvent.eventType}
                onChange={(e) => setNewEvent({ ...newEvent, eventType: e.target.value })}
                className="px-3 py-2 bg-[var(--bg-muted)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-primary)]"
              >
                <option value="personal">Personal</option>
                <option value="class">Class</option>
                <option value="study">Study</option>
                <option value="meeting">Meeting</option>
                <option value="assignment">Assignment</option>
              </select>
              <div>
                <label className="block text-sm text-[var(--text-tertiary)] mb-1">Start *</label>
                <Input
                  type="datetime-local"
                  value={newEvent.startDate}
                  onChange={(e) => setNewEvent({ ...newEvent, startDate: e.target.value })}
                  className="bg-[var(--bg-muted)] border-[var(--border-subtle)]"
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--text-tertiary)] mb-1">End *</label>
                <Input
                  type="datetime-local"
                  value={newEvent.endDate}
                  onChange={(e) => setNewEvent({ ...newEvent, endDate: e.target.value })}
                  className="bg-[var(--bg-muted)] border-[var(--border-subtle)]"
                />
              </div>
              <Input
                placeholder="Location (optional)"
                value={newEvent.location}
                onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                className="bg-[var(--bg-muted)] border-[var(--border-subtle)]"
              />
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="allDay"
                  checked={newEvent.isAllDay}
                  onChange={(e) => setNewEvent({ ...newEvent, isAllDay: e.target.checked })}
                  className="rounded border-[var(--border-subtle)]"
                />
                <label htmlFor="allDay" className="text-sm text-[var(--text-secondary)]">All day event</label>
              </div>
            </div>
            <Textarea
              placeholder="Description (optional)"
              value={newEvent.description}
              onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
              className="mt-4 bg-[var(--bg-muted)] border-[var(--border-subtle)]"
              rows={3}
            />
            <div className="flex gap-2 mt-4">
              <Button
                onClick={createEvent}
                disabled={saving || !newEvent.title || !newEvent.startDate || !newEvent.endDate}
                className="bg-[var(--life-gold)] text-[var(--bg-ground)] hover:bg-[var(--life-gold)]/90 disabled:opacity-50"
              >
                {saving ? 'Creating...' : 'Create Event'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowAddEvent(false)}
                className="border-[var(--border-subtle)]"
              >
                Cancel
              </Button>
            </div>
          </Card>
        )}

        {/* Calendar Navigation */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => navigateDate('prev')}
              className="border-[var(--border-subtle)]"
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              onClick={() => setCurrentDate(new Date())}
              className="border-[var(--border-subtle)]"
            >
              Today
            </Button>
            <Button
              variant="outline"
              onClick={() => navigateDate('next')}
              className="border-[var(--border-subtle)]"
            >
              <ChevronRightIcon className="w-4 h-4" />
            </Button>
          </div>

          <h2 className="text-xl font-semibold text-center">
            {currentDate.toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric',
              ...(viewMode === 'day' && { day: 'numeric' })
            })}
          </h2>

          <div className="flex gap-2 justify-center sm:justify-end">
            {(['day', 'week', 'month'] as const).map((mode) => (
              <Button
                key={mode}
                variant={viewMode === mode ? 'default' : 'outline'}
                onClick={() => setViewMode(mode)}
                className={viewMode === mode
                  ? 'bg-[var(--life-gold)] text-[var(--bg-ground)]'
                  : 'border-[var(--border-subtle)]'
                }
                size="sm"
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* Week View */}
        {viewMode === 'week' && (
          <div className="grid grid-cols-8 gap-2 overflow-x-auto">
            {/* Time column */}
            <div className="space-y-2">
              <div className="h-12" />
              {Array.from({ length: 14 }, (_, i) => i + 8).map(hour => (
                <div key={hour} className="h-20 text-xs text-[var(--text-tertiary)] text-right pr-2 pt-1">
                  {formatTimeLabel(hour)}
                </div>
              ))}
            </div>

            {/* Days */}
            {weekDates.map((date, i) => {
              const isToday = date.toDateString() === new Date().toDateString();
              const dayEvents = getEventsForDay(date);

              return (
                <div key={i} className="space-y-2 min-w-[100px]">
                  <div className="h-12 text-center">
                    <div className="text-xs text-[var(--text-tertiary)]">
                      {date.toLocaleDateString('en-US', { weekday: 'short' })}
                    </div>
                    <div className={`text-lg font-semibold ${isToday ? 'text-[var(--life-gold)]' : ''}`}>
                      {date.getDate()}
                    </div>
                    {dayEvents.length > 0 && (
                      <div className="flex justify-center gap-0.5 mt-0.5">
                        {dayEvents.slice(0, 3).map((e, j) => (
                          <div key={j} className={`w-1.5 h-1.5 rounded-full ${getEventColor(e)}`} />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Hour blocks */}
                  {getTimeBlocks(date).map((block) => (
                    <div
                      key={block.hour}
                      className={`h-20border-[var(--border-subtle)] rounded-lg p-1 ${
                        block.isFreeTime ? 'bg-[var(--bg-muted)]/30' : 'bg-[var(--bg-surface)]'
                      }`}
                    >
                      {block.events.map((event) => (
                        <div
                          key={event.id}
                          className={`${getEventColor(event)} text-xs p-1.5 rounded mb-1 cursor-pointer hover:opacity-80 transition-opacity`}
                          onClick={() => {
                            if (event.type === 'space' && event.spaceId) {
                              router.push(`/spaces/${event.spaceId}`);
                            }
                          }}
                        >
                          <div className="font-medium truncate text-white">{event.title}</div>
                          {event.type === 'space' && event.spaceName && (
                            <div className="text-white/50 truncate flex items-center gap-1">
                              <UserGroupIcon className="w-3 h-3" />
                              {event.spaceName}
                            </div>
                          )}
                          {event.location && (
                            <div className="text-white/50 truncate flex items-center gap-1">
                              <MapPinIcon className="w-3 h-3" />
                              {event.location}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}

        {/* Day View */}
        {viewMode === 'day' && (
          <div className="space-y-2">
            {getTimeBlocks(currentDate).map((block) => (
              <div
                key={block.hour}
                className={`flex gap-4 p-3 rounded-lg${
                  block.isFreeTime
                    ? 'border-[var(--border-subtle)] bg-[var(--bg-muted)]/30'
                    : 'border-[var(--border-default)] bg-[var(--bg-surface)]'
                }`}
              >
                <div className="w-16 text-sm text-[var(--text-tertiary)] pt-1">
                  {formatTimeLabel(block.hour)}
                </div>
                <div className="flex-1 min-h-[60px]">
                  {block.events.length === 0 ? (
                    <div className="text-xs text-[var(--text-muted)] pt-1">Free</div>
                  ) : (
                    <div className="space-y-2">
                      {block.events.map((event) => (
                        <div
                          key={event.id}
                          className={`${getEventColor(event)} p-3 rounded-lg cursor-pointer hover:opacity-90 transition-opacity`}
                          onClick={() => {
                            if (event.type === 'space' && event.spaceId) {
                              router.push(`/spaces/${event.spaceId}`);
                            }
                          }}
                        >
                          <div className="font-medium text-white">{event.title}</div>
                          <div className="flex items-center gap-4 mt-1 text-sm text-white/50">
                            {event.type === 'space' && event.spaceName && (
                              <span className="flex items-center gap-1">
                                <UserGroupIcon className="w-4 h-4" />
                                {event.spaceName}
                              </span>
                            )}
                            {event.location && (
                              <span className="flex items-center gap-1">
                                <MapPinIcon className="w-4 h-4" />
                                {event.location}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <ClockIcon className="w-4 h-4" />
                              {new Date(event.startDate).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit'
                              })} - {new Date(event.endDate).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Month View - Simple list */}
        {viewMode === 'month' && (
          <div className="space-y-4">
            {events.length === 0 ? (
              <Card className="p-12 bg-[var(--bg-surface)] border-[var(--border-subtle)] text-center">
                <CalendarIcon className="w-12 h-12 text-[var(--text-tertiary)] mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">No events this month</h3>
                <p className="text-[var(--text-secondary)] mb-6">Create a personal event or join space events</p>
                <Button
                  onClick={() => setShowAddEvent(true)}
                  className="bg-[var(--life-gold)] text-[var(--bg-ground)]"
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Add Event
                </Button>
              </Card>
            ) : (
              events.map((event) => (
                <Card
                  key={event.id}
                  className="p-4 bg-[var(--bg-surface)] border-[var(--border-subtle)] hover:border-[var(--border-default)] transition-colors cursor-pointer"
                  onClick={() => {
                    if (event.type === 'space' && event.spaceId) {
                      router.push(`/spaces/${event.spaceId}`);
                    }
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-2 h-2 rounded-full ${getEventColor(event)}`} />
                        <h3 className="font-medium text-[var(--text-primary)]">{event.title}</h3>
                        {event.type === 'space' && (
                          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                            Space
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--text-secondary)]">
                        <span className="flex items-center gap-1">
                          <CalendarIcon className="w-4 h-4" />
                          {new Date(event.startDate).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                        <span className="flex items-center gap-1">
                          <ClockIcon className="w-4 h-4" />
                          {new Date(event.startDate).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </span>
                        {event.location && (
                          <span className="flex items-center gap-1">
                            <MapPinIcon className="w-4 h-4" />
                            {event.location}
                          </span>
                        )}
                        {event.spaceName && (
                          <span className="flex items-center gap-1">
                            <UserGroupIcon className="w-4 h-4" />
                            {event.spaceName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Free Time Finder */}
        {viewMode === 'week' && freeTimeByDay.length > 0 && (
          <Card className="mt-8 p-6 bg-[var(--bg-surface)] border-[var(--border-subtle)]">
            <h3 className="text-lg font-semibold mb-4">Free Time This Week</h3>
            <div className="space-y-3">
              {freeTimeByDay.map(({ date, freeBlocks }) => (
                <div key={date.toISOString()} className="flex items-center gap-4">
                  <div className="w-32 text-sm text-[var(--text-secondary)]">
                    {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {freeBlocks.slice(0, 4).map((block) => (
                      <Badge
                        key={block.hour}
                        className="bg-green-500/20 text-green-400 border-green-500/30"
                      >
                        {formatTimeLabel(block.hour)}
                      </Badge>
                    ))}
                    {freeBlocks.length > 4 && (
                      <Badge className="bg-[var(--bg-muted)] text-[var(--text-tertiary)]">
                        +{freeBlocks.length - 4} more
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
