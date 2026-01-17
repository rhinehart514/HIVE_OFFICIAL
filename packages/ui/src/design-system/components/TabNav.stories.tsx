'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { TabNav, TabPanel, type TabItem } from './TabNav';

const meta: Meta<typeof TabNav> = {
  title: 'Design System/Components/TabNav',
  component: TabNav,
  parameters: {
    layout: 'padded',
    backgrounds: { default: 'dark' },
  },
  decorators: [
    (Story) => (
      <div className="p-8 bg-[#0A0A0A] min-h-[400px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof TabNav>;

const basicTabs: TabItem[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'members', label: 'Members' },
  { id: 'events', label: 'Events' },
  { id: 'settings', label: 'Settings' },
];

/**
 * Underline variant (default)
 */
export const Underline: Story = {
  render: () => {
    const [active, setActive] = useState('overview');

    return (
      <TabNav
        tabs={basicTabs}
        activeTab={active}
        onTabChange={setActive}
        variant="underline"
      />
    );
  },
};

/**
 * Pills variant
 */
export const Pills: Story = {
  render: () => {
    const [active, setActive] = useState('all');
    const tabs: TabItem[] = [
      { id: 'all', label: 'All' },
      { id: 'active', label: 'Active' },
      { id: 'completed', label: 'Completed' },
      { id: 'archived', label: 'Archived' },
    ];

    return (
      <TabNav
        tabs={tabs}
        activeTab={active}
        onTabChange={setActive}
        variant="pills"
      />
    );
  },
};

/**
 * Segment variant
 */
export const Segment: Story = {
  render: () => {
    const [active, setActive] = useState('list');
    const tabs: TabItem[] = [
      { id: 'list', label: 'List' },
      { id: 'grid', label: 'Grid' },
      { id: 'calendar', label: 'Calendar' },
    ];

    return (
      <TabNav
        tabs={tabs}
        activeTab={active}
        onTabChange={setActive}
        variant="segment"
      />
    );
  },
};

/**
 * With icons
 */
export const WithIcons: Story = {
  render: () => {
    const [active, setActive] = useState('overview');
    const tabs: TabItem[] = [
      {
        id: 'overview',
        label: 'Overview',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
          </svg>
        ),
      },
      {
        id: 'members',
        label: 'Members',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
          </svg>
        ),
      },
      {
        id: 'events',
        label: 'Events',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          </svg>
        ),
      },
      {
        id: 'settings',
        label: 'Settings',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        ),
      },
    ];

    return (
      <TabNav
        tabs={tabs}
        activeTab={active}
        onTabChange={setActive}
      />
    );
  },
};

/**
 * With badges
 */
export const WithBadges: Story = {
  render: () => {
    const [active, setActive] = useState('overview');
    const tabs: TabItem[] = [
      { id: 'overview', label: 'Overview' },
      { id: 'members', label: 'Members', badge: 24 },
      { id: 'events', label: 'Events', badge: true }, // Just a dot
      { id: 'settings', label: 'Settings' },
    ];

    return (
      <TabNav
        tabs={tabs}
        activeTab={active}
        onTabChange={setActive}
      />
    );
  },
};

/**
 * Sizes
 */
export const Sizes: Story = {
  render: () => {
    const [active, setActive] = useState('tab1');
    const tabs: TabItem[] = [
      { id: 'tab1', label: 'Tab 1' },
      { id: 'tab2', label: 'Tab 2' },
      { id: 'tab3', label: 'Tab 3' },
    ];

    return (
      <div className="space-y-8">
        <div>
          <p className="text-xs text-[#818187] mb-2">Small</p>
          <TabNav tabs={tabs} activeTab={active} onTabChange={setActive} size="sm" />
        </div>
        <div>
          <p className="text-xs text-[#818187] mb-2">Default</p>
          <TabNav tabs={tabs} activeTab={active} onTabChange={setActive} size="default" />
        </div>
        <div>
          <p className="text-xs text-[#818187] mb-2">Large</p>
          <TabNav tabs={tabs} activeTab={active} onTabChange={setActive} size="lg" />
        </div>
      </div>
    );
  },
};

/**
 * Disabled tabs
 */
export const DisabledTabs: Story = {
  render: () => {
    const [active, setActive] = useState('overview');
    const tabs: TabItem[] = [
      { id: 'overview', label: 'Overview' },
      { id: 'members', label: 'Members' },
      { id: 'analytics', label: 'Analytics', disabled: true },
      { id: 'settings', label: 'Settings' },
    ];

    return (
      <TabNav
        tabs={tabs}
        activeTab={active}
        onTabChange={setActive}
      />
    );
  },
};

/**
 * Vertical orientation
 */
export const Vertical: Story = {
  render: () => {
    const [active, setActive] = useState('overview');

    return (
      <div className="flex gap-8">
        <TabNav
          tabs={basicTabs}
          activeTab={active}
          onTabChange={setActive}
          orientation="vertical"
          variant="underline"
          className="w-48"
        />
        <div className="flex-1 p-4 bg-[#141414] rounded-xl">
          <p className="text-sm text-[#818187]">Content for: {active}</p>
        </div>
      </div>
    );
  },
};

/**
 * With tab panels
 */
export const WithPanels: Story = {
  render: () => {
    const [active, setActive] = useState('overview');

    return (
      <div className="space-y-4">
        <TabNav
          tabs={basicTabs}
          activeTab={active}
          onTabChange={setActive}
        />

        <div className="p-4 bg-[#141414] rounded-xl min-h-[200px]">
          <TabPanel id="overview" activeTab={active}>
            <h3 className="text-white font-medium mb-2">Overview</h3>
            <p className="text-[#818187]">This is the overview content.</p>
          </TabPanel>
          <TabPanel id="members" activeTab={active}>
            <h3 className="text-white font-medium mb-2">Members</h3>
            <p className="text-[#818187]">This is the members content.</p>
          </TabPanel>
          <TabPanel id="events" activeTab={active}>
            <h3 className="text-white font-medium mb-2">Events</h3>
            <p className="text-[#818187]">This is the events content.</p>
          </TabPanel>
          <TabPanel id="settings" activeTab={active}>
            <h3 className="text-white font-medium mb-2">Settings</h3>
            <p className="text-[#818187]">This is the settings content.</p>
          </TabPanel>
        </div>
      </div>
    );
  },
};

/**
 * All variants comparison
 */
export const AllVariants: Story = {
  render: () => {
    const [active, setActive] = useState('tab1');
    const tabs: TabItem[] = [
      { id: 'tab1', label: 'Tab 1' },
      { id: 'tab2', label: 'Tab 2' },
      { id: 'tab3', label: 'Tab 3' },
    ];

    return (
      <div className="space-y-8">
        <div>
          <p className="text-xs text-[#818187] mb-2">Underline (animated indicator - gold)</p>
          <TabNav tabs={tabs} activeTab={active} onTabChange={setActive} variant="underline" />
        </div>
        <div>
          <p className="text-xs text-[#818187] mb-2">Pills</p>
          <TabNav tabs={tabs} activeTab={active} onTabChange={setActive} variant="pills" />
        </div>
        <div>
          <p className="text-xs text-[#818187] mb-2">Segment</p>
          <TabNav tabs={tabs} activeTab={active} onTabChange={setActive} variant="segment" />
        </div>
      </div>
    );
  },
};
