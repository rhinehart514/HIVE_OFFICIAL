import type { Meta, StoryObj } from '@storybook/react';
import { RadioGroup, RadioItem } from './Radio';
import { Label } from './Label';
import { Text } from './Text';

/**
 * Radio — Single selection control
 *
 * White indicator dot when selected.
 * Focus ring is WHITE, never gold.
 *
 * @see docs/design-system/PRIMITIVES.md (Radio)
 */
const meta: Meta<typeof RadioGroup> = {
  title: 'Design System/Primitives/Inputs/Radio',
  component: RadioGroup,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Radio button group with WHITE indicator dot and WHITE focus ring (never gold).',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof RadioGroup>;

/**
 * Default — Basic radio group
 */
export const Default: Story = {
  render: () => (
    <RadioGroup defaultValue="option-1">
      <div className="flex items-center gap-3">
        <RadioItem value="option-1" id="option-1" />
        <Label htmlFor="option-1" className="cursor-pointer">Option 1</Label>
      </div>
      <div className="flex items-center gap-3">
        <RadioItem value="option-2" id="option-2" />
        <Label htmlFor="option-2" className="cursor-pointer">Option 2</Label>
      </div>
      <div className="flex items-center gap-3">
        <RadioItem value="option-3" id="option-3" />
        <Label htmlFor="option-3" className="cursor-pointer">Option 3</Label>
      </div>
    </RadioGroup>
  ),
};

/**
 * All sizes
 */
export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-8">
      <div className="flex flex-col items-center gap-2">
        <RadioGroup defaultValue="sm">
          <RadioItem value="sm" size="sm" />
        </RadioGroup>
        <Text size="xs" tone="muted">Small (16px)</Text>
      </div>
      <div className="flex flex-col items-center gap-2">
        <RadioGroup defaultValue="default">
          <RadioItem value="default" size="default" />
        </RadioGroup>
        <Text size="xs" tone="muted">Default (20px)</Text>
      </div>
      <div className="flex flex-col items-center gap-2">
        <RadioGroup defaultValue="lg">
          <RadioItem value="lg" size="lg" />
        </RadioGroup>
        <Text size="xs" tone="muted">Large (24px)</Text>
      </div>
    </div>
  ),
};

/**
 * Horizontal layout
 */
export const Horizontal: Story = {
  render: () => (
    <RadioGroup defaultValue="yes" className="flex gap-6">
      <div className="flex items-center gap-2">
        <RadioItem value="yes" id="h-yes" />
        <Label htmlFor="h-yes" className="cursor-pointer">Yes</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioItem value="no" id="h-no" />
        <Label htmlFor="h-no" className="cursor-pointer">No</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioItem value="maybe" id="h-maybe" />
        <Label htmlFor="h-maybe" className="cursor-pointer">Maybe</Label>
      </div>
    </RadioGroup>
  ),
};

/**
 * Disabled states
 */
export const DisabledStates: Story = {
  render: () => (
    <RadioGroup defaultValue="enabled">
      <div className="flex items-center gap-3">
        <RadioItem value="enabled" id="r-enabled" />
        <Label htmlFor="r-enabled" className="cursor-pointer">Enabled option</Label>
      </div>
      <div className="flex items-center gap-3">
        <RadioItem value="disabled-unselected" id="r-disabled-un" disabled />
        <Label htmlFor="r-disabled-un" className="opacity-50">Disabled unselected</Label>
      </div>
      <div className="flex items-center gap-3 opacity-50">
        <RadioItem value="disabled-selected" id="r-disabled-sel" disabled />
        <Label htmlFor="r-disabled-sel">Disabled (can&apos;t select)</Label>
      </div>
    </RadioGroup>
  ),
};

/**
 * Focus state — WHITE ring (never gold)
 */
export const FocusState: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Text size="sm" tone="muted">
        Tab to see WHITE focus ring (never gold):
      </Text>
      <RadioGroup defaultValue="focus-1">
        <div className="flex items-center gap-3">
          <RadioItem value="focus-1" id="focus-1" />
          <Label htmlFor="focus-1" className="cursor-pointer">Focus me</Label>
        </div>
        <div className="flex items-center gap-3">
          <RadioItem value="focus-2" id="focus-2" />
          <Label htmlFor="focus-2" className="cursor-pointer">Or me</Label>
        </div>
      </RadioGroup>
    </div>
  ),
};

/**
 * In context — User type selection
 */
export const UserTypeContext: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-80 p-6 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)]">
      <div>
        <Text weight="medium">I am a...</Text>
        <Text size="sm" tone="muted">Select how you&apos;ll use HIVE</Text>
      </div>
      <RadioGroup defaultValue="student" className="gap-3">
        <label
          htmlFor="type-student"
          className="flex items-start gap-3 p-3 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-bg-elevated)] cursor-pointer transition-colors"
        >
          <RadioItem value="student" id="type-student" className="mt-0.5" />
          <div>
            <Text weight="medium">Student</Text>
            <Text size="sm" tone="muted">Join spaces, discover events</Text>
          </div>
        </label>
        <label
          htmlFor="type-leader"
          className="flex items-start gap-3 p-3 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-bg-elevated)] cursor-pointer transition-colors"
        >
          <RadioItem value="leader" id="type-leader" className="mt-0.5" />
          <div>
            <Text weight="medium">Leader</Text>
            <Text size="sm" tone="muted">Manage a space, build tools</Text>
          </div>
        </label>
        <label
          htmlFor="type-both"
          className="flex items-start gap-3 p-3 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-bg-elevated)] cursor-pointer transition-colors"
        >
          <RadioItem value="both" id="type-both" className="mt-0.5" />
          <div>
            <Text weight="medium">Both</Text>
            <Text size="sm" tone="muted">I wear many hats</Text>
          </div>
        </label>
      </RadioGroup>
    </div>
  ),
};

/**
 * In context — Sort options
 */
export const SortOptionsContext: Story = {
  render: () => (
    <div className="flex flex-col gap-3 w-56 p-4 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)]">
      <Text size="sm" weight="medium">Sort by</Text>
      <RadioGroup defaultValue="recent" className="gap-2">
        <div className="flex items-center gap-2">
          <RadioItem value="recent" id="sort-recent" size="sm" />
          <Label htmlFor="sort-recent" className="cursor-pointer text-sm">
            Most recent
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <RadioItem value="popular" id="sort-popular" size="sm" />
          <Label htmlFor="sort-popular" className="cursor-pointer text-sm">
            Most popular
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <RadioItem value="members" id="sort-members" size="sm" />
          <Label htmlFor="sort-members" className="cursor-pointer text-sm">
            Most members
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <RadioItem value="alphabetical" id="sort-alpha" size="sm" />
          <Label htmlFor="sort-alpha" className="cursor-pointer text-sm">
            Alphabetical
          </Label>
        </div>
      </RadioGroup>
    </div>
  ),
};
