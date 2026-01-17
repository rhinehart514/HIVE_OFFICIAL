'use client';

import type { Meta, StoryObj } from '@storybook/react';
import {
  PageTransition,
  PageTransitionProvider,
  FadeTransition,
  SlideTransition,
  ScaleTransition,
  StaggerContainer,
  pageTransitionPresets,
  type PageTransitionProps,
} from './PageTransition';
import * as React from 'react';

const meta: Meta<typeof PageTransition> = {
  title: 'Design System/Templates/PageTransition',
  component: PageTransition,
  parameters: {
    layout: 'fullscreen',
    backgrounds: { default: 'dark' },
  },
};

export default meta;
type Story = StoryObj<typeof PageTransition>;

// Sample page content
const PageContent = ({
  title,
  description,
  color = 'var(--color-bg-elevated)',
}: {
  title: string;
  description?: string;
  color?: string;
}) => (
  <div
    className="min-h-[400px] p-8 rounded-xl border border-[var(--color-border)]"
    style={{ backgroundColor: color }}
  >
    <h1 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-4">{title}</h1>
    {description && (
      <p className="text-[var(--color-text-secondary)]">{description}</p>
    )}
    <div className="mt-6 grid grid-cols-2 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="p-4 rounded-lg bg-[var(--color-bg-page)] border border-[var(--color-border)]"
        >
          <div className="h-4 w-24 bg-[var(--color-bg-hover)] rounded mb-2" />
          <div className="h-3 w-32 bg-[var(--color-bg-hover)] rounded" />
        </div>
      ))}
    </div>
  </div>
);

/**
 * Fade transition - default for most page navigations
 */
export const FadeMode: StoryObj = {
  render: function FadeModeStory() {
    const [page, setPage] = React.useState(1);

    return (
      <div className="min-h-screen bg-[var(--color-bg-page)] p-8">
        <div className="mb-6 flex gap-2">
          {[1, 2, 3].map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                page === p
                  ? 'bg-[var(--color-gold)] text-black font-medium'
                  : 'bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
              }`}
            >
              Page {p}
            </button>
          ))}
        </div>

        <PageTransition pageKey={`fade-${page}`} mode="fade">
          <PageContent
            title={`Page ${page}`}
            description="This page fades in and out smoothly."
          />
        </PageTransition>
      </div>
    );
  },
};

/**
 * Slide transition - for sequential flows like onboarding
 */
export const SlideMode: StoryObj = {
  render: function SlideModeStory() {
    const [step, setStep] = React.useState(1);
    const [direction, setDirection] = React.useState<'forward' | 'backward'>('forward');

    const goToStep = (newStep: number) => {
      setDirection(newStep > step ? 'forward' : 'backward');
      setStep(newStep);
    };

    return (
      <div className="min-h-screen bg-[var(--color-bg-page)] p-8">
        <div className="mb-6 flex items-center gap-4">
          <button
            onClick={() => goToStep(Math.max(1, step - 1))}
            disabled={step === 1}
            className="px-4 py-2 rounded-lg bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] disabled:opacity-50"
          >
            Back
          </button>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`w-8 h-1 rounded-full transition-colors ${
                  s <= step ? 'bg-[var(--color-gold)]' : 'bg-[var(--color-border)]'
                }`}
              />
            ))}
          </div>
          <button
            onClick={() => goToStep(Math.min(4, step + 1))}
            disabled={step === 4}
            className="px-4 py-2 rounded-lg bg-[var(--color-gold)] text-black font-medium hover:opacity-90 disabled:opacity-50"
          >
            Next
          </button>
        </div>

        <PageTransition
          pageKey={`step-${step}`}
          mode="slide"
          direction={direction}
        >
          <PageContent
            title={`Step ${step} of 4`}
            description="Content slides in the direction of navigation."
          />
        </PageTransition>
      </div>
    );
  },
};

/**
 * SlideUp transition - for content appearing from below
 */
export const SlideUpMode: StoryObj = {
  render: function SlideUpModeStory() {
    const [page, setPage] = React.useState(1);

    return (
      <div className="min-h-screen bg-[var(--color-bg-page)] p-8">
        <div className="mb-6 flex gap-2">
          {[1, 2, 3].map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                page === p
                  ? 'bg-[var(--color-gold)] text-black font-medium'
                  : 'bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
              }`}
            >
              Page {p}
            </button>
          ))}
        </div>

        <PageTransition pageKey={`slideup-${page}`} mode="slideUp">
          <PageContent
            title={`Page ${page}`}
            description="This page slides up from below."
          />
        </PageTransition>
      </div>
    );
  },
};

/**
 * Scale transition - for modal-like pages
 */
export const ScaleMode: StoryObj = {
  render: function ScaleModeStory() {
    const [page, setPage] = React.useState(1);

    return (
      <div className="min-h-screen bg-[var(--color-bg-page)] p-8">
        <div className="mb-6 flex gap-2">
          {[1, 2, 3].map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                page === p
                  ? 'bg-[var(--color-gold)] text-black font-medium'
                  : 'bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
              }`}
            >
              Page {p}
            </button>
          ))}
        </div>

        <PageTransition pageKey={`scale-${page}`} mode="scale">
          <PageContent
            title={`Page ${page}`}
            description="This page scales in from a slightly smaller size."
          />
        </PageTransition>
      </div>
    );
  },
};

/**
 * Utility: FadeTransition for show/hide
 */
export const FadeTransitionUtility: StoryObj = {
  render: function FadeTransitionStory() {
    const [show, setShow] = React.useState(true);

    return (
      <div className="min-h-screen bg-[var(--color-bg-page)] p-8">
        <button
          onClick={() => setShow(!show)}
          className="mb-6 px-4 py-2 rounded-lg bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]"
        >
          {show ? 'Hide' : 'Show'} Content
        </button>

        <FadeTransition show={show}>
          <div className="p-6 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)]">
            <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-2">
              Fade Transition
            </h3>
            <p className="text-sm text-[var(--color-text-secondary)]">
              This content fades in and out when toggled.
            </p>
          </div>
        </FadeTransition>
      </div>
    );
  },
};

/**
 * Utility: SlideTransition with different directions
 */
export const SlideTransitionUtility: StoryObj = {
  render: function SlideTransitionStory() {
    const [show, setShow] = React.useState(true);
    const [direction, setDirection] = React.useState<'left' | 'right' | 'up' | 'down'>('up');

    return (
      <div className="min-h-screen bg-[var(--color-bg-page)] p-8">
        <div className="mb-6 flex items-center gap-4">
          <button
            onClick={() => setShow(!show)}
            className="px-4 py-2 rounded-lg bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]"
          >
            {show ? 'Hide' : 'Show'}
          </button>

          <div className="flex gap-2">
            {(['up', 'down', 'left', 'right'] as const).map((dir) => (
              <button
                key={dir}
                onClick={() => setDirection(dir)}
                className={`px-3 py-1 rounded text-xs ${
                  direction === dir
                    ? 'bg-[var(--color-gold)] text-black'
                    : 'bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)]'
                }`}
              >
                {dir}
              </button>
            ))}
          </div>
        </div>

        <SlideTransition show={show} direction={direction}>
          <div className="p-6 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)]">
            <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-2">
              Slide Transition
            </h3>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Direction: <code className="text-[var(--color-gold)]">{direction}</code>
            </p>
          </div>
        </SlideTransition>
      </div>
    );
  },
};

/**
 * Utility: ScaleTransition for modals
 */
export const ScaleTransitionUtility: StoryObj = {
  render: function ScaleTransitionStory() {
    const [show, setShow] = React.useState(true);

    return (
      <div className="min-h-screen bg-[var(--color-bg-page)] p-8">
        <button
          onClick={() => setShow(!show)}
          className="mb-6 px-4 py-2 rounded-lg bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]"
        >
          {show ? 'Hide' : 'Show'} Modal
        </button>

        <ScaleTransition show={show}>
          <div className="p-6 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)] shadow-xl">
            <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-2">
              Scale Transition
            </h3>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Perfect for modal-like content that needs subtle emphasis.
            </p>
          </div>
        </ScaleTransition>
      </div>
    );
  },
};

/**
 * Stagger animation for lists
 */
export const StaggerAnimation: StoryObj = {
  render: function StaggerAnimationStory() {
    const [key, setKey] = React.useState(0);

    return (
      <div className="min-h-screen bg-[var(--color-bg-page)] p-8">
        <button
          onClick={() => setKey((k) => k + 1)}
          className="mb-6 px-4 py-2 rounded-lg bg-[var(--color-gold)] text-black font-medium hover:opacity-90"
        >
          Replay Animation
        </button>

        <StaggerContainer key={key} staggerDelay={0.1}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="p-4 mb-3 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)]"
            >
              <h4 className="font-medium text-[var(--color-text-primary)]">Item {i + 1}</h4>
              <p className="text-sm text-[var(--color-text-muted)]">
                Staggered with {100 * (i + 1)}ms delay
              </p>
            </div>
          ))}
        </StaggerContainer>
      </div>
    );
  },
};

/**
 * Presets showcase
 */
export const Presets: StoryObj = {
  render: function PresetsStory() {
    const [preset, setPreset] = React.useState<keyof typeof pageTransitionPresets>('default');
    const [page, setPage] = React.useState(1);
    const [direction, setDirection] = React.useState<'forward' | 'backward'>('forward');

    const goToPage = (newPage: number) => {
      setDirection(newPage > page ? 'forward' : 'backward');
      setPage(newPage);
    };

    const currentPreset = pageTransitionPresets[preset];

    return (
      <div className="min-h-screen bg-[var(--color-bg-page)] p-8">
        <div className="mb-6">
          <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wide mb-2">
            Preset
          </p>
          <div className="flex gap-2 flex-wrap">
            {(Object.keys(pageTransitionPresets) as (keyof typeof pageTransitionPresets)[]).map(
              (p) => (
                <button
                  key={p}
                  onClick={() => setPreset(p)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    preset === p
                      ? 'bg-[var(--color-gold)] text-black font-medium'
                      : 'bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
                  }`}
                >
                  {p}
                </button>
              )
            )}
          </div>
        </div>

        <div className="mb-6 flex gap-2">
          {[1, 2, 3].map((p) => (
            <button
              key={p}
              onClick={() => goToPage(p)}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                page === p
                  ? 'bg-[var(--color-bg-hover)] text-[var(--color-text-primary)] border border-[var(--color-border)]'
                  : 'bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
              }`}
            >
              Page {p}
            </button>
          ))}
        </div>

        <PageTransition
          pageKey={`preset-${preset}-${page}`}
          mode={currentPreset.mode}
          duration={currentPreset.duration}
          direction={direction}
        >
          <PageContent
            title={`${preset} preset - Page ${page}`}
            description={`Mode: ${currentPreset.mode}, Duration: ${currentPreset.duration}s`}
          />
        </PageTransition>
      </div>
    );
  },
};

/**
 * Reduced motion - respects user preference
 */
export const ReducedMotion: Story = {
  render: () => (
    <div className="min-h-screen bg-[var(--color-bg-page)] p-8">
      <div className="max-w-md mx-auto">
        <div className="p-6 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)]">
          <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-4">
            Reduced Motion Support
          </h3>
          <p className="text-sm text-[var(--color-text-secondary)] mb-4">
            PageTransition automatically respects the user's{' '}
            <code className="text-[var(--color-gold)]">prefers-reduced-motion</code> preference.
          </p>
          <p className="text-sm text-[var(--color-text-secondary)]">
            When enabled, all animations are disabled for accessibility.
          </p>

          <div className="mt-6 p-4 rounded-lg bg-[var(--color-bg-page)] border border-[var(--color-border)]">
            <p className="text-xs text-[var(--color-text-muted)]">
              To test: Enable "Reduce motion" in your system accessibility settings
            </p>
          </div>
        </div>
      </div>
    </div>
  ),
};
