import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { RsvpButtonElement } from '@hive/ui/components/hivelab/element-renderers';
import type { ElementProps } from '@hive/ui/lib/hivelab/element-system';

/**
 * # RSVP Element
 *
 * The RSVP element connects digital to physical - event signups with
 * capacity management, waitlists, and calendar integration.
 *
 * ## Target Experience: Luma.co smoothness
 * - One-tap to RSVP
 * - Instant calendar add
 * - Capacity with visual fill indicator
 * - Waitlist with position tracking
 *
 * ## States
 * - **Available**: Open spots, CTA to RSVP
 * - **Going**: User RSVPd, show confirmation
 * - **Full**: Capacity reached, offer waitlist
 * - **Waitlisted**: User on waitlist with position
 */
const meta: Meta<typeof RsvpButtonElement> = {
  title: 'HiveLab/Elements/RSVP',
  component: RsvpButtonElement,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'RSVP element for event signups with capacity management. Should feel as smooth as Luma.co.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-[400px] max-w-full">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof RsvpButtonElement>;

// Wrapper to handle state
function RSVPWithState(props: ElementProps) {
  const [data, setData] = useState(props.data || {});

  const handleAction = (action: string, payload: unknown) => {
    console.warn('RSVP action:', action, payload);
    if (action === 'rsvp') {
      setData((prev) => ({
        ...prev,
        userRsvp: 'yes',
        count: ((prev.count as number) || 0) + 1,
      }));
    } else if (action === 'cancel_rsvp') {
      setData((prev) => ({
        ...prev,
        userRsvp: null,
        count: Math.max(0, ((prev.count as number) || 1) - 1),
      }));
    }
    props.onAction?.(action, payload);
  };

  return (
    <RsvpButtonElement
      {...props}
      data={data}
      onAction={handleAction}
    />
  );
}

/**
 * Default RSVP with open spots
 */
export const Default: Story = {
  render: () => (
    <RSVPWithState
      id="rsvp-default"
      config={{
        eventName: 'Tech Meetup: AI Workshop',
        eventDate: 'Friday, Dec 15 at 6:00 PM',
        maxAttendees: 50,
        showCount: true,
      }}
      data={{
        count: 23,
      }}
    />
  ),
};

/**
 * User has already RSVPd
 */
export const AlreadyGoing: Story = {
  render: () => (
    <RSVPWithState
      id="rsvp-going"
      config={{
        eventName: 'Weekly Study Session',
        eventDate: 'Every Tuesday, 7:00 PM',
        maxAttendees: 20,
        showCount: true,
      }}
      data={{
        count: 15,
        userRsvp: 'yes',
      }}
    />
  ),
};

/**
 * Event is at capacity
 */
export const Full: Story = {
  render: () => (
    <RSVPWithState
      id="rsvp-full"
      config={{
        eventName: 'Exclusive Founders Dinner',
        eventDate: 'Saturday, Dec 20 at 7:00 PM',
        maxAttendees: 12,
        showCount: true,
        allowWaitlist: true,
      }}
      data={{
        count: 12,
      }}
    />
  ),
};

/**
 * Limited capacity with urgency
 */
export const AlmostFull: Story = {
  render: () => (
    <RSVPWithState
      id="rsvp-almost"
      config={{
        eventName: 'VIP Networking Event',
        eventDate: 'Next Wednesday, 6:00 PM',
        maxAttendees: 30,
        showCount: true,
      }}
      data={{
        count: 27,
      }}
    />
  ),
};

/**
 * No capacity limit
 */
export const Unlimited: Story = {
  render: () => (
    <RSVPWithState
      id="rsvp-unlimited"
      config={{
        eventName: 'Campus-Wide Career Fair',
        eventDate: 'March 1-2, 10:00 AM - 4:00 PM',
        showCount: true,
      }}
      data={{
        count: 342,
      }}
    />
  ),
};

/**
 * Compact for sidebar usage
 */
export const Compact: Story = {
  decorators: [
    (Story) => (
      <div className="w-[280px]">
        <Story />
      </div>
    ),
  ],
  render: () => (
    <RSVPWithState
      id="rsvp-compact"
      config={{
        eventName: 'Quick Sync',
        eventDate: 'Today, 3:00 PM',
        maxAttendees: 10,
        showCount: true,
      }}
      data={{
        count: 6,
      }}
    />
  ),
};

/**
 * With social proof (attendee avatars)
 */
export const WithSocialProof: Story = {
  render: () => (
    <RSVPWithState
      id="rsvp-social"
      config={{
        eventName: 'Hackathon Kickoff',
        eventDate: 'This Weekend',
        maxAttendees: 100,
        showCount: true,
      }}
      data={{
        count: 67,
        attendees: {
          user1: { name: 'Emma' },
          user2: { name: 'Jordan' },
          user3: { name: 'Alex' },
        },
      }}
    />
  ),
};
