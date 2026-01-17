import type { Meta, StoryObj } from '@storybook/react';
import { EventCard } from './EventCard';

const meta: Meta<typeof EventCard> = {
  title: 'Design System/Components/Cards/EventCard',
  component: EventCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Event display card with RSVP functionality and status indicators.',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'compact', 'expanded'],
    },
    showRSVP: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof EventCard>;

const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
tomorrow.setHours(19, 0, 0, 0);

const mockEvent = {
  id: '1',
  title: 'Weekly Coding Workshop',
  type: 'meeting' as const,
  startDate: tomorrow,
  location: 'Davis Hall Room 101',
  currentAttendees: 16,
  maxAttendees: 30,
  attendees: [
    { id: '1', name: 'Jane D.' },
    { id: '2', name: 'John S.' },
    { id: '3', name: 'Alice J.' },
    { id: '4', name: 'Bob W.' },
  ],
  organizerName: 'UB Coders',
};

export const Default: Story = {
  args: {
    event: mockEvent,
    onRSVP: (status) => console.log(`RSVP: ${status}`),
  },
};

export const LiveEvent: Story = {
  args: {
    event: {
      ...mockEvent,
      title: 'Hackathon Kickoff',
      startDate: new Date(Date.now() - 1800000), // 30 min ago
      endDate: new Date(Date.now() + 3600000), // 1 hour from now
    },
    onRSVP: (status) => console.log(`RSVP: ${status}`),
  },
};

export const StartingSoon: Story = {
  args: {
    event: {
      ...mockEvent,
      startDate: new Date(Date.now() + 900000), // 15 min from now
    },
    onRSVP: (status) => console.log(`RSVP: ${status}`),
  },
};

export const TodayEvent: Story = {
  args: {
    event: {
      ...mockEvent,
      startDate: new Date(new Date().setHours(19, 0, 0, 0)),
    },
    onRSVP: (status) => console.log(`RSVP: ${status}`),
  },
};

export const PastEvent: Story = {
  args: {
    event: {
      ...mockEvent,
      startDate: new Date(Date.now() - 86400000 * 2), // 2 days ago
      endDate: new Date(Date.now() - 86400000 * 2 + 3600000),
    },
  },
};

export const VirtualEvent: Story = {
  args: {
    event: {
      ...mockEvent,
      type: 'virtual' as const,
      location: undefined,
      virtualLink: 'https://zoom.us/j/123456',
      title: 'Remote Study Session',
    },
    onRSVP: (status) => console.log(`RSVP: ${status}`),
  },
};

export const UserGoing: Story = {
  args: {
    event: {
      ...mockEvent,
      userRSVP: 'going',
    },
    onRSVP: (status) => console.log(`RSVP: ${status}`),
  },
};

export const Compact: Story = {
  args: {
    event: mockEvent,
    variant: 'compact',
  },
};

export const EventList: Story = {
  render: () => {
    const now = new Date();
    return (
      <div className="w-96 space-y-3">
        <EventCard
          event={{
            id: '1',
            title: 'Project Meeting',
            type: 'meeting',
            startDate: new Date(now.getTime() - 1800000),
            endDate: new Date(now.getTime() + 1800000),
            location: 'Room 201',
            currentAttendees: 5,
            attendees: [],
          }}
          variant="compact"
        />
        <EventCard
          event={{
            id: '2',
            title: 'Study Group',
            type: 'meeting',
            startDate: new Date(now.getTime() + 3600000),
            location: 'Library',
            currentAttendees: 8,
            attendees: [],
          }}
          variant="compact"
        />
        <EventCard
          event={{
            id: '3',
            title: 'Game Night',
            type: 'social',
            startDate: tomorrow,
            location: 'Student Center',
            currentAttendees: 23,
            attendees: [],
          }}
          variant="compact"
        />
      </div>
    );
  },
};
