'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { MemberList, type Member } from './MemberList';

const meta: Meta<typeof MemberList> = {
  title: 'Design System/Components/MemberList',
  component: MemberList,
  parameters: {
    layout: 'padded',
    backgrounds: { default: 'dark' },
  },
  decorators: [
    (Story) => (
      <div className="p-8 bg-[#0A0A0A] min-h-[600px]">
        <div className="max-w-md">
          <Story />
        </div>
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof MemberList>;

// Sample members data
const sampleMembers: Member[] = [
  { id: '1', name: 'Jane Doe', handle: 'janedoe', role: 'leader', presence: 'online' },
  { id: '2', name: 'John Smith', handle: 'johnsmith', role: 'leader', presence: 'away' },
  { id: '3', name: 'Alex Chen', handle: 'alexc', role: 'moderator', presence: 'online' },
  { id: '4', name: 'Sarah Wilson', handle: 'sarahw', role: 'member', presence: 'offline' },
  { id: '5', name: 'Mike Johnson', handle: 'mikej', role: 'member', presence: 'online' },
  { id: '6', name: 'Emily Brown', handle: 'emilyb', role: 'member', presence: 'dnd' },
  { id: '7', name: 'David Lee', handle: 'davidl', role: 'member', presence: 'away' },
  { id: '8', name: 'Lisa Garcia', handle: 'lisag', role: 'member', presence: 'online' },
  { id: '9', name: 'Tom Anderson', handle: 'toma', role: 'member', presence: 'offline' },
  { id: '10', name: 'Amy Martinez', handle: 'amym', role: 'member', presence: 'online' },
];

/**
 * Full member list with role grouping
 */
export const Default: Story = {
  args: {
    members: sampleMembers,
    totalCount: 24,
    groupByRole: true,
    showSearch: true,
  },
};

/**
 * Interactive with search
 */
export const Interactive: Story = {
  render: () => {
    const [searchValue, setSearchValue] = useState('');
    const filteredMembers = sampleMembers.filter(
      (m) =>
        m.name.toLowerCase().includes(searchValue.toLowerCase()) ||
        m.handle.toLowerCase().includes(searchValue.toLowerCase())
    );

    return (
      <MemberList
        members={filteredMembers}
        totalCount={sampleMembers.length}
        showSearch
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        onMemberClick={(member) => console.log('Clicked:', member.name)}
        onMemberAction={(member, action) => console.log('Action:', member.name, action)}
      />
    );
  },
};

/**
 * Without role grouping
 */
export const NoGrouping: Story = {
  args: {
    members: sampleMembers,
    groupByRole: false,
  },
};

/**
 * Compact variant (sidebar)
 */
export const Compact: Story = {
  args: {
    variant: 'compact',
    members: sampleMembers,
    totalCount: 24,
  },
};

/**
 * Stack variant (avatar row)
 */
export const Stack: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <p className="text-xs text-[#818187] mb-2">4 visible (default)</p>
        <MemberList variant="stack" members={sampleMembers} maxVisible={4} />
      </div>
      <div>
        <p className="text-xs text-[#818187] mb-2">6 visible</p>
        <MemberList variant="stack" members={sampleMembers} maxVisible={6} />
      </div>
      <div>
        <p className="text-xs text-[#818187] mb-2">3 members only</p>
        <MemberList variant="stack" members={sampleMembers.slice(0, 3)} maxVisible={4} />
      </div>
    </div>
  ),
};

/**
 * Loading state
 */
export const Loading: Story = {
  args: {
    members: [],
    loading: true,
  },
};

/**
 * Empty state
 */
export const Empty: Story = {
  args: {
    members: [],
    loading: false,
  },
};

/**
 * Error state
 */
export const Error: Story = {
  args: {
    members: [],
    error: 'Failed to load members. Please try again.',
  },
};

/**
 * With load more
 */
export const WithLoadMore: Story = {
  args: {
    members: sampleMembers.slice(0, 5),
    totalCount: 50,
    hasMore: true,
    onLoadMore: () => console.log('Load more...'),
  },
};

/**
 * Presence states showcase
 */
export const PresenceStates: Story = {
  render: () => {
    const presenceMembers: Member[] = [
      { id: '1', name: 'Online User', handle: 'online', role: 'member', presence: 'online' },
      { id: '2', name: 'Away User', handle: 'away', role: 'member', presence: 'away' },
      { id: '3', name: 'Offline User', handle: 'offline', role: 'member', presence: 'offline' },
      { id: '4', name: 'Do Not Disturb', handle: 'dnd', role: 'member', presence: 'dnd' },
    ];

    return (
      <div className="space-y-6">
        <div>
          <p className="text-xs text-[#818187] mb-2">Full view - presence dots visible</p>
          <MemberList members={presenceMembers} groupByRole={false} />
        </div>
        <div>
          <p className="text-xs text-[#818187] mb-2">Compact view</p>
          <MemberList variant="compact" members={presenceMembers} />
        </div>
      </div>
    );
  },
};

/**
 * Role badges showcase
 */
export const RoleBadges: Story = {
  render: () => {
    const roleMembers: Member[] = [
      { id: '1', name: 'Space Leader', handle: 'leader', role: 'leader', presence: 'online' },
      { id: '2', name: 'Moderator', handle: 'mod', role: 'moderator', presence: 'online' },
      { id: '3', name: 'Regular Member', handle: 'member', role: 'member', presence: 'online' },
    ];

    return (
      <div>
        <p className="text-xs text-[#818187] mb-4">
          Role badges: Leader (👑 gold), Moderator (🛡️ gray), Member (no badge)
        </p>
        <MemberList members={roleMembers} groupByRole={false} />
      </div>
    );
  },
};

/**
 * All variants comparison
 */
export const AllVariants: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-white mb-2">Full (with role grouping)</p>
        <div className="p-4 bg-[#141414] rounded-xl">
          <MemberList
            variant="full"
            members={sampleMembers.slice(0, 6)}
            totalCount={24}
            groupByRole
            showSearch
          />
        </div>
      </div>

      <div>
        <p className="text-sm text-white mb-2">Compact (sidebar)</p>
        <div className="p-4 bg-[#141414] rounded-xl w-48">
          <MemberList variant="compact" members={sampleMembers} totalCount={24} />
        </div>
      </div>

      <div>
        <p className="text-sm text-white mb-2">Stack (avatar row)</p>
        <div className="p-4 bg-[#141414] rounded-xl">
          <MemberList variant="stack" members={sampleMembers} maxVisible={5} />
        </div>
      </div>
    </div>
  ),
};
