'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { Shell, type ShellProps, type NavItem } from './Shell';
import * as React from 'react';

const meta: Meta<typeof Shell> = {
  title: 'Design System/Templates/Shell',
  component: Shell,
  parameters: {
    layout: 'fullscreen',
    backgrounds: { default: 'dark' },
  },
};

export default meta;
type Story = StoryObj<typeof Shell>;

// Sample icons
const HomeIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const SpacesIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const ToolsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
  </svg>
);

const ProfileIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const SettingsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const NotificationsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const defaultNavItems: NavItem[] = [
  { id: 'home', label: 'Home', href: '/', icon: <HomeIcon /> },
  { id: 'spaces', label: 'Spaces', href: '/spaces', icon: <SpacesIcon />, badge: 3 },
  { id: 'tools', label: 'HiveLab', href: '/tools', icon: <ToolsIcon /> },
  { id: 'profile', label: 'Profile', href: '/profile', icon: <ProfileIcon /> },
  { id: 'notifications', label: 'Notifications', href: '/notifications', icon: <NotificationsIcon />, badge: 12 },
  { id: 'settings', label: 'Settings', href: '/settings', icon: <SettingsIcon /> },
];

const defaultUser = {
  id: '1',
  name: 'Jordan Smith',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jordan',
};

// Sample content component - Apple/OpenAI refined
const SampleContent = ({ title = 'Page Content' }: { title?: string }) => (
  <div className="p-6 lg:p-8 max-w-5xl">
    <h1 className="text-2xl font-semibold text-[var(--color-text-primary)] tracking-[-0.02em] mb-1">{title}</h1>
    <p className="text-[var(--color-text-muted)] text-sm mb-8">
      Shell template with Apple/OpenAI refined aesthetics
    </p>
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="group p-4 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)]/50 hover:border-[var(--color-border)] transition-all duration-200 hover:shadow-lg hover:shadow-black/20"
        >
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-medium text-[var(--color-text-primary)] tracking-[-0.01em] mb-1">
                Card {i + 1}
              </h3>
              <p className="text-body-sm text-[var(--color-text-secondary)] leading-relaxed">
                Premium HIVE component with subtle hover states and refined typography.
              </p>
            </div>
            <span className="text-label-sm text-[var(--color-text-muted)] font-medium uppercase tracking-wide opacity-0 group-hover:opacity-100 transition-opacity">
              View
            </span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

/**
 * Rail Mode - Minimal sidebar (48px)
 * Default for most pages. Maximum content space.
 */
export const RailMode: Story = {
  args: {
    mode: 'rail',
    atmosphere: 'spaces',
    navItems: defaultNavItems,
    user: defaultUser,
    activeRoute: '/spaces',
  },
  render: (args) => (
    <Shell {...args}>
      <SampleContent title="Rail Mode (48px sidebar)" />
    </Shell>
  ),
};

/**
 * Living Sidebar Mode - Expanded with content
 * Used inside spaces to show activity.
 */
export const LivingMode: Story = {
  args: {
    mode: 'living',
    atmosphere: 'spaces',
    navItems: defaultNavItems,
    user: defaultUser,
    activeRoute: '/spaces/engineering',
    sidebar: (
      <div className="p-3 space-y-3">
        <h3 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide px-1">
          Recent Activity
        </h3>
        {['New message from Alex', 'Event starting in 10 min', 'Tool deployed'].map((item, i) => (
          <div
            key={i}
            className="p-2 rounded-lg bg-[var(--color-bg-elevated)] text-sm text-[var(--color-text-secondary)]"
          >
            {item}
          </div>
        ))}
      </div>
    ),
  },
  render: (args) => (
    <Shell {...args}>
      <SampleContent title="Living Mode (240px sidebar with content)" />
    </Shell>
  ),
};

/**
 * Hidden Mode - No sidebar
 * Used for Workspace/IDE where content needs full width.
 */
export const HiddenMode: Story = {
  args: {
    mode: 'hidden',
    atmosphere: 'workshop',
    navItems: defaultNavItems,
    user: defaultUser,
  },
  render: (args) => (
    <Shell {...args}>
      <div className="h-screen flex items-center justify-center bg-[var(--color-bg-ground)]">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-2">
            Workspace Mode
          </h1>
          <p className="text-[var(--color-text-secondary)]">
            Sidebar is hidden. Full width for creation.
          </p>
        </div>
      </div>
    </Shell>
  ),
};

/**
 * Landing Atmosphere - Spacious density
 */
export const LandingAtmosphere: Story = {
  args: {
    mode: 'rail',
    atmosphere: 'landing',
    navItems: defaultNavItems,
    user: defaultUser,
  },
  render: (args) => (
    <Shell {...args}>
      <SampleContent title="Landing Atmosphere (spacious)" />
    </Shell>
  ),
};

/**
 * Workshop Atmosphere - Compact density
 */
export const WorkshopAtmosphere: Story = {
  args: {
    mode: 'rail',
    atmosphere: 'workshop',
    navItems: defaultNavItems,
    user: defaultUser,
  },
  render: (args) => (
    <Shell {...args}>
      <SampleContent title="Workshop Atmosphere (compact)" />
    </Shell>
  ),
};

/**
 * With Badges - Notification counts
 */
export const WithBadges: Story = {
  args: {
    mode: 'living',
    atmosphere: 'spaces',
    navItems: [
      { id: 'home', label: 'Home', href: '/', icon: <HomeIcon /> },
      { id: 'spaces', label: 'Spaces', href: '/spaces', icon: <SpacesIcon />, badge: 5 },
      { id: 'notifications', label: 'Notifications', href: '/notifications', icon: <NotificationsIcon />, badge: 99 },
      { id: 'tools', label: 'HiveLab', href: '/tools', icon: <ToolsIcon />, badge: 2 },
    ],
    user: defaultUser,
    activeRoute: '/spaces',
  },
  render: (args) => (
    <Shell {...args}>
      <SampleContent title="Navigation with Badges" />
    </Shell>
  ),
};

/**
 * Mobile View - Bottom navigation
 * Resize browser to see mobile layout.
 */
export const MobileView: Story = {
  args: {
    mode: 'rail',
    atmosphere: 'spaces',
    navItems: defaultNavItems.slice(0, 5), // Mobile shows max 5 items
    user: defaultUser,
    activeRoute: '/',
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  render: (args) => (
    <Shell {...args}>
      <SampleContent title="Mobile View" />
    </Shell>
  ),
};

/**
 * Interactive - Toggle sidebar collapse
 */
export const Interactive: StoryObj = {
  render: function InteractiveShell() {
    const [collapsed, setCollapsed] = React.useState(false);
    const [activeRoute, setActiveRoute] = React.useState('/spaces');

    return (
      <Shell
        mode="rail"
        atmosphere="spaces"
        navItems={defaultNavItems.map(item => ({
          ...item,
          isActive: item.href === activeRoute,
        }))}
        user={defaultUser}
        activeRoute={activeRoute}
        sidebarCollapsed={collapsed}
        onSidebarCollapse={setCollapsed}
      >
        <div className="p-6 lg:p-8">
          <div className="mb-6 flex items-center gap-4">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="px-4 py-2 rounded-lg bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] text-sm font-medium hover:bg-[var(--color-bg-hover)] transition-colors"
            >
              {collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            </button>
            <span className="text-sm text-[var(--color-text-muted)]">
              Current route: {activeRoute}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {defaultNavItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveRoute(item.href)}
                className={`p-4 rounded-xl border text-left transition-colors ${
                  activeRoute === item.href
                    ? 'bg-[var(--color-bg-elevated)] border-[var(--color-gold)]'
                    : 'bg-[var(--color-bg-page)] border-[var(--color-border)] hover:bg-[var(--color-bg-elevated)]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-[var(--color-text-primary)]">{item.icon}</span>
                  <span className="font-medium text-[var(--color-text-primary)]">{item.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </Shell>
    );
  },
};
