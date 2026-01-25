'use client';

import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';
import { SpaceHeader, SpaceHeaderCompact } from './SpaceHeader';

/**
 * SpaceHeader — Core space header component
 *
 * Displays the essential identity of a space with avatar,
 * name, stats, and actions. Uses gold only for verified
 * badges and online indicators per the design language.
 *
 * For full-featured headers with Ken Burns, parallax, and tabs,
 * see SpaceDetailHeader in atomic/03-Spaces/organisms.
 *
 * @see Spaces Vertical Slice
 */
const meta: Meta<typeof SpaceHeader> = {
  title: 'Design System/Components/Spaces/SpaceHeader',
  component: SpaceHeader,
  parameters: {
    layout: 'fullscreen',
    backgrounds: { default: 'dark' },
    docs: {
      description: {
        component:
          'Core space header showing avatar, name, stats, and join actions. Uses CSS variables for theming.',
      },
    },
  },
  argTypes: {
    name: { control: 'text', description: 'Space name' },
    memberCount: { control: 'number', description: 'Total member count' },
    onlineCount: { control: 'number', description: 'Currently online count' },
    isVerified: { control: 'boolean', description: 'Whether space is verified' },
    isLeader: { control: 'boolean', description: 'Whether current user is a leader' },
    membershipState: {
      control: 'select',
      options: ['not_joined', 'joined', 'pending', 'loading', 'owner', 'admin'],
      description: 'Current membership state',
    },
  },
};

export default meta;
type Story = StoryObj<typeof SpaceHeader>;

// Wrapper component for dark background
const DarkWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-[300px] bg-[#0A0A0A] p-8">{children}</div>
);

/**
 * Default — Not joined state
 */
export const Default: Story = {
  render: () => (
    <DarkWrapper>
      <SpaceHeader
        name="UB Design Club"
        memberCount={234}
        onlineCount={12}
        membershipState="not_joined"
        onJoin={() => alert('Joining space...')}
        onShare={() => alert('Share clicked')}
      />
    </DarkWrapper>
  ),
};

/**
 * Verified — With verification badge
 */
export const Verified: Story = {
  render: () => (
    <DarkWrapper>
      <SpaceHeader
        name="Computer Science Society"
        iconUrl="https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=100&h=100&fit=crop"
        memberCount={1247}
        onlineCount={89}
        isVerified={true}
        membershipState="not_joined"
        onJoin={() => alert('Joining space...')}
        onShare={() => alert('Share clicked')}
      />
    </DarkWrapper>
  ),
};

/**
 * Joined — Already a member
 */
export const Joined: Story = {
  render: () => (
    <DarkWrapper>
      <SpaceHeader
        name="Photography Club"
        iconUrl="https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=100&h=100&fit=crop"
        memberCount={456}
        onlineCount={23}
        membershipState="joined"
        onLeave={() => alert('Leaving space...')}
        onShare={() => alert('Share clicked')}
      />
    </DarkWrapper>
  ),
};

/**
 * Owner — Space owner view with settings
 */
export const Owner: Story = {
  render: () => (
    <DarkWrapper>
      <SpaceHeader
        name="Startup Founders"
        iconUrl="https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=100&h=100&fit=crop"
        memberCount={892}
        onlineCount={45}
        isVerified={true}
        membershipState="owner"
        isLeader={true}
        onSettings={() => alert('Settings clicked')}
        onShare={() => alert('Share clicked')}
      />
    </DarkWrapper>
  ),
};

/**
 * Admin — Admin view with settings
 */
export const Admin: Story = {
  render: () => (
    <DarkWrapper>
      <SpaceHeader
        name="Engineering Society"
        memberCount={2345}
        onlineCount={156}
        membershipState="admin"
        isLeader={true}
        onLeave={() => alert('Leaving...')}
        onSettings={() => alert('Settings clicked')}
        onShare={() => alert('Share clicked')}
      />
    </DarkWrapper>
  ),
};

/**
 * Loading — Join in progress
 */
export const Loading: Story = {
  render: () => (
    <DarkWrapper>
      <SpaceHeader
        name="Music Production Club"
        memberCount={178}
        onlineCount={8}
        membershipState="loading"
      />
    </DarkWrapper>
  ),
};

/**
 * Pending — Awaiting approval
 */
export const Pending: Story = {
  render: () => (
    <DarkWrapper>
      <SpaceHeader
        name="Exclusive Honors Society"
        memberCount={89}
        onlineCount={5}
        isVerified={true}
        membershipState="pending"
      />
    </DarkWrapper>
  ),
};

/**
 * No Online Count — Only members shown
 */
export const NoOnlineCount: Story = {
  render: () => (
    <DarkWrapper>
      <SpaceHeader
        name="Alumni Network"
        memberCount={5432}
        membershipState="joined"
        onLeave={() => alert('Leaving...')}
        onShare={() => alert('Share clicked')}
      />
    </DarkWrapper>
  ),
};

/**
 * Long Name — Truncation test
 */
export const LongName: Story = {
  render: () => (
    <DarkWrapper>
      <div className="max-w-md">
        <SpaceHeader
          name="The University at Buffalo Computer Science and Engineering Student Association for Research and Innovation"
          memberCount={234}
          onlineCount={12}
          isVerified={true}
          membershipState="not_joined"
          onJoin={() => alert('Joining...')}
        />
      </div>
    </DarkWrapper>
  ),
};

/**
 * Monogram Fallback — No icon URL
 */
export const MonogramFallback: Story = {
  render: () => (
    <DarkWrapper>
      <SpaceHeader
        name="Debate Team"
        memberCount={67}
        onlineCount={4}
        membershipState="not_joined"
        onJoin={() => alert('Joining...')}
        onShare={() => alert('Share clicked')}
      />
    </DarkWrapper>
  ),
};

/**
 * Interactive — All states demo
 */
export const Interactive: Story = {
  render: function InteractiveStory() {
    const [state, setState] = React.useState<
      'not_joined' | 'loading' | 'joined' | 'pending'
    >('not_joined');

    const handleJoin = () => {
      setState('loading');
      setTimeout(() => setState('joined'), 1500);
    };

    const handleLeave = () => {
      setState('loading');
      setTimeout(() => setState('not_joined'), 1000);
    };

    return (
      <DarkWrapper>
        <div className="space-y-4">
          <SpaceHeader
            name="Interactive Demo Space"
            iconUrl="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=100&h=100&fit=crop"
            memberCount={123}
            onlineCount={7}
            isVerified={true}
            membershipState={state}
            onJoin={handleJoin}
            onLeave={handleLeave}
            onShare={() => alert('Share clicked')}
          />
          <div className="text-center text-body-sm text-neutral-500">
            Current state: <span className="text-white">{state}</span>
          </div>
        </div>
      </DarkWrapper>
    );
  },
};

/**
 * Compact Variant — For lists and navigation
 */
export const CompactVariant: Story = {
  render: () => (
    <DarkWrapper>
      <div className="max-w-sm space-y-2">
        <SpaceHeaderCompact
          name="Design Club"
          memberCount={234}
          onlineCount={12}
          isVerified={true}
          onClick={() => alert('Clicked!')}
        />
        <SpaceHeaderCompact
          name="Photography Club"
          iconUrl="https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=100&h=100&fit=crop"
          memberCount={456}
          onClick={() => alert('Clicked!')}
        />
        <SpaceHeaderCompact
          name="CS Society"
          memberCount={1247}
          onlineCount={89}
          onClick={() => alert('Clicked!')}
        />
      </div>
    </DarkWrapper>
  ),
};

/**
 * Compact List — Multiple items in navigation context
 */
export const CompactList: Story = {
  render: () => (
    <DarkWrapper>
      <div className="max-w-xs bg-neutral-900 rounded-xl p-2">
        <div className="text-label-sm font-medium text-neutral-500 uppercase tracking-wider px-2 py-2">
          Your Spaces
        </div>
        <SpaceHeaderCompact
          name="UB Design Club"
          memberCount={234}
          onlineCount={12}
          isVerified={true}
          onClick={() => {}}
        />
        <SpaceHeaderCompact
          name="CS Society"
          memberCount={1247}
          onlineCount={89}
          onClick={() => {}}
        />
        <SpaceHeaderCompact
          name="Photography"
          iconUrl="https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=100&h=100&fit=crop"
          memberCount={456}
          onClick={() => {}}
        />
        <SpaceHeaderCompact
          name="Startup Founders"
          memberCount={892}
          onlineCount={45}
          isVerified={true}
          onClick={() => {}}
        />
      </div>
    </DarkWrapper>
  ),
};

/**
 * All Membership States
 */
export const AllStates: Story = {
  render: () => (
    <DarkWrapper>
      <div className="space-y-4 max-w-lg">
        <div className="text-label text-neutral-500 uppercase tracking-wider">
          not_joined
        </div>
        <SpaceHeader
          name="Demo Space"
          memberCount={100}
          membershipState="not_joined"
          onJoin={() => {}}
        />

        <div className="text-label text-neutral-500 uppercase tracking-wider mt-6">
          loading
        </div>
        <SpaceHeader name="Demo Space" memberCount={100} membershipState="loading" />

        <div className="text-label text-neutral-500 uppercase tracking-wider mt-6">
          pending
        </div>
        <SpaceHeader name="Demo Space" memberCount={100} membershipState="pending" />

        <div className="text-label text-neutral-500 uppercase tracking-wider mt-6">
          joined
        </div>
        <SpaceHeader
          name="Demo Space"
          memberCount={100}
          membershipState="joined"
          onLeave={() => {}}
        />

        <div className="text-label text-neutral-500 uppercase tracking-wider mt-6">
          admin
        </div>
        <SpaceHeader
          name="Demo Space"
          memberCount={100}
          membershipState="admin"
          isLeader={true}
          onLeave={() => {}}
          onSettings={() => {}}
        />

        <div className="text-label text-neutral-500 uppercase tracking-wider mt-6">
          owner
        </div>
        <SpaceHeader
          name="Demo Space"
          memberCount={100}
          membershipState="owner"
          isLeader={true}
          onSettings={() => {}}
        />
      </div>
    </DarkWrapper>
  ),
};
