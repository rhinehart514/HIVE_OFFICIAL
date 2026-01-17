'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { ThreadDrawer, type ThreadMessage } from './ThreadDrawer';

const meta: Meta<typeof ThreadDrawer> = {
  title: 'Design System/Components/ThreadDrawer',
  component: ThreadDrawer,
  parameters: {
    layout: 'fullscreen',
    backgrounds: { default: 'dark' },
  },
};

export default meta;
type Story = StoryObj<typeof ThreadDrawer>;

// Sample data
const parentMessage: ThreadMessage = {
  id: 'parent-1',
  authorId: 'user-1',
  authorName: 'Jane Doe',
  authorAvatar: undefined,
  content: 'Hey everyone! I wanted to share some thoughts about the upcoming hackathon. We should really focus on solving real problems that students face on campus.',
  timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
  reactions: [
    { emoji: '👍', count: 5, reacted: true },
    { emoji: '🔥', count: 3, reacted: false },
    { emoji: '💡', count: 2, reacted: false },
  ],
};

const replies: ThreadMessage[] = [
  {
    id: 'reply-1',
    authorId: 'user-2',
    authorName: 'John Smith',
    content: 'Great idea! I was thinking about something related to course scheduling.',
    timestamp: new Date(Date.now() - 90 * 60 * 1000),
    reactions: [{ emoji: '👍', count: 2, reacted: false }],
  },
  {
    id: 'reply-2',
    authorId: 'user-3',
    authorName: 'Alex Chen',
    content: 'Yeah, the current system is pretty frustrating. We could build something that actually shows you conflicts before you register.',
    timestamp: new Date(Date.now() - 60 * 60 * 1000),
  },
  {
    id: 'reply-3',
    authorId: 'user-1',
    authorName: 'Jane Doe',
    content: "Love that direction! Let's set up a meeting to brainstorm more ideas.",
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    reactions: [{ emoji: '🎉', count: 3, reacted: true }],
  },
  {
    id: 'reply-4',
    authorId: 'user-4',
    authorName: 'Sarah Wilson',
    content: 'Count me in! When works for everyone?',
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
  },
  {
    id: 'reply-5',
    authorId: 'user-2',
    authorName: 'John Smith',
    content: 'How about this Thursday at 4pm?',
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
  },
];

// Interactive demo wrapper
const ThreadDrawerDemo = ({ showBack = false }: { showBack?: boolean }) => {
  const [open, setOpen] = useState(true);
  const [replyValue, setReplyValue] = useState('');
  const [allReplies, setAllReplies] = useState(replies);

  const handleSubmitReply = (content: string) => {
    const newReply: ThreadMessage = {
      id: `reply-${Date.now()}`,
      authorId: 'current-user',
      authorName: 'You',
      content,
      timestamp: new Date(),
    };
    setAllReplies((prev) => [...prev, newReply]);
    setReplyValue('');
  };

  return (
    <div className="h-screen bg-[#0A0A0A]">
      {/* Simulated main content */}
      <div className="p-8">
        <p className="text-white mb-4">Main chat content area</p>
        <button
          onClick={() => setOpen(true)}
          className="px-4 py-2 bg-[#FFD700] text-black rounded-lg"
        >
          Open Thread
        </button>
      </div>

      <ThreadDrawer
        open={open}
        onClose={() => setOpen(false)}
        parentMessage={parentMessage}
        replies={allReplies}
        replyValue={replyValue}
        onReplyChange={setReplyValue}
        onSubmitReply={handleSubmitReply}
        showBack={showBack}
        onReactionClick={(id, emoji) => console.log('React:', id, emoji)}
        onMessageClick={(id) => console.log('Click message:', id)}
      />
    </div>
  );
};

/**
 * Default thread drawer with replies
 */
export const Default: Story = {
  render: () => <ThreadDrawerDemo />,
};

/**
 * With back button (mobile)
 */
export const WithBackButton: Story = {
  render: () => <ThreadDrawerDemo showBack />,
};

/**
 * Empty replies
 */
export const EmptyReplies: Story = {
  render: () => {
    const [open, setOpen] = useState(true);

    return (
      <div className="h-screen bg-[#0A0A0A]">
        <div className="p-8">
          <button
            onClick={() => setOpen(true)}
            className="px-4 py-2 bg-[#FFD700] text-black rounded-lg"
          >
            Open Thread
          </button>
        </div>

        <ThreadDrawer
          open={open}
          onClose={() => setOpen(false)}
          parentMessage={parentMessage}
          replies={[]}
        />
      </div>
    );
  },
};

/**
 * Loading state
 */
export const Loading: Story = {
  render: () => {
    const [open, setOpen] = useState(true);

    return (
      <div className="h-screen bg-[#0A0A0A]">
        <div className="p-8">
          <button
            onClick={() => setOpen(true)}
            className="px-4 py-2 bg-[#FFD700] text-black rounded-lg"
          >
            Open Thread
          </button>
        </div>

        <ThreadDrawer
          open={open}
          onClose={() => setOpen(false)}
          parentMessage={parentMessage}
          replies={[]}
          loading
        />
      </div>
    );
  },
};

/**
 * Long thread with many replies
 */
export const ManyReplies: Story = {
  render: () => {
    const [open, setOpen] = useState(true);
    const manyReplies: ThreadMessage[] = Array.from({ length: 20 }, (_, i) => ({
      id: `reply-${i}`,
      authorId: `user-${i % 5}`,
      authorName: ['Jane', 'John', 'Alex', 'Sarah', 'Mike'][i % 5],
      content: `This is reply number ${i + 1}. ${i % 3 === 0 ? 'This one is a bit longer to show how text wraps in the drawer.' : ''}`,
      timestamp: new Date(Date.now() - (20 - i) * 5 * 60 * 1000),
    }));

    return (
      <div className="h-screen bg-[#0A0A0A]">
        <div className="p-8">
          <button
            onClick={() => setOpen(true)}
            className="px-4 py-2 bg-[#FFD700] text-black rounded-lg"
          >
            Open Long Thread
          </button>
        </div>

        <ThreadDrawer
          open={open}
          onClose={() => setOpen(false)}
          parentMessage={parentMessage}
          replies={manyReplies}
        />
      </div>
    );
  },
};

/**
 * Thread with various reactions
 */
export const WithReactions: Story = {
  render: () => {
    const [open, setOpen] = useState(true);
    const repliesWithReactions: ThreadMessage[] = [
      {
        id: 'reply-1',
        authorId: 'user-2',
        authorName: 'John Smith',
        content: 'This is amazing! 🎉',
        timestamp: new Date(Date.now() - 60 * 60 * 1000),
        reactions: [
          { emoji: '🎉', count: 12, reacted: true },
          { emoji: '❤️', count: 8, reacted: false },
          { emoji: '🔥', count: 5, reacted: true },
          { emoji: '👏', count: 3, reacted: false },
        ],
      },
      {
        id: 'reply-2',
        authorId: 'user-3',
        authorName: 'Alex Chen',
        content: 'Totally agree with this!',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        reactions: [{ emoji: '💯', count: 7, reacted: false }],
      },
    ];

    return (
      <div className="h-screen bg-[#0A0A0A]">
        <div className="p-8">
          <button
            onClick={() => setOpen(true)}
            className="px-4 py-2 bg-[#FFD700] text-black rounded-lg"
          >
            Open Thread
          </button>
        </div>

        <ThreadDrawer
          open={open}
          onClose={() => setOpen(false)}
          parentMessage={{
            ...parentMessage,
            reactions: [
              { emoji: '👍', count: 24, reacted: true },
              { emoji: '❤️', count: 15, reacted: false },
              { emoji: '🔥', count: 11, reacted: true },
              { emoji: '💡', count: 8, reacted: false },
              { emoji: '🎯', count: 5, reacted: false },
            ],
          }}
          replies={repliesWithReactions}
          onReactionClick={(id, emoji) => console.log('Toggle reaction:', id, emoji)}
        />
      </div>
    );
  },
};
