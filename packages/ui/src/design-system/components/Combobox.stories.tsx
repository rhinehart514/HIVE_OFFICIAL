'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { Combobox } from './Combobox';
import * as React from 'react';

/**
 * Combobox - LOCKED: January 11, 2026
 *
 * LOCKED DECISIONS:
 * - Trigger: Pure Float (matches Input pattern)
 * - Options: Glass hover (bg-white/10) + Check icon
 * - Create CTA: Gold TEXT only (#FFD700) - gold-as-light rule
 * - Empty: Simple "No results found" text
 * - Loading: Spinner (matches Button pattern)
 * - Focus: WHITE ring (ring-white/50), never gold
 *
 * Searchable dropdown with filtering and keyboard navigation.
 */
const meta: Meta<typeof Combobox> = {
  title: 'Design System/Components/Combobox',
  component: Combobox,
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'dark' },
    docs: {
      description: {
        component: `
**LOCKED: January 11, 2026**

Combobox provides a searchable dropdown with filtering and keyboard navigation.

### Locked Design Decisions
| Decision | Value | Rationale |
|----------|-------|-----------|
| Trigger style | Pure Float | Matches Input pattern for consistency |
| Option hover | Glass (\`bg-white/10\`) | Subtle highlight on hover |
| Selected indicator | Check icon | Clear selection feedback |
| Create CTA | Gold TEXT (\`#FFD700\`) | Gold-as-light rule for CTAs |
| Empty state | "No results found" | Simple, clear messaging |
| Loading state | Spinner | Matches Button loading pattern |
| Focus ring | WHITE (\`ring-white/50\`) | Consistent focus treatment |
        `,
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="p-8 w-[320px] bg-[var(--color-bg-page)]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Combobox>;

const basicOptions = [
  { value: 'react', label: 'React' },
  { value: 'vue', label: 'Vue' },
  { value: 'angular', label: 'Angular' },
  { value: 'svelte', label: 'Svelte' },
  { value: 'solid', label: 'Solid' },
];

// =============================================================================
// LOCKED DESIGN SHOWCASE
// =============================================================================

/**
 * **LOCKED DESIGN** - The final approved visual treatment
 *
 * This showcases the canonical Combobox patterns:
 * - Pure Float trigger (matches Input)
 * - Glass hover on options
 * - Check icon for selected
 * - Gold text for Create CTA
 */
export const LockedDesignShowcase: Story = {
  name: '⭐ Locked Design',
  render: function LockedDesignDemo() {
    const [options, setOptions] = React.useState([
      { value: 'tag1', label: 'JavaScript' },
      { value: 'tag2', label: 'TypeScript' },
      { value: 'tag3', label: 'Python' },
    ]);

    return (
      <div className="space-y-8 w-[400px]">
        {/* Header */}
        <div className="border-b border-white/10 pb-4">
          <h2 className="text-lg font-medium text-white">Combobox - LOCKED</h2>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            January 11, 2026 • Pure Float, Glass hover, Gold Create CTA
          </p>
        </div>

        {/* Standard */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
              Standard
            </span>
            <span className="text-label-xs text-white/40 bg-white/5 px-2 py-0.5 rounded">
              Pure Float trigger
            </span>
          </div>
          <Combobox
            options={basicOptions}
            placeholder="Select framework..."
            defaultValue="react"
          />
          <p className="text-xs text-white/40">
            Click to open • Type to filter • Arrow keys to navigate • Enter to select
          </p>
        </div>

        {/* With Groups */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
              Grouped Options
            </span>
            <span className="text-label-xs text-white/40 bg-white/5 px-2 py-0.5 rounded">
              Check icon selected
            </span>
          </div>
          <Combobox
            placeholder="Select a space..."
            options={[
              {
                label: 'Recent',
                options: [
                  { value: 'space1', label: 'Engineering Club' },
                  { value: 'space2', label: 'Design Society' },
                ],
              },
              {
                label: 'All Spaces',
                options: [
                  { value: 'space3', label: 'Music Collective' },
                  { value: 'space4', label: 'Photography Guild' },
                ],
              },
            ]}
          />
        </div>

        {/* Creatable - Gold CTA */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
              Creatable
            </span>
            <span className="text-label-xs text-[#FFD700] bg-[#FFD700]/10 px-2 py-0.5 rounded">
              Gold text CTA
            </span>
          </div>
          <Combobox
            options={options}
            placeholder="Search or create tag..."
            searchPlaceholder="Type a tag name..."
            creatable
            onCreate={(value) => {
              const newOption = { value: `tag${options.length + 1}`, label: value };
              setOptions([...options, newOption]);
            }}
          />
          <p className="text-xs text-white/40">
            Type a new value and see &quot;+ Create&quot; in gold text
          </p>
        </div>

        {/* States */}
        <div className="space-y-3">
          <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
            States
          </span>
          <div className="space-y-4">
            <div>
              <p className="text-label-xs text-white/40 mb-1">Loading</p>
              <Combobox options={[]} placeholder="Loading..." loading />
            </div>
            <div>
              <p className="text-label-xs text-white/40 mb-1">Error</p>
              <Combobox options={basicOptions} placeholder="Required..." error />
            </div>
            <div>
              <p className="text-label-xs text-white/40 mb-1">Disabled</p>
              <Combobox options={basicOptions} placeholder="Disabled..." disabled />
            </div>
          </div>
        </div>
      </div>
    );
  },
};

// =============================================================================
// FUNCTIONAL EXAMPLES
// =============================================================================

/**
 * Default searchable combobox.
 */
export const Default: Story = {
  args: {
    options: basicOptions,
    placeholder: 'Select a framework...',
  },
};

/**
 * Combobox with default value.
 */
export const WithDefaultValue: Story = {
  args: {
    options: basicOptions,
    defaultValue: 'react',
  },
};

/**
 * Combobox sizes.
 */
export const Sizes: StoryObj = {
  render: () => (
    <div className="space-y-4">
      <div>
        <p className="text-xs text-[var(--color-text-muted)] mb-2">Small (h-8)</p>
        <Combobox options={basicOptions} size="sm" placeholder="Small..." />
      </div>
      <div>
        <p className="text-xs text-[var(--color-text-muted)] mb-2">Medium (h-10) — LOCKED default</p>
        <Combobox options={basicOptions} size="md" placeholder="Medium..." />
      </div>
      <div>
        <p className="text-xs text-[var(--color-text-muted)] mb-2">Large (h-12)</p>
        <Combobox options={basicOptions} size="lg" placeholder="Large..." />
      </div>
    </div>
  ),
};

/**
 * Combobox with icons.
 */
export const WithIcons: Story = {
  args: {
    placeholder: 'Select a destination...',
    options: [
      { value: 'home', label: 'Home', icon: '🏠' },
      { value: 'profile', label: 'Profile', icon: '👤' },
      { value: 'settings', label: 'Settings', icon: '⚙️' },
      { value: 'help', label: 'Help', icon: '❓' },
      { value: 'logout', label: 'Logout', icon: '🚪' },
    ],
  },
};

/**
 * Combobox with descriptions.
 */
export const WithDescriptions: Story = {
  args: {
    placeholder: 'Select a plan...',
    options: [
      { value: 'free', label: 'Free', description: 'Basic features, always free' },
      { value: 'starter', label: 'Starter', description: '$9/month, for individuals' },
      { value: 'pro', label: 'Pro', description: '$29/month, for teams' },
      { value: 'enterprise', label: 'Enterprise', description: 'Custom pricing' },
    ],
  },
};

/**
 * Combobox with grouped options.
 */
export const WithGroups: Story = {
  args: {
    placeholder: 'Select a space...',
    options: [
      {
        label: 'Recent',
        options: [
          { value: 'space1', label: 'Engineering Club', icon: '⚙️' },
          { value: 'space2', label: 'Design Society', icon: '🎨' },
        ],
      },
      {
        label: 'All Spaces',
        options: [
          { value: 'space3', label: 'Music Collective', icon: '🎵' },
          { value: 'space4', label: 'Photography Guild', icon: '📷' },
          { value: 'space5', label: 'Sports League', icon: '⚽' },
        ],
      },
    ],
  },
};

/**
 * Combobox with disabled options.
 */
export const WithDisabledOptions: Story = {
  args: {
    placeholder: 'Select an option...',
    options: [
      { value: 'opt1', label: 'Available Option' },
      { value: 'opt2', label: 'Disabled Option', disabled: true },
      { value: 'opt3', label: 'Another Available' },
      { value: 'opt4', label: 'Also Disabled', disabled: true },
    ],
  },
};

/**
 * Disabled combobox.
 */
export const Disabled: Story = {
  args: {
    options: basicOptions,
    placeholder: 'Combobox is disabled...',
    disabled: true,
  },
};

/**
 * Error state - red border, white focus ring
 */
export const WithError: StoryObj = {
  render: () => (
    <div className="space-y-2">
      <Combobox options={basicOptions} placeholder="Select required..." error />
      <p className="text-xs text-[#FF6B6B]">Please select an option</p>
    </div>
  ),
};

/**
 * Loading state - spinner matches Button pattern
 */
export const Loading: Story = {
  args: {
    options: [],
    placeholder: 'Loading options...',
    loading: true,
  },
};

/**
 * Creatable combobox - LOCKED: Gold text for Create CTA
 *
 * Type a new value that doesn't exist to see the gold "+ Create" option
 */
export const Creatable: StoryObj = {
  render: function CreatableDemo() {
    const [options, setOptions] = React.useState([
      { value: 'tag1', label: 'JavaScript' },
      { value: 'tag2', label: 'TypeScript' },
      { value: 'tag3', label: 'Python' },
    ]);

    return (
      <div className="space-y-4">
        <Combobox
          options={options}
          placeholder="Search or create..."
          creatable
          onCreate={(value) => {
            const newOption = { value: `tag${options.length + 1}`, label: value };
            setOptions([...options, newOption]);
          }}
        />
        <p className="text-xs text-white/40">
          Type &quot;rust&quot; to see the gold &quot;+ Create&quot; CTA
        </p>
      </div>
    );
  },
};

/**
 * Controlled combobox.
 */
export const Controlled: StoryObj = {
  render: function ControlledDemo() {
    const [value, setValue] = React.useState('react');

    return (
      <div className="space-y-4">
        <Combobox
          options={basicOptions}
          value={value}
          onValueChange={setValue}
        />
        <p className="text-sm text-[var(--color-text-muted)]">
          Selected: <span className="text-white">{value}</span>
        </p>
        <div className="flex gap-2 flex-wrap">
          {basicOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setValue(opt.value)}
              className={`px-2 py-1 rounded text-xs transition-colors ${
                value === opt.value
                  ? 'bg-white text-black'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    );
  },
};

/**
 * Combobox with many options - scrollable list.
 */
export const ManyOptions: Story = {
  args: {
    placeholder: 'Search countries...',
    searchPlaceholder: 'Type to filter...',
    options: [
      { value: 'us', label: 'United States' },
      { value: 'ca', label: 'Canada' },
      { value: 'uk', label: 'United Kingdom' },
      { value: 'au', label: 'Australia' },
      { value: 'de', label: 'Germany' },
      { value: 'fr', label: 'France' },
      { value: 'jp', label: 'Japan' },
      { value: 'cn', label: 'China' },
      { value: 'in', label: 'India' },
      { value: 'br', label: 'Brazil' },
      { value: 'mx', label: 'Mexico' },
      { value: 'es', label: 'Spain' },
      { value: 'it', label: 'Italy' },
      { value: 'nl', label: 'Netherlands' },
      { value: 'se', label: 'Sweden' },
      { value: 'no', label: 'Norway' },
      { value: 'dk', label: 'Denmark' },
      { value: 'fi', label: 'Finland' },
      { value: 'ch', label: 'Switzerland' },
      { value: 'at', label: 'Austria' },
    ],
  },
};

/**
 * Combobox in a form context.
 */
export const InForm: StoryObj = {
  render: () => (
    <div className="space-y-4 w-[400px]">
      <div className="space-y-2">
        <label className="text-sm font-medium text-white">Assign to Member</label>
        <Combobox
          placeholder="Search members..."
          searchPlaceholder="Type a name..."
          options={[
            { value: 'user1', label: 'Alice Johnson', icon: '👩' },
            { value: 'user2', label: 'Bob Smith', icon: '👨' },
            { value: 'user3', label: 'Carol White', icon: '👩' },
            { value: 'user4', label: 'David Brown', icon: '👨' },
          ]}
        />
        <p className="text-xs text-[var(--color-text-muted)]">
          Search and select a team member
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-white">Category</label>
        <Combobox
          placeholder="Select or create category..."
          options={[
            {
              label: 'Popular',
              options: [
                { value: 'bug', label: 'Bug', icon: '🐛' },
                { value: 'feature', label: 'Feature', icon: '✨' },
              ],
            },
            {
              label: 'Other',
              options: [
                { value: 'docs', label: 'Documentation', icon: '📚' },
                { value: 'question', label: 'Question', icon: '❓' },
              ],
            },
          ]}
          creatable
          onCreate={(val) => console.log('Created:', val)}
        />
      </div>
    </div>
  ),
};

/**
 * Custom empty state text.
 */
export const CustomEmptyState: Story = {
  args: {
    options: [
      { value: 'opt1', label: 'Only Option' },
    ],
    placeholder: 'Search...',
    emptyText: 'No matching results. Try a different search term.',
  },
};
