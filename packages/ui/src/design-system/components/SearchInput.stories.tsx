import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { SearchInput } from './SearchInput';
import { Text, Card } from '../primitives';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SEARCHINPUT VISUAL REFERENCE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * This component renders as:
 *
 * COLLAPSED (expandable mode, icon-only):
 *   A 40x40px ghost button with a magnifying glass icon.
 *   Background transparent, hover shows subtle bg-hover.
 *
 * EXPANDED:
 *   A 240px wide rounded-xl input field with:
 *   - Left: Search icon (muted gray)
 *   - Center: Text input with placeholder
 *   - Right: Clear X button (appears when value exists)
 *   - Border: thin gray, focus ring is WHITE (never gold)
 *
 * LOADING:
 *   Search icon replaced with spinning loader.
 *   Input disabled.
 *
 * SIZE VARIANTS:
 *   sm: h-8, text-xs
 *   default: h-10, text-sm
 *   lg: h-12, text-base
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

const meta: Meta<typeof SearchInput> = {
  title: 'Design System/Components/Forms/SearchInput',
  component: SearchInput,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Expandable search input for navigation and filtering. Supports collapsed icon-only mode.',
      },
    },
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'default', 'lg'],
    },
    expandable: { control: 'boolean' },
    loading: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof SearchInput>;

/**
 * Default — Static search input
 */
export const Default: Story = {
  render: () => {
    const [value, setValue] = useState('');
    return (
      <SearchInput
        value={value}
        onChange={setValue}
        onSearch={(v) => console.log('Search:', v)}
        placeholder="Search..."
      />
    );
  },
};

/**
 * Expandable — Starts as icon, expands on click
 */
export const Expandable: Story = {
  render: () => {
    const [value, setValue] = useState('');
    return (
      <div className="flex items-center gap-4">
        <Text size="sm" tone="muted">
          Click icon:
        </Text>
        <SearchInput
          value={value}
          onChange={setValue}
          expandable
          defaultExpanded={false}
          placeholder="Search..."
        />
      </div>
    );
  },
};

/**
 * With value
 */
export const WithValue: Story = {
  render: () => {
    const [value, setValue] = useState('react hooks');
    return (
      <SearchInput
        value={value}
        onChange={setValue}
        onSearch={(v) => alert(`Searching for: ${v}`)}
        placeholder="Search..."
      />
    );
  },
};

/**
 * Loading state
 */
export const Loading: Story = {
  args: {
    value: 'searching...',
    loading: true,
    placeholder: 'Search...',
  },
};

/**
 * All sizes
 */
export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <Text size="xs" tone="muted" className="w-16">
          sm
        </Text>
        <SearchInput size="sm" placeholder="Small search..." />
      </div>
      <div className="flex items-center gap-4">
        <Text size="xs" tone="muted" className="w-16">
          default
        </Text>
        <SearchInput size="default" placeholder="Default search..." />
      </div>
      <div className="flex items-center gap-4">
        <Text size="xs" tone="muted" className="w-16">
          lg
        </Text>
        <SearchInput size="lg" placeholder="Large search..." />
      </div>
    </div>
  ),
};

/**
 * Disabled state
 */
export const Disabled: Story = {
  args: {
    value: 'disabled search',
    disabled: true,
    placeholder: 'Search...',
  },
};

/**
 * Custom width
 */
export const CustomWidth: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <SearchInput width={200} placeholder="200px..." />
      <SearchInput width={320} placeholder="320px..." />
      <SearchInput width="100%" placeholder="Full width..." />
    </div>
  ),
};

/**
 * In context — TopBar with search
 */
export const TopBarContext: Story = {
  render: () => {
    const [value, setValue] = useState('');
    return (
      <Card className="w-[600px] p-4">
        <div className="flex items-center justify-between">
          <Text size="lg" weight="semibold">
            UB Coders
          </Text>
          <SearchInput
            value={value}
            onChange={setValue}
            expandable
            defaultExpanded={false}
            placeholder="Search members..."
            size="sm"
          />
        </div>
      </Card>
    );
  },
};

/**
 * In context — Filter bar
 */
export const FilterBarContext: Story = {
  render: () => {
    const [value, setValue] = useState('');
    return (
      <Card className="w-[500px] p-4">
        <div className="flex items-center gap-3">
          <SearchInput
            value={value}
            onChange={setValue}
            placeholder="Filter by name..."
            width={200}
            size="sm"
          />
          <div className="flex gap-2">
            <button className="px-3 py-1.5 text-xs bg-[var(--color-bg-elevated)] rounded-lg border border-[var(--color-border)]">
              All
            </button>
            <button className="px-3 py-1.5 text-xs bg-[var(--color-bg-elevated)] rounded-lg border border-[var(--color-border)]">
              Active
            </button>
            <button className="px-3 py-1.5 text-xs bg-[var(--color-bg-elevated)] rounded-lg border border-[var(--color-border)]">
              Pending
            </button>
          </div>
        </div>
      </Card>
    );
  },
};
