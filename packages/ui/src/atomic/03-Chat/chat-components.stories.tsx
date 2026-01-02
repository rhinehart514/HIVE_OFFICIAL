'use client';

import * as React from 'react';
import { action } from '@storybook/addon-actions';

import {
  IntentConfirmation,
  type DetectedIntent,
  type IntentType,
} from './intent-confirmation';
import {
  CommandAutocomplete,
  type CommandSuggestion,
} from './command-autocomplete';
import { CommandPreview } from './command-preview';
import { ToolPreviewCard } from './tool-preview-card';
import { ChatToolbar } from './chat-toolbar';

import type { Meta, StoryObj } from '@storybook/react';

// ============================================================
// Meta Configuration
// ============================================================

const meta = {
  title: '03-Chat/Components',
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Chat components for slash commands, intent detection, and tool previews.',
      },
    },
    backgrounds: {
      default: 'dark',
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="min-h-screen bg-[#0A0A0A] p-8">
        <Story />
      </div>
    ),
  ],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================
// MOCK DATA
// ============================================================

const mockCommands: CommandSuggestion[] = [
  {
    name: 'poll',
    description: 'Create a quick poll for the space',
    syntax: '/poll "Question" "Option 1" "Option 2"',
    icon: 'BarChart3',
    requiredRole: 'member',
  },
  {
    name: 'countdown',
    description: 'Start a countdown timer',
    syntax: '/countdown 5m',
    icon: 'Timer',
    requiredRole: 'leader',
  },
  {
    name: 'rsvp',
    description: 'Create an RSVP for an event',
    syntax: '/rsvp "Event Name" 2024-12-31',
    icon: 'CalendarCheck',
    requiredRole: 'leader',
  },
  {
    name: 'announce',
    description: 'Post an announcement',
    syntax: '/announce "Message"',
    icon: 'Megaphone',
    requiredRole: 'leader',
  },
];

const mockPollIntent: DetectedIntent = {
  hasIntent: true,
  intentType: 'poll',
  confidence: 0.92,
  preview: 'Quick Poll: "What day works best for our meeting?"',
  confirmation: 'Create a poll asking about meeting times?',
  params: {
    question: 'What day works best for our meeting?',
    options: ['Monday', 'Wednesday', 'Friday'],
  },
  canCreate: true,
};

const mockCountdownIntent: DetectedIntent = {
  hasIntent: true,
  intentType: 'countdown',
  confidence: 0.88,
  preview: 'Countdown: Sprint ends in 2 hours',
  confirmation: 'Create a 2-hour countdown?',
  params: { duration: '2h' },
  canCreate: true,
};

const mockRsvpIntent: DetectedIntent = {
  hasIntent: true,
  intentType: 'rsvp',
  confidence: 0.95,
  preview: 'RSVP: Design Review Session',
  confirmation: 'Create an RSVP for "Design Review Session"?',
  params: { eventName: 'Design Review Session' },
  canCreate: true,
};

// ============================================================
// INTENT CONFIRMATION STORIES
// ============================================================

export const IntentConfirmationPoll: Story = {
  render: () => (
    <div className="w-96">
      <IntentConfirmation
        intent={mockPollIntent}
        onConfirm={action('onConfirm')}
        onCancel={action('onCancel')}
      />
    </div>
  ),
  parameters: {
    docs: { description: { story: 'Intent confirmation for creating a poll.' } },
  },
};

export const IntentConfirmationCountdown: Story = {
  render: () => (
    <div className="w-96">
      <IntentConfirmation
        intent={mockCountdownIntent}
        onConfirm={action('onConfirm')}
        onCancel={action('onCancel')}
      />
    </div>
  ),
};

export const IntentConfirmationRsvp: Story = {
  render: () => (
    <div className="w-96">
      <IntentConfirmation
        intent={mockRsvpIntent}
        onConfirm={action('onConfirm')}
        onCancel={action('onCancel')}
      />
    </div>
  ),
};

export const IntentConfirmationAnnouncement: Story = {
  render: () => (
    <div className="w-96">
      <IntentConfirmation
        intent={{
          hasIntent: true,
          intentType: 'announcement',
          confidence: 0.91,
          preview: 'Announcement: Important update for all members',
          confirmation: 'Post this announcement?',
          canCreate: true,
        }}
        onConfirm={action('onConfirm')}
        onCancel={action('onCancel')}
      />
    </div>
  ),
};

export const IntentConfirmationCreating: Story = {
  render: () => (
    <div className="w-96">
      <IntentConfirmation
        intent={mockPollIntent}
        onConfirm={action('onConfirm')}
        onCancel={action('onCancel')}
        isCreating
      />
    </div>
  ),
  parameters: {
    docs: { description: { story: 'Loading state while creating component.' } },
  },
};

export const IntentConfirmationLowConfidence: Story = {
  render: () => (
    <div className="w-96">
      <IntentConfirmation
        intent={{
          ...mockPollIntent,
          confidence: 0.45,
        }}
        onConfirm={action('onConfirm')}
        onCancel={action('onCancel')}
      />
    </div>
  ),
  parameters: {
    docs: { description: { story: 'Low confidence detection shows warning.' } },
  },
};

export const IntentConfirmationCannotCreate: Story = {
  render: () => (
    <div className="w-96">
      <IntentConfirmation
        intent={{
          ...mockCountdownIntent,
          canCreate: false,
          error: 'Only space leaders can create countdowns.',
        }}
        onConfirm={action('onConfirm')}
        onCancel={action('onCancel')}
      />
    </div>
  ),
  parameters: {
    docs: { description: { story: 'Shows error when user cannot create component.' } },
  },
};

export const IntentConfirmationAllTypes: Story = {
  render: () => {
    const types: IntentType[] = ['poll', 'rsvp', 'countdown', 'announcement'];
    return (
      <div className="space-y-4">
        {types.map((type) => (
          <div key={type} className="w-96">
            <IntentConfirmation
              intent={{
                hasIntent: true,
                intentType: type,
                confidence: 0.9,
                preview: `${type.charAt(0).toUpperCase() + type.slice(1)} preview`,
                confirmation: `Create ${type}?`,
                canCreate: true,
              }}
              onConfirm={action('onConfirm')}
              onCancel={action('onCancel')}
            />
          </div>
        ))}
      </div>
    );
  },
  parameters: {
    docs: { description: { story: 'All intent types displayed together.' } },
  },
};

// ============================================================
// COMMAND AUTOCOMPLETE STORIES
// ============================================================

export const CommandAutocompleteDefault: Story = {
  render: () => (
    <div className="w-96 relative h-64">
      <div className="absolute bottom-0 left-0 right-0">
        <CommandAutocomplete
          suggestions={mockCommands}
          selectedIndex={0}
          onSelect={action('onSelect')}
          onSelectionChange={action('onSelectionChange')}
          visible
          query="/p"
          userRole="leader"
        />
      </div>
    </div>
  ),
  parameters: {
    docs: { description: { story: 'Slash command autocomplete dropdown.' } },
  },
};

export const CommandAutocompleteFiltered: Story = {
  render: () => (
    <div className="w-96 relative h-64">
      <div className="absolute bottom-0 left-0 right-0">
        <CommandAutocomplete
          suggestions={mockCommands.filter(c => c.name.startsWith('p'))}
          selectedIndex={0}
          onSelect={action('onSelect')}
          onSelectionChange={action('onSelectionChange')}
          visible
          query="/po"
          userRole="leader"
        />
      </div>
    </div>
  ),
  parameters: {
    docs: { description: { story: 'Filtered commands based on input.' } },
  },
};

export const CommandAutocompleteMemberRole: Story = {
  render: () => (
    <div className="w-96 relative h-64">
      <div className="absolute bottom-0 left-0 right-0">
        <CommandAutocomplete
          suggestions={mockCommands}
          selectedIndex={0}
          onSelect={action('onSelect')}
          onSelectionChange={action('onSelectionChange')}
          visible
          query="/"
          userRole="member"
        />
      </div>
    </div>
  ),
  parameters: {
    docs: { description: { story: 'Member role shows which commands require leader access.' } },
  },
};

export const CommandAutocompleteNavigated: Story = {
  render: () => {
    const [selected, setSelected] = React.useState(0);
    return (
      <div className="w-96 relative h-64">
        <p className="text-white/60 text-sm mb-4">Use arrow keys to navigate</p>
        <div className="absolute bottom-0 left-0 right-0">
          <CommandAutocomplete
            suggestions={mockCommands}
            selectedIndex={selected}
            onSelect={action('onSelect')}
            onSelectionChange={setSelected}
            visible
            query="/"
            userRole="leader"
          />
        </div>
      </div>
    );
  },
};

export const CommandAutocompleteEmpty: Story = {
  render: () => (
    <div className="w-96 relative h-32">
      <div className="absolute bottom-0 left-0 right-0">
        <CommandAutocomplete
          suggestions={[]}
          selectedIndex={-1}
          onSelect={action('onSelect')}
          onSelectionChange={action('onSelectionChange')}
          visible
          query="/xyz"
          userRole="leader"
        />
      </div>
    </div>
  ),
  parameters: {
    docs: { description: { story: 'No matching commands found.' } },
  },
};

// ============================================================
// COMMAND PREVIEW STORIES
// ============================================================

export const CommandPreviewPoll: Story = {
  render: () => (
    <div className="w-96">
      <CommandPreview
        command={mockCommands[0]}
        params={{
          question: 'What day works best?',
          options: ['Monday', 'Wednesday', 'Friday'],
        }}
      />
    </div>
  ),
  parameters: {
    docs: { description: { story: 'Preview of poll command before executing.' } },
  },
};

export const CommandPreviewCountdown: Story = {
  render: () => (
    <div className="w-96">
      <CommandPreview
        command={mockCommands[1]}
        params={{
          duration: '2h 30m',
          label: 'Sprint ends',
        }}
      />
    </div>
  ),
};

export const CommandPreviewRsvp: Story = {
  render: () => (
    <div className="w-96">
      <CommandPreview
        command={mockCommands[2]}
        params={{
          eventName: 'Design Review',
          date: '2024-12-31',
          maxAttendees: 20,
        }}
      />
    </div>
  ),
};

// ============================================================
// TOOL PREVIEW CARD STORIES
// ============================================================

export const ToolPreviewCardPoll: Story = {
  render: () => (
    <div className="w-80">
      <ToolPreviewCard
        type="poll"
        title="Quick Poll"
        description="What day works best for our meeting?"
        metadata={{ options: 3, responses: 12 }}
        onClick={action('onClick')}
      />
    </div>
  ),
  parameters: {
    docs: { description: { story: 'Preview card for a poll tool.' } },
  },
};

export const ToolPreviewCardCountdown: Story = {
  render: () => (
    <div className="w-80">
      <ToolPreviewCard
        type="countdown"
        title="Sprint Countdown"
        description="Time remaining until sprint end"
        metadata={{ timeRemaining: '2h 15m' }}
        onClick={action('onClick')}
      />
    </div>
  ),
};

export const ToolPreviewCardRsvp: Story = {
  render: () => (
    <div className="w-80">
      <ToolPreviewCard
        type="rsvp"
        title="Design Review RSVP"
        description="Thursday, Dec 28 at 4:00 PM"
        metadata={{ going: 8, maybe: 3, maxCapacity: 20 }}
        onClick={action('onClick')}
      />
    </div>
  ),
};

export const ToolPreviewCardActive: Story = {
  render: () => (
    <div className="w-80">
      <ToolPreviewCard
        type="poll"
        title="Active Poll"
        description="Vote now!"
        metadata={{ options: 4, responses: 24 }}
        isActive
        onClick={action('onClick')}
      />
    </div>
  ),
  parameters: {
    docs: { description: { story: 'Active/live tool with pulsing indicator.' } },
  },
};

export const ToolPreviewCardExpired: Story = {
  render: () => (
    <div className="w-80">
      <ToolPreviewCard
        type="countdown"
        title="Expired Countdown"
        description="This countdown has ended"
        metadata={{ endedAt: '2 hours ago' }}
        isExpired
        onClick={action('onClick')}
      />
    </div>
  ),
};

// ============================================================
// CHAT TOOLBAR STORIES
// ============================================================

export const ChatToolbarDefault: Story = {
  render: () => (
    <div className="w-full max-w-2xl">
      <ChatToolbar
        onBold={action('onBold')}
        onItalic={action('onItalic')}
        onLink={action('onLink')}
        onEmoji={action('onEmoji')}
        onAttach={action('onAttach')}
        onCommand={action('onCommand')}
      />
    </div>
  ),
  parameters: {
    docs: { description: { story: 'Chat input toolbar with formatting options.' } },
  },
};

export const ChatToolbarLeader: Story = {
  render: () => (
    <div className="w-full max-w-2xl">
      <ChatToolbar
        isLeader
        onBold={action('onBold')}
        onItalic={action('onItalic')}
        onLink={action('onLink')}
        onEmoji={action('onEmoji')}
        onAttach={action('onAttach')}
        onCommand={action('onCommand')}
        onPin={action('onPin')}
        onAnnounce={action('onAnnounce')}
      />
    </div>
  ),
  parameters: {
    docs: { description: { story: 'Leader toolbar with additional options.' } },
  },
};

export const ChatToolbarCompact: Story = {
  render: () => (
    <div className="w-80">
      <ChatToolbar
        compact
        onBold={action('onBold')}
        onEmoji={action('onEmoji')}
        onAttach={action('onAttach')}
      />
    </div>
  ),
  parameters: {
    docs: { description: { story: 'Compact toolbar for mobile.' } },
  },
};

export const ChatToolbarDisabled: Story = {
  render: () => (
    <div className="w-full max-w-2xl">
      <ChatToolbar
        disabled
        onBold={action('onBold')}
        onItalic={action('onItalic')}
        onEmoji={action('onEmoji')}
      />
    </div>
  ),
  parameters: {
    docs: { description: { story: 'Disabled toolbar (e.g., when not connected).' } },
  },
};

// ============================================================
// COMPOSITION STORIES
// ============================================================

export const ChatInputWithAutocomplete: Story = {
  render: () => {
    const [query, setQuery] = React.useState('/');
    const [showAutocomplete, setShowAutocomplete] = React.useState(true);
    const [selectedIndex, setSelectedIndex] = React.useState(0);

    const filteredCommands = mockCommands.filter(c =>
      c.name.toLowerCase().includes(query.slice(1).toLowerCase())
    );

    return (
      <div className="w-96 relative">
        <div className="space-y-2">
          <p className="text-white/60 text-sm">Type a slash command:</p>
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowAutocomplete(e.target.value.startsWith('/'));
            }}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white"
            placeholder="Type / to see commands..."
          />
        </div>
        {showAutocomplete && query.startsWith('/') && (
          <div className="absolute bottom-full left-0 right-0 mb-2">
            <CommandAutocomplete
              suggestions={filteredCommands}
              selectedIndex={selectedIndex}
              onSelect={(cmd) => {
                setQuery(`/${cmd.name} `);
                setShowAutocomplete(false);
              }}
              onSelectionChange={setSelectedIndex}
              visible
              query={query}
              userRole="leader"
            />
          </div>
        )}
      </div>
    );
  },
  parameters: {
    docs: { description: { story: 'Interactive chat input with command autocomplete.' } },
  },
};

export const IntentDetectionFlow: Story = {
  render: () => {
    const [step, setStep] = React.useState<'typing' | 'detected' | 'creating' | 'done'>('typing');
    const [message, setMessage] = React.useState('');

    const handleDetect = () => {
      if (message.toLowerCase().includes('poll')) {
        setStep('detected');
      }
    };

    const handleConfirm = () => {
      setStep('creating');
      setTimeout(() => setStep('done'), 1500);
    };

    return (
      <div className="w-96 space-y-4">
        <p className="text-white/60 text-sm">Type a message with "poll" to trigger detection:</p>

        {step === 'typing' && (
          <div className="space-y-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white"
              placeholder="Let's create a poll for meeting times..."
            />
            <button
              onClick={handleDetect}
              className="px-4 py-2 bg-[#FFD700] text-black rounded-lg font-medium"
            >
              Send Message
            </button>
          </div>
        )}

        {step === 'detected' && (
          <IntentConfirmation
            intent={mockPollIntent}
            onConfirm={handleConfirm}
            onCancel={() => setStep('typing')}
          />
        )}

        {step === 'creating' && (
          <IntentConfirmation
            intent={mockPollIntent}
            onConfirm={() => {}}
            onCancel={() => {}}
            isCreating
          />
        )}

        {step === 'done' && (
          <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
            <p className="text-green-400 font-medium">Poll created successfully!</p>
            <button
              onClick={() => {
                setStep('typing');
                setMessage('');
              }}
              className="mt-2 text-sm text-white/60 hover:text-white underline"
            >
              Try again
            </button>
          </div>
        )}
      </div>
    );
  },
  parameters: {
    docs: { description: { story: 'Complete intent detection and creation flow.' } },
  },
};
