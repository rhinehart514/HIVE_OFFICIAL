'use client';

import * as React from 'react';

import { MessageBubble, MessageList, type MessageBubbleProps } from './message-bubble';

import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: '03-Chat/Atoms/MessageBubble',
  component: MessageBubble,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'OpenAI-style chat message component with user/AI variants, avatar support, timestamps, streaming cursor, and fade-in animation. Clean, minimal design with subtle backgrounds.',
      },
    },
    backgrounds: {
      default: 'dark',
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['user', 'ai'],
      description: 'Message variant - user or AI',
    },
    content: {
      control: 'text',
      description: 'Message content (plain text or markdown for AI)',
    },
    timestamp: {
      control: 'text',
      description: 'Message timestamp',
    },
    userName: {
      control: 'text',
      description: 'User name (for user messages)',
    },
    avatarUrl: {
      control: 'text',
      description: 'User avatar URL',
    },
    isStreaming: {
      control: 'boolean',
      description: 'Whether message is currently streaming in',
    },
  },
  decorators: [
    (Story) => (
      <div className="min-h-[200px] bg-black">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MessageBubble>;

export default meta;
type Story = StoryObj<typeof meta>;

// ===== BASIC VARIANTS =====

export const UserMessage: Story = {
  args: {
    variant: 'user',
    content: 'Hey, can you help me create a poll for our next event?',
    userName: 'Alex Chen',
    timestamp: '2:30 PM',
  },
};

export const AIMessage: Story = {
  args: {
    variant: 'ai',
    content: 'Of course! I can help you create a poll. Would you like a simple multiple choice poll, or something with more options like ranked choice or rating scale?',
    timestamp: '2:31 PM',
  },
};

export const UserMessageWithAvatar: Story = {
  args: {
    variant: 'user',
    content: 'Let me check with the team first.',
    userName: 'Sarah Kim',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    timestamp: '3:45 PM',
  },
};

export const StreamingAIMessage: Story = {
  args: {
    variant: 'ai',
    content: 'Let me think about that for a moment...',
    isStreaming: true,
    timestamp: 'now',
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows the streaming cursor animation when AI is still generating.',
      },
    },
  },
};

// ===== CONTENT LENGTH VARIANTS =====

export const ShortMessage: Story = {
  args: {
    variant: 'user',
    content: 'Thanks!',
    userName: 'You',
    timestamp: '4:00 PM',
  },
};

export const MediumMessage: Story = {
  args: {
    variant: 'ai',
    content: 'Great! I\'ve created a simple multiple choice poll. You can add up to 10 options, and members can select one answer. Want me to add a deadline?',
    timestamp: '4:01 PM',
  },
};

export const LongMessage: Story = {
  args: {
    variant: 'ai',
    content: `Here's a comprehensive guide to creating effective polls for your community:

1. **Keep it simple** - Use clear, concise language that everyone can understand.

2. **Limit options** - Try to keep options between 2-5 for best engagement. Too many choices can lead to decision paralysis.

3. **Set a deadline** - Adding a deadline creates urgency and helps with response rates.

4. **Share context** - Explain why you're asking and how the results will be used.

5. **Follow up** - After the poll closes, share the results and what actions you'll take based on them.

Would you like me to help you draft the poll options?`,
    timestamp: '4:02 PM',
  },
  parameters: {
    docs: {
      description: {
        story: 'Long AI response demonstrating how the bubble handles extensive content with proper formatting.',
      },
    },
  },
};

export const MultilineUserMessage: Story = {
  args: {
    variant: 'user',
    content: `I have a few questions:

1. Can we add images to the poll?
2. Is there a way to make it anonymous?
3. How long can I set the deadline for?

Thanks in advance!`,
    userName: 'Jamie Park',
    timestamp: '4:05 PM',
  },
};

// ===== USER NAME VARIANTS =====

export const DefaultUserName: Story = {
  args: {
    variant: 'user',
    content: 'This uses the default "You" username.',
    timestamp: '5:00 PM',
  },
};

export const CustomUserName: Story = {
  args: {
    variant: 'user',
    content: 'Message from a custom user.',
    userName: 'Dr. Emily Watson',
    timestamp: '5:01 PM',
  },
};

export const LongUserName: Story = {
  args: {
    variant: 'user',
    content: 'Testing long username display.',
    userName: 'Professor Alexander von Humboldt III',
    timestamp: '5:02 PM',
  },
};

// ===== TIMESTAMP VARIANTS =====

export const NoTimestamp: Story = {
  args: {
    variant: 'ai',
    content: 'This message has no timestamp displayed.',
  },
};

export const RelativeTimestamp: Story = {
  args: {
    variant: 'user',
    content: 'Just sent this message.',
    userName: 'You',
    timestamp: 'just now',
  },
};

export const FullTimestamp: Story = {
  args: {
    variant: 'user',
    content: 'Message with full timestamp.',
    userName: 'You',
    timestamp: 'Dec 15, 2025 at 2:30 PM',
  },
};

// ===== AVATAR VARIANTS =====

export const NoAvatar: Story = {
  args: {
    variant: 'user',
    content: 'User message with default avatar fallback.',
    userName: 'Anonymous',
    timestamp: '6:00 PM',
  },
};

export const WithAvatar: Story = {
  args: {
    variant: 'user',
    content: 'User message with profile photo.',
    userName: 'Mike Johnson',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    timestamp: '6:01 PM',
  },
};

export const AIAvatar: Story = {
  args: {
    variant: 'ai',
    content: 'AI messages show the gold HIVE indicator.',
    timestamp: '6:02 PM',
  },
};

// ===== STREAMING STATES =====

export const StreamingStart: Story = {
  args: {
    variant: 'ai',
    content: '',
    isStreaming: true,
    timestamp: 'now',
  },
  parameters: {
    docs: {
      description: {
        story: 'Streaming state at the very start when no content has been generated yet.',
      },
    },
  },
};

export const StreamingInProgress: Story = {
  args: {
    variant: 'ai',
    content: 'I understand your question. Let me explain the process step by step',
    isStreaming: true,
    timestamp: 'now',
  },
};

export const StreamingComplete: Story = {
  args: {
    variant: 'ai',
    content: 'I understand your question. Let me explain the process step by step. First, you\'ll need to gather your materials. Then, follow these instructions carefully.',
    isStreaming: false,
    timestamp: '6:10 PM',
  },
};

// ===== MESSAGE LIST =====

export const ConversationFlow: Story = {
  render: () => (
    <MessageList>
      <MessageBubble
        variant="user"
        content="Hey! I want to create an event for our study group."
        userName="Alex"
        timestamp="2:30 PM"
      />
      <MessageBubble
        variant="ai"
        content="Great! I can help you set up an event. What's the name of your study group, and when would you like to schedule the event?"
        timestamp="2:30 PM"
      />
      <MessageBubble
        variant="user"
        content="It's the Computer Science Study Group. We're thinking next Friday at 3 PM in the library."
        userName="Alex"
        timestamp="2:31 PM"
      />
      <MessageBubble
        variant="ai"
        content="Perfect! I've created an event called 'CS Study Group Session' for Friday, December 20th at 3:00 PM at the Library. Would you like me to add an RSVP so members can confirm their attendance?"
        timestamp="2:31 PM"
      />
      <MessageBubble
        variant="user"
        content="Yes please! And can you set a reminder for the day before?"
        userName="Alex"
        timestamp="2:32 PM"
      />
    </MessageList>
  ),
  parameters: {
    docs: {
      description: {
        story: 'A typical conversation flow between a user and HIVE AI.',
      },
    },
  },
};

export const MultiUserConversation: Story = {
  render: () => (
    <MessageList>
      <MessageBubble
        variant="user"
        content="Who's bringing snacks to the meeting?"
        userName="Sarah"
        avatarUrl="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop"
        timestamp="3:00 PM"
      />
      <MessageBubble
        variant="user"
        content="I can bring some chips!"
        userName="Mike"
        avatarUrl="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop"
        timestamp="3:01 PM"
      />
      <MessageBubble
        variant="user"
        content="I'll handle drinks then."
        userName="Emma"
        avatarUrl="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop"
        timestamp="3:01 PM"
      />
      <MessageBubble
        variant="ai"
        content="Great coordination! I've noted that Mike is bringing chips and Emma is handling drinks. Would you like me to create a shared list so everyone can see who's bringing what?"
        timestamp="3:02 PM"
      />
    </MessageList>
  ),
  parameters: {
    docs: {
      description: {
        story: 'A group conversation with multiple users and the AI.',
      },
    },
  },
};

// ===== EDGE CASES =====

export const SpecialCharacters: Story = {
  args: {
    variant: 'user',
    content: 'Testing special characters: @mention #hashtag $100 25% "quotes" \'apostrophes\' <html> &amp; emoji 🎉👍',
    userName: 'Tester',
    timestamp: '7:00 PM',
  },
};

export const CodeSnippet: Story = {
  args: {
    variant: 'ai',
    content: `Here's the code snippet you requested:

\`\`\`javascript
function createPoll(question, options) {
  return {
    question,
    options,
    votes: new Map(),
    createdAt: new Date()
  };
}
\`\`\`

Just copy and paste this into your project!`,
    timestamp: '7:01 PM',
  },
  parameters: {
    docs: {
      description: {
        story: 'AI message containing code blocks (rendered as plain text in this basic version).',
      },
    },
  },
};

export const URLsInMessage: Story = {
  args: {
    variant: 'ai',
    content: 'You can find more information at https://hive.campus and the documentation at https://docs.hive.campus/getting-started. Let me know if you have questions!',
    timestamp: '7:02 PM',
  },
};

export const EmptyContent: Story = {
  args: {
    variant: 'user',
    content: '',
    userName: 'You',
    timestamp: '7:03 PM',
  },
  parameters: {
    docs: {
      description: {
        story: 'Edge case: message with empty content.',
      },
    },
  },
};

// ===== COMPARISON STORIES =====

export const VariantComparison: Story = {
  render: () => (
    <div className="space-y-4 p-4 bg-black">
      <h4 className="text-white/60 text-sm mb-2">User vs AI Messages</h4>
      <MessageBubble
        variant="user"
        content="This is a user message with transparent background."
        userName="User"
        timestamp="8:00 PM"
      />
      <MessageBubble
        variant="ai"
        content="This is an AI message with subtle background tint."
        timestamp="8:00 PM"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Side-by-side comparison of user and AI message variants.',
      },
    },
  },
};

export const StreamingComparison: Story = {
  render: () => (
    <div className="space-y-4 p-4 bg-black">
      <h4 className="text-white/60 text-sm mb-2">Streaming vs Complete</h4>
      <MessageBubble
        variant="ai"
        content="This message is still streaming"
        isStreaming={true}
        timestamp="now"
      />
      <MessageBubble
        variant="ai"
        content="This message is complete and has no cursor."
        isStreaming={false}
        timestamp="8:01 PM"
      />
    </div>
  ),
};

export const AvatarComparison: Story = {
  render: () => (
    <div className="space-y-4 p-4 bg-black">
      <h4 className="text-white/60 text-sm mb-2">With vs Without Avatar</h4>
      <MessageBubble
        variant="user"
        content="User with avatar image."
        userName="Alex"
        avatarUrl="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop"
        timestamp="9:00 PM"
      />
      <MessageBubble
        variant="user"
        content="User with fallback icon."
        userName="Jamie"
        timestamp="9:00 PM"
      />
      <MessageBubble
        variant="ai"
        content="AI with gold indicator."
        timestamp="9:00 PM"
      />
    </div>
  ),
};

// ===== INTERACTIVE EXAMPLES =====

export const InteractiveConversation: Story = {
  render: () => {
    const [messages, setMessages] = React.useState<MessageBubbleProps[]>([
      { variant: 'user', content: 'Hello!', userName: 'You', timestamp: 'now' },
    ]);

    const addAIResponse = () => {
      const responses = [
        "Hello! How can I help you today?",
        "I'd be happy to assist you with that.",
        "That's a great question! Let me explain...",
        "I understand. Here's what I suggest...",
      ];
      setMessages(prev => [...prev, {
        variant: 'ai' as const,
        content: responses[Math.floor(Math.random() * responses.length)],
        timestamp: 'now',
      }]);
    };

    const addUserMessage = () => {
      const userMessages = [
        "Can you help me with something?",
        "What do you think about this?",
        "Thanks for the info!",
        "Let me try that.",
      ];
      setMessages(prev => [...prev, {
        variant: 'user' as const,
        content: userMessages[Math.floor(Math.random() * userMessages.length)],
        userName: 'You',
        timestamp: 'now',
      }]);
    };

    return (
      <div className="bg-black">
        <div className="p-4 border-b border-white/10 flex gap-2">
          <button
            onClick={addUserMessage}
            className="px-4 py-2 bg-white/10 hover:bg-white/15 rounded-lg text-white text-sm transition-colors"
          >
            Add User Message
          </button>
          <button
            onClick={addAIResponse}
            className="px-4 py-2 bg-[var(--hive-gold-cta)]/20 hover:bg-[var(--hive-gold-cta)]/30 rounded-lg text-[var(--hive-gold-cta)] text-sm transition-colors"
          >
            Add AI Response
          </button>
        </div>
        <MessageList>
          {messages.map((msg, i) => (
            <MessageBubble key={i} {...msg} />
          ))}
        </MessageList>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive demo to add messages and see the conversation flow.',
      },
    },
  },
};
