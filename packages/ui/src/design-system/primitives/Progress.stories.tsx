import type { Meta, StoryObj } from '@storybook/react';
import { Progress, CircularProgress } from './Progress';
import { Text } from './Text';
import { Card } from './Card';

/**
 * Progress — Progress indicator
 *
 * GOLD variant for achievements — one of few gold uses!
 * Linear and circular variants available.
 *
 * @see docs/design-system/PRIMITIVES.md (Progress)
 */
const meta: Meta<typeof Progress> = {
  title: 'Design System/Primitives/Feedback/Progress',
  component: Progress,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Progress indicator with GOLD variant for achievements (one of few gold uses).',
      },
    },
  },
  argTypes: {
    value: {
      control: { type: 'range', min: 0, max: 100 },
      description: 'Progress value (0-100)',
    },
    variant: {
      control: 'select',
      options: ['default', 'gold', 'success', 'error'],
      description: 'Color variant',
    },
    size: {
      control: 'select',
      options: ['sm', 'default', 'lg'],
      description: 'Bar size',
    },
    showLabel: {
      control: 'boolean',
      description: 'Show percentage label',
    },
    indeterminate: {
      control: 'boolean',
      description: 'Indeterminate loading state',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Progress>;

/**
 * Default — White progress bar
 */
export const Default: Story = {
  args: {
    value: 60,
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
};

/**
 * Gold — Achievement progress
 */
export const Gold: Story = {
  args: {
    value: 75,
    variant: 'gold',
  },
  parameters: {
    docs: {
      description: {
        story:
          '✨ GOLD: Progress bar is one of the few components where gold is allowed (achievements).',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
};

/**
 * All variants
 */
export const AllVariants: Story = {
  args: {
    value: 41
  },

  render: () => (
    <div className="flex flex-col gap-4 w-80">
      <div>
        <Text size="xs" tone="muted" className="mb-2">Default (white)</Text>
        <Progress value={60} />
      </div>
      <div>
        <Text size="xs" tone="muted" className="mb-2">Gold (achievements)</Text>
        <Progress value={75} variant="gold" />
      </div>
      <div>
        <Text size="xs" tone="muted" className="mb-2">Success</Text>
        <Progress value={100} variant="success" />
      </div>
      <div>
        <Text size="xs" tone="muted" className="mb-2">Error</Text>
        <Progress value={30} variant="error" />
      </div>
    </div>
  )
};

/**
 * All sizes
 */
export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-80">
      <div>
        <Text size="xs" tone="muted" className="mb-2">Small (4px)</Text>
        <Progress value={60} size="sm" />
      </div>
      <div>
        <Text size="xs" tone="muted" className="mb-2">Default (8px)</Text>
        <Progress value={60} size="default" />
      </div>
      <div>
        <Text size="xs" tone="muted" className="mb-2">Large (12px)</Text>
        <Progress value={60} size="lg" />
      </div>
    </div>
  ),
};

/**
 * With label
 */
export const WithLabel: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-80">
      <Progress value={33} showLabel />
      <Progress value={66} showLabel variant="gold" />
      <Progress value={100} showLabel variant="success" />
    </div>
  ),
};

/**
 * Indeterminate — Loading state
 */
export const Indeterminate: Story = {
  args: {
    indeterminate: true,
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
};

/**
 * Circular progress
 */
export const Circular: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      <CircularProgress value={25} />
      <CircularProgress value={50} variant="gold" />
      <CircularProgress value={75} variant="success" />
      <CircularProgress value={100} showLabel />
    </div>
  ),
};

/**
 * Circular sizes
 */
export const CircularSizes: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      <CircularProgress value={60} size={32} strokeWidth={3} />
      <CircularProgress value={60} size={48} strokeWidth={4} />
      <CircularProgress value={60} size={64} strokeWidth={5} />
      <CircularProgress value={60} size={80} strokeWidth={6} showLabel />
    </div>
  ),
};

/**
 * Circular indeterminate
 */
export const CircularIndeterminate: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      <CircularProgress indeterminate size={32} />
      <CircularProgress indeterminate size={48} variant="gold" />
      <CircularProgress indeterminate size={64} />
    </div>
  ),
};

/**
 * In context — Profile completion
 */
export const ProfileCompletionContext: Story = {
  render: () => (
    <Card className="w-80 p-4">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <Text weight="medium">Profile completion</Text>
          <Text size="sm" className="text-[var(--color-accent-gold)]">75%</Text>
        </div>
        <Progress value={75} variant="gold" />
        <Text size="xs" tone="muted">
          Add a bio to complete your profile
        </Text>
      </div>
    </Card>
  ),
};

/**
 * In context — Upload progress
 */
export const UploadProgressContext: Story = {
  render: () => (
    <Card className="w-80 p-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-[var(--color-bg-elevated)] flex items-center justify-center">
          <svg className="w-5 h-5 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <Text size="sm" weight="medium" className="truncate">photo-2024.jpg</Text>
          <div className="mt-1">
            <Progress value={45} size="sm" />
          </div>
          <Text size="xs" tone="muted" className="mt-1">Uploading... 45%</Text>
        </div>
      </div>
    </Card>
  ),
};

/**
 * In context — Achievement badge
 */
export const AchievementBadgeContext: Story = {
  render: () => (
    <Card className="w-64 p-4">
      <div className="flex flex-col items-center text-center gap-3">
        <div className="relative">
          <CircularProgress value={80} size={80} strokeWidth={6} variant="gold" showLabel />
        </div>
        <div>
          <Text weight="medium">Early Adopter</Text>
          <Text size="xs" tone="muted">80% complete</Text>
        </div>
        <Text size="xs" tone="secondary">
          Join 5 more spaces to unlock
        </Text>
      </div>
    </Card>
  ),
};

/**
 * Gold budget note
 */
export const GoldBudgetNote: Story = {
  render: () => (
    <Card className="max-w-md p-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Progress value={75} variant="gold" className="flex-1" />
          <Text size="sm" className="text-[var(--color-accent-gold)]">75%</Text>
        </div>
        <Text size="sm" tone="secondary">
          The Progress component with gold variant is one of the few places where gold is permitted in the design system. Use it for:
        </Text>
        <ul className="text-sm text-[var(--color-text-muted)] list-disc list-inside space-y-1">
          <li>Achievement progress</li>
          <li>Profile completion</li>
          <li>Level progression</li>
          <li>Goal tracking</li>
        </ul>
        <Text size="xs" tone="muted">
          Other gold uses: PresenceDot, Button CTA, Switch (on), LiveCounter
        </Text>
      </div>
    </Card>
  ),
};
