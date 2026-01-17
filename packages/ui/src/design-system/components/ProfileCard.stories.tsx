import type { Meta, StoryObj } from '@storybook/react';
import {
  ProfileCard,
  ProfileCardSkeleton,
  ProfileCardHover,
  ProfileCardMini,
} from './ProfileCard';
import { Text } from '../primitives';

const meta: Meta<typeof ProfileCard> = {
  title: 'Design System/Components/Cards/ProfileCard',
  component: ProfileCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'User profile card with presence indicator and action buttons.',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'compact', 'expanded'],
    },
    showActions: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ProfileCard>;

const mockUser = {
  id: '1',
  name: 'Jane Doe',
  handle: 'janedoe',
  bio: 'Computer Science student at UB. Passionate about AI and building cool stuff. Founder of UB Coders.',
  status: 'online' as const,
  badges: ['Founding Class', 'Builder', 'Verified'],
};

export const Default: Story = {
  args: {
    user: mockUser,
    onConnect: () => console.log('Connect clicked'),
    onMessage: () => console.log('Message clicked'),
  },
};

export const AllStatuses: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-80">
      <ProfileCard user={{ ...mockUser, status: 'online' }} />
      <ProfileCard user={{ ...mockUser, status: 'away' }} />
      <ProfileCard user={{ ...mockUser, status: 'offline' }} />
      <ProfileCard user={{ ...mockUser, status: 'dnd' }} />
    </div>
  ),
};

export const Compact: Story = {
  args: {
    user: mockUser,
    variant: 'compact',
  },
};

export const Expanded: Story = {
  args: {
    user: {
      ...mockUser,
      bio: 'Computer Science student at UB. Passionate about AI and building cool stuff. Founder of UB Coders. Always looking to connect with other builders and creators. Currently working on HiveLab tools for campus communities.',
    },
    variant: 'expanded',
    onConnect: () => {},
    onMessage: () => {},
  },
};

export const NoBadges: Story = {
  args: {
    user: { ...mockUser, badges: [] },
    onConnect: () => {},
  },
};

export const NoActions: Story = {
  args: {
    user: mockUser,
    showActions: false,
  },
};

export const UserList: Story = {
  render: () => (
    <div className="w-72 space-y-2">
      {[
        { name: 'Jane Doe', handle: 'janedoe', status: 'online' as const },
        { name: 'John Smith', handle: 'johnsmith', status: 'away' as const },
        { name: 'Alice Johnson', handle: 'alicej', status: 'offline' as const },
        { name: 'Bob Wilson', handle: 'bobw', status: 'dnd' as const },
      ].map((user, i) => (
        <ProfileCard
          key={i}
          user={{ id: String(i), ...user, badges: [] }}
          variant="compact"
          onClick={() => console.log(`Clicked ${user.name}`)}
        />
      ))}
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
      <ProfileCardSkeleton variant="default" />
      <ProfileCardSkeleton variant="compact" />
      <ProfileCardSkeleton variant="expanded" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Loading skeleton with pulsing animation. Use while fetching user data.',
      },
    },
  },
};

/**
 * HoverActions — Actions appear on hover
 */
export const HoverActions: Story = {
  render: () => (
    <div className="w-80">
      <Text size="sm" tone="muted" className="mb-4">
        Hover to reveal actions:
      </Text>
      <ProfileCardHover
        user={mockUser}
        onConnect={() => console.log('Connect')}
        onMessage={() => console.log('Message')}
        hoverContent={
          <Text size="xs" tone="muted">
            12 mutual connections • 3 shared spaces
          </Text>
        }
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Actions slide in on hover for a cleaner default state. Use in dense lists.',
      },
    },
  },
};

/**
 * Mini — Super compact inline variant
 */
export const Mini: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <Text size="sm" tone="muted" className="mb-2">
        Mini variant for mentions, attributions, inline use:
      </Text>
      <div className="flex flex-wrap gap-2">
        <ProfileCardMini
          user={{ id: '1', name: 'Jane Doe', handle: 'janedoe', status: 'online' }}
          onClick={() => console.log('Clicked Jane')}
        />
        <ProfileCardMini
          user={{ id: '2', name: 'John Smith', handle: 'johnsmith', status: 'away' }}
          onClick={() => console.log('Clicked John')}
        />
        <ProfileCardMini
          user={{ id: '3', name: 'Alice', handle: 'alice', status: 'offline' }}
        />
      </div>
    </div>
  ),
};

/**
 * All variants comparison
 */
export const AllVariantsComparison: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div>
        <Text size="xs" tone="muted" className="mb-2">
          ProfileCardMini
        </Text>
        <ProfileCardMini
          user={{ id: '1', name: 'Jane Doe', handle: 'janedoe', status: 'online' }}
        />
      </div>
      <div>
        <Text size="xs" tone="muted" className="mb-2">
          ProfileCard compact
        </Text>
        <div className="w-64">
          <ProfileCard user={mockUser} variant="compact" />
        </div>
      </div>
      <div>
        <Text size="xs" tone="muted" className="mb-2">
          ProfileCard default
        </Text>
        <div className="w-80">
          <ProfileCard
            user={mockUser}
            onConnect={() => {}}
            onMessage={() => {}}
          />
        </div>
      </div>
      <div>
        <Text size="xs" tone="muted" className="mb-2">
          ProfileCardHover (hover for actions)
        </Text>
        <div className="w-80">
          <ProfileCardHover
            user={mockUser}
            onConnect={() => {}}
            onMessage={() => {}}
          />
        </div>
      </div>
      <div>
        <Text size="xs" tone="muted" className="mb-2">
          ProfileCardSkeleton
        </Text>
        <div className="w-80">
          <ProfileCardSkeleton />
        </div>
      </div>
    </div>
  ),
};
