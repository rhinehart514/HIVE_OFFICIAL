'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { CommandPalette, type CommandPaletteProps, type CommandPaletteItem } from './CommandPalette';
import * as React from 'react';

const meta: Meta<typeof CommandPalette> = {
  title: 'Design System/Components/CommandPalette',
  component: CommandPalette,
  parameters: {
    layout: 'fullscreen',
    backgrounds: { default: 'dark' },
  },
};

export default meta;
type Story = StoryObj<typeof CommandPalette>;

// Sample icons
const HashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5l-3.9 19.5m-2.1-19.5l-3.9 19.5" />
  </svg>
);

const BoltIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
  </svg>
);

const SettingsIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const UsersIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
  </svg>
);

// Sample items
const sampleItems: CommandPaletteItem[] = [
  {
    id: '1',
    label: 'Engineering Club',
    description: '42 members',
    category: 'Spaces',
    icon: <HashIcon />,
  },
  {
    id: '2',
    label: 'Design Systems',
    description: '28 members',
    category: 'Spaces',
    icon: <HashIcon />,
  },
  {
    id: '3',
    label: 'CS50 Study Group',
    description: '156 members',
    category: 'Spaces',
    icon: <HashIcon />,
  },
  {
    id: '4',
    label: 'Create new tool',
    description: 'Build something new',
    category: 'Actions',
    icon: <BoltIcon />,
    featured: true,
    shortcut: ['⌘', 'N'],
  },
  {
    id: '5',
    label: 'Settings',
    description: 'App preferences',
    category: 'Actions',
    icon: <SettingsIcon />,
    shortcut: ['⌘', ','],
  },
  {
    id: '6',
    label: 'Jordan Smith',
    description: 'Computer Science',
    category: 'People',
    icon: <UsersIcon />,
  },
  {
    id: '7',
    label: 'Alex Chen',
    description: 'Design',
    category: 'People',
    icon: <UsersIcon />,
  },
  {
    id: '8',
    label: 'Hackathon Kickoff',
    description: 'Tomorrow at 6pm',
    category: 'Events',
    icon: <CalendarIcon />,
  },
];

// Wrapper to handle open state
const CommandPaletteWrapper = ({
  items = sampleItems,
  ...props
}: Partial<CommandPaletteProps>) => {
  const [open, setOpen] = React.useState(true);

  return (
    <div className="min-h-screen bg-[var(--color-bg-page)] p-8">
      <div className="text-center mb-8">
        <p className="text-[var(--color-text-secondary)] text-sm">
          Press <kbd className="px-2 py-1 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded text-xs">⌘K</kbd> to toggle
        </p>
      </div>
      <button
        onClick={() => setOpen(true)}
        className="mx-auto block px-4 py-2 rounded-lg bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] text-sm hover:bg-[var(--color-bg-hover)] transition-colors"
      >
        Open Command Palette
      </button>
      <CommandPalette
        open={open}
        onOpenChange={setOpen}
        items={items}
        {...props}
      />
    </div>
  );
};

/**
 * Default state with all item categories
 */
export const Default: Story = {
  render: () => <CommandPaletteWrapper />,
};

/**
 * With search query active
 */
export const WithSearch: StoryObj = {
  render: function WithSearchStory() {
    const [open, setOpen] = React.useState(true);

    return (
      <div className="min-h-screen bg-[var(--color-bg-page)] p-8">
        <CommandPalette
          open={open}
          onOpenChange={setOpen}
          items={sampleItems}
          placeholder="Try searching 'design' or 'hackathon'..."
        />
      </div>
    );
  },
};

/**
 * Featured items highlighted with gold
 */
export const FeaturedItems: Story = {
  render: () => (
    <CommandPaletteWrapper
      items={[
        {
          id: '1',
          label: 'Create new tool',
          description: 'Build something amazing',
          category: 'Quick Actions',
          icon: <BoltIcon />,
          featured: true,
          shortcut: ['⌘', 'N'],
        },
        {
          id: '2',
          label: 'AI Assistant',
          description: 'Get help with your project',
          category: 'Quick Actions',
          icon: <BoltIcon />,
          featured: true,
          shortcut: ['⌘', 'I'],
        },
        {
          id: '3',
          label: 'Browse spaces',
          description: 'Discover communities',
          category: 'Navigation',
        },
        {
          id: '4',
          label: 'View profile',
          description: 'Your public profile',
          category: 'Navigation',
        },
      ]}
    />
  ),
};

/**
 * Empty state when no results found
 */
export const EmptyState: StoryObj = {
  render: function EmptyStateStory() {
    const [open, setOpen] = React.useState(true);
    const [query, setQuery] = React.useState('xyznonexistent');

    return (
      <div className="min-h-screen bg-[var(--color-bg-page)] p-8">
        <CommandPalette
          open={open}
          onOpenChange={setOpen}
          items={[]}
          emptyMessage="No matching results. Try a different search."
          onSearch={setQuery}
        />
      </div>
    );
  },
};

/**
 * Loading state while fetching results
 */
export const Loading: StoryObj = {
  render: function LoadingStory() {
    const [open, setOpen] = React.useState(true);

    return (
      <div className="min-h-screen bg-[var(--color-bg-page)] p-8">
        <CommandPalette
          open={open}
          onOpenChange={setOpen}
          items={[]}
          loading={true}
        />
      </div>
    );
  },
};

/**
 * Many categories and items
 */
export const ManyItems: Story = {
  render: () => (
    <CommandPaletteWrapper
      items={[
        // Spaces
        { id: 's1', label: 'Engineering Club', description: '42 members', category: 'Spaces' },
        { id: 's2', label: 'Design Systems', description: '28 members', category: 'Spaces' },
        { id: 's3', label: 'CS50 Study Group', description: '156 members', category: 'Spaces' },
        { id: 's4', label: 'Startup Founders', description: '89 members', category: 'Spaces' },
        { id: 's5', label: 'Music Production', description: '34 members', category: 'Spaces' },
        // Actions
        { id: 'a1', label: 'Create new tool', category: 'Actions', featured: true, shortcut: ['⌘', 'N'] },
        { id: 'a2', label: 'Join a space', category: 'Actions', shortcut: ['⌘', 'J'] },
        { id: 'a3', label: 'Invite member', category: 'Actions', shortcut: ['⌘', 'I'] },
        { id: 'a4', label: 'Settings', category: 'Actions', shortcut: ['⌘', ','] },
        // People
        { id: 'p1', label: 'Jordan Smith', description: 'Computer Science', category: 'People' },
        { id: 'p2', label: 'Alex Chen', description: 'Design', category: 'People' },
        { id: 'p3', label: 'Taylor Kim', description: 'Engineering', category: 'People' },
        // Events
        { id: 'e1', label: 'Hackathon Kickoff', description: 'Tomorrow at 6pm', category: 'Events' },
        { id: 'e2', label: 'Design Review', description: 'Friday at 2pm', category: 'Events' },
        // Tools
        { id: 't1', label: 'Study Timer', description: 'Pomodoro tracker', category: 'Tools' },
        { id: 't2', label: 'Event RSVP', description: 'Event management', category: 'Tools' },
      ]}
    />
  ),
};

/**
 * Interactive - demonstrates keyboard navigation
 */
export const Interactive: StoryObj = {
  render: function InteractiveStory() {
    const [open, setOpen] = React.useState(false);
    const [lastSelected, setLastSelected] = React.useState<string | null>(null);

    return (
      <div className="min-h-screen bg-[var(--color-bg-page)] p-8">
        <div className="max-w-md mx-auto space-y-6">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
              Command Palette Demo
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)] mb-4">
              Press <kbd className="px-2 py-1 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded text-xs">⌘K</kbd> or click below
            </p>
            <button
              onClick={() => setOpen(true)}
              className="px-4 py-2 rounded-lg bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] text-sm hover:bg-[var(--color-bg-hover)] transition-colors"
            >
              Open Command Palette
            </button>
          </div>

          {lastSelected && (
            <div className="p-4 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)]">
              <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wide mb-1">
                Last Selected
              </p>
              <p className="text-sm text-[var(--color-text-primary)]">{lastSelected}</p>
            </div>
          )}

          <div className="p-4 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)]">
            <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wide mb-2">
              Keyboard Shortcuts
            </p>
            <div className="space-y-2 text-sm text-[var(--color-text-secondary)]">
              <div className="flex justify-between">
                <span>Open palette</span>
                <kbd className="px-1.5 py-0.5 bg-[var(--color-bg-page)] border border-[var(--color-border)] rounded text-xs">⌘K</kbd>
              </div>
              <div className="flex justify-between">
                <span>Navigate</span>
                <span className="flex gap-1">
                  <kbd className="px-1.5 py-0.5 bg-[var(--color-bg-page)] border border-[var(--color-border)] rounded text-xs">↑</kbd>
                  <kbd className="px-1.5 py-0.5 bg-[var(--color-bg-page)] border border-[var(--color-border)] rounded text-xs">↓</kbd>
                </span>
              </div>
              <div className="flex justify-between">
                <span>Select</span>
                <kbd className="px-1.5 py-0.5 bg-[var(--color-bg-page)] border border-[var(--color-border)] rounded text-xs">↵</kbd>
              </div>
              <div className="flex justify-between">
                <span>Close</span>
                <kbd className="px-1.5 py-0.5 bg-[var(--color-bg-page)] border border-[var(--color-border)] rounded text-xs">esc</kbd>
              </div>
            </div>
          </div>
        </div>

        <CommandPalette
          open={open}
          onOpenChange={setOpen}
          items={sampleItems}
          onSelect={(item) => setLastSelected(item.label)}
        />
      </div>
    );
  },
};

/**
 * Custom placeholder text
 */
export const CustomPlaceholder: Story = {
  render: () => (
    <CommandPaletteWrapper
      placeholder="What would you like to do?"
      items={sampleItems}
    />
  ),
};
