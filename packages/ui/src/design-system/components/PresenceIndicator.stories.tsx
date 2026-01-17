import type { Meta, StoryObj } from '@storybook/react';
import {
  PresenceIndicator,
  PresenceIndicatorGroup,
  PresenceIndicatorInline,
} from './PresenceIndicator';
import { Text, Card } from '../primitives';

const meta: Meta<typeof PresenceIndicator> = {
  title: 'Design System/Components/Status/PresenceIndicator',
  component: PresenceIndicator,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Shows user online/offline status. Two variants: dot (compact), badge (with text).',
      },
    },
  },
  argTypes: {
    status: {
      control: 'select',
      options: ['online', 'away', 'offline', 'dnd', 'invisible'],
    },
    variant: {
      control: 'select',
      options: ['dot', 'badge'],
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'default', 'lg'],
    },
    pulse: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof PresenceIndicator>;

/**
 * Default — Dot variant
 */
export const Default: Story = {
  args: {
    status: 'online',
    variant: 'dot',
    size: 'default',
    pulse: true,
  },
};

/**
 * All statuses — Dot variant
 */
export const AllStatuses: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <PresenceIndicator status="online" />
          <Text size="sm">Online</Text>
        </div>
        <div className="flex items-center gap-2">
          <PresenceIndicator status="away" />
          <Text size="sm">Away</Text>
        </div>
        <div className="flex items-center gap-2">
          <PresenceIndicator status="offline" />
          <Text size="sm">Offline</Text>
        </div>
        <div className="flex items-center gap-2">
          <PresenceIndicator status="dnd" />
          <Text size="sm">DND</Text>
        </div>
        <div className="flex items-center gap-2">
          <PresenceIndicator status="invisible" />
          <Text size="sm">Invisible</Text>
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
        <PresenceIndicator status="online" size="xs" />
        <Text size="xs" tone="muted">
          xs
        </Text>
      </div>
      <div className="flex flex-col items-center gap-2">
        <PresenceIndicator status="online" size="sm" />
        <Text size="xs" tone="muted">
          sm
        </Text>
      </div>
      <div className="flex flex-col items-center gap-2">
        <PresenceIndicator status="online" size="default" />
        <Text size="xs" tone="muted">
          default
        </Text>
      </div>
      <div className="flex flex-col items-center gap-2">
        <PresenceIndicator status="online" size="lg" />
        <Text size="xs" tone="muted">
          lg
        </Text>
      </div>
    </div>
  ),
};

/**
 * Badge variant
 */
export const Badge: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <PresenceIndicator status="online" variant="badge" />
      <PresenceIndicator status="away" variant="badge" />
      <PresenceIndicator status="offline" variant="badge" />
      <PresenceIndicator status="dnd" variant="badge" />
    </div>
  ),
};

/**
 * Badge with last seen
 */
export const BadgeWithLastSeen: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <PresenceIndicator status="online" variant="badge" />
      <PresenceIndicator status="away" variant="badge" label="5 min ago" />
      <PresenceIndicator status="offline" variant="badge" lastSeen="2 hours ago" />
      <PresenceIndicator status="offline" variant="badge" lastSeen="Yesterday" />
    </div>
  ),
};

/**
 * With pulse animation
 */
export const PulseAnimation: Story = {
  render: () => (
    <div className="flex items-center gap-8">
      <div className="flex flex-col items-center gap-2">
        <PresenceIndicator status="online" size="lg" pulse />
        <Text size="xs" tone="muted">
          With pulse
        </Text>
      </div>
      <div className="flex flex-col items-center gap-2">
        <PresenceIndicator status="online" size="lg" pulse={false} />
        <Text size="xs" tone="muted">
          No pulse
        </Text>
      </div>
    </div>
  ),
};

/**
 * Presence group
 */
export const Group: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div>
        <Text size="xs" tone="muted" className="mb-2">
          Online only (default)
        </Text>
        <PresenceIndicatorGroup
          statuses={['online', 'online', 'online', 'away', 'offline', 'offline']}
        />
      </div>
      <div>
        <Text size="xs" tone="muted" className="mb-2">
          Full breakdown
        </Text>
        <PresenceIndicatorGroup
          statuses={['online', 'online', 'online', 'away', 'away', 'offline', 'offline']}
          onlineOnly={false}
        />
      </div>
    </div>
  ),
};

/**
 * Inline — For member lists
 */
export const Inline: Story = {
  render: () => (
    <Card className="w-64 p-3">
      <Text size="xs" tone="muted" className="mb-3">
        Members
      </Text>
      <div className="space-y-2">
        <PresenceIndicatorInline status="online" name="Jane Doe" />
        <PresenceIndicatorInline status="online" name="John Smith" />
        <PresenceIndicatorInline status="away" name="Alice Johnson" />
        <PresenceIndicatorInline status="offline" name="Bob Wilson" />
        <PresenceIndicatorInline status="dnd" name="Carol Martinez" />
      </div>
    </Card>
  ),
};

/**
 * In context — Chat header
 */
export const ChatHeaderContext: Story = {
  render: () => (
    <Card className="max-w-md p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-bg-elevated)]" />
            <div className="absolute -bottom-0.5 -right-0.5">
              <PresenceIndicator status="online" size="sm" />
            </div>
          </div>
          <div>
            <Text weight="medium">Jane Doe</Text>
            <PresenceIndicator status="online" variant="badge" size="sm" />
          </div>
        </div>
      </div>
    </Card>
  ),
};

/**
 * In context — Space header
 */
export const SpaceHeaderContext: Story = {
  render: () => (
    <Card className="max-w-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[var(--color-bg-elevated)] flex items-center justify-center">
            <Text weight="medium">UC</Text>
          </div>
          <div>
            <Text size="lg" weight="semibold">
              UB Coders
            </Text>
            <Text size="sm" tone="muted">
              847 members
            </Text>
          </div>
        </div>
        <PresenceIndicatorGroup
          statuses={Array(23)
            .fill('online')
            .concat(Array(12).fill('away'))
            .concat(Array(100).fill('offline'))}
        />
      </div>
    </Card>
  ),
};

/**
 * All variants comparison
 */
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      <div>
        <Text size="xs" tone="muted" className="mb-3">
          Dot (all statuses)
        </Text>
        <div className="flex items-center gap-4">
          <PresenceIndicator status="online" />
          <PresenceIndicator status="away" />
          <PresenceIndicator status="offline" />
          <PresenceIndicator status="dnd" />
          <PresenceIndicator status="invisible" />
        </div>
      </div>

      <div>
        <Text size="xs" tone="muted" className="mb-3">
          Badge (all statuses)
        </Text>
        <div className="flex flex-wrap gap-2">
          <PresenceIndicator status="online" variant="badge" />
          <PresenceIndicator status="away" variant="badge" />
          <PresenceIndicator status="offline" variant="badge" />
          <PresenceIndicator status="dnd" variant="badge" />
        </div>
      </div>

      <div>
        <Text size="xs" tone="muted" className="mb-3">
          Group
        </Text>
        <PresenceIndicatorGroup
          statuses={['online', 'online', 'away', 'offline']}
          onlineOnly={false}
        />
      </div>

      <div>
        <Text size="xs" tone="muted" className="mb-3">
          Inline list
        </Text>
        <div className="space-y-1">
          <PresenceIndicatorInline status="online" name="Jane Doe" />
          <PresenceIndicatorInline status="away" name="John Smith" />
          <PresenceIndicatorInline status="offline" name="Alice Johnson" />
        </div>
      </div>
    </div>
  ),
};
