'use client';

import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';
import { OTPInput } from './OTPInput';

/**
 * OTPInput — Premium 6-digit verification code input
 *
 * Features progressive gold animation as digits are entered.
 * Each filled digit intensifies the warmth across all inputs.
 *
 * Gold rules (from LANGUAGE.md):
 * - Gold indicates "life" and achievement
 * - Progressive intensity = building toward completion
 * - Never decorative, always earned through action
 *
 * @see Onboarding & Auth Vertical Slice
 */
const meta: Meta<typeof OTPInput> = {
  title: 'Design System/Components/Auth/OTPInput',
  component: OTPInput,
  parameters: {
    layout: 'fullscreen',
    backgrounds: { default: 'dark' },
    docs: {
      description: {
        component:
          'Premium 6-digit OTP input with progressive gold animation. As digits are entered, gold intensity increases.',
      },
    },
  },
  argTypes: {
    length: {
      control: { type: 'number', min: 4, max: 8 },
      description: 'Number of digits',
    },
    showProgress: {
      control: 'boolean',
      description: 'Show progress dots below input',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable all inputs',
    },
    autoFocus: {
      control: 'boolean',
      description: 'Auto-focus first input',
    },
  },
};

export default meta;
type Story = StoryObj<typeof OTPInput>;

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
 * Default — Empty state
 */
export const Default: Story = {
  render: function DefaultStory() {
    const [value, setValue] = React.useState(['', '', '', '', '', '']);

    return (
      <DarkWrapper>
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-xl font-semibold text-white">Enter your code</h1>
            <p className="text-body text-white/50">Check your inbox for a 6-digit code</p>
          </div>
          <OTPInput
            value={value}
            onChange={setValue}
            onComplete={(code) => console.log('Complete:', code)}
          />
        </div>
      </DarkWrapper>
    );
  },
};

/**
 * Partially Filled — Shows progressive gold
 */
export const PartiallyFilled: Story = {
  render: function PartiallyFilledStory() {
    const [value, setValue] = React.useState(['1', '2', '3', '', '', '']);

    return (
      <DarkWrapper>
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-xl font-semibold text-white">Half complete</h1>
            <p className="text-body text-white/50">Gold intensity at 50%</p>
          </div>
          <OTPInput
            value={value}
            onChange={setValue}
            onComplete={(code) => alert(`Code: ${code}`)}
          />
        </div>
      </DarkWrapper>
    );
  },
};

/**
 * Fully Filled — Maximum gold intensity
 */
export const FullyFilled: Story = {
  render: function FullyFilledStory() {
    const [value, setValue] = React.useState(['1', '2', '3', '4', '5', '6']);

    return (
      <DarkWrapper>
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-xl font-semibold text-white">Code complete</h1>
            <p className="text-body text-white/50">Maximum gold intensity</p>
          </div>
          <OTPInput
            value={value}
            onChange={setValue}
            onComplete={(code) => alert(`Verifying: ${code}`)}
          />
        </div>
      </DarkWrapper>
    );
  },
};

/**
 * Error State — Invalid code
 */
export const ErrorState: Story = {
  render: function ErrorStory() {
    const [value, setValue] = React.useState(['1', '2', '3', '4', '5', '6']);

    return (
      <DarkWrapper>
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-xl font-semibold text-white">Invalid code</h1>
            <p className="text-body text-white/50">Try again</p>
          </div>
          <OTPInput
            value={value}
            onChange={setValue}
            error="That code didn't work. Please try again."
          />
        </div>
      </DarkWrapper>
    );
  },
};

/**
 * Verifying State — Loading indicator
 */
export const VerifyingState: Story = {
  render: function VerifyingStory() {
    const [value, setValue] = React.useState(['1', '2', '3', '4', '5', '6']);

    return (
      <DarkWrapper>
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-xl font-semibold text-white">Checking code</h1>
            <p className="text-body text-white/50">Please wait...</p>
          </div>
          <OTPInput
            value={value}
            onChange={setValue}
            isVerifying={true}
          />
        </div>
      </DarkWrapper>
    );
  },
};

/**
 * Disabled State
 */
export const DisabledState: Story = {
  render: function DisabledStory() {
    const [value, setValue] = React.useState(['1', '2', '', '', '', '']);

    return (
      <DarkWrapper>
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-xl font-semibold text-white">Disabled</h1>
            <p className="text-body text-white/50">Inputs are not interactive</p>
          </div>
          <OTPInput
            value={value}
            onChange={setValue}
            disabled={true}
          />
        </div>
      </DarkWrapper>
    );
  },
};

/**
 * Without Progress Dots
 */
export const WithoutProgressDots: Story = {
  render: function NoProgressStory() {
    const [value, setValue] = React.useState(['1', '2', '3', '', '', '']);

    return (
      <DarkWrapper>
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-xl font-semibold text-white">No progress dots</h1>
            <p className="text-body text-white/50">Cleaner appearance</p>
          </div>
          <OTPInput
            value={value}
            onChange={setValue}
            showProgress={false}
          />
        </div>
      </DarkWrapper>
    );
  },
};

/**
 * 4-Digit Code
 */
export const FourDigitCode: Story = {
  render: function FourDigitStory() {
    const [value, setValue] = React.useState(['', '', '', '']);

    return (
      <DarkWrapper>
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-xl font-semibold text-white">4-digit code</h1>
            <p className="text-body text-white/50">Shorter verification</p>
          </div>
          <OTPInput
            length={4}
            value={value}
            onChange={setValue}
            onComplete={(code) => alert(`Code: ${code}`)}
          />
        </div>
      </DarkWrapper>
    );
  },
};

/**
 * 8-Digit Code
 */
export const EightDigitCode: Story = {
  render: function EightDigitStory() {
    const [value, setValue] = React.useState(['', '', '', '', '', '', '', '']);

    return (
      <DarkWrapper>
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-xl font-semibold text-white">8-digit code</h1>
            <p className="text-body text-white/50">Extended verification</p>
          </div>
          <OTPInput
            length={8}
            value={value}
            onChange={setValue}
            onComplete={(code) => alert(`Code: ${code}`)}
          />
        </div>
      </DarkWrapper>
    );
  },
};

/**
 * Progressive Gold Demo — Watch the gold increase
 */
export const ProgressiveGoldDemo: Story = {
  render: function ProgressiveGoldStory() {
    const [value, setValue] = React.useState<string[]>(['', '', '', '', '', '']);
    const filledCount = value.filter(Boolean).length;

    const fillNext = () => {
      const nextIndex = value.findIndex((v) => !v);
      if (nextIndex !== -1) {
        const newValue = [...value];
        newValue[nextIndex] = String((nextIndex + 1) % 10);
        setValue(newValue);
      }
    };

    const clearAll = () => {
      setValue(['', '', '', '', '', '']);
    };

    return (
      <DarkWrapper>
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-xl font-semibold text-white">Progressive Gold</h1>
            <p className="text-body text-white/50">
              Gold intensity: {Math.round((filledCount / 6) * 100)}%
            </p>
          </div>
          <OTPInput
            value={value}
            onChange={setValue}
            onComplete={(code) => alert(`Complete: ${code}`)}
          />
          <div className="flex gap-3 justify-center">
            <button
              onClick={fillNext}
              disabled={filledCount === 6}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-white text-black disabled:opacity-30"
            >
              Fill Next
            </button>
            <button
              onClick={clearAll}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-white/10 text-white"
            >
              Clear All
            </button>
          </div>
        </div>
      </DarkWrapper>
    );
  },
};


/**
 * Paste Behavior Demo
 */
export const PasteBehavior: Story = {
  render: function PasteStory() {
    const [value, setValue] = React.useState(['', '', '', '', '', '']);

    return (
      <DarkWrapper>
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-xl font-semibold text-white">Paste Support</h1>
            <p className="text-body text-white/50">Try pasting: 123456</p>
          </div>
          <OTPInput
            value={value}
            onChange={setValue}
            onComplete={(code) => alert(`Pasted: ${code}`)}
          />
          <div className="text-center">
            <button
              onClick={() => {
                navigator.clipboard.writeText('987654');
                alert('987654 copied to clipboard. Now paste into input!');
              }}
              className="text-body-sm text-white/40 hover:text-white/60"
            >
              Copy test code to clipboard
            </button>
          </div>
        </div>
      </DarkWrapper>
    );
  },
};
