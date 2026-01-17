'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { NumberInput, SimpleNumberInput, CurrencyInput, PercentInput } from './NumberInput';
import * as React from 'react';

const meta: Meta<typeof NumberInput> = {
  title: 'Design System/Components/NumberInput',
  component: NumberInput,
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'dark' },
  },
  decorators: [
    (Story) => (
      <div className="p-8 w-[300px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof NumberInput>;

/**
 * Default number input with stepper.
 */
export const Default: StoryObj = {
  render: function DefaultDemo() {
    const [value, setValue] = React.useState(42);
    return (
      <div className="space-y-4">
        <NumberInput value={value} onChange={setValue} />
        <p className="text-sm text-[var(--color-text-muted)]">Value: {value}</p>
      </div>
    );
  },
};

/**
 * Number input sizes.
 */
export const Sizes: StoryObj = {
  render: () => (
    <div className="space-y-4">
      <div>
        <p className="text-xs text-[var(--color-text-muted)] mb-2">Small</p>
        <NumberInput size="sm" defaultValue={10} />
      </div>
      <div>
        <p className="text-xs text-[var(--color-text-muted)] mb-2">Medium (default)</p>
        <NumberInput size="md" defaultValue={20} />
      </div>
      <div>
        <p className="text-xs text-[var(--color-text-muted)] mb-2">Large</p>
        <NumberInput size="lg" defaultValue={30} />
      </div>
    </div>
  ),
};

/**
 * Stepper positions.
 */
export const StepperPositions: StoryObj = {
  render: () => (
    <div className="space-y-4">
      <div>
        <p className="text-xs text-[var(--color-text-muted)] mb-2">Right (default)</p>
        <NumberInput stepperPosition="right" defaultValue={10} />
      </div>
      <div>
        <p className="text-xs text-[var(--color-text-muted)] mb-2">Sides</p>
        <NumberInput stepperPosition="sides" defaultValue={10} />
      </div>
      <div>
        <p className="text-xs text-[var(--color-text-muted)] mb-2">Vertical</p>
        <NumberInput stepperPosition="vertical" defaultValue={10} />
      </div>
    </div>
  ),
};

/**
 * Without stepper buttons.
 */
export const NoStepper: Story = {
  render: () => (
    <SimpleNumberInput defaultValue={42} />
  ),
};

/**
 * With min/max constraints.
 */
export const MinMax: StoryObj = {
  render: function MinMaxDemo() {
    const [value, setValue] = React.useState(5);
    return (
      <div className="space-y-4">
        <NumberInput
          value={value}
          onChange={setValue}
          min={0}
          max={10}
        />
        <p className="text-sm text-[var(--color-text-muted)]">
          Range: 0 - 10 (Current: {value})
        </p>
      </div>
    );
  },
};

/**
 * Custom step values.
 */
export const CustomStep: StoryObj = {
  render: function CustomStepDemo() {
    const [value, setValue] = React.useState(0);
    return (
      <div className="space-y-4">
        <NumberInput
          value={value}
          onChange={setValue}
          step={5}
          largeStep={25}
        />
        <p className="text-sm text-[var(--color-text-muted)]">
          Step: 5, Shift+Arrow: 25
        </p>
      </div>
    );
  },
};

/**
 * Decimal precision.
 */
export const DecimalPrecision: StoryObj = {
  render: function PrecisionDemo() {
    const [value, setValue] = React.useState(3.14);
    return (
      <div className="space-y-4">
        <NumberInput
          value={value}
          onChange={setValue}
          step={0.01}
          precision={2}
        />
        <p className="text-sm text-[var(--color-text-muted)]">
          Precision: 2 decimal places
        </p>
      </div>
    );
  },
};

/**
 * With prefix.
 */
export const WithPrefix: Story = {
  render: () => (
    <div className="space-y-4">
      <NumberInput prefix="$" defaultValue={100} precision={2} />
      <NumberInput prefix="€" defaultValue={50} precision={2} />
      <NumberInput prefix="#" defaultValue={42} />
    </div>
  ),
};

/**
 * With suffix.
 */
export const WithSuffix: Story = {
  render: () => (
    <div className="space-y-4">
      <NumberInput suffix="%" defaultValue={50} min={0} max={100} />
      <NumberInput suffix="px" defaultValue={16} min={0} />
      <NumberInput suffix="kg" defaultValue={75} step={0.5} precision={1} />
    </div>
  ),
};

/**
 * CurrencyInput pre-configured.
 */
export const Currency: StoryObj = {
  render: function CurrencyDemo() {
    const [value, setValue] = React.useState(99.99);
    return (
      <div className="space-y-4">
        <div>
          <p className="text-xs text-[var(--color-text-muted)] mb-2">USD</p>
          <CurrencyInput value={value} onChange={setValue} />
        </div>
        <div>
          <p className="text-xs text-[var(--color-text-muted)] mb-2">EUR</p>
          <CurrencyInput currency="€" defaultValue={49.99} />
        </div>
        <div>
          <p className="text-xs text-[var(--color-text-muted)] mb-2">GBP</p>
          <CurrencyInput currency="£" defaultValue={29.99} />
        </div>
      </div>
    );
  },
};

/**
 * PercentInput pre-configured.
 */
export const Percent: StoryObj = {
  render: function PercentDemo() {
    const [value, setValue] = React.useState(50);
    return (
      <div className="space-y-4">
        <PercentInput value={value} onChange={setValue} />
        <p className="text-sm text-[var(--color-text-muted)]">
          Clamped to 0-100
        </p>
      </div>
    );
  },
};

/**
 * Error state.
 */
export const Error: Story = {
  render: () => (
    <div className="space-y-2">
      <NumberInput error defaultValue={-5} min={0} />
      <p className="text-xs text-[#FF6B6B]">Value must be positive</p>
    </div>
  ),
};

/**
 * Disabled state.
 */
export const Disabled: Story = {
  render: () => (
    <NumberInput disabled defaultValue={42} />
  ),
};

/**
 * Custom formatting.
 */
export const CustomFormat: StoryObj = {
  render: function CustomFormatDemo() {
    const [value, setValue] = React.useState(1234567);
    return (
      <div className="space-y-4">
        <NumberInput
          value={value}
          onChange={setValue}
          step={1000}
          formatValue={(val) => val.toLocaleString()}
          parseValue={(text) => parseFloat(text.replace(/,/g, ''))}
        />
        <p className="text-sm text-[var(--color-text-muted)]">
          Displays with thousand separators
        </p>
      </div>
    );
  },
};

/**
 * Quantity selector example.
 */
export const QuantitySelector: StoryObj = {
  render: function QuantityDemo() {
    const [qty, setQty] = React.useState(1);
    return (
      <div className="p-4 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-medium text-white">Premium T-Shirt</h3>
            <p className="text-sm text-[var(--color-text-muted)]">$29.99</p>
          </div>
          <div className="w-32">
            <NumberInput
              size="sm"
              value={qty}
              onChange={setQty}
              min={1}
              max={10}
              stepperPosition="sides"
            />
          </div>
        </div>
        <div className="flex justify-between border-t border-[var(--color-border)] pt-4">
          <span className="text-[var(--color-text-muted)]">Total:</span>
          <span className="font-medium text-white">${(qty * 29.99).toFixed(2)}</span>
        </div>
      </div>
    );
  },
};

/**
 * Form field example.
 */
export const FormField: StoryObj = {
  render: function FormDemo() {
    const [age, setAge] = React.useState(25);
    return (
      <div className="space-y-6 p-6 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)]">
        <div className="space-y-2">
          <label className="text-sm font-medium text-white">Age</label>
          <NumberInput
            value={age}
            onChange={setAge}
            min={18}
            max={120}
          />
          <p className="text-xs text-[var(--color-text-muted)]">Must be 18 or older</p>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-white">Monthly Budget</label>
          <CurrencyInput defaultValue={500} step={50} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-white">Discount</label>
          <PercentInput defaultValue={10} step={5} />
        </div>
      </div>
    );
  },
};

/**
 * Settings panel example.
 */
export const SettingsPanel: StoryObj = {
  render: () => (
    <div className="space-y-4 p-4 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)]">
      <h3 className="font-medium text-white mb-4">Display Settings</h3>
      <div className="flex items-center justify-between">
        <label className="text-sm text-white">Font Size</label>
        <div className="w-24">
          <NumberInput
            size="sm"
            defaultValue={14}
            min={10}
            max={24}
            suffix="px"
            stepperPosition="sides"
          />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <label className="text-sm text-white">Line Height</label>
        <div className="w-24">
          <NumberInput
            size="sm"
            defaultValue={1.5}
            min={1}
            max={3}
            step={0.1}
            precision={1}
            stepperPosition="sides"
          />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <label className="text-sm text-white">Spacing</label>
        <div className="w-24">
          <NumberInput
            size="sm"
            defaultValue={8}
            min={0}
            max={32}
            step={4}
            suffix="px"
            stepperPosition="sides"
          />
        </div>
      </div>
    </div>
  ),
};

/**
 * Keyboard interaction demo.
 */
export const KeyboardInteraction: Story = {
  render: () => (
    <div className="space-y-4">
      <NumberInput defaultValue={50} step={1} largeStep={10} min={0} max={100} />
      <div className="text-xs text-[var(--color-text-muted)] space-y-1">
        <p>• Arrow Up/Down: ±1</p>
        <p>• Shift + Arrow: ±10</p>
        <p>• Page Up/Down: ±10</p>
        <p>• Home: Go to min</p>
        <p>• End: Go to max</p>
        <p>• Hold button: Accelerate</p>
      </div>
    </div>
  ),
};
