'use client';

import * as React from 'react';
import { action } from '@storybook/addon-actions';

import { ConversationThread, EmptyChatState, type ConversationThreadProps, type EmptyChatStateProps } from './conversation-thread';
import { MessageBubble } from './message-bubble';
import { TypingIndicator } from './typing-indicator';

import type { Meta, StoryObj } from '@storybook/react';

// ===== CONVERSATION THREAD META =====

const meta = {
  title: '03-Chat/Organisms/ConversationThread',
  component: ConversationThread,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Scrollable message container with auto-scroll to latest message, smooth scroll behavior, and empty state support. Virtualization-ready structure.',
      },
    },
    backgrounds: {
      default: 'dark',
    },
  },
  tags: ['autodocs'],
  argTypes: {
    autoScroll: {
      control: 'boolean',
      description: 'Auto-scroll to bottom on new messages',
    },
  },
  decorators: [
    (Story) => (
      <div className="h-[600px] bg-black flex flex-col">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ConversationThread>;

export default meta;
type Story = StoryObj<typeof meta>;

// Sample messages for stories
const sampleMessages = [
  { variant: 'user' as const, content: 'Hey, I need help setting up events for our club.', userName: 'Alex', timestamp: '2:30 PM' },
  { variant: 'ai' as const, content: 'Of course! I\'d be happy to help you set up events. What kind of events are you planning?', timestamp: '2:30 PM' },
  { variant: 'user' as const, content: 'We have weekly meetings and monthly socials. Can I schedule recurring events?', userName: 'Alex', timestamp: '2:31 PM' },
  { variant: 'ai' as const, content: 'Yes! HIVE supports recurring events. You can set them to repeat weekly, bi-weekly, or monthly. Would you like me to help you create your first recurring event?', timestamp: '2:31 PM' },
  { variant: 'user' as const, content: 'That would be great! Let\'s start with the weekly meeting.', userName: 'Alex', timestamp: '2:32 PM' },
];

// ===== BASIC STATES =====

export const Default: Story = {
  render: () => (
    <ConversationThread>
      {sampleMessages.map((msg, i) => (
        <MessageBubble key={i} {...msg} />
      ))}
    </ConversationThread>
  ),
};

export const Empty: Story = {
  render: () => (
    <ConversationThread>
      {/* No children */}
    </ConversationThread>
  ),
};

export const WithEmptyState: Story = {
  render: () => (
    <ConversationThread
      emptyState={
        <EmptyChatState
          title="Start a conversation"
          description="Ask HIVE AI anything about managing your community."
          examplePrompts={[
            { label: 'Create a poll', prompt: 'Create a poll for our next meeting topic', onClick: action('prompt-click') },
            { label: 'Schedule event', prompt: 'Schedule a study session for Friday', onClick: action('prompt-click') },
          ]}
        />
      }
    >
      {/* No messages yet */}
    </ConversationThread>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Shows empty state when there are no messages.',
      },
    },
  },
};

export const SingleMessage: Story = {
  render: () => (
    <ConversationThread>
      <MessageBubble
        variant="user"
        content="Hello, HIVE!"
        userName="You"
        timestamp="now"
      />
    </ConversationThread>
  ),
};

export const WithTypingIndicator: Story = {
  render: () => (
    <ConversationThread>
      <MessageBubble
        variant="user"
        content="What features are available?"
        userName="You"
        timestamp="now"
      />
      <TypingIndicator />
    </ConversationThread>
  ),
};

// ===== AUTO-SCROLL EXAMPLES =====

export const AutoScrollEnabled: Story = {
  render: () => {
    const [messages, setMessages] = React.useState(sampleMessages);

    const addMessage = () => {
      setMessages(prev => [...prev, {
        variant: (prev.length % 2 === 0 ? 'user' : 'ai') as 'user' | 'ai',
        content: `New message #${prev.length + 1}. This should auto-scroll into view.`,
        userName: prev.length % 2 === 0 ? 'You' : undefined,
        timestamp: 'now',
      }]);
    };

    return (
      <>
        <div className="p-4 border-b border-white/10">
          <button
            onClick={addMessage}
            className="px-4 py-2 bg-[var(--hive-gold-cta)]/20 hover:bg-[var(--hive-gold-cta)]/30 rounded-lg text-[var(--hive-gold-cta)] text-sm transition-colors"
          >
            Add Message (auto-scroll)
          </button>
        </div>
        <ConversationThread autoScroll={true}>
          {messages.map((msg, i) => (
            <MessageBubble key={i} {...msg} />
          ))}
        </ConversationThread>
      </>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates auto-scroll behavior when new messages are added.',
      },
    },
  },
};

export const AutoScrollDisabled: Story = {
  render: () => {
    const [messages, setMessages] = React.useState(sampleMessages);

    const addMessage = () => {
      setMessages(prev => [...prev, {
        variant: (prev.length % 2 === 0 ? 'user' : 'ai') as 'user' | 'ai',
        content: `New message #${prev.length + 1}. Auto-scroll is disabled.`,
        userName: prev.length % 2 === 0 ? 'You' : undefined,
        timestamp: 'now',
      }]);
    };

    return (
      <>
        <div className="p-4 border-b border-white/10">
          <button
            onClick={addMessage}
            className="px-4 py-2 bg-white/10 hover:bg-white/15 rounded-lg text-white text-sm transition-colors"
          >
            Add Message (no auto-scroll)
          </button>
        </div>
        <ConversationThread autoScroll={false}>
          {messages.map((msg, i) => (
            <MessageBubble key={i} {...msg} />
          ))}
        </ConversationThread>
      </>
    );
  },
};

// ===== LONG CONVERSATIONS =====

export const LongConversation: Story = {
  render: () => {
    const longConversation = Array.from({ length: 20 }, (_, i) => ({
      variant: (i % 2 === 0 ? 'user' : 'ai') as 'user' | 'ai',
      content: i % 2 === 0
        ? `User question #${Math.floor(i / 2) + 1}: How do I do this?`
        : `AI response #${Math.floor(i / 2) + 1}: Here's a helpful explanation with some details about how to accomplish what you're asking about.`,
      userName: i % 2 === 0 ? 'You' : undefined,
      timestamp: `${10 + Math.floor(i / 2)}:${(i % 60).toString().padStart(2, '0')} AM`,
    }));

    return (
      <ConversationThread>
        {longConversation.map((msg, i) => (
          <MessageBubble key={i} {...msg} />
        ))}
      </ConversationThread>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Long conversation demonstrating scrolling behavior with many messages.',
      },
    },
  },
};

export const MixedLengthMessages: Story = {
  render: () => (
    <ConversationThread>
      <MessageBubble variant="user" content="Hi" userName="You" timestamp="1:00 PM" />
      <MessageBubble variant="ai" content="Hello! How can I help you today?" timestamp="1:00 PM" />
      <MessageBubble
        variant="user"
        content="I have a really long question about setting up events for our organization. We need to coordinate between multiple groups, track RSVPs, send reminders, and also integrate with our calendar system. Is all of that possible?"
        userName="You"
        timestamp="1:01 PM"
      />
      <MessageBubble
        variant="ai"
        content={`Great question! Yes, HIVE supports all of those features:

1. **Multi-group coordination** - You can create events visible to multiple spaces
2. **RSVP tracking** - Members can respond with Going, Maybe, or Not Going
3. **Automated reminders** - Set up reminders 1 day, 1 hour, or 15 minutes before
4. **Calendar integration** - Export to Google Calendar or Apple Calendar

Would you like me to walk you through setting up your first event with all these features?`}
        timestamp="1:01 PM"
      />
      <MessageBubble variant="user" content="Yes please!" userName="You" timestamp="1:02 PM" />
    </ConversationThread>
  ),
};

// ===== INTERACTIVE EXAMPLES =====

export const InteractiveChat: Story = {
  render: () => {
    const [messages, setMessages] = React.useState<Array<{
      variant: 'user' | 'ai';
      content: string;
      userName?: string;
      timestamp: string;
    }>>([]);
    const [isTyping, setIsTyping] = React.useState(false);

    const sendMessage = (content: string) => {
      setMessages(prev => [...prev, { variant: 'user', content, userName: 'You', timestamp: 'now' }]);
      setIsTyping(true);

      setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [...prev, {
          variant: 'ai',
          content: `I received your message: "${content}". How else can I help?`,
          timestamp: 'now',
        }]);
      }, 1500);
    };

    const quickPrompts = [
      'Create a poll',
      'Schedule an event',
      'Show member stats',
      'Help with automation',
    ];

    return (
      <>
        <ConversationThread
          emptyState={
            <EmptyChatState
              title="Start chatting with HIVE AI"
              description="Click a prompt below or type your own message"
              examplePrompts={quickPrompts.map(label => ({
                label,
                prompt: label,
                onClick: sendMessage,
              }))}
            />
          }
        >
          {messages.map((msg, i) => (
            <MessageBubble key={i} {...msg} />
          ))}
          {isTyping && <TypingIndicator />}
        </ConversationThread>
        <div className="p-4 border-t border-white/10">
          <input
            type="text"
            placeholder="Type a message..."
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 outline-none focus:border-white/20"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                sendMessage(e.currentTarget.value);
                e.currentTarget.value = '';
              }
            }}
          />
        </div>
      </>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Fully interactive chat demo with typing indicators and responses.',
      },
    },
  },
};

// ===== CUSTOM SCROLLBAR =====

export const CustomScrollbar: Story = {
  render: () => {
    const manyMessages = Array.from({ length: 30 }, (_, i) => ({
      variant: (i % 2 === 0 ? 'user' : 'ai') as 'user' | 'ai',
      content: `Message ${i + 1} - Scroll to see the custom scrollbar styling.`,
      userName: i % 2 === 0 ? 'You' : undefined,
      timestamp: `${Math.floor(i / 4) + 1}:${((i % 4) * 15).toString().padStart(2, '0')} PM`,
    }));

    return (
      <ConversationThread>
        {manyMessages.map((msg, i) => (
          <MessageBubble key={i} {...msg} />
        ))}
      </ConversationThread>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates the custom scrollbar styling with many messages.',
      },
    },
  },
};

// ===== EMPTY CHAT STATE STORIES =====

export const EmptyChatStateDefault: Story = {
  render: () => (
    <ConversationThread
      emptyState={<EmptyChatState />}
    >
      {/* Empty */}
    </ConversationThread>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Default EmptyChatState with standard title and description.',
      },
    },
  },
};

export const EmptyChatStateCustom: Story = {
  render: () => (
    <ConversationThread
      emptyState={
        <EmptyChatState
          title="Welcome to Design Club Chat"
          description="This is your space to collaborate and share ideas with fellow designers."
        />
      }
    >
      {/* Empty */}
    </ConversationThread>
  ),
};

export const EmptyChatStateWithPrompts: Story = {
  render: () => (
    <ConversationThread
      emptyState={
        <EmptyChatState
          title="Build something amazing"
          description="Use AI to create tools for your community in seconds."
          examplePrompts={[
            { label: 'Create a poll', prompt: 'Create a poll for meeting times', onClick: action('prompt') },
            { label: 'Event RSVP', prompt: 'Create an RSVP for our party', onClick: action('prompt') },
            { label: 'Countdown timer', prompt: 'Create a countdown to finals', onClick: action('prompt') },
            { label: 'Sign-up form', prompt: 'Create a volunteer sign-up', onClick: action('prompt') },
          ]}
        />
      }
    >
      {/* Empty */}
    </ConversationThread>
  ),
};

export const EmptyChatStateManyPrompts: Story = {
  render: () => (
    <ConversationThread
      emptyState={
        <EmptyChatState
          title="HIVE AI Assistant"
          description="I can help you with polls, events, automations, and more."
          examplePrompts={[
            { label: 'Create poll', prompt: 'poll', onClick: action('prompt') },
            { label: 'New event', prompt: 'event', onClick: action('prompt') },
            { label: 'Set reminder', prompt: 'reminder', onClick: action('prompt') },
            { label: 'Member list', prompt: 'members', onClick: action('prompt') },
            { label: 'Analytics', prompt: 'analytics', onClick: action('prompt') },
            { label: 'Automate', prompt: 'automate', onClick: action('prompt') },
          ]}
        />
      }
    >
      {/* Empty */}
    </ConversationThread>
  ),
};

// ===== REAL-WORLD SCENARIOS =====

export const SpaceChatScenario: Story = {
  render: () => (
    <>
      <div className="p-4 border-b border-white/10 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/40 to-indigo-600/40 flex items-center justify-center text-white text-sm font-bold">
          CS
        </div>
        <div>
          <p className="text-white text-sm font-medium">Computer Science Club</p>
          <p className="text-white/40 text-xs">AI Assistant</p>
        </div>
      </div>
      <ConversationThread>
        <MessageBubble
          variant="user"
          content="@HIVE Can you create a poll for our next workshop topic?"
          userName="Sarah"
          avatarUrl="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop"
          timestamp="3:00 PM"
        />
        <MessageBubble
          variant="ai"
          content="I'll create a poll for your workshop topic. What options would you like to include?"
          timestamp="3:00 PM"
        />
        <MessageBubble
          variant="user"
          content="Let's do: Machine Learning, Web Dev, Mobile Apps, and Cybersecurity"
          userName="Sarah"
          avatarUrl="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop"
          timestamp="3:01 PM"
        />
        <MessageBubble
          variant="ai"
          content="Done! I've created a poll with those 4 options. It's now pinned in the #general channel. Voting closes in 7 days."
          timestamp="3:01 PM"
        />
      </ConversationThread>
    </>
  ),
};

export const HiveLabScenario: Story = {
  render: () => (
    <>
      <div className="p-4 border-b border-white/10 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-[var(--hive-gold-cta)]/20 flex items-center justify-center">
          <div className="w-4 h-4 rounded-full bg-[var(--hive-gold-cta)]" />
        </div>
        <div>
          <p className="text-white text-sm font-medium">HiveLab</p>
          <p className="text-white/40 text-xs">Build tools with AI</p>
        </div>
      </div>
      <ConversationThread
        emptyState={
          <EmptyChatState
            title="Build campus tools with AI"
            description="Describe what you need and we'll generate it instantly."
            examplePrompts={[
              { label: 'Poll', prompt: 'Create a voting poll', onClick: action('prompt') },
              { label: 'Event', prompt: 'Create an event RSVP', onClick: action('prompt') },
              { label: 'Countdown', prompt: 'Create a countdown', onClick: action('prompt') },
              { label: 'Form', prompt: 'Create a signup form', onClick: action('prompt') },
            ]}
          />
        }
      >
        {/* Empty - shows the HiveLab empty state */}
      </ConversationThread>
    </>
  ),
};

// ===== COMPARISON =====

export const WithVsWithoutAutoScroll: Story = {
  render: () => {
    const [messages1, setMessages1] = React.useState(sampleMessages.slice(0, 3));
    const [messages2, setMessages2] = React.useState(sampleMessages.slice(0, 3));

    const addToFirst = () => {
      setMessages1(prev => [...prev, {
        variant: 'ai' as const,
        content: `New message #${prev.length + 1}`,
        timestamp: 'now',
      }]);
    };

    const addToSecond = () => {
      setMessages2(prev => [...prev, {
        variant: 'ai' as const,
        content: `New message #${prev.length + 1}`,
        timestamp: 'now',
      }]);
    };

    return (
      <div className="flex h-full">
        <div className="flex-1 flex flex-col border-r border-white/10">
          <div className="p-3 border-b border-white/10 flex justify-between items-center">
            <span className="text-white/60 text-sm">Auto-scroll: ON</span>
            <button onClick={addToFirst} className="px-3 py-1 bg-white/10 rounded text-white text-xs">Add</button>
          </div>
          <ConversationThread autoScroll={true}>
            {messages1.map((msg, i) => (
              <MessageBubble key={i} {...msg} />
            ))}
          </ConversationThread>
        </div>
        <div className="flex-1 flex flex-col">
          <div className="p-3 border-b border-white/10 flex justify-between items-center">
            <span className="text-white/60 text-sm">Auto-scroll: OFF</span>
            <button onClick={addToSecond} className="px-3 py-1 bg-white/10 rounded text-white text-xs">Add</button>
          </div>
          <ConversationThread autoScroll={false}>
            {messages2.map((msg, i) => (
              <MessageBubble key={i} {...msg} />
            ))}
          </ConversationThread>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Side-by-side comparison of auto-scroll enabled vs disabled.',
      },
    },
  },
};
