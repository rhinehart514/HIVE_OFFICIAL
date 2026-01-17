import type { Meta, StoryObj } from '@storybook/react';
import { Text } from './Text';

/**
 * Text — Body copy variants
 *
 * Uses Geist font for all body text.
 * Works across all atmosphere levels.
 *
 * @see docs/design-system/PRIMITIVES.md (Typography Primitives)
 */
const meta: Meta<typeof Text> = {
  title: 'Design System/Primitives/Typography/Text',
  component: Text,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Body text with multiple sizes, tones, and weights. Uses Geist font.',
      },
    },
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['default', 'sm', 'xs', 'lg'],
      description: 'Size: lg (18px), default (16px), sm (14px), xs (13px)',
    },
    tone: {
      control: 'select',
      options: ['primary', 'secondary', 'muted', 'subtle', 'inverse', 'error', 'success'],
      description: 'Color tone',
    },
    weight: {
      control: 'select',
      options: ['normal', 'medium', 'semibold', 'bold'],
      description: 'Font weight',
    },
    truncate: {
      control: 'boolean',
      description: 'Truncate with ellipsis',
    },
    as: {
      control: 'select',
      options: ['p', 'span', 'div', 'label'],
      description: 'HTML element to render as',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Text>;

/**
 * Default (16px) — Standard body text
 */
export const Default: Story = {
  args: {
    children: 'This is default body text at 16px. It uses Geist font for excellent readability.',
  },
};

/**
 * Large (18px) — Intro paragraphs
 */
export const Large: Story = {
  args: {
    size: 'lg',
    children: 'Large text for intro paragraphs and emphasized content at 18px.',
  },
};

/**
 * Small (14px) — Secondary content
 */
export const Small: Story = {
  args: {
    size: 'sm',
    children: 'Small text for secondary content, captions, and metadata at 14px.',
  },
};

/**
 * Extra Small (13px) — Micro copy
 */
export const ExtraSmall: Story = {
  args: {
    size: 'xs',
    children: 'Extra small text for timestamps, labels, and micro copy at 13px.',
  },
};

/**
 * All tones — Color variations
 */
export const AllTones: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <Text tone="primary">Primary — Main content (#FAF9F7)</Text>
      <Text tone="secondary">Secondary — Supporting content (#A1A1A6)</Text>
      <Text tone="muted">Muted — Timestamps, metadata (#818187)</Text>
      <Text tone="subtle">Subtle — Placeholders (#6B6B6B)</Text>
      <Text tone="error">Error — Validation messages</Text>
      <Text tone="success">Success — Confirmation messages</Text>
    </div>
  ),
};

/**
 * All weights — Font weight variations
 */
export const AllWeights: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <Text weight="normal">Normal weight (400)</Text>
      <Text weight="medium">Medium weight (500)</Text>
      <Text weight="semibold">Semibold weight (600)</Text>
      <Text weight="bold">Bold weight (700)</Text>
    </div>
  ),
};

/**
 * Truncated — Ellipsis overflow
 */
export const Truncated: Story = {
  render: () => (
    <div className="w-64">
      <Text truncate>
        This is a very long text that will be truncated with an ellipsis when it overflows its container.
      </Text>
    </div>
  ),
};

/**
 * In context — Card description
 */
export const CardContext: Story = {
  render: () => (
    <div className="max-w-sm p-4 rounded-lg bg-[var(--color-bg-card)] border border-[var(--color-border)]">
      <Text size="sm" tone="secondary">
        Join 127 students in exploring the world of creative coding.
        Weekly workshops, project showcases, and community events.
      </Text>
    </div>
  ),
};
