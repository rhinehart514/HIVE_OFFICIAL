'use client';

/**
 * EventCalendar Component
 * Source: docs/design-system/COMPONENTS.md
 *
 * P2 Blocker - Event display calendar for spaces.
 * Two variants: month (grid), week (horizontal).
 */

import * as React from 'react';
import { cn } from '../../lib/utils';
import { Text, Button, Card } from '../primitives';

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end?: Date;
  allDay?: boolean;
  color?: 'gold' | 'blue' | 'green' | 'red' | 'purple';
}

export interface EventCalendarProps {
  /** List of events */
  events: CalendarEvent[];
  /** Currently selected date */
  selectedDate?: Date;
  /** Callback when date is selected */
  onSelectDate?: (date: Date) => void;
  /** Callback when event is clicked */
  onEventClick?: (event: CalendarEvent) => void;
  /** Variant type */
  variant?: 'month' | 'week';
  /** Today's date override (for testing) */
  today?: Date;
  /** Additional className */
  className?: string;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const eventColors: Record<string, string> = {
  gold: 'bg-[var(--color-accent-gold)] text-black',
  blue: 'bg-blue-500 text-white',
  green: 'bg-green-500 text-white',
  red: 'bg-red-500 text-white',
  purple: 'bg-purple-500 text-white',
};

/**
 * Get days in a month
 */
const getDaysInMonth = (year: number, month: number): Date[] => {
  const days: Date[] = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // Add padding days from previous month
  const startPadding = firstDay.getDay();
  for (let i = startPadding - 1; i >= 0; i--) {
    days.push(new Date(year, month, -i));
  }

  // Add days of current month
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push(new Date(year, month, i));
  }

  // Add padding days from next month
  const endPadding = 6 - lastDay.getDay();
  for (let i = 1; i <= endPadding; i++) {
    days.push(new Date(year, month + 1, i));
  }

  return days;
};

/**
 * Get week days around a date
 */
const getWeekDays = (date: Date): Date[] => {
  const days: Date[] = [];
  const dayOfWeek = date.getDay();
  const sunday = new Date(date);
  sunday.setDate(date.getDate() - dayOfWeek);

  for (let i = 0; i < 7; i++) {
    const day = new Date(sunday);
    day.setDate(sunday.getDate() + i);
    days.push(day);
  }

  return days;
};

/**
 * Check if two dates are the same day
 */
const isSameDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

/**
 * EventCalendar - Month variant
 */
const EventCalendarMonth: React.FC<EventCalendarProps> = ({
  events,
  selectedDate,
  onSelectDate,
  onEventClick,
  today = new Date(),
  className,
}) => {
  const [viewDate, setViewDate] = React.useState(selectedDate || today);
  const days = getDaysInMonth(viewDate.getFullYear(), viewDate.getMonth());

  const goToPrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const getEventsForDay = (date: Date) =>
    events.filter((e) => isSameDay(e.start, date));

  return (
    <Card className={cn('p-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="icon" onClick={goToPrevMonth}>
          <ChevronLeftIcon />
        </Button>
        <Text weight="semibold">
          {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
        </Text>
        <Button variant="ghost" size="icon" onClick={goToNextMonth}>
          <ChevronRightIcon />
        </Button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAYS.map((day) => (
          <div key={day} className="text-center py-2">
            <Text size="xs" tone="muted" weight="medium">
              {day}
            </Text>
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((date, index) => {
          const isCurrentMonth = date.getMonth() === viewDate.getMonth();
          const isToday = isSameDay(date, today);
          const isSelected = selectedDate && isSameDay(date, selectedDate);
          const dayEvents = getEventsForDay(date);

          return (
            <button
              key={index}
              type="button"
              onClick={() => onSelectDate?.(date)}
              className={cn(
                'aspect-square p-1 rounded-lg',
                'flex flex-col items-center justify-start gap-0.5',
                'transition-colors duration-[var(--duration-snap)]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
                isCurrentMonth
                  ? 'hover:bg-[var(--color-bg-hover)]'
                  : 'text-[var(--color-text-muted)]',
                isToday && 'ring-1 ring-[var(--color-accent-gold)]',
                isSelected && 'bg-[var(--color-accent-gold)]/20'
              )}
            >
              <Text
                size="sm"
                weight={isToday ? 'semibold' : undefined}
                className={cn(
                  isToday && 'text-[var(--color-accent-gold)]'
                )}
              >
                {date.getDate()}
              </Text>

              {/* Event dots */}
              {dayEvents.length > 0 && (
                <div className="flex gap-0.5">
                  {dayEvents.slice(0, 3).map((event) => (
                    <div
                      key={event.id}
                      className={cn(
                        'w-1.5 h-1.5 rounded-full',
                        eventColors[event.color || 'gold'].split(' ')[0]
                      )}
                    />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Events for selected date */}
      {selectedDate && (
        <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
          <Text size="sm" weight="medium" className="mb-2">
            {selectedDate.toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
          <div className="space-y-2">
            {getEventsForDay(selectedDate).map((event) => (
              <button
                key={event.id}
                type="button"
                onClick={() => onEventClick?.(event)}
                className={cn(
                  'w-full text-left px-3 py-2 rounded-lg',
                  'transition-opacity hover:opacity-80',
                  eventColors[event.color || 'gold']
                )}
              >
                <Text size="sm" weight="medium">
                  {event.title}
                </Text>
                {!event.allDay && (
                  <Text size="xs" className="opacity-80">
                    {event.start.toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </Text>
                )}
              </button>
            ))}
            {getEventsForDay(selectedDate).length === 0 && (
              <Text size="sm" tone="muted">
                No events
              </Text>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};

/**
 * EventCalendar - Week variant
 */
const EventCalendarWeek: React.FC<EventCalendarProps> = ({
  events,
  selectedDate,
  onSelectDate,
  onEventClick,
  today = new Date(),
  className,
}) => {
  const [viewDate, setViewDate] = React.useState(selectedDate || today);
  const days = getWeekDays(viewDate);

  const goToPrevWeek = () => {
    const newDate = new Date(viewDate);
    newDate.setDate(viewDate.getDate() - 7);
    setViewDate(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(viewDate);
    newDate.setDate(viewDate.getDate() + 7);
    setViewDate(newDate);
  };

  const getEventsForDay = (date: Date) =>
    events.filter((e) => isSameDay(e.start, date));

  return (
    <Card className={cn('p-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="icon" onClick={goToPrevWeek}>
          <ChevronLeftIcon />
        </Button>
        <Text weight="semibold">
          {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
        </Text>
        <Button variant="ghost" size="icon" onClick={goToNextWeek}>
          <ChevronRightIcon />
        </Button>
      </div>

      {/* Days row */}
      <div className="grid grid-cols-7 gap-2">
        {days.map((date, index) => {
          const isToday = isSameDay(date, today);
          const isSelected = selectedDate && isSameDay(date, selectedDate);
          const dayEvents = getEventsForDay(date);

          return (
            <button
              key={index}
              type="button"
              onClick={() => onSelectDate?.(date)}
              className={cn(
                'flex flex-col rounded-xl p-2 min-h-[120px]',
                'transition-all duration-[var(--duration-snap)]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
                'hover:bg-[var(--color-bg-hover)]',
                isToday && 'ring-1 ring-[var(--color-accent-gold)]',
                isSelected && 'bg-[var(--color-accent-gold)]/10'
              )}
            >
              <div className="text-center mb-2">
                <Text size="xs" tone="muted">
                  {DAYS[date.getDay()]}
                </Text>
                <Text
                  size="lg"
                  weight={isToday ? 'semibold' : 'medium'}
                  className={cn(isToday && 'text-[var(--color-accent-gold)]')}
                >
                  {date.getDate()}
                </Text>
              </div>

              {/* Events */}
              <div className="flex-1 space-y-1 overflow-hidden">
                {dayEvents.slice(0, 3).map((event) => (
                  <div
                    key={event.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick?.(event);
                    }}
                    className={cn(
                      'px-1.5 py-0.5 rounded text-left truncate',
                      'text-xs cursor-pointer hover:opacity-80',
                      eventColors[event.color || 'gold']
                    )}
                  >
                    {event.title}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <Text size="xs" tone="muted" className="text-center">
                    +{dayEvents.length - 3} more
                  </Text>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </Card>
  );
};

/**
 * EventCalendar - Main component
 */
const EventCalendar: React.FC<EventCalendarProps> = ({
  variant = 'month',
  ...props
}) => {
  if (variant === 'week') {
    return <EventCalendarWeek {...props} />;
  }
  return <EventCalendarMonth {...props} />;
};

EventCalendar.displayName = 'EventCalendar';

/**
 * Simple chevron icons
 */
const ChevronLeftIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={cn('w-5 h-5', className)}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
);

const ChevronRightIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={cn('w-5 h-5', className)}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
);

/**
 * EventCalendarMini - Compact date picker
 */
export interface EventCalendarMiniProps {
  selectedDate?: Date;
  onSelectDate?: (date: Date) => void;
  today?: Date;
  className?: string;
}

const EventCalendarMini: React.FC<EventCalendarMiniProps> = ({
  selectedDate,
  onSelectDate,
  today = new Date(),
  className,
}) => {
  const [viewDate, setViewDate] = React.useState(selectedDate || today);
  const days = getDaysInMonth(viewDate.getFullYear(), viewDate.getMonth());

  return (
    <div className={cn('w-64', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <button
          type="button"
          onClick={() =>
            setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))
          }
          className="p-1 hover:bg-[var(--color-bg-hover)] rounded"
        >
          <ChevronLeftIcon className="w-4 h-4" />
        </button>
        <Text size="sm" weight="medium">
          {MONTHS[viewDate.getMonth()].slice(0, 3)} {viewDate.getFullYear()}
        </Text>
        <button
          type="button"
          onClick={() =>
            setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))
          }
          className="p-1 hover:bg-[var(--color-bg-hover)] rounded"
        >
          <ChevronRightIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {DAYS.map((day) => (
          <div key={day} className="text-center py-1">
            <Text size="xs" tone="muted">
              {day.charAt(0)}
            </Text>
          </div>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7 gap-0.5">
        {days.map((date, index) => {
          const isCurrentMonth = date.getMonth() === viewDate.getMonth();
          const isToday = isSameDay(date, today);
          const isSelected = selectedDate && isSameDay(date, selectedDate);

          return (
            <button
              key={index}
              type="button"
              onClick={() => onSelectDate?.(date)}
              className={cn(
                'w-8 h-8 rounded flex items-center justify-center',
                'text-sm transition-colors duration-[var(--duration-snap)]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
                !isCurrentMonth && 'text-[var(--color-text-muted)]',
                isCurrentMonth && 'hover:bg-[var(--color-bg-hover)]',
                isToday && 'ring-1 ring-[var(--color-accent-gold)] text-[var(--color-accent-gold)]',
                isSelected && 'bg-[var(--color-accent-gold)] text-black'
              )}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
};

EventCalendarMini.displayName = 'EventCalendarMini';

export { EventCalendar, EventCalendarMini };
