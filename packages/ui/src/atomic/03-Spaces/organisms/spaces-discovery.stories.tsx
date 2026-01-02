'use client';

import * as React from 'react';
import { action } from '@storybook/addon-actions';

import { SpacesDiscoveryGrid } from './spaces-discovery-grid';
import { type SpaceDiscoveryCardData } from '../molecules/space-discovery-card';
import { SpacesHeroSection } from './spaces-hero-section';
import { type SpaceHeroCardData } from '../molecules/space-hero-card';
import { SpaceEntryAnimation } from './space-entry-animation';
import { WidgetGallery, type WidgetTemplate } from './widget-gallery';
import { SpaceDetailHeader } from './space-detail-header';
import { SpaceBoardSkeleton } from './space-board-skeleton';
import { Button } from '../../00-Global/atoms/button';

import type { Meta, StoryObj } from '@storybook/react';

// ============================================================
// Mock Data Generators
// ============================================================

const generateDiscoverySpaces = (count: number): SpaceDiscoveryCardData[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `space-${i + 1}`,
    name: [
      'Design Club',
      'CS Study Group',
      'Photography Society',
      'Chess Club',
      'Debate Team',
      'Music Ensemble',
      'Film Critics',
      'Robotics Club',
      'Esports League',
      'Art Collective',
    ][i % 10],
    category: ['Creative', 'Academic', 'Social', 'Sports', 'Cultural'][i % 5],
    memberCount: Math.floor(Math.random() * 200) + 10,
    iconUrl: i % 3 === 0 ? `https://picsum.photos/seed/${i}/100/100` : undefined,
    description: 'A community for like-minded students to connect and collaborate.',
    isJoined: i % 4 === 0,
    onlineCount: Math.floor(Math.random() * 20),
  }));

const generateHeroSpaces = (count: number): SpaceHeroCardData[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `hero-${i + 1}`,
    name: ['Design Club', 'CS Study Group', 'Photography Society'][i % 3],
    category: ['Creative', 'Academic', 'Social'][i % 3],
    memberCount: Math.floor(Math.random() * 500) + 50,
    iconUrl: `https://picsum.photos/seed/hero${i}/200/200`,
    bannerUrl: `https://picsum.photos/seed/banner${i}/800/400`,
    description: 'Featured community for students passionate about learning and growing together.',
    isJoined: i === 0,
    activeNow: Math.floor(Math.random() * 30) + 5,
    recentActivity: 'Active now',
  }));

const mockPinnedPosts: PinnedPost[] = [
  { id: 'post-1', title: 'Welcome to our space!', author: 'Sarah Chen', timeAgo: '2 days ago' },
  { id: 'post-2', title: 'Meeting schedule for this week', author: 'Alex Kim', timeAgo: '5 hours ago' },
];

const mockFeedItems = Array.from({ length: 5 }, (_, i) => ({
  id: `feed-${i + 1}`,
  type: 'post' as const,
  content: `This is a sample feed item ${i + 1}`,
}));

// ============================================================
// Meta Configuration
// ============================================================

const meta = {
  title: '03-Spaces/Organisms/SpacesDiscovery',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Discovery and layout components for the Spaces feature: grids, hero sections, entry animations, and widget galleries.',
      },
    },
    backgrounds: {
      default: 'dark',
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="min-h-screen bg-[#0A0A0A] p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================
// SPACES DISCOVERY GRID STORIES
// ============================================================

export const DiscoveryGridDefault: Story = {
  render: () => (
    <SpacesDiscoveryGrid
      spaces={generateDiscoverySpaces(6)}
      onJoin={action('onJoin')}
      onSpaceClick={action('onSpaceClick')}
    />
  ),
  parameters: {
    docs: {
      description: { story: 'Default discovery grid with 6 spaces in a responsive layout.' },
    },
  },
};

export const DiscoveryGridLoading: Story = {
  render: () => (
    <SpacesDiscoveryGrid
      spaces={[]}
      isLoading={true}
      skeletonCount={6}
      onJoin={action('onJoin')}
    />
  ),
  parameters: {
    docs: {
      description: { story: 'Loading state with skeleton cards.' },
    },
  },
};

export const DiscoveryGridEmpty: Story = {
  render: () => (
    <SpacesDiscoveryGrid
      spaces={[]}
      onJoin={action('onJoin')}
    />
  ),
  parameters: {
    docs: {
      description: { story: 'Empty state when no spaces match the filter.' },
    },
  },
};

export const DiscoveryGridSingleColumn: Story = {
  render: () => (
    <div className="max-w-md">
      <SpacesDiscoveryGrid
        spaces={generateDiscoverySpaces(4)}
        columns={1}
        onJoin={action('onJoin')}
        onSpaceClick={action('onSpaceClick')}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: { story: 'Single column layout for mobile or narrow containers.' },
    },
  },
};

export const DiscoveryGridThreeColumns: Story = {
  render: () => (
    <SpacesDiscoveryGrid
      spaces={generateDiscoverySpaces(9)}
      columns={3}
      onJoin={action('onJoin')}
      onSpaceClick={action('onSpaceClick')}
    />
  ),
  parameters: {
    docs: {
      description: { story: 'Three-column layout for larger screens.' },
    },
  },
};

export const DiscoveryGridWithJoining: Story = {
  render: () => {
    const [joiningIds, setJoiningIds] = React.useState<Set<string>>(new Set());

    const handleJoin = (spaceId: string) => {
      setJoiningIds(new Set([...joiningIds, spaceId]));
      setTimeout(() => {
        setJoiningIds((prev) => {
          const next = new Set(prev);
          next.delete(spaceId);
          return next;
        });
      }, 2000);
    };

    return (
      <SpacesDiscoveryGrid
        spaces={generateDiscoverySpaces(6)}
        onJoin={handleJoin}
        onSpaceClick={action('onSpaceClick')}
        joiningIds={joiningIds}
      />
    );
  },
  parameters: {
    docs: {
      description: { story: 'Interactive demo showing loading state when joining a space.' },
    },
  },
};

export const DiscoveryGridManySpaces: Story = {
  render: () => (
    <SpacesDiscoveryGrid
      spaces={generateDiscoverySpaces(20)}
      columns={2}
      onJoin={action('onJoin')}
      onSpaceClick={action('onSpaceClick')}
    />
  ),
  parameters: {
    docs: {
      description: { story: 'Grid with many spaces for scrolling behavior testing.' },
    },
  },
};

// ============================================================
// SPACES HERO SECTION STORIES
// ============================================================

export const HeroSectionDefault: Story = {
  render: () => (
    <SpacesHeroSection
      spaces={generateHeroSpaces(3)}
      onJoin={action('onJoin')}
      onSpaceClick={action('onSpaceClick')}
    />
  ),
  parameters: {
    docs: {
      description: { story: 'Default bento grid hero section with 3 featured spaces.' },
    },
  },
};

export const HeroSectionTwoSpaces: Story = {
  render: () => (
    <SpacesHeroSection
      spaces={generateHeroSpaces(2)}
      onJoin={action('onJoin')}
      onSpaceClick={action('onSpaceClick')}
    />
  ),
  parameters: {
    docs: {
      description: { story: 'Hero section with only 2 spaces (shows placeholder).' },
    },
  },
};

export const HeroSectionSingleSpace: Story = {
  render: () => (
    <SpacesHeroSection
      spaces={generateHeroSpaces(1)}
      onJoin={action('onJoin')}
      onSpaceClick={action('onSpaceClick')}
    />
  ),
  parameters: {
    docs: {
      description: { story: 'Hero section with only 1 featured space.' },
    },
  },
};

export const HeroSectionEmpty: Story = {
  render: () => (
    <SpacesHeroSection
      spaces={[]}
      onJoin={action('onJoin')}
    />
  ),
  parameters: {
    docs: {
      description: { story: 'Hero section with no featured spaces (returns null).' },
    },
  },
};

// ============================================================
// SPACE ENTRY ANIMATION STORIES
// ============================================================

export const EntryAnimationDefault: Story = {
  render: () => {
    const [isActive, setIsActive] = React.useState(true);

    return (
      <div className="h-[600px] relative">
        <Button
          onClick={() => setIsActive(true)}
          className="absolute top-4 left-4 z-10"
          variant="outline"
        >
          Replay Animation
        </Button>
        <SpaceEntryAnimation
          spaceName="Design Club"
          spaceCategory="Creative"
          onlineCount={12}
          isActive={isActive}
          onComplete={() => setIsActive(false)}
        >
          <div className="flex items-center justify-center h-full text-white/60">
            Space content loads here after animation
          </div>
        </SpaceEntryAnimation>
      </div>
    );
  },
  parameters: {
    docs: {
      description: { story: 'Full entry animation with space name, category, and online count.' },
    },
  },
};

export const EntryAnimationMinimal: Story = {
  render: () => {
    const [isActive, setIsActive] = React.useState(true);

    return (
      <div className="h-[600px] relative">
        <Button
          onClick={() => setIsActive(true)}
          className="absolute top-4 left-4 z-10"
          variant="outline"
        >
          Replay
        </Button>
        <SpaceEntryAnimation
          spaceName="Chess Club"
          isActive={isActive}
          onComplete={() => setIsActive(false)}
        >
          <div className="flex items-center justify-center h-full text-white/60">
            Content
          </div>
        </SpaceEntryAnimation>
      </div>
    );
  },
  parameters: {
    docs: {
      description: { story: 'Minimal entry animation with just the space name.' },
    },
  },
};

export const EntryAnimationSkipped: Story = {
  render: () => (
    <div className="h-[400px]">
      <SpaceEntryAnimation
        spaceName="Design Club"
        isActive={true}
        skipAnimation={true}
      >
        <div className="flex items-center justify-center h-full text-white">
          Content shows immediately when animation is skipped
        </div>
      </SpaceEntryAnimation>
    </div>
  ),
  parameters: {
    docs: {
      description: { story: 'Animation skipped (for reduced motion preference).' },
    },
  },
};

export const EntryAnimationLongName: Story = {
  render: () => {
    const [isActive, setIsActive] = React.useState(true);

    return (
      <div className="h-[600px] relative">
        <Button
          onClick={() => setIsActive(true)}
          className="absolute top-4 left-4 z-10"
          variant="outline"
        >
          Replay
        </Button>
        <SpaceEntryAnimation
          spaceName="University at Buffalo Computer Science Graduate Student Association"
          spaceCategory="Academic"
          onlineCount={47}
          isActive={isActive}
          onComplete={() => setIsActive(false)}
        >
          <div className="flex items-center justify-center h-full text-white/60">
            Content
          </div>
        </SpaceEntryAnimation>
      </div>
    );
  },
  parameters: {
    docs: {
      description: { story: 'Animation with a very long space name.' },
    },
  },
};

export const EntryAnimationManyOnline: Story = {
  render: () => {
    const [isActive, setIsActive] = React.useState(true);

    return (
      <div className="h-[600px] relative">
        <Button
          onClick={() => setIsActive(true)}
          className="absolute top-4 left-4 z-10"
          variant="outline"
        >
          Replay
        </Button>
        <SpaceEntryAnimation
          spaceName="Main Campus Hub"
          spaceCategory="Community"
          onlineCount={247}
          isActive={isActive}
          onComplete={() => setIsActive(false)}
        >
          <div className="flex items-center justify-center h-full text-white/60">
            Content
          </div>
        </SpaceEntryAnimation>
      </div>
    );
  },
  parameters: {
    docs: {
      description: { story: 'Animation with high online count.' },
    },
  },
};

// ============================================================
// WIDGET GALLERY STORIES
// ============================================================

export const WidgetGalleryDefault: Story = {
  render: () => {
    const [open, setOpen] = React.useState(true);

    return (
      <div className="min-h-[600px]">
        <Button onClick={() => setOpen(true)}>Open Widget Gallery</Button>
        <WidgetGallery
          open={open}
          onOpenChange={setOpen}
          onSelectWidget={action('onSelectWidget')}
          onCreateInHiveLab={action('onCreateInHiveLab')}
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: { story: 'Default widget gallery with all categories.' },
    },
  },
};

export const WidgetGalleryWithDeployed: Story = {
  render: () => {
    const [open, setOpen] = React.useState(true);

    return (
      <div className="min-h-[600px]">
        <Button onClick={() => setOpen(true)}>Open Gallery</Button>
        <WidgetGallery
          open={open}
          onOpenChange={setOpen}
          onSelectWidget={action('onSelectWidget')}
          deployedWidgetIds={['system:about', 'system:events', 'system:poll']}
          onCreateInHiveLab={action('onCreateInHiveLab')}
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: { story: 'Gallery showing some widgets as already deployed.' },
    },
  },
};

export const WidgetGalleryWithCustomTools: Story = {
  render: () => {
    const [open, setOpen] = React.useState(true);

    return (
      <div className="min-h-[600px]">
        <Button onClick={() => setOpen(true)}>Open Gallery</Button>
        <WidgetGallery
          open={open}
          onOpenChange={setOpen}
          onSelectWidget={action('onSelectWidget')}
          customTools={[
            { id: 'custom-1', name: 'Study Scheduler', description: 'Track study sessions', elementType: 'scheduler' },
            { id: 'custom-2', name: 'Resource Library', description: 'Share course materials', elementType: 'resources' },
            { id: 'custom-3', name: 'Group Projects', description: 'Manage team projects', elementType: 'kanban' },
          ]}
          onCreateInHiveLab={action('onCreateInHiveLab')}
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: { story: 'Gallery with custom HiveLab tools from the leader.' },
    },
  },
};

export const WidgetGalleryNoHiveLab: Story = {
  render: () => {
    const [open, setOpen] = React.useState(true);

    return (
      <div className="min-h-[600px]">
        <Button onClick={() => setOpen(true)}>Open Gallery</Button>
        <WidgetGallery
          open={open}
          onOpenChange={setOpen}
          onSelectWidget={action('onSelectWidget')}
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: { story: 'Gallery without HiveLab CTA (no onCreateInHiveLab callback).' },
    },
  },
};

export const WidgetGalleryInteractive: Story = {
  render: () => {
    const [open, setOpen] = React.useState(true);
    const [deployed, setDeployed] = React.useState<string[]>([]);

    const handleSelect = (template: WidgetTemplate) => {
      if (!deployed.includes(template.id)) {
        setDeployed([...deployed, template.id]);
      }
      action('onSelectWidget')(template);
    };

    return (
      <div className="min-h-[600px]">
        <div className="mb-4">
          <Button onClick={() => setOpen(true)}>Open Gallery</Button>
          <p className="text-white/60 text-sm mt-2">
            Deployed: {deployed.length > 0 ? deployed.join(', ') : 'None'}
          </p>
        </div>
        <WidgetGallery
          open={open}
          onOpenChange={setOpen}
          onSelectWidget={handleSelect}
          deployedWidgetIds={deployed}
          onCreateInHiveLab={action('onCreateInHiveLab')}
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: { story: 'Interactive demo: select widgets to see them marked as deployed.' },
    },
  },
};

// ============================================================
// SPACE BOARD SKELETON STORIES
// ============================================================

export const BoardSkeletonDefault: Story = {
  render: () => (
    <div className="max-w-3xl mx-auto">
      <SpaceBoardSkeleton />
    </div>
  ),
  parameters: {
    docs: {
      description: { story: 'Default loading skeleton for space board.' },
    },
  },
};

// ============================================================
// SPACE DETAIL HEADER STORIES
// ============================================================

export const DetailHeaderDefault: Story = {
  render: () => (
    <SpaceDetailHeader
      space={{
        id: 'space-1',
        name: 'Design Club',
        category: 'Creative',
        memberCount: 156,
        description: 'A community for designers to share work and grow together.',
        iconUrl: 'https://picsum.photos/seed/design/100/100',
        bannerUrl: 'https://picsum.photos/seed/designbanner/1200/300',
      }}
      isMember={false}
      isLeader={false}
      onJoin={action('onJoin')}
      onLeave={action('onLeave')}
      onShare={action('onShare')}
      onSettings={action('onSettings')}
    />
  ),
  parameters: {
    docs: {
      description: { story: 'Default space header for non-members.' },
    },
  },
};

export const DetailHeaderMember: Story = {
  render: () => (
    <SpaceDetailHeader
      space={{
        id: 'space-1',
        name: 'Design Club',
        category: 'Creative',
        memberCount: 156,
        description: 'A community for designers.',
        iconUrl: 'https://picsum.photos/seed/design2/100/100',
      }}
      isMember={true}
      isLeader={false}
      onJoin={action('onJoin')}
      onLeave={action('onLeave')}
      onShare={action('onShare')}
    />
  ),
  parameters: {
    docs: {
      description: { story: 'Header for a space member (shows Leave button).' },
    },
  },
};

export const DetailHeaderLeader: Story = {
  render: () => (
    <SpaceDetailHeader
      space={{
        id: 'space-1',
        name: 'Design Club',
        category: 'Creative',
        memberCount: 156,
        description: 'A community for designers.',
      }}
      isMember={true}
      isLeader={true}
      onJoin={action('onJoin')}
      onLeave={action('onLeave')}
      onShare={action('onShare')}
      onSettings={action('onSettings')}
      onInvite={action('onInvite')}
    />
  ),
  parameters: {
    docs: {
      description: { story: 'Header for space leader (shows Settings and Invite).' },
    },
  },
};

export const DetailHeaderNoBanner: Story = {
  render: () => (
    <SpaceDetailHeader
      space={{
        id: 'space-1',
        name: 'Study Group',
        category: 'Academic',
        memberCount: 24,
      }}
      isMember={false}
      onJoin={action('onJoin')}
    />
  ),
  parameters: {
    docs: {
      description: { story: 'Header without banner image.' },
    },
  },
};

export const DetailHeaderLongName: Story = {
  render: () => (
    <SpaceDetailHeader
      space={{
        id: 'space-1',
        name: 'University at Buffalo Computer Science and Engineering Graduate Student Association',
        category: 'Academic',
        memberCount: 89,
        description: 'The official organization for CS graduate students at UB. We organize research talks, networking events, and professional development workshops.',
      }}
      isMember={true}
      isLeader={true}
      onJoin={action('onJoin')}
      onShare={action('onShare')}
      onSettings={action('onSettings')}
    />
  ),
  parameters: {
    docs: {
      description: { story: 'Header with very long space name.' },
    },
  },
};

// ============================================================
// COMBINED DISCOVERY PAGE STORIES
// ============================================================

export const FullDiscoveryPage: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">Featured Spaces</h2>
        <SpacesHeroSection
          spaces={generateHeroSpaces(3)}
          onJoin={action('onJoin')}
          onSpaceClick={action('onSpaceClick')}
        />
      </div>

      <div>
        <h2 className="text-xl font-semibold text-white mb-4">All Spaces</h2>
        <SpacesDiscoveryGrid
          spaces={generateDiscoverySpaces(8)}
          onJoin={action('onJoin')}
          onSpaceClick={action('onSpaceClick')}
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: { story: 'Complete discovery page with hero section and grid.' },
    },
  },
};

export const DiscoveryPageLoading: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">Featured Spaces</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 md:row-span-2 h-[320px] bg-neutral-900/50 rounded-2xl animate-pulse" />
          <div className="h-[152px] bg-neutral-900/50 rounded-2xl animate-pulse" />
          <div className="h-[152px] bg-neutral-900/50 rounded-2xl animate-pulse" />
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-white mb-4">All Spaces</h2>
        <SpacesDiscoveryGrid
          spaces={[]}
          isLoading={true}
          skeletonCount={6}
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: { story: 'Discovery page in loading state.' },
    },
  },
};

// ============================================================
// RESPONSIVE COMPARISON STORIES
// ============================================================

export const ResponsiveGrid: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-white text-sm font-medium mb-2">Mobile (1 column)</h3>
        <div className="max-w-[360px] border border-white/10 rounded-lg p-4">
          <SpacesDiscoveryGrid
            spaces={generateDiscoverySpaces(3)}
            columns={1}
            onJoin={action('onJoin')}
          />
        </div>
      </div>

      <div>
        <h3 className="text-white text-sm font-medium mb-2">Tablet (2 columns)</h3>
        <div className="max-w-[600px] border border-white/10 rounded-lg p-4">
          <SpacesDiscoveryGrid
            spaces={generateDiscoverySpaces(4)}
            columns={2}
            onJoin={action('onJoin')}
          />
        </div>
      </div>

      <div>
        <h3 className="text-white text-sm font-medium mb-2">Desktop (3 columns)</h3>
        <div className="border border-white/10 rounded-lg p-4">
          <SpacesDiscoveryGrid
            spaces={generateDiscoverySpaces(6)}
            columns={3}
            onJoin={action('onJoin')}
          />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: { story: 'Comparison of grid layouts at different breakpoints.' },
    },
  },
};

// ============================================================
// INTERACTION SEQUENCE STORIES
// ============================================================

export const SpaceJourneyDemo: Story = {
  render: () => {
    const [phase, setPhase] = React.useState<'browse' | 'enter' | 'space'>('browse');
    const [selectedSpace, setSelectedSpace] = React.useState<string | null>(null);

    const handleSpaceClick = (spaceId: string) => {
      setSelectedSpace(spaceId);
      setPhase('enter');
    };

    return (
      <div className="min-h-[700px]">
        {phase === 'browse' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Discover Spaces</h2>
            <p className="text-white/60">Click a space to see the entry animation</p>
            <SpacesDiscoveryGrid
              spaces={generateDiscoverySpaces(6)}
              onSpaceClick={handleSpaceClick}
              onJoin={action('onJoin')}
            />
          </div>
        )}

        {phase === 'enter' && (
          <SpaceEntryAnimation
            spaceName="Design Club"
            spaceCategory="Creative"
            onlineCount={12}
            isActive={true}
            onComplete={() => setPhase('space')}
          >
            <div />
          </SpaceEntryAnimation>
        )}

        {phase === 'space' && (
          <div className="space-y-4">
            <Button onClick={() => setPhase('browse')} variant="outline">
              Back to Discovery
            </Button>
            <div className="bg-neutral-900/50 rounded-xl p-8 text-center">
              <h2 className="text-2xl font-bold text-white mb-2">Design Club</h2>
              <p className="text-white/60">You've arrived! This is where the space content would be.</p>
            </div>
          </div>
        )}
      </div>
    );
  },
  parameters: {
    docs: {
      description: { story: 'Interactive demo: browse spaces, click one, see entry animation, arrive at space.' },
    },
  },
};
