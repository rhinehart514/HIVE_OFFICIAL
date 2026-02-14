'use client';

import type { Meta, StoryObj } from '@storybook/react';
import {
  RadioGroup,
  RadioGroupItem,
  RadioOption,
  RadioCard,
  SimpleRadioGroup,
} from './RadioGroup';
import * as React from 'react';

const meta: Meta<typeof RadioGroup> = {
  title: 'Design System/Components/RadioGroup',
  component: RadioGroup,
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'dark' },
  },
  decorators: [
    (Story) => (
      <div className="p-8 w-80">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof RadioGroup>;

/**
 * Basic radio group with simple items.
 */
export const Default: Story = {
  render: () => (
    <RadioGroup defaultValue="option-1">
      <div className="flex items-center gap-2">
        <RadioGroupItem value="option-1" id="opt-1" />
        <label htmlFor="opt-1" className="text-sm text-white">Option 1</label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="option-2" id="opt-2" />
        <label htmlFor="opt-2" className="text-sm text-white">Option 2</label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="option-3" id="opt-3" />
        <label htmlFor="opt-3" className="text-sm text-white">Option 3</label>
      </div>
    </RadioGroup>
  ),
};

/**
 * Radio options with labels and descriptions.
 */
export const WithDescriptions: Story = {
  render: () => (
    <RadioGroup defaultValue="startup">
      <RadioOption
        value="startup"
        label="Startup"
        description="For small teams just getting started"
      />
      <RadioOption
        value="business"
        label="Business"
        description="For growing companies with moderate needs"
      />
      <RadioOption
        value="enterprise"
        label="Enterprise"
        description="For large organizations with complex requirements"
      />
    </RadioGroup>
  ),
};

/**
 * Horizontal orientation.
 */
export const Horizontal: Story = {
  render: () => (
    <RadioGroup defaultValue="daily" orientation="horizontal">
      <RadioOption value="daily" label="Daily" />
      <RadioOption value="weekly" label="Weekly" />
      <RadioOption value="monthly" label="Monthly" />
    </RadioGroup>
  ),
};

/**
 * Card-style radio options.
 */
export const CardStyle: Story = {
  decorators: [
    (Story) => (
      <div className="p-8 w-96">
        <Story />
      </div>
    ),
  ],
  render: () => (
    <RadioGroup defaultValue="pro">
      <RadioCard
        value="free"
        title="Free Plan"
        description="Get started with basic features"
        extra={<span className="text-lg font-bold text-white">$0/mo</span>}
      />
      <RadioCard
        value="pro"
        title="Pro Plan"
        description="Best for power users and small teams"
        extra={<span className="text-lg font-bold text-[#FFD700]">$29/mo</span>}
      />
      <RadioCard
        value="enterprise"
        title="Enterprise"
        description="Custom solutions for large organizations"
        extra={<span className="text-sm text-[var(--color-text-muted)]">Contact us</span>}
      />
    </RadioGroup>
  ),
};

/**
 * Different sizes.
 */
export const Sizes: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <span className="text-xs text-[var(--color-text-muted)] mb-2 block">Small</span>
        <RadioGroup defaultValue="a" orientation="horizontal">
          <RadioOption value="a" label="Option A" size="sm" />
          <RadioOption value="b" label="Option B" size="sm" />
        </RadioGroup>
      </div>
      <div>
        <span className="text-xs text-[var(--color-text-muted)] mb-2 block">Default</span>
        <RadioGroup defaultValue="a" orientation="horizontal">
          <RadioOption value="a" label="Option A" size="default" />
          <RadioOption value="b" label="Option B" size="default" />
        </RadioGroup>
      </div>
      <div>
        <span className="text-xs text-[var(--color-text-muted)] mb-2 block">Large</span>
        <RadioGroup defaultValue="a" orientation="horizontal">
          <RadioOption value="a" label="Option A" size="lg" />
          <RadioOption value="b" label="Option B" size="lg" />
        </RadioGroup>
      </div>
    </div>
  ),
};

/**
 * Disabled options.
 */
export const Disabled: Story = {
  render: () => (
    <RadioGroup defaultValue="available">
      <RadioOption value="available" label="Available" description="This option is available" />
      <RadioOption
        value="unavailable"
        label="Unavailable"
        description="This option is not available"
        disabled
      />
      <RadioOption value="limited" label="Limited" description="Limited availability" />
    </RadioGroup>
  ),
};

/**
 * Simple radio group with options prop.
 */
export const SimpleGroup: StoryObj<typeof SimpleRadioGroup> = {
  render: function SimpleGroupDemo() {
    const [value, setValue] = React.useState('light');

    return (
      <SimpleRadioGroup
        value={value}
        onValueChange={setValue}
        options={[
          { value: 'light', label: 'Light', description: 'Light theme' },
          { value: 'dark', label: 'Dark', description: 'Dark theme' },
          { value: 'system', label: 'System', description: 'Follow system preference' },
        ]}
      />
    );
  },
};

/**
 * Simple radio group with card style.
 */
export const SimpleCardGroup: StoryObj<typeof SimpleRadioGroup> = {
  decorators: [
    (Story) => (
      <div className="p-8 w-96">
        <Story />
      </div>
    ),
  ],
  render: function SimpleCardGroupDemo() {
    const [value, setValue] = React.useState('standard');

    return (
      <SimpleRadioGroup
        value={value}
        onValueChange={setValue}
        cardStyle
        options={[
          { value: 'economy', label: 'Economy', description: '5-7 business days' },
          { value: 'standard', label: 'Standard', description: '3-5 business days' },
          { value: 'express', label: 'Express', description: '1-2 business days' },
        ]}
      />
    );
  },
};

/**
 * Controlled radio group.
 */
export const Controlled: Story = {
  render: function ControlledRadio() {
    const [value, setValue] = React.useState('medium');

    return (
      <div className="space-y-4">
        <RadioGroup value={value} onValueChange={setValue}>
          <RadioOption value="small" label="Small" />
          <RadioOption value="medium" label="Medium" />
          <RadioOption value="large" label="Large" />
        </RadioGroup>
        <div className="text-sm text-[var(--color-text-muted)]">
          Selected: <span className="text-white">{value}</span>
        </div>
      </div>
    );
  },
};

/**
 * In a form context.
 */
export const InForm: Story = {
  decorators: [
    (Story) => (
      <div className="p-8 w-96">
        <Story />
      </div>
    ),
  ],
  render: () => (
    <div className="space-y-6 p-4 rounded-xl border border-[var(--color-border)] bg-[#0D0D0D]">
      <div>
        <h3 className="text-sm font-medium text-white mb-1">Notification Frequency</h3>
        <p className="text-xs text-[var(--color-text-muted)] mb-3">
          How often should we send you updates?
        </p>
        <RadioGroup defaultValue="weekly">
          <RadioOption value="realtime" label="Real-time" description="Get notified immediately" />
          <RadioOption value="daily" label="Daily digest" description="Once per day summary" />
          <RadioOption value="weekly" label="Weekly digest" description="Once per week summary" />
          <RadioOption value="never" label="Never" description="Don't send notifications" />
        </RadioGroup>
      </div>
    </div>
  ),
};

/**
 * Pricing tiers.
 */
export const PricingTiers: Story = {
  decorators: [
    (Story) => (
      <div className="p-8 w-[450px]">
        <Story />
      </div>
    ),
  ],
  render: function PricingTiersDemo() {
    const [tier, setTier] = React.useState('pro');

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-white">Choose your plan</h3>
        <RadioGroup value={tier} onValueChange={setTier}>
          <RadioCard
            value="hobby"
            title="Hobby"
            description="Perfect for side projects and experiments"
            extra={
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-white">$0</span>
                <span className="text-sm text-[var(--color-text-muted)]">/month</span>
              </div>
            }
          />
          <RadioCard
            value="pro"
            title="Pro"
            description="For professionals and growing teams"
            extra={
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-[#FFD700]">$20</span>
                <span className="text-sm text-[var(--color-text-muted)]">/month</span>
              </div>
            }
          />
          <RadioCard
            value="team"
            title="Team"
            description="Advanced features for larger teams"
            extra={
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-white">$50</span>
                <span className="text-sm text-[var(--color-text-muted)]">/month</span>
              </div>
            }
          />
        </RadioGroup>
        <button className="w-full py-2.5 px-4 rounded-lg bg-[#FFD700] text-black font-medium hover:bg-[#FFD700]/90 transition-colors">
          Continue with {tier.charAt(0).toUpperCase() + tier.slice(1)}
        </button>
      </div>
    );
  },
};
