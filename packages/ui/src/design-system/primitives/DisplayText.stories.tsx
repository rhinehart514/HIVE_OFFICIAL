import type { Meta, StoryObj } from '@storybook/react';
import { DisplayText } from './DisplayText';

/**
 * DisplayText — Hero headlines for landing pages
 *
 * Uses Clash Display font for maximum impact.
 * Reserved for landing atmosphere only.
 *
 * @see docs/design-system/PRIMITIVES.md (Typography Primitives)
 */
const meta: Meta<typeof DisplayText> = {
  title: 'Design System/Primitives/Typography/DisplayText',
  component: DisplayText,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Hero headlines for landing pages. Uses Clash Display font with tight tracking for maximum impact.',
      },
    },
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['default', 'sm', 'xs'],
      description: 'Size variant: default (72px), sm (48px), xs (36px)',
    },
    as: {
      control: 'select',
      options: ['h1', 'h2', 'span', 'div'],
      description: 'HTML element to render as',
    },
  },
};

export default meta;
type Story = StoryObj<typeof DisplayText>;

/**
 * Default (72px) — Hero headlines
 */
export const Default: Story = {
  args: {
    children: 'Where UB Actually Happens',
    size: 'default',
  },
};

/**
 * Small (48px) — Secondary headlines
 */
export const Small: Story = {
  args: {
    children: 'Student Autonomy Infrastructure',
    size: 'sm',
  },
};

/**
 * Extra Small (36px) — Tertiary headlines
 */
export const ExtraSmall: Story = {
  args: {
    children: 'Build Without Limits',
    size: 'xs',
  },
};

/**
 * All sizes comparison
 */
export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      <DisplayText size="default">Default (72px)</DisplayText>
      <DisplayText size="sm">Small (48px)</DisplayText>
      <DisplayText size="xs">Extra Small (36px)</DisplayText>
    </div>
  ),
};

/**
 * In Landing context — Maximum visual impact
 */
export const LandingContext: Story = {
  render: () => (
    <div className="flex flex-col items-center gap-6 text-center">
      <DisplayText size="default">
        Where UB
        <br />
        Actually Happens
      </DisplayText>
      <p className="text-[var(--color-text-secondary)] text-lg max-w-md">
        Student autonomy infrastructure for a world where the old paths are dying.
      </p>
    </div>
  ),
  parameters: {
    backgrounds: { default: 'hive-dark' },
  },
};
