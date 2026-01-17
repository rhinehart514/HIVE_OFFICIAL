import type { Meta, StoryObj } from '@storybook/react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './Tabs';
import { Text } from './Text';
import { Card } from './Card';

/**
 * Tabs — Tabbed navigation
 *
 * 3 variants: default (pill), underline, segment.
 * Focus ring is WHITE, never gold.
 *
 * @see docs/design-system/PRIMITIVES.md (Tabs)
 */
const meta: Meta<typeof Tabs> = {
  title: 'Design System/Primitives/Navigation/Tabs',
  component: Tabs,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Tabbed navigation with 3 variants: default, underline, segment. WHITE focus ring.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Tabs>;

/**
 * Default — Pill-style tabs
 */
export const Default: Story = {
  render: () => (
    <Tabs defaultValue="tab1" className="w-[400px]">
      <TabsList>
        <TabsTrigger value="tab1">Overview</TabsTrigger>
        <TabsTrigger value="tab2">Activity</TabsTrigger>
        <TabsTrigger value="tab3">Settings</TabsTrigger>
      </TabsList>
      <TabsContent value="tab1">
        <Card className="p-4 mt-2">
          <Text>Overview content goes here.</Text>
        </Card>
      </TabsContent>
      <TabsContent value="tab2">
        <Card className="p-4 mt-2">
          <Text>Activity content goes here.</Text>
        </Card>
      </TabsContent>
      <TabsContent value="tab3">
        <Card className="p-4 mt-2">
          <Text>Settings content goes here.</Text>
        </Card>
      </TabsContent>
    </Tabs>
  ),
};

/**
 * Underline variant
 */
export const Underline: Story = {
  render: () => (
    <Tabs defaultValue="tab1" className="w-[400px]">
      <TabsList variant="underline">
        <TabsTrigger variant="underline" value="tab1">Overview</TabsTrigger>
        <TabsTrigger variant="underline" value="tab2">Activity</TabsTrigger>
        <TabsTrigger variant="underline" value="tab3">Settings</TabsTrigger>
      </TabsList>
      <TabsContent value="tab1">
        <Card className="p-4 mt-4">
          <Text>Overview content goes here.</Text>
        </Card>
      </TabsContent>
      <TabsContent value="tab2">
        <Card className="p-4 mt-4">
          <Text>Activity content goes here.</Text>
        </Card>
      </TabsContent>
      <TabsContent value="tab3">
        <Card className="p-4 mt-4">
          <Text>Settings content goes here.</Text>
        </Card>
      </TabsContent>
    </Tabs>
  ),
};

/**
 * Segment variant — iOS-style
 */
export const Segment: Story = {
  render: () => (
    <Tabs defaultValue="day" className="w-[300px]">
      <TabsList variant="segment">
        <TabsTrigger variant="segment" value="day">Day</TabsTrigger>
        <TabsTrigger variant="segment" value="week">Week</TabsTrigger>
        <TabsTrigger variant="segment" value="month">Month</TabsTrigger>
      </TabsList>
      <TabsContent value="day">
        <Card className="p-4 mt-2">
          <Text>Daily view</Text>
        </Card>
      </TabsContent>
      <TabsContent value="week">
        <Card className="p-4 mt-2">
          <Text>Weekly view</Text>
        </Card>
      </TabsContent>
      <TabsContent value="month">
        <Card className="p-4 mt-2">
          <Text>Monthly view</Text>
        </Card>
      </TabsContent>
    </Tabs>
  ),
};

/**
 * All variants comparison
 */
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-8 w-[400px]">
      <div>
        <Text size="xs" tone="muted" className="mb-2">Default (pill)</Text>
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
            <TabsTrigger value="tab3">Tab 3</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <div>
        <Text size="xs" tone="muted" className="mb-2">Underline</Text>
        <Tabs defaultValue="tab1">
          <TabsList variant="underline">
            <TabsTrigger variant="underline" value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger variant="underline" value="tab2">Tab 2</TabsTrigger>
            <TabsTrigger variant="underline" value="tab3">Tab 3</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <div>
        <Text size="xs" tone="muted" className="mb-2">Segment</Text>
        <Tabs defaultValue="tab1">
          <TabsList variant="segment">
            <TabsTrigger variant="segment" value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger variant="segment" value="tab2">Tab 2</TabsTrigger>
            <TabsTrigger variant="segment" value="tab3">Tab 3</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </div>
  ),
};

/**
 * With icons
 */
export const WithIcons: Story = {
  render: () => (
    <Tabs defaultValue="chat" className="w-[400px]">
      <TabsList>
        <TabsTrigger value="chat" className="gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          Chat
        </TabsTrigger>
        <TabsTrigger value="events" className="gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Events
        </TabsTrigger>
        <TabsTrigger value="members" className="gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          Members
        </TabsTrigger>
      </TabsList>
    </Tabs>
  ),
};

/**
 * Disabled tab
 */
export const DisabledTab: Story = {
  render: () => (
    <Tabs defaultValue="tab1" className="w-[400px]">
      <TabsList>
        <TabsTrigger value="tab1">Active</TabsTrigger>
        <TabsTrigger value="tab2">Another</TabsTrigger>
        <TabsTrigger value="tab3" disabled>Disabled</TabsTrigger>
      </TabsList>
    </Tabs>
  ),
};

/**
 * Focus state — WHITE ring (never gold)
 */
export const FocusState: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-[400px]">
      <Text size="sm" tone="muted">
        Tab to see WHITE focus ring (never gold):
      </Text>
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Focus me</TabsTrigger>
          <TabsTrigger value="tab2">Or me</TabsTrigger>
          <TabsTrigger value="tab3">Me too</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  ),
};

/**
 * In context — Space navigation
 */
export const SpaceNavigationContext: Story = {
  render: () => (
    <div className="w-[600px]">
      <div className="flex items-center justify-between mb-4">
        <Text size="lg" weight="medium">UB Coders</Text>
        <Text size="sm" tone="muted">847 members</Text>
      </div>
      <Tabs defaultValue="chat">
        <TabsList variant="underline" className="w-full">
          <TabsTrigger variant="underline" value="chat">Chat</TabsTrigger>
          <TabsTrigger variant="underline" value="events">Events</TabsTrigger>
          <TabsTrigger variant="underline" value="members">Members</TabsTrigger>
          <TabsTrigger variant="underline" value="resources">Resources</TabsTrigger>
        </TabsList>
        <TabsContent value="chat">
          <Card className="p-6 mt-4 h-[200px] flex items-center justify-center">
            <Text tone="muted">Chat content</Text>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  ),
};

/**
 * In context — Profile tabs
 */
export const ProfileTabsContext: Story = {
  render: () => (
    <Card className="w-[400px] p-0 overflow-hidden">
      <div className="p-6 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-[var(--color-bg-elevated)]" />
          <div>
            <Text weight="medium">Jane Doe</Text>
            <Text size="sm" tone="muted">@janedoe</Text>
          </div>
        </div>
      </div>
      <Tabs defaultValue="about" className="w-full">
        <TabsList variant="underline" className="px-6 w-full justify-start">
          <TabsTrigger variant="underline" value="about">About</TabsTrigger>
          <TabsTrigger variant="underline" value="spaces">Spaces</TabsTrigger>
          <TabsTrigger variant="underline" value="activity">Activity</TabsTrigger>
        </TabsList>
        <TabsContent value="about" className="p-6">
          <Text size="sm" tone="secondary">
            Student at UB studying Computer Science. Building cool stuff.
          </Text>
        </TabsContent>
      </Tabs>
    </Card>
  ),
};

/**
 * In context — Settings sections
 */
export const SettingsContext: Story = {
  render: () => (
    <div className="w-[500px]">
      <Text size="lg" weight="medium" className="mb-4">Settings</Text>
      <Tabs defaultValue="account" orientation="vertical" className="flex gap-6">
        <TabsList className="flex-col h-fit">
          <TabsTrigger value="account" className="justify-start w-full">Account</TabsTrigger>
          <TabsTrigger value="notifications" className="justify-start w-full">Notifications</TabsTrigger>
          <TabsTrigger value="privacy" className="justify-start w-full">Privacy</TabsTrigger>
          <TabsTrigger value="appearance" className="justify-start w-full">Appearance</TabsTrigger>
        </TabsList>
        <div className="flex-1">
          <TabsContent value="account" className="mt-0">
            <Card className="p-4">
              <Text weight="medium">Account Settings</Text>
              <Text size="sm" tone="muted" className="mt-1">
                Manage your account information
              </Text>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  ),
};
