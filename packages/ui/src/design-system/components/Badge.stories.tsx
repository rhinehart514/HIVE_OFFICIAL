'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { Badge, NotificationBadge, StatusBadge, type StatusType } from './Badge';

const meta: Meta<typeof Badge> = {
  title: 'Design System/Components/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'dark' },
  },
  decorators: [
    (Story) => (
      <div className="p-8">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'primary', 'success', 'warning', 'error', 'gold', 'outline'],
    },
    size: {
      control: 'select',
      options: ['sm', 'default', 'lg'],
    },
    dot: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Badge>;

/**
 * Default muted badge.
 */
export const Default: Story = {
  args: {
    children: 'Badge',
  },
};

/**
 * All variant types.
 */
export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Badge variant="default">Default</Badge>
      <Badge variant="primary">Primary</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="error">Error</Badge>
      <Badge variant="gold">Gold</Badge>
      <Badge variant="outline">Outline</Badge>
    </div>
  ),
};

/**
 * All sizes.
 */
export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Badge size="sm">Small</Badge>
      <Badge size="default">Default</Badge>
      <Badge size="lg">Large</Badge>
    </div>
  ),
};

/**
 * With status dot.
 */
export const WithDot: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Badge variant="success" dot>Online</Badge>
      <Badge variant="warning" dot>Away</Badge>
      <Badge variant="error" dot>Busy</Badge>
      <Badge variant="default" dot>Offline</Badge>
    </div>
  ),
};

/**
 * With icon.
 */
export const WithIcon: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Badge variant="success" icon={
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3 h-3">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      }>
        Verified
      </Badge>
      <Badge variant="gold" icon={
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3 h-3">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
        </svg>
      }>
        Leader
      </Badge>
      <Badge variant="primary" icon={
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3 h-3">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
        </svg>
      }>
        New
      </Badge>
    </div>
  ),
};

/**
 * Removable badges (tags).
 */
export const Removable: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="default" onRemove={() => alert('Remove: Design')}>Design</Badge>
      <Badge variant="default" onRemove={() => alert('Remove: Engineering')}>Engineering</Badge>
      <Badge variant="default" onRemove={() => alert('Remove: Marketing')}>Marketing</Badge>
      <Badge variant="primary" onRemove={() => alert('Remove: Featured')}>Featured</Badge>
    </div>
  ),
};

/**
 * Notification badge (count).
 */
export const NotificationBadges: StoryObj<typeof NotificationBadge> = {
  render: () => (
    <div className="flex items-center gap-6">
      <div className="flex flex-col items-center gap-2">
        <NotificationBadge count={3} />
        <span className="text-xs text-[var(--color-text-muted)]">Count</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <NotificationBadge count={99} />
        <span className="text-xs text-[var(--color-text-muted)]">Max</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <NotificationBadge count={150} />
        <span className="text-xs text-[var(--color-text-muted)]">Truncated</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <NotificationBadge count={1} dot />
        <span className="text-xs text-[var(--color-text-muted)]">Dot</span>
      </div>
    </div>
  ),
};

/**
 * Notification badge sizes.
 */
export const NotificationSizes: StoryObj<typeof NotificationBadge> = {
  render: () => (
    <div className="flex items-center gap-6">
      <div className="flex flex-col items-center gap-2">
        <NotificationBadge count={5} size="sm" />
        <span className="text-xs text-[var(--color-text-muted)]">Small</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <NotificationBadge count={5} size="default" />
        <span className="text-xs text-[var(--color-text-muted)]">Default</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <NotificationBadge count={5} size="lg" />
        <span className="text-xs text-[var(--color-text-muted)]">Large</span>
      </div>
    </div>
  ),
};

/**
 * Notification badge variants.
 */
export const NotificationVariants: StoryObj<typeof NotificationBadge> = {
  render: () => (
    <div className="flex items-center gap-6">
      <div className="flex flex-col items-center gap-2">
        <NotificationBadge count={5} variant="default" />
        <span className="text-xs text-[var(--color-text-muted)]">Default</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <NotificationBadge count={5} variant="primary" />
        <span className="text-xs text-[var(--color-text-muted)]">Primary</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <NotificationBadge count={5} variant="error" />
        <span className="text-xs text-[var(--color-text-muted)]">Error</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <NotificationBadge count={5} variant="gold" />
        <span className="text-xs text-[var(--color-text-muted)]">Gold</span>
      </div>
    </div>
  ),
};

/**
 * Status badges (predefined statuses).
 */
export const StatusBadges: StoryObj<typeof StatusBadge> = {
  render: () => {
    const statuses: StatusType[] = [
      'online', 'offline', 'away', 'busy',
      'active', 'inactive', 'pending', 'completed', 'failed',
    ];

    return (
      <div className="flex flex-wrap gap-3">
        {statuses.map((status) => (
          <StatusBadge key={status} status={status} />
        ))}
      </div>
    );
  },
};

/**
 * Status badges without labels (dot only).
 */
export const StatusDotsOnly: StoryObj<typeof StatusBadge> = {
  render: () => {
    const statuses: StatusType[] = ['online', 'away', 'offline', 'busy'];

    return (
      <div className="flex items-center gap-4">
        {statuses.map((status) => (
          <div key={status} className="flex items-center gap-2">
            <StatusBadge status={status} showLabel={false} />
            <span className="text-sm text-[var(--color-text-muted)] capitalize">{status}</span>
          </div>
        ))}
      </div>
    );
  },
};

/**
 * Badge in context (user card).
 */
export const InUserCard: Story = {
  render: () => (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-[#0D0D0D] border border-[var(--color-border)]">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white">Alice Chen</span>
          <Badge variant="gold" size="sm" icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-2.5 h-2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
            </svg>
          }>
            Leader
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
          <StatusBadge status="online" size="sm" />
          <span>•</span>
          <span>Design Team</span>
        </div>
      </div>
    </div>
  ),
};

/**
 * Badge in context (notification bell).
 */
export const InNotificationContext: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      <div className="relative">
        <button className="p-2 rounded-lg hover:bg-white/10 transition-colors">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6 text-white">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
          </svg>
        </button>
        <NotificationBadge
          count={5}
          size="sm"
          className="absolute -top-1 -right-1"
        />
      </div>
      <div className="relative">
        <button className="p-2 rounded-lg hover:bg-white/10 transition-colors">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6 text-white">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
          </svg>
        </button>
        <NotificationBadge
          count={99}
          size="sm"
          className="absolute -top-1 -right-1"
        />
      </div>
      <div className="relative">
        <button className="p-2 rounded-lg hover:bg-white/10 transition-colors">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6 text-white">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
          </svg>
        </button>
        <NotificationBadge
          count={1}
          dot
          className="absolute -top-0.5 -right-0.5"
        />
      </div>
    </div>
  ),
};

/**
 * Tag cloud with badges.
 */
export const TagCloud: Story = {
  render: () => (
    <div className="w-80">
      <h4 className="text-sm font-medium text-white mb-3">Interests</h4>
      <div className="flex flex-wrap gap-2">
        <Badge variant="default" size="sm">Design</Badge>
        <Badge variant="default" size="sm">Engineering</Badge>
        <Badge variant="default" size="sm">AI/ML</Badge>
        <Badge variant="default" size="sm">Startups</Badge>
        <Badge variant="default" size="sm">Photography</Badge>
        <Badge variant="default" size="sm">Music</Badge>
        <Badge variant="primary" size="sm">+5 more</Badge>
      </div>
    </div>
  ),
};
