'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { AttendeeList, AttendeeStack, type Attendee, type RSVPStatus } from './AttendeeList';

const meta: Meta<typeof AttendeeList> = {
  title: 'Design System/Components/AttendeeList',
  component: AttendeeList,
  parameters: {
    layout: 'padded',
    backgrounds: { default: 'dark' },
  },
  decorators: [
    (Story) => (
      <div className="p-8 bg-[#0A0A0A] min-h-[600px]">
        <div className="max-w-md">
          <Story />
        </div>
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof AttendeeList>;

// Sample attendees data
const sampleAttendees: Attendee[] = [
  { id: '1', name: 'Jane Doe', handle: 'janedoe', status: 'going' },
  { id: '2', name: 'John Smith', handle: 'johnsmith', status: 'going' },
  { id: '3', name: 'Alex Chen', handle: 'alexc', status: 'going' },
  { id: '4', name: 'Sarah Wilson', handle: 'sarahw', status: 'going' },
  { id: '5', name: 'Mike Johnson', handle: 'mikej', status: 'maybe' },
  { id: '6', name: 'Emily Brown', handle: 'emilyb', status: 'maybe' },
  { id: '7', name: 'David Lee', handle: 'davidl', status: 'maybe' },
  { id: '8', name: 'Lisa Garcia', handle: 'lisag', status: 'not_going' },
  { id: '9', name: 'Tom Anderson', handle: 'toma', status: 'not_going' },
];

/**
 * Full attendee list with status grouping
 */
export const Default: Story = {
  args: {
    attendees: sampleAttendees,
    groupByStatus: true,
    showSearch: true,
  },
};

/**
 * Without status grouping
 */
export const NoGrouping: Story = {
  args: {
    attendees: sampleAttendees,
    groupByStatus: false,
  },
};

/**
 * Compact variant
 */
export const Compact: Story = {
  args: {
    variant: 'compact',
    attendees: sampleAttendees,
  },
};

/**
 * Stack variant (avatar row)
 */
export const Stack: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <p className="text-xs text-[#818187] mb-2">All attendees</p>
        <AttendeeStack attendees={sampleAttendees} maxVisible={5} />
      </div>
      <div>
        <p className="text-xs text-[#818187] mb-2">Only "going" attendees</p>
        <AttendeeStack
          attendees={sampleAttendees.filter((a) => a.status === 'going')}
          maxVisible={5}
        />
      </div>
      <div>
        <p className="text-xs text-[#818187] mb-2">3 visible max</p>
        <AttendeeStack attendees={sampleAttendees} maxVisible={3} />
      </div>
    </div>
  ),
};

/**
 * Loading state
 */
export const Loading: Story = {
  args: {
    attendees: [],
    loading: true,
  },
};

/**
 * Empty state
 */
export const Empty: Story = {
  args: {
    attendees: [],
    loading: false,
  },
};

/**
 * Error state
 */
export const Error: Story = {
  args: {
    attendees: [],
    error: 'Failed to load attendees. Please try again.',
  },
};

/**
 * RSVP status showcase
 */
export const RSVPStatuses: Story = {
  render: () => {
    const statusMembers: Attendee[] = [
      { id: '1', name: 'Going User', handle: 'going', status: 'going' },
      { id: '2', name: 'Maybe User', handle: 'maybe', status: 'maybe' },
      { id: '3', name: 'Not Going', handle: 'notgoing', status: 'not_going' },
    ];

    return (
      <div className="space-y-6">
        <p className="text-xs text-[#818187]">
          Status badges: Going (gold ✓), Maybe (yellow ?), Not Going (muted ✗)
        </p>
        <AttendeeList attendees={statusMembers} groupByStatus={false} />
      </div>
    );
  },
};

/**
 * Large event with many attendees
 */
export const LargeEvent: Story = {
  render: () => {
    const manyAttendees: Attendee[] = Array.from({ length: 50 }, (_, i) => ({
      id: `${i}`,
      name: `Attendee ${i + 1}`,
      handle: `attendee${i + 1}`,
      status: (i < 30 ? 'going' : i < 40 ? 'maybe' : 'not_going') as RSVPStatus,
    }));

    return (
      <div className="space-y-6">
        <div>
          <p className="text-xs text-[#818187] mb-2">Stack preview</p>
          <AttendeeStack attendees={manyAttendees} maxVisible={6} />
        </div>
        <div>
          <p className="text-xs text-[#818187] mb-2">Full list (with pagination)</p>
          <AttendeeList
            attendees={manyAttendees.slice(0, 10)}
            totalCount={50}
            hasMore
            groupByStatus
            showSearch
            onLoadMore={() => console.log('Load more...')}
          />
        </div>
      </div>
    );
  },
};

/**
 * Only "going" attendees
 */
export const OnlyGoing: Story = {
  render: () => {
    const goingOnly = sampleAttendees.filter((a) => a.status === 'going');

    return (
      <div className="space-y-6">
        <div>
          <p className="text-xs text-[#818187] mb-2">Stack</p>
          <AttendeeStack attendees={goingOnly} maxVisible={5} />
        </div>
        <div>
          <p className="text-xs text-[#818187] mb-2">Compact</p>
          <AttendeeList variant="compact" attendees={goingOnly} />
        </div>
      </div>
    );
  },
};

/**
 * All variants comparison
 */
export const AllVariants: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-white mb-2">Full (with status grouping)</p>
        <div className="p-4 bg-[#0D0D0D] rounded-xl">
          <AttendeeList
            variant="full"
            attendees={sampleAttendees}
            groupByStatus
            showSearch
          />
        </div>
      </div>

      <div>
        <p className="text-sm text-white mb-2">Compact</p>
        <div className="p-4 bg-[#0D0D0D] rounded-xl w-48">
          <AttendeeList variant="compact" attendees={sampleAttendees} />
        </div>
      </div>

      <div>
        <p className="text-sm text-white mb-2">Stack (avatar row with count)</p>
        <div className="p-4 bg-[#0D0D0D] rounded-xl">
          <AttendeeStack attendees={sampleAttendees} maxVisible={5} />
        </div>
      </div>
    </div>
  ),
};

/**
 * Interactive with click handlers
 */
export const Interactive: Story = {
  args: {
    attendees: sampleAttendees,
    groupByStatus: true,
    onAttendeeClick: (attendee) => console.log('Clicked:', attendee.name),
    onAttendeeAction: (attendee, action) => console.log('Action:', attendee.name, action),
  },
};
