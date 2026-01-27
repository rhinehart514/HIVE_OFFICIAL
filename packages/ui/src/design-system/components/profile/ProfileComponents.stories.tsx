import type { Meta, StoryObj } from '@storybook/react';
import {
  ProfileIdentityHero,
  ProfileIdentityHeroSkeleton,
  ProfileActivityCard,
  ProfileActivityCardSkeleton,
  ProfileLeadershipCard,
  ProfileLeadershipCardSkeleton,
  ProfileEventCard,
  ProfileSpacePill,
  ProfileSpacePillSkeleton,
  ProfileConnectionFooter,
  ProfileOverflowChip,
} from './index';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PROFILE COMPONENTS - 3-Zone Profile Layout
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Zone 1: IDENTITY (Hero) — Who they are
 * Zone 2: ACTIVITY (What they do) — Building, Leading, Organizing
 * Zone 3: CAMPUS PRESENCE — Where they show up, relationship context
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ============================================================================
// ProfileIdentityHero Stories
// ============================================================================

const heroMeta: Meta<typeof ProfileIdentityHero> = {
  title: 'Design System/Profile/ProfileIdentityHero',
  component: ProfileIdentityHero,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    backgrounds: { default: 'dark' },
  },
};

export default heroMeta;
type HeroStory = StoryObj<typeof ProfileIdentityHero>;

const mockUser = {
  id: 'user-123',
  fullName: 'Sarah Chen',
  handle: 'sarahchen',
  avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
  bio: 'Building the future of student communities. CS major passionate about AI and design systems.',
  classYear: '2025',
  major: 'Computer Science',
  campusName: 'Stanford University',
};

export const OwnProfile: HeroStory = {
  args: {
    user: mockUser,
    isOwnProfile: true,
    isOnline: true,
    onEdit: () => console.log('Edit clicked'),
  },
};

export const OtherProfile: HeroStory = {
  args: {
    user: mockUser,
    isOwnProfile: false,
    isOnline: true,
    onConnect: () => console.log('Connect clicked'),
    onMessage: () => console.log('Message clicked'),
  },
};

export const Online: HeroStory = {
  args: {
    user: mockUser,
    isOwnProfile: false,
    isOnline: true,
    onConnect: () => console.log('Connect clicked'),
    onMessage: () => console.log('Message clicked'),
  },
};

export const Offline: HeroStory = {
  args: {
    user: mockUser,
    isOwnProfile: false,
    isOnline: false,
    onConnect: () => console.log('Connect clicked'),
    onMessage: () => console.log('Message clicked'),
  },
};

export const NoBio: HeroStory = {
  args: {
    user: { ...mockUser, bio: undefined },
    isOwnProfile: true,
    profileIncomplete: true,
    onEdit: () => console.log('Edit clicked'),
  },
};

export const NoAvatar: HeroStory = {
  args: {
    user: { ...mockUser, avatarUrl: undefined },
    isOwnProfile: false,
    onConnect: () => console.log('Connect clicked'),
    onMessage: () => console.log('Message clicked'),
  },
};

export const HeroSkeleton: HeroStory = {
  render: () => <ProfileIdentityHeroSkeleton />,
};

// ============================================================================
// ProfileActivityCard Stories
// ============================================================================

export const ActivityCardDefault: StoryObj<typeof ProfileActivityCard> = {
  render: () => (
    <div className="max-w-[280px]">
      <ProfileActivityCard
        tool={{
          id: 'tool-1',
          name: 'Event RSVP Tool',
          emoji: '🎫',
          runs: 45,
          spaceName: 'Tech Club',
        }}
        onClick={() => console.log('Tool clicked')}
      />
    </div>
  ),
};

export const ActivityCardHighPerformer: StoryObj<typeof ProfileActivityCard> = {
  render: () => (
    <div className="max-w-[280px]">
      <ProfileActivityCard
        tool={{
          id: 'tool-2',
          name: 'Attendance Tracker',
          emoji: '📊',
          runs: 523,
          spaceName: 'Student Government',
        }}
        onClick={() => console.log('Tool clicked')}
      />
    </div>
  ),
};

export const ActivityCardLongName: StoryObj<typeof ProfileActivityCard> = {
  render: () => (
    <div className="max-w-[280px]">
      <ProfileActivityCard
        tool={{
          id: 'tool-3',
          name: 'Super Long Tool Name That Should Truncate',
          emoji: '🚀',
          runs: 89,
        }}
        onClick={() => console.log('Tool clicked')}
      />
    </div>
  ),
};

export const ActivityCardSkeleton: StoryObj<typeof ProfileActivityCard> = {
  render: () => (
    <div className="max-w-[280px]">
      <ProfileActivityCardSkeleton />
    </div>
  ),
};

// ============================================================================
// ProfileLeadershipCard Stories
// ============================================================================

export const LeadershipCardOwner: StoryObj<typeof ProfileLeadershipCard> = {
  render: () => (
    <div className="max-w-[280px]">
      <ProfileLeadershipCard
        space={{
          id: 'space-1',
          name: 'Tech Club',
          memberCount: 156,
          tenure: '2 years',
          role: 'owner',
        }}
        onClick={() => console.log('Space clicked')}
      />
    </div>
  ),
};

export const LeadershipCardAdmin: StoryObj<typeof ProfileLeadershipCard> = {
  render: () => (
    <div className="max-w-[280px]">
      <ProfileLeadershipCard
        space={{
          id: 'space-2',
          name: 'CS Student Association',
          memberCount: 342,
          tenure: '6 months',
          role: 'admin',
        }}
        onClick={() => console.log('Space clicked')}
      />
    </div>
  ),
};

export const LeadershipCardLongName: StoryObj<typeof ProfileLeadershipCard> = {
  render: () => (
    <div className="max-w-[280px]">
      <ProfileLeadershipCard
        space={{
          id: 'space-3',
          name: 'Association of Computing Machinery Stanford Chapter',
          memberCount: 89,
          role: 'admin',
        }}
        onClick={() => console.log('Space clicked')}
      />
    </div>
  ),
};

export const LeadershipCardSkeleton: StoryObj<typeof ProfileLeadershipCard> = {
  render: () => (
    <div className="max-w-[280px]">
      <ProfileLeadershipCardSkeleton />
    </div>
  ),
};

// ============================================================================
// ProfileEventCard Stories
// ============================================================================

export const EventCardDefault: StoryObj<typeof ProfileEventCard> = {
  render: () => (
    <div className="max-w-[300px]">
      <ProfileEventCard
        event={{
          id: 'event-1',
          name: 'Weekly Standup',
          emoji: '📢',
          date: 'Mar 15',
          rsvpCount: 28,
          spaceName: 'Tech Club',
        }}
        onClick={() => console.log('Event clicked')}
      />
    </div>
  ),
};

export const EventCardNoSpace: StoryObj<typeof ProfileEventCard> = {
  render: () => (
    <div className="max-w-[300px]">
      <ProfileEventCard
        event={{
          id: 'event-2',
          name: 'Hackathon Kickoff',
          emoji: '🚀',
          date: 'Apr 1',
          rsvpCount: 156,
        }}
        onClick={() => console.log('Event clicked')}
      />
    </div>
  ),
};

// ============================================================================
// ProfileSpacePill Stories
// ============================================================================

export const SpacePillMember: StoryObj<typeof ProfileSpacePill> = {
  render: () => (
    <ProfileSpacePill
      space={{
        id: 'space-1',
        name: 'Tech Club',
        emoji: '💻',
        isLeader: false,
      }}
      onClick={() => console.log('Space clicked')}
    />
  ),
};

export const SpacePillLeader: StoryObj<typeof ProfileSpacePill> = {
  render: () => (
    <ProfileSpacePill
      space={{
        id: 'space-2',
        name: 'Design Guild',
        emoji: '🎨',
        isLeader: true,
      }}
      onClick={() => console.log('Space clicked')}
    />
  ),
};

export const SpacePillLongName: StoryObj<typeof ProfileSpacePill> = {
  render: () => (
    <ProfileSpacePill
      space={{
        id: 'space-3',
        name: 'Computer Science Student Association',
        emoji: '🖥️',
        isLeader: false,
      }}
      onClick={() => console.log('Space clicked')}
    />
  ),
};

export const SpacePillNoEmoji: StoryObj<typeof ProfileSpacePill> = {
  render: () => (
    <ProfileSpacePill
      space={{
        id: 'space-4',
        name: 'Photography',
        isLeader: false,
      }}
      onClick={() => console.log('Space clicked')}
    />
  ),
};

export const SpacePillSkeleton: StoryObj<typeof ProfileSpacePill> = {
  render: () => <ProfileSpacePillSkeleton />,
};

export const SpacePillRow: StoryObj<typeof ProfileSpacePill> = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <ProfileSpacePill
        space={{ id: '1', name: 'Tech Club', emoji: '💻', isLeader: true }}
      />
      <ProfileSpacePill
        space={{ id: '2', name: 'Design Guild', emoji: '🎨', isLeader: false }}
      />
      <ProfileSpacePill
        space={{ id: '3', name: 'Hiking', emoji: '🥾', isLeader: false }}
      />
      <ProfileSpacePill
        space={{ id: '4', name: 'Chess Club', emoji: '♟️', isLeader: false }}
      />
    </div>
  ),
};

// ============================================================================
// ProfileConnectionFooter Stories
// ============================================================================

export const ConnectionFooterWithOverlap: StoryObj<typeof ProfileConnectionFooter> = {
  render: () => (
    <div className="max-w-md">
      <ProfileConnectionFooter
        userName="Sarah Chen"
        sharedSpacesCount={3}
        mutualConnectionsCount={12}
      />
    </div>
  ),
};

export const ConnectionFooterNoOverlap: StoryObj<typeof ProfileConnectionFooter> = {
  render: () => (
    <div className="max-w-md">
      <ProfileConnectionFooter
        userName="John Doe"
        sharedSpacesCount={0}
        mutualConnectionsCount={0}
      />
    </div>
  ),
};

export const ConnectionFooterOnlySpaces: StoryObj<typeof ProfileConnectionFooter> = {
  render: () => (
    <div className="max-w-md">
      <ProfileConnectionFooter
        userName="Alex Kim"
        sharedSpacesCount={2}
        mutualConnectionsCount={0}
      />
    </div>
  ),
};

export const ConnectionFooterOnlyMutuals: StoryObj<typeof ProfileConnectionFooter> = {
  render: () => (
    <div className="max-w-md">
      <ProfileConnectionFooter
        userName="Jordan Lee"
        sharedSpacesCount={0}
        mutualConnectionsCount={5}
      />
    </div>
  ),
};

// ============================================================================
// ProfileOverflowChip Stories
// ============================================================================

export const OverflowChipTools: StoryObj<typeof ProfileOverflowChip> = {
  render: () => (
    <ProfileOverflowChip
      count={5}
      label="tools"
      onClick={() => console.log('Show all tools')}
    />
  ),
};

export const OverflowChipSpaces: StoryObj<typeof ProfileOverflowChip> = {
  render: () => (
    <ProfileOverflowChip
      count={12}
      onClick={() => console.log('Show all spaces')}
    />
  ),
};

export const OverflowChipLarge: StoryObj<typeof ProfileOverflowChip> = {
  render: () => (
    <ProfileOverflowChip
      count={99}
      label="more"
      onClick={() => console.log('Show all')}
      className="h-full min-h-[100px] flex items-center justify-center"
    />
  ),
};

// ============================================================================
// Complete Profile Layout Story
// ============================================================================

export const CompleteProfileLayout: StoryObj<typeof ProfileIdentityHero> = {
  render: () => (
    <div className="max-w-3xl mx-auto space-y-6 p-8" style={{ backgroundColor: 'var(--bg-base)' }}>
      {/* Zone 1: Identity */}
      <ProfileIdentityHero
        user={mockUser}
        isOwnProfile={false}
        isOnline={true}
        onConnect={() => console.log('Connect')}
        onMessage={() => console.log('Message')}
      />

      {/* Zone 2: Activity */}
      <div
        className="p-6"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: '24px',
        }}
      >
        <div className="space-y-6">
          {/* Building */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text-tertiary)' }}>
              Building
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <ProfileActivityCard
                tool={{ id: '1', name: 'RSVP Tool', emoji: '🎫', runs: 523, spaceName: 'Tech Club' }}
              />
              <ProfileActivityCard
                tool={{ id: '2', name: 'Poll Creator', emoji: '📊', runs: 89 }}
              />
              <ProfileOverflowChip
                count={3}
                label="more"
                className="h-full min-h-[100px] flex items-center justify-center"
              />
            </div>
          </div>

          {/* Leading */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text-tertiary)' }}>
              Leading
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <ProfileLeadershipCard
                space={{ id: '1', name: 'Tech Club', memberCount: 156, tenure: '2 years', role: 'owner' }}
              />
              <ProfileLeadershipCard
                space={{ id: '2', name: 'CS Association', memberCount: 342, role: 'admin' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Zone 3: Campus Presence */}
      <div
        className="p-6"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: '24px',
        }}
      >
        <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text-tertiary)' }}>
          Spaces
        </h3>
        <div className="flex flex-wrap gap-2 mb-6">
          <ProfileSpacePill space={{ id: '1', name: 'Tech Club', emoji: '💻', isLeader: true }} />
          <ProfileSpacePill space={{ id: '2', name: 'Design Guild', emoji: '🎨' }} />
          <ProfileSpacePill space={{ id: '3', name: 'Hiking', emoji: '🥾' }} />
          <ProfileSpacePill space={{ id: '4', name: 'Chess', emoji: '♟️' }} />
          <ProfileOverflowChip count={8} />
        </div>

        <ProfileConnectionFooter
          userName="Sarah Chen"
          sharedSpacesCount={3}
          mutualConnectionsCount={12}
        />
      </div>
    </div>
  ),
};

// ============================================================================
// All Skeletons Story
// ============================================================================

export const AllSkeletons: StoryObj<typeof ProfileIdentityHero> = {
  render: () => (
    <div className="max-w-3xl mx-auto space-y-6 p-8" style={{ backgroundColor: 'var(--bg-base)' }}>
      <ProfileIdentityHeroSkeleton />

      <div
        className="p-6"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: '24px',
        }}
      >
        <div className="grid grid-cols-3 gap-4">
          <ProfileActivityCardSkeleton />
          <ProfileActivityCardSkeleton />
          <ProfileActivityCardSkeleton />
        </div>
      </div>

      <div
        className="p-6"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: '24px',
        }}
      >
        <div className="grid grid-cols-3 gap-4 mb-6">
          <ProfileLeadershipCardSkeleton />
          <ProfileLeadershipCardSkeleton />
        </div>

        <div className="flex flex-wrap gap-2">
          <ProfileSpacePillSkeleton />
          <ProfileSpacePillSkeleton />
          <ProfileSpacePillSkeleton />
          <ProfileSpacePillSkeleton />
        </div>
      </div>
    </div>
  ),
};
