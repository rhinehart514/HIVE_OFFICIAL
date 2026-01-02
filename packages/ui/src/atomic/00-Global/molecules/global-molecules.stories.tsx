'use client';

import * as React from 'react';
import { action } from '@storybook/addon-actions';
import { Users, TrendingUp, Calendar, MessageSquare, Settings, Folder, Search, Bell, Mail, Home } from 'lucide-react';

import { AvatarStack, AvatarStackWithCount, type AvatarStackUser } from './avatar-stack';
import { StatCard } from './stat-card';
import { SearchBar } from './search-bar';
import { NotificationCard } from './notification-card';
import { Breadcrumbs, BreadcrumbsCompact, type BreadcrumbItem } from './breadcrumbs';
import { FilterChips, type FilterChip } from './filter-chips';
import { EmptyStateDelightful } from './empty-state-delightful';
import { KpiDelta } from './kpi-delta';
import { TagList } from './tag-list';
import { RSVPButton } from './rsvp-button';
import { ProgressList, type ProgressListStep } from './progress-list';

import type { Meta, StoryObj } from '@storybook/react';

// ============================================================
// Mock Data Generators
// ============================================================

const mockUsers: AvatarStackUser[] = [
  { id: '1', name: 'Sarah Chen', imageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop' },
  { id: '2', name: 'Marcus Johnson', imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop' },
  { id: '3', name: 'Emily Rodriguez', imageUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop' },
  { id: '4', name: 'Alex Kim', imageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop' },
  { id: '5', name: 'Jordan Lee' },
  { id: '6', name: 'Taylor Swift' },
  { id: '7', name: 'Chris Evans' },
  { id: '8', name: 'Natasha Romanoff' },
];

const mockBreadcrumbs: BreadcrumbItem[] = [
  { label: 'Spaces', href: '/spaces' },
  { label: 'Design Club', href: '/spaces/design-club' },
  { label: 'Settings' },
];

const mockFilterChips: FilterChip[] = [
  { id: 'academic', label: 'Academic', icon: '📚', count: 12 },
  { id: 'social', label: 'Social', icon: '🎉', count: 8 },
  { id: 'professional', label: 'Professional', icon: '💼', count: 5 },
  { id: 'sports', label: 'Sports', icon: '⚽', count: 15 },
  { id: 'arts', label: 'Arts', icon: '🎨', count: 7 },
];

const mockProgressSteps: ProgressListStep[] = [
  { id: '1', label: 'Create account', description: 'Sign up with your .edu email', state: 'done' },
  { id: '2', label: 'Verify email', description: 'Check your inbox for verification link', state: 'done' },
  { id: '3', label: 'Complete profile', description: 'Add your photo and interests', state: 'active' },
  { id: '4', label: 'Join spaces', description: 'Find communities that interest you', state: 'upcoming' },
];

// ============================================================
// Meta Configuration
// ============================================================

const meta = {
  title: '00-Global/Molecules',
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Collection of global molecule components used across the platform.',
      },
    },
    backgrounds: {
      default: 'dark',
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="min-h-screen bg-black p-8">
        <Story />
      </div>
    ),
  ],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================
// AVATAR STACK STORIES
// ============================================================

export const AvatarStackDefault: Story = {
  render: () => <AvatarStack users={mockUsers.slice(0, 4)} />,
  parameters: {
    docs: { description: { story: 'Default avatar stack with overlapping avatars.' } },
  },
};

export const AvatarStackSmall: Story = {
  render: () => <AvatarStack users={mockUsers.slice(0, 4)} size="sm" />,
};

export const AvatarStackMedium: Story = {
  render: () => <AvatarStack users={mockUsers.slice(0, 4)} size="md" />,
};

export const AvatarStackLarge: Story = {
  render: () => <AvatarStack users={mockUsers.slice(0, 4)} size="lg" />,
};

export const AvatarStackOverflow: Story = {
  render: () => <AvatarStack users={mockUsers} max={5} />,
  parameters: {
    docs: { description: { story: 'Avatar stack with overflow count badge (+N).' } },
  },
};

export const AvatarStackMax3: Story = {
  render: () => <AvatarStack users={mockUsers} max={3} />,
};

export const AvatarStackNoImages: Story = {
  render: () => (
    <AvatarStack
      users={[
        { id: '1', name: 'John Doe' },
        { id: '2', name: 'Jane Smith' },
        { id: '3', name: 'Bob Wilson' },
      ]}
    />
  ),
  parameters: {
    docs: { description: { story: 'Avatar stack with fallback initials.' } },
  },
};

export const AvatarStackWithJoinAnimation: Story = {
  render: () => {
    const [users, setUsers] = React.useState(mockUsers.slice(0, 3));
    const [newUserId, setNewUserId] = React.useState<string | undefined>();

    const addUser = () => {
      const nextUser = mockUsers[users.length];
      if (nextUser) {
        setUsers([...users, nextUser]);
        setNewUserId(nextUser.id);
        setTimeout(() => setNewUserId(undefined), 600);
      }
    };

    return (
      <div className="flex flex-col items-center gap-4">
        <AvatarStack users={users} newUserId={newUserId} />
        <button
          onClick={addUser}
          disabled={users.length >= mockUsers.length}
          className="px-4 py-2 bg-[#FFD700] text-black rounded-lg text-sm font-medium disabled:opacity-50"
        >
          Add User (Animate)
        </button>
      </div>
    );
  },
  parameters: {
    docs: { description: { story: 'Interactive demo showing the join animation.' } },
  },
};

export const AvatarStackWithCountDefault: Story = {
  render: () => <AvatarStackWithCount users={mockUsers.slice(0, 4)} />,
};

export const AvatarStackWithCountCustomLabel: Story = {
  render: () => <AvatarStackWithCount users={mockUsers.slice(0, 6)} label="attending" />,
};

export const AvatarStackAllSizes: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <span className="text-white/60 text-sm w-12">sm:</span>
        <AvatarStack users={mockUsers.slice(0, 4)} size="sm" />
      </div>
      <div className="flex items-center gap-4">
        <span className="text-white/60 text-sm w-12">md:</span>
        <AvatarStack users={mockUsers.slice(0, 4)} size="md" />
      </div>
      <div className="flex items-center gap-4">
        <span className="text-white/60 text-sm w-12">lg:</span>
        <AvatarStack users={mockUsers.slice(0, 4)} size="lg" />
      </div>
    </div>
  ),
};

// ============================================================
// STAT CARD STORIES
// ============================================================

export const StatCardDefault: Story = {
  render: () => <StatCard label="Total Members" value="1,247" />,
  parameters: {
    docs: { description: { story: 'Basic stat card with label and value.' } },
  },
};

export const StatCardWithDelta: Story = {
  render: () => (
    <StatCard
      label="Active Users"
      value="892"
      delta={<KpiDelta value={12.5} />}
    />
  ),
};

export const StatCardWithIcon: Story = {
  render: () => (
    <StatCard
      label="Total Spaces"
      value="156"
      icon={<Folder className="h-5 w-5" />}
    />
  ),
};

export const StatCardComplete: Story = {
  render: () => (
    <StatCard
      label="Weekly Events"
      value="24"
      delta={<KpiDelta value={8} />}
      icon={<Calendar className="h-5 w-5" />}
    />
  ),
};

export const StatCardGrid: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4 max-w-xl">
      <StatCard label="Members" value="1,247" icon={<Users className="h-5 w-5" />} delta={<KpiDelta value={5.2} />} />
      <StatCard label="Events" value="24" icon={<Calendar className="h-5 w-5" />} delta={<KpiDelta value={-3} />} />
      <StatCard label="Messages" value="8.5k" icon={<MessageSquare className="h-5 w-5" />} delta={<KpiDelta value={22} />} />
      <StatCard label="Growth" value="18%" icon={<TrendingUp className="h-5 w-5" />} delta={<KpiDelta value={4.1} />} />
    </div>
  ),
  parameters: {
    docs: { description: { story: 'Grid of stat cards for dashboards.' } },
  },
};

// ============================================================
// KPI DELTA STORIES
// ============================================================

export const KpiDeltaPositive: Story = {
  render: () => <KpiDelta value={12.5} />,
  parameters: {
    docs: { description: { story: 'Positive delta indicator (green).' } },
  },
};

export const KpiDeltaNegative: Story = {
  render: () => <KpiDelta value={-8.3} />,
  parameters: {
    docs: { description: { story: 'Negative delta indicator (red).' } },
  },
};

export const KpiDeltaZero: Story = {
  render: () => <KpiDelta value={0} />,
};

export const KpiDeltaRange: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <KpiDelta value={-25} />
      <KpiDelta value={-10} />
      <KpiDelta value={-2} />
      <KpiDelta value={0} />
      <KpiDelta value={5} />
      <KpiDelta value={15} />
      <KpiDelta value={50} />
    </div>
  ),
};

// ============================================================
// SEARCH BAR STORIES
// ============================================================

export const SearchBarDefault: Story = {
  render: () => {
    const [value, setValue] = React.useState('');
    return (
      <div className="w-80">
        <SearchBar value={value} onChange={setValue} onSearch={action('onSearch')} />
      </div>
    );
  },
  parameters: {
    docs: { description: { story: 'Default search bar with debounced search.' } },
  },
};

export const SearchBarWithValue: Story = {
  render: () => {
    const [value, setValue] = React.useState('design club');
    return (
      <div className="w-80">
        <SearchBar value={value} onChange={setValue} />
      </div>
    );
  },
};

export const SearchBarLoading: Story = {
  render: () => {
    const [value, setValue] = React.useState('searching...');
    return (
      <div className="w-80">
        <SearchBar value={value} onChange={setValue} isLoading />
      </div>
    );
  },
};

export const SearchBarSizes: Story = {
  render: () => {
    const [value, setValue] = React.useState('');
    return (
      <div className="flex flex-col gap-4 w-80">
        <SearchBar value={value} onChange={setValue} size="sm" placeholder="Small" />
        <SearchBar value={value} onChange={setValue} size="md" placeholder="Medium" />
        <SearchBar value={value} onChange={setValue} size="lg" placeholder="Large" />
      </div>
    );
  },
};

export const SearchBarCustomPlaceholder: Story = {
  render: () => {
    const [value, setValue] = React.useState('');
    return (
      <div className="w-80">
        <SearchBar value={value} onChange={setValue} placeholder="Find your next community..." />
      </div>
    );
  },
};

export const SearchBarInteractive: Story = {
  render: () => {
    const [value, setValue] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(false);
    const [results, setResults] = React.useState<string[]>([]);

    const handleSearch = (query: string) => {
      if (!query) {
        setResults([]);
        return;
      }
      setIsLoading(true);
      setTimeout(() => {
        setResults([
          `${query} - Design Club`,
          `${query} - Photography Society`,
          `${query} - Tech Hub`,
        ]);
        setIsLoading(false);
      }, 500);
    };

    return (
      <div className="w-80 space-y-4">
        <SearchBar
          value={value}
          onChange={setValue}
          onSearch={handleSearch}
          isLoading={isLoading}
        />
        {results.length > 0 && (
          <div className="bg-white/5 rounded-lg p-3 space-y-2">
            {results.map((r, i) => (
              <div key={i} className="text-white/80 text-sm">{r}</div>
            ))}
          </div>
        )}
      </div>
    );
  },
  parameters: {
    docs: { description: { story: 'Interactive search with simulated results.' } },
  },
};

// ============================================================
// NOTIFICATION CARD STORIES
// ============================================================

export const NotificationCardDefault: Story = {
  render: () => (
    <div className="w-80">
      <NotificationCard
        title="New member joined"
        message="Sarah Chen joined Design Club"
        timestamp="2 minutes ago"
      />
    </div>
  ),
};

export const NotificationCardRead: Story = {
  render: () => (
    <div className="w-80">
      <NotificationCard
        title="Event reminder"
        message="Design Sprint starts in 1 hour"
        timestamp="1 hour ago"
        read
      />
    </div>
  ),
};

export const NotificationCardTypes: Story = {
  render: () => (
    <div className="w-80 space-y-3">
      <NotificationCard title="New message" message="You have a new message" type="message" />
      <NotificationCard title="Event update" message="Event time changed" type="event" />
      <NotificationCard title="System update" message="New features available" type="system" />
      <NotificationCard title="Mention" message="You were mentioned in a post" type="mention" />
    </div>
  ),
};

export const NotificationCardNoMessage: Story = {
  render: () => (
    <div className="w-80">
      <NotificationCard title="Quick notification" timestamp="Just now" />
    </div>
  ),
};

// ============================================================
// BREADCRUMBS STORIES
// ============================================================

export const BreadcrumbsDefault: Story = {
  render: () => <Breadcrumbs items={mockBreadcrumbs} />,
  parameters: {
    docs: { description: { story: 'Default breadcrumb navigation.' } },
  },
};

export const BreadcrumbsWithHome: Story = {
  render: () => <Breadcrumbs items={mockBreadcrumbs} showHome />,
};

export const BreadcrumbsLong: Story = {
  render: () => (
    <Breadcrumbs
      items={[
        { label: 'Spaces', href: '/spaces' },
        { label: 'Academic', href: '/spaces/academic' },
        { label: 'Computer Science', href: '/spaces/academic/cs' },
        { label: 'Study Groups', href: '/spaces/academic/cs/study' },
        { label: 'Algorithms 101', href: '/spaces/academic/cs/study/algo' },
        { label: 'Settings' },
      ]}
      maxItems={4}
    />
  ),
  parameters: {
    docs: { description: { story: 'Long breadcrumb path with collapse.' } },
  },
};

export const BreadcrumbsCompactVariant: Story = {
  render: () => <BreadcrumbsCompact items={mockBreadcrumbs} />,
};

export const BreadcrumbsSingle: Story = {
  render: () => <Breadcrumbs items={[{ label: 'Dashboard' }]} />,
};

export const BreadcrumbsWithIcons: Story = {
  render: () => (
    <Breadcrumbs
      items={[
        { label: 'Settings', href: '/settings', icon: <Settings className="w-3.5 h-3.5" /> },
        { label: 'Profile' },
      ]}
      showHome
    />
  ),
};

// ============================================================
// FILTER CHIPS STORIES
// ============================================================

export const FilterChipsDefault: Story = {
  render: () => {
    const [selected, setSelected] = React.useState<string[]>([]);
    return <FilterChips chips={mockFilterChips} selectedIds={selected} onChange={setSelected} />;
  },
  parameters: {
    docs: { description: { story: 'Horizontal scrollable filter chips.' } },
  },
};

export const FilterChipsPreselected: Story = {
  render: () => {
    const [selected, setSelected] = React.useState<string[]>(['academic', 'social']);
    return <FilterChips chips={mockFilterChips} selectedIds={selected} onChange={setSelected} />;
  },
};

export const FilterChipsSingleSelect: Story = {
  render: () => {
    const [selected, setSelected] = React.useState<string[]>([]);
    return (
      <FilterChips
        chips={mockFilterChips}
        selectedIds={selected}
        onChange={setSelected}
        multiSelect={false}
      />
    );
  },
  parameters: {
    docs: { description: { story: 'Single selection mode - only one chip can be selected.' } },
  },
};

export const FilterChipsNoCounts: Story = {
  render: () => {
    const [selected, setSelected] = React.useState<string[]>([]);
    const chipsNoCounts = mockFilterChips.map(({ count, ...chip }) => chip);
    return <FilterChips chips={chipsNoCounts} selectedIds={selected} onChange={setSelected} />;
  },
};

export const FilterChipsNoIcons: Story = {
  render: () => {
    const [selected, setSelected] = React.useState<string[]>([]);
    const chipsNoIcons = mockFilterChips.map(({ icon, ...chip }) => chip);
    return <FilterChips chips={chipsNoIcons} selectedIds={selected} onChange={setSelected} />;
  },
};

export const FilterChipsNoClearButton: Story = {
  render: () => {
    const [selected, setSelected] = React.useState<string[]>(['academic']);
    return (
      <FilterChips
        chips={mockFilterChips}
        selectedIds={selected}
        onChange={setSelected}
        showClearAll={false}
      />
    );
  },
};

export const FilterChipsMany: Story = {
  render: () => {
    const [selected, setSelected] = React.useState<string[]>([]);
    const manyChips: FilterChip[] = [
      { id: '1', label: 'Academic', icon: '📚' },
      { id: '2', label: 'Social', icon: '🎉' },
      { id: '3', label: 'Sports', icon: '⚽' },
      { id: '4', label: 'Arts', icon: '🎨' },
      { id: '5', label: 'Music', icon: '🎵' },
      { id: '6', label: 'Gaming', icon: '🎮' },
      { id: '7', label: 'Outdoors', icon: '🏕️' },
      { id: '8', label: 'Tech', icon: '💻' },
      { id: '9', label: 'Food', icon: '🍕' },
      { id: '10', label: 'Travel', icon: '✈️' },
    ];
    return (
      <div className="max-w-md">
        <FilterChips chips={manyChips} selectedIds={selected} onChange={setSelected} />
      </div>
    );
  },
};

// ============================================================
// EMPTY STATE STORIES
// ============================================================

export const EmptyStateDefault: Story = {
  render: () => (
    <EmptyStateDelightful
      variant="list"
      title="No spaces yet"
      description="Create your first space to get started."
    />
  ),
  parameters: {
    docs: { description: { story: 'Default empty state with title and description.' } },
  },
};

export const EmptyStateWithAction: Story = {
  render: () => (
    <EmptyStateDelightful
      variant="list"
      title="No messages"
      description="Start a conversation with your community."
      actionLabel="Send first message"
      onAction={action('onAction')}
    />
  ),
};

export const EmptyStateSearch: Story = {
  render: () => (
    <EmptyStateDelightful
      variant="search"
      searchQuery="design club"
      onAction={action('onClearSearch')}
    />
  ),
};

export const EmptyStateCanvas: Story = {
  render: () => (
    <EmptyStateDelightful
      variant="canvas"
      size="lg"
      onAction={action('onStartWithTemplate')}
    />
  ),
};

export const EmptyStateError: Story = {
  render: () => (
    <EmptyStateDelightful
      variant="error"
      onAction={action('onRetry')}
    />
  ),
};

export const EmptyStateVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      <EmptyStateDelightful variant="list" title="Inbox empty" description="No new notifications" size="sm" />
      <EmptyStateDelightful variant="search" searchQuery="test" size="sm" />
      <EmptyStateDelightful variant="error" size="sm" />
    </div>
  ),
};

// ============================================================
// TAG LIST STORIES
// ============================================================

export const TagListDefault: Story = {
  render: () => <TagList tags={['design', 'ux', 'workshop', 'figma']} />,
  parameters: {
    docs: { description: { story: 'Default tag list display.' } },
  },
};

export const TagListOverflow: Story = {
  render: () => (
    <TagList
      tags={['design', 'ux', 'workshop', 'figma', 'prototype', 'research', 'testing', 'iteration']}
      max={4}
    />
  ),
  parameters: {
    docs: { description: { story: 'Tag list with overflow (+N) indicator.' } },
  },
};

export const TagListSingle: Story = {
  render: () => <TagList tags={['featured']} />,
};

export const TagListEmpty: Story = {
  render: () => <TagList tags={[]} />,
};

export const TagListMaxVariants: Story = {
  render: () => {
    const tags = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight'];
    return (
      <div className="space-y-4">
        <div>
          <span className="text-white/60 text-sm">max=3:</span>
          <TagList tags={tags} max={3} />
        </div>
        <div>
          <span className="text-white/60 text-sm">max=5:</span>
          <TagList tags={tags} max={5} />
        </div>
        <div>
          <span className="text-white/60 text-sm">max=8 (all):</span>
          <TagList tags={tags} max={8} />
        </div>
      </div>
    );
  },
};

// ============================================================
// RSVP BUTTON STORIES
// ============================================================

export const RSVPButtonDefault: Story = {
  render: () => {
    const [isGoing, setIsGoing] = React.useState(false);
    const [count, setCount] = React.useState(24);

    return (
      <RSVPButton
        isGoing={isGoing}
        count={count}
        onRSVP={(going) => {
          setIsGoing(going);
          setCount((prev) => (going ? prev + 1 : prev - 1));
        }}
      />
    );
  },
  parameters: {
    docs: { description: { story: 'Interactive RSVP button with count animation.' } },
  },
};

export const RSVPButtonGoing: Story = {
  render: () => (
    <RSVPButton isGoing count={25} onRSVP={action('onRSVP')} />
  ),
};

export const RSVPButtonNotGoing: Story = {
  render: () => (
    <RSVPButton isGoing={false} count={24} onRSVP={action('onRSVP')} />
  ),
};

export const RSVPButtonLoading: Story = {
  render: () => (
    <RSVPButton isGoing={false} count={24} onRSVP={action('onRSVP')} isLoading />
  ),
};

export const RSVPButtonDisabled: Story = {
  render: () => (
    <RSVPButton isGoing={false} count={24} onRSVP={action('onRSVP')} disabled />
  ),
};

export const RSVPButtonHighCount: Story = {
  render: () => (
    <RSVPButton isGoing count={156} onRSVP={action('onRSVP')} />
  ),
};

// ============================================================
// PROGRESS LIST STORIES
// ============================================================

export const ProgressListDefault: Story = {
  render: () => <ProgressList steps={mockProgressSteps} />,
  parameters: {
    docs: { description: { story: 'Progress list with various step states.' } },
  },
};

export const ProgressListCompact: Story = {
  render: () => <ProgressList steps={mockProgressSteps} compact />,
};

export const ProgressListAllDone: Story = {
  render: () => (
    <ProgressList
      steps={mockProgressSteps.map((step) => ({ ...step, state: 'done' as const }))}
    />
  ),
};

export const ProgressListAllUpcoming: Story = {
  render: () => (
    <ProgressList
      steps={mockProgressSteps.map((step) => ({ ...step, state: 'upcoming' as const }))}
    />
  ),
};

export const ProgressListWithBlocked: Story = {
  render: () => (
    <ProgressList
      steps={[
        { id: '1', label: 'Submit application', state: 'done' },
        { id: '2', label: 'Background check', description: 'Verification in progress', state: 'blocked' },
        { id: '3', label: 'Approval', state: 'upcoming' },
      ]}
    />
  ),
};

export const ProgressListLong: Story = {
  render: () => (
    <ProgressList
      steps={[
        { id: '1', label: 'Step 1: Research', description: 'Gather requirements', state: 'done' },
        { id: '2', label: 'Step 2: Design', description: 'Create mockups', state: 'done' },
        { id: '3', label: 'Step 3: Prototype', description: 'Build interactive demo', state: 'done' },
        { id: '4', label: 'Step 4: Testing', description: 'User testing sessions', state: 'active' },
        { id: '5', label: 'Step 5: Iteration', description: 'Refine based on feedback', state: 'upcoming' },
        { id: '6', label: 'Step 6: Launch', description: 'Deploy to production', state: 'upcoming' },
      ]}
    />
  ),
};

// ============================================================
// COMPARISON & COMPOSITION STORIES
// ============================================================

export const AllMoleculesOverview: Story = {
  render: () => (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h3 className="text-white text-lg font-medium mb-4">Avatar Stack</h3>
        <AvatarStackWithCount users={mockUsers.slice(0, 5)} label="members" />
      </div>

      <div>
        <h3 className="text-white text-lg font-medium mb-4">Stat Cards</h3>
        <div className="grid grid-cols-2 gap-4">
          <StatCard label="Members" value="1,247" delta={<KpiDelta value={12} />} />
          <StatCard label="Events" value="24" delta={<KpiDelta value={-5} />} />
        </div>
      </div>

      <div>
        <h3 className="text-white text-lg font-medium mb-4">Search Bar</h3>
        <SearchBar value="" onChange={() => {}} placeholder="Search..." />
      </div>

      <div>
        <h3 className="text-white text-lg font-medium mb-4">Breadcrumbs</h3>
        <Breadcrumbs items={mockBreadcrumbs} showHome />
      </div>

      <div>
        <h3 className="text-white text-lg font-medium mb-4">Filter Chips</h3>
        <FilterChips chips={mockFilterChips} selectedIds={['academic']} onChange={() => {}} />
      </div>

      <div>
        <h3 className="text-white text-lg font-medium mb-4">Tag List</h3>
        <TagList tags={['design', 'ux', 'workshop', 'figma', 'prototype']} max={4} />
      </div>

      <div>
        <h3 className="text-white text-lg font-medium mb-4">Progress List</h3>
        <ProgressList steps={mockProgressSteps.slice(0, 3)} compact />
      </div>

      <div>
        <h3 className="text-white text-lg font-medium mb-4">Empty State</h3>
        <EmptyStateDelightful
          variant="search"
          title="No results"
          description="Try a different search"
          actionLabel="Clear filters"
          size="sm"
        />
      </div>
    </div>
  ),
  parameters: {
    docs: { description: { story: 'Overview of all global molecule components.' } },
  },
};

export const DashboardComposition: Story = {
  render: () => (
    <div className="max-w-4xl space-y-6">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Dashboard' }]} showHome />

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Space Dashboard</h1>
        <SearchBar value="" onChange={() => {}} size="sm" className="w-64" />
      </div>

      <FilterChips
        chips={mockFilterChips.slice(0, 4)}
        selectedIds={['academic']}
        onChange={() => {}}
      />

      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Members" value="1,247" icon={<Users className="h-5 w-5" />} delta={<KpiDelta value={5} />} />
        <StatCard label="Events" value="24" icon={<Calendar className="h-5 w-5" />} delta={<KpiDelta value={12} />} />
        <StatCard label="Messages" value="8.5k" icon={<MessageSquare className="h-5 w-5" />} delta={<KpiDelta value={-3} />} />
        <StatCard label="Growth" value="18%" icon={<TrendingUp className="h-5 w-5" />} delta={<KpiDelta value={4} />} />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white/5 rounded-xl p-6">
          <h3 className="text-white font-medium mb-4">Recent Attendees</h3>
          <AvatarStackWithCount users={mockUsers.slice(0, 6)} label="people this week" />
        </div>
        <div className="bg-white/5 rounded-xl p-6">
          <h3 className="text-white font-medium mb-4">Onboarding Progress</h3>
          <ProgressList steps={mockProgressSteps.slice(0, 3)} compact />
        </div>
      </div>
    </div>
  ),
  parameters: {
    layout: 'padded',
    docs: { description: { story: 'Real-world dashboard composition using global molecules.' } },
  },
};

// ============================================================
// EDGE CASES
// ============================================================

export const AvatarStackSingleUser: Story = {
  render: () => <AvatarStack users={[mockUsers[0]]} />,
};

export const AvatarStackEmpty: Story = {
  render: () => <AvatarStack users={[]} />,
};

export const SearchBarLongValue: Story = {
  render: () => {
    const [value, setValue] = React.useState('this is a very long search query that might overflow');
    return (
      <div className="w-80">
        <SearchBar value={value} onChange={setValue} />
      </div>
    );
  },
};

export const NotificationCardLong: Story = {
  render: () => (
    <div className="w-80">
      <NotificationCard
        title="This is a very long notification title that might wrap to multiple lines"
        message="And this is an equally long message that provides additional context about the notification event that occurred."
        timestamp="2 hours ago"
      />
    </div>
  ),
};

export const FilterChipsAllSelected: Story = {
  render: () => {
    const [selected, setSelected] = React.useState<string[]>(mockFilterChips.map((c) => c.id));
    return <FilterChips chips={mockFilterChips} selectedIds={selected} onChange={setSelected} />;
  },
};
