import type { Meta, StoryObj } from '@storybook/react';
import {
  ReactionBadge,
  ReactionBadgeExpanded,
  ReactionBadgeGroup,
} from './ReactionBadge';
import { Text, Card } from '../primitives';

const meta: Meta<typeof ReactionBadge> = {
  title: 'Design System/Components/Chat/ReactionBadge',
  component: ReactionBadge,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Emoji reaction badge showing count. Compact variant with tooltip, expanded with user names.',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['compact', 'expanded'],
    },
    hasReacted: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ReactionBadge>;

/**
 * Default — Compact badge
 */
export const Default: Story = {
  args: {
    emoji: '👍',
    count: 5,
    users: ['Jane Doe', 'John Smith', 'Alice Johnson'],
  },
};

/**
 * User has reacted (gold highlight)
 */
export const HasReacted: Story = {
  args: {
    emoji: '❤️',
    count: 12,
    hasReacted: true,
    users: ['You', 'Jane Doe', 'John Smith', 'Alice Johnson'],
  },
  parameters: {
    docs: {
      description: {
        story: 'When user has reacted, badge gets gold accent styling.',
      },
    },
  },
};

/**
 * With tooltip
 */
export const WithTooltip: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Text size="sm" tone="muted">
        Hover to see who reacted:
      </Text>
      <ReactionBadge
        emoji="🔥"
        count={8}
        users={[
          'Jane Doe',
          'John Smith',
          'Alice Johnson',
          'Bob Wilson',
          'Carol Martinez',
          'Dave Brown',
          'Eve Davis',
          'Frank Miller',
        ]}
      />
    </div>
  ),
};

/**
 * Reaction group
 */
export const Group: Story = {
  render: () => (
    <ReactionBadgeGroup
      reactions={[
        { emoji: '👍', count: 12, users: ['Jane', 'John'], hasReacted: true },
        { emoji: '❤️', count: 8, users: ['Alice', 'Bob'] },
        { emoji: '😂', count: 5, users: ['Carol'] },
        { emoji: '🔥', count: 3, users: ['Dave'] },
      ]}
      onToggle={(emoji) => console.log('Toggle:', emoji)}
    />
  ),
};

/**
 * Expanded variant
 */
export const Expanded: Story = {
  render: () => (
    <ReactionBadgeExpanded
      emoji="👍"
      count={5}
      users={['Jane Doe', 'John Smith', 'Alice Johnson', 'Bob Wilson', 'Carol']}
      onClick={() => console.log('Clicked')}
    />
  ),
};

/**
 * In context — Chat message with reactions
 */
export const ChatMessageContext: Story = {
  render: () => (
    <Card className="max-w-md p-3">
      <div className="flex gap-3">
        <div className="w-8 h-8 rounded-xl bg-[var(--color-bg-elevated)]" />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Text weight="medium" size="sm">
              Jane Doe
            </Text>
            <Text size="xs" tone="muted">
              2:34 PM
            </Text>
          </div>
          <Text size="sm" className="mt-1">
            Hey! Anyone want to study for the midterm?
          </Text>

          {/* Reactions row */}
          <div className="mt-2">
            <ReactionBadgeGroup
              reactions={[
                { emoji: '👍', count: 4, hasReacted: true },
                { emoji: '📚', count: 2 },
                { emoji: '🔥', count: 1 },
              ]}
              onToggle={(emoji) => console.log('Toggle:', emoji)}
            />
          </div>
        </div>
      </div>
    </Card>
  ),
};

/**
 * All variants comparison
 */
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div>
        <Text size="xs" tone="muted" className="mb-2">
          Compact (default)
        </Text>
        <div className="flex gap-2">
          <ReactionBadge emoji="👍" count={5} />
          <ReactionBadge emoji="❤️" count={12} hasReacted />
          <ReactionBadge emoji="🔥" count={3} />
        </div>
      </div>
      <div>
        <Text size="xs" tone="muted" className="mb-2">
          With tooltip (hover)
        </Text>
        <ReactionBadge
          emoji="😂"
          count={7}
          users={['Jane', 'John', 'Alice', 'Bob']}
        />
      </div>
      <div>
        <Text size="xs" tone="muted" className="mb-2">
          Expanded (with names)
        </Text>
        <ReactionBadgeExpanded
          emoji="🎉"
          count={4}
          users={['Jane Doe', 'John Smith', 'Alice Johnson', 'Bob']}
        />
      </div>
      <div>
        <Text size="xs" tone="muted" className="mb-2">
          Group
        </Text>
        <ReactionBadgeGroup
          reactions={[
            { emoji: '👍', count: 12, hasReacted: true },
            { emoji: '❤️', count: 8 },
            { emoji: '😂', count: 5 },
            { emoji: '🔥', count: 3 },
            { emoji: '👀', count: 2 },
          ]}
        />
      </div>
    </div>
  ),
};
