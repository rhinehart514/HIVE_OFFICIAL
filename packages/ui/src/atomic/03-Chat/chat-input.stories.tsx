'use client';

import * as React from 'react';
import { action } from '@storybook/addon-actions';

import { ChatInput, type ChatInputProps, type ToolInsertData } from './chat-input';

import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: '03-Chat/Atoms/ChatInput',
  component: ChatInput,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'OpenAI-style message input with auto-expanding textarea, slash command autocomplete, tool insertion toolbar, and character counter. Supports keyboard shortcuts (Enter to send, Shift+Enter for newline) and typing indicators.',
      },
    },
    backgrounds: {
      default: 'dark',
    },
  },
  tags: ['autodocs'],
  argTypes: {
    isGenerating: {
      control: 'boolean',
      description: 'Whether AI is currently generating a response',
    },
    showToolbar: {
      control: 'boolean',
      description: 'Show the tool insertion toolbar',
    },
    canInsertTools: {
      control: 'boolean',
      description: 'Whether user can insert tools',
    },
    enableSlashCommands: {
      control: 'boolean',
      description: 'Enable slash command autocomplete',
    },
    placeholder: {
      control: 'text',
      description: 'Input placeholder text',
    },
    maxLength: {
      control: 'number',
      description: 'Maximum character limit',
    },
    showCounter: {
      control: 'boolean',
      description: 'Show character counter',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable the input',
    },
  },
  decorators: [
    (Story) => (
      <div className="min-h-[400px] bg-black flex flex-col justify-end">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ChatInput>;

export default meta;
type Story = StoryObj<typeof meta>;

// ===== BASIC STATES =====

export const Default: Story = {
  args: {
    onSubmit: action('onSubmit'),
    placeholder: 'Message HIVE AI...',
  },
};

export const WithToolbar: Story = {
  args: {
    onSubmit: action('onSubmit'),
    showToolbar: true,
    onInsertTool: action('onInsertTool') as (data: ToolInsertData) => void,
    onOpenToolGallery: action('onOpenToolGallery'),
  },
};

export const WithSlashCommands: Story = {
  args: {
    onSubmit: action('onSubmit'),
    enableSlashCommands: true,
    placeholder: 'Type / for quick actions...',
  },
  parameters: {
    docs: {
      description: {
        story: 'Type "/" to see the slash command autocomplete with available quick actions like /poll, /rsvp, /countdown, etc.',
      },
    },
  },
};

export const WithCharacterCounter: Story = {
  args: {
    onSubmit: action('onSubmit'),
    showCounter: true,
    maxLength: 280,
    placeholder: 'Write a short message...',
  },
};

export const Disabled: Story = {
  args: {
    onSubmit: action('onSubmit'),
    disabled: true,
    placeholder: 'Input disabled...',
  },
};

export const GeneratingResponse: Story = {
  args: {
    onSubmit: action('onSubmit'),
    onStop: action('onStop'),
    isGenerating: true,
    placeholder: 'Message HIVE AI...',
  },
  parameters: {
    docs: {
      description: {
        story: 'When AI is generating a response, the send button transforms into a stop button.',
      },
    },
  },
};

// ===== PLACEHOLDER VARIANTS =====

export const SpaceChatPlaceholder: Story = {
  args: {
    onSubmit: action('onSubmit'),
    placeholder: 'Message Design Club...',
    enableSlashCommands: true,
  },
};

export const AIAssistantPlaceholder: Story = {
  args: {
    onSubmit: action('onSubmit'),
    placeholder: 'Ask me anything...',
    enableSlashCommands: false,
  },
};

export const QuickMessagePlaceholder: Story = {
  args: {
    onSubmit: action('onSubmit'),
    placeholder: 'Send a quick reply...',
    showCounter: true,
    maxLength: 500,
  },
};

// ===== SIZE & LENGTH VARIANTS =====

export const ShortMaxLength: Story = {
  args: {
    onSubmit: action('onSubmit'),
    maxLength: 140,
    showCounter: true,
    placeholder: 'Tweet-length message...',
  },
};

export const LongMaxLength: Story = {
  args: {
    onSubmit: action('onSubmit'),
    maxLength: 5000,
    showCounter: true,
    placeholder: 'Long-form content welcome...',
  },
};

// ===== INTERACTIVE EXAMPLES =====

export const InteractiveSubmit: Story = {
  render: () => {
    const [messages, setMessages] = React.useState<string[]>([]);

    return (
      <div className="flex flex-col h-[500px] bg-black">
        <div className="flex-1 p-4 overflow-y-auto space-y-2">
          {messages.length === 0 ? (
            <p className="text-white/40 text-center py-8">Send a message to see it appear here</p>
          ) : (
            messages.map((msg, i) => (
              <div key={i} className="bg-white/5 rounded-lg p-3 text-white/80 text-sm">
                {msg}
              </div>
            ))
          )}
        </div>
        <ChatInput
          onSubmit={(message) => {
            setMessages(prev => [...prev, message]);
            action('onSubmit')(message);
          }}
          placeholder="Type a message and press Enter..."
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive demo showing messages being submitted and displayed.',
      },
    },
  },
};

export const InteractiveTypingIndicator: Story = {
  render: () => {
    const [typingCount, setTypingCount] = React.useState(0);

    return (
      <div className="flex flex-col h-[400px] bg-black">
        <div className="flex-1 p-4">
          <p className="text-white/60 text-sm">
            Typing events fired: <span className="text-[var(--hive-gold-cta)]">{typingCount}</span>
          </p>
        </div>
        <ChatInput
          onSubmit={action('onSubmit')}
          onTyping={() => setTypingCount(prev => prev + 1)}
          placeholder="Start typing to trigger events..."
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates the onTyping callback for implementing typing indicators.',
      },
    },
  },
};

export const InteractiveSlashCommands: Story = {
  render: () => {
    const inputRef = React.useRef<{ setValue: (value: string) => void; focus: () => void } | null>(null);

    return (
      <div className="flex flex-col h-[500px] bg-black">
        <div className="flex-1 p-4">
          <h3 className="text-white font-medium mb-3">Try these slash commands:</h3>
          <div className="space-y-2 text-sm">
            <p className="text-white/60">• <code className="text-[var(--hive-gold-cta)]">/poll</code> - Create a poll</p>
            <p className="text-white/60">• <code className="text-[var(--hive-gold-cta)]">/rsvp</code> - Create an RSVP</p>
            <p className="text-white/60">• <code className="text-[var(--hive-gold-cta)]">/countdown</code> - Create a countdown</p>
            <p className="text-white/60">• <code className="text-[var(--hive-gold-cta)]">/announce</code> - Post announcement</p>
            <p className="text-white/60">• <code className="text-[var(--hive-gold-cta)]">/welcome</code> - Auto-greet new members</p>
            <p className="text-white/60">• <code className="text-[var(--hive-gold-cta)]">/remind</code> - Event reminder</p>
            <p className="text-white/60">• <code className="text-[var(--hive-gold-cta)]">/automate</code> - Create automation</p>
            <p className="text-white/60">• <code className="text-[var(--hive-gold-cta)]">/help</code> - Show help</p>
          </div>
          <button
            onClick={() => {
              inputRef.current?.setValue('/');
              inputRef.current?.focus();
            }}
            className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/15 rounded-lg text-white text-sm transition-colors"
          >
            Click to start with /
          </button>
        </div>
        <ChatInput
          ref={inputRef}
          onSubmit={action('onSubmit')}
          enableSlashCommands={true}
          placeholder="Type / to see commands..."
        />
      </div>
    );
  },
};

export const InteractiveToolInsertion: Story = {
  render: () => {
    const [insertedTools, setInsertedTools] = React.useState<ToolInsertData[]>([]);

    return (
      <div className="flex flex-col h-[500px] bg-black">
        <div className="flex-1 p-4 overflow-y-auto">
          <h3 className="text-white font-medium mb-3">Inserted Tools:</h3>
          {insertedTools.length === 0 ? (
            <p className="text-white/40 text-sm">Click the + button to insert tools</p>
          ) : (
            <div className="space-y-2">
              {insertedTools.map((tool, i) => (
                <div key={i} className="bg-white/5 rounded-lg p-3">
                  <p className="text-white/80 text-sm font-medium">{tool.type}</p>
                  <pre className="text-white/50 text-xs mt-1 overflow-x-auto">
                    {JSON.stringify(tool, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>
        <ChatInput
          onSubmit={action('onSubmit')}
          showToolbar={true}
          onInsertTool={(data) => {
            setInsertedTools(prev => [...prev, data]);
            action('onInsertTool')(data);
          }}
          onOpenToolGallery={action('onOpenToolGallery')}
        />
      </div>
    );
  },
};

export const InteractiveGenerating: Story = {
  render: () => {
    const [isGenerating, setIsGenerating] = React.useState(false);

    const handleSubmit = (message: string) => {
      action('onSubmit')(message);
      setIsGenerating(true);
      setTimeout(() => setIsGenerating(false), 3000);
    };

    return (
      <div className="flex flex-col h-[400px] bg-black">
        <div className="flex-1 p-4 flex items-center justify-center">
          <p className={`text-sm ${isGenerating ? 'text-[var(--hive-gold-cta)]' : 'text-white/40'}`}>
            {isGenerating ? 'Generating response... (will stop after 3s)' : 'Send a message to start generating'}
          </p>
        </div>
        <ChatInput
          onSubmit={handleSubmit}
          onStop={() => {
            setIsGenerating(false);
            action('onStop')();
          }}
          isGenerating={isGenerating}
          placeholder="Send to simulate generation..."
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates the generating state with the stop button functionality.',
      },
    },
  },
};

// ===== EDGE CASES =====

export const NearCharacterLimit: Story = {
  render: () => {
    const inputRef = React.useRef<{ setValue: (value: string) => void } | null>(null);
    const maxLength = 100;
    const nearLimitText = 'This is a message that is very close to the character limit and will show the warning indicator.';

    React.useEffect(() => {
      inputRef.current?.setValue(nearLimitText);
    }, []);

    return (
      <div className="flex flex-col h-[400px] bg-black justify-end">
        <ChatInput
          ref={inputRef}
          onSubmit={action('onSubmit')}
          maxLength={maxLength}
          showCounter={true}
          placeholder="Character limit demo..."
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows the character counter warning when approaching the limit.',
      },
    },
  },
};

export const LongMultilineMessage: Story = {
  render: () => {
    const inputRef = React.useRef<{ setValue: (value: string) => void } | null>(null);
    const longMessage = `This is a long multiline message that demonstrates how the textarea expands.

Line 2 of the message with more content.

Line 3 continues with additional text to show the auto-expanding behavior.

The textarea should grow to accommodate all this content while respecting the max-height limit.

Additional lines to test scrolling behavior when content exceeds max-height.`;

    React.useEffect(() => {
      inputRef.current?.setValue(longMessage);
    }, []);

    return (
      <div className="flex flex-col h-[500px] bg-black justify-end">
        <ChatInput
          ref={inputRef}
          onSubmit={action('onSubmit')}
          placeholder="Multiline demo..."
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates the auto-expanding textarea with multiline content.',
      },
    },
  },
};

export const AllFeaturesEnabled: Story = {
  args: {
    onSubmit: action('onSubmit'),
    onStop: action('onStop'),
    onInsertTool: action('onInsertTool') as (data: ToolInsertData) => void,
    onOpenToolGallery: action('onOpenToolGallery'),
    onTyping: action('onTyping'),
    showToolbar: true,
    canInsertTools: true,
    enableSlashCommands: true,
    showCounter: true,
    maxLength: 2000,
    placeholder: 'All features enabled...',
  },
  parameters: {
    docs: {
      description: {
        story: 'ChatInput with all features enabled: toolbar, slash commands, character counter.',
      },
    },
  },
};

export const MinimalConfiguration: Story = {
  args: {
    onSubmit: action('onSubmit'),
    showToolbar: false,
    enableSlashCommands: false,
    showCounter: false,
    placeholder: 'Simple message...',
  },
  parameters: {
    docs: {
      description: {
        story: 'Minimal ChatInput with no toolbar, slash commands, or counter.',
      },
    },
  },
};

// ===== ACCESSIBILITY EXAMPLES =====

export const KeyboardNavigation: Story = {
  render: () => (
    <div className="flex flex-col h-[400px] bg-black">
      <div className="flex-1 p-4">
        <h3 className="text-white font-medium mb-3">Keyboard Shortcuts:</h3>
        <div className="space-y-2 text-sm text-white/60">
          <p><kbd className="px-2 py-1 bg-white/10 rounded text-white/80">Enter</kbd> — Send message</p>
          <p><kbd className="px-2 py-1 bg-white/10 rounded text-white/80">Shift + Enter</kbd> — New line</p>
          <p><kbd className="px-2 py-1 bg-white/10 rounded text-white/80">↑↓</kbd> — Navigate autocomplete</p>
          <p><kbd className="px-2 py-1 bg-white/10 rounded text-white/80">Tab</kbd> — Select autocomplete item</p>
          <p><kbd className="px-2 py-1 bg-white/10 rounded text-white/80">Escape</kbd> — Close autocomplete</p>
        </div>
      </div>
      <ChatInput
        onSubmit={action('onSubmit')}
        enableSlashCommands={true}
        placeholder="Try keyboard shortcuts..."
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates all keyboard shortcuts for navigating the ChatInput.',
      },
    },
  },
};

// ===== COMPARISON STORIES =====

export const VariantComparison: Story = {
  render: () => (
    <div className="space-y-8 bg-black p-4">
      <div>
        <h4 className="text-white/60 text-sm mb-2">Default</h4>
        <ChatInput onSubmit={action('onSubmit')} placeholder="Default input..." />
      </div>
      <div>
        <h4 className="text-white/60 text-sm mb-2">With Toolbar</h4>
        <ChatInput
          onSubmit={action('onSubmit')}
          showToolbar={true}
          onInsertTool={action('onInsertTool') as (data: ToolInsertData) => void}
          placeholder="With toolbar..."
        />
      </div>
      <div>
        <h4 className="text-white/60 text-sm mb-2">With Counter</h4>
        <ChatInput
          onSubmit={action('onSubmit')}
          showCounter={true}
          maxLength={280}
          placeholder="With counter..."
        />
      </div>
      <div>
        <h4 className="text-white/60 text-sm mb-2">Disabled</h4>
        <ChatInput onSubmit={action('onSubmit')} disabled={true} placeholder="Disabled input..." />
      </div>
      <div>
        <h4 className="text-white/60 text-sm mb-2">Generating</h4>
        <ChatInput
          onSubmit={action('onSubmit')}
          onStop={action('onStop')}
          isGenerating={true}
          placeholder="Generating..."
        />
      </div>
    </div>
  ),
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story: 'Side-by-side comparison of different ChatInput configurations.',
      },
    },
  },
};
