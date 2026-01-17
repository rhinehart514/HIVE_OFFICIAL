import type { Meta, StoryObj } from '@storybook/react';
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
  SimpleAvatar,
  getInitials,
  type AvatarStatus,
} from './Avatar';
import { Text } from './Text';

/**
 * Avatar — User representation
 *
 * CRITICAL: ROUNDED SQUARE shape, NEVER circles!
 * This is a key HIVE design differentiator.
 *
 * @see docs/design-system/PRIMITIVES.md (Avatar)
 */
const meta: Meta<typeof Avatar> = {
  title: 'Design System/Primitives/Navigation/Avatar',
  component: Avatar,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          '⚠️ ROUNDED SQUARE avatars (NOT circles). This is intentional and differentiates HIVE from other platforms.',
      },
    },
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['xs', 'sm', 'default', 'lg', 'xl', '2xl'],
      description: 'Avatar size',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Avatar>;

/**
 * Default — Rounded square with image
 */
export const Default: Story = {
  render: () => (
    <Avatar>
      <AvatarImage
        src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=128&h=128&fit=crop"
        alt="Jane Doe"
      />
      <AvatarFallback>JD</AvatarFallback>
    </Avatar>
  ),
};

/**
 * CRITICAL: Rounded square, NOT circle!
 */
export const RoundedSquareNotCircle: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div className="p-4 rounded-xl bg-[var(--color-status-success)]/10 border border-[var(--color-status-success)]/30">
        <div className="flex items-center gap-4 mb-3">
          <Avatar size="xl">
            <AvatarImage
              src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=128&h=128&fit=crop"
              alt="Example"
            />
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
          <div>
            <Text weight="medium" className="text-[var(--color-status-success)]">
              ✓ CORRECT: Rounded square
            </Text>
            <Text size="sm" tone="muted">
              border-radius: 12px (rounded-xl)
            </Text>
          </div>
        </div>
      </div>
      <div className="p-4 rounded-xl bg-[var(--color-status-error)]/10 border border-[var(--color-status-error)]/30">
        <div className="flex items-center gap-4 mb-3">
          <div className="w-16 h-16 rounded-full bg-[var(--color-bg-elevated)] overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=128&h=128&fit=crop"
              alt="Example"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <Text weight="medium" className="text-[var(--color-status-error)]">
              ✗ WRONG: Circle
            </Text>
            <Text size="sm" tone="muted">
              Do NOT use rounded-full
            </Text>
          </div>
        </div>
      </div>
      <Text size="xs" tone="muted">
        Rounded square avatars are a deliberate design choice that differentiates HIVE.
      </Text>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          '⚠️ CRITICAL: HIVE uses ROUNDED SQUARE avatars, NEVER circles. This is intentional.',
      },
    },
  },
};

/**
 * All sizes
 */
export const AllSizes: Story = {
  render: () => (
    <div className="flex items-end gap-4">
      <div className="flex flex-col items-center gap-2">
        <Avatar size="xs">
          <AvatarImage
            src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=64&h=64&fit=crop"
            alt="XS"
          />
          <AvatarFallback size="xs">XS</AvatarFallback>
        </Avatar>
        <Text size="xs" tone="muted">24px</Text>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Avatar size="sm">
          <AvatarImage
            src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=64&h=64&fit=crop"
            alt="SM"
          />
          <AvatarFallback size="sm">SM</AvatarFallback>
        </Avatar>
        <Text size="xs" tone="muted">32px</Text>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Avatar size="default">
          <AvatarImage
            src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop"
            alt="Default"
          />
          <AvatarFallback>DF</AvatarFallback>
        </Avatar>
        <Text size="xs" tone="muted">40px</Text>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Avatar size="lg">
          <AvatarImage
            src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=96&h=96&fit=crop"
            alt="LG"
          />
          <AvatarFallback size="lg">LG</AvatarFallback>
        </Avatar>
        <Text size="xs" tone="muted">48px</Text>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Avatar size="xl">
          <AvatarImage
            src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=128&h=128&fit=crop"
            alt="XL"
          />
          <AvatarFallback size="xl">XL</AvatarFallback>
        </Avatar>
        <Text size="xs" tone="muted">64px</Text>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Avatar size="2xl">
          <AvatarImage
            src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&h=160&fit=crop"
            alt="2XL"
          />
          <AvatarFallback size="2xl">2X</AvatarFallback>
        </Avatar>
        <Text size="xs" tone="muted">80px</Text>
      </div>
    </div>
  ),
};

/**
 * Fallback — Initials when no image
 */
export const Fallback: Story = {
  render: () => (
    <div className="flex gap-4">
      <Avatar>
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback>AB</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback>?</AvatarFallback>
      </Avatar>
    </div>
  ),
};

/**
 * SimpleAvatar helper
 */
export const SimpleAvatarExample: Story = {
  render: () => (
    <div className="flex gap-4">
      <SimpleAvatar
        src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop"
        alt="Jane Doe"
        fallback="JD"
      />
      <SimpleAvatar fallback="AB" />
      <SimpleAvatar
        src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop"
        alt="John Smith"
        fallback="JS"
        size="lg"
      />
    </div>
  ),
};

/**
 * getInitials helper
 */
export const InitialsHelper: Story = {
  render: () => {
    const names = ['Jane Doe', 'John', 'Alice Bob Charlie', ''];
    return (
      <div className="flex gap-4">
        {names.map((name, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <Avatar>
              <AvatarFallback>{getInitials(name)}</AvatarFallback>
            </Avatar>
            <Text size="xs" tone="muted">{name || '(empty)'}</Text>
          </div>
        ))}
      </div>
    );
  },
};

/**
 * In context — User list
 */
export const UserListContext: Story = {
  render: () => (
    <div className="w-72 space-y-2">
      {[
        { name: 'Jane Doe', role: 'Admin' },
        { name: 'John Smith', role: 'Moderator' },
        { name: 'Alice Johnson', role: 'Member' },
      ].map((user, i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--color-bg-elevated)] transition-colors"
        >
          <SimpleAvatar fallback={getInitials(user.name)} size="sm" />
          <div className="flex-1 min-w-0">
            <Text size="sm" weight="medium" className="truncate">{user.name}</Text>
            <Text size="xs" tone="muted">{user.role}</Text>
          </div>
        </div>
      ))}
    </div>
  ),
};

/**
 * In context — Chat message
 */
export const ChatMessageContext: Story = {
  render: () => (
    <div className="flex gap-3 max-w-md">
      <SimpleAvatar
        src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=64&h=64&fit=crop"
        alt="Jane Doe"
        fallback="JD"
        size="sm"
      />
      <div className="flex-1">
        <div className="flex items-baseline gap-2">
          <Text size="sm" weight="medium">Jane Doe</Text>
          <Text size="xs" tone="muted">2:34 PM</Text>
        </div>
        <div className="mt-1 p-3 rounded-xl bg-[var(--color-bg-elevated)]">
          <Text size="sm">Hey! Anyone want to study for the midterm?</Text>
        </div>
      </div>
    </div>
  ),
};

/**
 * In context — Profile header
 */
export const ProfileHeaderContext: Story = {
  render: () => (
    <div className="flex flex-col items-center gap-4 text-center">
      <Avatar size="2xl">
        <AvatarImage
          src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&h=160&fit=crop"
          alt="Jane Doe"
        />
        <AvatarFallback size="2xl">JD</AvatarFallback>
      </Avatar>
      <div>
        <Text size="lg" weight="medium">Jane Doe</Text>
        <Text size="sm" tone="muted">@janedoe</Text>
      </div>
      <Text size="sm" tone="secondary" className="max-w-xs">
        CS student at UB. Building cool stuff. Always learning.
      </Text>
    </div>
  ),
};

/**
 * Status badge — Online/Away/Offline/DND
 */
export const StatusBadge: Story = {
  render: () => {
    const statuses: AvatarStatus[] = ['online', 'away', 'offline', 'dnd'];
    const statusLabels = {
      online: 'Online (Gold)',
      away: 'Away',
      offline: 'Offline',
      dnd: 'Do Not Disturb',
    };

    return (
      <div className="flex flex-col gap-6">
        <Text size="sm" tone="muted">
          Status indicators on avatars. Online is ALWAYS gold.
        </Text>
        <div className="flex gap-6">
          {statuses.map((status) => (
            <div key={status} className="flex flex-col items-center gap-2">
              <SimpleAvatar
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop"
                alt="User"
                fallback="JD"
                size="lg"
                status={status}
              />
              <Text size="xs" tone="muted">{statusLabels[status]}</Text>
            </div>
          ))}
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Status badge shows user presence. Online status uses GOLD (one of the few allowed gold uses).',
      },
    },
  },
};

/**
 * Status at all sizes
 */
export const StatusAllSizes: Story = {
  render: () => (
    <div className="flex items-end gap-4">
      <SimpleAvatar fallback="XS" size="xs" status="online" />
      <SimpleAvatar fallback="SM" size="sm" status="online" />
      <SimpleAvatar fallback="DF" size="default" status="online" />
      <SimpleAvatar fallback="LG" size="lg" status="online" />
      <SimpleAvatar
        src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=128&h=128&fit=crop"
        alt="XL"
        fallback="XL"
        size="xl"
        status="online"
      />
      <SimpleAvatar
        src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&h=160&fit=crop"
        alt="2XL"
        fallback="2X"
        size="2xl"
        status="online"
      />
    </div>
  ),
};

/**
 * In context — Member list with status
 */
export const MemberListWithStatus: Story = {
  render: () => {
    const members = [
      { name: 'Jane Doe', role: 'Admin', status: 'online' as const },
      { name: 'John Smith', role: 'Moderator', status: 'away' as const },
      { name: 'Alice Johnson', role: 'Member', status: 'offline' as const },
      { name: 'Bob Wilson', role: 'Member', status: 'dnd' as const },
    ];

    return (
      <div className="w-72 space-y-2">
        {members.map((member, i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--color-bg-elevated)] transition-colors"
          >
            <SimpleAvatar
              fallback={getInitials(member.name)}
              size="sm"
              status={member.status}
            />
            <div className="flex-1 min-w-0">
              <Text size="sm" weight="medium" className="truncate">{member.name}</Text>
              <Text size="xs" tone="muted">{member.role}</Text>
            </div>
          </div>
        ))}
      </div>
    );
  },
};

/**
 * Clickable avatar
 */
export const ClickableAvatar: Story = {
  render: () => (
    <div className="flex gap-4">
      <SimpleAvatar
        src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop"
        alt="Click me"
        fallback="JD"
        size="lg"
        onClick={() => alert('Avatar clicked!')}
      />
      <SimpleAvatar
        fallback="AB"
        size="lg"
        status="online"
        onClick={() => alert('Avatar with status clicked!')}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Avatars can be clickable via the onClick prop. Adds cursor-pointer style automatically.',
      },
    },
  },
};
