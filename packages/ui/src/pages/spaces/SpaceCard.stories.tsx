'use client';

import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';
import { SpaceCard, type SpaceCardData } from './SpaceCard';

const meta = {
  title: 'Pages/Spaces/SpaceCard',
  component: SpaceCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A space discovery card with hover lift, banner image zoom, and smooth animations. Used in spaces browse/discovery to showcase campus communities. Features Framer Motion for delightful micro-interactions.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof SpaceCard>;

export default meta;
type Story = StoryObj<typeof meta>;

// ===== DEFAULT DATA =====

const defaultSpace: SpaceCardData = {
  id: '1',
  name: 'UB Dance Club',
  description: 'Join us for weekly dance practices, performances, and campus events. All skill levels welcome!',
  members: 247,
  momentum: '🔥 Trending',
  tags: ['dance', 'performance', 'social'],
  bannerImage: 'https://images.unsplash.com/photo-1504609813442-a8924e83f76e?w=800&h=400&fit=crop',
  category: 'Student Org',
  hosts: [
    {
      name: 'Sarah Chen',
      initials: 'SC',
      role: 'President',
    },
    {
      name: 'Mike Johnson',
      initials: 'MJ',
      role: 'VP',
    },
  ],
  metrics: [
    { label: 'Posts', value: '342' },
    { label: 'Events', value: '12' },
  ],
};

// ===== BASIC VARIANTS =====

export const Default: Story = {
  args: {
    space: defaultSpace,
  },
};

export const WithoutBanner: Story = {
  args: {
    space: {
      ...defaultSpace,
      bannerImage: undefined,
    },
  },
};

export const InviteOnly: Story = {
  args: {
    space: {
      ...defaultSpace,
      name: 'Honors Program',
      description: 'Exclusive community for UB Honors students. By invitation only.',
      isInviteOnly: true,
      members: 89,
    },
  },
};

export const LargeCommunity: Story = {
  args: {
    space: {
      ...defaultSpace,
      name: 'UB Class of 2025',
      description: 'Official space for all graduating seniors. Share opportunities, events, and memories.',
      members: 3247,
      momentum: '⚡ Most Active',
    },
  },
};

export const SmallCommunity: Story = {
  args: {
    space: {
      ...defaultSpace,
      name: 'Board Game Enthusiasts',
      description: 'Weekly meetups to play board games, card games, and tabletop RPGs.',
      members: 23,
      momentum: undefined,
    },
  },
};

// ===== DIFFERENT SPACE TYPES =====

export const AcademicDepartment: Story = {
  args: {
    space: {
      id: '2',
      name: 'Computer Science Department',
      description: 'Official CS department space. Course updates, job opportunities, research, and events.',
      members: 1842,
      momentum: '📚 Department',
      tags: ['cs', 'academic', 'tech'],
      bannerImage: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&h=400&fit=crop',
      category: 'Academic',
      hosts: [
        {
          name: 'Prof. David Zhang',
          initials: 'DZ',
          role: 'Chair',
        },
      ],
      metrics: [
        { label: 'Students', value: '1,842' },
        { label: 'Faculty', value: '24' },
      ],
    },
  },
};

export const ResidenceHall: Story = {
  args: {
    space: {
      id: '3',
      name: 'Governors Hall',
      description: 'Community space for Governors residents. Events, room swaps, and dorm announcements.',
      members: 456,
      momentum: '🏠 Residence',
      tags: ['housing', 'community'],
      bannerImage: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&h=400&fit=crop',
      category: 'Housing',
      hosts: [
        {
          name: 'Jamie Lee',
          initials: 'JL',
          role: 'RA',
        },
      ],
      metrics: [
        { label: 'Residents', value: '456' },
        { label: 'Events', value: '8' },
      ],
    },
  },
};

export const SocialClub: Story = {
  args: {
    space: {
      id: '4',
      name: 'UB Photography Club',
      description: 'Share your photos, learn new techniques, and join group photo walks around campus.',
      members: 134,
      momentum: '📸 Creative',
      tags: ['photography', 'art', 'creative'],
      bannerImage: 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=800&h=400&fit=crop',
      category: 'Social',
      hosts: [
        {
          name: 'Alex Rivera',
          initials: 'AR',
          role: 'Founder',
        },
      ],
      metrics: [
        { label: 'Photos', value: '1.2k' },
        { label: 'Events', value: '15' },
      ],
    },
  },
};

export const SportsTeam: Story = {
  args: {
    space: {
      id: '5',
      name: 'Club Volleyball',
      description: 'Competitive and recreational volleyball. Practices twice weekly, tournaments monthly.',
      members: 68,
      momentum: '🏐 Sports',
      tags: ['volleyball', 'sports', 'competitive'],
      bannerImage: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=800&h=400&fit=crop',
      category: 'Athletics',
      hosts: [
        {
          name: 'Chris Taylor',
          initials: 'CT',
          role: 'Captain',
        },
        {
          name: 'Sam Park',
          initials: 'SP',
          role: 'Co-Captain',
        },
      ],
      metrics: [
        { label: 'Members', value: '68' },
        { label: 'Wins', value: '12' },
      ],
    },
  },
};

export const CareerFocused: Story = {
  args: {
    space: {
      id: '6',
      name: 'UB Tech Careers',
      description: 'Job opportunities, interview prep, resume reviews, and networking for tech careers.',
      members: 892,
      momentum: '💼 Career',
      tags: ['tech', 'jobs', 'internships'],
      bannerImage: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&h=400&fit=crop',
      category: 'Professional',
      hosts: [
        {
          name: 'Career Services',
          initials: 'CS',
          role: 'Official',
        },
      ],
      metrics: [
        { label: 'Jobs Posted', value: '247' },
        { label: 'Placements', value: '89' },
      ],
    },
  },
};

// ===== MINIMAL VARIANTS =====

export const MinimalSpace: Story = {
  args: {
    space: {
      id: '7',
      name: 'Study Lounge Chat',
      description: 'Quick questions, study partner finder, campus library updates.',
      members: 1523,
    },
  },
};

export const NoTags: Story = {
  args: {
    space: {
      ...defaultSpace,
      tags: undefined,
    },
  },
};

export const NoHosts: Story = {
  args: {
    space: {
      ...defaultSpace,
      hosts: undefined,
    },
  },
};

export const NoMetrics: Story = {
  args: {
    space: {
      ...defaultSpace,
      metrics: undefined,
    },
  },
};

// ===== INTERACTIVE EXAMPLES =====

export const InteractiveJoin: Story = {
  render: () => {
    const [joined, setJoined] = React.useState(false);
    const [memberCount, setMemberCount] = React.useState(247);

    const handleJoin = () => {
      setJoined(true);
      setMemberCount(memberCount + 1);
    };

    return (
      <div className="w-[380px]">
        <SpaceCard
          space={{
            ...defaultSpace,
            members: memberCount,
          }}
          ctaLabel={joined ? 'Joined ✓' : 'Join space'}
          onJoin={handleJoin}
        />
      </div>
    );
  },
};

export const WithCustomBannerColor: Story = {
  args: {
    space: {
      ...defaultSpace,
      bannerImage: undefined,
      bannerColor: 'bg-gradient-to-br from-purple-500/20 via-pink-500/10 to-transparent',
    },
  },
};

export const HighMomentum: Story = {
  args: {
    space: {
      ...defaultSpace,
      name: 'Campus Events Central',
      description: 'All major campus events, concerts, speakers, and activities in one place.',
      members: 5247,
      momentum: '🚀 Exploding',
    },
  },
};

// ===== GRID LAYOUT =====

export const GridLayout: Story = {
  render: () => {
    const spaces: SpaceCardData[] = [
      {
        ...defaultSpace,
        id: '1',
        name: 'UB Dance Club',
        members: 247,
      },
      {
        ...defaultSpace,
        id: '2',
        name: 'CS Department',
        members: 1842,
        category: 'Academic',
        momentum: '📚 Department',
      },
      {
        ...defaultSpace,
        id: '3',
        name: 'Governors Hall',
        members: 456,
        category: 'Housing',
        momentum: '🏠 Residence',
      },
      {
        ...defaultSpace,
        id: '4',
        name: 'Photography Club',
        members: 134,
        category: 'Social',
        momentum: '📸 Creative',
      },
    ];

    return (
      <div className="grid grid-cols-2 gap-6 w-[820px]">
        {spaces.map((space) => (
          <SpaceCard key={space.id} space={space} />
        ))}
      </div>
    );
  },
};

// ===== COMPARISON =====

export const MembershipComparison: Story = {
  render: () => {
    return (
      <div className="flex flex-col gap-6 w-[380px]">
        <div>
          <p className="text-xs text-[var(--hive-text-tertiary)] mb-2">Small (23 members)</p>
          <SpaceCard
            space={{
              ...defaultSpace,
              name: 'Board Game Club',
              members: 23,
              momentum: undefined,
            }}
          />
        </div>
        <div>
          <p className="text-xs text-[var(--hive-text-tertiary)] mb-2">Medium (247 members)</p>
          <SpaceCard space={defaultSpace} />
        </div>
        <div>
          <p className="text-xs text-[var(--hive-text-tertiary)] mb-2">Large (3,247 members)</p>
          <SpaceCard
            space={{
              ...defaultSpace,
              name: 'UB Class of 2025',
              members: 3247,
              momentum: '⚡ Most Active',
            }}
          />
        </div>
      </div>
    );
  },
};

// ===== DARK MODE =====

export const DarkModeExample: Story = {
  parameters: {
    backgrounds: { default: 'dark' },
  },
  args: {
    space: defaultSpace,
  },
};
