import type { Meta, StoryObj } from '@storybook/react';
import { LiveCounter, LiveCounterGroup } from './LiveCounter';
import { Text } from './Text';
import { Card } from './Card';
import { PresenceDot } from './PresenceDot';

/**
 * LiveCounter — Gold numbers, gray labels
 *
 * CRITICAL: Numbers are GOLD when count > 0!
 * This is one of the primary places gold is permitted.
 *
 * @see docs/design-system/PRIMITIVES.md (LiveCounter)
 */
const meta: Meta<typeof LiveCounter> = {
  title: 'Design System/Primitives/Life/LiveCounter',
  component: LiveCounter,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          '⚠️ GOLD numbers! LiveCounter displays live counts with gold numbers and gray labels.',
      },
    },
  },
  argTypes: {
    count: {
      control: { type: 'number', min: 0, max: 10000 },
      description: 'The count to display',
    },
    label: {
      control: 'text',
      description: 'Label text',
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'default', 'lg', 'xl'],
      description: 'Counter size',
    },
    showDot: {
      control: 'boolean',
      description: 'Show dot indicator',
    },
    compact: {
      control: 'boolean',
      description: 'Compact number format (1000 → 1K)',
    },
  },
};

export default meta;
type Story = StoryObj<typeof LiveCounter>;

/**
 * Default — Basic counter
 */
export const Default: Story = {
  args: {
    count: 42,
    label: 'online',
  },
};

/**
 * All sizes
 */
export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-col gap-4 items-start">
      <LiveCounter count={23} label="online" size="xs" />
      <LiveCounter count={23} label="online" size="sm" />
      <LiveCounter count={23} label="online" size="default" />
      <LiveCounter count={23} label="online" size="lg" />
      <LiveCounter count={23} label="online" size="xl" />
    </div>
  ),
};

/**
 * With dot indicator
 */
export const WithDot: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <LiveCounter count={23} label="online" showDot />
      <LiveCounter count={0} label="online" showDot />
    </div>
  ),
};

/**
 * Zero count — Gray (not gold)
 */
export const ZeroCount: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <LiveCounter count={23} label="active" showDot />
      <LiveCounter count={0} label="active" showDot />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'When count is 0, the number displays in gray instead of gold.',
      },
    },
  },
};

/**
 * Compact format — Large numbers
 */
export const CompactFormat: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <LiveCounter count={847} label="members" compact />
      <LiveCounter count={1234} label="members" compact />
      <LiveCounter count={12500} label="members" compact />
      <LiveCounter count={1500000} label="views" compact />
    </div>
  ),
};

/**
 * With prefix
 */
export const WithPrefix: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <LiveCounter count={23} prefix="+" label="new" />
      <LiveCounter count={5} prefix="−" label="left" />
      <LiveCounter count={100} prefix="~" label="estimated" />
    </div>
  ),
};

/**
 * LiveCounterGroup — Multiple counters
 */
export const CounterGroup: Story = {
  render: () => (
    <LiveCounterGroup
      counters={[
        { count: 23, label: 'online', showDot: true },
        { count: 847, label: 'members' },
        { count: 156, label: 'posts' },
      ]}
    />
  ),
};

/**
 * In context — Space header
 */
export const SpaceHeaderContext: Story = {
  render: () => (
    <Card className="w-96 p-4">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-xl bg-[var(--color-bg-elevated)]" />
        <div className="flex-1 min-w-0">
          <Text weight="semibold" className="truncate">UB Coders</Text>
          <Text size="sm" tone="secondary" className="mb-2">Computer Science Club</Text>
          <LiveCounterGroup
            size="sm"
            counters={[
              { count: 23, label: 'online', showDot: true },
              { count: 847, label: 'members' },
            ]}
          />
        </div>
      </div>
    </Card>
  ),
};

/**
 * In context — Chat panel header
 */
export const ChatPanelHeaderContext: Story = {
  render: () => (
    <div className="w-80 p-4 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)]">
      <div className="flex items-center justify-between">
        <Text weight="medium">#general</Text>
        <LiveCounter count={8} label="active" showDot size="sm" />
      </div>
    </div>
  ),
};

/**
 * In context — Discovery card
 */
export const DiscoveryCardContext: Story = {
  render: () => (
    <Card className="w-72 p-4">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-12 h-12 rounded-xl bg-[var(--color-bg-elevated)]" />
        <div className="flex-1 min-w-0">
          <Text weight="medium" className="truncate">Engineering Club</Text>
          <Text size="xs" tone="muted">847 members</Text>
        </div>
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-[var(--color-border)]">
        <LiveCounter count={15} label="online" showDot size="sm" />
        <Text size="xs" tone="muted">Very Active</Text>
      </div>
    </Card>
  ),
};

/**
 * In context — Analytics dashboard
 */
export const AnalyticsDashboardContext: Story = {
  render: () => (
    <div className="flex gap-6">
      {[
        { count: 1234, label: 'Total Users', change: '+12%' },
        { count: 89, label: 'Active Now', change: '+5%' },
        { count: 456, label: 'Messages Today', change: '+23%' },
      ].map((stat, i) => (
        <Card key={i} className="p-4 min-w-[140px]">
          <Text size="xs" tone="muted" className="mb-1">{stat.label}</Text>
          <div className="flex items-baseline gap-2">
            <LiveCounter count={stat.count} size="xl" compact />
            <Text size="xs" className="text-[var(--color-status-success)]">
              {stat.change}
            </Text>
          </div>
        </Card>
      ))}
    </div>
  ),
};

/**
 * In context — User list header
 */
export const UserListHeaderContext: Story = {
  render: () => (
    <div className="w-64 p-3 rounded-lg bg-[var(--color-bg-elevated)]">
      <div className="flex items-center justify-between mb-3">
        <Text size="xs" weight="medium" className="uppercase tracking-wide text-[var(--color-text-muted)]">
          Members
        </Text>
        <LiveCounter count={23} size="xs" showDot />
      </div>
      <div className="space-y-2">
        {['Jane Doe', 'John Smith', 'Alice J.'].map((name, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="relative">
              <div className="w-8 h-8 rounded-lg bg-[var(--color-bg-page)]" />
              <PresenceDot status="online" size="xs" withRing className="absolute -bottom-0.5 -right-0.5" />
            </div>
            <Text size="sm">{name}</Text>
          </div>
        ))}
      </div>
    </div>
  ),
};

/**
 * Gold discipline note
 */
export const GoldDisciplineNote: Story = {
  render: () => (
    <Card className="max-w-md p-6">
      <div className="flex items-center gap-4 mb-4">
        <LiveCounter count={42} size="xl" />
        <Text weight="medium">Numbers = GOLD</Text>
      </div>
      <Text size="sm" tone="secondary" className="mb-4">
        LiveCounter numbers are gold when count {">"} 0. This is one of the primary places
        where gold is permitted in the HIVE design system.
      </Text>
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <LiveCounter count={23} label="active" showDot />
          <Text size="xs" className="text-[var(--color-status-success)]">✓ Gold (count {">"} 0)</Text>
        </div>
        <div className="flex items-center gap-3">
          <LiveCounter count={0} label="active" showDot />
          <Text size="xs" tone="muted">○ Gray (count = 0)</Text>
        </div>
      </div>
      <div className="mt-4 p-3 rounded-lg bg-[var(--color-accent-gold)]/10 border border-[var(--color-accent-gold)]/30">
        <Text size="xs" className="text-[var(--color-accent-gold)]">
          Gold budget: 1-2% of the interface
        </Text>
        <ul className="text-xs text-[var(--color-text-muted)] list-disc list-inside mt-2 space-y-1">
          <li>PresenceDot — Online status</li>
          <li>Button CTA — Primary actions</li>
          <li>Switch — Gold track when on</li>
          <li>Progress — Achievements</li>
          <li>Badge — Achievement variant</li>
          <li><strong>LiveCounter</strong> — Numbers when count {">"} 0</li>
        </ul>
      </div>
    </Card>
  ),
};
