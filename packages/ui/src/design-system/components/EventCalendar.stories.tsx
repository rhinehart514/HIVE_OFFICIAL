import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { EventCalendar, EventCalendarMini, CalendarEvent } from './EventCalendar';
import { Text, Card } from '../primitives';

const today = new Date();
const mockEvents: CalendarEvent[] = [
  {
    id: '1',
    title: 'Team Meeting',
    start: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 0),
    color: 'gold',
  },
  {
    id: '2',
    title: 'Code Review',
    start: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 14, 0),
    color: 'blue',
  },
  {
    id: '3',
    title: 'Workshop',
    start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2, 15, 0),
    color: 'green',
  },
  {
    id: '4',
    title: 'Hackathon',
    start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5),
    allDay: true,
    color: 'purple',
  },
  {
    id: '5',
    title: 'Demo Day',
    start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7, 18, 0),
    color: 'gold',
  },
  {
    id: '6',
    title: 'Study Session',
    start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2, 11, 0),
    color: 'blue',
  },
  {
    id: '7',
    title: 'Office Hours',
    start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2, 16, 0),
    color: 'green',
  },
  {
    id: '8',
    title: 'Guest Speaker',
    start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2, 17, 0),
    color: 'red',
  },
];

const meta: Meta<typeof EventCalendar> = {
  title: 'Design System/Components/Events/EventCalendar',
  component: EventCalendar,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Event display calendar for spaces. Two variants: month (grid), week (horizontal).',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['month', 'week'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof EventCalendar>;

/**
 * Default — Month variant
 */
export const Default: Story = {
  render: () => {
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(today);
    return (
      <div className="w-80">
        <EventCalendar
          events={mockEvents}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          onEventClick={(event) => console.log('Event clicked:', event)}
          variant="month"
        />
      </div>
    );
  },
};

/**
 * Week variant
 */
export const Week: Story = {
  render: () => {
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(today);
    return (
      <div className="w-[600px]">
        <EventCalendar
          events={mockEvents}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          onEventClick={(event) => console.log('Event clicked:', event)}
          variant="week"
        />
      </div>
    );
  },
};

/**
 * With many events
 */
export const ManyEvents: Story = {
  render: () => {
    const manyEvents: CalendarEvent[] = [
      ...mockEvents,
      {
        id: '9',
        title: 'Morning Standup',
        start: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 0),
        color: 'gold',
      },
      {
        id: '10',
        title: 'Lunch & Learn',
        start: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 0),
        color: 'blue',
      },
    ];

    const [selectedDate, setSelectedDate] = useState<Date | undefined>(today);

    return (
      <div className="w-80">
        <EventCalendar
          events={manyEvents}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          onEventClick={(event) => alert(`Event: ${event.title}`)}
          variant="month"
        />
      </div>
    );
  },
};

/**
 * Empty calendar
 */
export const Empty: Story = {
  render: () => {
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(today);
    return (
      <div className="w-80">
        <EventCalendar
          events={[]}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          variant="month"
        />
      </div>
    );
  },
};

/**
 * Mini calendar (date picker)
 */
export const Mini: Story = {
  render: () => {
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(today);
    return (
      <Card className="p-4">
        <EventCalendarMini
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />
        {selectedDate && (
          <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
            <Text size="sm" tone="muted">
              Selected: {selectedDate.toLocaleDateString()}
            </Text>
          </div>
        )}
      </Card>
    );
  },
};

/**
 * Event colors
 */
export const EventColors: Story = {
  render: () => {
    const colorEvents: CalendarEvent[] = [
      { id: '1', title: 'Gold Event', start: today, color: 'gold' },
      { id: '2', title: 'Blue Event', start: new Date(today.getTime() + 86400000), color: 'blue' },
      { id: '3', title: 'Green Event', start: new Date(today.getTime() + 172800000), color: 'green' },
      { id: '4', title: 'Red Event', start: new Date(today.getTime() + 259200000), color: 'red' },
      { id: '5', title: 'Purple Event', start: new Date(today.getTime() + 345600000), color: 'purple' },
    ];

    return (
      <div className="w-[600px]">
        <EventCalendar
          events={colorEvents}
          selectedDate={today}
          onSelectDate={() => {}}
          variant="week"
        />
      </div>
    );
  },
};

/**
 * In context — Space sidebar
 */
export const SpaceSidebarContext: Story = {
  render: () => {
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(today);
    const dayEvents = mockEvents.filter(
      (e) => selectedDate && e.start.toDateString() === selectedDate.toDateString()
    );

    return (
      <Card className="w-72 p-4">
        <Text size="sm" weight="semibold" className="mb-3">
          Upcoming Events
        </Text>
        <EventCalendarMini
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />
        {selectedDate && (
          <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
            <Text size="xs" tone="muted" className="mb-2">
              {selectedDate.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
              })}
            </Text>
            {dayEvents.length > 0 ? (
              <div className="space-y-2">
                {dayEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center gap-2 text-sm"
                  >
                    <div className="w-2 h-2 rounded-full bg-[var(--color-accent-gold)]" />
                    <span>{event.title}</span>
                  </div>
                ))}
              </div>
            ) : (
              <Text size="sm" tone="muted">
                No events
              </Text>
            )}
          </div>
        )}
      </Card>
    );
  },
};

/**
 * All variants comparison
 */
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      <div>
        <Text size="xs" tone="muted" className="mb-3">
          Month
        </Text>
        <div className="w-80">
          <EventCalendar
            events={mockEvents}
            selectedDate={today}
            onSelectDate={() => {}}
            variant="month"
          />
        </div>
      </div>

      <div>
        <Text size="xs" tone="muted" className="mb-3">
          Week
        </Text>
        <div className="w-[600px]">
          <EventCalendar
            events={mockEvents}
            selectedDate={today}
            onSelectDate={() => {}}
            variant="week"
          />
        </div>
      </div>

      <div>
        <Text size="xs" tone="muted" className="mb-3">
          Mini (date picker)
        </Text>
        <Card className="w-fit p-3">
          <EventCalendarMini selectedDate={today} onSelectDate={() => {}} />
        </Card>
      </div>
    </div>
  ),
};
