'use client';

import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';
import { AuthSuccessState, AuthSuccessStateCompact } from './AuthSuccessState';
import { Focus } from '../templates/Focus';

/**
 * AuthSuccessState — Minimal success celebration
 *
 * Success should feel confident, not carnival. The animation is:
 * 1. Check icon springs in with rotation (satisfying micro-moment)
 * 2. "You're in" fades up (simple statement of fact)
 * 3. Loading dots pulse (indicates redirect in progress)
 *
 * Gold is earned here - the check icon is the one gold element,
 * representing achievement (from LANGUAGE.md gold budget rules).
 *
 * @see Onboarding & Auth Vertical Slice
 */
const meta: Meta<typeof AuthSuccessState> = {
  title: 'Design System/Components/Auth/AuthSuccessState',
  component: AuthSuccessState,
  parameters: {
    layout: 'fullscreen',
    backgrounds: { default: 'dark' },
    docs: {
      description: {
        component:
          'Minimal success celebration with gold check icon, headline, and loading dots.',
      },
    },
  },
  argTypes: {
    headline: {
      control: 'text',
      description: 'Main headline text',
    },
    subtext: {
      control: 'text',
      description: 'Subtext message',
    },
    isNewUser: {
      control: 'boolean',
      description: 'Whether user is new (affects default subtext)',
    },
  },
};

export default meta;
type Story = StoryObj<typeof AuthSuccessState>;

// Wrapper component for dark background
const DarkWrapper = ({ children }: { children: React.ReactNode }) => (
  <div
    className="min-h-screen flex items-center justify-center p-8"
    style={{ backgroundColor: 'var(--color-bg-page)' }}
  >
    <div className="w-full max-w-sm">{children}</div>
  </div>
);

/**
 * Default — Returning user
 */
export const Default: Story = {
  render: () => (
    <DarkWrapper>
      <AuthSuccessState />
    </DarkWrapper>
  ),
};

/**
 * New User — Shows "Setting up your account..."
 */
export const NewUser: Story = {
  render: () => (
    <DarkWrapper>
      <AuthSuccessState isNewUser={true} />
    </DarkWrapper>
  ),
};

/**
 * Custom Headline
 */
export const CustomHeadline: Story = {
  render: () => (
    <DarkWrapper>
      <AuthSuccessState headline="Welcome back" />
    </DarkWrapper>
  ),
};

/**
 * Custom Subtext
 */
export const CustomSubtext: Story = {
  render: () => (
    <DarkWrapper>
      <AuthSuccessState
        headline="Account verified"
        subtext="Redirecting to your profile..."
      />
    </DarkWrapper>
  ),
};

/**
 * With Animation Complete Callback
 */
export const WithCallback: Story = {
  render: function CallbackStory() {
    const [triggered, setTriggered] = React.useState(false);

    return (
      <DarkWrapper>
        <div className="space-y-6">
          <AuthSuccessState
            onAnimationComplete={() => setTriggered(true)}
          />
          {triggered && (
            <div className="text-center">
              <span className="px-3 py-1 rounded-full text-label bg-[var(--color-gold)] text-black">
                Callback fired!
              </span>
            </div>
          )}
        </div>
      </DarkWrapper>
    );
  },
};

/**
 * Compact Variant
 */
export const CompactVariant: Story = {
  render: () => (
    <DarkWrapper>
      <div className="space-y-6">
        <div className="text-center text-white/50 text-body">
          Compact variant for inline use
        </div>
        <AuthSuccessStateCompact />
      </div>
    </DarkWrapper>
  ),
};

/**
 * Compact with Custom Message
 */
export const CompactCustomMessage: Story = {
  render: () => (
    <DarkWrapper>
      <div className="space-y-6">
        <div className="text-center text-white/50 text-body">
          Different compact messages
        </div>
        <div className="space-y-4">
          <AuthSuccessStateCompact message="Done" />
          <AuthSuccessStateCompact message="Saved" />
          <AuthSuccessStateCompact message="Updated" />
          <AuthSuccessStateCompact message="Complete" />
        </div>
      </div>
    </DarkWrapper>
  ),
};

/**
 * In Focus Template — Real usage
 */
export const InFocusTemplate: Story = {
  render: function FocusTemplateStory() {
    const [showSuccess, setShowSuccess] = React.useState(false);

    if (showSuccess) {
      return (
        <Focus
          mode="portal"
          atmosphere="landing"
          logo={{ position: 'hidden' }}
          background="ambient"
          maxWidth="sm"
        >
          <AuthSuccessState
            onAnimationComplete={() => {
              // In real app: router.push('/feed')
              console.log('Redirect triggered');
            }}
          />
        </Focus>
      );
    }

    return (
      <Focus
        mode="portal"
        atmosphere="landing"
        logo={{ position: 'center', variant: 'icon' }}
        background="ambient"
        maxWidth="sm"
      >
        <div className="space-y-6 text-center">
          <h1 className="text-xl font-semibold text-white">Demo</h1>
          <p className="text-body text-white/50">Click to see success state</p>
          <button
            onClick={() => setShowSuccess(true)}
            className="px-6 py-3 rounded-xl bg-white text-black font-medium"
          >
            Trigger Success
          </button>
        </div>
      </Focus>
    );
  },
};

/**
 * Animation Sequence — Watch the timing
 */
export const AnimationSequence: Story = {
  render: function SequenceStory() {
    const [key, setKey] = React.useState(0);

    return (
      <DarkWrapper>
        <div className="space-y-6">
          <div className="text-center text-body text-white/50">
            <p>Animation sequence:</p>
            <p className="mt-1 text-label">0ms: Container fade → 200ms: Check spring → 400ms: Subtext → 500ms: Dots</p>
          </div>
          <AuthSuccessState key={key} />
          <div className="text-center">
            <button
              onClick={() => setKey(k => k + 1)}
              className="px-4 py-2 rounded-lg text-body-sm bg-white/10 text-white hover:bg-white/15"
            >
              Replay Animation
            </button>
          </div>
        </div>
      </DarkWrapper>
    );
  },
};

/**
 * Side by Side Comparison
 */
export const SideBySideComparison: Story = {
  render: function ComparisonStory() {
    const [key, setKey] = React.useState(0);

    return (
      <div
        className="min-h-screen p-8"
        style={{ backgroundColor: 'var(--color-bg-page)' }}
      >
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-xl font-semibold text-white mb-2">Full vs Compact</h2>
            <button
              onClick={() => setKey(k => k + 1)}
              className="px-4 py-2 rounded-lg text-body-sm bg-white/10 text-white"
            >
              Replay Both
            </button>
          </div>
          <div className="grid md:grid-cols-2 gap-8" key={key}>
            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
              <div className="text-label text-white/40 uppercase tracking-wide mb-4">
                Full Variant
              </div>
              <AuthSuccessState />
            </div>
            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
              <div className="text-label text-white/40 uppercase tracking-wide mb-4">
                Compact Variant
              </div>
              <div className="py-8">
                <AuthSuccessStateCompact />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  },
};

/**
 * Different Contexts
 */
export const DifferentContexts: Story = {
  render: function ContextsStory() {
    const [key, setKey] = React.useState(0);

    return (
      <div
        className="min-h-screen p-8"
        style={{ backgroundColor: 'var(--color-bg-page)' }}
      >
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-xl font-semibold text-white mb-2">Usage Contexts</h2>
            <button
              onClick={() => setKey(k => k + 1)}
              className="px-4 py-2 rounded-lg text-body-sm bg-white/10 text-white"
            >
              Replay All
            </button>
          </div>
          <div className="grid gap-6" key={key}>
            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
              <div className="text-label text-white/40 uppercase tracking-wide mb-4">
                Login Success
              </div>
              <AuthSuccessState headline="You're in" subtext="Taking you home..." />
            </div>
            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
              <div className="text-label text-white/40 uppercase tracking-wide mb-4">
                Registration Complete
              </div>
              <AuthSuccessState headline="Welcome to HIVE" isNewUser={true} />
            </div>
            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
              <div className="text-label text-white/40 uppercase tracking-wide mb-4">
                Email Verified
              </div>
              <AuthSuccessState headline="Email verified" subtext="Setting up your account..." />
            </div>
            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
              <div className="text-label text-white/40 uppercase tracking-wide mb-4">
                Password Reset
              </div>
              <AuthSuccessState headline="Password updated" subtext="Signing you in..." />
            </div>
          </div>
        </div>
      </div>
    );
  },
};

/**
 * Gold Budget Demo — The only gold element
 */
export const GoldBudgetDemo: Story = {
  render: () => (
    <DarkWrapper>
      <div className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-lg font-semibold text-white">Gold Budget</h2>
          <p className="text-body-sm text-white/50 max-w-[280px] mx-auto">
            The check icon is the only gold element. Gold is earned through achievement, not decoration.
          </p>
        </div>
        <AuthSuccessState />
        <div className="text-center">
          <p className="text-label text-white/30">
            From LANGUAGE.md: Gold indicates "life" and achievement
          </p>
        </div>
      </div>
    </DarkWrapper>
  ),
};
