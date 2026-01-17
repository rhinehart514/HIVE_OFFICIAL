'use client';

import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';
import { Focus, FocusStatic, type FocusMode, type MaxWidth } from './Focus';

/**
 * Focus Template — Single-task immersion
 *
 * The controlled reveal. When you enter Focus, everything else disappears.
 * There's only the task at hand.
 *
 * Three modes:
 * - Portal: Full-bleed immersion (auth, landing)
 * - Reveal: Centered with max-width (onboarding)
 * - Form: Tight single-column (OTP entry)
 *
 * @see docs/design-system/TEMPLATES.md (Template 1)
 */
const meta: Meta<typeof Focus> = {
  title: 'Design System/Templates/Focus',
  component: Focus,
  parameters: {
    layout: 'fullscreen',
    backgrounds: { default: 'dark' },
    docs: {
      description: {
        component:
          'Single-task immersion template. Three modes: Portal (full-bleed), Reveal (centered), Form (tight).',
      },
    },
  },
  argTypes: {
    mode: {
      control: 'select',
      options: ['portal', 'reveal', 'form'],
      description: 'Layout mode',
    },
    atmosphere: {
      control: 'select',
      options: ['landing', 'comfortable', 'workshop'],
      description: 'Atmosphere level',
    },
    maxWidth: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg'],
      description: 'Maximum content width',
    },
    background: {
      control: 'select',
      options: ['ambient', 'gradient', 'none'],
      description: 'Background style',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Focus>;

// Sample content components
const SimpleCard = ({ title, description }: { title: string; description?: string }) => (
  <div
    className="p-8 rounded-2xl border border-white/10"
    style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
  >
    <h2 className="text-xl font-semibold text-white mb-2">{title}</h2>
    {description && (
      <p className="text-[15px] text-white/60">{description}</p>
    )}
  </div>
);

const LoginForm = () => (
  <div className="space-y-6">
    <div className="text-center space-y-2">
      <h1 className="text-2xl font-semibold text-white">Welcome back</h1>
      <p className="text-[15px] text-white/50">Enter your email to sign in</p>
    </div>
    <div
      className="flex items-center rounded-xl"
      style={{ backgroundColor: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)' }}
    >
      <input
        type="text"
        placeholder="yourname"
        className="flex-1 bg-transparent px-4 py-3.5 text-[15px] text-white outline-none placeholder:text-white/25"
      />
      <span className="pr-4 text-[15px] text-white/35">@buffalo.edu</span>
    </div>
    <button
      className="w-full py-3.5 px-6 rounded-xl font-medium text-[15px] bg-white/95 text-black flex items-center justify-center gap-2"
    >
      <span>Continue</span>
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
      </svg>
    </button>
  </div>
);

const OnboardingStep = () => (
  <div className="space-y-8">
    <div className="text-center space-y-3">
      <h1 className="text-2xl font-semibold text-white">What brings you to HIVE?</h1>
      <p className="text-[15px] text-white/50 max-w-[280px] mx-auto">
        This helps us personalize your experience
      </p>
    </div>
    <div className="grid gap-3">
      {['Student', 'Club Leader', 'Faculty'].map((option) => (
        <button
          key={option}
          className="p-4 rounded-xl text-left transition-colors"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <span className="text-[15px] text-white">{option}</span>
        </button>
      ))}
    </div>
  </div>
);

const OTPForm = () => (
  <div className="space-y-6">
    <div className="text-center space-y-2">
      <h1 className="text-xl font-semibold text-white">Enter your code</h1>
      <p className="text-[14px] text-white/50">Check your inbox for a 6-digit code</p>
    </div>
    <div className="flex justify-center gap-2.5">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="w-11 h-14 rounded-xl border flex items-center justify-center text-2xl font-semibold"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            color: 'rgba(255, 255, 255, 0.8)',
          }}
        >
          {i < 3 ? String(i + 1) : ''}
        </div>
      ))}
    </div>
    <div className="flex justify-center gap-1.5">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="w-1.5 h-1.5 rounded-full"
          style={{
            backgroundColor: i < 3 ? 'var(--color-gold)' : 'rgba(255, 255, 255, 0.15)',
          }}
        />
      ))}
    </div>
  </div>
);

/**
 * Portal Mode — Full-bleed immersion
 *
 * Used for auth flows where content floats in center
 */
export const PortalMode: Story = {
  args: {
    mode: 'portal',
    atmosphere: 'landing',
    logo: { position: 'center', variant: 'icon' },
    background: 'ambient',
    maxWidth: 'sm',
  },
  render: (args) => (
    <Focus {...args}>
      <LoginForm />
    </Focus>
  ),
};

/**
 * Reveal Mode — Centered with max-width
 *
 * Used for onboarding flows with step progress
 */
export const RevealMode: Story = {
  args: {
    mode: 'reveal',
    atmosphere: 'landing',
    logo: { position: 'top-left', variant: 'icon' },
    progress: { steps: 3, current: 0 },
    background: 'ambient',
    maxWidth: 'md',
  },
  render: (args) => (
    <Focus {...args}>
      <OnboardingStep />
    </Focus>
  ),
};

/**
 * Form Mode — Tight single-column
 *
 * Used for OTP entry and single-input flows
 */
export const FormMode: Story = {
  args: {
    mode: 'form',
    atmosphere: 'landing',
    logo: { position: 'center', variant: 'icon' },
    background: 'ambient',
    maxWidth: 'xs',
  },
  render: (args) => (
    <Focus {...args}>
      <OTPForm />
    </Focus>
  ),
};

/**
 * With Progress Indicator — Dots variant
 */
export const WithProgressDots: Story = {
  render: function ProgressDotsStory() {
    const [step, setStep] = React.useState(0);

    return (
      <Focus
        mode="reveal"
        atmosphere="landing"
        logo={{ position: 'top-left', variant: 'icon' }}
        progress={{ steps: 4, current: step, variant: 'dots' }}
        background="ambient"
        maxWidth="md"
      >
        <div className="space-y-8">
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-white mb-2">Step {step + 1} of 4</h1>
            <p className="text-[15px] text-white/50">Progress dots below</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setStep(Math.max(0, step - 1))}
              disabled={step === 0}
              className="px-4 py-2 rounded-lg bg-white/10 text-white disabled:opacity-30"
            >
              Back
            </button>
            <button
              onClick={() => setStep(Math.min(3, step + 1))}
              disabled={step === 3}
              className="flex-1 py-2 rounded-lg bg-white text-black font-medium disabled:opacity-30"
            >
              Continue
            </button>
          </div>
        </div>
      </Focus>
    );
  },
};

/**
 * With Progress Indicator — Line variant
 */
export const WithProgressLine: Story = {
  render: function ProgressLineStory() {
    const [step, setStep] = React.useState(1);

    return (
      <Focus
        mode="reveal"
        atmosphere="landing"
        logo={{ position: 'top-left', variant: 'icon' }}
        progress={{ steps: 5, current: step, variant: 'line' }}
        background="ambient"
        maxWidth="md"
      >
        <div className="space-y-8">
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-white mb-2">Step {step + 1} of 5</h1>
            <p className="text-[15px] text-white/50">Line progress indicator</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setStep(Math.max(0, step - 1))}
              disabled={step === 0}
              className="px-4 py-2 rounded-lg bg-white/10 text-white disabled:opacity-30"
            >
              Back
            </button>
            <button
              onClick={() => setStep(Math.min(4, step + 1))}
              disabled={step === 4}
              className="flex-1 py-2 rounded-lg bg-white text-black font-medium disabled:opacity-30"
            >
              Continue
            </button>
          </div>
        </div>
      </Focus>
    );
  },
};

/**
 * Logo Variants
 */
export const LogoVariants: Story = {
  render: function LogoVariantsStory() {
    const [position, setPosition] = React.useState<'center' | 'top-left'>('center');
    const [variant, setVariant] = React.useState<'icon' | 'full'>('icon');

    return (
      <Focus
        mode="portal"
        atmosphere="landing"
        logo={{ position, variant }}
        background="ambient"
        maxWidth="sm"
      >
        <div className="space-y-6">
          <SimpleCard
            title="Logo Configuration"
            description={`Position: ${position}, Variant: ${variant}`}
          />
          <div className="flex flex-wrap gap-2 justify-center">
            <button
              onClick={() => setPosition(position === 'center' ? 'top-left' : 'center')}
              className="px-3 py-1.5 rounded-lg text-sm bg-white/10 text-white"
            >
              Toggle Position
            </button>
            <button
              onClick={() => setVariant(variant === 'icon' ? 'full' : 'icon')}
              className="px-3 py-1.5 rounded-lg text-sm bg-white/10 text-white"
            >
              Toggle Variant
            </button>
          </div>
        </div>
      </Focus>
    );
  },
};

/**
 * Max Width Options
 */
export const MaxWidthOptions: Story = {
  render: function MaxWidthStory() {
    const [width, setWidth] = React.useState<MaxWidth>('sm');
    const widths: MaxWidth[] = ['xs', 'sm', 'md', 'lg'];

    return (
      <Focus
        mode="reveal"
        atmosphere="landing"
        logo={{ position: 'top-left', variant: 'icon' }}
        background="ambient"
        maxWidth={width}
      >
        <div className="space-y-6">
          <SimpleCard
            title={`Max Width: ${width}`}
            description="xs=320px, sm=400px, md=480px, lg=560px"
          />
          <div className="flex flex-wrap gap-2 justify-center">
            {widths.map((w) => (
              <button
                key={w}
                onClick={() => setWidth(w)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  width === w
                    ? 'bg-[var(--color-gold)] text-black'
                    : 'bg-white/10 text-white'
                }`}
              >
                {w}
              </button>
            ))}
          </div>
        </div>
      </Focus>
    );
  },
};

/**
 * Background Styles
 */
export const BackgroundStyles: Story = {
  render: function BackgroundStylesStory() {
    const [bg, setBg] = React.useState<'ambient' | 'gradient' | 'none'>('ambient');

    return (
      <Focus
        mode="portal"
        atmosphere="landing"
        logo={{ position: 'center', variant: 'icon' }}
        background={bg}
        maxWidth="sm"
      >
        <div className="space-y-6">
          <SimpleCard
            title={`Background: ${bg}`}
            description="Ambient adds warm glow, gradient adds top highlight"
          />
          <div className="flex gap-2 justify-center">
            {(['ambient', 'gradient', 'none'] as const).map((style) => (
              <button
                key={style}
                onClick={() => setBg(style)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  bg === style
                    ? 'bg-[var(--color-gold)] text-black'
                    : 'bg-white/10 text-white'
                }`}
              >
                {style}
              </button>
            ))}
          </div>
        </div>
      </Focus>
    );
  },
};

/**
 * With Footer
 */
export const WithFooter: Story = {
  args: {
    mode: 'portal',
    atmosphere: 'landing',
    logo: { position: 'center', variant: 'icon' },
    background: 'ambient',
    maxWidth: 'sm',
    footer: (
      <p className="text-[13px] text-white/30">
        By continuing, you agree to our{' '}
        <a href="#" className="underline hover:text-white/50">Terms</a>
        {' and '}
        <a href="#" className="underline hover:text-white/50">Privacy Policy</a>
      </p>
    ),
  },
  render: (args) => (
    <Focus {...args}>
      <LoginForm />
    </Focus>
  ),
};

/**
 * FocusStatic — Non-animated version
 *
 * Used for Suspense fallbacks
 */
export const StaticVersion: Story = {
  render: () => (
    <FocusStatic mode="portal" maxWidth="sm">
      <div className="flex items-center justify-center py-12">
        <svg
          className="w-6 h-6 animate-spin text-white/40"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>
    </FocusStatic>
  ),
};

/**
 * Full Auth Flow Demo
 */
export const FullAuthFlowDemo: Story = {
  render: function AuthFlowStory() {
    const [stage, setStage] = React.useState<'email' | 'otp' | 'success'>('email');

    return (
      <Focus
        mode="portal"
        atmosphere="landing"
        logo={{ position: 'center', variant: 'icon' }}
        background="ambient"
        maxWidth="sm"
        transitionKey={stage}
      >
        {stage === 'email' && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-semibold text-white">Welcome to HIVE</h1>
              <p className="text-[15px] text-white/50">Enter your campus email</p>
            </div>
            <button
              onClick={() => setStage('otp')}
              className="w-full py-3.5 rounded-xl bg-white text-black font-medium"
            >
              Send Code →
            </button>
          </div>
        )}
        {stage === 'otp' && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-xl font-semibold text-white">Enter your code</h1>
              <p className="text-[14px] text-white/50">Check your inbox</p>
            </div>
            <button
              onClick={() => setStage('success')}
              className="w-full py-3.5 rounded-xl bg-white text-black font-medium"
            >
              Verify →
            </button>
            <button
              onClick={() => setStage('email')}
              className="w-full text-[14px] text-white/40"
            >
              Back to email
            </button>
          </div>
        )}
        {stage === 'success' && (
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3">
              <svg
                className="w-7 h-7"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={3}
                style={{ color: 'var(--color-gold)' }}
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <h1 className="text-3xl font-semibold text-white">You're in</h1>
            </div>
            <p className="text-[15px] text-white/40">Taking you home...</p>
            <button
              onClick={() => setStage('email')}
              className="text-[14px] text-white/30 hover:text-white/50"
            >
              Reset demo
            </button>
          </div>
        )}
      </Focus>
    );
  },
};
