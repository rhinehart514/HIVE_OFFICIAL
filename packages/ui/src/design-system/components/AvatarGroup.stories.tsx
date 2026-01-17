'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { AvatarGroup, AvatarGroupExpanded, type AvatarGroupUser } from './AvatarGroup';

const mockUsers: AvatarGroupUser[] = [
  { id: '1', name: 'Alice Chen', src: 'https://i.pravatar.cc/150?u=alice', presence: 'online' },
  { id: '2', name: 'Bob Johnson', src: 'https://i.pravatar.cc/150?u=bob', presence: 'away' },
  { id: '3', name: 'Carol Smith', src: 'https://i.pravatar.cc/150?u=carol', presence: 'online' },
  { id: '4', name: 'David Lee', src: 'https://i.pravatar.cc/150?u=david', presence: 'offline' },
  { id: '5', name: 'Eva Martinez', src: 'https://i.pravatar.cc/150?u=eva', presence: 'online' },
  { id: '6', name: 'Frank Wilson', src: 'https://i.pravatar.cc/150?u=frank', presence: 'dnd' },
  { id: '7', name: 'Grace Kim', src: 'https://i.pravatar.cc/150?u=grace', presence: 'online' },
  { id: '8', name: 'Henry Brown', src: 'https://i.pravatar.cc/150?u=henry', presence: 'away' },
  { id: '9', name: 'Ivy Davis', presence: 'online' }, // No avatar
];

const meta: Meta<typeof AvatarGroup> = {
  title: 'Design System/Components/AvatarGroup',
  component: AvatarGroup,
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'dark' },
  },
  decorators: [
    (Story) => (
      <div className="p-8">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg'],
    },
    overlap: {
      control: 'boolean',
    },
    max: {
      control: 'number',
    },
    showPresence: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof AvatarGroup>;

/**
 * Default overlapping avatar group.
 */
export const Default: Story = {
  args: {
    users: mockUsers.slice(0, 6),
    max: 4,
  },
};

/**
 * Small avatar group.
 */
export const ExtraSmall: Story = {
  args: {
    users: mockUsers.slice(0, 5),
    size: 'xs',
    max: 3,
  },
};

/**
 * Small avatar group.
 */
export const Small: Story = {
  args: {
    users: mockUsers.slice(0, 5),
    size: 'sm',
    max: 4,
  },
};

/**
 * Large avatar group.
 */
export const Large: Story = {
  args: {
    users: mockUsers.slice(0, 6),
    size: 'lg',
    max: 4,
  },
};

/**
 * Non-overlapping (separated) avatars.
 */
export const Separated: Story = {
  args: {
    users: mockUsers.slice(0, 5),
    overlap: false,
    max: 4,
  },
};

/**
 * With presence indicators (gold for online).
 */
export const WithPresence: Story = {
  args: {
    users: mockUsers.slice(0, 6),
    showPresence: true,
    max: 4,
  },
};

/**
 * All sizes comparison.
 */
export const Sizes: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <span className="text-sm text-[var(--color-text-muted)] w-12">XS:</span>
        <AvatarGroup users={mockUsers.slice(0, 5)} size="xs" max={4} />
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-[var(--color-text-muted)] w-12">SM:</span>
        <AvatarGroup users={mockUsers.slice(0, 5)} size="sm" max={4} />
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-[var(--color-text-muted)] w-12">MD:</span>
        <AvatarGroup users={mockUsers.slice(0, 5)} size="md" max={4} />
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-[var(--color-text-muted)] w-12">LG:</span>
        <AvatarGroup users={mockUsers.slice(0, 5)} size="lg" max={4} />
      </div>
    </div>
  ),
};

/**
 * No overflow (few users).
 */
export const NoOverflow: Story = {
  args: {
    users: mockUsers.slice(0, 3),
    max: 4,
  },
};

/**
 * Large overflow count.
 */
export const LargeOverflow: Story = {
  args: {
    users: [...mockUsers, ...mockUsers.map((u, i) => ({ ...u, id: `${u.id}-copy-${i}` }))],
    max: 3,
  },
};

/**
 * Interactive with click handlers.
 */
export const Interactive: Story = {
  args: {
    users: mockUsers.slice(0, 6),
    max: 4,
    onUserClick: (user) => alert(`Clicked: ${user.name}`),
    onOverflowClick: () => alert('Show all members'),
  },
};

/**
 * Expanded group that shows full list on hover.
 */
export const Expanded: StoryObj<typeof AvatarGroupExpanded> = {
  render: () => (
    <div className="min-h-[300px] flex items-start justify-center pt-8">
      <AvatarGroupExpanded
        users={mockUsers}
        max={4}
        showPresence
      />
    </div>
  ),
};

/**
 * Expanded group aligned to the left.
 */
export const ExpandedLeft: StoryObj<typeof AvatarGroupExpanded> = {
  render: () => (
    <div className="min-h-[300px] flex items-start justify-end pr-16 pt-8">
      <AvatarGroupExpanded
        users={mockUsers}
        max={4}
        expandDirection="left"
        showPresence
      />
    </div>
  ),
};

/**
 * With fallback avatars (no images).
 */
export const FallbackAvatars: Story = {
  args: {
    users: mockUsers.map(u => ({ ...u, src: undefined })),
    max: 4,
  },
};

/**
 * Mixed (some with images, some without).
 */
export const MixedAvatars: Story = {
  args: {
    users: mockUsers.map((u, i) => i % 2 === 0 ? u : { ...u, src: undefined }),
    max: 4,
    showPresence: true,
  },
};

/**
 * In a card context (members preview).
 */
export const InCardContext: Story = {
  render: () => (
    <div className="w-80 p-4 rounded-xl border border-[var(--color-border)] bg-[#141414]">
      <h3 className="text-sm font-medium text-white mb-1">Design Team</h3>
      <p className="text-xs text-[var(--color-text-muted)] mb-3">12 members • 5 online</p>
      <div className="flex items-center justify-between">
        <AvatarGroup
          users={mockUsers.slice(0, 5)}
          size="sm"
          max={4}
          showPresence
        />
        <button className="text-xs text-[#FFD700] hover:text-[#FFD700]/80 transition-colors">
          View all
        </button>
      </div>
    </div>
  ),
};

/**
 * In a compact header context.
 */
export const CompactHeader: Story = {
  render: () => (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-[#141414] border border-[var(--color-border)]">
      <div className="w-8 h-8 rounded-lg bg-[#FFD700]/20 flex items-center justify-center">
        <span className="text-lg">🐝</span>
      </div>
      <div className="flex-1">
        <h4 className="text-sm font-medium text-white">Beekeepers Club</h4>
        <p className="text-xs text-[var(--color-text-muted)]">Active now</p>
      </div>
      <AvatarGroup
        users={mockUsers.slice(0, 4)}
        size="xs"
        max={3}
        showPresence
      />
    </div>
  ),
};

/**
 * Event attendees preview.
 */
export const EventAttendees: Story = {
  render: () => (
    <div className="w-96 p-4 rounded-xl border border-[var(--color-border)] bg-[#141414]">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[#22C55E]">●</span>
        <span className="text-sm text-white">Happening now</span>
      </div>
      <h3 className="text-lg font-medium text-white mb-1">Weekly Design Sync</h3>
      <p className="text-sm text-[var(--color-text-muted)] mb-4">
        Join us for our weekly design review and feedback session.
      </p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AvatarGroup
            users={mockUsers}
            size="sm"
            max={5}
          />
          <span className="text-xs text-[var(--color-text-muted)]">
            {mockUsers.length} attending
          </span>
        </div>
        <button className="px-3 py-1.5 rounded-lg bg-[#FFD700] text-black text-sm font-medium hover:bg-[#FFD700]/90 transition-colors">
          Join
        </button>
      </div>
    </div>
  ),
};
