import type { Meta, StoryObj } from '@storybook/react';
import { LoadingOverlay, LoadingSpinner, LoadingDots } from './LoadingOverlay';
import { Card, Text, Button } from '../primitives';

const meta: Meta<typeof LoadingOverlay> = {
  title: 'Design System/Components/Feedback/LoadingOverlay',
  component: LoadingOverlay,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Loading overlay with fullscreen, inline, and card variants. Gold accent spinner.',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['fullscreen', 'inline', 'card'],
    },
    size: {
      control: 'select',
      options: ['sm', 'default', 'lg'],
    },
    visible: {
      control: 'boolean',
    },
    blur: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof LoadingOverlay>;

/**
 * Inline — Component-level loading
 */
export const Inline: Story = {
  args: {
    variant: 'inline',
    message: 'Loading...',
  },
};

/**
 * Inline with sizes
 */
export const InlineSizes: Story = {
  render: () => (
    <div className="flex gap-8 items-start">
      <div className="text-center">
        <LoadingOverlay variant="inline" size="sm" message="Small" />
      </div>
      <div className="text-center">
        <LoadingOverlay variant="inline" size="default" message="Default" />
      </div>
      <div className="text-center">
        <LoadingOverlay variant="inline" size="lg" message="Large" />
      </div>
    </div>
  ),
};

/**
 * Card — Inside a card container
 */
export const CardVariant: Story = {
  render: () => (
    <Card className="relative w-80 h-48">
      <Text>Card content that will be covered by loading overlay</Text>
      <LoadingOverlay variant="card" message="Loading data..." />
    </Card>
  ),
};

/**
 * Fullscreen — Page-level loading
 */
export const Fullscreen: Story = {
  render: () => (
    <div className="relative w-full h-96 border border-[var(--color-border)] rounded-lg overflow-hidden">
      <div className="absolute inset-0">
        <LoadingOverlay
          variant="fullscreen"
          message="Entering HIVE..."
          subMessage="Preparing your spaces"
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Fullscreen variant covers the entire viewport. Use for page transitions or initial app load.',
      },
    },
  },
};

/**
 * Fullscreen without blur
 */
export const FullscreenNoBlur: Story = {
  render: () => (
    <div className="relative w-full h-96 border border-[var(--color-border)] rounded-lg overflow-hidden">
      <div className="absolute inset-0">
        <LoadingOverlay
          variant="fullscreen"
          blur={false}
          message="Loading..."
        />
      </div>
    </div>
  ),
};

/**
 * Spinner only
 */
export const SpinnerOnly: Story = {
  render: () => (
    <div className="flex gap-4 items-center">
      <LoadingSpinner size="sm" />
      <LoadingSpinner size="default" />
      <LoadingSpinner size="lg" />
    </div>
  ),
};

/**
 * Loading dots
 */
export const Dots: Story = {
  render: () => (
    <div className="flex flex-col gap-4 items-center">
      <LoadingDots />
      <Text size="sm" tone="muted">
        Used for typing indicators, inline loading
      </Text>
    </div>
  ),
};

/**
 * In context — Button loading state
 */
export const ButtonLoadingContext: Story = {
  render: () => (
    <div className="flex gap-4">
      <Button loading>Saving...</Button>
      <Button variant="cta" loading>
        Entering HIVE...
      </Button>
    </div>
  ),
};

/**
 * In context — Card with loading overlay
 */
export const CardLoadingContext: Story = {
  render: () => (
    <div className="flex gap-4">
      <Card className="relative w-64 h-40">
        <Text weight="medium">Space Info</Text>
        <Text size="sm" tone="muted">
          Member count, activity...
        </Text>
        <LoadingOverlay variant="card" visible />
      </Card>
      <Card className="w-64 h-40">
        <Text weight="medium">Loaded Content</Text>
        <Text size="sm" tone="muted">
          This content has finished loading.
        </Text>
      </Card>
    </div>
  ),
};

/**
 * All variants comparison
 */
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      <div>
        <Text size="xs" tone="muted" className="mb-2">
          Inline
        </Text>
        <LoadingOverlay variant="inline" message="Loading data..." />
      </div>
      <div>
        <Text size="xs" tone="muted" className="mb-2">
          Card
        </Text>
        <Card className="relative w-64 h-32">
          <Text>Background content</Text>
          <LoadingOverlay variant="card" />
        </Card>
      </div>
      <div>
        <Text size="xs" tone="muted" className="mb-2">
          Spinner + Dots
        </Text>
        <div className="flex gap-4 items-center">
          <LoadingSpinner />
          <LoadingDots />
        </div>
      </div>
    </div>
  ),
};
