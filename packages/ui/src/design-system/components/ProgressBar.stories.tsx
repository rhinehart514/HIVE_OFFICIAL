'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { useState, useEffect } from 'react';
import { ProgressBar, ProgressCircle, ProgressSteps } from './ProgressBar';

const meta: Meta<typeof ProgressBar> = {
  title: 'Design System/Components/ProgressBar',
  component: ProgressBar,
  parameters: {
    layout: 'padded',
    backgrounds: { default: 'dark' },
  },
  decorators: [
    (Story) => (
      <div className="p-8 bg-[#0A0A0A] min-h-[400px]">
        <div className="max-w-md">
          <Story />
        </div>
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ProgressBar>;

/**
 * Basic progress bar
 */
export const Default: Story = {
  args: {
    value: 65,
  },
};

/**
 * With label and value
 */
export const WithLabel: Story = {
  args: {
    value: 75,
    label: 'Profile Completion',
    showValue: true,
    valuePosition: 'right',
  },
};

/**
 * Variants
 */
export const Variants: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <p className="text-xs text-[#818187] mb-2">Default (muted)</p>
        <ProgressBar value={65} variant="default" />
      </div>
      <div>
        <p className="text-xs text-[#818187] mb-2">Gold (key progress)</p>
        <ProgressBar value={65} variant="gold" />
      </div>
      <div>
        <p className="text-xs text-[#818187] mb-2">Success</p>
        <ProgressBar value={65} variant="success" />
      </div>
      <div>
        <p className="text-xs text-[#818187] mb-2">Warning</p>
        <ProgressBar value={65} variant="warning" />
      </div>
      <div>
        <p className="text-xs text-[#818187] mb-2">Error</p>
        <ProgressBar value={65} variant="error" />
      </div>
      <div>
        <p className="text-xs text-[#818187] mb-2">Gradient</p>
        <ProgressBar value={65} variant="gradient" />
      </div>
    </div>
  ),
};

/**
 * Sizes
 */
export const Sizes: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <p className="text-xs text-[#818187] mb-2">Extra small (xs)</p>
        <ProgressBar value={65} size="xs" variant="gold" />
      </div>
      <div>
        <p className="text-xs text-[#818187] mb-2">Small (sm)</p>
        <ProgressBar value={65} size="sm" variant="gold" />
      </div>
      <div>
        <p className="text-xs text-[#818187] mb-2">Default</p>
        <ProgressBar value={65} size="default" variant="gold" />
      </div>
      <div>
        <p className="text-xs text-[#818187] mb-2">Large (lg)</p>
        <ProgressBar value={65} size="lg" variant="gold" />
      </div>
    </div>
  ),
};

/**
 * Value positions
 */
export const ValuePositions: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <p className="text-xs text-[#818187] mb-2">Value above</p>
        <ProgressBar
          value={65}
          label="Uploading..."
          showValue
          valuePosition="above"
          variant="gold"
        />
      </div>
      <div>
        <p className="text-xs text-[#818187] mb-2">Value right</p>
        <ProgressBar value={65} showValue valuePosition="right" variant="gold" />
      </div>
      <div>
        <p className="text-xs text-[#818187] mb-2">Value inside (lg only)</p>
        <ProgressBar value={65} showValue valuePosition="inside" size="lg" variant="gold" />
      </div>
    </div>
  ),
};

/**
 * Indeterminate (loading)
 */
export const Indeterminate: Story = {
  args: {
    value: 0,
    indeterminate: true,
    variant: 'gold',
  },
};

/**
 * Striped
 */
export const Striped: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <p className="text-xs text-[#818187] mb-2">Striped</p>
        <ProgressBar value={65} striped variant="gold" size="lg" />
      </div>
      <div>
        <p className="text-xs text-[#818187] mb-2">Animated stripes</p>
        <ProgressBar value={65} striped animatedStripes variant="gold" size="lg" />
      </div>
    </div>
  ),
};

/**
 * Animated progress
 */
export const Animated: Story = {
  render: () => {
    const [value, setValue] = useState(0);

    useEffect(() => {
      const interval = setInterval(() => {
        setValue((prev) => (prev >= 100 ? 0 : prev + 5));
      }, 500);
      return () => clearInterval(interval);
    }, []);

    return (
      <ProgressBar
        value={value}
        label="Uploading file..."
        showValue
        valuePosition="above"
        variant="gold"
      />
    );
  },
};

/**
 * Circular progress
 */
export const Circular: Story = {
  render: () => (
    <div className="flex items-center gap-8">
      <div className="text-center">
        <ProgressCircle value={65} showValue variant="default" />
        <p className="text-xs text-[#818187] mt-2">Default</p>
      </div>
      <div className="text-center">
        <ProgressCircle value={65} showValue variant="gold" />
        <p className="text-xs text-[#818187] mt-2">Gold</p>
      </div>
      <div className="text-center">
        <ProgressCircle value={65} showValue variant="success" />
        <p className="text-xs text-[#818187] mt-2">Success</p>
      </div>
      <div className="text-center">
        <ProgressCircle value={65} showValue variant="error" />
        <p className="text-xs text-[#818187] mt-2">Error</p>
      </div>
    </div>
  ),
};

/**
 * Circular sizes
 */
export const CircularSizes: Story = {
  render: () => (
    <div className="flex items-center gap-8">
      <div className="text-center">
        <ProgressCircle value={65} size={32} strokeWidth={3} showValue />
        <p className="text-xs text-[#818187] mt-2">32px</p>
      </div>
      <div className="text-center">
        <ProgressCircle value={65} size={48} strokeWidth={4} showValue />
        <p className="text-xs text-[#818187] mt-2">48px</p>
      </div>
      <div className="text-center">
        <ProgressCircle value={65} size={64} strokeWidth={4} showValue variant="gold" />
        <p className="text-xs text-[#818187] mt-2">64px</p>
      </div>
      <div className="text-center">
        <ProgressCircle value={65} size={96} strokeWidth={6} showValue variant="gold" />
        <p className="text-xs text-[#818187] mt-2">96px</p>
      </div>
    </div>
  ),
};

/**
 * Circular with custom content
 */
export const CircularCustomContent: Story = {
  render: () => (
    <div className="flex items-center gap-8">
      <ProgressCircle value={100} size={80} variant="success">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6 text-[#22C55E]">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      </ProgressCircle>
      <ProgressCircle value={35} size={80} variant="gold">
        <div className="text-center">
          <span className="text-lg font-bold">35</span>
          <span className="text-xs text-[#818187] block">days</span>
        </div>
      </ProgressCircle>
    </div>
  ),
};

/**
 * Step progress
 */
export const Steps: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <p className="text-xs text-[#818187] mb-2">Step 2 of 5</p>
        <ProgressSteps total={5} current={2} />
      </div>
      <div>
        <p className="text-xs text-[#818187] mb-2">Step 4 of 4</p>
        <ProgressSteps total={4} current={4} variant="success" />
      </div>
      <div>
        <p className="text-xs text-[#818187] mb-2">Large size</p>
        <ProgressSteps total={3} current={1} size="lg" />
      </div>
    </div>
  ),
};

/**
 * Profile completion example
 */
export const ProfileCompletion: Story = {
  render: () => (
    <div className="p-4 bg-[#141414] rounded-xl space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-white font-medium">Profile Completion</span>
        <ProgressCircle value={75} size={48} showValue variant="gold" />
      </div>
      <ProgressBar
        value={75}
        variant="gold"
        size="sm"
      />
      <ul className="space-y-2 text-sm">
        <li className="flex items-center gap-2 text-[#22C55E]">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          Add profile photo
        </li>
        <li className="flex items-center gap-2 text-[#22C55E]">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          Complete bio
        </li>
        <li className="flex items-center gap-2 text-[#818187]">
          <div className="w-4 h-4 rounded-full border border-[#818187]" />
          Add interests
        </li>
        <li className="flex items-center gap-2 text-[#818187]">
          <div className="w-4 h-4 rounded-full border border-[#818187]" />
          Join first space
        </li>
      </ul>
    </div>
  ),
};
