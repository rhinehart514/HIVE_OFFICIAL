import type { Meta, StoryObj } from '@storybook/react';
import { PresenceDot, PresenceWrapper } from './PresenceDot';
import { SimpleAvatar } from './Avatar';
import { Text } from './Text';
import { Card } from './Card';

/**
 * PresenceDot — Online status indicator
 *
 * CRITICAL: ALWAYS gold when online!
 * This is one of the primary places gold is allowed.
 *
 * @see docs/design-system/PRIMITIVES.md (PresenceDot)
 */
const meta: Meta<typeof PresenceDot> = {
  title: 'Design System/Primitives/Life/PresenceDot',
  component: PresenceDot,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          '⚠️ GOLD when online! PresenceDot is one of the primary places gold is permitted.',
      },
    },
  },
  argTypes: {
    status: {
      control: 'select',
      options: ['online', 'away', 'offline', 'dnd'],
      description: 'User status',
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'default', 'lg'],
      description: 'Dot size',
    },
    animate: {
      control: 'boolean',
      description: 'Pulse animation (online only)',
    },
    withRing: {
      control: 'boolean',
      description: 'Ring around dot',
    },
  },
};

export default meta;
type Story = StoryObj<typeof PresenceDot>;

/**
 * Online — GOLD (always)
 */
export const Online: Story = {
  args: {
    status: 'online',
  },
  parameters: {
    docs: {
      description: {
        story:
          '✨ GOLD: Online status is ALWAYS gold. This is a core design principle.',
      },
    },
  },
};

/**
 * All statuses
 */
export const AllStatuses: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <PresenceDot status="online" size="lg" />
        <div>
          <Text size="sm" weight="medium">Online</Text>
          <Text size="xs" className="text-[var(--color-accent-gold)]">
            ALWAYS gold
          </Text>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <PresenceDot status="away" size="lg" />
        <div>
          <Text size="sm" weight="medium">Away</Text>
          <Text size="xs" tone="muted">Gold at 50% opacity</Text>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <PresenceDot status="offline" size="lg" />
        <div>
          <Text size="sm" weight="medium">Offline</Text>
          <Text size="xs" tone="muted">Gray</Text>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <PresenceDot status="dnd" size="lg" />
        <div>
          <Text size="sm" weight="medium">Do Not Disturb</Text>
          <Text size="xs" tone="muted">Red</Text>
        </div>
      </div>
    </div>
  ),
};

/**
 * All sizes
 */
export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      <div className="flex flex-col items-center gap-2">
        <PresenceDot status="online" size="xs" />
        <Text size="xs" tone="muted">xs</Text>
      </div>
      <div className="flex flex-col items-center gap-2">
        <PresenceDot status="online" size="sm" />
        <Text size="xs" tone="muted">sm</Text>
      </div>
      <div className="flex flex-col items-center gap-2">
        <PresenceDot status="online" size="default" />
        <Text size="xs" tone="muted">default</Text>
      </div>
      <div className="flex flex-col items-center gap-2">
        <PresenceDot status="online" size="lg" />
        <Text size="xs" tone="muted">lg</Text>
      </div>
    </div>
  ),
};

/**
 * With animation (online)
 */
export const Animated: Story = {
  args: {
    status: 'online',
    size: 'lg',
    animate: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Subtle pulse animation for online status.',
      },
    },
  },
};

/**
 * With ring
 */
export const WithRing: Story = {
  render: () => (
    <div className="flex items-center gap-4 p-6 rounded-xl bg-[var(--color-bg-elevated)]">
      <PresenceDot status="online" size="lg" withRing />
      <PresenceDot status="away" size="lg" withRing />
      <PresenceDot status="offline" size="lg" withRing />
      <PresenceDot status="dnd" size="lg" withRing />
    </div>
  ),
};

/**
 * PresenceWrapper — With Avatar
 */
export const WithAvatar: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      <PresenceWrapper status="online">
        <SimpleAvatar fallback="JD" />
      </PresenceWrapper>
      <PresenceWrapper status="away">
        <SimpleAvatar fallback="AB" />
      </PresenceWrapper>
      <PresenceWrapper status="offline">
        <SimpleAvatar fallback="CD" />
      </PresenceWrapper>
      <PresenceWrapper status="dnd">
        <SimpleAvatar fallback="EF" />
      </PresenceWrapper>
    </div>
  ),
};

/**
 * PresenceWrapper positions
 */
export const WrapperPositions: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      <PresenceWrapper status="online" position="bottom-right">
        <SimpleAvatar fallback="BR" />
      </PresenceWrapper>
      <PresenceWrapper status="online" position="bottom-left">
        <SimpleAvatar fallback="BL" />
      </PresenceWrapper>
      <PresenceWrapper status="online" position="top-right">
        <SimpleAvatar fallback="TR" />
      </PresenceWrapper>
      <PresenceWrapper status="online" position="top-left">
        <SimpleAvatar fallback="TL" />
      </PresenceWrapper>
    </div>
  ),
};

/**
 * In context — User list
 */
export const UserListContext: Story = {
  render: () => (
    <div className="w-72 space-y-2">
      {[
        { name: 'Jane Doe', status: 'online' as const },
        { name: 'John Smith', status: 'away' as const },
        { name: 'Alice Johnson', status: 'offline' as const },
        { name: 'Bob Wilson', status: 'dnd' as const },
      ].map((user, i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--color-bg-elevated)] transition-colors"
        >
          <PresenceWrapper status={user.status} size="sm">
            <SimpleAvatar fallback={user.name.split(' ').map(n => n[0]).join('')} size="sm" />
          </PresenceWrapper>
          <div className="flex-1 min-w-0">
            <Text size="sm" className="truncate">{user.name}</Text>
          </div>
          <Text size="xs" tone="muted" className="capitalize">
            {user.status}
          </Text>
        </div>
      ))}
    </div>
  ),
};

/**
 * In context — Online members sidebar
 */
export const OnlineMembersSidebarContext: Story = {
  render: () => (
    <Card className="w-56 p-3">
      <div className="flex items-center justify-between mb-3">
        <Text size="xs" weight="medium" className="uppercase tracking-wide text-[var(--color-text-muted)]">
          Online — 3
        </Text>
      </div>
      <div className="space-y-1">
        {['Jane Doe', 'John Smith', 'Alice J.'].map((name, i) => (
          <div key={i} className="flex items-center gap-2 p-2 rounded hover:bg-[var(--color-bg-elevated)]">
            <PresenceWrapper status="online" size="xs">
              <SimpleAvatar fallback={name.split(' ').map(n => n[0]).join('')} size="sm" />
            </PresenceWrapper>
            <Text size="sm">{name}</Text>
          </div>
        ))}
      </div>
    </Card>
  ),
};

/**
 * Gold discipline note
 */
export const GoldDisciplineNote: Story = {
  render: () => (
    <Card className="max-w-md p-6">
      <div className="flex items-center gap-4 mb-4">
        <PresenceDot status="online" size="lg" />
        <Text weight="medium">Online = GOLD (Always)</Text>
      </div>
      <Text size="sm" tone="secondary" className="mb-4">
        PresenceDot is one of the primary places where gold is permitted in the HIVE design system.
        The gold color for online status is non-negotiable.
      </Text>
      <div className="p-3 rounded-lg bg-[var(--color-accent-gold)]/10 border border-[var(--color-accent-gold)]/30">
        <Text size="sm" className="text-[var(--color-accent-gold)]">
          Gold budget: 1-2% of the interface
        </Text>
        <ul className="text-xs text-[var(--color-text-muted)] list-disc list-inside mt-2 space-y-1">
          <li><strong>PresenceDot</strong> — Always gold when online</li>
          <li>Button CTA — 1% rule</li>
          <li>Switch — Gold track when on</li>
          <li>Progress — Achievement tracking</li>
          <li>Badge — Achievement variant</li>
          <li>LiveCounter — Gold numbers</li>
        </ul>
      </div>
    </Card>
  ),
};
