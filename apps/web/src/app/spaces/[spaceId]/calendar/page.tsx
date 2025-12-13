'use client';

import * as React from 'react';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@hive/ui';
import { ChevronLeft, ChevronRight, Calendar, Loader2 } from 'lucide-react';
import { secureApiFetch } from '@/lib/secure-auth-utils';
import { logger } from '@/lib/logger';

interface SpaceEvent {
  id: string;
  title: string;
  description: string;
  type: 'academic' | 'social' | 'recreational' | 'cultural' | 'meeting' | 'virtual';
  startDate: string;
  endDate: string;
  location?: string;
  virtualLink?: string;
  organizer?: {
    id: string;
    fullName: string;
    handle: string;
    photoURL?: string;
  };
  currentAttendees: number;
  userRSVP?: 'going' | 'maybe' | 'not_going' | null;
}

const EVENT_TYPE_COLORS: Record<SpaceEvent['type'], string> = {
  academic: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  social: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  recreational: 'bg-green-500/15 text-green-400 border-green-500/30',
  cultural: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  meeting: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  virtual: 'bg-pink-500/15 text-pink-400 border-pink-500/30',
};

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function buildMonthGrid(date: Date): Date[] {
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  const start = new Date(first);
  start.setDate(first.getDate() - ((first.getDay() + 6) % 7)); // Monday-start grid
  const cells: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    cells.push(d);
  }
  return cells;
}

function getMonthName(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export default function SpaceCalendarPage() {
  const params = useParams();
  const router = useRouter();
  const spaceId = params.spaceId as string;

  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [events, setEvents] = useState<SpaceEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const today = useMemo(() => new Date(), []);
  const days = useMemo(() => buildMonthGrid(currentMonth), [currentMonth]);

  // Group events by date
  const eventsByDate = useMemo(() => {
    const map: Record<string, SpaceEvent[]> = {};
    events.forEach((event) => {
      const key = dayKey(new Date(event.startDate));
      if (!map[key]) {
        map[key] = [];
      }
      map[key].push(event);
    });
    return map;
  }, [events]);

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch both upcoming and past events to show full calendar
      const response = await secureApiFetch(
        `/api/spaces/${spaceId}/events?limit=100&upcoming=true`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }

      const data = await response.json();
      setEvents(data.events || []);
    } catch (err) {
      logger.error('Failed to fetch calendar events', {
        component: 'SpaceCalendarPage',
        spaceId,
        error: err instanceof Error ? err.message : String(err),
      });
      setError('Failed to load events');
    } finally {
      setIsLoading(false);
    }
  }, [spaceId]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const goToPreviousMonth = () => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() - 1);
      return newDate;
    });
  };

  const goToNextMonth = () => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + 1);
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  const handleEventClick = (eventId: string) => {
    router.push(`/spaces/${spaceId}/events/${eventId}`);
  };

  if (isLoading) {
    return (
      <main className="mx-auto w-full max-w-5xl p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto w-full max-w-5xl p-6">
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchEvents}>Try again</Button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl p-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Calendar</h1>
          <p className="text-muted-foreground text-sm">
            {events.length} upcoming event{events.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
          <Button variant="ghost" size="icon" onClick={goToPreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[160px] text-center font-medium">
            {getMonthName(currentMonth)}
          </span>
          <Button variant="ghost" size="icon" onClick={goToNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <section className="overflow-hidden rounded-xl border border-[color:var(--hive-border-subtle)]">
        {/* Day headers */}
        <div className="grid grid-cols-7 bg-[color:var(--hive-background-tertiary)] text-xs text-muted-foreground">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
            <div key={d} className="px-3 py-2 font-medium">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {days.map((d) => {
            const key = dayKey(d);
            const inMonth = d.getMonth() === currentMonth.getMonth();
            const isToday = key === dayKey(today);
            const dayEvents = eventsByDate[key] || [];

            return (
              <div
                key={key}
                className={
                  'min-h-[100px] border-b border-r border-[color:var(--hive-border-subtle)] p-2 text-sm transition-colors ' +
                  (!inMonth ? 'opacity-40 bg-muted/30' : 'hover:bg-muted/20')
                }
              >
                {/* Date number */}
                <div
                  className={
                    'mb-1 inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ' +
                    (isToday
                      ? 'bg-[color:var(--hive-brand-primary)] text-[var(--hive-text-inverse)]'
                      : 'text-muted-foreground')
                  }
                >
                  {d.getDate()}
                </div>

                {/* Events for this day */}
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map((event) => (
                    <button
                      key={event.id}
                      onClick={() => handleEventClick(event.id)}
                      className={
                        'w-full truncate rounded-md border px-2 py-1 text-left text-xs transition-opacity hover:opacity-80 ' +
                        EVENT_TYPE_COLORS[event.type]
                      }
                    >
                      <span className="font-medium">{formatTime(event.startDate)}</span>
                      <span className="mx-1">·</span>
                      <span>{event.title}</span>
                    </button>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-muted-foreground px-2">
                      +{dayEvents.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-3 text-xs">
        {Object.entries(EVENT_TYPE_COLORS).map(([type, colors]) => (
          <div key={type} className="flex items-center gap-1.5">
            <div className={`h-3 w-3 rounded ${colors.split(' ')[0]}`} />
            <span className="capitalize text-muted-foreground">{type}</span>
          </div>
        ))}
      </div>
    </main>
  );
}
