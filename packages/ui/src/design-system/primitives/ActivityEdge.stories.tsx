import type { Meta, StoryObj } from '@storybook/react';
import { ActivityEdge } from './ActivityEdge';
import { Text } from './Text';
import { Card } from './Card';

/**
 * ActivityEdge — Warmth-based activity indicator
 *
 * CRITICAL: Warmth is EDGE-based (box-shadow inset), never background!
 * Gold edge glow indicates activity level.
 *
 * @see docs/design-system/PRIMITIVES.md (ActivityEdge)
 */
const meta: Meta<typeof ActivityEdge> = {
  title: 'Design System/Primitives/Life/ActivityEdge',
  component: ActivityEdge,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Warmth edge glow to indicate activity. EDGE-based (box-shadow inset), never background tint.',
      },
    },
  },
  argTypes: {
    warmth: {
      control: 'select',
      options: ['none', 'low', 'medium', 'high'],
      description: 'Warmth level',
    },
    rounded: {
      control: 'select',
      options: ['none', 'sm', 'default', 'lg', 'full'],
      description: 'Border radius',
    },
    activeUsers: {
      control: { type: 'number', min: 0, max: 100 },
      description: 'Auto-calculate warmth from user count',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ActivityEdge>;

/**
 * Default — No activity
 */
export const Default: Story = {
  render: () => (
    <ActivityEdge warmth="none" className="p-6 bg-[var(--color-bg-card)]">
      <Text>No activity</Text>
    </ActivityEdge>
  ),
};

/**
 * All warmth levels
 */
export const AllWarmthLevels: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <ActivityEdge warmth="none" className="p-6 bg-[var(--color-bg-card)]">
        <div className="flex items-center justify-between">
          <Text weight="medium">None</Text>
          <Text size="xs" tone="muted">0 active users</Text>
        </div>
      </ActivityEdge>
      <ActivityEdge warmth="low" className="p-6 bg-[var(--color-bg-card)]">
        <div className="flex items-center justify-between">
          <Text weight="medium">Low</Text>
          <Text size="xs" tone="muted">1-2 active users</Text>
        </div>
      </ActivityEdge>
      <ActivityEdge warmth="medium" className="p-6 bg-[var(--color-bg-card)]">
        <div className="flex items-center justify-between">
          <Text weight="medium">Medium</Text>
          <Text size="xs" tone="muted">3-10 active users</Text>
        </div>
      </ActivityEdge>
      <ActivityEdge warmth="high" className="p-6 bg-[var(--color-bg-card)]">
        <div className="flex items-center justify-between">
          <Text weight="medium">High</Text>
          <Text size="xs" tone="muted">10+ active users</Text>
        </div>
      </ActivityEdge>
    </div>
  ),
};

/**
 * Auto-calculate from active users
 */
export const AutoCalculate: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <ActivityEdge activeUsers={0} className="p-4 bg-[var(--color-bg-card)]">
        <Text size="sm">0 users = none</Text>
      </ActivityEdge>
      <ActivityEdge activeUsers={2} className="p-4 bg-[var(--color-bg-card)]">
        <Text size="sm">2 users = low</Text>
      </ActivityEdge>
      <ActivityEdge activeUsers={5} className="p-4 bg-[var(--color-bg-card)]">
        <Text size="sm">5 users = medium</Text>
      </ActivityEdge>
      <ActivityEdge activeUsers={15} className="p-4 bg-[var(--color-bg-card)]">
        <Text size="sm">15 users = high</Text>
      </ActivityEdge>
    </div>
  ),
};

/**
 * Rounded variants
 */
export const RoundedVariants: Story = {
  render: () => (
    <div className="flex gap-4">
      <ActivityEdge warmth="medium" rounded="sm" className="p-4 bg-[var(--color-bg-card)]">
        <Text size="xs">sm</Text>
      </ActivityEdge>
      <ActivityEdge warmth="medium" rounded="default" className="p-4 bg-[var(--color-bg-card)]">
        <Text size="xs">default</Text>
      </ActivityEdge>
      <ActivityEdge warmth="medium" rounded="lg" className="p-4 bg-[var(--color-bg-card)]">
        <Text size="xs">lg</Text>
      </ActivityEdge>
      <ActivityEdge warmth="medium" rounded="full" className="p-6 bg-[var(--color-bg-card)]">
        <Text size="xs">full</Text>
      </ActivityEdge>
    </div>
  ),
};

/**
 * In context — Space card
 */
export const SpaceCardContext: Story = {
  render: () => (
    <div className="flex gap-4">
      <ActivityEdge warmth="high" rounded="lg">
        <Card className="w-64 p-4 !shadow-none">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-[var(--color-bg-elevated)]" />
            <div className="flex-1 min-w-0">
              <Text weight="medium">UB Coders</Text>
              <Text size="xs" tone="muted">847 members</Text>
              <div className="flex items-center gap-1 mt-1">
                <span className="w-2 h-2 rounded-full bg-[var(--color-accent-gold)]" />
                <Text size="xs" className="text-[var(--color-accent-gold)]">
                  23 online
                </Text>
              </div>
            </div>
          </div>
        </Card>
      </ActivityEdge>
      <ActivityEdge warmth="low" rounded="lg">
        <Card className="w-64 p-4 !shadow-none">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-[var(--color-bg-elevated)]" />
            <div className="flex-1 min-w-0">
              <Text weight="medium">Book Club</Text>
              <Text size="xs" tone="muted">156 members</Text>
              <div className="flex items-center gap-1 mt-1">
                <span className="w-2 h-2 rounded-full bg-[var(--color-accent-gold)]/50" />
                <Text size="xs" tone="muted">
                  2 online
                </Text>
              </div>
            </div>
          </div>
        </Card>
      </ActivityEdge>
    </div>
  ),
};

/**
 * In context — Chat panel
 */
export const ChatPanelContext: Story = {
  render: () => (
    <ActivityEdge warmth="medium" rounded="lg">
      <Card className="w-96 !shadow-none">
        <div className="p-4 border-b border-[var(--color-border)]">
          <div className="flex items-center justify-between">
            <Text weight="medium">#general</Text>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[var(--color-accent-gold)]" />
              <Text size="xs" className="text-[var(--color-accent-gold)]">
                8 active
              </Text>
            </div>
          </div>
        </div>
        <div className="p-4 h-32 flex items-center justify-center">
          <Text tone="muted" size="sm">Chat messages...</Text>
        </div>
      </Card>
    </ActivityEdge>
  ),
};

/**
 * CRITICAL: Edge-based, not background
 */
export const EdgeBasedNote: Story = {
  render: () => (
    <Card className="max-w-md p-6">
      <Text weight="medium" className="mb-4">Warmth = Edge Glow</Text>
      <div className="flex flex-col gap-4 mb-4">
        <ActivityEdge warmth="high" rounded="lg">
          <div className="p-4 bg-[var(--color-bg-card)]">
            <div className="flex items-center gap-2">
              <span className="text-[var(--color-status-success)]">✓</span>
              <Text size="sm">CORRECT: Edge-based glow (box-shadow inset)</Text>
            </div>
          </div>
        </ActivityEdge>
        <div className="p-4 rounded-lg bg-[var(--color-accent-gold)]/10">
          <div className="flex items-center gap-2">
            <span className="text-[var(--color-status-error)]">✗</span>
            <Text size="sm">WRONG: Background tint</Text>
          </div>
        </div>
      </div>
      <Text size="sm" tone="secondary">
        Warmth in HIVE is expressed through edge glow, not background color.
        This creates a subtle, non-intrusive activity indicator.
      </Text>
    </Card>
  ),
};
