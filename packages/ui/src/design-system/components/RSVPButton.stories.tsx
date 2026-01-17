import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { RSVPButton, RSVPButtonGroup } from './RSVPButton';
import { Card, Text } from '../primitives';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * RSVPBUTTON VISUAL REFERENCE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Event RSVP action button with status states.
 *
 * STATES:
 * - none: Border outline, "RSVP" text
 * - going: Gold (#FFD700) background, black text, checkmark
 * - maybe: Dashed border, "Maybe" text
 * - not_going: Ghost appearance, "Not going" text
 *
 * GOLD USAGE:
 * The "going" state uses gold because RSVP is a key action/commitment.
 *
 * FEATURES:
 * - Toggle between states
 * - Dropdown for multi-option selection
 * - Compact icon-only mode with tooltip
 * - Hover shows cancel intent on "going" state
 * - Loading state with spinner
 * - Full state when event at capacity
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

const meta: Meta<typeof RSVPButton> = {
  title: 'Design System/Components/Actions/RSVPButton',
  component: RSVPButton,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Event RSVP action button with status states.',
      },
    },
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'default', 'lg'],
    },
    status: {
      control: 'select',
      options: ['none', 'going', 'maybe', 'not_going'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof RSVPButton>;

/**
 * Default — Not attending
 */
export const Default: Story = {
  render: () => {
    const [status, setStatus] = useState<'none' | 'going' | 'maybe' | 'not_going'>('none');
    return (
      <RSVPButton
        status={status}
        onStatusChange={setStatus}
      />
    );
  },
};

/**
 * Going state
 */
export const Going: Story = {
  render: () => {
    const [status, setStatus] = useState<'none' | 'going' | 'maybe' | 'not_going'>('going');
    return (
      <RSVPButton
        status={status}
        onStatusChange={setStatus}
        attendeeCount={24}
      />
    );
  },
};

/**
 * Maybe state
 */
export const Maybe: Story = {
  render: () => {
    const [status, setStatus] = useState<'none' | 'going' | 'maybe' | 'not_going'>('maybe');
    return (
      <RSVPButton
        status={status}
        onStatusChange={setStatus}
      />
    );
  },
};

/**
 * All states
 */
export const AllStates: Story = {
  render: () => (
    <div className="flex gap-4">
      <RSVPButton status="none" />
      <RSVPButton status="going" />
      <RSVPButton status="maybe" />
      <RSVPButton status="not_going" />
    </div>
  ),
};

/**
 * With dropdown
 */
export const WithDropdown: Story = {
  render: () => {
    const [status, setStatus] = useState<'none' | 'going' | 'maybe' | 'not_going'>('none');
    return (
      <RSVPButton
        status={status}
        onStatusChange={setStatus}
        showDropdown
      />
    );
  },
};

/**
 * Compact mode
 */
export const Compact: Story = {
  render: () => (
    <div className="flex gap-3">
      <RSVPButton status="none" compact />
      <RSVPButton status="going" compact />
      <RSVPButton status="maybe" compact />
      <RSVPButton status="not_going" compact />
    </div>
  ),
};

/**
 * All sizes
 */
export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <Text size="xs" tone="muted" className="w-16">Small</Text>
        <RSVPButton size="sm" status="going" />
      </div>
      <div className="flex items-center gap-4">
        <Text size="xs" tone="muted" className="w-16">Default</Text>
        <RSVPButton size="default" status="going" />
      </div>
      <div className="flex items-center gap-4">
        <Text size="xs" tone="muted" className="w-16">Large</Text>
        <RSVPButton size="lg" status="going" />
      </div>
    </div>
  ),
};

/**
 * Loading state
 */
export const Loading: Story = {
  render: () => (
    <div className="flex gap-4">
      <RSVPButton status="none" loading />
      <RSVPButton status="going" loading />
    </div>
  ),
};

/**
 * Full (at capacity)
 */
export const Full: Story = {
  render: () => (
    <div className="flex gap-4">
      <RSVPButton status="none" isFull />
      <RSVPButton status="going" isFull />
    </div>
  ),
};

/**
 * Disabled
 */
export const Disabled: Story = {
  render: () => (
    <div className="flex gap-4">
      <RSVPButton status="none" disabled />
      <RSVPButton status="going" disabled />
    </div>
  ),
};

/**
 * Button group
 */
export const ButtonGroup: Story = {
  render: () => {
    const [status, setStatus] = useState<'none' | 'going' | 'maybe' | 'not_going'>('none');
    return (
      <RSVPButtonGroup
        status={status}
        onStatusChange={setStatus}
      />
    );
  },
};

/**
 * In context — Event card
 */
export const EventCardContext: Story = {
  render: () => {
    const [status, setStatus] = useState<'none' | 'going' | 'maybe' | 'not_going'>('none');

    return (
      <Card className="w-96 p-0 overflow-hidden">
        {/* Event image */}
        <div className="h-40 bg-gradient-to-br from-[#FFD700]/20 to-[#FF6B6B]/20" />

        {/* Event details */}
        <div className="p-4">
          <Text size="lg" weight="semibold">Tech Talk: Building with AI</Text>
          <div className="flex items-center gap-2 mt-2 text-[var(--color-text-muted)]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
            <Text size="sm" tone="muted">Friday, Jan 10 at 6:00 PM</Text>
          </div>
          <div className="flex items-center gap-2 mt-1 text-[var(--color-text-muted)]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
            <Text size="sm" tone="muted">Davis Hall 101</Text>
          </div>

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-[var(--color-border)]">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-6 h-6 rounded-full bg-[var(--color-bg-elevated)] border-2 border-[var(--color-bg-page)]"
                  />
                ))}
              </div>
              <Text size="xs" tone="muted">24 going</Text>
            </div>

            <RSVPButton
              status={status}
              onStatusChange={setStatus}
              attendeeCount={status === 'going' ? 25 : 24}
              size="sm"
            />
          </div>
        </div>
      </Card>
    );
  },
};

/**
 * In context — Event list
 */
export const EventListContext: Story = {
  render: () => {
    const [statuses, setStatuses] = useState<Record<string, 'none' | 'going' | 'maybe' | 'not_going'>>({
      '1': 'going',
      '2': 'none',
      '3': 'maybe',
    });

    const events = [
      { id: '1', name: 'Weekly Standup', time: 'Today, 10:00 AM', attendees: 12 },
      { id: '2', name: 'Design Review', time: 'Tomorrow, 2:00 PM', attendees: 5 },
      { id: '3', name: 'Team Lunch', time: 'Friday, 12:00 PM', attendees: 18 },
    ];

    return (
      <Card className="w-[500px] divide-y divide-[var(--color-border)]">
        {events.map((event) => (
          <div key={event.id} className="flex items-center justify-between p-4">
            <div>
              <Text size="sm" weight="medium">{event.name}</Text>
              <Text size="xs" tone="muted">{event.time} · {event.attendees} attending</Text>
            </div>
            <RSVPButton
              status={statuses[event.id]}
              onStatusChange={(s) => setStatuses({ ...statuses, [event.id]: s })}
              compact
            />
          </div>
        ))}
      </Card>
    );
  },
};
