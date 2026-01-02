'use client';

import * as React from 'react';

import { SpaceSidebar, SpaceSidebarMinimal, type SpaceSidebarProps, type SpaceSidebarData, type SpaceSidebarEvent } from './space-sidebar';

import type { Meta, StoryObj } from '@storybook/react';

// ============================================================
// Mock Data
// ============================================================

const mockAbout = {
  spaceId: 'space-123',
  name: 'Design Club',
  description: 'A community for designers to share work, get feedback, and grow together. We host weekly workshops and monthly showcases.',
  category: 'Creative',
  memberCount: 156,
  isMember: false,
  isLeader: false,
  leaders: [
    { id: 'leader-1', name: 'Alex Chen', avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop', role: 'owner' as const },
    { id: 'leader-2', name: 'Sarah Kim', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop', role: 'admin' as const },
  ],
};

const mockAboutMember = {
  ...mockAbout,
  isMember: true,
};

const mockAboutLeader = {
  ...mockAbout,
  isMember: true,
  isLeader: true,
};

const mockTools = {
  spaceId: 'space-123',
  tools: [
    { id: 'tool-1', name: 'Meeting Poll', icon: '📊', type: 'poll' as const },
    { id: 'tool-2', name: 'Event RSVP', icon: '🎫', type: 'rsvp' as const },
    { id: 'tool-3', name: 'Resource Library', icon: '📚', type: 'resources' as const },
  ],
  hasMore: false,
};

const mockToolsMany = {
  spaceId: 'space-123',
  tools: [
    { id: 'tool-1', name: 'Meeting Poll', icon: '📊', type: 'poll' as const },
    { id: 'tool-2', name: 'Event RSVP', icon: '🎫', type: 'rsvp' as const },
    { id: 'tool-3', name: 'Resource Library', icon: '📚', type: 'resources' as const },
    { id: 'tool-4', name: 'Task Tracker', icon: '✅', type: 'tasks' as const },
    { id: 'tool-5', name: 'Feedback Form', icon: '💬', type: 'form' as const },
  ],
  hasMore: true,
};

const mockUpcomingEvents: SpaceSidebarEvent[] = [
  {
    id: 'event-1',
    title: 'Weekly Design Review',
    subtitle: 'Share your work and get feedback',
    when: 'Tomorrow, 5:00 PM',
    where: 'Room 302',
    isUrgent: true,
  },
  {
    id: 'event-2',
    title: 'Portfolio Workshop',
    subtitle: 'Build your design portfolio',
    when: 'Friday, 3:00 PM',
    where: 'Online',
  },
];

const mockQuickActions = [
  {
    id: 'action-1',
    variant: 'onboarding' as const,
    title: 'Complete Your Profile',
    description: 'Add your skills and interests',
    progress: 60,
    ctaLabel: 'Continue',
  },
  {
    id: 'action-2',
    variant: 'event' as const,
    title: 'RSVP to Workshop',
    description: 'Seats are filling up fast!',
    ctaLabel: 'RSVP Now',
  },
];

const baseSidebarData: SpaceSidebarData = {
  spaceId: 'space-123',
  about: mockAbout,
};

// ============================================================
// Meta Configuration
// ============================================================

const meta = {
  title: '03-Spaces/Organisms/SpaceSidebar',
  component: SpaceSidebar,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Unified sidebar organism for Space pages with glass morphism styling. Composes About, Tools, Events, and Quick Actions widgets into a cohesive unit with smart defaults and staggered animations.',
      },
    },
    backgrounds: {
      default: 'dark',
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="w-[320px] min-h-[600px] bg-black p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SpaceSidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default callbacks for interactive stories
const defaultCallbacks = {
  onJoin: () => console.log('Join clicked'),
  onLeave: () => console.log('Leave clicked'),
  onLeaderClick: (leaderId: string) => console.log('Leader clicked:', leaderId),
  onToolClick: (toolId: string) => console.log('Tool clicked:', toolId),
  onViewAll: () => console.log('View all clicked'),
  onEventClick: (eventId: string) => console.log('Event clicked:', eventId),
  onQuickActionClick: (actionId: string) => console.log('Action clicked:', actionId),
  onInviteMember: () => console.log('Invite member clicked'),
  onCreateEvent: () => console.log('Create event clicked'),
};

// ============================================================
// BASIC STATES
// ============================================================

export const Default: Story = {
  args: {
    data: baseSidebarData,
    callbacks: defaultCallbacks,
  },
  parameters: {
    docs: {
      description: {
        story: 'Default sidebar with About section only.',
      },
    },
  },
};

export const WithTools: Story = {
  args: {
    data: {
      ...baseSidebarData,
      tools: mockTools,
    },
    callbacks: defaultCallbacks,
  },
  parameters: {
    docs: {
      description: {
        story: 'Sidebar with About and Tools sections.',
      },
    },
  },
};

export const WithEvents: Story = {
  args: {
    data: {
      ...baseSidebarData,
      upcomingEvents: mockUpcomingEvents,
    },
    callbacks: defaultCallbacks,
  },
  parameters: {
    docs: {
      description: {
        story: 'Sidebar with About and Upcoming Events sections.',
      },
    },
  },
};

export const FullSidebar: Story = {
  args: {
    data: {
      ...baseSidebarData,
      tools: mockTools,
      upcomingEvents: mockUpcomingEvents,
    },
    callbacks: defaultCallbacks,
  },
  parameters: {
    docs: {
      description: {
        story: 'Full sidebar with About, Tools, and Events sections.',
      },
    },
  },
};

// ============================================================
// MEMBERSHIP STATES
// ============================================================

export const AsVisitor: Story = {
  args: {
    data: baseSidebarData,
    userMembership: 'visitor',
    callbacks: defaultCallbacks,
  },
  parameters: {
    docs: {
      description: {
        story: 'Sidebar view for non-member visitors (About expanded by default).',
      },
    },
  },
};

export const AsMember: Story = {
  args: {
    data: {
      ...baseSidebarData,
      about: mockAboutMember,
      tools: mockTools,
      upcomingEvents: mockUpcomingEvents,
    },
    userMembership: 'member',
    callbacks: defaultCallbacks,
  },
  parameters: {
    docs: {
      description: {
        story: 'Sidebar view for regular members (About collapsed, tools/events shown).',
      },
    },
  },
};

export const AsLeader: Story = {
  args: {
    data: {
      ...baseSidebarData,
      about: mockAboutLeader,
      tools: mockTools,
      upcomingEvents: mockUpcomingEvents,
    },
    userMembership: 'leader',
    callbacks: {
      ...defaultCallbacks,
      onInviteMember: () => console.log('Invite member'),
      onCreateEvent: () => console.log('Create event'),
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Leader view with Invite Member and Create Event actions.',
      },
    },
  },
};

export const AsOwner: Story = {
  args: {
    data: {
      ...baseSidebarData,
      about: { ...mockAboutLeader, leaders: [{ ...mockAbout.leaders[0], role: 'owner' as const }] },
      tools: mockToolsMany,
      upcomingEvents: mockUpcomingEvents,
    },
    userMembership: 'owner',
    callbacks: {
      ...defaultCallbacks,
      onInviteMember: () => console.log('Invite member'),
      onCreateEvent: () => console.log('Create event'),
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Owner view with full leader actions and many tools.',
      },
    },
  },
};

// ============================================================
// UNIFIED VS LEGACY MODE
// ============================================================

export const UnifiedMode: Story = {
  args: {
    data: {
      ...baseSidebarData,
      tools: mockTools,
      upcomingEvents: mockUpcomingEvents,
    },
    unified: true,
    callbacks: defaultCallbacks,
  },
  parameters: {
    docs: {
      description: {
        story: 'Unified mode (default): Single glass container with dividers between sections.',
      },
    },
  },
};

// ============================================================
// GAP VARIATIONS
// ============================================================

export const SmallGap: Story = {
  args: {
    data: {
      ...baseSidebarData,
      tools: mockTools,
      upcomingEvents: mockUpcomingEvents,
    },
    
    gap: 'sm',
    callbacks: defaultCallbacks,
  },
  parameters: {
    docs: {
      description: {
        story: 'Legacy mode with small gap between widgets.',
      },
    },
  },
};

export const LargeGap: Story = {
  args: {
    data: {
      ...baseSidebarData,
      tools: mockTools,
      upcomingEvents: mockUpcomingEvents,
    },
    
    gap: 'lg',
    callbacks: defaultCallbacks,
  },
  parameters: {
    docs: {
      description: {
        story: 'Legacy mode with large gap between widgets.',
      },
    },
  },
};

// ============================================================
// COLLAPSIBLE STATES
// ============================================================

export const Collapsible: Story = {
  args: {
    data: {
      ...baseSidebarData,
      tools: mockTools,
    },
    collapsible: true,
    defaultCollapsed: false,
    callbacks: defaultCallbacks,
  },
  parameters: {
    docs: {
      description: {
        story: 'Sections are collapsible (default behavior).',
      },
    },
  },
};

export const NotCollapsible: Story = {
  args: {
    data: {
      ...baseSidebarData,
      tools: mockTools,
    },
    collapsible: false,
    callbacks: defaultCallbacks,
  },
  parameters: {
    docs: {
      description: {
        story: 'Sections cannot be collapsed.',
      },
    },
  },
};

export const DefaultCollapsed: Story = {
  args: {
    data: {
      ...baseSidebarData,
      tools: mockTools,
    },
    collapsible: true,
    defaultCollapsed: true,
    smartDefaults: false,
    callbacks: defaultCallbacks,
  },
  parameters: {
    docs: {
      description: {
        story: 'All sections collapsed by default (smart defaults disabled).',
      },
    },
  },
};

// ============================================================
// SMART DEFAULTS
// ============================================================

export const SmartDefaultsEnabled: Story = {
  args: {
    data: {
      ...baseSidebarData,
      tools: mockTools,
      upcomingEvents: [{ ...mockUpcomingEvents[0], isUrgent: true }],
    },
    smartDefaults: true,
    userMembership: 'member',
    callbacks: defaultCallbacks,
  },
  parameters: {
    docs: {
      description: {
        story: 'Smart defaults: About collapsed (member), Events expanded (urgent event).',
      },
    },
  },
};

export const SmartDefaultsDisabled: Story = {
  args: {
    data: {
      ...baseSidebarData,
      tools: mockTools,
      upcomingEvents: [{ ...mockUpcomingEvents[0], isUrgent: true }],
    },
    smartDefaults: false,
    callbacks: defaultCallbacks,
  },
  parameters: {
    docs: {
      description: {
        story: 'Smart defaults disabled: All sections follow defaultCollapsed prop.',
      },
    },
  },
};

// ============================================================
// STICKY BEHAVIOR
// ============================================================

export const Sticky: Story = {
  args: {
    data: {
      ...baseSidebarData,
      tools: mockTools,
      upcomingEvents: mockUpcomingEvents,
    },
    sticky: true,
    stickyTop: '88px',
    callbacks: defaultCallbacks,
  },
  decorators: [
    (Story) => (
      <div className="w-[320px] h-[800px] overflow-y-auto bg-black p-4">
        <div className="h-[200px] bg-neutral-900/50 rounded-lg flex items-center justify-center text-neutral-500 mb-4">
          Scroll down to see sticky behavior
        </div>
        <div className="flex gap-4">
          <div className="flex-1 h-[1200px] bg-neutral-900/30 rounded-lg" />
          <div className="w-[320px]">
            <Story />
          </div>
        </div>
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Sticky sidebar that stays visible while scrolling.',
      },
    },
  },
};

export const NotSticky: Story = {
  args: {
    data: {
      ...baseSidebarData,
      tools: mockTools,
    },
    sticky: false,
    callbacks: defaultCallbacks,
  },
  parameters: {
    docs: {
      description: {
        story: 'Non-sticky sidebar that scrolls with content.',
      },
    },
  },
};

// ============================================================
// ANIMATION STATES
// ============================================================

export const WithAnimation: Story = {
  args: {
    data: {
      ...baseSidebarData,
      tools: mockTools,
      upcomingEvents: mockUpcomingEvents,
    },
    animate: true,
    callbacks: defaultCallbacks,
  },
  parameters: {
    docs: {
      description: {
        story: 'Sidebar with staggered reveal animation on mount.',
      },
    },
  },
};

export const WithoutAnimation: Story = {
  args: {
    data: {
      ...baseSidebarData,
      tools: mockTools,
      upcomingEvents: mockUpcomingEvents,
    },
    animate: false,
    callbacks: defaultCallbacks,
  },
  parameters: {
    docs: {
      description: {
        story: 'Sidebar without animations (respects prefers-reduced-motion).',
      },
    },
  },
};

// ============================================================
// EVENT VARIATIONS
// ============================================================

export const UrgentEvent: Story = {
  args: {
    data: {
      ...baseSidebarData,
      upcomingEvents: [
        {
          id: 'urgent-1',
          title: 'Emergency Meeting',
          subtitle: 'Important updates',
          when: 'In 30 minutes',
          where: 'Room 101',
          isUrgent: true,
        },
      ],
    },
    callbacks: defaultCallbacks,
  },
  parameters: {
    docs: {
      description: {
        story: 'Sidebar with urgent event highlighted.',
      },
    },
  },
};

export const ManyEvents: Story = {
  args: {
    data: {
      ...baseSidebarData,
      upcomingEvents: [
        { id: 'e1', title: 'Weekly Meeting', when: 'Today, 5:00 PM', where: 'Room 302' },
        { id: 'e2', title: 'Design Workshop', when: 'Tomorrow, 3:00 PM', where: 'Online' },
        { id: 'e3', title: 'Portfolio Review', when: 'Friday, 2:00 PM', where: 'Room 205' },
        { id: 'e4', title: 'Guest Speaker', when: 'Next Monday, 6:00 PM', where: 'Auditorium' },
      ],
    },
    callbacks: defaultCallbacks,
  },
  parameters: {
    docs: {
      description: {
        story: 'Sidebar with many upcoming events.',
      },
    },
  },
};

export const NoEvents: Story = {
  args: {
    data: {
      ...baseSidebarData,
      tools: mockTools,
      upcomingEvents: [],
    },
    callbacks: defaultCallbacks,
  },
  parameters: {
    docs: {
      description: {
        story: 'Sidebar with no upcoming events (section hidden).',
      },
    },
  },
};

// ============================================================
// TOOLS VARIATIONS
// ============================================================

export const ManyTools: Story = {
  args: {
    data: {
      ...baseSidebarData,
      tools: mockToolsMany,
    },
    callbacks: defaultCallbacks,
  },
  parameters: {
    docs: {
      description: {
        story: 'Sidebar with many tools and "View All" option.',
      },
    },
  },
};

export const NoTools: Story = {
  args: {
    data: {
      ...baseSidebarData,
      tools: { spaceId: 'space-123', tools: [], hasMore: false },
    },
    callbacks: defaultCallbacks,
  },
  parameters: {
    docs: {
      description: {
        story: 'Sidebar with no tools (section hidden).',
      },
    },
  },
};

// ============================================================
// QUICK ACTIONS
// ============================================================

export const WithQuickActions: Story = {
  args: {
    data: {
      ...baseSidebarData,
      quickActions: mockQuickActions,
    },
    
    callbacks: defaultCallbacks,
  },
  parameters: {
    docs: {
      description: {
        story: 'Sidebar with quick action widgets (legacy mode).',
      },
    },
  },
};

export const OnboardingProgress: Story = {
  args: {
    data: {
      ...baseSidebarData,
      quickActions: [
        {
          id: 'onboarding',
          variant: 'onboarding' as const,
          title: 'Complete Your Profile',
          description: '3 steps remaining',
          progress: 40,
          ctaLabel: 'Continue Setup',
        },
      ],
    },
    
    callbacks: defaultCallbacks,
  },
  parameters: {
    docs: {
      description: {
        story: 'Sidebar with onboarding progress widget.',
      },
    },
  },
};

// ============================================================
// LEADER ACTIONS
// ============================================================

export const LeaderActionsOnly: Story = {
  args: {
    data: {
      spaceId: 'space-123',
    },
    callbacks: {
      onInviteMember: () => console.log('Invite'),
      onCreateEvent: () => console.log('Create event'),
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Sidebar showing only leader action buttons.',
      },
    },
  },
};

export const InviteMemberOnly: Story = {
  args: {
    data: baseSidebarData,
    callbacks: {
      ...defaultCallbacks,
      onInviteMember: () => console.log('Invite'),
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Leader actions with only Invite Member button.',
      },
    },
  },
};

export const CreateEventOnly: Story = {
  args: {
    data: baseSidebarData,
    callbacks: {
      ...defaultCallbacks,
      onCreateEvent: () => console.log('Create event'),
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Leader actions with only Create Event button.',
      },
    },
  },
};

// ============================================================
// MINIMAL PRESET
// ============================================================

export const MinimalPreset: Story = {
  render: () => (
    <SpaceSidebarMinimal
      about={mockAbout}
      callbacks={defaultCallbacks}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'SpaceSidebarMinimal preset with just About section.',
      },
    },
  },
};

export const MinimalWithTools: Story = {
  render: () => (
    <SpaceSidebarMinimal
      about={mockAbout}
      tools={mockTools}
      callbacks={defaultCallbacks}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'SpaceSidebarMinimal preset with About and Tools.',
      },
    },
  },
};

// ============================================================
// REAL-WORLD SCENARIOS
// ============================================================

export const ActiveClub: Story = {
  args: {
    data: {
      spaceId: 'design-club',
      about: {
        spaceId: 'design-club',
        name: 'Design Club',
        description: 'UB\'s largest creative community. Weekly workshops, portfolio reviews, and industry connections.',
        category: 'Creative',
        memberCount: 247,
        isMember: true,
        isLeader: false,
        leaders: [
          { id: 'l1', name: 'Alex Chen', avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop', role: 'owner' as const },
          { id: 'l2', name: 'Sarah Kim', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop', role: 'admin' as const },
          { id: 'l3', name: 'Mike Johnson', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop', role: 'moderator' as const },
        ],
      },
      tools: {
        spaceId: 'design-club',
        tools: [
          { id: 't1', name: 'Workshop RSVP', icon: '🎫', type: 'rsvp' as const },
          { id: 't2', name: 'Feedback Form', icon: '📝', type: 'form' as const },
          { id: 't3', name: 'Resource Library', icon: '📚', type: 'resources' as const },
        ],
        hasMore: true,
      },
      upcomingEvents: [
        {
          id: 'e1',
          title: 'Portfolio Review Night',
          subtitle: 'Get feedback from industry pros',
          when: 'Tomorrow, 6:00 PM',
          where: 'Creative Arts Building 201',
          isUrgent: true,
        },
        {
          id: 'e2',
          title: 'Figma Workshop',
          subtitle: 'Learn advanced prototyping',
          when: 'Friday, 4:00 PM',
          where: 'Online',
        },
      ],
    },
    userMembership: 'member',
    callbacks: defaultCallbacks,
  },
  parameters: {
    docs: {
      description: {
        story: 'Active club sidebar with all sections populated.',
      },
    },
  },
};

export const NewSpace: Story = {
  args: {
    data: {
      spaceId: 'new-space',
      about: {
        spaceId: 'new-space',
        name: 'AI Study Group',
        description: 'Just getting started! Join us to explore machine learning and AI together.',
        category: 'Academic',
        memberCount: 8,
        isMember: false,
        isLeader: false,
        leaders: [
          { id: 'l1', name: 'Emma Wilson', avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop', role: 'owner' as const },
        ],
      },
    },
    userMembership: 'visitor',
    callbacks: defaultCallbacks,
  },
  parameters: {
    docs: {
      description: {
        story: 'New space with minimal content, visitor view.',
      },
    },
  },
};

export const LeaderDashboard: Story = {
  args: {
    data: {
      spaceId: 'my-space',
      about: {
        spaceId: 'my-space',
        name: 'CS Study Group',
        description: 'Collaborative learning for computer science students.',
        category: 'Academic',
        memberCount: 89,
        isMember: true,
        isLeader: true,
        leaders: [
          { id: 'me', name: 'You', avatarUrl: '', role: 'owner' as const },
        ],
      },
      tools: mockToolsMany,
      upcomingEvents: mockUpcomingEvents,
    },
    userMembership: 'owner',
    callbacks: {
      ...defaultCallbacks,
      onInviteMember: () => console.log('Invite'),
      onCreateEvent: () => console.log('Create event'),
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Space owner/leader dashboard with full management capabilities.',
      },
    },
  },
};

// ============================================================
// EDGE CASES
// ============================================================

export const LongDescription: Story = {
  args: {
    data: {
      ...baseSidebarData,
      about: {
        ...mockAbout,
        description: 'This is a very long description that tests how the sidebar handles extensive text content. It includes multiple sentences to demonstrate text truncation and overflow behavior. The sidebar should handle this gracefully without breaking the layout or causing visual issues. We want to ensure that users can still understand the space\'s purpose even with lengthy descriptions.',
      },
    },
    callbacks: defaultCallbacks,
  },
  parameters: {
    docs: {
      description: {
        story: 'Sidebar with very long space description.',
      },
    },
  },
};

export const LongSpaceName: Story = {
  args: {
    data: {
      ...baseSidebarData,
      about: {
        ...mockAbout,
        name: 'University at Buffalo Computer Science and Engineering Student Association',
      },
    },
    callbacks: defaultCallbacks,
  },
  parameters: {
    docs: {
      description: {
        story: 'Sidebar with very long space name.',
      },
    },
  },
};

export const ManyLeaders: Story = {
  args: {
    data: {
      ...baseSidebarData,
      about: {
        ...mockAbout,
        leaders: [
          { id: 'l1', name: 'Alex Chen', avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop', role: 'owner' as const },
          { id: 'l2', name: 'Sarah Kim', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop', role: 'admin' as const },
          { id: 'l3', name: 'Mike Johnson', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop', role: 'admin' as const },
          { id: 'l4', name: 'Emma Wilson', avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop', role: 'moderator' as const },
          { id: 'l5', name: 'David Lee', avatarUrl: '', role: 'moderator' as const },
          { id: 'l6', name: 'Lisa Park', avatarUrl: '', role: 'moderator' as const },
        ],
      },
    },
    callbacks: defaultCallbacks,
  },
  parameters: {
    docs: {
      description: {
        story: 'Sidebar with many leadership team members.',
      },
    },
  },
};

export const HighMemberCount: Story = {
  args: {
    data: {
      ...baseSidebarData,
      about: {
        ...mockAbout,
        memberCount: 12547,
      },
    },
    callbacks: defaultCallbacks,
  },
  parameters: {
    docs: {
      description: {
        story: 'Sidebar with very high member count (formatted).',
      },
    },
  },
};

// ============================================================
// INTERACTIVE EXAMPLES
// ============================================================

export const InteractiveSidebar: Story = {
  render: () => {
    const [isMember, setIsMember] = React.useState(false);
    const [joinedEvents, setJoinedEvents] = React.useState<string[]>([]);

    return (
      <SpaceSidebar
        data={{
          spaceId: 'space-123',
          about: {
            ...mockAbout,
            isMember,
          },
          tools: mockTools,
          upcomingEvents: mockUpcomingEvents.map(e => ({
            ...e,
            subtitle: joinedEvents.includes(e.id) ? '✓ You\'re going!' : e.subtitle,
          })),
        }}
        userMembership={isMember ? 'member' : 'visitor'}
        callbacks={{
          onJoin: () => setIsMember(true),
          onLeave: () => setIsMember(false),
          onEventClick: (eventId) => {
            if (!joinedEvents.includes(eventId)) {
              setJoinedEvents([...joinedEvents, eventId]);
            }
          },
          onToolClick: (toolId) => console.log('Tool:', toolId),
          onLeaderClick: (leaderId) => console.log('Leader:', leaderId),
        }}
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive demo: join/leave space, RSVP to events.',
      },
    },
  },
};

// ============================================================
// COMPARISON STORIES
// ============================================================

export const VisitorVsMember: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <div className="text-xs text-neutral-500 mb-2 text-center">Visitor View</div>
        <SpaceSidebar
          data={baseSidebarData}
          userMembership="visitor"
          callbacks={defaultCallbacks}
        />
      </div>
      <div>
        <div className="text-xs text-neutral-500 mb-2 text-center">Member View</div>
        <SpaceSidebar
          data={{
            ...baseSidebarData,
            about: mockAboutMember,
            tools: mockTools,
          }}
          userMembership="member"
          callbacks={defaultCallbacks}
        />
      </div>
    </div>
  ),
  decorators: [
    (Story) => (
      <div className="w-[680px] min-h-[600px] bg-black p-4">
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Side-by-side comparison of visitor vs member views.',
      },
    },
  },
};
