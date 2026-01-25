'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { Tooltip, TooltipRich } from './Tooltip';
import { Button } from '../primitives/Button';

/**
 * Tooltip - LOCKED: January 2026
 *
 * LOCKED DECISIONS:
 * - Surface: Elevated background with border (`bg-elevated border-border`)
 * - Animation: Fade + Scale 95%→100% with position-based slide
 * - Delay: 200ms default (configurable)
 * - Arrow: Pointing to trigger, fill-elevated
 * - Shortcut: Muted text, mono font
 *
 * Contextual information on hover/focus.
 */
const meta: Meta<typeof Tooltip> = {
  title: 'Design System/Components/Tooltip',
  component: Tooltip,
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'dark' },
    docs: {
      description: {
        component: `
**LOCKED: January 2026**

Tooltip provides contextual information that appears on hover or focus.

### Locked Design Decisions
| Decision | Value | Rationale |
|----------|-------|-----------|
| Surface | Elevated bg with border | Consistent with overlay surfaces |
| Animation | Fade + Scale (95%→100%) | Subtle, position-aware entrance |
| Default delay | 200ms | Prevents accidental triggers |
| Arrow | Points to trigger | Clear anchor point |
| Shortcut text | Muted mono font | Keyboard shortcuts are secondary |
        `,
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="p-24 bg-[#0A0A0A] min-h-[400px] flex items-center justify-center">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Tooltip>;

// =============================================================================
// LOCKED DESIGN SHOWCASE
// =============================================================================

/**
 * **LOCKED DESIGN** - The final approved visual treatment
 *
 * This showcases the canonical Tooltip patterns:
 * - Elevated surface with border
 * - Fade + Scale animation (95%→100%)
 * - Position-based slide direction
 * - Arrow pointing to trigger
 * - 200ms default delay
 */
export const LockedDesignShowcase: Story = {
  name: '⭐ Locked Design',
  render: () => (
    <div className="space-y-8 w-[500px]">
      {/* Header */}
      <div className="border-b border-white/10 pb-4">
        <h2 className="text-lg font-medium text-white">Tooltip - LOCKED</h2>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          January 2026 • Elevated surface, Fade+Scale animation, Arrow, 200ms delay
        </p>
      </div>

      {/* Basic Tooltip */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
            Basic Tooltip
          </span>
          <span className="text-label-xs text-white/40 bg-white/5 px-2 py-0.5 rounded">
            Hover to reveal
          </span>
        </div>
        <div className="flex justify-center">
          <Tooltip content="This is a basic tooltip">
            <Button variant="secondary">Hover me</Button>
          </Tooltip>
        </div>
        <p className="text-xs text-white/40 text-center">
          Surface: <code className="text-[#FFD700] bg-white/5 px-1 rounded">bg-elevated border-border</code>
        </p>
      </div>

      {/* Positions */}
      <div className="space-y-3">
        <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
          Positions (with slide animation)
        </span>
        <div className="grid grid-cols-3 gap-4 place-items-center py-4">
          <div />
          <Tooltip content="Top tooltip" side="top">
            <Button variant="ghost" size="sm">Top</Button>
          </Tooltip>
          <div />

          <Tooltip content="Left tooltip" side="left">
            <Button variant="ghost" size="sm">Left</Button>
          </Tooltip>
          <div className="text-label-xs text-white/40">Positions</div>
          <Tooltip content="Right tooltip" side="right">
            <Button variant="ghost" size="sm">Right</Button>
          </Tooltip>

          <div />
          <Tooltip content="Bottom tooltip" side="bottom">
            <Button variant="ghost" size="sm">Bottom</Button>
          </Tooltip>
          <div />
        </div>
        <p className="text-xs text-white/40 text-center">
          Animation: slide-in-from-[opposite-side]-2
        </p>
      </div>

      {/* With Shortcut */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
            With Keyboard Shortcut
          </span>
          <span className="text-label-xs text-white/40 bg-white/5 px-2 py-0.5 rounded">
            Muted mono font
          </span>
        </div>
        <div className="flex justify-center gap-4">
          <Tooltip content="Save" shortcut="⌘S">
            <Button variant="secondary" size="sm">Save</Button>
          </Tooltip>
          <Tooltip content="Copy" shortcut="⌘C">
            <Button variant="secondary" size="sm">Copy</Button>
          </Tooltip>
          <Tooltip content="Undo" shortcut="⌘Z">
            <Button variant="secondary" size="sm">Undo</Button>
          </Tooltip>
        </div>
      </div>

      {/* Rich Tooltip */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
            Rich Tooltip
          </span>
          <span className="text-label-xs text-white/40 bg-white/5 px-2 py-0.5 rounded">
            Title + Description
          </span>
        </div>
        <div className="flex justify-center">
          <TooltipRich
            title="Profile Settings"
            description="Manage your account preferences and privacy options."
            shortcut="⌘,"
          >
            <Button variant="secondary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 mr-2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </Button>
          </TooltipRich>
        </div>
      </div>

      {/* Delay Demo */}
      <div className="space-y-3">
        <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
          Delay Comparison
        </span>
        <div className="flex justify-center gap-4">
          <Tooltip content="Instant (0ms)" delayDuration={0}>
            <Button variant="ghost" size="sm">No delay</Button>
          </Tooltip>
          <Tooltip content="Default (200ms)" delayDuration={200}>
            <Button variant="ghost" size="sm">200ms</Button>
          </Tooltip>
          <Tooltip content="Slow (500ms)" delayDuration={500}>
            <Button variant="ghost" size="sm">500ms</Button>
          </Tooltip>
        </div>
        <p className="text-xs text-white/40 text-center">
          Default delay: 200ms (prevents accidental triggers)
        </p>
      </div>
    </div>
  ),
};

// =============================================================================
// FUNCTIONAL EXAMPLES
// =============================================================================

/**
 * Basic tooltip
 */
export const Default: Story = {
  render: () => (
    <Tooltip content="Edit your profile">
      <Button variant="secondary">Hover me</Button>
    </Tooltip>
  ),
};

/**
 * Positions
 */
export const Positions: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-8">
      <div />
      <Tooltip content="Top tooltip" side="top">
        <Button variant="ghost">Top</Button>
      </Tooltip>
      <div />

      <Tooltip content="Left tooltip" side="left">
        <Button variant="ghost">Left</Button>
      </Tooltip>
      <div className="flex items-center justify-center">
        <span className="text-xs text-[#818187]">Positions</span>
      </div>
      <Tooltip content="Right tooltip" side="right">
        <Button variant="ghost">Right</Button>
      </Tooltip>

      <div />
      <Tooltip content="Bottom tooltip" side="bottom">
        <Button variant="ghost">Bottom</Button>
      </Tooltip>
      <div />
    </div>
  ),
};

/**
 * With keyboard shortcut
 */
export const WithShortcut: Story = {
  render: () => (
    <div className="flex gap-4">
      <Tooltip content="Save" shortcut="⌘S">
        <Button variant="secondary">Save</Button>
      </Tooltip>
      <Tooltip content="Copy" shortcut="⌘C">
        <Button variant="secondary">Copy</Button>
      </Tooltip>
      <Tooltip content="Paste" shortcut="⌘V">
        <Button variant="secondary">Paste</Button>
      </Tooltip>
    </div>
  ),
};

/**
 * Rich tooltip with title and description
 */
export const Rich: Story = {
  render: () => (
    <TooltipRich
      title="Profile Settings"
      description="Manage your account preferences, privacy settings, and notification options."
    >
      <Button variant="secondary">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 mr-2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        Settings
      </Button>
    </TooltipRich>
  ),
};

/**
 * Rich with shortcut
 */
export const RichWithShortcut: Story = {
  render: () => (
    <TooltipRich
      title="Quick Search"
      description="Search for spaces, members, or tools across the platform."
      shortcut="⌘K"
    >
      <Button variant="ghost">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
      </Button>
    </TooltipRich>
  ),
};

/**
 * Custom delay
 */
export const CustomDelay: Story = {
  render: () => (
    <div className="flex gap-4">
      <Tooltip content="Instant (0ms)" delayDuration={0}>
        <Button variant="ghost">No delay</Button>
      </Tooltip>
      <Tooltip content="Default (200ms)" delayDuration={200}>
        <Button variant="ghost">200ms</Button>
      </Tooltip>
      <Tooltip content="Slow (500ms)" delayDuration={500}>
        <Button variant="ghost">500ms</Button>
      </Tooltip>
    </div>
  ),
};

/**
 * On icon buttons
 */
export const IconButtons: Story = {
  render: () => (
    <div className="flex gap-2">
      <Tooltip content="Edit" side="bottom">
        <button className="p-2 rounded-lg hover:bg-white/10 transition-colors">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
          </svg>
        </button>
      </Tooltip>
      <Tooltip content="Delete" side="bottom">
        <button className="p-2 rounded-lg hover:bg-white/10 transition-colors text-[#FF6B6B]">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
          </svg>
        </button>
      </Tooltip>
      <Tooltip content="Share" side="bottom">
        <button className="p-2 rounded-lg hover:bg-white/10 transition-colors">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
          </svg>
        </button>
      </Tooltip>
    </div>
  ),
};

/**
 * Disabled tooltip
 */
export const Disabled: Story = {
  render: () => (
    <Tooltip content="This won't show" disabled>
      <Button variant="ghost">Tooltip disabled</Button>
    </Tooltip>
  ),
};
