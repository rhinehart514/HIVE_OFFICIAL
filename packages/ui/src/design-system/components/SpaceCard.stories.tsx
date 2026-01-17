import type { Meta, StoryObj } from '@storybook/react';
import { SpaceCard, SpaceCardSkeleton, SpaceCardHover } from './SpaceCard';
import { Text } from '../primitives';

const meta: Meta<typeof SpaceCard> = {
  title: 'Design System/Components/Cards/SpaceCard',
  component: SpaceCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Space discovery card with ActivityEdge warmth and live online count.',
      },
    },
  },
  argTypes: {
    warmth: {
      control: 'select',
      options: ['none', 'low', 'medium', 'high'],
    },
    variant: {
      control: 'select',
      options: ['default', 'compact', 'large'],
    },
    featured: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof SpaceCard>;

const mockSpace = {
  id: '1',
  name: 'UB Coders',
  description: 'The official computer science club at University at Buffalo. Weekly meetings, hackathons, and coding workshops.',
  avatar: undefined,
  category: 'Academic',
  memberCount: 847,
  onlineCount: 23,
  members: [
    { id: '1', name: 'Jane D.' },
    { id: '2', name: 'John S.' },
    { id: '3', name: 'Alice J.' },
    { id: '4', name: 'Bob W.' },
    { id: '5', name: 'Carol M.' },
  ],
};

export const Default: Story = {
  args: {
    space: mockSpace,
    warmth: 'medium',
  },
};

export const AllWarmthLevels: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-80">
      <SpaceCard space={{ ...mockSpace, onlineCount: 0 }} warmth="none" />
      <SpaceCard space={{ ...mockSpace, onlineCount: 2 }} warmth="low" />
      <SpaceCard space={{ ...mockSpace, onlineCount: 8 }} warmth="medium" />
      <SpaceCard space={{ ...mockSpace, onlineCount: 25 }} warmth="high" />
    </div>
  ),
};

export const Compact: Story = {
  args: {
    space: mockSpace,
    variant: 'compact',
    warmth: 'medium',
  },
};

export const Large: Story = {
  args: {
    space: mockSpace,
    variant: 'large',
    warmth: 'high',
  },
};

export const Featured: Story = {
  args: {
    space: mockSpace,
    featured: true,
    warmth: 'high',
  },
};

export const NoOnline: Story = {
  args: {
    space: { ...mockSpace, onlineCount: 0 },
    warmth: 'none',
  },
};

export const DiscoveryGrid: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4 max-w-2xl">
      <SpaceCard
        space={{
          id: '1',
          name: 'UB Coders',
          description: 'Computer Science Club',
          memberCount: 847,
          onlineCount: 23,
          category: 'Academic',
          members: [],
        }}
        warmth="high"
      />
      <SpaceCard
        space={{
          id: '2',
          name: 'Book Club',
          description: 'Monthly book discussions',
          memberCount: 156,
          onlineCount: 2,
          category: 'Social',
          members: [],
        }}
        warmth="low"
      />
      <SpaceCard
        space={{
          id: '3',
          name: 'Photography Club',
          description: 'Capture the moment',
          memberCount: 234,
          onlineCount: 8,
          category: 'Creative',
          members: [],
        }}
        warmth="medium"
      />
      <SpaceCard
        space={{
          id: '4',
          name: 'Chess Club',
          description: 'Strategy and tactics',
          memberCount: 89,
          onlineCount: 0,
          category: 'Games',
          members: [],
        }}
        warmth="none"
      />
    </div>
  ),
};

/**
 * Skeleton — Loading placeholder
 */
export const Skeleton: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-80">
      <Text size="sm" tone="muted" className="mb-2">
        All skeleton variants:
      </Text>
      <SpaceCardSkeleton variant="default" />
      <SpaceCardSkeleton variant="compact" />
      <SpaceCardSkeleton variant="large" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Loading skeleton with pulsing animation. Use while fetching space data.',
      },
    },
  },
};

/**
 * Skeleton grid — Multiple loading cards
 */
export const SkeletonGrid: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4 max-w-2xl">
      {[1, 2, 3, 4].map((i) => (
        <SpaceCardSkeleton key={i} />
      ))}
    </div>
  ),
};

/**
 * Hover Preview — Expands on hover with activity
 */
export const HoverPreview: Story = {
  render: () => (
    <div className="w-80">
      <Text size="sm" tone="muted" className="mb-4">
        Hover to see expanded details:
      </Text>
      <SpaceCardHover
        space={mockSpace}
        warmth="high"
        recentActivity={[
          { user: 'Jane D.', action: 'posted in #general', time: '2m ago' },
          { user: 'John S.', action: 'shared a resource', time: '15m ago' },
        ]}
        upcomingEvent={{
          name: 'Weekly Hackathon',
          date: 'Tomorrow at 6pm',
        }}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Enhanced card that shows recent activity and upcoming events on hover. Use for discovery where you want richer previews.',
      },
    },
  },
};

/**
 * Hover Preview grid
 */
export const HoverPreviewGrid: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4 max-w-2xl">
      <SpaceCardHover
        space={{
          id: '1',
          name: 'UB Coders',
          description: 'Computer Science Club',
          memberCount: 847,
          onlineCount: 23,
          category: 'Academic',
          members: [],
        }}
        warmth="high"
        recentActivity={[
          { user: 'Mike', action: 'started a discussion', time: '5m ago' },
        ]}
        upcomingEvent={{ name: 'Code Review Session', date: 'Friday 4pm' }}
      />
      <SpaceCardHover
        space={{
          id: '2',
          name: 'Design Club',
          description: 'UX/UI Design Community',
          memberCount: 312,
          onlineCount: 8,
          category: 'Creative',
          members: [],
        }}
        warmth="medium"
        recentActivity={[
          { user: 'Sarah', action: 'shared a Figma file', time: '1h ago' },
        ]}
      />
    </div>
  ),
};

/**
 * All card variants comparison
 */
export const AllVariantsComparison: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div>
        <Text size="xs" tone="muted" className="mb-2">
          Standard SpaceCard variants
        </Text>
        <div className="flex flex-col gap-3 w-80">
          <SpaceCard space={mockSpace} variant="compact" warmth="low" />
          <SpaceCard space={mockSpace} variant="default" warmth="medium" />
        </div>
      </div>
      <div>
        <Text size="xs" tone="muted" className="mb-2">
          SpaceCardHover (hover to expand)
        </Text>
        <div className="w-80">
          <SpaceCardHover
            space={mockSpace}
            warmth="high"
            recentActivity={[
              { user: 'Jane', action: 'posted', time: '2m' },
            ]}
          />
        </div>
      </div>
      <div>
        <Text size="xs" tone="muted" className="mb-2">
          SpaceCardSkeleton (loading state)
        </Text>
        <div className="w-80">
          <SpaceCardSkeleton />
        </div>
      </div>
    </div>
  ),
};
