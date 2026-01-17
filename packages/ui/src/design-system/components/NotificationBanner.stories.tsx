'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { NotificationBanner, NotificationBannerStack } from './NotificationBanner';

const meta: Meta<typeof NotificationBanner> = {
  title: 'Design System/Components/NotificationBanner',
  component: NotificationBanner,
  parameters: {
    layout: 'padded',
    backgrounds: { default: 'dark' },
  },
  decorators: [
    (Story) => (
      <div className="p-8 bg-[#0A0A0A] min-h-[300px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof NotificationBanner>;

/**
 * Info banner (default)
 */
export const Info: Story = {
  args: {
    message: 'New features are available! Check out what\'s new in the latest update.',
    variant: 'info',
    onDismiss: () => console.log('Dismissed'),
  },
};

/**
 * Success banner
 */
export const Success: Story = {
  args: {
    message: 'Your changes have been saved successfully.',
    variant: 'success',
    onDismiss: () => console.log('Dismissed'),
  },
};

/**
 * Warning banner
 */
export const Warning: Story = {
  args: {
    message: 'Scheduled maintenance tonight at 11pm EST. Some features may be unavailable.',
    variant: 'warning',
    onDismiss: () => console.log('Dismissed'),
  },
};

/**
 * Error banner
 */
export const Error: Story = {
  args: {
    message: 'Connection lost. We\'re trying to reconnect...',
    variant: 'error',
    actionText: 'Retry',
    onAction: () => console.log('Retry clicked'),
    onDismiss: () => console.log('Dismissed'),
  },
};

/**
 * Announcement (gold)
 */
export const Announcement: Story = {
  args: {
    message: 'HIVE 2.0 is here! Discover new features and improvements.',
    variant: 'announcement',
    actionText: 'Learn More',
    onAction: () => console.log('Learn more'),
  },
};

/**
 * With action button
 */
export const WithAction: Story = {
  args: {
    message: 'Your session will expire in 5 minutes.',
    variant: 'warning',
    actionText: 'Extend Session',
    onAction: () => console.log('Session extended'),
    onDismiss: () => console.log('Dismissed'),
  },
};

/**
 * Sizes
 */
export const Sizes: Story = {
  render: () => (
    <div className="space-y-4">
      <NotificationBanner
        message="Compact size banner"
        size="compact"
        onDismiss={() => {}}
      />
      <NotificationBanner
        message="Default size banner"
        size="default"
        onDismiss={() => {}}
      />
      <NotificationBanner
        message="Prominent size banner"
        size="prominent"
        onDismiss={() => {}}
      />
    </div>
  ),
};

/**
 * No icon
 */
export const NoIcon: Story = {
  args: {
    message: 'Simple notification without icon.',
    hideIcon: true,
    onDismiss: () => console.log('Dismissed'),
  },
};

/**
 * Auto dismiss (3 seconds)
 */
export const AutoDismiss: Story = {
  render: () => {
    const [show, setShow] = useState(true);

    return (
      <div className="space-y-4">
        {show && (
          <NotificationBanner
            message="This will auto-dismiss in 3 seconds..."
            variant="success"
            autoDismiss={3000}
            onDismiss={() => setShow(false)}
          />
        )}
        {!show && (
          <button
            onClick={() => setShow(true)}
            className="px-4 py-2 bg-[#FFD700] text-black rounded-lg"
          >
            Show Again
          </button>
        )}
      </div>
    );
  },
};

/**
 * All variants
 */
export const AllVariants: Story = {
  render: () => (
    <div className="space-y-4">
      <NotificationBanner
        message="Info: New features are available."
        variant="info"
        onDismiss={() => {}}
      />
      <NotificationBanner
        message="Success: Your changes have been saved."
        variant="success"
        onDismiss={() => {}}
      />
      <NotificationBanner
        message="Warning: Scheduled maintenance tonight."
        variant="warning"
        onDismiss={() => {}}
      />
      <NotificationBanner
        message="Error: Connection lost."
        variant="error"
        actionText="Retry"
        onAction={() => {}}
        onDismiss={() => {}}
      />
      <NotificationBanner
        message="Announcement: HIVE 2.0 is here!"
        variant="announcement"
        actionText="Learn More"
        onAction={() => {}}
      />
    </div>
  ),
};

/**
 * Stacked banners
 */
export const Stacked: Story = {
  render: () => {
    const [banners, setBanners] = useState([
      { id: 1, message: 'First notification', variant: 'info' as const },
      { id: 2, message: 'Second notification', variant: 'warning' as const },
      { id: 3, message: 'Third notification', variant: 'success' as const },
    ]);

    const dismiss = (id: number) => {
      setBanners((prev) => prev.filter((b) => b.id !== id));
    };

    return (
      <div className="relative h-48">
        <NotificationBannerStack position="top">
          {banners.map((banner) => (
            <NotificationBanner
              key={banner.id}
              message={banner.message}
              variant={banner.variant}
              position="inline"
              onDismiss={() => dismiss(banner.id)}
            />
          ))}
        </NotificationBannerStack>
      </div>
    );
  },
};

/**
 * Custom icon
 */
export const CustomIcon: Story = {
  args: {
    message: 'You have 5 new notifications to review.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
      </svg>
    ),
    actionText: 'View All',
    onAction: () => console.log('View all'),
    onDismiss: () => console.log('Dismissed'),
  },
};
