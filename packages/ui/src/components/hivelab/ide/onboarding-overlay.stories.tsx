'use client';

import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { OnboardingOverlay } from './onboarding-overlay';

/**
 * OnboardingOverlay - First-time HiveLab guide
 *
 * Shows when users first create a new tool (blank canvas).
 * Guides through drag-drop, AI commands (Cmd+K), and property configuration.
 */
const meta = {
  title: '05-HiveLab/IDE/OnboardingOverlay',
  component: OnboardingOverlay,
  parameters: {
    layout: 'fullscreen',
    backgrounds: { default: 'dark' },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="relative min-h-screen bg-[#0A0A0A]">
        {/* Simulated IDE background */}
        <div className="absolute inset-0 flex">
          {/* Left panel mock */}
          <div className="w-64 bg-[#111] border-r border-[#333] p-4">
            <div className="text-xs text-[#666] uppercase mb-4">Elements</div>
            <div className="space-y-2">
              {['Poll', 'Timer', 'Form', 'Chart', 'List'].map((el) => (
                <div
                  key={el}
                  className="p-3 bg-[#1a1a1a] border border-[#333] rounded-lg text-sm text-[#888]"
                >
                  {el}
                </div>
              ))}
            </div>
          </div>
          {/* Canvas mock */}
          <div className="flex-1 p-8">
            <div className="h-full border-2 border-dashed border-[#333] rounded-xl flex items-center justify-center">
              <p className="text-[#666]">Canvas area</p>
            </div>
          </div>
          {/* Right panel mock */}
          <div className="w-72 bg-[#111] border-l border-[#333] p-4">
            <div className="text-xs text-[#666] uppercase mb-4">Properties</div>
            <p className="text-sm text-[#666]">Select an element to configure</p>
          </div>
        </div>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof OnboardingOverlay>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default state - Step 1 active (Drag elements)
 */
export const Default: Story = {
  args: {
    onDismiss: action('dismiss'),
    onOpenAI: action('open-ai'),
  },
};

/**
 * Interactive demo with working step selection
 */
export const Interactive: Story = {
  args: {
    onDismiss: action('dismiss'),
    onOpenAI: action('open-ai'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Click on each step to expand its hint. Press Esc to dismiss or Cmd+K to open AI.',
      },
    },
  },
};

/**
 * Without AI callback - Try AI button still visible but does nothing
 */
export const WithoutAICallback: Story = {
  args: {
    onDismiss: action('dismiss'),
    onOpenAI: undefined,
  },
  parameters: {
    docs: {
      description: {
        story: 'When onOpenAI is undefined, the button still calls dismiss but no AI dialog opens.',
      },
    },
  },
};

/**
 * Controlled example - demonstrates typical usage
 */
function ControlledExample() {
  const [showOnboarding, setShowOnboarding] = React.useState(true);
  const [showAI, setShowAI] = React.useState(false);

  return (
    <div className="relative min-h-screen bg-[#0A0A0A]">
      {/* Simulated IDE */}
      <div className="absolute inset-0 flex">
        <div className="w-64 bg-[#111] border-r border-[#333] p-4">
          <div className="text-xs text-[#666] uppercase mb-4">Elements</div>
          <div className="space-y-2">
            {['Poll', 'Timer', 'Form'].map((el) => (
              <div
                key={el}
                className="p-3 bg-[#1a1a1a] border border-[#333] rounded-lg text-sm text-[#888]"
              >
                {el}
              </div>
            ))}
          </div>
        </div>
        <div className="flex-1 p-8 flex flex-col">
          {!showOnboarding && (
            <div className="mb-4 flex gap-2">
              <button
                onClick={() => setShowOnboarding(true)}
                className="px-3 py-1.5 bg-[#333] text-white text-sm rounded-lg hover:bg-[#444]"
              >
                Show Onboarding Again
              </button>
            </div>
          )}
          <div className="flex-1 border-2 border-dashed border-[#333] rounded-xl flex items-center justify-center">
            {showAI ? (
              <div className="bg-[#1a1a1a] border border-[#FFD700]/30 rounded-xl p-6 max-w-sm text-center">
                <p className="text-white font-medium mb-2">AI Command Palette</p>
                <p className="text-sm text-[#888] mb-4">
                  Type what you want to build...
                </p>
                <button
                  onClick={() => setShowAI(false)}
                  className="text-xs text-[#888] hover:text-white"
                >
                  Close
                </button>
              </div>
            ) : (
              <p className="text-[#666]">
                {showOnboarding ? 'Canvas behind overlay' : 'Canvas ready for elements'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Onboarding overlay */}
      {showOnboarding && (
        <OnboardingOverlay
          onDismiss={() => {
            setShowOnboarding(false);
            action('dismiss')();
          }}
          onOpenAI={() => {
            setShowOnboarding(false);
            setShowAI(true);
            action('open-ai')();
          }}
        />
      )}
    </div>
  );
}

export const Controlled: Story = {
  render: () => <ControlledExample />,
  parameters: {
    docs: {
      description: {
        story: 'Full controlled example showing how the overlay integrates with the HiveLab IDE. Click "Try AI" to simulate opening the command palette.',
      },
    },
  },
};

/**
 * Dark theme with lighter background - testing contrast
 */
export const LighterBackground: Story = {
  args: {
    onDismiss: action('dismiss'),
    onOpenAI: action('open-ai'),
  },
  decorators: [
    (Story) => (
      <div className="relative min-h-screen bg-[#1a1a1a]">
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-[#666]">Lighter background for contrast testing</p>
        </div>
        <Story />
      </div>
    ),
  ],
};

/**
 * Mobile viewport simulation
 */
export const MobileViewport: Story = {
  args: {
    onDismiss: action('dismiss'),
    onOpenAI: action('open-ai'),
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'On mobile devices, the overlay should still be usable with touch interactions.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="relative min-h-screen bg-[#0A0A0A]">
        <Story />
      </div>
    ),
  ],
};
