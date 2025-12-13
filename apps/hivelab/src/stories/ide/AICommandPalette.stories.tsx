import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';
import { AICommandPalette } from '@hive/ui/components/hivelab/ide/ai-command-palette';

/**
 * # AI Command Palette (Cmd+K)
 *
 * The heart of AI-assisted building. Inspired by Cursor's Cmd+K and Linear's command bar.
 * Context-aware commands that adapt based on what's selected.
 *
 * ## Cursor-like Behavior
 * - **No selection**: Generate new tool, add elements
 * - **Single selection**: Modify, duplicate, connect
 * - **Multi-selection**: Batch modify, group, align
 *
 * ## Visual Identity
 * - Instant appearance (no slow fade)
 * - Weightless feel (centered, floating)
 * - Gold accent for AI actions
 * - Technical monospace for keyboard hints
 *
 * ## Interaction Model
 * - Opens with Cmd+K (muscle memory from dev tools)
 * - Arrow keys navigate, Enter selects
 * - Escape backs out progressively
 * - Freeform typing generates from prompt
 */
const meta: Meta<typeof AICommandPalette> = {
  title: 'HiveLab/IDE/AICommandPalette',
  component: AICommandPalette,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    backgrounds: { default: 'lab-canvas' },
    docs: {
      description: {
        component:
          'Cursor-like AI command palette. Context-aware commands that adapt based on selection.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div
        className="h-screen relative"
        style={{
          background: 'var(--lab-bg-canvas, #0A0A12)',
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      >
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof AICommandPalette>;

// Wrapper with state
function CommandPaletteWithState({
  selectedCount = 0,
  initialOpen = true,
}: {
  selectedCount?: number;
  initialOpen?: boolean;
}) {
  const [open, setOpen] = useState(initialOpen);
  const [loading, setLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');

  const handleSubmit = async (prompt: string, type: string) => {
    console.warn('Submit:', { prompt, type });
    setLoading(true);

    // Simulate streaming response
    const responses = [
      'Analyzing your request...',
      'I\'ll create a poll element with:',
      '• Question field for the prompt',
      '• 4 options by default',
      '• Real-time vote counting',
      '• Results animation',
    ];

    for (let i = 0; i < responses.length; i++) {
      await new Promise((r) => setTimeout(r, 300));
      setStreamingText((prev) => (prev ? prev + '\n' + responses[i] : responses[i]));
    }

    await new Promise((r) => setTimeout(r, 500));
    setLoading(false);
    setStreamingText('');
    setOpen(false);
  };

  return (
    <>
      {/* Selection indicator */}
      {selectedCount > 0 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-[#252525] border border-[#333] rounded-lg px-4 py-2 flex items-center gap-3">
          <div className="flex -space-x-2">
            {Array.from({ length: Math.min(selectedCount, 3) }).map((_, i) => (
              <div
                key={i}
                className="w-8 h-8 rounded bg-[#FFD700]/20 border-2 border-[#0A0A12] flex items-center justify-center"
              >
                <span className="text-xs text-[#FFD700]">E{i + 1}</span>
              </div>
            ))}
          </div>
          <span className="text-sm text-[#999]">
            {selectedCount} element{selectedCount > 1 ? 's' : ''} selected
          </span>
        </div>
      )}

      {/* Trigger hint */}
      {!open && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
          <button
            onClick={() => setOpen(true)}
            className="px-6 py-3 bg-[#252525] hover:bg-[#333] border border-[#333] rounded-lg transition-colors"
          >
            <span className="text-sm text-[#999]">Press </span>
            <kbd className="px-2 py-1 bg-[#333] rounded text-xs text-white mx-1">⌘K</kbd>
            <span className="text-sm text-[#999]"> to open</span>
          </button>
        </div>
      )}

      <AICommandPalette
        open={open}
        onClose={() => setOpen(false)}
        onSubmit={handleSubmit}
        loading={loading}
        streamingText={streamingText}
        selectedCount={selectedCount}
      />
    </>
  );
}

/**
 * Default state - no selection
 */
export const Default: Story = {
  render: () => <CommandPaletteWithState selectedCount={0} />,
};

/**
 * With one element selected - shows modify commands
 */
export const SingleSelection: Story = {
  render: () => <CommandPaletteWithState selectedCount={1} />,
};

/**
 * With multiple elements selected - shows batch commands
 */
export const MultiSelection: Story = {
  render: () => <CommandPaletteWithState selectedCount={3} />,
};

/**
 * Loading state with streaming AI response
 */
function LoadingWithStreamStory() {
  const [open, setOpen] = useState(true);

  return (
    <AICommandPalette
      open={open}
      onClose={() => setOpen(false)}
      onSubmit={async () => {}}
      loading={true}
      streamingText="Creating a poll element for your event...\n\n• Adding question field\n• Setting up 4 options\n• Enabling vote counting"
      selectedCount={0}
    />
  );
}

export const LoadingWithStream: Story = {
  render: () => <LoadingWithStreamStory />,
};

/**
 * Closed state - shows trigger hint
 */
export const Closed: Story = {
  render: () => <CommandPaletteWithState selectedCount={0} initialOpen={false} />,
};

/**
 * Command types showcase
 */
export const CommandTypes: Story = {
  decorators: [
    (Story) => (
      <div className="p-8 space-y-8" style={{ background: 'var(--lab-bg-canvas, #0A0A12)' }}>
        <Story />
      </div>
    ),
  ],
  render: () => (
    <>
      <h3 className="text-sm font-medium text-[#888] uppercase tracking-wider mb-6">
        Context-Aware Command Types
      </h3>

      {/* No Selection */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 text-xs rounded bg-[#333] text-[#999]">0 selected</span>
          <span className="text-xs text-[#666]">Generate & Add commands</span>
        </div>
        <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-4 space-y-2">
          {[
            { icon: '✨', label: 'Generate Tool', desc: 'Create a new tool from scratch', prefix: 'Create a tool that...' },
            { icon: '➕', label: 'Add Element', desc: 'Add a specific element to canvas', prefix: 'Add a...' },
          ].map((cmd) => (
            <div key={cmd.label} className="flex items-center gap-3 p-3 rounded-lg bg-[#252525]">
              <div className="w-8 h-8 rounded-lg bg-[#FFD700]/20 text-[#FFD700] flex items-center justify-center">
                {cmd.icon}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">{cmd.label}</p>
                <p className="text-xs text-[#666]">{cmd.desc}</p>
              </div>
              <p className="text-xs text-[#555] font-mono">{cmd.prefix}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Single Selection */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 text-xs rounded bg-[#FFD700]/20 text-[#FFD700]">1 selected</span>
          <span className="text-xs text-[#666]">Modify & Connect commands</span>
        </div>
        <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-4 space-y-2">
          {[
            { icon: '🎨', label: 'Modify Element', desc: 'Change the selected element', prefix: 'Make this element...' },
            { icon: '📋', label: 'Create Variation', desc: 'Duplicate with changes', prefix: 'Create a variation that...' },
            { icon: '⚡', label: 'Connect To...', desc: 'Link this element to another', prefix: 'Connect this to...' },
          ].map((cmd) => (
            <div key={cmd.label} className="flex items-center gap-3 p-3 rounded-lg bg-[#252525]">
              <div className="w-8 h-8 rounded-lg bg-[#252525] border border-[#333] flex items-center justify-center text-sm">
                {cmd.icon}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">{cmd.label}</p>
                <p className="text-xs text-[#666]">{cmd.desc}</p>
              </div>
              <p className="text-xs text-[#555] font-mono">{cmd.prefix}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Multi Selection */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 text-xs rounded bg-blue-500/20 text-blue-400">3+ selected</span>
          <span className="text-xs text-[#666]">Batch & Group commands</span>
        </div>
        <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-4 space-y-2">
          {[
            { icon: '🎨', label: 'Modify All Selected', desc: 'Change all selected elements', prefix: 'Make all selected...' },
            { icon: '📦', label: 'Group Elements', desc: 'Create a group from selection', prefix: 'Group these as...' },
            { icon: '↔️', label: 'Align & Distribute', desc: 'Arrange selected elements', prefix: 'Align...' },
          ].map((cmd) => (
            <div key={cmd.label} className="flex items-center gap-3 p-3 rounded-lg bg-[#252525]">
              <div className="w-8 h-8 rounded-lg bg-[#252525] border border-[#333] flex items-center justify-center text-sm">
                {cmd.icon}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">{cmd.label}</p>
                <p className="text-xs text-[#666]">{cmd.desc}</p>
              </div>
              <p className="text-xs text-[#555] font-mono">{cmd.prefix}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  ),
};

/**
 * Keyboard navigation visual
 */
export const KeyboardNav: Story = {
  decorators: [
    (Story) => (
      <div className="p-8" style={{ background: 'var(--lab-bg-canvas, #0A0A12)' }}>
        <Story />
      </div>
    ),
  ],
  render: () => (
    <div className="max-w-lg mx-auto space-y-6">
      <h3 className="text-sm font-medium text-[#888] uppercase tracking-wider">
        Keyboard Shortcuts
      </h3>

      <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-6 space-y-4">
        {[
          { keys: ['⌘', 'K'], action: 'Open command palette' },
          { keys: ['↑', '↓'], action: 'Navigate commands' },
          { keys: ['↵'], action: 'Select command or submit' },
          { keys: ['Esc'], action: 'Back / Close' },
          { keys: ['Tab'], action: 'Accept suggestion' },
        ].map((shortcut) => (
          <div key={shortcut.action} className="flex items-center justify-between">
            <span className="text-sm text-[#999]">{shortcut.action}</span>
            <div className="flex items-center gap-1">
              {shortcut.keys.map((key, i) => (
                <kbd
                  key={i}
                  className="min-w-[24px] h-6 px-2 bg-[#252525] border border-[#333] rounded text-xs text-white flex items-center justify-center font-mono"
                >
                  {key}
                </kbd>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  ),
};
