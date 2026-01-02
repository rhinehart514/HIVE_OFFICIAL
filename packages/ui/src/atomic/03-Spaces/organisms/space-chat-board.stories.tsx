'use client';

import * as React from 'react';

import { SpaceChatBoard, type SpaceChatBoardProps, type SpaceBoardData, type ChatMessageData, type TypingUser } from './space-chat-board';

import type { Meta, StoryObj } from '@storybook/react';

// ============================================================
// Mock Data Generators
// ============================================================

const mockBoards: SpaceBoardData[] = [
  { id: 'general', name: 'General', type: 'general', description: 'Main discussion channel', messageCount: 0 },
  { id: 'events', name: 'Events', type: 'events', description: 'Upcoming events and RSVPs', messageCount: 3 },
  { id: 'resources', name: 'Resources', type: 'resources', description: 'Shared files and links', messageCount: 0 },
];

const mockBoardsLocked: SpaceBoardData[] = [
  { id: 'general', name: 'General', type: 'general', description: 'Main discussion', messageCount: 0 },
  { id: 'announcements', name: 'Announcements', type: 'announcements', description: 'Leaders only', messageCount: 0, isLocked: true },
];

function createMockMessage(overrides: Partial<ChatMessageData> = {}): ChatMessageData {
  return {
    id: `msg-${Math.random().toString(36).slice(2)}`,
    type: 'text',
    content: 'Hello everyone!',
    timestamp: Date.now(),
    authorId: 'user-1',
    authorName: 'Alex Chen',
    authorAvatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
    authorRole: 'member',
    reactions: [],
    threadCount: 0,
    isPinned: false,
    isDeleted: false,
    ...overrides,
  };
}

function createConversation(count: number): ChatMessageData[] {
  const users = [
    { id: 'user-1', name: 'Alex Chen', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop', role: 'owner' as const },
    { id: 'user-2', name: 'Sarah Kim', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop', role: 'admin' as const },
    { id: 'user-3', name: 'Mike Johnson', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop', role: 'member' as const },
    { id: 'user-4', name: 'Emma Wilson', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop', role: 'moderator' as const },
  ];

  const sampleMessages = [
    "Hey everyone! Excited for our upcoming hackathon!",
    "Can't wait! What projects are you all thinking about?",
    "I'm thinking of building an AI study buddy app.",
    "That sounds awesome! Need a frontend dev?",
    "Yes! DM me if you want to team up.",
    "When is the registration deadline?",
    "It's this Friday at midnight.",
    "Perfect, I'll sign up tonight.",
    "Don't forget to join the Discord for updates!",
    "Already there! The #general channel is super active.",
    "Anyone need help with their project pitch?",
    "I could use some feedback on mine.",
    "Happy to help! Share it in the resources channel.",
    "Thanks! I'll post it after dinner.",
    "Looking forward to seeing everyone's ideas!",
  ];

  const messages: ChatMessageData[] = [];
  const baseTime = Date.now() - count * 60000;

  for (let i = 0; i < count; i++) {
    const user = users[i % users.length];
    messages.push(createMockMessage({
      id: `msg-${i}`,
      content: sampleMessages[i % sampleMessages.length],
      timestamp: baseTime + i * 60000,
      authorId: user.id,
      authorName: user.name,
      authorAvatarUrl: user.avatar,
      authorRole: user.role,
    }));
  }

  return messages;
}

const baseMessages = createConversation(8);

// ============================================================
// Meta Configuration
// ============================================================

const meta = {
  title: '03-Spaces/Organisms/SpaceChatBoard',
  component: SpaceChatBoard,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Full-featured chat board for Spaces with virtual scrolling, board switching, reactions, threading, typing indicators, and inline component support. Matches Discord-like UX with HIVE design system.',
      },
    },
    backgrounds: {
      default: 'dark',
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="h-[600px] bg-black">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SpaceChatBoard>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default props for most stories
const defaultProps: SpaceChatBoardProps = {
  spaceId: 'space-123',
  spaceName: 'Design Club',
  boards: mockBoards,
  activeBoardId: 'general',
  messages: baseMessages,
  currentUserId: 'user-1',
  currentUserName: 'Alex Chen',
  currentUserRole: 'owner',
  isLeader: true,
  canPost: true,
  onBoardChange: () => {},
  onSendMessage: async () => {},
};

// ============================================================
// BASIC STATES
// ============================================================

export const Default: Story = {
  args: defaultProps,
  parameters: {
    docs: {
      description: {
        story: 'Default chat board with messages, board tabs, and input area.',
      },
    },
  },
};

export const Loading: Story = {
  args: {
    ...defaultProps,
    isLoading: true,
    messages: [],
  },
  parameters: {
    docs: {
      description: {
        story: 'Loading state while messages are being fetched.',
      },
    },
  },
};

export const Empty: Story = {
  args: {
    ...defaultProps,
    messages: [],
  },
  parameters: {
    docs: {
      description: {
        story: 'Empty state when no messages exist in the channel.',
      },
    },
  },
};

export const SingleBoard: Story = {
  args: {
    ...defaultProps,
    boards: [{ id: 'general', name: 'General', type: 'general', description: 'Main channel', messageCount: 0 }],
  },
  parameters: {
    docs: {
      description: {
        story: 'Chat board with only one board (no tab bar shown).',
      },
    },
  },
};

// ============================================================
// BOARD VARIATIONS
// ============================================================

export const MultipleBoards: Story = {
  args: {
    ...defaultProps,
    boards: [
      { id: 'general', name: 'General', type: 'general', messageCount: 0 },
      { id: 'events', name: 'Events', type: 'events', messageCount: 5 },
      { id: 'resources', name: 'Resources', type: 'resources', messageCount: 2 },
      { id: 'off-topic', name: 'Off-Topic', type: 'general', messageCount: 0 },
      { id: 'projects', name: 'Projects', type: 'resources', messageCount: 12 },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Multiple boards with unread message indicators.',
      },
    },
  },
};

export const LockedBoard: Story = {
  args: {
    ...defaultProps,
    boards: mockBoardsLocked,
    activeBoardId: 'announcements',
    canPost: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Locked board where members cannot post messages.',
      },
    },
  },
};

export const ManyUnreadMessages: Story = {
  args: {
    ...defaultProps,
    boards: [
      { id: 'general', name: 'General', type: 'general', messageCount: 0 },
      { id: 'events', name: 'Events', type: 'events', messageCount: 99 },
      { id: 'resources', name: 'Resources', type: 'resources', messageCount: 150 },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Board tabs with many unread messages (99+ display).',
      },
    },
  },
};

// ============================================================
// MESSAGE VARIATIONS
// ============================================================

export const WithReactions: Story = {
  args: {
    ...defaultProps,
    messages: [
      createMockMessage({
        id: 'msg-1',
        content: 'Great news everyone! We got approved for the hackathon funding! 🎉',
        authorRole: 'owner',
        reactions: [
          { emoji: '🎉', count: 5, hasReacted: true },
          { emoji: '❤️', count: 3, hasReacted: false },
          { emoji: '👏', count: 8, hasReacted: true },
        ],
      }),
      createMockMessage({
        id: 'msg-2',
        content: 'Amazing! This is going to be awesome.',
        authorId: 'user-2',
        authorName: 'Sarah Kim',
        timestamp: Date.now() - 30000,
        reactions: [
          { emoji: '💯', count: 2, hasReacted: false },
        ],
      }),
      ...baseMessages.slice(2),
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Messages with reaction pills (gold highlight for reacted).',
      },
    },
  },
};

export const WithThreads: Story = {
  args: {
    ...defaultProps,
    messages: [
      createMockMessage({
        id: 'msg-1',
        content: 'Who wants to organize the next workshop?',
        authorRole: 'owner',
        threadCount: 12,
      }),
      createMockMessage({
        id: 'msg-2',
        content: 'Should we do it this weekend or next?',
        authorId: 'user-3',
        authorName: 'Mike Johnson',
        timestamp: Date.now() - 60000,
        threadCount: 3,
      }),
      ...baseMessages.slice(2),
    ],
    onViewThread: (messageId: string) => console.log('View thread:', messageId),
  },
  parameters: {
    docs: {
      description: {
        story: 'Messages with thread indicators showing reply counts.',
      },
    },
  },
};

export const WithPinnedMessages: Story = {
  args: {
    ...defaultProps,
    messages: [
      createMockMessage({
        id: 'msg-1',
        content: '📌 **Important:** Club meeting every Friday at 5 PM in Room 302.',
        authorRole: 'owner',
        isPinned: true,
      }),
      ...baseMessages,
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Pinned message with gold accent border.',
      },
    },
  },
};

export const WithReplies: Story = {
  args: {
    ...defaultProps,
    messages: [
      createMockMessage({
        id: 'msg-1',
        content: 'What time does the event start?',
        authorId: 'user-3',
        authorName: 'Mike Johnson',
      }),
      createMockMessage({
        id: 'msg-2',
        content: 'It starts at 6 PM!',
        timestamp: Date.now() - 30000,
        replyToId: 'msg-1',
        replyToPreview: 'What time does the event start?',
      }),
      ...baseMessages.slice(2),
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Message with reply preview indicator.',
      },
    },
  },
};

export const WithSystemMessage: Story = {
  args: {
    ...defaultProps,
    messages: [
      createMockMessage({
        id: 'msg-system',
        type: 'system',
        content: 'Alex Chen joined the space',
        authorId: 'system',
        authorName: 'System',
      }),
      ...baseMessages,
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'System message centered with subtle styling.',
      },
    },
  },
};

export const WithEditedMessage: Story = {
  args: {
    ...defaultProps,
    messages: [
      createMockMessage({
        id: 'msg-1',
        content: 'The meeting is at 5 PM (corrected time)',
        editedAt: Date.now() - 60000,
      }),
      ...baseMessages.slice(1),
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Edited message with "(edited)" indicator.',
      },
    },
  },
};

export const WithDeletedMessage: Story = {
  args: {
    ...defaultProps,
    messages: [
      createMockMessage({
        id: 'msg-1',
        content: '',
        isDeleted: true,
      }),
      ...baseMessages.slice(1),
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Deleted message with italicized "This message was deleted" text.',
      },
    },
  },
};

// ============================================================
// ROLE-BASED STYLING
// ============================================================

export const OwnerMessage: Story = {
  args: {
    ...defaultProps,
    messages: [
      createMockMessage({
        id: 'msg-1',
        content: 'Welcome to Design Club! I\'m Alex, the founder.',
        authorRole: 'owner',
      }),
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Owner messages have gold-colored name.',
      },
    },
  },
};

export const AdminMessage: Story = {
  args: {
    ...defaultProps,
    messages: [
      createMockMessage({
        id: 'msg-1',
        content: 'Reminder: Please update your profiles!',
        authorId: 'user-2',
        authorName: 'Sarah Kim',
        authorRole: 'admin',
      }),
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Admin messages have blue-colored name and role badge.',
      },
    },
  },
};

export const ModeratorMessage: Story = {
  args: {
    ...defaultProps,
    messages: [
      createMockMessage({
        id: 'msg-1',
        content: 'Keep discussions respectful, folks!',
        authorId: 'user-4',
        authorName: 'Emma Wilson',
        authorRole: 'moderator',
      }),
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Moderator messages have green-colored name and role badge.',
      },
    },
  },
};

// ============================================================
// TYPING INDICATORS
// ============================================================

export const SingleUserTyping: Story = {
  args: {
    ...defaultProps,
    typingUsers: [
      { id: 'user-2', name: 'Sarah', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop' },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Single user typing indicator: "Sarah is typing..."',
      },
    },
  },
};

export const TwoUsersTyping: Story = {
  args: {
    ...defaultProps,
    typingUsers: [
      { id: 'user-2', name: 'Sarah', avatarUrl: '' },
      { id: 'user-3', name: 'Mike', avatarUrl: '' },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Two users typing: "Sarah and Mike are typing..."',
      },
    },
  },
};

export const ManyUsersTyping: Story = {
  args: {
    ...defaultProps,
    typingUsers: [
      { id: 'user-2', name: 'Sarah', avatarUrl: '' },
      { id: 'user-3', name: 'Mike', avatarUrl: '' },
      { id: 'user-4', name: 'Emma', avatarUrl: '' },
      { id: 'user-5', name: 'John', avatarUrl: '' },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Many users typing: "Sarah and 3 others are typing..."',
      },
    },
  },
};

// ============================================================
// ONLINE STATUS
// ============================================================

export const WithOnlineCount: Story = {
  args: {
    ...defaultProps,
    onlineCount: 12,
  },
  parameters: {
    docs: {
      description: {
        story: 'Header showing online member count.',
      },
    },
  },
};

export const HighOnlineCount: Story = {
  args: {
    ...defaultProps,
    onlineCount: 156,
  },
  parameters: {
    docs: {
      description: {
        story: 'Large space with many online members.',
      },
    },
  },
};

// ============================================================
// USER PERMISSIONS
// ============================================================

export const AsRegularMember: Story = {
  args: {
    ...defaultProps,
    currentUserId: 'user-3',
    currentUserName: 'Mike Johnson',
    currentUserRole: 'member',
    isLeader: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'View as regular member (no create board button, limited moderation).',
      },
    },
  },
};

export const AsGuest: Story = {
  args: {
    ...defaultProps,
    currentUserId: 'guest-1',
    currentUserName: 'Guest User',
    currentUserRole: 'guest',
    isLeader: false,
    canPost: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'View as guest (read-only, no posting).',
      },
    },
  },
};

export const AsLeaderWithTools: Story = {
  args: {
    ...defaultProps,
    isLeader: true,
    showToolbar: true,
    onInsertTool: (toolId: string) => console.log('Insert tool:', toolId),
    onOpenToolGallery: () => console.log('Open tool gallery'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Leader view with tool insertion toolbar.',
      },
    },
  },
};

// ============================================================
// LOADING STATES
// ============================================================

export const LoadingMoreMessages: Story = {
  args: {
    ...defaultProps,
    isLoadingMore: true,
    hasMoreMessages: true,
    messages: createConversation(20),
  },
  parameters: {
    docs: {
      description: {
        story: 'Loading spinner when fetching older messages.',
      },
    },
  },
};

export const HasMoreMessages: Story = {
  args: {
    ...defaultProps,
    hasMoreMessages: true,
    messages: createConversation(20),
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows "Load older messages" button when more exist.',
      },
    },
  },
};

// ============================================================
// LONG CONVERSATIONS
// ============================================================

export const ManyMessages: Story = {
  args: {
    ...defaultProps,
    messages: createConversation(50),
  },
  parameters: {
    docs: {
      description: {
        story: 'Chat with many messages demonstrating virtual scrolling.',
      },
    },
  },
};

export const VeryLongConversation: Story = {
  args: {
    ...defaultProps,
    messages: createConversation(200),
    hasMoreMessages: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Very long conversation (200 messages) with virtual scrolling performance.',
      },
    },
  },
};

// ============================================================
// MESSAGE GROUPING
// ============================================================

export const GroupedMessages: Story = {
  args: {
    ...defaultProps,
    messages: [
      createMockMessage({ id: 'msg-1', content: 'Hey everyone!', timestamp: Date.now() - 120000 }),
      createMockMessage({ id: 'msg-2', content: 'How are you all doing?', timestamp: Date.now() - 90000 }),
      createMockMessage({ id: 'msg-3', content: 'Ready for the meeting?', timestamp: Date.now() - 60000 }),
      createMockMessage({ id: 'msg-4', content: 'Doing great!', timestamp: Date.now() - 30000, authorId: 'user-2', authorName: 'Sarah Kim' }),
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Messages from same author within 5 minutes are grouped (no repeated avatar/name).',
      },
    },
  },
};

export const MessagesAcrossDays: Story = {
  args: {
    ...defaultProps,
    messages: [
      createMockMessage({ id: 'msg-1', content: 'Message from yesterday', timestamp: Date.now() - 86400000 }),
      createMockMessage({ id: 'msg-2', content: 'Message from today', timestamp: Date.now() }),
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Date separators shown between messages on different days.',
      },
    },
  },
};

// ============================================================
// INLINE COMPONENTS
// ============================================================

export const WithInlinePoll: Story = {
  args: {
    ...defaultProps,
    messages: [
      createMockMessage({
        id: 'msg-1',
        content: 'What should our next workshop topic be?',
      }),
      createMockMessage({
        id: 'msg-poll',
        type: 'inline_component',
        content: '',
        componentData: {
          componentId: 'poll-1',
          elementType: 'poll',
          isActive: true,
          state: {
            question: 'What should our next workshop topic be?',
            options: ['React Hooks', 'TypeScript', 'Next.js'],
          },
        },
      }),
      ...baseMessages.slice(2),
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Inline poll component embedded in chat.',
      },
    },
  },
};

// ============================================================
// INTERACTIVE EXAMPLES
// ============================================================

export const InteractiveChat: Story = {
  render: () => {
    const [messages, setMessages] = React.useState<ChatMessageData[]>(createConversation(5));
    const [typingUsers, setTypingUsers] = React.useState<TypingUser[]>([]);
    const [activeBoardId, setActiveBoardId] = React.useState('general');

    const handleSendMessage = async (content: string) => {
      // Simulate sending
      const newMessage = createMockMessage({
        id: `msg-${Date.now()}`,
        content,
        timestamp: Date.now(),
      });
      setMessages(prev => [...prev, newMessage]);

      // Simulate AI response
      setTypingUsers([{ id: 'ai', name: 'HIVE', avatarUrl: '' }]);
      setTimeout(() => {
        setTypingUsers([]);
        setMessages(prev => [...prev, createMockMessage({
          id: `msg-ai-${Date.now()}`,
          content: 'Thanks for the message! 👋',
          authorId: 'ai',
          authorName: 'HIVE',
          authorRole: 'admin',
          timestamp: Date.now(),
        })]);
      }, 1500);
    };

    const handleReact = (messageId: string, emoji: string) => {
      setMessages(prev => prev.map(msg => {
        if (msg.id !== messageId) return msg;
        const existing = msg.reactions?.find(r => r.emoji === emoji);
        if (existing) {
          return {
            ...msg,
            reactions: msg.reactions?.map(r =>
              r.emoji === emoji
                ? { ...r, count: r.hasReacted ? r.count - 1 : r.count + 1, hasReacted: !r.hasReacted }
                : r
            ),
          };
        }
        return {
          ...msg,
          reactions: [...(msg.reactions || []), { emoji, count: 1, hasReacted: true }],
        };
      }));
    };

    return (
      <SpaceChatBoard
        spaceId="space-123"
        spaceName="Interactive Demo"
        boards={mockBoards}
        activeBoardId={activeBoardId}
        messages={messages}
        typingUsers={typingUsers}
        currentUserId="user-1"
        currentUserName="Alex Chen"
        currentUserRole="owner"
        isLeader={true}
        canPost={true}
        onBoardChange={setActiveBoardId}
        onSendMessage={handleSendMessage}
        onReact={handleReact}
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive demo: send messages, switch boards, and add reactions.',
      },
    },
  },
};

export const SimulatedTyping: Story = {
  render: () => {
    const [typingUsers, setTypingUsers] = React.useState<TypingUser[]>([]);
    const [phase, setPhase] = React.useState(0);

    React.useEffect(() => {
      const phases = [
        [],
        [{ id: 'user-2', name: 'Sarah', avatarUrl: '' }],
        [{ id: 'user-2', name: 'Sarah', avatarUrl: '' }, { id: 'user-3', name: 'Mike', avatarUrl: '' }],
        [{ id: 'user-2', name: 'Sarah', avatarUrl: '' }, { id: 'user-3', name: 'Mike', avatarUrl: '' }, { id: 'user-4', name: 'Emma', avatarUrl: '' }],
        [],
      ];

      const interval = setInterval(() => {
        setPhase(p => (p + 1) % phases.length);
      }, 2000);

      return () => clearInterval(interval);
    }, []);

    React.useEffect(() => {
      const phases = [
        [],
        [{ id: 'user-2', name: 'Sarah', avatarUrl: '' }],
        [{ id: 'user-2', name: 'Sarah', avatarUrl: '' }, { id: 'user-3', name: 'Mike', avatarUrl: '' }],
        [{ id: 'user-2', name: 'Sarah', avatarUrl: '' }, { id: 'user-3', name: 'Mike', avatarUrl: '' }, { id: 'user-4', name: 'Emma', avatarUrl: '' }],
        [],
      ];
      setTypingUsers(phases[phase]);
    }, [phase]);

    return (
      <SpaceChatBoard
        {...defaultProps}
        typingUsers={typingUsers}
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Animated demo of typing indicators cycling through states.',
      },
    },
  },
};

export const EditMessageDemo: Story = {
  render: () => {
    const [messages, setMessages] = React.useState<ChatMessageData[]>([
      createMockMessage({
        id: 'msg-1',
        content: 'Click the pencil icon to edit this message!',
        timestamp: Date.now() - 60000,
      }),
      ...baseMessages.slice(1),
    ]);

    const handleEditMessage = async (messageId: string, newContent: string): Promise<boolean> => {
      setMessages(prev => prev.map(msg =>
        msg.id === messageId
          ? { ...msg, content: newContent, editedAt: Date.now() }
          : msg
      ));
      return true;
    };

    return (
      <SpaceChatBoard
        {...defaultProps}
        messages={messages}
        onEditMessage={handleEditMessage}
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive demo for editing messages (hover to see edit button).',
      },
    },
  },
};

// ============================================================
// RESPONSIVE BEHAVIOR
// ============================================================

export const NarrowWidth: Story = {
  args: defaultProps,
  decorators: [
    (Story) => (
      <div className="h-[600px] max-w-[400px] bg-black">
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Chat board at mobile-like narrow width.',
      },
    },
  },
};

export const WideWidth: Story = {
  args: defaultProps,
  decorators: [
    (Story) => (
      <div className="h-[600px] w-full bg-black">
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Chat board at full desktop width.',
      },
    },
  },
};

// ============================================================
// EDGE CASES
// ============================================================

export const VeryLongMessage: Story = {
  args: {
    ...defaultProps,
    messages: [
      createMockMessage({
        id: 'msg-1',
        content: `This is a very long message to test text wrapping and layout behavior. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

Here's a code snippet for good measure:
\`\`\`javascript
function greet(name) {
  console.log(\`Hello, \${name}!\`);
}
\`\`\`

And finally, some bullet points:
• First item
• Second item
• Third item with more details

Thanks for reading this very long message!`,
      }),
      ...baseMessages.slice(1),
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Very long message with multiple paragraphs and code.',
      },
    },
  },
};

export const LongUserName: Story = {
  args: {
    ...defaultProps,
    messages: [
      createMockMessage({
        id: 'msg-1',
        content: 'Hello from someone with a very long name!',
        authorName: 'Professor Alexander von Humboldt III, PhD, MBA, Distinguished Fellow',
      }),
      ...baseMessages.slice(1),
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Message from user with very long name.',
      },
    },
  },
};

export const ManyReactions: Story = {
  args: {
    ...defaultProps,
    messages: [
      createMockMessage({
        id: 'msg-1',
        content: 'This post is popular!',
        reactions: [
          { emoji: '❤️', count: 15, hasReacted: true },
          { emoji: '👏', count: 12, hasReacted: false },
          { emoji: '🎉', count: 8, hasReacted: true },
          { emoji: '🔥', count: 6, hasReacted: false },
          { emoji: '💯', count: 5, hasReacted: false },
          { emoji: '👍', count: 4, hasReacted: true },
          { emoji: '😂', count: 3, hasReacted: false },
        ],
      }),
      ...baseMessages.slice(1),
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Message with many different reactions.',
      },
    },
  },
};

export const SpecialCharacters: Story = {
  args: {
    ...defaultProps,
    messages: [
      createMockMessage({
        id: 'msg-1',
        content: 'Testing special characters: @mention #hashtag $100 25% "quotes" \'apostrophes\' <html> &amp; emoji 🎉👍🔥',
      }),
      ...baseMessages.slice(1),
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Message with special characters and emoji.',
      },
    },
  },
};

export const URLsInMessage: Story = {
  args: {
    ...defaultProps,
    messages: [
      createMockMessage({
        id: 'msg-1',
        content: 'Check out these links: https://hive.campus and https://docs.hive.campus/getting-started for more info!',
      }),
      ...baseMessages.slice(1),
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Message containing URLs.',
      },
    },
  },
};

// ============================================================
// REAL-WORLD SCENARIOS
// ============================================================

export const ClubAnnouncementChannel: Story = {
  args: {
    ...defaultProps,
    boards: [
      { id: 'announcements', name: 'Announcements', type: 'announcements', messageCount: 0, isLocked: true },
      { id: 'general', name: 'General', type: 'general', messageCount: 5 },
    ],
    activeBoardId: 'announcements',
    messages: [
      createMockMessage({
        id: 'msg-1',
        content: '📢 **IMPORTANT: Spring Showcase Registration Now Open!**\n\nRegister your project by March 1st to participate in our annual showcase. First 20 teams get priority booth placement!\n\nRegister here: hive.campus/showcase-2026',
        authorRole: 'owner',
        isPinned: true,
        timestamp: Date.now() - 86400000,
      }),
      createMockMessage({
        id: 'msg-2',
        content: '🗓️ **Weekly Meeting Reminder**\n\nThis Friday at 5 PM in Room 302. We\'ll be discussing showcase preparations and assigning team roles.',
        authorRole: 'owner',
        timestamp: Date.now() - 3600000,
      }),
    ],
    canPost: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Announcements channel (leader-only posting) with pinned important message.',
      },
    },
  },
};

export const ActiveStudySession: Story = {
  args: {
    ...defaultProps,
    spaceName: 'CS Study Group',
    boards: [{ id: 'general', name: 'Study Session', type: 'general', messageCount: 0 }],
    onlineCount: 23,
    typingUsers: [
      { id: 'user-2', name: 'Sarah', avatarUrl: '' },
    ],
    messages: [
      createMockMessage({
        id: 'msg-1',
        content: 'Can someone explain how merge sort works?',
        authorId: 'user-5',
        authorName: 'New Student',
        authorRole: 'member',
        timestamp: Date.now() - 300000,
      }),
      createMockMessage({
        id: 'msg-2',
        content: 'Sure! Merge sort uses divide and conquer. You split the array in half recursively until you have single elements, then merge them back in sorted order.',
        authorId: 'user-2',
        authorName: 'Sarah Kim',
        authorRole: 'admin',
        timestamp: Date.now() - 240000,
        reactions: [
          { emoji: '👏', count: 3, hasReacted: false },
          { emoji: '💡', count: 2, hasReacted: false },
        ],
      }),
      createMockMessage({
        id: 'msg-3',
        content: 'That makes sense! What\'s the time complexity?',
        authorId: 'user-5',
        authorName: 'New Student',
        authorRole: 'member',
        timestamp: Date.now() - 180000,
      }),
      createMockMessage({
        id: 'msg-4',
        content: 'O(n log n) in all cases - that\'s what makes it efficient! Unlike quicksort which can degrade to O(n²).',
        authorId: 'user-2',
        authorName: 'Sarah Kim',
        authorRole: 'admin',
        timestamp: Date.now() - 120000,
        threadCount: 5,
      }),
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Active study group session with Q&A, reactions, and threading.',
      },
    },
  },
};

export const EventPlanningChannel: Story = {
  args: {
    ...defaultProps,
    spaceName: 'Hackathon 2026',
    boards: [
      { id: 'general', name: 'General', type: 'general', messageCount: 0 },
      { id: 'teams', name: 'Find Teammates', type: 'general', messageCount: 12 },
      { id: 'logistics', name: 'Logistics', type: 'resources', messageCount: 0 },
    ],
    activeBoardId: 'teams',
    messages: [
      createMockMessage({
        id: 'msg-1',
        content: '🔍 **Looking for teammates!**\n\nProject: AI-powered study planner\nNeed: 1 frontend dev, 1 ML engineer\nTech stack: Next.js, Python, OpenAI API\n\nDM me if interested!',
        authorId: 'user-2',
        authorName: 'Sarah Kim',
        timestamp: Date.now() - 3600000,
        reactions: [
          { emoji: '🙋', count: 4, hasReacted: false },
        ],
        threadCount: 8,
      }),
      createMockMessage({
        id: 'msg-2',
        content: 'I\'m a backend dev looking for a team. Experienced with Node.js and PostgreSQL. Anyone building something interesting?',
        authorId: 'user-3',
        authorName: 'Mike Johnson',
        timestamp: Date.now() - 1800000,
      }),
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Hackathon team-finding channel with project pitches.',
      },
    },
  },
};

// ============================================================
// COMPARISON STORIES
// ============================================================

export const LeaderVsMemberView: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4 h-[600px]">
      <div className="border border-white/10 rounded-lg overflow-hidden">
        <div className="bg-[#1A1A1A] px-3 py-2 text-xs text-[#818187] font-medium">
          Leader View
        </div>
        <SpaceChatBoard
          {...defaultProps}
          isLeader={true}
          showToolbar={true}
          onInsertTool={() => {}}
          onCreateBoard={() => {}}
        />
      </div>
      <div className="border border-white/10 rounded-lg overflow-hidden">
        <div className="bg-[#1A1A1A] px-3 py-2 text-xs text-[#818187] font-medium">
          Member View
        </div>
        <SpaceChatBoard
          {...defaultProps}
          currentUserId="user-3"
          currentUserName="Mike Johnson"
          currentUserRole="member"
          isLeader={false}
          showToolbar={false}
        />
      </div>
    </div>
  ),
  decorators: [
    (Story) => (
      <div className="p-4 bg-black h-[680px]">
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Side-by-side comparison of leader vs member permissions.',
      },
    },
  },
};

export const EmptyVsActiveChannel: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4 h-[600px]">
      <div className="border border-white/10 rounded-lg overflow-hidden">
        <div className="bg-[#1A1A1A] px-3 py-2 text-xs text-[#818187] font-medium">
          Empty Channel
        </div>
        <SpaceChatBoard {...defaultProps} messages={[]} />
      </div>
      <div className="border border-white/10 rounded-lg overflow-hidden">
        <div className="bg-[#1A1A1A] px-3 py-2 text-xs text-[#818187] font-medium">
          Active Channel
        </div>
        <SpaceChatBoard
          {...defaultProps}
          onlineCount={15}
          typingUsers={[{ id: 'user-2', name: 'Sarah', avatarUrl: '' }]}
        />
      </div>
    </div>
  ),
  decorators: [
    (Story) => (
      <div className="p-4 bg-black h-[680px]">
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Comparison of empty channel vs active channel with typing indicator.',
      },
    },
  },
};
