import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';
import { ChatMessage } from './ChatMessage';
import { Text } from '../primitives';

/**
 * # ChatMessage
 *
 * **LOCKED:** Discord × Apple Hybrid — Glass Bubbles (V2)
 *
 * Individual chat message with frosted glass bubbles,
 * gold-tinted own messages, and Discord-style hover actions.
 *
 * ## Design Decisions
 * - **Others:** `bg-white/5 backdrop-blur-sm` with `border-white/10`
 * - **You:** `bg-gold/15 backdrop-blur-sm` with `border-gold/20`
 * - **Actions:** Discord-style hover bar (react, reply, pin)
 * - **Reactions:** Inline pill chips with counts
 * - **Timestamps:** Always visible inline
 */
const meta: Meta<typeof ChatMessage> = {
  title: 'Design System/Components/ChatMessage',
  component: ChatMessage,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    backgrounds: { default: 'dark' },
    docs: {
      description: {
        component:
          'Glass bubble chat messages with Discord hover actions. LOCKED: January 11, 2026.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ChatMessage>;

// ============================================
// SHOWCASE: Full Conversation
// ============================================

export const Showcase: Story = {
  render: () => (
    <div className="min-h-screen bg-[var(--color-bg-ground)] p-8">
      <div className="max-w-[600px] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Text size="lg" weight="semibold" className="mb-1">
            ChatMessage — Glass Bubbles
          </Text>
          <Text size="sm" tone="muted">
            Hover messages to see action bar. Gold bubbles = your messages.
          </Text>
        </div>

        {/* Conversation */}
        <div className="bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border)] p-4 space-y-3">
          <ChatMessage
            message={{
              id: '1',
              content: 'Hey everyone! Who is working on the hackathon project tonight?',
              author: { id: '1', name: 'Jane Doe' },
              timestamp: new Date(Date.now() - 300000),
            }}
            onReact={(emoji) => console.log(`React: ${emoji}`)}
            onReply={() => console.log('Reply')}
            onPin={() => console.log('Pin')}
          />

          <ChatMessage
            message={{
              id: '2',
              content: "I'll be there! Working on the frontend components.",
              author: { id: 'me', name: 'You' },
              timestamp: new Date(Date.now() - 280000),
              isOwn: true,
            }}
            onReact={(emoji) => console.log(`React: ${emoji}`)}
            onReply={() => console.log('Reply')}
          />

          <ChatMessage
            message={{
              id: '3',
              content: 'Count me in! I can help with the backend API.',
              author: { id: '2', name: 'John Smith' },
              timestamp: new Date(Date.now() - 240000),
              reactions: [
                { emoji: '👍', count: 2, hasReacted: true },
              ],
            }}
            onReact={(emoji) => console.log(`React: ${emoji}`)}
            onReply={() => console.log('Reply')}
            onPin={() => console.log('Pin')}
          />

          <ChatMessage
            message={{
              id: '4',
              content: 'Perfect! See you all at 6pm in Davis Hall. This is going to be great!',
              author: { id: '3', name: 'Alice Johnson' },
              timestamp: new Date(Date.now() - 180000),
              reactions: [
                { emoji: '🎉', count: 3 },
                { emoji: '🔥', count: 2 },
              ],
            }}
            onReact={(emoji) => console.log(`React: ${emoji}`)}
            onReply={() => console.log('Reply')}
            onPin={() => console.log('Pin')}
          />

          <ChatMessage
            message={{
              id: '5',
              content: 'See you there!',
              author: { id: 'me', name: 'You' },
              timestamp: new Date(Date.now() - 120000),
              isOwn: true,
              reactions: [
                { emoji: '👍', count: 1 },
              ],
            }}
            onReact={(emoji) => console.log(`React: ${emoji}`)}
            onReply={() => console.log('Reply')}
          />
        </div>
      </div>
    </div>
  ),
};

// ============================================
// INDIVIDUAL STATES
// ============================================

const mockMessage = {
  id: '1',
  content: 'Hey everyone! Who is working on the hackathon project tonight?',
  author: {
    id: '1',
    name: 'Jane Doe',
    avatar: undefined,
  },
  timestamp: new Date(),
};

const MessageWrapper = ({ children, label }: { children: React.ReactNode; label: string }) => (
  <div className="min-h-screen bg-[var(--color-bg-ground)] p-8">
    <div className="max-w-[500px] mx-auto">
      <Text size="sm" tone="muted" className="mb-4">{label}</Text>
      <div className="bg-[var(--color-bg-card)] rounded-xl border border-[var(--color-border)] p-4">
        {children}
      </div>
    </div>
  </div>
);

export const Default: Story = {
  render: () => (
    <MessageWrapper label="Default message from another user — glass bubble with white/5 background">
      <ChatMessage
        message={mockMessage}
        onReact={(emoji) => console.log(`React: ${emoji}`)}
        onReply={() => console.log('Reply')}
        onPin={() => console.log('Pin')}
      />
    </MessageWrapper>
  ),
};

export const OwnMessage: Story = {
  render: () => (
    <MessageWrapper label="Your message — gold-tinted glass bubble, right-aligned header">
      <ChatMessage
        message={{
          ...mockMessage,
          id: '2',
          isOwn: true,
          content: "I'll be there! Working on the frontend components.",
        }}
        onReact={(emoji) => console.log(`React: ${emoji}`)}
        onReply={() => console.log('Reply')}
      />
    </MessageWrapper>
  ),
};

export const WithReactions: Story = {
  render: () => (
    <MessageWrapper label="Message with reactions — pill chips below bubble">
      <ChatMessage
        message={{
          ...mockMessage,
          reactions: [
            { emoji: '👍', count: 3, hasReacted: true },
            { emoji: '🎉', count: 2 },
            { emoji: '❤️', count: 1 },
          ],
        }}
        onReact={(emoji) => console.log(`React: ${emoji}`)}
      />
    </MessageWrapper>
  ),
};

export const Pinned: Story = {
  render: () => (
    <MessageWrapper label="Pinned message — gold background tint + pin indicator">
      <ChatMessage
        message={{
          ...mockMessage,
          isPinned: true,
          content: 'Important: Meeting moved to 7pm tomorrow!',
        }}
        onPin={() => console.log('Unpin')}
      />
    </MessageWrapper>
  ),
};

export const Compact: Story = {
  render: () => (
    <MessageWrapper label="Compact mode — smaller avatar and text">
      <ChatMessage
        message={mockMessage}
        compact
      />
    </MessageWrapper>
  ),
};

export const GroupedMessages: Story = {
  render: () => (
    <MessageWrapper label="Grouped messages — subsequent messages hide author/avatar">
      <div className="space-y-1">
        <ChatMessage
          message={{
            id: '1',
            content: 'Hey everyone!',
            author: { id: '1', name: 'Jane Doe' },
            timestamp: new Date(Date.now() - 120000),
          }}
        />
        <ChatMessage
          message={{
            id: '2',
            content: 'Who is working on the hackathon project tonight?',
            author: { id: '1', name: 'Jane Doe' },
            timestamp: new Date(Date.now() - 115000),
          }}
          showAuthor={false}
        />
        <ChatMessage
          message={{
            id: '3',
            content: 'We need to finalize the design by tomorrow.',
            author: { id: '1', name: 'Jane Doe' },
            timestamp: new Date(Date.now() - 110000),
          }}
          showAuthor={false}
        />
      </div>
    </MessageWrapper>
  ),
};

export const OwnGroupedMessages: Story = {
  render: () => (
    <MessageWrapper label="Grouped own messages — gold bubbles stacked">
      <div className="space-y-1">
        <ChatMessage
          message={{
            id: '1',
            content: "I'll be there!",
            author: { id: 'me', name: 'You' },
            timestamp: new Date(Date.now() - 120000),
            isOwn: true,
          }}
        />
        <ChatMessage
          message={{
            id: '2',
            content: 'Working on the frontend components.',
            author: { id: 'me', name: 'You' },
            timestamp: new Date(Date.now() - 115000),
            isOwn: true,
          }}
          showAuthor={false}
        />
        <ChatMessage
          message={{
            id: '3',
            content: 'Should be done by 6pm.',
            author: { id: 'me', name: 'You' },
            timestamp: new Date(Date.now() - 110000),
            isOwn: true,
          }}
          showAuthor={false}
        />
      </div>
    </MessageWrapper>
  ),
};

// ============================================
// DESIGN SPEC
// ============================================

export const DesignSpec: Story = {
  render: () => (
    <div className="min-h-screen bg-[var(--color-bg-ground)] p-8">
      <div className="max-w-[800px] mx-auto space-y-8">
        <div>
          <Text size="xl" weight="semibold" className="mb-2">
            ChatMessage Design Spec
          </Text>
          <Text tone="muted">
            LOCKED: January 11, 2026 — Discord × Apple Hybrid (Glass Bubbles V2)
          </Text>
        </div>

        {/* Spec Grid */}
        <div className="grid grid-cols-2 gap-6">
          {/* Others */}
          <div className="bg-[var(--color-bg-card)] rounded-xl border border-[var(--color-border)] p-4">
            <Text size="sm" weight="medium" className="mb-3">Other Users</Text>
            <ChatMessage
              message={{
                id: '1',
                content: 'Example message from another user.',
                author: { id: '1', name: 'Jane Doe' },
                timestamp: new Date(),
              }}
            />
            <div className="mt-4 pt-4 border-t border-[var(--color-border)] space-y-1 text-xs text-[var(--color-text-muted)]">
              <div>bg-white/5 backdrop-blur-sm</div>
              <div>border border-white/10</div>
              <div>rounded-2xl rounded-tl-sm</div>
            </div>
          </div>

          {/* Own */}
          <div className="bg-[var(--color-bg-card)] rounded-xl border border-[var(--color-border)] p-4">
            <Text size="sm" weight="medium" className="mb-3">Your Messages</Text>
            <ChatMessage
              message={{
                id: '2',
                content: 'Example of your own message.',
                author: { id: 'me', name: 'You' },
                timestamp: new Date(),
                isOwn: true,
              }}
            />
            <div className="mt-4 pt-4 border-t border-[var(--color-border)] space-y-1 text-xs text-[var(--color-text-muted)]">
              <div>bg-gold/15 backdrop-blur-sm</div>
              <div>border border-gold/20</div>
              <div>rounded-2xl rounded-tr-sm</div>
            </div>
          </div>

          {/* Reactions */}
          <div className="bg-[var(--color-bg-card)] rounded-xl border border-[var(--color-border)] p-4">
            <Text size="sm" weight="medium" className="mb-3">Reactions</Text>
            <ChatMessage
              message={{
                id: '3',
                content: 'Message with reactions.',
                author: { id: '1', name: 'Jane Doe' },
                timestamp: new Date(),
                reactions: [
                  { emoji: '👍', count: 3, hasReacted: true },
                  { emoji: '🎉', count: 2 },
                ],
              }}
              onReact={() => {}}
            />
            <div className="mt-4 pt-4 border-t border-[var(--color-border)] space-y-1 text-xs text-[var(--color-text-muted)]">
              <div>Inline pill chips</div>
              <div>ring-1 for own reactions</div>
              <div>Hover action bar for adding</div>
            </div>
          </div>

          {/* Pinned */}
          <div className="bg-[var(--color-bg-card)] rounded-xl border border-[var(--color-border)] p-4">
            <Text size="sm" weight="medium" className="mb-3">Pinned Message</Text>
            <ChatMessage
              message={{
                id: '4',
                content: 'Important pinned message.',
                author: { id: '1', name: 'Jane Doe' },
                timestamp: new Date(),
                isPinned: true,
              }}
            />
            <div className="mt-4 pt-4 border-t border-[var(--color-border)] space-y-1 text-xs text-[var(--color-text-muted)]">
              <div>bg-gold/5 background tint</div>
              <div>Pin emoji in header</div>
            </div>
          </div>
        </div>

        {/* Implementation */}
        <div className="bg-[var(--color-bg-card)] rounded-xl border border-[var(--color-border)] p-6">
          <Text size="sm" weight="medium" className="mb-4">Implementation</Text>
          <pre className="text-xs text-[var(--color-text-secondary)] bg-[var(--color-bg-ground)] rounded-lg p-4 overflow-x-auto">
{`<ChatMessage
  message={{
    id: string,
    content: string,
    author: { id: string, name: string, avatar?: string },
    timestamp: Date,
    isOwn?: boolean,
    isPinned?: boolean,
    reactions?: Array<{ emoji: string, count: number, hasReacted?: boolean }>,
  }}
  showAuthor={true}      // false for grouped messages
  showTimestamp={true}   // always visible by default
  compact={false}        // smaller avatar + text
  onReact={(emoji) => {}}
  onReply={() => {}}
  onPin={() => {}}
/>`}
          </pre>
        </div>
      </div>
    </div>
  ),
};
