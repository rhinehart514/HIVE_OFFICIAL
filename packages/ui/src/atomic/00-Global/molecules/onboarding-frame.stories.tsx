'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { OnboardingFrame } from './onboarding-frame';
import { Input } from '../atoms/input';
import { Label } from '../atoms/label';

/**
 * OnboardingFrame - Frame component for individual onboarding steps
 *
 * Used for multi-step onboarding flows with progress tracking,
 * navigation buttons, and dynamic styling based on mode.
 */
const meta = {
  title: '00-Global/Molecules/OnboardingFrame',
  component: OnboardingFrame,
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'dark' },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="min-h-screen bg-[#0A0A0A] p-8 flex items-center justify-center">
        <div className="w-full max-w-md">
          <Story />
        </div>
      </div>
    ),
  ],
  argTypes: {
    mode: {
      control: 'select',
      options: ['calm', 'warm', 'celebrate'],
      description: 'Visual mode affecting title color and overall feel',
    },
    step: {
      control: { type: 'number', min: 0, max: 10 },
      description: 'Current step (0-indexed)',
    },
    totalSteps: {
      control: { type: 'number', min: 1, max: 10 },
      description: 'Total number of steps',
    },
    continueDisabled: {
      control: 'boolean',
      description: 'Disable the continue button',
    },
    isSubmitting: {
      control: 'boolean',
      description: 'Show loading state on continue button',
    },
  },
} satisfies Meta<typeof OnboardingFrame>;

export default meta;
type Story = StoryObj<typeof meta>;

// Sample content for stories
const SampleContent = () => (
  <div className="space-y-4">
    <div className="space-y-2">
      <Label htmlFor="name" className="text-[var(--hive-text-secondary)]">
        Your Name
      </Label>
      <Input
        id="name"
        placeholder="Enter your name"
        className="bg-[var(--hive-background-tertiary)]"
      />
    </div>
    <p className="text-sm text-[var(--hive-text-tertiary)]">
      This information helps personalize your experience.
    </p>
  </div>
);

/**
 * Default onboarding frame with basic content
 */
export const Default: Story = {
  args: {
    step: 0,
    totalSteps: 4,
    title: 'Welcome to HIVE',
    description: 'Let\'s get you set up with your new account.',
    onBack: undefined,
    onContinue: action('continue'),
    children: <SampleContent />,
  },
};

/**
 * Calm mode - default styling with neutral title color
 */
export const ModeCalm: Story = {
  args: {
    ...Default.args,
    mode: 'calm',
    title: 'Tell us about yourself',
    description: 'Help us customize your experience.',
  },
};

/**
 * Warm mode - gold-tinted title for welcoming steps
 */
export const ModeWarm: Story = {
  args: {
    ...Default.args,
    mode: 'warm',
    title: 'Almost there!',
    description: 'Just a few more details to complete your profile.',
  },
};

/**
 * Celebrate mode - celebratory styling for completion steps
 */
export const ModeCelebrate: Story = {
  args: {
    ...Default.args,
    mode: 'celebrate',
    step: 3,
    totalSteps: 4,
    title: 'You\'re all set!',
    description: 'Welcome to the HIVE community.',
    continueLabel: 'Get Started',
  },
};

/**
 * Middle step with progress shown and back button visible
 */
export const WithProgress: Story = {
  args: {
    step: 1,
    totalSteps: 4,
    title: 'Choose your interests',
    description: 'Select topics you\'d like to explore.',
    onBack: action('back'),
    onContinue: action('continue'),
    children: (
      <div className="grid grid-cols-2 gap-2">
        {['Technology', 'Design', 'Business', 'Science', 'Arts', 'Sports'].map(
          (interest) => (
            <button
              key={interest}
              className="rounded-lg border border-[var(--hive-border-default)] bg-[var(--hive-background-tertiary)] px-4 py-3 text-sm text-[var(--hive-text-primary)] hover:border-[var(--hive-brand-primary)] transition-colors"
            >
              {interest}
            </button>
          )
        )}
      </div>
    ),
  },
};

/**
 * First step - no back button shown
 */
export const FirstStep: Story = {
  args: {
    step: 0,
    totalSteps: 4,
    title: 'Welcome to HIVE',
    description: 'The platform for campus communities.',
    onBack: undefined,
    onContinue: action('continue'),
    children: (
      <div className="text-center py-8">
        <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-[var(--hive-brand-primary)] flex items-center justify-center">
          <span className="text-2xl font-bold text-black">H</span>
        </div>
        <p className="text-[var(--hive-text-secondary)]">
          Join thousands of students building communities.
        </p>
      </div>
    ),
  },
};

/**
 * Last step - continue button shows "Finish"
 */
export const LastStep: Story = {
  args: {
    step: 3,
    totalSteps: 4,
    title: 'Review your profile',
    description: 'Make sure everything looks good.',
    mode: 'warm',
    onBack: action('back'),
    onContinue: action('finish'),
    continueLabel: 'Finish',
    children: (
      <div className="space-y-3 rounded-lg bg-[var(--hive-background-tertiary)] p-4">
        <div className="flex justify-between">
          <span className="text-[var(--hive-text-tertiary)]">Name</span>
          <span className="text-[var(--hive-text-primary)]">Alex Johnson</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--hive-text-tertiary)]">Email</span>
          <span className="text-[var(--hive-text-primary)]">alex@buffalo.edu</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--hive-text-tertiary)]">Role</span>
          <span className="text-[var(--hive-text-primary)]">Student</span>
        </div>
      </div>
    ),
  },
};

/**
 * Loading/submitting state - spinner shown on continue button
 */
export const Submitting: Story = {
  args: {
    step: 2,
    totalSteps: 4,
    title: 'Saving your preferences',
    description: 'Please wait while we update your profile.',
    onBack: action('back'),
    onContinue: action('continue'),
    isSubmitting: true,
    children: (
      <div className="py-8 text-center text-[var(--hive-text-secondary)]">
        Your preferences are being saved...
      </div>
    ),
  },
};

/**
 * Continue button disabled - validation not met
 */
export const DisabledContinue: Story = {
  args: {
    step: 1,
    totalSteps: 4,
    title: 'Enter your details',
    description: 'All fields are required.',
    onBack: action('back'),
    onContinue: action('continue'),
    continueDisabled: true,
    children: (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-[var(--hive-text-secondary)]">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="your.name@buffalo.edu"
            className="bg-[var(--hive-background-tertiary)]"
          />
        </div>
        <p className="text-xs text-[var(--hive-status-error)]">
          Please enter a valid email address to continue.
        </p>
      </div>
    ),
  },
};

/**
 * Minimal frame with no title or description
 */
export const MinimalContent: Story = {
  args: {
    step: 0,
    totalSteps: 3,
    onContinue: action('continue'),
    children: (
      <div className="py-12 text-center">
        <h3 className="text-lg font-medium text-[var(--hive-text-primary)] mb-2">
          Custom Content Only
        </h3>
        <p className="text-sm text-[var(--hive-text-secondary)]">
          The frame can be used without title/description props.
        </p>
      </div>
    ),
  },
};
