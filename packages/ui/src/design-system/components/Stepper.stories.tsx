'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { Stepper, DotStepper, ProgressStepper } from './Stepper';
import { Button } from '../primitives';
import * as React from 'react';

const meta: Meta<typeof Stepper> = {
  title: 'Design System/Components/Stepper',
  component: Stepper,
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'dark' },
  },
  decorators: [
    (Story) => (
      <div className="p-8 w-[600px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Stepper>;

const basicSteps = [
  { label: 'Account' },
  { label: 'Profile' },
  { label: 'Review' },
  { label: 'Complete' },
];

/**
 * Default horizontal stepper.
 */
export const Default: StoryObj = {
  render: function StepperDemo() {
    const [step, setStep] = React.useState(1);
    return (
      <div className="space-y-6">
        <Stepper
          steps={basicSteps}
          currentStep={step}
          onStepChange={setStep}
        />
        <div className="flex justify-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
          >
            Previous
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setStep(Math.min(basicSteps.length - 1, step + 1))}
            disabled={step === basicSteps.length - 1}
          >
            Next
          </Button>
        </div>
      </div>
    );
  },
};

/**
 * Stepper sizes.
 */
export const Sizes: StoryObj = {
  render: () => (
    <div className="space-y-8">
      <div>
        <p className="text-xs text-[var(--color-text-muted)] mb-3">Small</p>
        <Stepper steps={basicSteps} currentStep={1} size="sm" />
      </div>
      <div>
        <p className="text-xs text-[var(--color-text-muted)] mb-3">Medium (default)</p>
        <Stepper steps={basicSteps} currentStep={1} size="md" />
      </div>
      <div>
        <p className="text-xs text-[var(--color-text-muted)] mb-3">Large</p>
        <Stepper steps={basicSteps} currentStep={1} size="lg" />
      </div>
    </div>
  ),
};

/**
 * With descriptions.
 */
export const WithDescriptions: Story = {
  args: {
    currentStep: 1,
    showDescriptions: true,
    steps: [
      { label: 'Account', description: 'Create your account' },
      { label: 'Profile', description: 'Set up profile' },
      { label: 'Review', description: 'Confirm details' },
      { label: 'Complete', description: 'You\'re done!' },
    ],
  },
};

/**
 * With custom icons.
 */
export const WithIcons: Story = {
  args: {
    currentStep: 2,
    steps: [
      { label: 'Email', icon: '📧' },
      { label: 'Profile', icon: '👤' },
      { label: 'Settings', icon: '⚙️' },
      { label: 'Done', icon: '🎉' },
    ],
  },
};

/**
 * With error state.
 */
export const WithError: Story = {
  args: {
    currentStep: 2,
    steps: [
      { label: 'Account' },
      { label: 'Payment', error: true },
      { label: 'Review' },
      { label: 'Complete' },
    ],
  },
};

/**
 * All completed.
 */
export const AllCompleted: Story = {
  args: {
    currentStep: 4,
    steps: basicSteps,
  },
};

/**
 * Vertical stepper.
 */
export const Vertical: StoryObj = {
  render: function VerticalDemo() {
    const [step, setStep] = React.useState(1);
    const steps = [
      { label: 'Create Account', description: 'Enter your email and password' },
      { label: 'Personal Info', description: 'Tell us about yourself' },
      { label: 'Preferences', description: 'Set up your preferences' },
      { label: 'Complete', description: 'You\'re all set!' },
    ];

    return (
      <div className="flex gap-8">
        <Stepper
          steps={steps}
          currentStep={step}
          orientation="vertical"
          showDescriptions
          onStepChange={setStep}
        />
        <div className="flex-1 p-4 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)]">
          <h3 className="font-medium text-white mb-2">{steps[step].label}</h3>
          <p className="text-sm text-[var(--color-text-muted)] mb-4">{steps[step].description}</p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setStep(Math.max(0, step - 1))}
              disabled={step === 0}
            >
              Back
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setStep(Math.min(steps.length - 1, step + 1))}
              disabled={step === steps.length - 1}
            >
              Continue
            </Button>
          </div>
        </div>
      </div>
    );
  },
};

/**
 * Vertical with content.
 */
export const VerticalWithContent: Story = {
  args: {
    orientation: 'vertical',
    currentStep: 1,
    steps: [
      {
        label: 'Step 1',
        description: 'Account setup',
        content: (
          <div className="p-3 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-sm text-[var(--color-text-muted)]">
            Account configuration complete ✓
          </div>
        ),
      },
      {
        label: 'Step 2',
        description: 'Profile info',
        content: (
          <div className="p-3 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)]">
            <input
              type="text"
              placeholder="Enter your name"
              className="w-full bg-transparent text-white text-sm placeholder:text-[var(--color-text-muted)] outline-none"
            />
          </div>
        ),
      },
      { label: 'Step 3', description: 'Review' },
      { label: 'Step 4', description: 'Complete' },
    ],
  },
};

/**
 * Without labels.
 */
export const NoLabels: Story = {
  args: {
    currentStep: 2,
    showLabels: false,
    steps: basicSteps,
  },
};

/**
 * DotStepper - simple dots.
 */
export const Dots: StoryObj = {
  render: function DotsDemo() {
    const [step, setStep] = React.useState(2);
    return (
      <div className="space-y-6">
        <div className="flex justify-center">
          <DotStepper
            totalSteps={5}
            currentStep={step}
            onStepChange={setStep}
          />
        </div>
        <div className="flex justify-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setStep(Math.max(0, step - 1))}
          >
            Prev
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setStep(Math.min(4, step + 1))}
          >
            Next
          </Button>
        </div>
      </div>
    );
  },
};

/**
 * DotStepper sizes.
 */
export const DotSizes: StoryObj = {
  render: () => (
    <div className="space-y-6">
      <div>
        <p className="text-xs text-[var(--color-text-muted)] mb-2">Small</p>
        <DotStepper totalSteps={5} currentStep={2} size="sm" />
      </div>
      <div>
        <p className="text-xs text-[var(--color-text-muted)] mb-2">Medium</p>
        <DotStepper totalSteps={5} currentStep={2} size="md" />
      </div>
      <div>
        <p className="text-xs text-[var(--color-text-muted)] mb-2">Large</p>
        <DotStepper totalSteps={5} currentStep={2} size="lg" />
      </div>
    </div>
  ),
};

/**
 * ProgressStepper - bar style.
 */
export const Progress: StoryObj = {
  render: function ProgressDemo() {
    const [step, setStep] = React.useState(1);
    const totalSteps = 5;
    return (
      <div className="space-y-6">
        <ProgressStepper
          currentStep={step}
          totalSteps={totalSteps}
          showPercentage
        />
        <div className="flex justify-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setStep(Math.max(0, step - 1))}
          >
            Prev
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setStep(Math.min(totalSteps - 1, step + 1))}
          >
            Next
          </Button>
        </div>
      </div>
    );
  },
};

/**
 * ProgressStepper sizes.
 */
export const ProgressSizes: StoryObj = {
  render: () => (
    <div className="space-y-4">
      <ProgressStepper currentStep={2} totalSteps={5} size="sm" showPercentage />
      <ProgressStepper currentStep={2} totalSteps={5} size="md" showPercentage />
      <ProgressStepper currentStep={2} totalSteps={5} size="lg" showPercentage />
    </div>
  ),
};

/**
 * Onboarding wizard example.
 */
export const OnboardingExample: StoryObj = {
  render: function OnboardingDemo() {
    const [step, setStep] = React.useState(0);
    const steps = [
      { label: 'Welcome' },
      { label: 'Profile' },
      { label: 'Interests' },
      { label: 'Spaces' },
    ];

    const stepContent = [
      'Welcome to HIVE! Let\'s get you set up.',
      'Tell us a bit about yourself.',
      'What are you interested in?',
      'Join some spaces to get started.',
    ];

    return (
      <div className="p-6 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)]">
        <Stepper
          steps={steps}
          currentStep={step}
          size="sm"
          className="mb-6"
        />
        <div className="min-h-24 mb-6">
          <h2 className="text-lg font-semibold text-white mb-2">{steps[step].label}</h2>
          <p className="text-sm text-[var(--color-text-muted)]">{stepContent[step]}</p>
        </div>
        <div className="flex justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStep(step - 1)}
            disabled={step === 0}
          >
            Back
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setStep(step + 1)}
            disabled={step === steps.length - 1}
          >
            {step === steps.length - 1 ? 'Complete' : 'Continue'}
          </Button>
        </div>
      </div>
    );
  },
};

/**
 * Checkout flow example.
 */
export const CheckoutExample: StoryObj = {
  render: function CheckoutDemo() {
    const [step, setStep] = React.useState(1);
    const steps = [
      { label: 'Cart', icon: '🛒' },
      { label: 'Shipping', icon: '📦' },
      { label: 'Payment', icon: '💳' },
      { label: 'Confirm', icon: '✓' },
    ];

    return (
      <div className="space-y-6">
        <Stepper
          steps={steps}
          currentStep={step}
          onStepChange={(s) => s < step && setStep(s)}
        />
        <div className="p-4 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)] min-h-32 flex items-center justify-center">
          <p className="text-[var(--color-text-muted)]">
            {steps[step].label} step content
          </p>
        </div>
        <div className="flex justify-end gap-2">
          <Button
            variant="secondary"
            onClick={() => setStep(step - 1)}
            disabled={step === 0}
          >
            Back
          </Button>
          <Button
            variant="primary"
            onClick={() => setStep(step + 1)}
            disabled={step === steps.length - 1}
          >
            {step === steps.length - 1 ? 'Place Order' : 'Continue'}
          </Button>
        </div>
      </div>
    );
  },
};

/**
 * Clickable completed steps.
 */
export const Clickable: StoryObj = {
  render: function ClickableDemo() {
    const [step, setStep] = React.useState(3);
    return (
      <div className="space-y-4">
        <Stepper
          steps={basicSteps}
          currentStep={step}
          onStepChange={setStep}
        />
        <p className="text-sm text-[var(--color-text-muted)] text-center">
          Click on completed steps to navigate back
        </p>
      </div>
    );
  },
};
