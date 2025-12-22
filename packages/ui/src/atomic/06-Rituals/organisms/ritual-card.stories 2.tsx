'use client';

import * as React from 'react';

import { RitualCard } from './ritual-card';

import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: '06-Rituals/Organisms/RitualCard',
  component: RitualCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A ritual card with hover lift, icon pulse, and smooth animations. Used in ritual grids to showcase campus-wide behavioral campaigns. Features Framer Motion enhancements for delightful micro-interactions.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof RitualCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const defaultRitual = {
  id: '1',
  name: 'Campus Madness',
  description: 'Vote for the best dining hall on campus in this March Madness-style tournament',
  icon: '🏀',
  progress: 65,
  participantCount: 1247,
  duration: '7 days',
  startDate: 'Nov 1',
  endDate: 'Nov 7',
  frequency: 'Daily',
  isParticipating: false,
  isCompleted: false,
};

// ===== BASIC VARIANTS =====

export const Default: Story = {
  args: {
    ritual: defaultRitual,
  },
};

export const Featured: Story = {
  args: {
    ritual: defaultRitual,
    variant: 'featured',
  },
};

export const Participating: Story = {
  args: {
    ritual: {
      ...defaultRitual,
      isParticipating: true,
    },
  },
};

export const Completed: Story = {
  args: {
    ritual: {
      ...defaultRitual,
      progress: 100,
      isCompleted: true,
    },
  },
};

export const HighProgress: Story = {
  args: {
    ritual: {
      ...defaultRitual,
      progress: 85,
    },
  },
};

export const LowProgress: Story = {
  args: {
    ritual: {
      ...defaultRitual,
      progress: 15,
    },
  },
};

// ===== DIFFERENT RITUALS =====

export const FoundingClass: Story = {
  args: {
    ritual: {
      id: '2',
      name: 'Founding 100',
      description: 'Be one of the first 100 students to join HIVE and get an exclusive badge',
      icon: '⭐',
      progress: 73,
      participantCount: 73,
      duration: '3 days',
      endDate: 'Nov 5',
      frequency: 'One-time',
      isParticipating: true,
    },
    variant: 'featured',
  },
};

export const UnlockChallenge: Story = {
  args: {
    ritual: {
      id: '3',
      name: 'Unlock Anonymous',
      description: 'Post 500 times as a campus to unlock anonymous posting for everyone',
      icon: '🔓',
      progress: 42,
      participantCount: 342,
      duration: '14 days',
      endDate: 'Nov 14',
      frequency: 'Daily',
      isParticipating: false,
    },
  },
};

export const Tournament: Story = {
  args: {
    ritual: {
      id: '4',
      name: 'Best Professor',
      description: 'Vote in head-to-head matchups to crown the best professor at UB',
      icon: '👩‍🏫',
      progress: 28,
      participantCount: 856,
      duration: '10 days',
      frequency: 'Daily',
      isParticipating: true,
    },
  },
};

// ===== INTERACTIVE EXAMPLES =====

export const InteractiveJoin: Story = {
  render: () => {
    const [ritual, setRitual] = React.useState({
      ...defaultRitual,
      isParticipating: false,
      participantCount: 1247,
    });

    const handleJoin = () => {
      setRitual({
        ...ritual,
        isParticipating: true,
        participantCount: ritual.participantCount + 1,
      });
    };

    return (
      <div className="w-[350px]">
        <RitualCard ritual={ritual} onJoin={handleJoin} variant="featured" />
      </div>
    );
  },
};

export const ProgressAnimation: Story = {
  render: () => {
    const [progress, setProgress] = React.useState(0);

    React.useEffect(() => {
      const interval = setInterval(() => {
        setProgress((p) => {
          if (p >= 100) {
            clearInterval(interval);
            return 100;
          }
          return p + 5;
        });
      }, 200);

      return () => clearInterval(interval);
    }, []);

    return (
      <div className="w-[350px]">
        <RitualCard
          ritual={{
            ...defaultRitual,
            progress,
            isCompleted: progress === 100,
          }}
        />
      </div>
    );
  },
};

// ===== GRID LAYOUT =====

export const GridLayout: Story = {
  render: () => {
    const rituals = [
      {
        ...defaultRitual,
        id: '1',
        name: 'Campus Madness',
        icon: '🏀',
        progress: 65,
      },
      {
        ...defaultRitual,
        id: '2',
        name: 'Founding 100',
        icon: '⭐',
        progress: 73,
        isParticipating: true,
      },
      {
        ...defaultRitual,
        id: '3',
        name: 'Best Professor',
        icon: '👩‍🏫',
        progress: 28,
      },
      {
        ...defaultRitual,
        id: '4',
        name: 'Unlock Anonymous',
        icon: '🔓',
        progress: 42,
      },
    ];

    return (
      <div className="grid grid-cols-2 gap-4 w-[750px]">
        {rituals.map((ritual, index) => (
          <RitualCard
            key={ritual.id}
            ritual={ritual}
            variant={index === 1 ? 'featured' : 'default'}
          />
        ))}
      </div>
    );
  },
};

// ===== STATES COMPARISON =====

export const StatesComparison: Story = {
  render: () => {
    return (
      <div className="flex flex-col gap-6 w-[350px]">
        <div>
          <p className="text-xs text-[var(--hive-text-tertiary)] mb-2">Default</p>
          <RitualCard ritual={defaultRitual} />
        </div>
        <div>
          <p className="text-xs text-[var(--hive-text-tertiary)] mb-2">Featured</p>
          <RitualCard ritual={defaultRitual} variant="featured" />
        </div>
        <div>
          <p className="text-xs text-[var(--hive-text-tertiary)] mb-2">Participating</p>
          <RitualCard ritual={{ ...defaultRitual, isParticipating: true }} />
        </div>
        <div>
          <p className="text-xs text-[var(--hive-text-tertiary)] mb-2">Completed</p>
          <RitualCard ritual={{ ...defaultRitual, progress: 100, isCompleted: true }} />
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
    ritual: defaultRitual,
    variant: 'featured',
  },
};
