'use client';

import type { Meta, StoryObj } from '@storybook/react';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  SimpleTabs,
  CardTabs,
} from './Tabs';
import { Button } from '../primitives';
import * as React from 'react';

const meta: Meta = {
  title: 'Design System/Components/Tabs',
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'dark' },
  },
  decorators: [
    (Story) => (
      <div className="p-8 w-[500px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;

/**
 * Default line tabs with underline indicator.
 */
export const Default: StoryObj = {
  render: () => (
    <Tabs defaultValue="overview">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="analytics">Analytics</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">
        <div className="text-sm text-[var(--color-text-muted)]">
          Overview content goes here. This is the main dashboard view.
        </div>
      </TabsContent>
      <TabsContent value="analytics">
        <div className="text-sm text-[var(--color-text-muted)]">
          Analytics data and charts would be displayed here.
        </div>
      </TabsContent>
      <TabsContent value="settings">
        <div className="text-sm text-[var(--color-text-muted)]">
          Settings and configuration options.
        </div>
      </TabsContent>
    </Tabs>
  ),
};

/**
 * Pills variant with button-style tabs.
 */
export const Pills: StoryObj = {
  render: () => (
    <Tabs defaultValue="all">
      <TabsList variant="pills">
        <TabsTrigger value="all" variant="pills">All</TabsTrigger>
        <TabsTrigger value="active" variant="pills">Active</TabsTrigger>
        <TabsTrigger value="archived" variant="pills">Archived</TabsTrigger>
      </TabsList>
      <TabsContent value="all">All items shown here.</TabsContent>
      <TabsContent value="active">Only active items.</TabsContent>
      <TabsContent value="archived">Archived items.</TabsContent>
    </Tabs>
  ),
};

/**
 * Enclosed variant with boxed tabs.
 */
export const Enclosed: StoryObj = {
  render: () => (
    <div className="rounded-xl border border-[var(--color-border)] overflow-hidden">
      <Tabs defaultValue="code">
        <TabsList variant="enclosed" className="bg-[var(--color-bg-elevated)]">
          <TabsTrigger value="preview" variant="enclosed">Preview</TabsTrigger>
          <TabsTrigger value="code" variant="enclosed">Code</TabsTrigger>
          <TabsTrigger value="console" variant="enclosed">Console</TabsTrigger>
        </TabsList>
        <TabsContent value="preview" className="p-4 m-0 bg-[var(--color-bg-page)]">
          <div className="h-32 flex items-center justify-center text-[var(--color-text-muted)]">
            Preview panel
          </div>
        </TabsContent>
        <TabsContent value="code" className="p-4 m-0 bg-[var(--color-bg-page)]">
          <code className="text-sm font-mono text-[#4A9EFF]">
            const greeting = &quot;Hello, HIVE!&quot;;
          </code>
        </TabsContent>
        <TabsContent value="console" className="p-4 m-0 bg-[var(--color-bg-page)]">
          <div className="font-mono text-sm text-[#22C55E]">
            &gt; Ready
          </div>
        </TabsContent>
      </Tabs>
    </div>
  ),
};

/**
 * Soft variant with subtle highlight.
 */
export const Soft: StoryObj = {
  render: () => (
    <Tabs defaultValue="posts">
      <TabsList variant="soft">
        <TabsTrigger value="posts" variant="soft">Posts</TabsTrigger>
        <TabsTrigger value="comments" variant="soft">Comments</TabsTrigger>
        <TabsTrigger value="likes" variant="soft">Likes</TabsTrigger>
      </TabsList>
      <TabsContent value="posts">Your posts appear here.</TabsContent>
      <TabsContent value="comments">Your comments appear here.</TabsContent>
      <TabsContent value="likes">Your liked content appears here.</TabsContent>
    </Tabs>
  ),
};

/**
 * Different sizes.
 */
export const Sizes: StoryObj = {
  render: () => (
    <div className="space-y-8">
      <div>
        <p className="text-xs text-[var(--color-text-muted)] mb-2">Small</p>
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1" size="sm">Tab One</TabsTrigger>
            <TabsTrigger value="tab2" size="sm">Tab Two</TabsTrigger>
            <TabsTrigger value="tab3" size="sm">Tab Three</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <div>
        <p className="text-xs text-[var(--color-text-muted)] mb-2">Medium (default)</p>
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1" size="md">Tab One</TabsTrigger>
            <TabsTrigger value="tab2" size="md">Tab Two</TabsTrigger>
            <TabsTrigger value="tab3" size="md">Tab Three</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <div>
        <p className="text-xs text-[var(--color-text-muted)] mb-2">Large</p>
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1" size="lg">Tab One</TabsTrigger>
            <TabsTrigger value="tab2" size="lg">Tab Two</TabsTrigger>
            <TabsTrigger value="tab3" size="lg">Tab Three</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </div>
  ),
};

/**
 * Tabs with icons.
 */
export const WithIcons: StoryObj = {
  render: () => (
    <Tabs defaultValue="overview">
      <TabsList>
        <TabsTrigger value="overview" icon="📊">Overview</TabsTrigger>
        <TabsTrigger value="settings" icon="⚙️">Settings</TabsTrigger>
        <TabsTrigger value="profile" icon="👤">Profile</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">Overview with analytics.</TabsContent>
      <TabsContent value="settings">Configuration options.</TabsContent>
      <TabsContent value="profile">User profile information.</TabsContent>
    </Tabs>
  ),
};

/**
 * Tabs with badges.
 */
export const WithBadges: StoryObj = {
  render: () => (
    <Tabs defaultValue="inbox">
      <TabsList>
        <TabsTrigger value="inbox" badge={5}>Inbox</TabsTrigger>
        <TabsTrigger value="sent" badge={12}>Sent</TabsTrigger>
        <TabsTrigger value="drafts" badge={3}>Drafts</TabsTrigger>
      </TabsList>
      <TabsContent value="inbox">5 unread messages.</TabsContent>
      <TabsContent value="sent">12 sent messages.</TabsContent>
      <TabsContent value="drafts">3 drafts saved.</TabsContent>
    </Tabs>
  ),
};

/**
 * Disabled tab.
 */
export const WithDisabled: StoryObj = {
  render: () => (
    <Tabs defaultValue="active">
      <TabsList>
        <TabsTrigger value="active">Active</TabsTrigger>
        <TabsTrigger value="pending">Pending</TabsTrigger>
        <TabsTrigger value="locked" disabled>Locked</TabsTrigger>
      </TabsList>
      <TabsContent value="active">Active content.</TabsContent>
      <TabsContent value="pending">Pending content.</TabsContent>
      <TabsContent value="locked">This tab is disabled.</TabsContent>
    </Tabs>
  ),
};

/**
 * Full width tabs.
 */
export const FullWidth: StoryObj = {
  render: () => (
    <Tabs defaultValue="tab1">
      <TabsList fullWidth variant="pills" className="grid grid-cols-3">
        <TabsTrigger value="tab1" variant="pills">First</TabsTrigger>
        <TabsTrigger value="tab2" variant="pills">Second</TabsTrigger>
        <TabsTrigger value="tab3" variant="pills">Third</TabsTrigger>
      </TabsList>
      <TabsContent value="tab1">First tab content.</TabsContent>
      <TabsContent value="tab2">Second tab content.</TabsContent>
      <TabsContent value="tab3">Third tab content.</TabsContent>
    </Tabs>
  ),
};

/**
 * Vertical tabs.
 */
export const Vertical: StoryObj = {
  render: () => (
    <Tabs defaultValue="general" orientation="vertical" className="flex gap-4">
      <TabsList orientation="vertical" className="w-40">
        <TabsTrigger value="general" orientation="vertical">General</TabsTrigger>
        <TabsTrigger value="security" orientation="vertical">Security</TabsTrigger>
        <TabsTrigger value="notifications" orientation="vertical">Notifications</TabsTrigger>
        <TabsTrigger value="billing" orientation="vertical">Billing</TabsTrigger>
      </TabsList>
      <div className="flex-1">
        <TabsContent value="general" className="mt-0">
          <h3 className="text-white font-medium mb-2">General Settings</h3>
          <p className="text-sm text-[var(--color-text-muted)]">
            Basic account settings and preferences.
          </p>
        </TabsContent>
        <TabsContent value="security" className="mt-0">
          <h3 className="text-white font-medium mb-2">Security</h3>
          <p className="text-sm text-[var(--color-text-muted)]">
            Password, 2FA, and security settings.
          </p>
        </TabsContent>
        <TabsContent value="notifications" className="mt-0">
          <h3 className="text-white font-medium mb-2">Notifications</h3>
          <p className="text-sm text-[var(--color-text-muted)]">
            Email and push notification preferences.
          </p>
        </TabsContent>
        <TabsContent value="billing" className="mt-0">
          <h3 className="text-white font-medium mb-2">Billing</h3>
          <p className="text-sm text-[var(--color-text-muted)]">
            Subscription and payment information.
          </p>
        </TabsContent>
      </div>
    </Tabs>
  ),
};

/**
 * SimpleTabs with items prop.
 */
export const Simple: StoryObj = {
  render: () => (
    <SimpleTabs
      items={[
        {
          value: 'spaces',
          label: 'Spaces',
          icon: '🏠',
          content: 'Manage your community spaces.',
        },
        {
          value: 'tools',
          label: 'Tools',
          icon: '🔧',
          content: 'Build and deploy custom tools.',
        },
        {
          value: 'profile',
          label: 'Profile',
          icon: '👤',
          content: 'Edit your profile information.',
        },
      ]}
      defaultValue="spaces"
    />
  ),
};

/**
 * SimpleTabs with pills variant.
 */
export const SimplePills: StoryObj = {
  render: () => (
    <SimpleTabs
      variant="pills"
      items={[
        { value: 'all', label: 'All', badge: 24, content: 'Showing all items.' },
        { value: 'new', label: 'New', badge: 5, content: 'Showing new items.' },
        { value: 'featured', label: 'Featured', content: 'Showing featured items.' },
      ]}
    />
  ),
};

/**
 * CardTabs with enclosed content.
 */
export const Card: StoryObj = {
  render: () => (
    <CardTabs
      items={[
        {
          value: 'overview',
          label: 'Overview',
          content: (
            <div className="space-y-2">
              <h3 className="font-medium text-white">Dashboard Overview</h3>
              <p className="text-[var(--color-text-muted)]">
                View your metrics and recent activity.
              </p>
            </div>
          ),
        },
        {
          value: 'details',
          label: 'Details',
          content: (
            <div className="space-y-2">
              <h3 className="font-medium text-white">Detailed Information</h3>
              <p className="text-[var(--color-text-muted)]">
                Deep dive into your analytics data.
              </p>
            </div>
          ),
        },
        {
          value: 'settings',
          label: 'Settings',
          content: (
            <div className="space-y-2">
              <h3 className="font-medium text-white">Configuration</h3>
              <p className="text-[var(--color-text-muted)]">
                Customize your dashboard preferences.
              </p>
            </div>
          ),
        },
      ]}
    />
  ),
};

/**
 * Controlled tabs.
 */
export const Controlled: StoryObj = {
  render: function ControlledDemo() {
    const [value, setValue] = React.useState('tab1');

    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setValue('tab1')}
          >
            Go to Tab 1
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setValue('tab2')}
          >
            Go to Tab 2
          </Button>
        </div>
        <p className="text-sm text-[var(--color-text-muted)]">
          Current tab: {value}
        </p>
        <Tabs value={value} onValueChange={setValue}>
          <TabsList>
            <TabsTrigger value="tab1">Tab One</TabsTrigger>
            <TabsTrigger value="tab2">Tab Two</TabsTrigger>
            <TabsTrigger value="tab3">Tab Three</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">First tab content.</TabsContent>
          <TabsContent value="tab2">Second tab content.</TabsContent>
          <TabsContent value="tab3">Third tab content.</TabsContent>
        </Tabs>
      </div>
    );
  },
};

/**
 * Rich content in tabs.
 */
export const RichContent: StoryObj = {
  render: () => (
    <Tabs defaultValue="overview">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="analytics">Analytics</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {['Active Users', 'Page Views', 'Events', 'Revenue'].map((stat) => (
              <div
                key={stat}
                className="p-3 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)]"
              >
                <p className="text-xs text-[var(--color-text-muted)]">{stat}</p>
                <p className="text-lg font-semibold text-white">
                  {Math.floor(Math.random() * 10000)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </TabsContent>
      <TabsContent value="analytics">
        <div className="h-32 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-muted)]">
          Chart placeholder
        </div>
      </TabsContent>
      <TabsContent value="settings">
        <div className="space-y-3">
          {['Notifications', 'Privacy', 'Display'].map((setting) => (
            <label key={setting} className="flex items-center justify-between">
              <span className="text-sm text-white">{setting}</span>
              <input type="checkbox" className="accent-[#FFD700]" />
            </label>
          ))}
        </div>
      </TabsContent>
    </Tabs>
  ),
};
