'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { ToggleGroup, ToggleButton, type ToggleOption } from './ToggleGroup';

/**
 * ToggleGroup - LOCKED: January 11, 2026
 *
 * LOCKED DECISIONS:
 * - Variant: Outline Contained (default) - contained in elevated bg with border
 * - Selected: Glass highlight (bg-white/10) - subtle, not aggressive
 * - Hover: Glass hover (bg-white/[0.06]) - barely visible lift
 * - Gold variant: Gold TEXT only (text-[#FFD700]), NEVER gold background
 * - Size: Default 36px (h-9)
 * - Focus: WHITE ring (ring-white/50), never gold
 *
 * Single or multi-select button groups for options like filters, view modes, etc.
 */
const meta: Meta<typeof ToggleGroup> = {
  title: 'Design System/Components/ToggleGroup',
  component: ToggleGroup,
  parameters: {
    layout: 'padded',
    backgrounds: { default: 'dark' },
    docs: {
      description: {
        component: `
**LOCKED: January 11, 2026**

ToggleGroup provides single or multi-select button groups with consistent HIVE styling.

### Locked Design Decisions
| Decision | Value | Rationale |
|----------|-------|-----------|
| Container | Outline Contained | Elevated bg with border for clear grouping |
| Selected state | Glass highlight (\`bg-white/10\`) | Subtle, premium feel |
| Hover state | Glass hover (\`bg-white/[0.06]\`) | Barely visible lift |
| Gold variant | Gold TEXT only | Gold-as-light rule - never gold backgrounds |
| Default size | 36px (h-9) | Touch-friendly without being bulky |
| Focus ring | WHITE (\`ring-white/50\`) | Consistent focus treatment |
        `,
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="p-8 bg-[var(--color-bg-page)] min-h-[400px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ToggleGroup>;

// =============================================================================
// LOCKED DESIGN SHOWCASE
// =============================================================================

/**
 * **LOCKED DESIGN** - The final approved visual treatment
 *
 * This is the canonical representation of ToggleGroup showing all locked decisions:
 * - Outline Contained variant
 * - Glass highlight for selected (bg-white/10)
 * - Glass hover (bg-white/[0.06])
 * - Gold text for CTA variant
 */
export const LockedDesignShowcase: Story = {
  name: '⭐ Locked Design',
  render: () => {
    const [value1, setValue1] = useState('weekly');
    const [value2, setValue2] = useState('yes');
    const [pressed, setPressed] = useState(true);

    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="border-b border-white/10 pb-4">
          <h2 className="text-lg font-medium text-white">ToggleGroup - LOCKED</h2>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            January 11, 2026 • Outline Contained, Glass highlight, Gold text only
          </p>
        </div>

        {/* Default Selection */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
              Default Selected
            </span>
            <span className="text-label-xs text-white/40 bg-white/5 px-2 py-0.5 rounded">
              bg-white/10
            </span>
          </div>
          <ToggleGroup
            options={[
              { value: 'daily', label: 'Daily' },
              { value: 'weekly', label: 'Weekly' },
              { value: 'monthly', label: 'Monthly' },
            ]}
            value={value1}
            onChange={(v) => setValue1(v as string)}
          />
          <p className="text-xs text-white/40">
            Selected: Glass highlight • Unselected: Muted text • Hover: Glass tint
          </p>
        </div>

        {/* Gold Text CTA */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
              Gold CTA Variant
            </span>
            <span className="text-label-xs text-[#FFD700] bg-[#FFD700]/10 px-2 py-0.5 rounded">
              text-[#FFD700]
            </span>
          </div>
          <ToggleGroup
            options={[
              { value: 'yes', label: 'Yes, I agree' },
              { value: 'no', label: 'No thanks' },
            ]}
            value={value2}
            onChange={(v) => setValue2(v as string)}
            selectedVariant="gold"
          />
          <p className="text-xs text-white/40">
            Gold TEXT only, never gold background • Same glass highlight underneath
          </p>
        </div>

        {/* Toggle Button */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
              Standalone Toggle
            </span>
          </div>
          <div className="flex gap-4">
            <ToggleButton pressed={pressed} onPressedChange={setPressed}>
              Default
            </ToggleButton>
            <ToggleButton pressed={pressed} onPressedChange={setPressed} variant="gold">
              Gold CTA
            </ToggleButton>
          </div>
        </div>
      </div>
    );
  },
};

// =============================================================================
// FUNCTIONAL EXAMPLES
// =============================================================================

const frequencyOptions: ToggleOption[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

/**
 * Single select toggle (radio-like behavior)
 */
export const SingleSelect: Story = {
  render: () => {
    const [value, setValue] = useState('weekly');

    return (
      <ToggleGroup
        options={frequencyOptions}
        value={value}
        onChange={(v) => setValue(v as string)}
      />
    );
  },
};

/**
 * Multi select toggle (checkbox-like behavior)
 */
export const MultiSelect: Story = {
  render: () => {
    const [value, setValue] = useState<string[]>(['react', 'typescript']);
    const options: ToggleOption[] = [
      { value: 'react', label: 'React' },
      { value: 'vue', label: 'Vue' },
      { value: 'svelte', label: 'Svelte' },
      { value: 'angular', label: 'Angular' },
    ];

    return (
      <ToggleGroup
        options={options}
        value={value}
        onChange={(v) => setValue(v as string[])}
        multiple
      />
    );
  },
};

/**
 * Pills variant - rounded with border
 */
export const Pills: Story = {
  render: () => {
    const [value, setValue] = useState('all');
    const options: ToggleOption[] = [
      { value: 'all', label: 'All' },
      { value: 'active', label: 'Active' },
      { value: 'completed', label: 'Completed' },
      { value: 'archived', label: 'Archived' },
    ];

    return (
      <ToggleGroup
        options={options}
        value={value}
        onChange={(v) => setValue(v as string)}
        variant="pills"
      />
    );
  },
};

/**
 * Cards variant with descriptions
 */
export const Cards: Story = {
  render: () => {
    const [value, setValue] = useState('free');
    const options: ToggleOption[] = [
      { value: 'free', label: 'Free', description: 'Basic features' },
      { value: 'pro', label: 'Pro', description: '$9/month' },
      { value: 'enterprise', label: 'Enterprise', description: 'Custom pricing' },
    ];

    return (
      <ToggleGroup
        options={options}
        value={value}
        onChange={(v) => setValue(v as string)}
        variant="cards"
      />
    );
  },
};

/**
 * With icons
 */
export const WithIcons: Story = {
  render: () => {
    const [value, setValue] = useState('light');
    const options: ToggleOption[] = [
      {
        value: 'light',
        label: 'Light',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
          </svg>
        ),
      },
      {
        value: 'dark',
        label: 'Dark',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
          </svg>
        ),
      },
      {
        value: 'system',
        label: 'System',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
          </svg>
        ),
      },
    ];

    return (
      <ToggleGroup
        options={options}
        value={value}
        onChange={(v) => setValue(v as string)}
      />
    );
  },
};

/**
 * Gold selected variant - for CTAs
 *
 * LOCKED: Gold TEXT only, never gold background
 */
export const GoldSelected: Story = {
  render: () => {
    const [value, setValue] = useState('yes');
    const options: ToggleOption[] = [
      { value: 'yes', label: 'Yes, I agree' },
      { value: 'no', label: 'No thanks' },
    ];

    return (
      <div className="space-y-4">
        <ToggleGroup
          options={options}
          value={value}
          onChange={(v) => setValue(v as string)}
          selectedVariant="gold"
        />
        <p className="text-xs text-white/40">
          Notice: Gold TEXT (#FFD700), not gold background. Glass highlight underneath.
        </p>
      </div>
    );
  },
};

/**
 * All sizes comparison
 */
export const Sizes: Story = {
  render: () => {
    const [value, setValue] = useState('option1');
    const options: ToggleOption[] = [
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2' },
      { value: 'option3', label: 'Option 3' },
    ];

    return (
      <div className="space-y-6">
        <div>
          <p className="text-xs text-[var(--color-text-muted)] mb-2">Small (h-7)</p>
          <ToggleGroup options={options} value={value} onChange={(v) => setValue(v as string)} size="sm" />
        </div>
        <div>
          <p className="text-xs text-[var(--color-text-muted)] mb-2">Default (h-9) — LOCKED</p>
          <ToggleGroup options={options} value={value} onChange={(v) => setValue(v as string)} size="default" />
        </div>
        <div>
          <p className="text-xs text-[var(--color-text-muted)] mb-2">Large (h-11)</p>
          <ToggleGroup options={options} value={value} onChange={(v) => setValue(v as string)} size="lg" />
        </div>
      </div>
    );
  },
};

/**
 * Disabled options
 */
export const DisabledOptions: Story = {
  render: () => {
    const [value, setValue] = useState('free');
    const options: ToggleOption[] = [
      { value: 'free', label: 'Free' },
      { value: 'pro', label: 'Pro', disabled: true },
      { value: 'enterprise', label: 'Enterprise' },
    ];

    return (
      <ToggleGroup
        options={options}
        value={value}
        onChange={(v) => setValue(v as string)}
      />
    );
  },
};

/**
 * Standalone toggle button
 */
export const StandaloneButton: Story = {
  render: () => {
    const [pressed, setPressed] = useState(false);

    return (
      <div className="space-y-4">
        <div>
          <p className="text-xs text-[var(--color-text-muted)] mb-2">Default</p>
          <ToggleButton pressed={pressed} onPressedChange={setPressed}>
            Toggle Me
          </ToggleButton>
        </div>
        <div>
          <p className="text-xs text-[var(--color-text-muted)] mb-2">Gold variant</p>
          <ToggleButton pressed={pressed} onPressedChange={setPressed} variant="gold">
            Gold Toggle
          </ToggleButton>
        </div>
      </div>
    );
  },
};

/**
 * Ghost variant - minimal container
 */
export const Ghost: Story = {
  render: () => {
    const [value, setValue] = useState('option1');
    const options: ToggleOption[] = [
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2' },
      { value: 'option3', label: 'Option 3' },
    ];

    return (
      <ToggleGroup
        options={options}
        value={value}
        onChange={(v) => setValue(v as string)}
        variant="ghost"
      />
    );
  },
};
