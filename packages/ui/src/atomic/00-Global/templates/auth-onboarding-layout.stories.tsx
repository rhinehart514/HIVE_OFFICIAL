'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { AuthOnboardingLayout } from './auth-onboarding-layout';
import { OnboardingFrame } from '../molecules/onboarding-frame';
import { Button } from '../atoms/button';
import { Input } from '../atoms/input';
import { Label } from '../atoms/label';

/**
 * AuthOnboardingLayout - Full-screen layout for authentication and onboarding flows
 *
 * Provides a consistent container with dynamic background gradients based on mode.
 * Supports header and footer slots for navigation elements.
 */
const meta = {
  title: '00-Global/Templates/AuthOnboardingLayout',
  component: AuthOnboardingLayout,
  parameters: {
    layout: 'fullscreen',
    backgrounds: { default: 'dark' },
  },
  tags: ['autodocs'],
  argTypes: {
    mode: {
      control: 'select',
      options: ['calm', 'warm', 'celebrate'],
      description: 'Visual mode affecting background gradient',
    },
  },
} satisfies Meta<typeof AuthOnboardingLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

// Reusable header component
const SimpleHeader = () => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2">
      <div className="h-8 w-8 rounded-lg bg-[var(--hive-brand-primary)] flex items-center justify-center">
        <span className="font-bold text-black">H</span>
      </div>
      <span className="font-semibold text-[var(--hive-text-primary)]">HIVE</span>
    </div>
    <Button variant="ghost" size="sm" onClick={action('help-clicked')}>
      Need Help?
    </Button>
  </div>
);

// Reusable footer component
const SimpleFooter = () => (
  <div className="flex items-center justify-between text-sm text-[var(--hive-text-tertiary)]">
    <span>&copy; 2025 HIVE</span>
    <div className="flex gap-4">
      <button className="hover:text-[var(--hive-text-secondary)] transition-colors">
        Privacy
      </button>
      <button className="hover:text-[var(--hive-text-secondary)] transition-colors">
        Terms
      </button>
    </div>
  </div>
);

// Login form content
const LoginFormContent = () => (
  <div className="mx-auto max-w-sm">
    <div className="text-center mb-8">
      <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-[var(--hive-brand-primary)] flex items-center justify-center">
        <span className="text-2xl font-bold text-black">H</span>
      </div>
      <h1 className="text-2xl font-semibold text-[var(--hive-text-primary)] mb-2">
        Welcome back
      </h1>
      <p className="text-[var(--hive-text-secondary)]">
        Sign in to your HIVE account
      </p>
    </div>
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-[var(--hive-text-secondary)]">
          Email
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="your.name@buffalo.edu"
          className="bg-[var(--hive-background-secondary)]"
        />
      </div>
      <Button variant="primary" className="w-full" onClick={action('login')}>
        Continue with Email
      </Button>
      <p className="text-xs text-center text-[var(--hive-text-tertiary)]">
        We'll send you a magic link to sign in
      </p>
    </div>
  </div>
);

/**
 * Default layout with simple content
 */
export const Default: Story = {
  args: {
    mode: 'calm',
    children: (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-semibold text-[var(--hive-text-primary)] mb-4">
            Auth Layout Content
          </h1>
          <p className="text-[var(--hive-text-secondary)]">
            This is the main content area of the layout.
          </p>
        </div>
      </div>
    ),
  },
};

/**
 * Calm mode - subtle neutral gradient for standard flows
 */
export const ModeCalm: Story = {
  args: {
    mode: 'calm',
    children: <LoginFormContent />,
  },
};

/**
 * Warm mode - gold-tinted gradient for welcoming experiences
 */
export const ModeWarm: Story = {
  args: {
    mode: 'warm',
    children: (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center max-w-md">
          <h1 className="text-3xl font-semibold text-[var(--hive-text-primary)] mb-4">
            Almost there!
          </h1>
          <p className="text-[var(--hive-text-secondary)] mb-6">
            Just a few more steps to complete your profile and join the HIVE community.
          </p>
          <Button variant="primary" onClick={action('continue')}>
            Continue Setup
          </Button>
        </div>
      </div>
    ),
  },
};

/**
 * Celebrate mode - stronger gold gradient for completion moments
 */
export const ModeCelebrate: Story = {
  args: {
    mode: 'celebrate',
    children: (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center max-w-md">
          <div className="mx-auto mb-6 h-20 w-20 rounded-full bg-[var(--hive-brand-primary)] flex items-center justify-center">
            <svg
              className="w-10 h-10 text-black"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-semibold text-[var(--hive-text-primary)] mb-4">
            Welcome to HIVE!
          </h1>
          <p className="text-[var(--hive-text-secondary)] mb-6">
            Your account is all set up. You're ready to explore campus communities.
          </p>
          <Button variant="primary" onClick={action('get-started')}>
            Get Started
          </Button>
        </div>
      </div>
    ),
  },
};

/**
 * With header slot populated
 */
export const WithHeader: Story = {
  args: {
    mode: 'calm',
    headerSlot: <SimpleHeader />,
    children: <LoginFormContent />,
  },
};

/**
 * With footer slot populated
 */
export const WithFooter: Story = {
  args: {
    mode: 'calm',
    footerSlot: <SimpleFooter />,
    children: <LoginFormContent />,
  },
};

/**
 * With both header and footer slots
 */
export const WithHeaderAndFooter: Story = {
  args: {
    mode: 'calm',
    headerSlot: <SimpleHeader />,
    footerSlot: <SimpleFooter />,
    children: <LoginFormContent />,
  },
};

/**
 * Realistic login page example
 */
export const LoginExample: Story = {
  args: {
    mode: 'calm',
    headerSlot: <SimpleHeader />,
    footerSlot: <SimpleFooter />,
    children: (
      <div className="flex min-h-[70vh] items-center justify-center">
        <LoginFormContent />
      </div>
    ),
  },
};

/**
 * With OnboardingFrame inside - typical onboarding step
 */
export const OnboardingStepExample: Story = {
  args: {
    mode: 'warm',
    headerSlot: <SimpleHeader />,
    children: (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="w-full max-w-md">
          <OnboardingFrame
            step={1}
            totalSteps={4}
            title="Choose your interests"
            description="Select topics you'd like to explore on HIVE."
            onBack={action('back')}
            onContinue={action('continue')}
          >
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
          </OnboardingFrame>
        </div>
      </div>
    ),
  },
};

/**
 * Full onboarding flow with celebrate completion
 */
export const OnboardingCompleteExample: Story = {
  args: {
    mode: 'celebrate',
    headerSlot: <SimpleHeader />,
    footerSlot: <SimpleFooter />,
    children: (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="w-full max-w-md">
          <OnboardingFrame
            step={3}
            totalSteps={4}
            mode="celebrate"
            title="You're all set!"
            description="Welcome to the HIVE community."
            onBack={action('back')}
            onContinue={action('get-started')}
            continueLabel="Explore HIVE"
          >
            <div className="text-center py-8">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-[var(--hive-brand-primary)] flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-black"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <p className="text-[var(--hive-text-secondary)]">
                You've joined 3 spaces and connected with the HIVE community.
              </p>
            </div>
          </OnboardingFrame>
        </div>
      </div>
    ),
  },
};
