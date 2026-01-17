'use client';

/**
 * DatePicker Component
 * Source: docs/design-system/COMPONENTS.md
 *
 * Date selection component with calendar popup.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * VISUAL DESCRIPTION (for AI reference - no Playwright needed)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * TRIGGER (Input-like button):
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  📅  Select a date                                               ▼     │
 * └─────────────────────────────────────────────────────────────────────────┘
 * - Height: 40px (h-10)
 * - Border: 1px var(--color-border), rounded-xl
 * - Background: var(--color-bg-elevated)
 * - Placeholder text: text-muted
 * - Calendar icon on left, chevron on right
 *
 * TRIGGER (With date selected):
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  📅  January 5, 2026                                              ✕     │
 * └─────────────────────────────────────────────────────────────────────────┘
 * - Selected date in text-primary
 * - Clear button (✕) on right instead of chevron
 *
 * CALENDAR POPUP:
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  ◀  January 2026  ▶                                                     │
 * ├─────────────────────────────────────────────────────────────────────────┤
 * │  Su   Mo   Tu   We   Th   Fr   Sa                                       │
 * ├─────────────────────────────────────────────────────────────────────────┤
 * │       1    2    3    4   [5]   6     <- [5] = selected (gold bg)        │
 * │   7    8    9   10   11   12   13                                       │
 * │  14   15   16   17   18   19   20    <- Current row highlighted         │
 * │  21   22   23   24   25   26   27                                       │
 * │  28   29   30   31                                                      │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * CALENDAR CELL STATES:
 * - Default: text-primary, hover:bg-hover, rounded-lg
 * - Selected: bg-gold (#FFD700), text-black, font-semibold
 * - Today: ring-1 ring-white/30, font-medium
 * - Disabled (outside range): text-muted/50, cursor-not-allowed
 * - Outside month: text-muted/30
 *
 * DATE RANGE MODE:
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │       1    2    3    4   [5]   6     <- Start date                      │
 * │   7    8    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓   13    <- Range highlight (gold/20)       │
 * │  14  [15]  16   17   18   19   20    <- End date                        │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * TIME PICKER (optional):
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  Time: [10] : [30] [AM ▼]                                               │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * SIZE VARIANTS:
 * - sm: h-8, text-xs, compact calendar
 * - default: h-10, text-sm, standard calendar
 * - lg: h-12, text-base, larger cells
 *
 * COLORS:
 * - Selected: Gold (#FFD700) - this IS a selection action
 * - Range highlight: Gold at 20% opacity
 * - Navigation arrows: text-muted, hover:text-primary
 * - Month/Year: text-primary, font-semibold
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

import * as React from 'react';
import * as Popover from '@radix-ui/react-popover';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import { Text } from '../primitives';

const datePickerTriggerVariants = cva(
  'flex items-center gap-2 border border-[var(--color-border)] rounded-xl bg-[var(--color-bg-elevated)] transition-colors hover:border-[var(--color-border-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
  {
    variants: {
      size: {
        sm: 'h-8 px-2 text-xs',
        default: 'h-10 px-3 text-sm',
        lg: 'h-12 px-4 text-base',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
);

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export interface DatePickerProps extends VariantProps<typeof datePickerTriggerVariants> {
  /** Selected date */
  value?: Date;
  /** Date change handler */
  onChange?: (date: Date | undefined) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Minimum selectable date */
  minDate?: Date;
  /** Maximum selectable date */
  maxDate?: Date;
  /** Show time picker */
  showTime?: boolean;
  /** Date format function */
  formatDate?: (date: Date) => string;
  /** Disabled state */
  disabled?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * DatePicker - Date selection with calendar
 */
const DatePicker: React.FC<DatePickerProps> = ({
  size = 'default',
  value,
  onChange,
  placeholder = 'Select a date',
  minDate,
  maxDate,
  showTime = false,
  formatDate,
  disabled = false,
  className,
}) => {
  const [open, setOpen] = React.useState(false);
  const [viewDate, setViewDate] = React.useState(value || new Date());
  const [hours, setHours] = React.useState(value?.getHours() ?? 12);
  const [minutes, setMinutes] = React.useState(value?.getMinutes() ?? 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Format display date
  const displayValue = value
    ? formatDate?.(value) ?? value.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        ...(showTime && { hour: 'numeric', minute: '2-digit' }),
      })
    : null;

  // Get calendar grid
  const getCalendarDays = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startOffset = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const days: (Date | null)[] = [];

    // Previous month padding
    for (let i = 0; i < startOffset; i++) {
      const prevDate = new Date(year, month, -startOffset + i + 1);
      days.push(prevDate);
    }

    // Current month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    // Next month padding
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push(new Date(year, month + 1, i));
    }

    return days;
  };

  // Check if date is selectable
  const isDisabled = (date: Date) => {
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

  // Check if date is selected
  const isSelected = (date: Date) => {
    if (!value) return false;
    return (
      date.getDate() === value.getDate() &&
      date.getMonth() === value.getMonth() &&
      date.getFullYear() === value.getFullYear()
    );
  };

  // Check if date is today
  const isToday = (date: Date) => {
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Check if date is in current view month
  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === viewDate.getMonth();
  };

  // Navigate months
  const prevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  // Select date
  const selectDate = (date: Date) => {
    if (isDisabled(date)) return;

    if (showTime) {
      date.setHours(hours, minutes);
    }

    onChange?.(date);
    if (!showTime) {
      setOpen(false);
    }
  };

  // Clear date
  const clearDate = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.(undefined);
  };

  const calendarDays = getCalendarDays();

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild disabled={disabled}>
        <button
          className={cn(
            datePickerTriggerVariants({ size }),
            disabled && 'opacity-50 cursor-not-allowed',
            className
          )}
        >
          {/* Calendar icon */}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4 text-[var(--color-text-muted)] flex-shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          </svg>

          {/* Value or placeholder */}
          <span className={cn('flex-1 text-left', !displayValue && 'text-[var(--color-text-muted)]')}>
            {displayValue || placeholder}
          </span>

          {/* Clear or chevron */}
          {displayValue ? (
            <button
              onClick={clearDate}
              className="p-0.5 rounded-md hover:bg-white/10 transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5 text-[var(--color-text-muted)]">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-[var(--color-text-muted)]">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          )}
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          className="z-50 p-4 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-2xl shadow-2xl animate-in fade-in-0 zoom-in-95"
          sideOffset={8}
          align="start"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>

            <Text size="sm" weight="semibold">
              {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
            </Text>

            <button
              onClick={nextMonth}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS.map((day) => (
              <div key={day} className="w-8 h-8 flex items-center justify-center">
                <Text size="xs" tone="muted">
                  {day}
                </Text>
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((date, i) => {
              if (!date) return <div key={i} className="w-8 h-8" />;

              const selected = isSelected(date);
              const todayDate = isToday(date);
              const currentMonth = isCurrentMonth(date);
              const dateDisabled = isDisabled(date);

              return (
                <button
                  key={i}
                  onClick={() => selectDate(date)}
                  disabled={dateDisabled}
                  className={cn(
                    'w-8 h-8 flex items-center justify-center rounded-lg text-sm transition-colors',
                    !currentMonth && 'text-[var(--color-text-muted)]/30',
                    currentMonth && !selected && 'hover:bg-white/10',
                    todayDate && !selected && 'ring-1 ring-white/30 font-medium',
                    selected && 'bg-life-gold text-black font-semibold',
                    dateDisabled && 'opacity-30 cursor-not-allowed hover:bg-transparent'
                  )}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          {/* Time picker */}
          {showTime && (
            <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
              <div className="flex items-center gap-2">
                <Text size="sm" tone="muted">
                  Time:
                </Text>
                <select
                  value={hours}
                  onChange={(e) => setHours(Number(e.target.value))}
                  className="bg-[var(--color-bg-hover)] border border-[var(--color-border)] rounded-lg px-2 py-1 text-sm"
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>
                      {i.toString().padStart(2, '0')}
                    </option>
                  ))}
                </select>
                <span>:</span>
                <select
                  value={minutes}
                  onChange={(e) => setMinutes(Number(e.target.value))}
                  className="bg-[var(--color-bg-hover)] border border-[var(--color-border)] rounded-lg px-2 py-1 text-sm"
                >
                  {Array.from({ length: 60 }, (_, i) => (
                    <option key={i} value={i}>
                      {i.toString().padStart(2, '0')}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <Popover.Arrow className="fill-[var(--color-bg-elevated)]" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};

DatePicker.displayName = 'DatePicker';

/**
 * DateRangePicker - Select a date range
 */
export interface DateRangePickerProps extends VariantProps<typeof datePickerTriggerVariants> {
  /** Start date */
  startDate?: Date;
  /** End date */
  endDate?: Date;
  /** Range change handler */
  onChange?: (range: { start?: Date; end?: Date }) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Minimum selectable date */
  minDate?: Date;
  /** Maximum selectable date */
  maxDate?: Date;
  /** Disabled state */
  disabled?: boolean;
  /** Additional className */
  className?: string;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  size = 'default',
  startDate,
  endDate,
  onChange,
  placeholder = 'Select date range',
  minDate,
  maxDate,
  disabled = false,
  className,
}) => {
  const [open, setOpen] = React.useState(false);
  const [viewDate, setViewDate] = React.useState(startDate || new Date());
  const [selecting, setSelecting] = React.useState<'start' | 'end'>('start');

  // Format display value
  const displayValue = startDate
    ? endDate
      ? `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
      : startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null;

  // Get calendar grid
  const getCalendarDays = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startOffset = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const days: Date[] = [];

    for (let i = 0; i < startOffset; i++) {
      days.push(new Date(year, month, -startOffset + i + 1));
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push(new Date(year, month + 1, i));
    }

    return days;
  };

  // Check if date is in range
  const isInRange = (date: Date) => {
    if (!startDate || !endDate) return false;
    return date >= startDate && date <= endDate;
  };

  // Check if date is range boundary
  const isRangeBoundary = (date: Date) => {
    const isStart = startDate && date.getTime() === startDate.getTime();
    const isEnd = endDate && date.getTime() === endDate.getTime();
    return { isStart, isEnd };
  };

  // Select date
  const selectDate = (date: Date) => {
    if (selecting === 'start') {
      onChange?.({ start: date, end: undefined });
      setSelecting('end');
    } else {
      if (startDate && date < startDate) {
        onChange?.({ start: date, end: startDate });
      } else {
        onChange?.({ start: startDate, end: date });
      }
      setSelecting('start');
      setOpen(false);
    }
  };

  const calendarDays = getCalendarDays();

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild disabled={disabled}>
        <button
          className={cn(
            datePickerTriggerVariants({ size }),
            disabled && 'opacity-50 cursor-not-allowed',
            className
          )}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4 text-[var(--color-text-muted)] flex-shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          </svg>
          <span className={cn('flex-1 text-left', !displayValue && 'text-[var(--color-text-muted)]')}>
            {displayValue || placeholder}
          </span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-[var(--color-text-muted)]">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          className="z-50 p-4 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-2xl shadow-2xl animate-in fade-in-0 zoom-in-95"
          sideOffset={8}
          align="start"
        >
          {/* Selection hint */}
          <Text size="xs" tone="muted" className="mb-4">
            {selecting === 'start' ? 'Select start date' : 'Select end date'}
          </Text>

          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            <Text size="sm" weight="semibold">
              {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
            </Text>
            <button
              onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS.map((day) => (
              <div key={day} className="w-8 h-8 flex items-center justify-center">
                <Text size="xs" tone="muted">{day}</Text>
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((date, i) => {
              const inRange = isInRange(date);
              const { isStart, isEnd } = isRangeBoundary(date);
              const currentMonth = date.getMonth() === viewDate.getMonth();

              return (
                <button
                  key={i}
                  onClick={() => selectDate(date)}
                  className={cn(
                    'w-8 h-8 flex items-center justify-center text-sm transition-colors',
                    !currentMonth && 'text-[var(--color-text-muted)]/30',
                    inRange && !isStart && !isEnd && 'bg-life-gold/20',
                    (isStart || isEnd) && 'bg-life-gold text-black font-semibold',
                    isStart && 'rounded-l-lg',
                    isEnd && 'rounded-r-lg',
                    !inRange && !isStart && !isEnd && 'rounded-lg hover:bg-white/10'
                  )}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          <Popover.Arrow className="fill-[var(--color-bg-elevated)]" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};

DateRangePicker.displayName = 'DateRangePicker';

export { DatePicker, DateRangePicker };
