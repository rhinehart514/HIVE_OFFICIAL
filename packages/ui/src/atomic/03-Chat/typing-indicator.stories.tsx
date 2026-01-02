'use client';

import * as React from 'react';
import { AnimatePresence } from 'framer-motion';

import { TypingIndicator, type TypingIndicatorProps } from './typing-indicator';
import { MessageBubble, MessageList } from './message-bubble';

import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: '03-Chat/Atoms/TypingIndicator',
  component: TypingIndicator,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'AI thinking animation with three pulsing dots. Matches MessageBubble layout for consistency. Shows when AI is processing a response.',
      },
    },
    backgrounds: {
      default: 'dark',
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="min-h-[200px] bg-black">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TypingIndicator>;

export default meta;
type Story = StoryObj<typeof meta>;

// ===== BASIC STATES =====

export const Default: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'Default typing indicator with three pulsing dots.',
      },
    },
  },
};

export const WithCustomClass: Story = {
  args: {
    className: 'border-t border-white/10',
  },
};

// ===== CONTEXT EXAMPLES =====

export const AfterUserMessage: Story = {
  render: () => (
    <MessageList>
      <MessageBubble
        variant="user"
        content="Can you help me create a poll for our next meeting?"
        userName="Alex"
        timestamp="2:30 PM"
      />
      <TypingIndicator />
    </MessageList>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Typing indicator shown after a user message while AI is thinking.',
      },
    },
  },
};

export const InConversation: Story = {
  render: () => (
    <MessageList>
      <MessageBubble
        variant="user"
        content="Hey, I need help with something."
        userName="Sarah"
        timestamp="3:00 PM"
      />
      <MessageBubble
        variant="ai"
        content="Of course! What do you need help with?"
        timestamp="3:00 PM"
      />
      <MessageBubble
        variant="user"
        content="How do I create an event with RSVP functionality?"
        userName="Sarah"
        timestamp="3:01 PM"
      />
      <TypingIndicator />
    </MessageList>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Typing indicator in the context of an ongoing conversation.',
      },
    },
  },
};

export const AfterLongMessage: Story = {
  render: () => (
    <MessageList>
      <MessageBubble
        variant="user"
        content={`I have a complex question about organizing our club activities.

We have about 50 members, and we want to:
1. Schedule weekly meetings
2. Track attendance
3. Send automated reminders
4. Create polls for decision-making
5. Share resources and files

What's the best way to set all this up?`}
        userName="Club President"
        timestamp="4:00 PM"
      />
      <TypingIndicator />
    </MessageList>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Typing indicator after a complex user question.',
      },
    },
  },
};

// ===== ANIMATION EXAMPLES =====

export const AnimatedEntry: Story = {
  render: () => {
    const [showTyping, setShowTyping] = React.useState(false);

    return (
      <div className="bg-black">
        <div className="p-4 border-b border-white/10">
          <button
            onClick={() => setShowTyping(!showTyping)}
            className="px-4 py-2 bg-white/10 hover:bg-white/15 rounded-lg text-white text-sm transition-colors"
          >
            {showTyping ? 'Hide Typing' : 'Show Typing'}
          </button>
        </div>
        <MessageList>
          <MessageBubble
            variant="user"
            content="What's the weather like today?"
            userName="You"
            timestamp="now"
          />
          <AnimatePresence>
            {showTyping && <TypingIndicator />}
          </AnimatePresence>
        </MessageList>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates the entry and exit animations of the typing indicator.',
      },
    },
  },
};

export const SimulatedResponse: Story = {
  render: () => {
    const [phase, setPhase] = React.useState<'idle' | 'typing' | 'response'>('idle');

    const simulateAI = () => {
      setPhase('typing');
      setTimeout(() => setPhase('response'), 2000);
    };

    const reset = () => setPhase('idle');

    return (
      <div className="bg-black">
        <div className="p-4 border-b border-white/10 flex gap-2">
          <button
            onClick={simulateAI}
            disabled={phase !== 'idle'}
            className="px-4 py-2 bg-[var(--hive-gold-cta)]/20 hover:bg-[var(--hive-gold-cta)]/30 disabled:opacity-50 rounded-lg text-[var(--hive-gold-cta)] text-sm transition-colors"
          >
            Simulate AI Response
          </button>
          {phase === 'response' && (
            <button
              onClick={reset}
              className="px-4 py-2 bg-white/10 hover:bg-white/15 rounded-lg text-white text-sm transition-colors"
            >
              Reset
            </button>
          )}
        </div>
        <MessageList>
          <MessageBubble
            variant="user"
            content="Tell me about HIVE's features."
            userName="You"
            timestamp="now"
          />
          <AnimatePresence mode="wait">
            {phase === 'typing' && <TypingIndicator key="typing" />}
            {phase === 'response' && (
              <MessageBubble
                key="response"
                variant="ai"
                content="HIVE offers a comprehensive suite of community management tools including real-time chat, polls, events, and AI-powered assistance to help student organizations thrive."
                timestamp="now"
              />
            )}
          </AnimatePresence>
        </MessageList>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Simulates the complete flow: user message → typing → AI response.',
      },
    },
  },
};

export const ContinuousTyping: Story = {
  render: () => {
    const [messages, setMessages] = React.useState([
      { variant: 'user' as const, content: 'Start the conversation!', userName: 'You', timestamp: 'now' },
    ]);
    const [isTyping, setIsTyping] = React.useState(false);

    const addMessage = () => {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [
          ...prev,
          {
            variant: 'ai' as const,
            content: `Response #${prev.length}. Here's more information about your question...`,
            timestamp: 'now',
          },
        ]);
      }, 1500);
    };

    return (
      <div className="bg-black max-h-[500px] flex flex-col">
        <div className="p-4 border-b border-white/10">
          <button
            onClick={addMessage}
            disabled={isTyping}
            className="px-4 py-2 bg-white/10 hover:bg-white/15 disabled:opacity-50 rounded-lg text-white text-sm transition-colors"
          >
            {isTyping ? 'AI is typing...' : 'Get AI Response'}
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <MessageList>
            {messages.map((msg, i) => (
              <MessageBubble key={i} {...msg} />
            ))}
            <AnimatePresence>
              {isTyping && <TypingIndicator />}
            </AnimatePresence>
          </MessageList>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive demo with continuous message additions.',
      },
    },
  },
};

// ===== TIMING EXAMPLES =====

export const QuickResponse: Story = {
  render: () => {
    const [phase, setPhase] = React.useState<'typing' | 'done'>('typing');

    React.useEffect(() => {
      const timer = setTimeout(() => setPhase('done'), 500);
      return () => clearTimeout(timer);
    }, []);

    return (
      <MessageList>
        <MessageBubble
          variant="user"
          content="Hi!"
          userName="You"
          timestamp="now"
        />
        <AnimatePresence mode="wait">
          {phase === 'typing' ? (
            <TypingIndicator key="typing" />
          ) : (
            <MessageBubble
              key="response"
              variant="ai"
              content="Hello! 👋"
              timestamp="now"
            />
          )}
        </AnimatePresence>
      </MessageList>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Quick typing indicator for simple responses (500ms).',
      },
    },
  },
};

export const LongProcessing: Story = {
  render: () => {
    const [elapsed, setElapsed] = React.useState(0);

    React.useEffect(() => {
      const interval = setInterval(() => {
        setElapsed(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }, []);

    return (
      <div className="bg-black">
        <div className="p-4 border-b border-white/10">
          <p className="text-white/60 text-sm">
            Processing time: <span className="text-[var(--hive-gold-cta)]">{elapsed}s</span>
          </p>
        </div>
        <MessageList>
          <MessageBubble
            variant="user"
            content="Generate a comprehensive report on our club's activities this semester."
            userName="You"
            timestamp="now"
          />
          <TypingIndicator />
        </MessageList>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Typing indicator during longer processing times.',
      },
    },
  },
};

// ===== LAYOUT CONSISTENCY =====

export const LayoutAlignment: Story = {
  render: () => (
    <div className="bg-black">
      <div className="p-4 border-b border-white/10">
        <p className="text-white/60 text-sm">Notice how the typing indicator aligns with the AI message avatar</p>
      </div>
      <MessageList>
        <MessageBubble
          variant="ai"
          content="This is an AI message for comparison."
          timestamp="1:00 PM"
        />
        <TypingIndicator />
        <MessageBubble
          variant="ai"
          content="Another AI message to show alignment."
          timestamp="1:01 PM"
        />
      </MessageList>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates that the typing indicator matches AI message layout exactly.',
      },
    },
  },
};

// ===== COMPARISON =====

export const WithAndWithoutIndicator: Story = {
  render: () => {
    const [showIndicator, setShowIndicator] = React.useState(true);

    return (
      <div className="bg-black">
        <div className="p-4 border-b border-white/10 flex gap-4 items-center">
          <label className="flex items-center gap-2 text-white text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={showIndicator}
              onChange={(e) => setShowIndicator(e.target.checked)}
              className="w-4 h-4 rounded border-white/20"
            />
            Show typing indicator
          </label>
        </div>
        <MessageList>
          <MessageBubble
            variant="user"
            content="Is anyone there?"
            userName="You"
            timestamp="now"
          />
          <AnimatePresence>
            {showIndicator && <TypingIndicator />}
          </AnimatePresence>
        </MessageList>
      </div>
    );
  },
};

// ===== ACCESSIBILITY =====

export const ReducedMotion: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'The component respects prefers-reduced-motion settings. Enable reduced motion in your browser/OS to test.',
      },
    },
  },
};

// ===== REAL-WORLD SCENARIOS =====

export const SpaceChatContext: Story = {
  render: () => (
    <div className="bg-black">
      <div className="p-4 border-b border-white/10 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500/40 to-teal-600/40 flex items-center justify-center text-white text-sm font-bold">
          D
        </div>
        <div>
          <p className="text-white text-sm font-medium">Design Club</p>
          <p className="text-white/40 text-xs">47 members</p>
        </div>
      </div>
      <MessageList>
        <MessageBubble
          variant="user"
          content="@HIVE Create a poll for our next workshop topic"
          userName="Sarah"
          avatarUrl="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop"
          timestamp="3:45 PM"
        />
        <TypingIndicator />
      </MessageList>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Typing indicator in the context of a Space chat.',
      },
    },
  },
};

export const AIAssistantContext: Story = {
  render: () => (
    <div className="bg-black">
      <div className="p-4 border-b border-white/10 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-[var(--hive-gold-cta)]/20 flex items-center justify-center">
          <div className="w-4 h-4 rounded-full bg-[var(--hive-gold-cta)]" />
        </div>
        <div>
          <p className="text-white text-sm font-medium">HIVE AI Assistant</p>
          <p className="text-white/40 text-xs">Always here to help</p>
        </div>
      </div>
      <MessageList>
        <MessageBubble
          variant="user"
          content="How do I set up automated welcome messages for new members?"
          userName="Club Admin"
          timestamp="4:00 PM"
        />
        <TypingIndicator />
      </MessageList>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Typing indicator in the HIVE AI assistant context.',
      },
    },
  },
};
