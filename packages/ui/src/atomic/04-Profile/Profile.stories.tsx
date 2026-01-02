'use client';

import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import { ProfileBentoGrid } from './molecules/profile-bento-grid';
import { ProfileActivityWidget, type ProfileActivityItem } from './organisms/profile-activity-widget';
import { ProfileCompletionCard } from './organisms/profile-completion-card';
import { ProfileConnectionsWidget, type ProfileConnectionItem } from './organisms/profile-connections-widget';
import { ProfileIdentityWidget } from './organisms/profile-identity-widget';
import { ProfileSpacesWidget, type ProfileSpaceItem } from './organisms/profile-spaces-widget';
import { ProfileHiveLabWidget, type ProfileToolItem } from './organisms/profile-hivelab-widget';
import { ProfileComingSoonSection, type FeatureKey } from './organisms/profile-coming-soon';
import { ProfileViewLayout } from './templates/profile-view-layout';

import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: '04-Profile/Profile System',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `Campus identity system with bento grid layout.

**Philosophy:** "Who are you on this campus?" not "How famous are you?"

Profiles emphasize:
- Major, graduation year, campus affiliation
- Spaces joined and roles held
- Contributions and tools built
- Campus connections and shared spaces

NOT follower counts, likes, or vanity metrics.`,
      },
    },
    backgrounds: {
      default: 'dark',
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="min-h-screen bg-[#0a0b16]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// MOCK DATA GENERATORS
// ============================================================================

const mockUIProfile = {
  identity: {
    fullName: 'Alex Chen',
    handle: 'alex_chen',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex',
    email: 'alexchen@buffalo.edu',
    isVerified: true,
  },
  personal: {
    bio: 'CS Junior @ UB | Building tools for campus life | Coffee enthusiast',
    interests: ['Web Development', 'Machine Learning', 'Hackathons', 'Ultimate Frisbee'],
  },
  academic: {
    campusId: 'ub-buffalo',
    academicYear: 'Junior',
    major: 'Computer Science',
    minor: 'Mathematics',
    graduationYear: 2025,
    housing: 'North Campus',
  },
  social: {
    connections: {
      connectionIds: Array(47).fill('user-'),
      friendIds: Array(12).fill('friend-'),
    },
    mutualSpaces: ['space-1', 'space-2', 'space-3'],
  },
  widgets: {
    myActivity: { level: 'public' as const },
  },
  metadata: {
    completionPercentage: 85,
    createdAt: new Date('2024-09-01'),
    lastActiveAt: new Date(),
  },
};

const generateSpaces = (count: number): ProfileSpaceItem[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `space-${i + 1}`,
    name: ['UB CS Department', 'Dance Club', 'Hackathon Team', 'Ultimate Frisbee', 'Chess Club', 'Photography Club', 'Debate Team', 'Music Society'][i % 8],
    role: (['owner', 'admin', 'moderator', 'member'] as const)[i % 4],
    memberCount: Math.floor(Math.random() * 200) + 20,
    lastActivityAt: new Date(Date.now() - Math.random() * 86400000 * 7),
    headline: ['Weekly meetups every Friday', 'Building the future together', 'Join our next event!', 'Open to all students'][i % 4],
    unreadCount: i % 3 === 0 ? Math.floor(Math.random() * 20) : 0,
    onlineCount: Math.floor(Math.random() * 15),
  }));

const generateConnections = (count: number): ProfileConnectionItem[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `conn-${i + 1}`,
    name: ['Jordan Lee', 'Sam Taylor', 'Morgan Davis', 'Riley Johnson', 'Casey Williams', 'Drew Martinez'][i % 6],
    avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=user${i}`,
    isFriend: i % 3 === 0,
    sharedSpaces: Array.from({ length: Math.floor(Math.random() * 4) + 1 }, (_, j) => `space-${j}`),
    connectionStrength: Math.floor(Math.random() * 100),
  }));

const generateActivities = (count: number): ProfileActivityItem[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `activity-${i + 1}`,
    type: (['post', 'comment', 'connection', 'space_join', 'ritual', 'other'] as const)[i % 6],
    title: [
      'Shared a post in UB CS Department',
      'Commented on event discussion',
      'Connected with Jordan Lee',
      'Joined Hackathon Team',
      'Completed Weekly Check-in ritual',
      'Created a poll in Dance Club',
    ][i % 6],
    spaceName: ['UB CS Department', 'Dance Club', 'Hackathon Team'][i % 3],
    timestamp: new Date(Date.now() - 1000 * 60 * (15 + i * 30)),
    engagementCount: Math.floor(Math.random() * 50),
  }));

const generateTools = (count: number): ProfileToolItem[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `tool-${i + 1}`,
    name: ['Weekly Poll Generator', 'Event RSVP Widget', 'Member Directory', 'Quiz Builder', 'Feedback Form'][i % 5],
    deployedToSpaces: Math.floor(Math.random() * 5),
    usageCount: Math.floor(Math.random() * 100),
    status: (['active', 'draft', 'archived'] as const)[i % 3],
    lastUpdatedAt: new Date(Date.now() - Math.random() * 86400000 * 30),
  }));

// ============================================================================
// IDENTITY WIDGET STORIES
// ============================================================================

export const Identity_Default: Story = {
  render: () => (
    <div className="max-w-md p-6">
      <ProfileIdentityWidget
        profile={mockUIProfile as any}
        isOwnProfile={false}
        presenceStatus="online"
        campusLabel="UB"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Default identity widget showing another user\'s profile.',
      },
    },
  },
};

export const Identity_OwnProfile: Story = {
  render: () => (
    <div className="max-w-md p-6">
      <ProfileIdentityWidget
        profile={mockUIProfile as any}
        isOwnProfile={true}
        presenceStatus="online"
        completionPercentage={85}
        onEditPhoto={() => console.log('Edit photo')}
        privacyLevel="public"
        onPrivacyChange={(level) => console.log('Privacy:', level)}
      />
    </div>
  ),
};

export const Identity_Presence_Online: Story = {
  render: () => (
    <div className="max-w-md p-6">
      <ProfileIdentityWidget
        profile={mockUIProfile as any}
        presenceStatus="online"
        lastSeen={new Date()}
      />
    </div>
  ),
};

export const Identity_Presence_Away: Story = {
  render: () => (
    <div className="max-w-md p-6">
      <ProfileIdentityWidget
        profile={mockUIProfile as any}
        presenceStatus="away"
        lastSeen={new Date(Date.now() - 1000 * 60 * 30)}
      />
    </div>
  ),
};

export const Identity_Presence_Offline: Story = {
  render: () => (
    <div className="max-w-md p-6">
      <ProfileIdentityWidget
        profile={mockUIProfile as any}
        presenceStatus="offline"
        lastSeen={new Date(Date.now() - 1000 * 60 * 60 * 24 * 3)}
      />
    </div>
  ),
};

export const Identity_NoAvatar: Story = {
  render: () => (
    <div className="max-w-md p-6">
      <ProfileIdentityWidget
        profile={{
          ...mockUIProfile,
          identity: { ...mockUIProfile.identity, avatarUrl: undefined },
        } as any}
        presenceStatus="online"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Shows initials fallback when no avatar is provided.',
      },
    },
  },
};

export const Identity_LowCompletion: Story = {
  render: () => (
    <div className="max-w-md p-6">
      <ProfileIdentityWidget
        profile={{
          ...mockUIProfile,
          personal: { bio: undefined },
          metadata: { completionPercentage: 35 },
        } as any}
        isOwnProfile={true}
        completionPercentage={35}
      />
    </div>
  ),
};

export const Identity_PerfectCompletion: Story = {
  render: () => (
    <div className="max-w-md p-6">
      <ProfileIdentityWidget
        profile={{
          ...mockUIProfile,
          metadata: { completionPercentage: 100 },
        } as any}
        isOwnProfile={true}
        completionPercentage={100}
      />
    </div>
  ),
};

// ============================================================================
// ACTIVITY WIDGET STORIES
// ============================================================================

export const Activity_Default: Story = {
  render: () => (
    <div className="max-w-md p-6">
      <ProfileActivityWidget
        activities={generateActivities(5)}
        isOwnProfile={false}
        onViewAll={() => console.log('View all')}
      />
    </div>
  ),
};

export const Activity_AllTypes: Story = {
  render: () => (
    <div className="max-w-md p-6">
      <ProfileActivityWidget
        activities={[
          { id: '1', type: 'post', title: 'Shared a photo in Dance Club', spaceName: 'Dance Club', timestamp: new Date(Date.now() - 60000) },
          { id: '2', type: 'comment', title: 'Commented on event discussion', spaceName: 'CS Department', timestamp: new Date(Date.now() - 120000), engagementCount: 5 },
          { id: '3', type: 'connection', title: 'Connected with Jordan Lee', timestamp: new Date(Date.now() - 180000) },
          { id: '4', type: 'space_join', title: 'Joined Hackathon Team', spaceName: 'Hackathon Team', timestamp: new Date(Date.now() - 240000) },
          { id: '5', type: 'ritual', title: 'Completed Weekly Check-in', spaceName: 'UB Students', timestamp: new Date(Date.now() - 300000), engagementCount: 12 },
        ]}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Shows all activity types: post, comment, connection, space_join, ritual.',
      },
    },
  },
};

export const Activity_Empty: Story = {
  render: () => (
    <div className="max-w-md p-6">
      <ProfileActivityWidget activities={[]} isOwnProfile={false} />
    </div>
  ),
};

export const Activity_Empty_OwnProfile: Story = {
  render: () => (
    <div className="max-w-md p-6">
      <ProfileActivityWidget activities={[]} isOwnProfile={true} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Empty state with call-to-action for own profile.',
      },
    },
  },
};

export const Activity_WithPrivacy: Story = {
  render: () => {
    const [privacy, setPrivacy] = React.useState<'public' | 'connections' | 'private'>('public');
    return (
      <div className="max-w-md p-6">
        <ProfileActivityWidget
          activities={generateActivities(5)}
          isOwnProfile={true}
          privacyLevel={privacy}
          onPrivacyChange={setPrivacy}
        />
      </div>
    );
  },
};

export const Activity_HighEngagement: Story = {
  render: () => (
    <div className="max-w-md p-6">
      <ProfileActivityWidget
        activities={[
          { id: '1', type: 'post', title: 'Organized campus-wide hackathon', spaceName: 'Tech Club', timestamp: new Date(), engagementCount: 247 },
          { id: '2', type: 'ritual', title: 'Led Weekly Standup for 10 weeks straight', spaceName: 'CS Department', timestamp: new Date(), engagementCount: 156 },
          { id: '3', type: 'post', title: 'Launched new member onboarding flow', spaceName: 'UB Orientation', timestamp: new Date(), engagementCount: 89 },
        ]}
      />
    </div>
  ),
};

// ============================================================================
// SPACES WIDGET STORIES
// ============================================================================

export const Spaces_Default: Story = {
  render: () => (
    <div className="max-w-md p-6">
      <ProfileSpacesWidget
        spaces={generateSpaces(4)}
        isOwnProfile={false}
      />
    </div>
  ),
};

export const Spaces_AllRoles: Story = {
  render: () => (
    <div className="max-w-md p-6">
      <ProfileSpacesWidget
        spaces={[
          { id: '1', name: 'UB Tech Leaders', role: 'owner', memberCount: 156, lastActivityAt: new Date(), headline: 'Founded by Alex Chen' },
          { id: '2', name: 'CS Department', role: 'admin', memberCount: 423, lastActivityAt: new Date(), headline: 'Managing events & discussions' },
          { id: '3', name: 'Hackathon 2024', role: 'moderator', memberCount: 89, lastActivityAt: new Date(), headline: 'Keeping discussions on track' },
          { id: '4', name: 'Dance Club', role: 'member', memberCount: 67, lastActivityAt: new Date(), headline: 'Weekly practice sessions' },
        ]}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Shows all role badge variants: Owner (gold), Admin (purple), Moderator (blue), Member (gray).',
      },
    },
  },
};

export const Spaces_WithUnread: Story = {
  render: () => (
    <div className="max-w-md p-6">
      <ProfileSpacesWidget
        spaces={[
          { id: '1', name: 'Active Discussion', role: 'member', memberCount: 45, unreadCount: 23, onlineCount: 8, lastActivityAt: new Date() },
          { id: '2', name: 'Busy Space', role: 'admin', memberCount: 120, unreadCount: 150, onlineCount: 15, lastActivityAt: new Date() },
          { id: '3', name: 'Quiet Space', role: 'member', memberCount: 30, unreadCount: 0, onlineCount: 2, lastActivityAt: new Date() },
        ]}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Shows unread message counts and online member indicators.',
      },
    },
  },
};

export const Spaces_Empty: Story = {
  render: () => (
    <div className="max-w-md p-6">
      <ProfileSpacesWidget spaces={[]} isOwnProfile={false} />
    </div>
  ),
};

export const Spaces_Empty_OwnProfile: Story = {
  render: () => (
    <div className="max-w-md p-6">
      <ProfileSpacesWidget spaces={[]} isOwnProfile={true} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Empty state with Browse Spaces CTA for own profile.',
      },
    },
  },
};

export const Spaces_ManySpaces: Story = {
  render: () => (
    <div className="max-w-md p-6">
      <ProfileSpacesWidget
        spaces={generateSpaces(8)}
        isOwnProfile={true}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Shows "Discover more spaces" CTA when user has many spaces.',
      },
    },
  },
};

// ============================================================================
// CONNECTIONS WIDGET STORIES
// ============================================================================

export const Connections_Default: Story = {
  render: () => (
    <div className="max-w-md p-6">
      <ProfileConnectionsWidget
        connections={generateConnections(6)}
        isOwnProfile={false}
      />
    </div>
  ),
};

export const Connections_WithSharedSpaces: Story = {
  render: () => (
    <div className="max-w-md p-6">
      <ProfileConnectionsWidget
        connections={[
          { id: '1', name: 'Jordan Lee', sharedSpaces: ['CS Dept', 'Hackathons', 'Study Group'] },
          { id: '2', name: 'Sam Taylor', sharedSpaces: ['Dance Club', 'Music Society'] },
          { id: '3', name: 'Morgan Davis', sharedSpaces: ['Photography'] },
          { id: '4', name: 'Riley Johnson', sharedSpaces: [] },
        ]}
      />
    </div>
  ),
};

export const Connections_WithStrength: Story = {
  render: () => (
    <div className="max-w-md p-6">
      <ProfileConnectionsWidget
        connections={[
          { id: '1', name: 'Best Friend', isFriend: true, connectionStrength: 95 },
          { id: '2', name: 'Close Collaborator', isFriend: true, connectionStrength: 78 },
          { id: '3', name: 'Classmate', connectionStrength: 45 },
          { id: '4', name: 'New Connection', connectionStrength: 12 },
        ]}
      />
    </div>
  ),
};

export const Connections_Empty: Story = {
  render: () => (
    <div className="max-w-md p-6">
      <ProfileConnectionsWidget connections={[]} isOwnProfile={false} />
    </div>
  ),
};

export const Connections_Empty_OwnProfile: Story = {
  render: () => (
    <div className="max-w-md p-6">
      <ProfileConnectionsWidget connections={[]} isOwnProfile={true} />
    </div>
  ),
};

// ============================================================================
// COMPLETION CARD STORIES
// ============================================================================

export const Completion_Low: Story = {
  render: () => (
    <div className="max-w-md p-6">
      <ProfileCompletionCard
        percentage={25}
        steps={[
          { id: '1', title: 'Add profile photo', description: 'Help others recognize you' },
          { id: '2', title: 'Write a bio', description: 'Tell people about yourself' },
          { id: '3', title: 'Add your major', description: 'Connect with classmates' },
          { id: '4', title: 'Join a space', description: 'Find your community' },
        ]}
        onStepClick={(id) => console.log('Step clicked:', id)}
      />
    </div>
  ),
};

export const Completion_Medium: Story = {
  render: () => (
    <div className="max-w-md p-6">
      <ProfileCompletionCard
        percentage={65}
        steps={[
          { id: '1', title: 'Add interests', description: 'Get personalized recommendations' },
          { id: '2', title: 'Connect with classmates', description: 'Grow your network' },
        ]}
        onStepClick={(id) => console.log('Step clicked:', id)}
      />
    </div>
  ),
};

export const Completion_High: Story = {
  render: () => (
    <div className="max-w-md p-6">
      <ProfileCompletionCard
        percentage={90}
        steps={[
          { id: '1', title: 'Add a cover photo', description: 'Final touch for your profile' },
        ]}
        onStepClick={(id) => console.log('Step clicked:', id)}
      />
    </div>
  ),
};

export const Completion_Perfect: Story = {
  render: () => (
    <div className="max-w-md p-6">
      <ProfileCompletionCard
        percentage={100}
        steps={[]}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Celebration state when profile is 100% complete.',
      },
    },
  },
};

export const Completion_Interactive: Story = {
  render: () => {
    const [percentage, setPercentage] = React.useState(40);
    const [steps, setSteps] = React.useState([
      { id: '1', title: 'Add profile photo' },
      { id: '2', title: 'Write a bio' },
      { id: '3', title: 'Add your major' },
    ]);

    const completeStep = (id: string) => {
      setSteps(s => s.filter(step => step.id !== id));
      setPercentage(p => Math.min(100, p + 20));
    };

    return (
      <div className="max-w-md p-6">
        <ProfileCompletionCard
          percentage={percentage}
          steps={steps as any}
          onStepClick={completeStep}
        />
        <p className="mt-4 text-sm text-white/50 text-center">
          Click steps to complete them
        </p>
      </div>
    );
  },
};

// ============================================================================
// HIVELAB WIDGET STORIES
// ============================================================================

export const HiveLab_Default: Story = {
  render: () => (
    <div className="max-w-md p-6">
      <ProfileHiveLabWidget
        tools={generateTools(3)}
        isOwnProfile={false}
      />
    </div>
  ),
};

export const HiveLab_OwnProfile: Story = {
  render: () => (
    <div className="max-w-md p-6">
      <ProfileHiveLabWidget
        tools={generateTools(3)}
        isOwnProfile={true}
        onPrivacyChange={(level) => console.log('Privacy:', level)}
      />
    </div>
  ),
};

export const HiveLab_Empty_OwnProfile: Story = {
  render: () => (
    <div className="max-w-md p-6">
      <ProfileHiveLabWidget
        tools={[]}
        isOwnProfile={true}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Empty state with animated CTA encouraging tool creation.',
      },
    },
  },
};

export const HiveLab_Empty_OtherProfile: Story = {
  render: () => (
    <div className="max-w-md p-6">
      <ProfileHiveLabWidget
        tools={[]}
        isOwnProfile={false}
      />
    </div>
  ),
};

export const HiveLab_MasterBuilder: Story = {
  render: () => (
    <div className="max-w-md p-6">
      <ProfileHiveLabWidget
        tools={generateTools(7)}
        isOwnProfile={true}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Shows "Master Builder" badge for users with 5+ tools.',
      },
    },
  },
};

export const HiveLab_ActiveTools: Story = {
  render: () => (
    <div className="max-w-md p-6">
      <ProfileHiveLabWidget
        tools={[
          { id: '1', name: 'Event RSVP Widget', deployedToSpaces: 5, usageCount: 234, status: 'active' },
          { id: '2', name: 'Weekly Poll', deployedToSpaces: 3, usageCount: 156, status: 'active' },
          { id: '3', name: 'Quiz Builder', deployedToSpaces: 0, usageCount: 0, status: 'draft' },
        ]}
        isOwnProfile={true}
      />
    </div>
  ),
};

// ============================================================================
// COMING SOON SECTION STORIES
// ============================================================================

export const ComingSoon_Default: Story = {
  render: () => (
    <div className="max-w-xl p-6">
      <ProfileComingSoonSection />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Teases upcoming features: AI Insights, Rituals, Campus Graph.',
      },
    },
  },
};

export const ComingSoon_Interactive: Story = {
  render: () => {
    const [notified, setNotified] = React.useState<FeatureKey[]>([]);

    const handleNotify = async (feature: FeatureKey) => {
      await new Promise(r => setTimeout(r, 500));
      setNotified(prev => [...prev, feature]);
    };

    return (
      <div className="max-w-xl p-6">
        <ProfileComingSoonSection
          notifiedFeatures={notified}
          onNotify={handleNotify}
        />
      </div>
    );
  },
};

export const ComingSoon_AllNotified: Story = {
  render: () => (
    <div className="max-w-xl p-6">
      <ProfileComingSoonSection
        notifiedFeatures={['ai_insights', 'rituals', 'campus_graph']}
      />
    </div>
  ),
};

// ============================================================================
// BENTO GRID STORIES
// ============================================================================

export const BentoGrid_Default: Story = {
  render: () => (
    <div className="p-6">
      <ProfileBentoGrid
        profile={mockUIProfile as any}
        editable={false}
      />
    </div>
  ),
};

export const BentoGrid_Editable: Story = {
  render: () => (
    <div className="p-6">
      <ProfileBentoGrid
        profile={mockUIProfile as any}
        editable={true}
        onLayoutChange={(layout) => console.log('Layout changed:', layout)}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Drag-and-drop customizable grid layout.',
      },
    },
  },
};

export const BentoGrid_Minimal: Story = {
  render: () => (
    <div className="p-6">
      <ProfileBentoGrid
        profile={{
          ...mockUIProfile,
          social: { connections: { connectionIds: [], friendIds: [] }, mutualSpaces: [] },
        } as any}
        editable={false}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Grid for a new user with minimal data.',
      },
    },
  },
};

// ============================================================================
// FULL PROFILE LAYOUT STORIES
// ============================================================================

export const Layout_OtherUser: Story = {
  render: () => (
    <ProfileViewLayout
      profile={mockUIProfile as any}
      spaces={generateSpaces(4) as any}
      connections={generateConnections(6) as any}
      activity={generateActivities(5) as any}
      isOwnProfile={false}
      onConnect={() => console.log('Connect clicked')}
      onMessage={() => console.log('Message clicked')}
    />
  ),
};

export const Layout_OwnProfile: Story = {
  render: () => (
    <ProfileViewLayout
      profile={mockUIProfile as any}
      spaces={generateSpaces(4) as any}
      connections={generateConnections(6) as any}
      activity={generateActivities(5) as any}
      isOwnProfile={true}
      onEdit={() => console.log('Edit clicked')}
    />
  ),
};

export const Layout_IncompleteProfile: Story = {
  render: () => (
    <ProfileViewLayout
      profile={{
        ...mockUIProfile,
        personal: { bio: undefined, interests: [] },
        metadata: { completionPercentage: 45 },
      } as any}
      spaces={generateSpaces(2) as any}
      connections={generateConnections(2) as any}
      activity={generateActivities(1) as any}
      isOwnProfile={true}
      onEdit={() => console.log('Edit clicked')}
    />
  ),
};

export const Layout_NewUser: Story = {
  render: () => (
    <ProfileViewLayout
      profile={{
        identity: {
          fullName: 'New Student',
          handle: 'new_student',
          email: 'newstudent@buffalo.edu',
        },
        personal: {},
        academic: { campusId: 'ub-buffalo', academicYear: 'Freshman' },
        social: { connections: { connectionIds: [], friendIds: [] }, mutualSpaces: [] },
        metadata: { completionPercentage: 15 },
      } as any}
      spaces={[] as any}
      connections={[] as any}
      activity={[] as any}
      isOwnProfile={true}
      onEdit={() => console.log('Edit clicked')}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Profile for a brand new user with minimal data.',
      },
    },
  },
};

export const Layout_PowerUser: Story = {
  render: () => (
    <ProfileViewLayout
      profile={{
        ...mockUIProfile,
        identity: { ...mockUIProfile.identity, fullName: 'Campus Legend' },
        social: {
          connections: { connectionIds: Array(247).fill(''), friendIds: Array(45).fill('') },
          mutualSpaces: Array(12).fill('space'),
        },
        metadata: { completionPercentage: 100 },
      } as any}
      spaces={generateSpaces(8) as any}
      connections={generateConnections(6) as any}
      activity={generateActivities(10) as any}
      isOwnProfile={false}
      onConnect={() => console.log('Connect')}
      onMessage={() => console.log('Message')}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Profile for a highly active campus leader.',
      },
    },
  },
};

export const Layout_Mobile: Story = {
  render: () => (
    <div className="max-w-[375px] mx-auto">
      <ProfileViewLayout
        profile={mockUIProfile as any}
        spaces={generateSpaces(3) as any}
        connections={generateConnections(4) as any}
        activity={generateActivities(3) as any}
        isOwnProfile={false}
        onConnect={() => console.log('Connect clicked')}
        onMessage={() => console.log('Message clicked')}
      />
    </div>
  ),
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
    docs: {
      description: {
        story: 'Mobile-optimized layout with stacked widgets.',
      },
    },
  },
};

export const Layout_GhostMode: Story = {
  render: () => (
    <ProfileViewLayout
      profile={{
        ...mockUIProfile,
        personal: { bio: 'Profile hidden from course stalking. Limited visibility mode active.' },
      } as any}
      spaces={generateSpaces(2) as any}
      connections={[] as any}
      activity={[] as any}
      isOwnProfile={false}
      onConnect={() => console.log('Connect clicked')}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Ghost Mode: Privacy protection for course stalking. Connections and activity hidden.',
      },
    },
  },
};

// ============================================================================
// INTERACTIVE DEMOS
// ============================================================================

export const Demo_CompletionJourney: Story = {
  render: () => {
    const [completion, setCompletion] = React.useState(40);
    const [steps, setSteps] = React.useState([
      { id: 'photo', title: 'Add profile photo', description: 'Help others recognize you' },
      { id: 'bio', title: 'Write a bio', description: 'Tell people about yourself' },
      { id: 'major', title: 'Add your major', description: 'Connect with classmates' },
    ]);

    const completeStep = (id: string) => {
      setSteps(s => s.filter(step => step.id !== id));
      setCompletion(p => Math.min(100, p + 20));
    };

    return (
      <div className="p-6">
        <div className="max-w-md mx-auto space-y-6">
          <ProfileIdentityWidget
            profile={{
              ...mockUIProfile,
              metadata: { completionPercentage: completion },
            } as any}
            isOwnProfile={true}
            completionPercentage={completion}
          />
          <ProfileCompletionCard
            percentage={completion}
            steps={steps as any}
            onStepClick={completeStep}
          />
        </div>
        <p className="mt-6 text-center text-sm text-white/50">
          Click completion steps to see progress update in real-time
        </p>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive demo showing profile completion psychology: progress visibility drives engagement.',
      },
    },
  },
};

export const Demo_PrivacyControls: Story = {
  render: () => {
    const [activityPrivacy, setActivityPrivacy] = React.useState<'public' | 'connections' | 'private'>('public');
    const [spacesPrivacy, setSpacesPrivacy] = React.useState<'public' | 'connections' | 'private'>('public');
    const [connectionsPrivacy, setConnectionsPrivacy] = React.useState<'public' | 'connections' | 'private'>('public');

    return (
      <div className="p-6 grid gap-4 md:grid-cols-3">
        <ProfileActivityWidget
          activities={generateActivities(3)}
          isOwnProfile={true}
          privacyLevel={activityPrivacy}
          onPrivacyChange={setActivityPrivacy}
        />
        <ProfileSpacesWidget
          spaces={generateSpaces(3)}
          isOwnProfile={true}
          privacyLevel={spacesPrivacy}
          onPrivacyChange={setSpacesPrivacy}
        />
        <ProfileConnectionsWidget
          connections={generateConnections(4)}
          isOwnProfile={true}
          privacyLevel={connectionsPrivacy}
          onPrivacyChange={setConnectionsPrivacy}
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Each widget can have independent privacy settings.',
      },
    },
  },
};

export const Demo_RoleProgression: Story = {
  render: () => (
    <div className="p-6 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {(['member', 'moderator', 'admin', 'owner'] as const).map((role) => (
        <ProfileSpacesWidget
          key={role}
          spaces={[{
            id: role,
            name: `${role.charAt(0).toUpperCase() + role.slice(1)} Space`,
            role,
            memberCount: 50,
            lastActivityAt: new Date(),
            headline: `You are a ${role} here`,
          }]}
          isOwnProfile={false}
        />
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Shows role badge progression: Member → Moderator → Admin → Owner (Leader).',
      },
    },
  },
};

// ============================================================================
// EDGE CASES
// ============================================================================

export const Edge_VeryLongName: Story = {
  render: () => (
    <div className="max-w-md p-6">
      <ProfileIdentityWidget
        profile={{
          ...mockUIProfile,
          identity: {
            ...mockUIProfile.identity,
            fullName: 'Alexandra Maximilian Bartholomew Fitzgerald-Montgomery III',
          },
        } as any}
        presenceStatus="online"
      />
    </div>
  ),
};

export const Edge_VeryLongBio: Story = {
  render: () => (
    <div className="max-w-md p-6">
      <ProfileIdentityWidget
        profile={{
          ...mockUIProfile,
          personal: {
            bio: 'Computer Science student passionate about building the future of campus technology. I love hackathons, coffee, late-night coding sessions, and helping fellow students navigate their academic journey. Currently working on several projects including a campus navigation app, a study group matching algorithm, and a tool that helps students discover clubs and organizations that match their interests. Always open to collaborate on interesting projects!',
          },
        } as any}
        presenceStatus="online"
      />
    </div>
  ),
};

export const Edge_ManyConnections: Story = {
  render: () => (
    <div className="max-w-md p-6">
      <ProfileConnectionsWidget
        connections={generateConnections(20)}
        isOwnProfile={false}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Shows max 6 connections with overflow handled gracefully.',
      },
    },
  },
};

export const Edge_ManyActivities: Story = {
  render: () => (
    <div className="max-w-md p-6">
      <ProfileActivityWidget
        activities={generateActivities(20)}
        isOwnProfile={false}
        onViewAll={() => console.log('View all')}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Shows max 5 activities with "View all" button.',
      },
    },
  },
};

// ============================================================================
// STRATEGIC DOCUMENTATION
// ============================================================================

export const Profile_CampusIdentityPhilosophy: Story = {
  render: () => (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Campus Identity, Not Vanity Metrics</h2>
        <p className="text-white/60">What makes HIVE profiles different</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
          <h3 className="text-lg font-semibold text-emerald-400 mb-4">✓ What HIVE Shows</h3>
          <ul className="space-y-2 text-sm text-white/80">
            <li>• Major & graduation year</li>
            <li>• Spaces joined & roles held</li>
            <li>• Tools built & contributions</li>
            <li>• Campus connections & shared spaces</li>
            <li>• Academic housing & campus affiliation</li>
          </ul>
        </div>

        <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/30">
          <h3 className="text-lg font-semibold text-red-400 mb-4">✗ What HIVE Avoids</h3>
          <ul className="space-y-2 text-sm text-white/80">
            <li>• Follower counts</li>
            <li>• Like counts on profiles</li>
            <li>• Global popularity metrics</li>
            <li>• Vanity badges unrelated to contribution</li>
            <li>• Comparison-inducing rankings</li>
          </ul>
        </div>
      </div>

      <div className="mt-8 p-6 rounded-2xl bg-[#FFD700]/10 border border-[#FFD700]/30">
        <h3 className="text-lg font-semibold text-[#FFD700] mb-2">The Question We Answer</h3>
        <p className="text-xl text-white">
          "Who are you on this campus?"
        </p>
        <p className="text-sm text-white/60 mt-2">
          Not "How famous are you?" — Your profile shows your campus identity, contributions, and community involvement.
        </p>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Strategic documentation: HIVE profiles focus on campus identity and contribution, not social media vanity metrics.',
      },
    },
  },
};
