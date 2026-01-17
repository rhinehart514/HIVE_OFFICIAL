import type { Meta, StoryObj } from '@storybook/react';
import { AvatarGroup } from './AvatarGroup';
import { Text } from './Text';
import { Card } from './Card';

// Sample users for stories
const sampleUsers = [
  { name: 'Jane Doe', src: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop' },
  { name: 'John Smith', src: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop' },
  { name: 'Alice Johnson', src: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop' },
  { name: 'Bob Wilson', src: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop' },
  { name: 'Carol Davis', src: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop' },
  { name: 'Dan Brown', src: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&h=80&fit=crop' },
  { name: 'Eve Miller', src: null },
  { name: 'Frank White', src: null },
];

/**
 * AvatarGroup — Stacked avatars
 *
 * Shows multiple users with overlap and overflow indicator.
 * Uses ROUNDED SQUARE avatars (consistent with Avatar).
 *
 * @see docs/design-system/PRIMITIVES.md (AvatarGroup)
 */
const meta: Meta<typeof AvatarGroup> = {
  title: 'Design System/Primitives/Navigation/AvatarGroup',
  component: AvatarGroup,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Stacked avatars with overflow indicator. Uses ROUNDED SQUARE shapes.',
      },
    },
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['xs', 'sm', 'default', 'lg'],
      description: 'Avatar size',
    },
    max: {
      control: { type: 'number', min: 1, max: 10 },
      description: 'Maximum avatars to show',
    },
    showOverflow: {
      control: 'boolean',
      description: 'Show overflow count',
    },
  },
};

export default meta;
type Story = StoryObj<typeof AvatarGroup>;

/**
 * Default — 4 avatars with overflow
 */
export const Default: Story = {
  args: {
    users: sampleUsers,
    max: 4,
  },
};

/**
 * All sizes
 */
export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <AvatarGroup users={sampleUsers} size="xs" max={4} />
        <Text size="xs" tone="muted">Extra small</Text>
      </div>
      <div className="flex items-center gap-4">
        <AvatarGroup users={sampleUsers} size="sm" max={4} />
        <Text size="xs" tone="muted">Small</Text>
      </div>
      <div className="flex items-center gap-4">
        <AvatarGroup users={sampleUsers} size="default" max={4} />
        <Text size="xs" tone="muted">Default</Text>
      </div>
      <div className="flex items-center gap-4">
        <AvatarGroup users={sampleUsers} size="lg" max={4} />
        <Text size="xs" tone="muted">Large</Text>
      </div>
    </div>
  ),
};

/**
 * Different max values
 */
export const MaxValues: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <AvatarGroup users={sampleUsers} max={2} />
        <Text size="xs" tone="muted">max=2 (+6 overflow)</Text>
      </div>
      <div className="flex items-center gap-4">
        <AvatarGroup users={sampleUsers} max={4} />
        <Text size="xs" tone="muted">max=4 (+4 overflow)</Text>
      </div>
      <div className="flex items-center gap-4">
        <AvatarGroup users={sampleUsers} max={6} />
        <Text size="xs" tone="muted">max=6 (+2 overflow)</Text>
      </div>
      <div className="flex items-center gap-4">
        <AvatarGroup users={sampleUsers} max={10} />
        <Text size="xs" tone="muted">max=10 (no overflow)</Text>
      </div>
    </div>
  ),
};

/**
 * Without overflow indicator
 */
export const NoOverflow: Story = {
  args: {
    users: sampleUsers,
    max: 3,
    showOverflow: false,
  },
};

/**
 * Fallback only (no images)
 */
export const FallbackOnly: Story = {
  args: {
    users: [
      { name: 'Jane Doe', src: null },
      { name: 'John Smith', src: null },
      { name: 'Alice Johnson', src: null },
      { name: 'Bob Wilson', src: null },
      { name: 'Carol Davis', src: null },
    ],
    max: 4,
  },
};

/**
 * Small group (less than max)
 */
export const SmallGroup: Story = {
  args: {
    users: sampleUsers.slice(0, 2),
    max: 4,
  },
};

/**
 * In context — Space members
 */
export const SpaceMembersContext: Story = {
  render: () => (
    <Card className="p-4 w-72">
      <div className="flex items-center justify-between">
        <div>
          <Text size="sm" weight="medium">Members</Text>
          <Text size="xs" tone="muted">847 total</Text>
        </div>
        <AvatarGroup users={sampleUsers} size="sm" max={5} />
      </div>
    </Card>
  ),
};

/**
 * In context — Event attendees
 */
export const EventAttendeesContext: Story = {
  render: () => (
    <Card className="p-4 w-80">
      <div className="flex flex-col gap-3">
        <div>
          <Text weight="medium">Study Session</Text>
          <Text size="sm" tone="muted">Tomorrow at 3pm</Text>
        </div>
        <div className="flex items-center gap-3">
          <AvatarGroup users={sampleUsers.slice(0, 6)} max={4} />
          <Text size="sm" tone="secondary">
            12 attending
          </Text>
        </div>
      </div>
    </Card>
  ),
};

/**
 * In context — Online members
 */
export const OnlineMembersContext: Story = {
  render: () => (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-bg-elevated)]">
      <div className="relative">
        <AvatarGroup users={sampleUsers.slice(0, 3)} size="xs" max={3} />
        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[var(--color-accent-gold)] ring-2 ring-[var(--color-bg-elevated)]" />
      </div>
      <Text size="xs" tone="muted">3 online</Text>
    </div>
  ),
};

/**
 * In context — Thread participants
 */
export const ThreadParticipantsContext: Story = {
  render: () => (
    <div className="flex items-center gap-2 text-[var(--color-text-muted)]">
      <AvatarGroup users={sampleUsers.slice(0, 4)} size="xs" max={3} />
      <Text size="xs" tone="muted">
        replied to this thread
      </Text>
    </div>
  ),
};

/**
 * ROUNDED SQUARE note
 */
export const RoundedSquareNote: Story = {
  render: () => (
    <Card className="max-w-md p-6">
      <div className="flex flex-col gap-4">
        <AvatarGroup users={sampleUsers} max={5} />
        <Text size="sm" tone="secondary">
          AvatarGroup uses ROUNDED SQUARE avatars, consistent with the Avatar
          primitive. This is a deliberate design choice that differentiates HIVE
          from other platforms.
        </Text>
        <Text size="xs" tone="muted">
          Each avatar has a ring (border) to maintain visual separation when stacked.
        </Text>
      </div>
    </Card>
  ),
};
