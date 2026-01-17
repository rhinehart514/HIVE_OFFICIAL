'use client';

import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';
import { useState } from 'react';

// Import form components for testing
import { TagInput, Tag } from '../components/TagInput';
import { SearchInput } from '../components/SearchInput';
import { NumberInput, CurrencyInput, PercentInput } from '../components/NumberInput';
import { DatePicker } from '../components/DatePicker';
import { FormField } from '../components/FormField';
import { OTPInput } from '../components/OTPInput';
import { EmailInput } from '../components/EmailInput';
import { ImageUploader } from '../components/ImageUploader';
import { SimpleRadioGroup } from '../components/RadioGroup';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * FORM COMPONENTS LAB
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Testing design decisions for form components.
 * Each experiment compares variants side-by-side.
 *
 * KEY DECISIONS TO LOCK:
 * 1. TagInput: Tag removal animation (fade vs scale vs instant)
 * 2. SearchInput: Expand animation timing
 * 3. NumberInput: Stepper button style (icon vs text)
 * 4. DatePicker: Calendar header style
 * 5. OTPInput: Focus behavior (auto-advance vs manual)
 * 6. RadioGroup: Card selection glow (gold edge vs white border)
 */

const meta: Meta = {
  title: 'Experiments/Form Components Lab',
  parameters: {
    layout: 'padded',
    backgrounds: { default: 'dark' },
  },
  decorators: [
    (Story) => (
      <div className="min-h-screen bg-[#0A0A09] p-8">
        <Story />
      </div>
    ),
  ],
};

export default meta;

// =============================================================================
// EXPERIMENT 1: TAG INPUT - Tag Appearance & Removal
// =============================================================================

/**
 * **EXPERIMENT: Tag Input Variants**
 *
 * Testing:
 * 1. Tag variant colors (default, primary, gold, muted)
 * 2. Tag size (sm, default, lg)
 * 3. Focus ring color (white vs gold)
 *
 * HYPOTHESIS: Gold tags should only be used for featured/special items
 */
export const TagInputLab: StoryObj = {
  name: '🧪 TagInput Variants',
  render: function TagInputExperiment() {
    const [tags1, setTags1] = useState(['React', 'TypeScript']);
    const [tags2, setTags2] = useState(['Featured']);
    const [tags3, setTags3] = useState(['Draft', 'Archived']);

    return (
      <div className="space-y-8 max-w-2xl">
        {/* Header */}
        <div className="border-b border-white/10 pb-4">
          <h2 className="text-lg font-medium text-white">TagInput Lab</h2>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Testing tag variants, sizes, and interaction states
          </p>
        </div>

        {/* Variant A: Default Tags */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
              A: Default Variant
            </span>
            <span className="text-[10px] text-white/40 bg-white/5 px-2 py-0.5 rounded">
              For general tags
            </span>
          </div>
          <TagInput
            value={tags1}
            onChange={setTags1}
            placeholder="Add tags..."
          />
          <div className="flex gap-2 mt-2">
            <Tag>Static Tag</Tag>
            <Tag onRemove={() => {}}>Removable</Tag>
          </div>
        </div>

        {/* Variant B: Gold Tags */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
              B: Gold Variant
            </span>
            <span className="text-[10px] text-[#FFD700] bg-[#FFD700]/10 px-2 py-0.5 rounded">
              For featured/premium
            </span>
          </div>
          <TagInput
            value={tags2}
            onChange={setTags2}
            placeholder="Add featured..."
            variant="gold"
          />
          <div className="flex gap-2 mt-2">
            <Tag variant="gold">Featured</Tag>
            <Tag variant="gold" onRemove={() => {}}>Premium</Tag>
          </div>
        </div>

        {/* Variant C: Muted Tags */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
              C: Muted Variant
            </span>
            <span className="text-[10px] text-white/40 bg-white/5 px-2 py-0.5 rounded">
              For archived/inactive
            </span>
          </div>
          <TagInput
            value={tags3}
            onChange={setTags3}
            placeholder="Add status..."
          />
          <div className="flex gap-2 mt-2">
            <Tag variant="muted">Archived</Tag>
            <Tag variant="muted" onRemove={() => {}}>Draft</Tag>
          </div>
        </div>

        {/* Size Comparison */}
        <div className="space-y-3 pt-4 border-t border-white/10">
          <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
            Size Comparison
          </span>
          <div className="flex items-center gap-4">
            <div>
              <p className="text-[10px] text-white/40 mb-2">Small</p>
              <Tag size="sm">Small</Tag>
            </div>
            <div>
              <p className="text-[10px] text-white/40 mb-2">Default</p>
              <Tag size="default">Default</Tag>
            </div>
            <div>
              <p className="text-[10px] text-white/40 mb-2">Large</p>
              <Tag size="lg">Large</Tag>
            </div>
          </div>
        </div>
      </div>
    );
  },
};

// =============================================================================
// EXPERIMENT 2: NUMBER INPUT - Stepper Styles
// =============================================================================

/**
 * **EXPERIMENT: Number Input Stepper Positions**
 *
 * Testing:
 * 1. Stepper position (right, sides, vertical)
 * 2. Button hover state
 * 3. Focus ring behavior
 *
 * HYPOTHESIS: Right-side stepper is most intuitive for LTR users
 */
export const NumberInputLab: StoryObj = {
  name: '🧪 NumberInput Variants',
  render: function NumberInputExperiment() {
    const [value1, setValue1] = useState(42);
    const [value2, setValue2] = useState(42);
    const [value3, setValue3] = useState(42);

    return (
      <div className="space-y-8 max-w-md">
        {/* Header */}
        <div className="border-b border-white/10 pb-4">
          <h2 className="text-lg font-medium text-white">NumberInput Lab</h2>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Testing stepper positions and specialized inputs
          </p>
        </div>

        {/* Position A: Right Stepper */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
              A: Right Stepper (Default)
            </span>
          </div>
          <NumberInput
            value={value1}
            onChange={setValue1}
            min={0}
            max={100}
            stepperPosition="right"
          />
          <p className="text-xs text-white/40">
            Most common pattern • Clear increment/decrement buttons
          </p>
        </div>

        {/* Position B: Side Steppers */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
              B: Side Steppers
            </span>
          </div>
          <NumberInput
            value={value2}
            onChange={setValue2}
            min={0}
            max={100}
            stepperPosition="sides"
          />
          <p className="text-xs text-white/40">
            Symmetric layout • Good for quantities
          </p>
        </div>

        {/* Position C: Vertical Stepper */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
              C: Vertical Stepper
            </span>
          </div>
          <NumberInput
            value={value3}
            onChange={setValue3}
            min={0}
            max={100}
            stepperPosition="vertical"
          />
          <p className="text-xs text-white/40">
            Compact • Traditional spinner style
          </p>
        </div>

        {/* Specialized Inputs */}
        <div className="space-y-4 pt-4 border-t border-white/10">
          <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
            Specialized Variants
          </span>
          <div className="space-y-4">
            <div>
              <p className="text-[10px] text-white/40 mb-2">Currency Input</p>
              <CurrencyInput defaultValue={99.99} />
            </div>
            <div>
              <p className="text-[10px] text-white/40 mb-2">Percent Input</p>
              <PercentInput defaultValue={75} />
            </div>
          </div>
        </div>

        {/* Size Comparison */}
        <div className="space-y-4 pt-4 border-t border-white/10">
          <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
            Size Comparison
          </span>
          <div className="space-y-3">
            <div>
              <p className="text-[10px] text-white/40 mb-2">Small</p>
              <NumberInput defaultValue={42} size="sm" />
            </div>
            <div>
              <p className="text-[10px] text-white/40 mb-2">Medium (Default)</p>
              <NumberInput defaultValue={42} size="md" />
            </div>
            <div>
              <p className="text-[10px] text-white/40 mb-2">Large</p>
              <NumberInput defaultValue={42} size="lg" />
            </div>
          </div>
        </div>
      </div>
    );
  },
};

// =============================================================================
// EXPERIMENT 3: SEARCH INPUT - Expand Behavior
// =============================================================================

/**
 * **EXPERIMENT: SearchInput Expand Modes**
 *
 * Testing:
 * 1. Static vs expandable
 * 2. Expand animation timing
 * 3. Clear button behavior
 */
export const SearchInputLab: StoryObj = {
  name: '🧪 SearchInput Variants',
  render: function SearchInputExperiment() {
    const [value1, setValue1] = useState('');
    const [value2, setValue2] = useState('');
    const [value3, setValue3] = useState('react hooks');

    return (
      <div className="space-y-8 max-w-md">
        {/* Header */}
        <div className="border-b border-white/10 pb-4">
          <h2 className="text-lg font-medium text-white">SearchInput Lab</h2>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Testing static vs expandable modes
          </p>
        </div>

        {/* Mode A: Static */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
              A: Static (Always Visible)
            </span>
          </div>
          <SearchInput
            value={value1}
            onChange={setValue1}
            placeholder="Search..."
          />
          <p className="text-xs text-white/40">
            Always shows full input • Good for search-focused UIs
          </p>
        </div>

        {/* Mode B: Expandable */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
              B: Expandable (Icon → Input)
            </span>
          </div>
          <SearchInput
            value={value2}
            onChange={setValue2}
            expandable
            defaultExpanded={false}
            placeholder="Click icon..."
          />
          <p className="text-xs text-white/40">
            Starts as icon • Expands on click • Space efficient
          </p>
        </div>

        {/* Mode C: With Value */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
              C: With Clear Button
            </span>
          </div>
          <SearchInput
            value={value3}
            onChange={setValue3}
            placeholder="Search..."
          />
          <p className="text-xs text-white/40">
            Shows clear X when has value • Focus ring is WHITE
          </p>
        </div>

        {/* Size Comparison */}
        <div className="space-y-4 pt-4 border-t border-white/10">
          <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
            Size Comparison
          </span>
          <div className="space-y-3">
            <div>
              <p className="text-[10px] text-white/40 mb-2">Small</p>
              <SearchInput size="sm" placeholder="Small search..." />
            </div>
            <div>
              <p className="text-[10px] text-white/40 mb-2">Default</p>
              <SearchInput size="default" placeholder="Default search..." />
            </div>
            <div>
              <p className="text-[10px] text-white/40 mb-2">Large</p>
              <SearchInput size="lg" placeholder="Large search..." />
            </div>
          </div>
        </div>
      </div>
    );
  },
};

// =============================================================================
// EXPERIMENT 4: RADIO GROUP - Selection Styles
// =============================================================================

/**
 * **EXPERIMENT: RadioGroup Selection Styles**
 *
 * Testing:
 * 1. Basic radio vs card style
 * 2. Selected indicator color (gold dot vs white dot)
 * 3. Card selection border
 */
export const RadioGroupLab: StoryObj = {
  name: '🧪 RadioGroup Variants',
  render: function RadioGroupExperiment() {
    const [value1, setValue1] = useState('option1');
    const [value2, setValue2] = useState('basic');

    const basicOptions = [
      { value: 'option1', label: 'Option One', description: 'First option description' },
      { value: 'option2', label: 'Option Two', description: 'Second option description' },
      { value: 'option3', label: 'Option Three', description: 'Third option description' },
    ];

    const planOptions = [
      { value: 'basic', label: 'Basic Plan', description: 'Free forever' },
      { value: 'pro', label: 'Pro Plan', description: '$9/month' },
      { value: 'enterprise', label: 'Enterprise', description: 'Custom pricing' },
    ];

    return (
      <div className="space-y-8 max-w-md">
        {/* Header */}
        <div className="border-b border-white/10 pb-4">
          <h2 className="text-lg font-medium text-white">RadioGroup Lab</h2>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Testing radio styles and selection indicators
          </p>
        </div>

        {/* Style A: Basic Radio */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
              A: Basic Radio
            </span>
            <span className="text-[10px] text-[#FFD700] bg-[#FFD700]/10 px-2 py-0.5 rounded">
              Gold indicator
            </span>
          </div>
          <SimpleRadioGroup
            options={basicOptions}
            value={value1}
            onValueChange={setValue1}
          />
          <p className="text-xs text-white/40">
            Gold dot indicator • WHITE focus ring • Vertical layout
          </p>
        </div>

        {/* Style B: Card Radio */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
              B: Card Style
            </span>
            <span className="text-[10px] text-[#FFD700] bg-[#FFD700]/10 px-2 py-0.5 rounded">
              Gold border on select
            </span>
          </div>
          <SimpleRadioGroup
            options={planOptions}
            value={value2}
            onValueChange={setValue2}
            cardStyle
          />
          <p className="text-xs text-white/40">
            Selected card: Gold border + subtle gold bg • Premium feel
          </p>
        </div>

        {/* Size Comparison */}
        <div className="space-y-4 pt-4 border-t border-white/10">
          <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
            Size Comparison (Radio Dot)
          </span>
          <div className="flex items-center gap-8">
            <div>
              <p className="text-[10px] text-white/40 mb-2">Small (14px)</p>
              <SimpleRadioGroup
                options={[{ value: 'a', label: 'Small' }]}
                value="a"
                size="sm"
              />
            </div>
            <div>
              <p className="text-[10px] text-white/40 mb-2">Default (16px)</p>
              <SimpleRadioGroup
                options={[{ value: 'b', label: 'Default' }]}
                value="b"
                size="default"
              />
            </div>
            <div>
              <p className="text-[10px] text-white/40 mb-2">Large (20px)</p>
              <SimpleRadioGroup
                options={[{ value: 'c', label: 'Large' }]}
                value="c"
                size="lg"
              />
            </div>
          </div>
        </div>
      </div>
    );
  },
};

// =============================================================================
// EXPERIMENT 5: OTP INPUT - Auto-advance Behavior
// =============================================================================

/**
 * **EXPERIMENT: OTP Input Behavior**
 *
 * Testing:
 * 1. Auto-advance on input
 * 2. Backspace behavior
 * 3. Paste handling
 */
export const OTPInputLab: StoryObj = {
  name: '🧪 OTPInput Variants',
  render: function OTPInputExperiment() {
    const [value1, setValue1] = useState('');
    const [value2, setValue2] = useState('');

    return (
      <div className="space-y-8 max-w-md">
        {/* Header */}
        <div className="border-b border-white/10 pb-4">
          <h2 className="text-lg font-medium text-white">OTPInput Lab</h2>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Testing OTP code entry behavior
          </p>
        </div>

        {/* 6-digit OTP */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
              A: 6-Digit Code
            </span>
            <span className="text-[10px] text-white/40 bg-white/5 px-2 py-0.5 rounded">
              Standard auth
            </span>
          </div>
          <OTPInput
            value={value1}
            onChange={setValue1}
            length={6}
          />
          <p className="text-xs text-white/40">
            Auto-advance on input • Backspace returns to previous • WHITE focus ring
          </p>
        </div>

        {/* 4-digit OTP */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
              B: 4-Digit Code
            </span>
            <span className="text-[10px] text-white/40 bg-white/5 px-2 py-0.5 rounded">
              Short codes
            </span>
          </div>
          <OTPInput
            value={value2}
            onChange={setValue2}
            length={4}
          />
          <p className="text-xs text-white/40">
            Shorter code for simple verification
          </p>
        </div>

        {/* States */}
        <div className="space-y-4 pt-4 border-t border-white/10">
          <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
            States
          </span>
          <div className="space-y-4">
            <div>
              <p className="text-[10px] text-white/40 mb-2">Error State</p>
              <OTPInput
                value="123"
                onChange={() => {}}
                length={6}
                error
              />
            </div>
            <div>
              <p className="text-[10px] text-white/40 mb-2">Disabled</p>
              <OTPInput
                value="123456"
                onChange={() => {}}
                length={6}
                disabled
              />
            </div>
          </div>
        </div>
      </div>
    );
  },
};

// =============================================================================
// EXPERIMENT 6: EMAIL INPUT - Domain Handling
// =============================================================================

/**
 * **EXPERIMENT: Email Input with Domain Lock**
 *
 * Testing:
 * 1. Domain suffix display
 * 2. Validation feedback
 * 3. Focus behavior
 */
export const EmailInputLab: StoryObj = {
  name: '🧪 EmailInput Variants',
  render: function EmailInputExperiment() {
    const [value1, setValue1] = useState('');
    const [value2, setValue2] = useState('');

    return (
      <div className="space-y-8 max-w-md">
        {/* Header */}
        <div className="border-b border-white/10 pb-4">
          <h2 className="text-lg font-medium text-white">EmailInput Lab</h2>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Testing campus email entry with domain lock
          </p>
        </div>

        {/* UB Domain */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
              A: UB Domain Lock
            </span>
          </div>
          <EmailInput
            value={value1}
            onChange={setValue1}
            domain="buffalo.edu"
            placeholder="person"
          />
          <p className="text-xs text-white/40">
            Domain is fixed • User enters handle only • Shows full email on blur
          </p>
        </div>

        {/* Generic Domain */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
              B: Other Campus
            </span>
          </div>
          <EmailInput
            value={value2}
            onChange={setValue2}
            domain="mit.edu"
            placeholder="username"
          />
          <p className="text-xs text-white/40">
            Same pattern, different domain
          </p>
        </div>

        {/* States */}
        <div className="space-y-4 pt-4 border-t border-white/10">
          <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
            States
          </span>
          <div className="space-y-4">
            <div>
              <p className="text-[10px] text-white/40 mb-2">Valid</p>
              <EmailInput
                value="student"
                onChange={() => {}}
                domain="buffalo.edu"
              />
            </div>
            <div>
              <p className="text-[10px] text-white/40 mb-2">Error</p>
              <EmailInput
                value="invalid user"
                onChange={() => {}}
                domain="buffalo.edu"
                error="Invalid characters in username"
              />
            </div>
          </div>
        </div>
      </div>
    );
  },
};

// =============================================================================
// MASTER SHOWCASE: All Form Components
// =============================================================================

/**
 * **MASTER SHOWCASE: All Form Components**
 *
 * Complete view of all form components for final review.
 */
export const MasterShowcase: StoryObj = {
  name: '⭐ All Form Components',
  render: function MasterShowcaseDemo() {
    return (
      <div className="space-y-12 max-w-4xl">
        {/* Header */}
        <div className="border-b border-white/10 pb-4">
          <h2 className="text-xl font-medium text-white">Form Components - Master Showcase</h2>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            All form components with HIVE design system styling
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8">
          {/* Column 1 */}
          <div className="space-y-8">
            {/* TagInput */}
            <div className="p-6 rounded-xl border border-white/10 bg-white/[0.02]">
              <h3 className="text-sm font-medium text-white mb-4">TagInput</h3>
              <TagInput
                value={['React', 'TypeScript']}
                onChange={() => {}}
                placeholder="Add tags..."
              />
            </div>

            {/* NumberInput */}
            <div className="p-6 rounded-xl border border-white/10 bg-white/[0.02]">
              <h3 className="text-sm font-medium text-white mb-4">NumberInput</h3>
              <NumberInput defaultValue={42} min={0} max={100} />
            </div>

            {/* SearchInput */}
            <div className="p-6 rounded-xl border border-white/10 bg-white/[0.02]">
              <h3 className="text-sm font-medium text-white mb-4">SearchInput</h3>
              <SearchInput placeholder="Search..." />
            </div>

            {/* DatePicker */}
            <div className="p-6 rounded-xl border border-white/10 bg-white/[0.02]">
              <h3 className="text-sm font-medium text-white mb-4">DatePicker</h3>
              <DatePicker />
            </div>
          </div>

          {/* Column 2 */}
          <div className="space-y-8">
            {/* OTPInput */}
            <div className="p-6 rounded-xl border border-white/10 bg-white/[0.02]">
              <h3 className="text-sm font-medium text-white mb-4">OTPInput</h3>
              <OTPInput value="" onChange={() => {}} length={6} />
            </div>

            {/* EmailInput */}
            <div className="p-6 rounded-xl border border-white/10 bg-white/[0.02]">
              <h3 className="text-sm font-medium text-white mb-4">EmailInput</h3>
              <EmailInput
                value=""
                onChange={() => {}}
                domain="buffalo.edu"
                placeholder="username"
              />
            </div>

            {/* RadioGroup */}
            <div className="p-6 rounded-xl border border-white/10 bg-white/[0.02]">
              <h3 className="text-sm font-medium text-white mb-4">RadioGroup</h3>
              <SimpleRadioGroup
                options={[
                  { value: 'a', label: 'Option A' },
                  { value: 'b', label: 'Option B' },
                  { value: 'c', label: 'Option C' },
                ]}
                value="a"
              />
            </div>

            {/* FormField */}
            <div className="p-6 rounded-xl border border-white/10 bg-white/[0.02]">
              <h3 className="text-sm font-medium text-white mb-4">FormField</h3>
              <FormField
                label="Display Name"
                description="This will be visible to others"
              >
                <input
                  className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/10 text-white"
                  placeholder="Enter name..."
                />
              </FormField>
            </div>
          </div>
        </div>

        {/* Design Principles */}
        <div className="p-6 rounded-xl bg-[#FFD700]/5 border border-[#FFD700]/20">
          <h3 className="text-sm font-medium text-[#FFD700] mb-3">Form Component Principles</h3>
          <ul className="space-y-2 text-sm text-white/70">
            <li>• <strong>Focus rings:</strong> Always WHITE (ring-white/50), never gold</li>
            <li>• <strong>Error states:</strong> Red border, not gold</li>
            <li>• <strong>Gold usage:</strong> Only for featured/premium tags or selection indicators</li>
            <li>• <strong>Disabled:</strong> 50% opacity, cursor-not-allowed</li>
            <li>• <strong>Transitions:</strong> 150ms for snap feedback, 200ms for smooth</li>
          </ul>
        </div>
      </div>
    );
  },
};
