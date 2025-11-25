'use client';

import * as React from 'react';

import { ProfileCompletionCard, type ProfileCompletionStep } from './profile-completion-card';

import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: '04-Profile/Organisms/ProfileCompletionCard',
  component: ProfileCompletionCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A gamified profile completion card with stagger animations, spring physics progress bar, and completion celebration. Encourages students to complete their campus profile with delightful micro-interactions.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    completionPercentage: {
      control: { type: 'range', min: 0, max: 100, step: 5 },
      description: 'Current completion percentage',
    },
  },
} satisfies Meta<typeof ProfileCompletionCard>;

export default meta;
type Story = StoryObj<typeof meta>;

// ===== BASIC VARIANTS =====

export const Default: Story = {
  args: {
    completionPercentage: 40,
    completedSteps: ['avatar', 'bio'],
  },
};

export const JustStarted: Story = {
  args: {
    completionPercentage: 15,
    completedSteps: ['avatar'],
  },
};

export const HalfwayThere: Story = {
  args: {
    completionPercentage: 50,
    completedSteps: ['avatar', 'bio', 'academic'],
  },
};

export const AlmostDone: Story = {
  args: {
    completionPercentage: 85,
    completedSteps: ['avatar', 'bio', 'academic', 'housing', 'interests'],
  },
};

export const Completed: Story = {
  args: {
    completionPercentage: 100,
    completedSteps: ['avatar', 'bio', 'academic', 'housing', 'interests', 'spaces'],
  },
};

// ===== INTERACTIVE EXAMPLES =====

export const InteractiveCompletion: Story = {
  render: () => {
    const allSteps = [
      { id: 'avatar', title: 'Add a profile photo' },
      { id: 'bio', title: 'Share a short bio' },
      { id: 'academic', title: 'Confirm academic details' },
      { id: 'housing', title: 'Add housing or residency' },
      { id: 'interests', title: 'Select your interests' },
      { id: 'spaces', title: 'Join 3+ spaces' },
    ];

    const [completedSteps, setCompletedSteps] = React.useState<string[]>([]);

    const handleStepClick = (stepId: string) => {
      setCompletedSteps((prev) => [...prev, stepId]);
    };

    const completionPercentage = (completedSteps.length / allSteps.length) * 100;

    return (
      <div className="w-[400px]">
        <ProfileCompletionCard
          completionPercentage={completionPercentage}
          completedSteps={completedSteps}
          steps={allSteps}
          onStepClick={handleStepClick}
        />
      </div>
    );
  },
};

export const WithCustomSteps: Story = {
  render: () => {
    const customSteps: ProfileCompletionStep[] = [
      { id: 'verify_email', title: 'Verify your @buffalo.edu email' },
      { id: 'add_photo', title: 'Upload a profile photo' },
      { id: 'join_communities', title: 'Join your first 3 communities' },
      { id: 'make_post', title: 'Create your first post' },
      { id: 'connect', title: 'Connect with 5 students' },
    ];

    const [completed, setCompleted] = React.useState<string[]>(['verify_email']);

    return (
      <div className="w-[400px]">
        <ProfileCompletionCard
          completionPercentage={(completed.length / customSteps.length) * 100}
          completedSteps={completed}
          steps={customSteps}
          onStepClick={(id) => setCompleted([...completed, id])}
        />
      </div>
    );
  },
};

export const ProgressAnimation: Story = {
  render: () => {
    const [progress, setProgress] = React.useState(0);
    const [completedSteps, setCompletedSteps] = React.useState<string[]>([]);

    const allSteps = ['avatar', 'bio', 'academic', 'housing', 'interests', 'spaces'];

    React.useEffect(() => {
      const interval = setInterval(() => {
        setProgress((p) => {
          const newProgress = p + 15;
          if (newProgress >= 100) {
            clearInterval(interval);
            setCompletedSteps(allSteps);
            return 100;
          }

          // Add completed steps based on progress
          const stepsToComplete = Math.floor((newProgress / 100) * allSteps.length);
          setCompletedSteps(allSteps.slice(0, stepsToComplete));

          return newProgress;
        });
      }, 1000);

      return () => clearInterval(interval);
    }, []);

    return (
      <div className="w-[400px] space-y-4">
        <p className="text-sm text-[var(--hive-text-secondary)] text-center">
          Watch the progress bar animate with spring physics
        </p>
        <ProfileCompletionCard
          completionPercentage={progress}
          completedSteps={completedSteps}
        />
      </div>
    );
  },
};

export const StaggerDemo: Story = {
  render: () => {
    const [show, setShow] = React.useState(false);

    React.useEffect(() => {
      setShow(true);
    }, []);

    return (
      <div className="w-[400px] space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-[var(--hive-text-secondary)]">
            Steps appear with cascading delay
          </p>
          <button
            onClick={() => setShow(!show)}
            className="px-3 py-1 rounded-lg bg-[var(--hive-brand-primary)] text-xs font-medium"
          >
            {show ? 'Hide' : 'Show'}
          </button>
        </div>
        {show && (
          <ProfileCompletionCard
            completionPercentage={35}
            completedSteps={['avatar', 'bio']}
          />
        )}
      </div>
    );
  },
};

// ===== COMPARISON =====

export const CompletionStages: Story = {
  render: () => {
    return (
      <div className="flex flex-col gap-6 w-[400px]">
        <div>
          <p className="text-xs text-[var(--hive-text-tertiary)] mb-2">Just started (15%)</p>
          <ProfileCompletionCard
            completionPercentage={15}
            completedSteps={['avatar']}
          />
        </div>
        <div>
          <p className="text-xs text-[var(--hive-text-tertiary)] mb-2">Halfway (50%)</p>
          <ProfileCompletionCard
            completionPercentage={50}
            completedSteps={['avatar', 'bio', 'academic']}
          />
        </div>
        <div>
          <p className="text-xs text-[var(--hive-text-tertiary)] mb-2">Almost done (85%)</p>
          <ProfileCompletionCard
            completionPercentage={85}
            completedSteps={['avatar', 'bio', 'academic', 'housing', 'interests']}
          />
        </div>
        <div>
          <p className="text-xs text-[var(--hive-text-tertiary)] mb-2">Complete! (100%)</p>
          <ProfileCompletionCard
            completionPercentage={100}
            completedSteps={['avatar', 'bio', 'academic', 'housing', 'interests', 'spaces']}
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
    completionPercentage: 60,
    completedSteps: ['avatar', 'bio', 'academic'],
  },
};
