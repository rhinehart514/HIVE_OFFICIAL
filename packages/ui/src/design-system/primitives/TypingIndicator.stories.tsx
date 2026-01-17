import type { Meta, StoryObj } from '@storybook/react';
import { TypingIndicator, TypingDotsOnly } from './TypingIndicator';
import { Text } from './Text';
import { Card } from './Card';

/**
 * TypingIndicator — Shows who is typing
 *
 * CRITICAL: GOLD dots when multiple users are typing!
 * This indicates activity and uses gold from the budget.
 *
 * @see docs/design-system/PRIMITIVES.md (TypingIndicator)
 */
const meta: Meta<typeof TypingIndicator> = {
  title: 'Design System/Primitives/Life/TypingIndicator',
  component: TypingIndicator,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          '⚠️ GOLD when multiple users! TypingIndicator shows who is typing with animated dots.',
      },
    },
  },
  argTypes: {
    users: {
      control: 'object',
      description: 'Array of user names who are typing',
    },
    size: {
      control: 'select',
      options: ['sm', 'default', 'lg'],
      description: 'Indicator size',
    },
    maxNames: {
      control: { type: 'number', min: 1, max: 5 },
      description: 'Maximum names to show',
    },
    showDots: {
      control: 'boolean',
      description: 'Show animated dots',
    },
  },
};

export default meta;
type Story = StoryObj<typeof TypingIndicator>;

/**
 * Single user typing — Gray dots
 */
export const SingleUser: Story = {
  args: {
    users: ['Jane'],
  },
  parameters: {
    docs: {
      description: {
        story: 'Single user typing shows gray dots (minimal activity).',
      },
    },
  },
};

/**
 * Multiple users typing — GOLD dots
 */
export const MultipleUsers: Story = {
  args: {
    users: ['Jane', 'John'],
  },
  parameters: {
    docs: {
      description: {
        story: '✨ GOLD dots! Multiple users typing indicates activity.',
      },
    },
  },
};

/**
 * Three users typing
 */
export const ThreeUsers: Story = {
  args: {
    users: ['Jane', 'John', 'Alice'],
  },
};

/**
 * Many users typing
 */
export const ManyUsers: Story = {
  args: {
    users: ['Jane', 'John', 'Alice', 'Bob', 'Charlie'],
    maxNames: 3,
  },
};

/**
 * All sizes
 */
export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <TypingIndicator users={['Jane', 'John']} size="sm" />
      <TypingIndicator users={['Jane', 'John']} size="default" />
      <TypingIndicator users={['Jane', 'John']} size="lg" />
    </div>
  ),
};

/**
 * Without dots
 */
export const WithoutDots: Story = {
  args: {
    users: ['Jane', 'John'],
    showDots: false,
  },
};

/**
 * TypingDotsOnly — Compact version
 */
export const DotsOnlyVariant: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <TypingDotsOnly isTyping isMultiple={false} />
        <Text size="sm" tone="muted">Single user (gray)</Text>
      </div>
      <div className="flex items-center gap-3">
        <TypingDotsOnly isTyping isMultiple />
        <Text size="sm" className="text-[var(--color-accent-gold)]">Multiple users (GOLD)</Text>
      </div>
    </div>
  ),
};

/**
 * In context — Chat input area
 */
export const ChatInputContext: Story = {
  render: () => (
    <Card className="w-96">
      <div className="p-4 border-b border-[var(--color-border)]">
        <Text weight="medium">#general</Text>
      </div>
      <div className="h-32 p-4 flex items-end">
        <Text tone="muted" size="sm">Messages would appear here...</Text>
      </div>
      <div className="px-4 py-2 border-t border-[var(--color-border)] bg-[var(--color-bg-elevated)]">
        <TypingIndicator users={['Jane', 'John']} size="sm" />
      </div>
      <div className="p-3 border-t border-[var(--color-border)]">
        <div className="h-10 rounded-lg bg-[var(--color-bg-page)] border border-[var(--color-border)]" />
      </div>
    </Card>
  ),
};

/**
 * In context — Message thread
 */
export const MessageThreadContext: Story = {
  render: () => (
    <div className="w-80 space-y-3">
      {/* Messages */}
      <div className="flex gap-2">
        <div className="w-8 h-8 rounded-lg bg-[var(--color-bg-elevated)] flex-shrink-0" />
        <div className="p-2 rounded-lg bg-[var(--color-bg-elevated)] max-w-[80%]">
          <Text size="sm">Hey, anyone working on the project?</Text>
        </div>
      </div>
      <div className="flex gap-2">
        <div className="w-8 h-8 rounded-lg bg-[var(--color-bg-elevated)] flex-shrink-0" />
        <div className="p-2 rounded-lg bg-[var(--color-bg-elevated)] max-w-[80%]">
          <Text size="sm">Yeah, I'm finishing up the design!</Text>
        </div>
      </div>
      {/* Typing indicator */}
      <div className="pl-10">
        <TypingIndicator users={['Alice', 'Bob', 'Charlie']} size="sm" />
      </div>
    </div>
  ),
};

/**
 * In context — Direct message
 */
export const DirectMessageContext: Story = {
  render: () => (
    <Card className="w-72">
      <div className="p-3 border-b border-[var(--color-border)] flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-[var(--color-bg-elevated)]" />
        <Text size="sm" weight="medium">Jane Doe</Text>
      </div>
      <div className="h-24 p-3 flex items-end">
        <TypingIndicator users={['Jane']} size="sm" />
      </div>
    </Card>
  ),
};

/**
 * Activity comparison
 */
export const ActivityComparison: Story = {
  render: () => (
    <div className="space-y-6">
      <Card className="p-4">
        <Text size="sm" weight="medium" className="mb-3">Low Activity</Text>
        <TypingIndicator users={['Jane']} />
        <Text size="xs" tone="muted" className="mt-2">
          Gray dots — single user, minimal activity
        </Text>
      </Card>
      <Card className="p-4">
        <Text size="sm" weight="medium" className="mb-3">High Activity</Text>
        <TypingIndicator users={['Jane', 'John', 'Alice']} />
        <Text size="xs" className="mt-2 text-[var(--color-accent-gold)]">
          GOLD dots — multiple users, active conversation
        </Text>
      </Card>
    </div>
  ),
};

/**
 * Gold discipline note
 */
export const GoldDisciplineNote: Story = {
  render: () => (
    <Card className="max-w-md p-6">
      <Text weight="medium" className="mb-4">Typing = Activity Signal</Text>
      <div className="space-y-4 mb-4">
        <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-bg-elevated)]">
          <TypingIndicator users={['Jane']} size="sm" />
          <Text size="xs" tone="muted">Gray (1 user)</Text>
        </div>
        <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-bg-elevated)]">
          <TypingIndicator users={['Jane', 'John']} size="sm" />
          <Text size="xs" className="text-[var(--color-accent-gold)]">GOLD (2+ users)</Text>
        </div>
      </div>
      <Text size="sm" tone="secondary" className="mb-4">
        Gold dots indicate an active, lively conversation. This helps users
        identify where engagement is happening in real-time.
      </Text>
      <div className="p-3 rounded-lg bg-[var(--color-accent-gold)]/10 border border-[var(--color-accent-gold)]/30">
        <Text size="xs" className="text-[var(--color-accent-gold)]">
          Gold budget: 1-2% of the interface
        </Text>
        <Text size="xs" tone="muted" className="mt-1">
          TypingIndicator uses gold sparingly — only when multiple users are
          typing to signal activity, not decoration.
        </Text>
      </div>
    </Card>
  ),
};

/**
 * Empty state
 */
export const EmptyState: Story = {
  args: {
    users: [],
  },
  parameters: {
    docs: {
      description: {
        story: 'Returns null when no users are typing.',
      },
    },
  },
};
