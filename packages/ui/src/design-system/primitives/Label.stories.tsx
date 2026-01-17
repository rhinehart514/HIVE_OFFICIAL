import type { Meta, StoryObj } from '@storybook/react';
import { Label } from './Label';

/**
 * Label — Form labels and captions
 *
 * Uses Geist font with medium weight for form labels.
 * Secondary text color for visual hierarchy.
 *
 * @see docs/design-system/PRIMITIVES.md (Typography Primitives)
 */
const meta: Meta<typeof Label> = {
  title: 'Design System/Primitives/Typography/Label',
  component: Label,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Form labels and captions. Medium weight with secondary text color.',
      },
    },
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['default', 'sm'],
      description: 'Size: default (13px), sm (12px)',
    },
    required: {
      control: 'boolean',
      description: 'Show required indicator (*)',
    },
    disabled: {
      control: 'boolean',
      description: 'Disabled state (50% opacity)',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Label>;

/**
 * Default — Standard form label
 */
export const Default: Story = {
  args: {
    children: 'Email Address',
  },
};

/**
 * Required — With asterisk indicator
 */
export const Required: Story = {
  args: {
    children: 'Username',
    required: true,
  },
};

/**
 * Disabled — 50% opacity
 */
export const Disabled: Story = {
  args: {
    children: 'Disabled Field',
    disabled: true,
  },
};

/**
 * Small — Compact size
 */
export const Small: Story = {
  args: {
    children: 'Helper text',
    size: 'sm',
  },
};

/**
 * All variants
 */
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Label>Default Label</Label>
      <Label required>Required Label</Label>
      <Label disabled>Disabled Label</Label>
      <Label size="sm">Small Label</Label>
      <Label size="sm" required>Small Required</Label>
    </div>
  ),
};

/**
 * In context — Form field
 */
export const FormFieldContext: Story = {
  render: () => (
    <div className="flex flex-col gap-2 w-64">
      <Label htmlFor="space-name" required>Space Name</Label>
      <input
        id="space-name"
        type="text"
        placeholder="Enter space name"
        className="px-3 py-2 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-subtle)] focus:outline-none focus:ring-2 focus:ring-white/50"
      />
      <Label size="sm">A unique name for your space</Label>
    </div>
  ),
};
