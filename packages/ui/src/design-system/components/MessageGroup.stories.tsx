import type { Meta, StoryObj } from '@storybook/react';
import { MessageGroup, groupMessages } from './MessageGroup';
import { Card, Text } from '../primitives';

const meta: Meta<typeof MessageGroup> = {
  title: 'Design System/Components/Chat/MessageGroup',
  component: MessageGroup,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Groups consecutive messages from the same author.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof MessageGroup>;

const janeMessages = [
  {
    id: '1',
    content: 'Hey everyone!',
    author: { id: '1', name: 'Jane Doe' },
    timestamp: new Date(Date.now() - 300000),
  },
  {
    id: '2',
    content: 'Who is working on the hackathon project tonight?',
    author: { id: '1', name: 'Jane Doe' },
    timestamp: new Date(Date.now() - 290000),
  },
  {
    id: '3',
    content: "I'll be setting up the environment.",
    author: { id: '1', name: 'Jane Doe' },
    timestamp: new Date(Date.now() - 280000),
  },
];

export const Default: Story = {
  args: {
    messages: janeMessages,
    onReact: (id, emoji) => console.log(`Message ${id}: ${emoji}`),
    onReply: (id) => console.log(`Reply to ${id}`),
  },
};

export const SingleMessage: Story = {
  args: {
    messages: [janeMessages[0]],
  },
};

export const Compact: Story = {
  args: {
    messages: janeMessages,
    compact: true,
  },
};

export const WithReactions: Story = {
  args: {
    messages: [
      {
        ...janeMessages[0],
        reactions: [{ emoji: '👋', count: 3 }],
      },
      janeMessages[1],
      {
        ...janeMessages[2],
        reactions: [
          { emoji: '👍', count: 2 },
          { emoji: '🎉', count: 1 },
        ],
      },
    ],
    onReact: (id, emoji) => console.log(`Message ${id}: ${emoji}`),
  },
};

export const ChatConversation: Story = {
  render: () => {
    const allMessages = [
      {
        id: '1',
        content: 'Hey everyone!',
        author: { id: '1', name: 'Jane Doe' },
        timestamp: new Date(Date.now() - 600000),
      },
      {
        id: '2',
        content: 'Who is working on the hackathon tonight?',
        author: { id: '1', name: 'Jane Doe' },
        timestamp: new Date(Date.now() - 590000),
      },
      {
        id: '3',
        content: 'Count me in!',
        author: { id: '2', name: 'John Smith' },
        timestamp: new Date(Date.now() - 500000),
      },
      {
        id: '4',
        content: "I'll handle the backend.",
        author: { id: '2', name: 'John Smith' },
        timestamp: new Date(Date.now() - 490000),
      },
      {
        id: '5',
        content: "I'm also joining.",
        author: { id: '3', name: 'Alice Johnson' },
        timestamp: new Date(Date.now() - 400000),
      },
      {
        id: '6',
        content: 'Perfect! See you all at 6pm.',
        author: { id: '1', name: 'Jane Doe' },
        timestamp: new Date(Date.now() - 300000),
        reactions: [{ emoji: '👍', count: 2 }],
      },
    ];

    const groups = groupMessages(allMessages);

    return (
      <Card className="w-[500px] p-4">
        <div className="space-y-4">
          {groups.map((group, i) => (
            <MessageGroup key={i} messages={group} />
          ))}
        </div>
      </Card>
    );
  },
};

export const GroupingLogic: Story = {
  render: () => {
    const messages = [
      {
        id: '1',
        content: 'First message',
        author: { id: '1', name: 'Jane' },
        timestamp: new Date(Date.now() - 600000),
      },
      {
        id: '2',
        content: 'Same author, within 5 min (grouped)',
        author: { id: '1', name: 'Jane' },
        timestamp: new Date(Date.now() - 590000),
      },
      {
        id: '3',
        content: 'Different author (new group)',
        author: { id: '2', name: 'John' },
        timestamp: new Date(Date.now() - 580000),
      },
      {
        id: '4',
        content: 'Same author, > 5 min gap (new group)',
        author: { id: '1', name: 'Jane' },
        timestamp: new Date(Date.now() - 200000),
      },
    ];

    const groups = groupMessages(messages);

    return (
      <Card className="w-[500px] p-4">
        <Text size="sm" weight="medium" className="mb-4">
          Grouping: Same author + within 5 minutes
        </Text>
        <div className="space-y-6">
          {groups.map((group, i) => (
            <div key={i} className="border-l-2 border-[var(--color-border)] pl-3">
              <Text size="xs" tone="muted" className="mb-2">
                Group {i + 1}
              </Text>
              <MessageGroup messages={group} />
            </div>
          ))}
        </div>
      </Card>
    );
  },
};
