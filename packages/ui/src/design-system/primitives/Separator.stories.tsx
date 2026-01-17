import type { Meta, StoryObj } from '@storybook/react';
import { Separator } from './Separator';
import { Text } from './Text';

/**
 * Separator — Visual divider with gradient fade
 *
 * Creates visual breaks between content groups.
 * Default variant uses gradient fade for elegance.
 *
 * @see docs/design-system/PRIMITIVES.md (Separator)
 */
const meta: Meta<typeof Separator> = {
  title: 'Design System/Primitives/Containers/Separator',
  component: Separator,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Visual divider with gradient fade. Supports horizontal and vertical orientations.',
      },
    },
  },
  argTypes: {
    orientation: {
      control: 'select',
      options: ['horizontal', 'vertical'],
      description: 'Direction of the separator',
    },
    variant: {
      control: 'select',
      options: ['default', 'solid', 'subtle'],
      description: 'Visual style (default uses gradient fade)',
    },
    decorative: {
      control: 'boolean',
      description: 'If true, no semantic meaning (role="none")',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Separator>;

/**
 * Default — Gradient fade (horizontal)
 */
export const Default: Story = {
  render: () => (
    <div className="w-80">
      <Text>Section one content</Text>
      <Separator className="my-4" />
      <Text>Section two content</Text>
    </div>
  ),
};

/**
 * Solid — No gradient
 */
export const Solid: Story = {
  render: () => (
    <div className="w-80">
      <Text>Section one content</Text>
      <Separator variant="solid" className="my-4" />
      <Text>Section two content</Text>
    </div>
  ),
};

/**
 * Subtle — 50% opacity
 */
export const Subtle: Story = {
  render: () => (
    <div className="w-80">
      <Text>Section one content</Text>
      <Separator variant="subtle" className="my-4" />
      <Text>Section two content</Text>
    </div>
  ),
};

/**
 * All variants comparison
 */
export const AllVariants: Story = {
  render: () => (
    <div className="w-80 flex flex-col gap-8">
      <div>
        <Text size="xs" tone="muted" className="mb-2">Default (gradient fade):</Text>
        <Separator />
      </div>
      <div>
        <Text size="xs" tone="muted" className="mb-2">Solid:</Text>
        <Separator variant="solid" />
      </div>
      <div>
        <Text size="xs" tone="muted" className="mb-2">Subtle:</Text>
        <Separator variant="subtle" />
      </div>
    </div>
  ),
};

/**
 * Vertical — For side-by-side content
 */
export const Vertical: Story = {
  render: () => (
    <div className="flex items-center h-12 gap-4">
      <Text>Left content</Text>
      <Separator orientation="vertical" />
      <Text>Right content</Text>
    </div>
  ),
};

/**
 * In context — Settings section
 */
export const SettingsContext: Story = {
  render: () => (
    <div className="w-80 p-4 rounded-lg bg-[var(--color-bg-card)] border border-[var(--color-border)]">
      <div className="flex justify-between items-center">
        <Text weight="medium">Notifications</Text>
        <Text size="sm" tone="muted">On</Text>
      </div>
      <Separator className="my-4" />
      <div className="flex justify-between items-center">
        <Text weight="medium">Privacy</Text>
        <Text size="sm" tone="muted">Public</Text>
      </div>
      <Separator className="my-4" />
      <div className="flex justify-between items-center">
        <Text weight="medium">Theme</Text>
        <Text size="sm" tone="muted">Dark</Text>
      </div>
    </div>
  ),
};

/**
 * In context — Navigation
 */
export const NavigationContext: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Text size="sm">Home</Text>
      <Separator orientation="vertical" className="h-4" />
      <Text size="sm">Spaces</Text>
      <Separator orientation="vertical" className="h-4" />
      <Text size="sm">Lab</Text>
      <Separator orientation="vertical" className="h-4" />
      <Text size="sm">Profile</Text>
    </div>
  ),
};
