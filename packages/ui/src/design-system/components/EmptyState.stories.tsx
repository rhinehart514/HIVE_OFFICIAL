import type { Meta, StoryObj } from '@storybook/react';
import { EmptyState, EmptyStatePresets } from './EmptyState';
import { Card } from '../primitives';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * EMPTYSTATE VISUAL REFERENCE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Placeholder shown when a list or container has no data.
 *
 * VARIANTS:
 * 1. Default: Centered vertical stack with icon, title, description, action
 * 2. Compact: Horizontal layout for smaller containers
 * 3. Inline: Minimal single-line for tight spaces
 *
 * SIZES:
 * - sm: Icon 40px, text-base title, p-6
 * - default: Icon 64px, text-lg title, p-12
 * - lg: Icon 96px, text-xl title, p-16
 *
 * FEATURES:
 * - Icon container with elevated background
 * - Optional primary action (gold CTA button)
 * - Optional secondary action (ghost button)
 * - Presets for common empty states
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

const meta: Meta<typeof EmptyState> = {
  title: 'Design System/Components/Feedback/EmptyState',
  component: EmptyState,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Placeholder shown when a list or container has no data.',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'compact', 'inline'],
    },
    size: {
      control: 'select',
      options: ['sm', 'default', 'lg'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof EmptyState>;

/**
 * Default — Basic empty state
 */
export const Default: Story = {
  args: {
    title: 'No items found',
    description: "There's nothing here yet. Start by creating your first item.",
  },
};

/**
 * With action button
 */
export const WithAction: Story = {
  args: {
    title: 'No messages yet',
    description: 'Start the conversation by sending a message.',
    action: {
      label: 'Send Message',
      onClick: () => alert('Send message clicked'),
    },
  },
};

/**
 * With both actions
 */
export const WithBothActions: Story = {
  args: {
    title: 'No spaces joined',
    description: 'Join a space or create your own to get started.',
    action: {
      label: 'Browse Spaces',
      onClick: () => alert('Browse clicked'),
    },
    secondaryAction: {
      label: 'Create Space',
      onClick: () => alert('Create clicked'),
    },
  },
};

/**
 * Compact variant
 */
export const Compact: Story = {
  render: () => (
    <Card className="w-[500px]">
      <EmptyState
        variant="compact"
        title="No members yet"
        description="Invite people to join this space"
        action={{
          label: 'Invite',
          onClick: () => alert('Invite clicked'),
        }}
      />
    </Card>
  ),
};

/**
 * Inline variant
 */
export const Inline: Story = {
  render: () => (
    <Card className="w-[300px] p-4">
      <EmptyState variant="inline" title="No results" />
    </Card>
  ),
};

/**
 * Small size
 */
export const Small: Story = {
  args: {
    size: 'sm',
    title: 'No items',
    description: 'Add your first item to get started.',
    action: {
      label: 'Add Item',
      onClick: () => {},
    },
  },
};

/**
 * Large size
 */
export const Large: Story = {
  args: {
    size: 'lg',
    title: 'Welcome to your dashboard',
    description: "You haven't created any projects yet. Start by creating your first project to see it here.",
    action: {
      label: 'Create Project',
      onClick: () => {},
    },
  },
};

/**
 * Custom icon
 */
export const CustomIcon: Story = {
  args: {
    title: 'No notifications',
    description: "You're all caught up!",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8 text-[var(--color-text-muted)]">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
      </svg>
    ),
  },
};

/**
 * Custom illustration
 */
export const CustomIllustration: Story = {
  args: {
    title: 'Your inbox is empty',
    description: 'When you receive messages, they will appear here.',
    illustration: (
      <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-[var(--color-bg-elevated)] to-[var(--color-bg-hover)] flex items-center justify-center">
        <span className="text-5xl">📭</span>
      </div>
    ),
  },
};

/**
 * Preset: No messages
 */
export const PresetNoMessages: Story = {
  args: {
    ...EmptyStatePresets.noMessages,
    action: {
      label: 'Start Conversation',
      onClick: () => {},
    },
  },
};

/**
 * Preset: No members
 */
export const PresetNoMembers: Story = {
  args: {
    ...EmptyStatePresets.noMembers,
    action: {
      label: 'Invite Members',
      onClick: () => {},
    },
  },
};

/**
 * Preset: No events
 */
export const PresetNoEvents: Story = {
  args: {
    ...EmptyStatePresets.noEvents,
    action: {
      label: 'Create Event',
      onClick: () => {},
    },
  },
};

/**
 * Preset: No search results
 */
export const PresetNoSearchResults: Story = {
  args: {
    ...EmptyStatePresets.noSearchResults,
    action: {
      label: 'Clear Search',
      onClick: () => {},
      variant: 'ghost',
    },
  },
};

/**
 * All presets
 */
export const AllPresets: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-6 max-w-4xl">
      {Object.entries(EmptyStatePresets).map(([key, preset]) => (
        <Card key={key} className="p-0">
          <EmptyState size="sm" {...preset} />
        </Card>
      ))}
    </div>
  ),
};

/**
 * In context — Sidebar list
 */
export const SidebarContext: Story = {
  render: () => (
    <Card className="w-72 h-96 flex flex-col">
      <div className="p-4 border-b border-[var(--color-border)]">
        <h3 className="font-medium">Members</h3>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <EmptyState
          variant="default"
          size="sm"
          title="No members yet"
          description="Invite people to join"
          action={{
            label: 'Invite',
            onClick: () => {},
            variant: 'cta',
          }}
        />
      </div>
    </Card>
  ),
};
