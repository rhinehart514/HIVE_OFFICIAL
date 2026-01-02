'use client';

import * as React from 'react';
import { action } from '@storybook/addon-actions';
import { Search, LogIn, Plus, Trash2 } from 'lucide-react';

import { BoardTabBar, type BoardData } from './board-tab-bar';
import { SpaceDiscoveryCard, type SpaceDiscoveryCardData } from './space-discovery-card';
import {
  SpaceEmptyState,
  PostsEmptyState,
  MembersEmptyState,
  EventsEmptyState,
  ToolsEmptyState,
  SpacesEmptyState,
  SearchEmptyState,
} from './space-empty-state';

import type { Meta, StoryObj } from '@storybook/react';

// ============================================================
// Mock Data Generators
// ============================================================

const mockBoards: BoardData[] = [
  { id: 'general', name: 'General', type: 'general', isDefault: true },
  { id: 'events', name: 'Events', type: 'event' },
  { id: 'study-group', name: 'Study Group', type: 'topic' },
  { id: 'resources', name: 'Resources', type: 'topic' },
  { id: 'off-topic', name: 'Off-Topic', type: 'topic' },
];

const mockUnreadCounts: Record<string, number> = {
  events: 3,
  'study-group': 12,
  resources: 1,
};

const mockRecentMembers = [
  { id: '1', name: 'Sarah Chen', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=50&h=50&fit=crop' },
  { id: '2', name: 'Marcus Johnson', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop' },
  { id: '3', name: 'Emily Rodriguez', avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50&h=50&fit=crop' },
];

const createMockDiscoveryCard = (overrides: Partial<SpaceDiscoveryCardData> = {}): SpaceDiscoveryCardData => ({
  id: 'space-1',
  name: 'Design Club',
  description: 'A community for UX/UI designers to share work and grow together.',
  bannerImage: 'https://images.unsplash.com/photo-1558655146-364adaf1fcc9?w=200&h=200&fit=crop',
  memberCount: 247,
  category: 'academic',
  isVerified: true,
  activityLevel: 'high',
  recentMembers: mockRecentMembers,
  ...overrides,
});

// ============================================================
// Meta Configuration
// ============================================================

const meta = {
  title: '03-Spaces/Molecules',
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Collection of Space-specific molecule components for navigation, headers, cards, and empty states.',
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
// BOARD TAB BAR STORIES
// ============================================================

export const BoardTabBarDefault: Story = {
  render: () => {
    const [activeBoard, setActiveBoard] = React.useState('general');
    return (
      <div className="w-full max-w-2xl bg-[#0A0A0A]">
        <BoardTabBar
          boards={mockBoards}
          activeBoardId={activeBoard}
          onBoardChange={setActiveBoard}
        />
      </div>
    );
  },
  parameters: {
    docs: { description: { story: 'Discord-style board/channel selector tabs.' } },
  },
};

export const BoardTabBarWithUnread: Story = {
  render: () => {
    const [activeBoard, setActiveBoard] = React.useState('general');
    return (
      <div className="w-full max-w-2xl bg-[#0A0A0A]">
        <BoardTabBar
          boards={mockBoards}
          activeBoardId={activeBoard}
          unreadCounts={mockUnreadCounts}
          onBoardChange={setActiveBoard}
        />
      </div>
    );
  },
  parameters: {
    docs: { description: { story: 'Board tabs with unread count badges.' } },
  },
};

export const BoardTabBarLeader: Story = {
  render: () => {
    const [activeBoard, setActiveBoard] = React.useState('general');
    return (
      <div className="w-full max-w-2xl bg-[#0A0A0A]">
        <BoardTabBar
          boards={mockBoards}
          activeBoardId={activeBoard}
          unreadCounts={mockUnreadCounts}
          isLeader
          onBoardChange={setActiveBoard}
          onCreateBoard={action('onCreateBoard')}
        />
      </div>
    );
  },
  parameters: {
    docs: { description: { story: 'Leader view with create board button.' } },
  },
};

export const BoardTabBarSingleBoard: Story = {
  render: () => (
    <div className="w-full max-w-2xl bg-[#0A0A0A]">
      <BoardTabBar
        boards={[mockBoards[0]]}
        activeBoardId="general"
        onBoardChange={action('onBoardChange')}
      />
    </div>
  ),
};

export const BoardTabBarManyBoards: Story = {
  render: () => {
    const [activeBoard, setActiveBoard] = React.useState('general');
    const manyBoards: BoardData[] = [
      ...mockBoards,
      { id: 'announcements', name: 'Announcements', type: 'topic' },
      { id: 'help', name: 'Help & Support', type: 'topic' },
      { id: 'feedback', name: 'Feedback', type: 'topic' },
      { id: 'showcase', name: 'Showcase', type: 'topic' },
      { id: 'jobs', name: 'Jobs', type: 'topic' },
    ];
    return (
      <div className="w-full max-w-2xl bg-[#0A0A0A]">
        <BoardTabBar
          boards={manyBoards}
          activeBoardId={activeBoard}
          onBoardChange={setActiveBoard}
        />
      </div>
    );
  },
  parameters: {
    docs: { description: { story: 'Many boards with horizontal scroll.' } },
  },
};

export const BoardTabBarAllTypes: Story = {
  render: () => {
    const [activeBoard, setActiveBoard] = React.useState('general');
    const typedBoards: BoardData[] = [
      { id: 'general', name: 'General', type: 'general' },
      { id: 'event-1', name: 'Weekly Meetup', type: 'event' },
      { id: 'topic-1', name: 'Design Talk', type: 'topic' },
      { id: 'event-2', name: 'Workshop', type: 'event' },
      { id: 'topic-2', name: 'Resources', type: 'topic' },
    ];
    return (
      <div className="w-full max-w-2xl bg-[#0A0A0A]">
        <BoardTabBar
          boards={typedBoards}
          activeBoardId={activeBoard}
          onBoardChange={setActiveBoard}
        />
        <p className="text-white/60 text-sm mt-4 text-center">
          Icons: # = general, calendar = event, message = topic
        </p>
      </div>
    );
  },
};

export const BoardTabBarHighUnread: Story = {
  render: () => {
    const [activeBoard, setActiveBoard] = React.useState('general');
    return (
      <div className="w-full max-w-2xl bg-[#0A0A0A]">
        <BoardTabBar
          boards={mockBoards}
          activeBoardId={activeBoard}
          unreadCounts={{ events: 99, 'study-group': 150, resources: 42 }}
          onBoardChange={setActiveBoard}
        />
      </div>
    );
  },
  parameters: {
    docs: { description: { story: 'High unread counts showing 99+ truncation.' } },
  },
};

// ============================================================
// SPACE DISCOVERY CARD STORIES
// ============================================================

export const DiscoveryCardDefault: Story = {
  render: () => (
    <div className="w-full max-w-md">
      <SpaceDiscoveryCard
        space={createMockDiscoveryCard()}
        onJoin={action('onJoin')}
        onClick={action('onClick')}
      />
    </div>
  ),
  parameters: {
    docs: { description: { story: 'Discovery card with momentum strip and social proof.' } },
  },
};

export const DiscoveryCardVerified: Story = {
  render: () => (
    <div className="w-full max-w-md">
      <SpaceDiscoveryCard
        space={createMockDiscoveryCard({ isVerified: true })}
        onJoin={action('onJoin')}
      />
    </div>
  ),
};

export const DiscoveryCardNotVerified: Story = {
  render: () => (
    <div className="w-full max-w-md">
      <SpaceDiscoveryCard
        space={createMockDiscoveryCard({ isVerified: false })}
        onJoin={action('onJoin')}
      />
    </div>
  ),
};

export const DiscoveryCardHighActivity: Story = {
  render: () => (
    <div className="w-full max-w-md">
      <SpaceDiscoveryCard
        space={createMockDiscoveryCard({ activityLevel: 'high' })}
        onJoin={action('onJoin')}
      />
    </div>
  ),
};

export const DiscoveryCardLiveActivity: Story = {
  render: () => (
    <div className="w-full max-w-md">
      <SpaceDiscoveryCard
        space={createMockDiscoveryCard({ activityLevel: 'live' })}
        onJoin={action('onJoin')}
      />
    </div>
  ),
};

export const DiscoveryCardQuietActivity: Story = {
  render: () => (
    <div className="w-full max-w-md">
      <SpaceDiscoveryCard
        space={createMockDiscoveryCard({ activityLevel: 'quiet' })}
        onJoin={action('onJoin')}
      />
    </div>
  ),
};

export const DiscoveryCardJoining: Story = {
  render: () => (
    <div className="w-full max-w-md">
      <SpaceDiscoveryCard
        space={createMockDiscoveryCard()}
        isJoining
        onJoin={action('onJoin')}
      />
    </div>
  ),
};

export const DiscoveryCardNoBanner: Story = {
  render: () => (
    <div className="w-full max-w-md">
      <SpaceDiscoveryCard
        space={createMockDiscoveryCard({ bannerImage: undefined })}
        onJoin={action('onJoin')}
      />
    </div>
  ),
  parameters: {
    docs: { description: { story: 'Card with monogram fallback when no banner.' } },
  },
};

export const DiscoveryCardNoMembers: Story = {
  render: () => (
    <div className="w-full max-w-md">
      <SpaceDiscoveryCard
        space={createMockDiscoveryCard({ recentMembers: [], memberCount: 1 })}
        onJoin={action('onJoin')}
      />
    </div>
  ),
};

export const DiscoveryCardLargeSpace: Story = {
  render: () => (
    <div className="w-full max-w-md">
      <SpaceDiscoveryCard
        space={createMockDiscoveryCard({ memberCount: 12847 })}
        onJoin={action('onJoin')}
      />
    </div>
  ),
};

export const DiscoveryCardAllActivityLevels: Story = {
  render: () => (
    <div className="grid grid-cols-1 gap-4 max-w-md">
      {(['high', 'live', 'quiet'] as const).map((level) => (
        <SpaceDiscoveryCard
          key={level}
          space={createMockDiscoveryCard({ id: level, activityLevel: level, name: `${level.charAt(0).toUpperCase() + level.slice(1)} Activity Space` })}
          onJoin={action('onJoin')}
        />
      ))}
    </div>
  ),
  parameters: {
    docs: { description: { story: 'All activity levels with different momentum strip colors.' } },
  },
};

export const DiscoveryCardGrid: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4 max-w-2xl">
      <SpaceDiscoveryCard
        space={createMockDiscoveryCard({ id: '1', name: 'Design Club', category: 'academic' })}
        onJoin={action('onJoin')}
      />
      <SpaceDiscoveryCard
        space={createMockDiscoveryCard({ id: '2', name: 'Photography Society', category: 'arts', activityLevel: 'live' })}
        onJoin={action('onJoin')}
      />
      <SpaceDiscoveryCard
        space={createMockDiscoveryCard({ id: '3', name: 'Chess Club', category: 'recreational', activityLevel: 'quiet' })}
        onJoin={action('onJoin')}
      />
      <SpaceDiscoveryCard
        space={createMockDiscoveryCard({ id: '4', name: 'Startup Hub', category: 'professional', isVerified: true })}
        onJoin={action('onJoin')}
      />
    </div>
  ),
  parameters: {
    docs: { description: { story: 'Grid of discovery cards for browse page.' } },
  },
};

export const DiscoveryCardInteractive: Story = {
  render: () => {
    const [isJoining, setIsJoining] = React.useState(false);
    const [joined, setJoined] = React.useState(false);

    const handleJoin = () => {
      setIsJoining(true);
      setTimeout(() => {
        setIsJoining(false);
        setJoined(true);
      }, 1500);
    };

    return (
      <div className="w-full max-w-md space-y-4">
        <SpaceDiscoveryCard
          space={createMockDiscoveryCard()}
          isJoining={isJoining}
          onJoin={handleJoin}
        />
        {joined && (
          <div className="text-center text-green-400 text-sm">
            Successfully joined!
            <button onClick={() => setJoined(false)} className="ml-2 underline">Reset</button>
          </div>
        )}
      </div>
    );
  },
};

// ============================================================
// SPACE EMPTY STATE STORIES
// ============================================================

export const EmptyStateNoPosts: Story = {
  render: () => (
    <div className="w-full max-w-md bg-[#141414] rounded-xl">
      <PostsEmptyState action={{ label: 'Create Post', onClick: action('onCreate') }} />
    </div>
  ),
  parameters: {
    docs: { description: { story: 'Empty state for no posts.' } },
  },
};

export const EmptyStateNoMembers: Story = {
  render: () => (
    <div className="w-full max-w-md bg-[#141414] rounded-xl">
      <MembersEmptyState action={{ label: 'Join Space', onClick: action('onJoin') }} />
    </div>
  ),
};

export const EmptyStateNoEvents: Story = {
  render: () => (
    <div className="w-full max-w-md bg-[#141414] rounded-xl">
      <EventsEmptyState action={{ label: 'Create Event', onClick: action('onCreate') }} />
    </div>
  ),
};

export const EmptyStateNoTools: Story = {
  render: () => (
    <div className="w-full max-w-md bg-[#141414] rounded-xl">
      <ToolsEmptyState action={{ label: 'Browse Tools', onClick: action('onBrowse') }} />
    </div>
  ),
};

export const EmptyStateNoSpaces: Story = {
  render: () => (
    <div className="w-full max-w-md bg-[#141414] rounded-xl">
      <SpacesEmptyState action={{ label: 'Browse Spaces', onClick: action('onBrowse') }} />
    </div>
  ),
};

export const EmptyStateNoResults: Story = {
  render: () => (
    <div className="w-full max-w-md bg-[#141414] rounded-xl">
      <SearchEmptyState
        action={{ label: 'Clear Filters', onClick: action('onClear') }}
        secondaryAction={{ label: 'Try Again', onClick: action('onRetry'), icon: <Search className="h-4 w-4 mr-1" /> }}
      />
    </div>
  ),
};

export const EmptyStateCustom: Story = {
  render: () => (
    <div className="w-full max-w-md bg-[#141414] rounded-xl">
      <SpaceEmptyState
        variant="custom"
        icon={<Trash2 className="h-8 w-8" />}
        title="Archive is empty"
        description="Deleted items will appear here for 30 days."
      />
    </div>
  ),
};

export const EmptyStatePrimary: Story = {
  render: () => (
    <div className="w-full max-w-md bg-[#141414] rounded-xl">
      <SpaceEmptyState
        variant="no-members"
        primary
        action={{ label: 'Join Now', onClick: action('onJoin'), icon: <LogIn className="h-4 w-4 mr-1.5" /> }}
      />
    </div>
  ),
  parameters: {
    docs: { description: { story: 'Primary (gold) CTA variant for conversion.' } },
  },
};

export const EmptyStateSizes: Story = {
  render: () => (
    <div className="space-y-6">
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <div key={size} className="bg-[#141414] rounded-xl">
          <p className="text-white/60 text-sm px-4 pt-4">Size: {size}</p>
          <SpaceEmptyState
            variant="no-posts"
            size={size}
            action={{ label: 'Create Post', onClick: action('onCreate') }}
          />
        </div>
      ))}
    </div>
  ),
  parameters: {
    docs: { description: { story: 'All size variants.' } },
  },
};

export const EmptyStateWithSecondaryAction: Story = {
  render: () => (
    <div className="w-full max-w-md bg-[#141414] rounded-xl">
      <SpaceEmptyState
        variant="no-results"
        action={{ label: 'Adjust Search', onClick: action('onAdjust') }}
        secondaryAction={{ label: 'Clear All', onClick: action('onClear') }}
      />
    </div>
  ),
};

export const EmptyStateNoAnimation: Story = {
  render: () => (
    <div className="w-full max-w-md bg-[#141414] rounded-xl">
      <SpaceEmptyState
        variant="no-content"
        animate={false}
      />
    </div>
  ),
};

export const EmptyStateAllVariants: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4 max-w-3xl">
      <div className="bg-[#141414] rounded-xl"><PostsEmptyState size="sm" /></div>
      <div className="bg-[#141414] rounded-xl"><MembersEmptyState size="sm" /></div>
      <div className="bg-[#141414] rounded-xl"><EventsEmptyState size="sm" /></div>
      <div className="bg-[#141414] rounded-xl"><ToolsEmptyState size="sm" /></div>
      <div className="bg-[#141414] rounded-xl"><SpacesEmptyState size="sm" /></div>
      <div className="bg-[#141414] rounded-xl"><SearchEmptyState size="sm" /></div>
    </div>
  ),
  parameters: {
    docs: { description: { story: 'All empty state variants in a grid.' } },
  },
};

// ============================================================
// COMPOSITION STORIES
// ============================================================

export const SpacePageLayout: Story = {
  render: () => {
    const [activeBoard, setActiveBoard] = React.useState('general');

    return (
      <div className="w-full max-w-4xl bg-[#0A0A0A] rounded-xl overflow-hidden">
        {/* Note: PremiumHeader component is in premium/ folder */}
        <div className="p-4 border-b border-white/10">
          <h1 className="text-xl font-semibold text-white">Design Club</h1>
          <p className="text-sm text-white/50">247 members • 12 online</p>
        </div>
        <BoardTabBar
          boards={mockBoards}
          activeBoardId={activeBoard}
          unreadCounts={mockUnreadCounts}
          isLeader
          onBoardChange={setActiveBoard}
          onCreateBoard={action('onCreateBoard')}
        />
        <div className="p-6">
          <PostsEmptyState
            action={{ label: 'Create Post', onClick: action('onCreate') }}
          />
        </div>
      </div>
    );
  },
  parameters: {
    docs: { description: { story: 'Complete space page layout with header placeholder, tabs, and empty state.' } },
  },
};

export const BrowsePageLayout: Story = {
  render: () => (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Browse Spaces</h1>
        <button className="px-4 py-2 bg-[#FFD700] text-black rounded-lg font-medium">
          Create Space
        </button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <SpaceDiscoveryCard
          space={createMockDiscoveryCard({ id: '1', name: 'Design Club', activityLevel: 'high' })}
          onJoin={action('onJoin')}
        />
        <SpaceDiscoveryCard
          space={createMockDiscoveryCard({ id: '2', name: 'Photography', activityLevel: 'live' })}
          onJoin={action('onJoin')}
        />
        <SpaceDiscoveryCard
          space={createMockDiscoveryCard({ id: '3', name: 'Chess Club', activityLevel: 'quiet', isVerified: false })}
          onJoin={action('onJoin')}
        />
        <SpaceDiscoveryCard
          space={createMockDiscoveryCard({ id: '4', name: 'Startup Hub', isVerified: true })}
          onJoin={action('onJoin')}
        />
      </div>
    </div>
  ),
  parameters: {
    docs: { description: { story: 'Browse page layout with discovery cards.' } },
  },
};

export const EmptyBrowsePage: Story = {
  render: () => (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Browse Spaces</h1>
      </div>
      <div className="bg-[#141414] rounded-xl">
        <SpacesEmptyState
          primary
          action={{ label: 'Create First Space', onClick: action('onCreate'), icon: <Plus className="h-4 w-4 mr-1.5" /> }}
        />
      </div>
    </div>
  ),
};

// ============================================================
// EDGE CASES
// ============================================================

export const BoardTabBarEmpty: Story = {
  render: () => (
    <div className="w-full max-w-2xl bg-[#0A0A0A]">
      <BoardTabBar
        boards={[]}
        activeBoardId=""
        onBoardChange={action('onBoardChange')}
      />
    </div>
  ),
};

export const DiscoveryCardLongName: Story = {
  render: () => (
    <div className="w-full max-w-md">
      <SpaceDiscoveryCard
        space={createMockDiscoveryCard({ name: 'University at Buffalo Computer Science Graduate Student Research Group' })}
        onJoin={action('onJoin')}
      />
    </div>
  ),
};

export const EmptyStateNoAction: Story = {
  render: () => (
    <div className="w-full max-w-md bg-[#141414] rounded-xl">
      <SpaceEmptyState variant="no-content" />
    </div>
  ),
};

// ============================================================
// RESPONSIVE STORIES
// ============================================================

export const MobileLayout: Story = {
  render: () => {
    const [activeBoard, setActiveBoard] = React.useState('general');

    return (
      <div className="w-[375px] bg-[#0A0A0A] rounded-xl overflow-hidden">
        {/* Note: PremiumHeader component is in premium/ folder */}
        <div className="p-3 border-b border-white/10">
          <h1 className="text-lg font-semibold text-white">Design Club</h1>
          <p className="text-xs text-white/50">247 members • 12 online</p>
        </div>
        <BoardTabBar
          boards={mockBoards.slice(0, 3)}
          activeBoardId={activeBoard}
          onBoardChange={setActiveBoard}
        />
        <div className="p-4">
          <SpaceEmptyState variant="no-posts" size="sm" />
        </div>
      </div>
    );
  },
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
    docs: { description: { story: 'Mobile layout with compact components.' } },
  },
};

export const TabletLayout: Story = {
  render: () => (
    <div className="w-[768px]">
      <div className="grid grid-cols-2 gap-4">
        <SpaceDiscoveryCard
          space={createMockDiscoveryCard({ id: '1' })}
          onJoin={action('onJoin')}
        />
        <SpaceDiscoveryCard
          space={createMockDiscoveryCard({ id: '2', name: 'Photography' })}
          onJoin={action('onJoin')}
        />
      </div>
    </div>
  ),
  parameters: {
    viewport: { defaultViewport: 'tablet' },
    docs: { description: { story: 'Tablet layout with 2-column grid.' } },
  },
};

// ============================================================
// COLLAPSIBLE WIDGET STORIES
// ============================================================

import { CollapsibleWidget } from './collapsible-widget';
import { SpaceToolsWidget, type SpaceTool, type SpaceToolsWidgetData } from './space-tools-widget';
import { PinnedMessagesWidget, type PinnedMessage } from './pinned-messages-widget';
import { SpaceComposer } from './space-composer';
import { SpaceAboutWidget, type SpaceAboutWidgetData } from './space-about-widget';
import { ThreadDrawer, type ThreadDrawerProps } from './thread-drawer';
import { TodayDrawer } from './today-drawer';
import { NowCard, type NowCardProps } from './now-card';
import { CategoryFilterBar, type CategoryOption } from './category-filter-bar';
import type { ChatMessageData } from '../organisms/space-chat-board';

export const CollapsibleWidgetDefault: Story = {
  render: () => (
    <div className="w-80 bg-[#0A0A0A] p-4">
      <CollapsibleWidget title="About" icon={<Search className="h-4 w-4" />}>
        <div className="text-white/60 text-sm">
          This is a collapsible widget with content that can be expanded or collapsed.
        </div>
      </CollapsibleWidget>
    </div>
  ),
  parameters: {
    docs: { description: { story: 'Basic collapsible widget with icon and content.' } },
  },
};

export const CollapsibleWidgetWithBadge: Story = {
  render: () => (
    <div className="w-80 bg-[#0A0A0A] p-4">
      <CollapsibleWidget title="Notifications" badge={<span className="text-[#FFD700]">5</span>}>
        <ul className="space-y-2 text-white/60 text-sm">
          <li>New message from Sarah</li>
          <li>Event reminder: Design Review</li>
          <li>Marcus replied to your thread</li>
          <li>Poll results are in</li>
          <li>New member joined</li>
        </ul>
      </CollapsibleWidget>
    </div>
  ),
};

export const CollapsibleWidgetGlass: Story = {
  render: () => (
    <div className="w-80 bg-[#0A0A0A] p-4">
      <CollapsibleWidget title="Glass Widget" glass>
        <div className="text-white/60 text-sm p-4">
          Glass morphism styling applied for modern look.
        </div>
      </CollapsibleWidget>
    </div>
  ),
};

export const CollapsibleWidgetDefaultCollapsed: Story = {
  render: () => (
    <div className="w-80 bg-[#0A0A0A] p-4">
      <CollapsibleWidget title="Collapsed by Default" defaultCollapsed>
        <div className="text-white/60 text-sm">
          This content was hidden initially.
        </div>
      </CollapsibleWidget>
    </div>
  ),
};

export const CollapsibleWidgetWithPeek: Story = {
  render: () => (
    <div className="w-80 bg-[#0A0A0A] p-4">
      <CollapsibleWidget
        title="Events"
        defaultCollapsed
        peek={<span className="text-white/40 text-xs">3 upcoming events</span>}
      >
        <ul className="space-y-2 text-white/60 text-sm">
          <li>Design Review - Tomorrow</li>
          <li>Weekly Standup - Friday</li>
          <li>Workshop - Next Week</li>
        </ul>
      </CollapsibleWidget>
    </div>
  ),
  parameters: {
    docs: { description: { story: 'Collapsed widget with peek content preview.' } },
  },
};

export const CollapsibleWidgetEmpty: Story = {
  render: () => (
    <div className="w-80 bg-[#0A0A0A] p-4">
      <CollapsibleWidget
        title="Resources"
        isEmpty
        emptyState={<div className="text-white/40 text-sm text-center py-4">No resources yet</div>}
      >
        <div>This won&apos;t show because isEmpty is true</div>
      </CollapsibleWidget>
    </div>
  ),
};

export const CollapsibleWidgetWithHeaderActions: Story = {
  render: () => (
    <div className="w-80 bg-[#0A0A0A] p-4">
      <CollapsibleWidget
        title="Tools"
        badge="4"
        headerActions={
          <button className="text-[#FFD700] text-xs hover:underline" onClick={action('onViewAll')}>
            View all
          </button>
        }
      >
        <div className="text-white/60 text-sm space-y-2">
          <div>Poll: Next meeting time</div>
          <div>Countdown: Launch day</div>
          <div>Form: Feedback survey</div>
          <div>Timer: Sprint ends</div>
        </div>
      </CollapsibleWidget>
    </div>
  ),
};

export const CollapsibleWidgetMultiple: Story = {
  render: () => (
    <div className="w-80 bg-[#0A0A0A] p-4 space-y-2">
      <CollapsibleWidget title="About" icon={<Search className="h-4 w-4" />}>
        <div className="text-white/60 text-sm">Space description here.</div>
      </CollapsibleWidget>
      <CollapsibleWidget title="Members" badge="47">
        <div className="text-white/60 text-sm">Member list here.</div>
      </CollapsibleWidget>
      <CollapsibleWidget title="Tools" badge="3" defaultCollapsed>
        <div className="text-white/60 text-sm">Tools list here.</div>
      </CollapsibleWidget>
    </div>
  ),
  parameters: {
    docs: { description: { story: 'Multiple collapsible widgets stacked.' } },
  },
};

// ============================================================
// SPACE TOOLS WIDGET STORIES
// ============================================================

const mockTools: SpaceTool[] = [
  { id: 'poll-1', name: 'Meeting Time Poll', icon: 'bar-chart', type: 'poll', isActive: true, responseCount: 12, closeTime: '2h 15m' },
  { id: 'countdown-1', name: 'Launch Countdown', icon: 'timer', type: 'countdown', isActive: true },
  { id: 'form-1', name: 'Feedback Survey', icon: 'clipboard', type: 'form', isActive: true, responseCount: 8 },
  { id: 'timer-1', name: 'Sprint Timer', icon: 'clock', type: 'timer', isActive: false },
];

const mockToolsData: SpaceToolsWidgetData = {
  spaceId: 'space-1',
  tools: mockTools,
  hasMore: true,
};

export const SpaceToolsWidgetDefault: Story = {
  render: () => (
    <div className="w-80 bg-[#0A0A0A] p-4">
      <SpaceToolsWidget
        data={mockToolsData}
        onToolClick={action('onToolClick')}
        onViewAll={action('onViewAll')}
      />
    </div>
  ),
  parameters: {
    docs: { description: { story: 'Space tools widget showing active tools.' } },
  },
};

export const SpaceToolsWidgetEmpty: Story = {
  render: () => (
    <div className="w-80 bg-[#0A0A0A] p-4">
      <SpaceToolsWidget
        data={{ spaceId: 'space-1', tools: [], hasMore: false }}
        onToolClick={action('onToolClick')}
      />
    </div>
  ),
};

export const SpaceToolsWidgetCompact: Story = {
  render: () => (
    <div className="w-80 bg-[#0A0A0A] p-4">
      <SpaceToolsWidget
        data={mockToolsData}
        compact
        onToolClick={action('onToolClick')}
      />
    </div>
  ),
};

export const SpaceToolsWidgetInline: Story = {
  render: () => (
    <div className="w-80 bg-[#0A0A0A] p-4">
      <SpaceToolsWidget
        data={mockToolsData}
        inline
        onToolClick={action('onToolClick')}
      />
    </div>
  ),
};

export const SpaceToolsWidgetCollapsed: Story = {
  render: () => (
    <div className="w-80 bg-[#0A0A0A] p-4">
      <SpaceToolsWidget
        data={mockToolsData}
        defaultCollapsed
        onToolClick={action('onToolClick')}
      />
    </div>
  ),
};

export const SpaceToolsWidgetManyTools: Story = {
  render: () => (
    <div className="w-80 bg-[#0A0A0A] p-4">
      <SpaceToolsWidget
        data={{
          ...mockToolsData,
          tools: [
            ...mockTools,
            { id: 'quiz-1', name: 'Trivia Quiz', icon: 'help-circle', type: 'quiz', isActive: true, responseCount: 24 },
            { id: 'roster-1', name: 'Member Roster', icon: 'users', type: 'roster', isActive: true },
          ],
        }}
        maxVisible={3}
        onToolClick={action('onToolClick')}
        onViewAll={action('onViewAll')}
      />
    </div>
  ),
  parameters: {
    docs: { description: { story: 'Widget with more tools than maxVisible shows "View all" link.' } },
  },
};

// ============================================================
// PINNED MESSAGES WIDGET STORIES
// ============================================================

const mockPinnedMessages: PinnedMessage[] = [
  {
    id: 'msg-1',
    boardId: 'general',
    content: 'Welcome to Design Club! Please read the community guidelines before posting.',
    authorId: 'user-1',
    authorName: 'Sarah Chen',
    authorAvatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=50&h=50&fit=crop',
    timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'msg-2',
    boardId: 'events',
    content: 'Reminder: Design Review sessions are every Thursday at 4pm in SU 301.',
    authorId: 'user-2',
    authorName: 'Marcus Johnson',
    authorAvatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop',
    timestamp: Date.now() - 5 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'msg-3',
    boardId: 'general',
    content: 'Important: Portfolio review submissions due by end of month. Upload your work to the shared drive.',
    authorId: 'user-1',
    authorName: 'Sarah Chen',
    authorAvatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=50&h=50&fit=crop',
    timestamp: Date.now() - 1 * 24 * 60 * 60 * 1000,
  },
];

export const PinnedMessagesWidgetDefault: Story = {
  render: () => (
    <div className="w-80 bg-[#0A0A0A] p-4">
      <PinnedMessagesWidget
        messages={mockPinnedMessages}
        onMessageClick={action('onMessageClick')}
      />
    </div>
  ),
  parameters: {
    docs: { description: { story: 'Pinned messages widget showing important announcements.' } },
  },
};

export const PinnedMessagesWidgetEmpty: Story = {
  render: () => (
    <div className="w-80 bg-[#0A0A0A] p-4">
      <PinnedMessagesWidget messages={[]} />
    </div>
  ),
};

export const PinnedMessagesWidgetLoading: Story = {
  render: () => (
    <div className="w-80 bg-[#0A0A0A] p-4">
      <PinnedMessagesWidget messages={[]} isLoading />
    </div>
  ),
};

export const PinnedMessagesWidgetCompact: Story = {
  render: () => (
    <div className="w-80 bg-[#0A0A0A] p-4">
      <PinnedMessagesWidget
        messages={mockPinnedMessages}
        compact
        onMessageClick={action('onMessageClick')}
      />
    </div>
  ),
};

export const PinnedMessagesWidgetCollapsible: Story = {
  render: () => (
    <div className="w-80 bg-[#0A0A0A] p-4">
      <PinnedMessagesWidget
        messages={mockPinnedMessages}
        collapsible
        defaultCollapsed
        onMessageClick={action('onMessageClick')}
      />
    </div>
  ),
};

export const PinnedMessagesWidgetSingle: Story = {
  render: () => (
    <div className="w-80 bg-[#0A0A0A] p-4">
      <PinnedMessagesWidget
        messages={[mockPinnedMessages[0]]}
        onMessageClick={action('onMessageClick')}
      />
    </div>
  ),
};

// ============================================================
// SPACE COMPOSER STORIES
// ============================================================

export const SpaceComposerDefault: Story = {
  render: () => (
    <div className="w-full max-w-2xl bg-[#0A0A0A] p-4">
      <SpaceComposer
        spaceName="Design Club"
        onSubmit={action('onSubmit')}
      />
    </div>
  ),
  parameters: {
    docs: { description: { story: 'Minimal in-space composer with reduced chrome.' } },
  },
};

export const SpaceComposerWithEvents: Story = {
  render: () => (
    <div className="w-full max-w-2xl bg-[#0A0A0A] p-4">
      <SpaceComposer
        spaceName="Design Club"
        canCreateEvents
        onSubmit={action('onSubmit')}
        onAddEvent={action('onAddEvent')}
      />
    </div>
  ),
};

export const SpaceComposerWithTools: Story = {
  render: () => (
    <div className="w-full max-w-2xl bg-[#0A0A0A] p-4">
      <SpaceComposer
        spaceName="Design Club"
        canUseTools
        onSubmit={action('onSubmit')}
        onAddTool={action('onAddTool')}
      />
    </div>
  ),
};

export const SpaceComposerFullFeatures: Story = {
  render: () => (
    <div className="w-full max-w-2xl bg-[#0A0A0A] p-4">
      <SpaceComposer
        spaceName="Design Club"
        canCreateEvents
        canUseTools
        onSubmit={action('onSubmit')}
        onAddImage={action('onAddImage')}
        onAddEvent={action('onAddEvent')}
        onAddTool={action('onAddTool')}
      />
    </div>
  ),
  parameters: {
    docs: { description: { story: 'Composer with all attachment options enabled.' } },
  },
};

export const SpaceComposerCustomPlaceholder: Story = {
  render: () => (
    <div className="w-full max-w-2xl bg-[#0A0A0A] p-4">
      <SpaceComposer
        spaceName="Study Group"
        placeholder="Share a study tip or ask a question..."
        onSubmit={action('onSubmit')}
      />
    </div>
  ),
};

// ============================================================
// CATEGORY FILTER BAR STORIES
// ============================================================

const mockCategories: CategoryOption[] = [
  { id: 'all', label: 'All', count: 156 },
  { id: 'academic', label: 'Academic', count: 45 },
  { id: 'social', label: 'Social', count: 38 },
  { id: 'professional', label: 'Professional', count: 24 },
  { id: 'recreational', label: 'Recreational', count: 31 },
  { id: 'cultural', label: 'Cultural', count: 18 },
];

export const CategoryFilterBarDefault: Story = {
  render: () => {
    const [active, setActive] = React.useState('all');
    return (
      <div className="w-full max-w-2xl bg-[#0A0A0A] p-4">
        <CategoryFilterBar
          categories={mockCategories}
          activeCategory={active}
          onCategoryChange={setActive}
        />
      </div>
    );
  },
  parameters: {
    docs: { description: { story: 'Horizontal category filter chips for browse page.' } },
  },
};

export const CategoryFilterBarWithCounts: Story = {
  render: () => {
    const [active, setActive] = React.useState('academic');
    return (
      <div className="w-full max-w-2xl bg-[#0A0A0A] p-4">
        <CategoryFilterBar
          categories={mockCategories}
          activeCategory={active}
          onCategoryChange={setActive}
          showCounts
        />
      </div>
    );
  },
};

export const CategoryFilterBarCompact: Story = {
  render: () => {
    const [active, setActive] = React.useState('all');
    return (
      <div className="w-[375px] bg-[#0A0A0A] p-4">
        <CategoryFilterBar
          categories={mockCategories.slice(0, 4)}
          activeCategory={active}
          onCategoryChange={setActive}
          compact
        />
      </div>
    );
  },
};

export const CategoryFilterBarManyCategories: Story = {
  render: () => {
    const [active, setActive] = React.useState('all');
    const manyCategories: CategoryOption[] = [
      ...mockCategories,
      { id: 'arts', label: 'Arts', count: 15 },
      { id: 'sports', label: 'Sports', count: 22 },
      { id: 'tech', label: 'Technology', count: 19 },
      { id: 'media', label: 'Media', count: 8 },
    ];
    return (
      <div className="w-full max-w-2xl bg-[#0A0A0A] p-4">
        <CategoryFilterBar
          categories={manyCategories}
          activeCategory={active}
          onCategoryChange={setActive}
          showCounts
        />
      </div>
    );
  },
  parameters: {
    docs: { description: { story: 'Many categories with horizontal scroll.' } },
  },
};

// ============================================================
// NOW CARD STORIES
// ============================================================

export const NowCardDefault: Story = {
  render: () => (
    <div className="w-80 bg-[#0A0A0A] p-4">
      <NowCard
        type="event"
        title="Design Review Session"
        subtitle="Happening now in SU 301"
        timeRemaining="45 min left"
        onClick={action('onClick')}
      />
    </div>
  ),
  parameters: {
    docs: { description: { story: 'Highlight card for live/happening now content.' } },
  },
};

export const NowCardLive: Story = {
  render: () => (
    <div className="w-80 bg-[#0A0A0A] p-4">
      <NowCard
        type="live"
        title="Weekly Standup"
        subtitle="12 members in call"
        isLive
        onClick={action('onClick')}
      />
    </div>
  ),
};

export const NowCardPoll: Story = {
  render: () => (
    <div className="w-80 bg-[#0A0A0A] p-4">
      <NowCard
        type="poll"
        title="Vote: Next Event Theme"
        subtitle="Closes in 2 hours"
        timeRemaining="2h 15m"
        participantCount={18}
        onClick={action('onClick')}
      />
    </div>
  ),
};

export const NowCardUrgent: Story = {
  render: () => (
    <div className="w-80 bg-[#0A0A0A] p-4">
      <NowCard
        type="deadline"
        title="Portfolio Submission"
        subtitle="Last chance to submit!"
        timeRemaining="15 min"
        urgent
        onClick={action('onClick')}
      />
    </div>
  ),
  parameters: {
    docs: { description: { story: 'Urgent styling for time-sensitive content.' } },
  },
};

// ============================================================
// THREAD DRAWER STORIES
// ============================================================

const mockParentMessage: ChatMessageData = {
  id: 'parent-1',
  boardId: 'general',
  content: 'Hey everyone! What do you think about moving our weekly meetings to Thursdays instead of Wednesdays?',
  authorId: 'user-1',
  authorName: 'Sarah Chen',
  authorAvatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=50&h=50&fit=crop',
  timestamp: Date.now() - 2 * 60 * 60 * 1000,
  reactions: { '👍': ['user-2', 'user-3'], '🤔': ['user-4'] },
  replyCount: 5,
};

const mockThreadReplies: ChatMessageData[] = [
  {
    id: 'reply-1',
    boardId: 'general',
    content: 'Thursday works better for me! I have a class conflict on Wednesday afternoons.',
    authorId: 'user-2',
    authorName: 'Marcus Johnson',
    authorAvatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop',
    timestamp: Date.now() - 1.5 * 60 * 60 * 1000,
  },
  {
    id: 'reply-2',
    boardId: 'general',
    content: 'Either day works for me 👍',
    authorId: 'user-3',
    authorName: 'Emily Rodriguez',
    timestamp: Date.now() - 1 * 60 * 60 * 1000,
  },
  {
    id: 'reply-3',
    boardId: 'general',
    content: 'I prefer Wednesday but can make Thursday work if that works better for the majority.',
    authorId: 'user-4',
    authorName: 'Alex Kim',
    authorAvatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=50&h=50&fit=crop',
    timestamp: Date.now() - 30 * 60 * 1000,
  },
];

export const ThreadDrawerDefault: Story = {
  render: () => {
    const [open, setOpen] = React.useState(true);
    return (
      <div className="min-h-[600px] bg-[#0A0A0A]">
        <button onClick={() => setOpen(true)} className="m-4 px-4 py-2 bg-white/10 rounded-lg text-white">
          Open Thread
        </button>
        <ThreadDrawer
          open={open}
          onOpenChange={setOpen}
          parentMessage={mockParentMessage}
          replies={mockThreadReplies}
          currentUserId="user-5"
          onSendReply={async (content) => action('onSendReply')(content)}
        />
      </div>
    );
  },
  parameters: {
    layout: 'fullscreen',
    docs: { description: { story: 'Thread drawer showing parent message and replies.' } },
  },
};

export const ThreadDrawerLoading: Story = {
  render: () => {
    const [open, setOpen] = React.useState(true);
    return (
      <div className="min-h-[600px] bg-[#0A0A0A]">
        <ThreadDrawer
          open={open}
          onOpenChange={setOpen}
          parentMessage={mockParentMessage}
          replies={[]}
          currentUserId="user-5"
          isLoading
        />
      </div>
    );
  },
  parameters: { layout: 'fullscreen' },
};

export const ThreadDrawerEmpty: Story = {
  render: () => {
    const [open, setOpen] = React.useState(true);
    return (
      <div className="min-h-[600px] bg-[#0A0A0A]">
        <ThreadDrawer
          open={open}
          onOpenChange={setOpen}
          parentMessage={mockParentMessage}
          replies={[]}
          currentUserId="user-5"
          onSendReply={async (content) => action('onSendReply')(content)}
        />
      </div>
    );
  },
  parameters: { layout: 'fullscreen' },
};

export const ThreadDrawerWithLoadMore: Story = {
  render: () => {
    const [open, setOpen] = React.useState(true);
    return (
      <div className="min-h-[600px] bg-[#0A0A0A]">
        <ThreadDrawer
          open={open}
          onOpenChange={setOpen}
          parentMessage={mockParentMessage}
          replies={mockThreadReplies}
          currentUserId="user-5"
          hasMoreReplies
          onLoadMore={action('onLoadMore')}
          onSendReply={async (content) => action('onSendReply')(content)}
        />
      </div>
    );
  },
  parameters: { layout: 'fullscreen' },
};
