import type { Meta, StoryObj } from '@storybook/react';
import { TypingIndicator, TypingIndicatorDots, TypingIndicatorBubble } from './TypingIndicator';
import { Text, Card } from '../primitives';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TYPINGINDICATOR VISUAL REFERENCE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * This component shows who is typing in a chat:
 *
 * STRUCTURE:
 *   [•••] Jane is typing...
 *
 * DOTS ANIMATION:
 *   - Three small dots (4px each)
 *   - Sequential bounce animation
 *   - 600ms cycle, infinite loop
 *   - Gray color (text-muted), NO gold
 *
 * VARIANTS:
 *   1. Inline text: "[•••] Jane is typing..."
 *   2. Dots only: "[•••]"
 *   3. Bubble: Avatar + bubble with dots inside
 *
 * TEXT PATTERNS:
 *   1 user:  "Jane is typing..."
 *   2 users: "Jane and John are typing..."
 *   3+ users: "Several people are typing..."
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

const meta: Meta<typeof TypingIndicator> = {
  title: 'Design System/Components/Chat/TypingIndicator',
  component: TypingIndicator,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Shows who is currently typing in a chat with animated dots.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof TypingIndicator>;

/**
 * Default — Single user
 */
export const Default: Story = {
  args: {
    users: [{ id: '1', name: 'Jane' }],
  },
};

/**
 * Two users typing
 */
export const TwoUsers: Story = {
  args: {
    users: [
      { id: '1', name: 'Jane' },
      { id: '2', name: 'John' },
    ],
  },
};

/**
 * Several people typing
 */
export const SeveralPeople: Story = {
  args: {
    users: [
      { id: '1', name: 'Jane' },
      { id: '2', name: 'John' },
      { id: '3', name: 'Alice' },
      { id: '4', name: 'Bob' },
    ],
  },
};

/**
 * Custom text
 */
export const CustomText: Story = {
  args: {
    users: [{ id: '1', name: 'Jane' }],
    customText: 'Someone is composing a message...',
  },
};

/**
 * Dots only
 */
export const DotsOnly: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Text size="sm" tone="muted">
        Dots only:
      </Text>
      <TypingIndicatorDots />
    </div>
  ),
};

/**
 * Bubble variant
 */
export const Bubble: Story = {
  render: () => (
    <TypingIndicatorBubble user={{ name: 'Jane' }} />
  ),
};

/**
 * Bubble with avatar
 */
export const BubbleWithAvatar: Story = {
  render: () => (
    <TypingIndicatorBubble
      user={{
        name: 'Jane',
        avatar: 'https://i.pravatar.cc/100?u=jane',
      }}
    />
  ),
};

/**
 * In context — Chat footer
 */
export const ChatFooterContext: Story = {
  render: () => (
    <Card className="w-96 overflow-hidden">
      {/* Messages area */}
      <div className="p-4 space-y-3">
        <div className="flex items-end gap-2">
          <div className="w-8 h-8 rounded-xl bg-[var(--color-bg-elevated)]" />
          <div className="px-4 py-2 rounded-2xl rounded-bl-md bg-[var(--color-bg-elevated)]">
            <Text size="sm">Hey, how are you?</Text>
          </div>
        </div>
        <div className="flex items-end gap-2 justify-end">
          <div className="px-4 py-2 rounded-2xl rounded-br-md bg-white/10">
            <Text size="sm">I&apos;m good, thanks!</Text>
          </div>
        </div>

        {/* Typing indicator */}
        <TypingIndicatorBubble user={{ name: 'Jane' }} />
      </div>

      {/* Footer bar */}
      <div className="px-4 py-2 border-t border-[var(--color-border)] bg-[var(--color-bg-elevated)]">
        <TypingIndicator users={[{ id: '1', name: 'Jane' }]} />
      </div>
    </Card>
  ),
};

/**
 * All variants
 */
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div>
        <Text size="xs" tone="muted" className="mb-2">
          Inline (1 user)
        </Text>
        <TypingIndicator users={[{ id: '1', name: 'Jane' }]} />
      </div>
      <div>
        <Text size="xs" tone="muted" className="mb-2">
          Inline (2 users)
        </Text>
        <TypingIndicator
          users={[
            { id: '1', name: 'Jane' },
            { id: '2', name: 'John' },
          ]}
        />
      </div>
      <div>
        <Text size="xs" tone="muted" className="mb-2">
          Inline (several)
        </Text>
        <TypingIndicator
          users={[
            { id: '1', name: 'Jane' },
            { id: '2', name: 'John' },
            { id: '3', name: 'Alice' },
          ]}
        />
      </div>
      <div>
        <Text size="xs" tone="muted" className="mb-2">
          Dots only
        </Text>
        <TypingIndicatorDots />
      </div>
      <div>
        <Text size="xs" tone="muted" className="mb-2">
          Bubble
        </Text>
        <TypingIndicatorBubble user={{ name: 'Jane' }} />
      </div>
    </div>
  ),
};
