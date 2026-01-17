import type { Meta, StoryObj } from '@storybook/react';
import { Heading } from './Heading';

/**
 * Heading — Section headers (h1-h6)
 *
 * Uses Clash Display for h1-h2, Geist for h3-h6.
 * Works across all atmosphere levels.
 *
 * @see docs/design-system/PRIMITIVES.md (Typography Primitives)
 */
const meta: Meta<typeof Heading> = {
  title: 'Design System/Primitives/Typography/Heading',
  component: Heading,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Section headers with 6 levels. H1-H2 use Clash Display, H3-H6 use Geist.',
      },
    },
  },
  argTypes: {
    level: {
      control: 'select',
      options: [1, 2, 3, 4, 5, 6],
      description: 'Heading level (1-6)',
    },
    as: {
      control: 'select',
      options: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'div'],
      description: 'HTML element to render as (defaults to matching level)',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Heading>;

/**
 * H1 (36px) — Page titles
 */
export const Level1: Story = {
  args: {
    level: 1,
    children: 'Page Title (H1)',
  },
};

/**
 * H2 (28px) — Section headers
 */
export const Level2: Story = {
  args: {
    level: 2,
    children: 'Section Header (H2)',
  },
};

/**
 * H3 (22px) — Subsection headers
 */
export const Level3: Story = {
  args: {
    level: 3,
    children: 'Subsection Header (H3)',
  },
};

/**
 * H4 (18px) — Card titles
 */
export const Level4: Story = {
  args: {
    level: 4,
    children: 'Card Title (H4)',
  },
};

/**
 * H5 (16px) — Small headers
 */
export const Level5: Story = {
  args: {
    level: 5,
    children: 'Small Header (H5)',
  },
};

/**
 * H6 (14px) — Tiny headers
 */
export const Level6: Story = {
  args: {
    level: 6,
    children: 'Tiny Header (H6)',
  },
};

/**
 * All levels comparison — Type scale hierarchy
 */
export const AllLevels: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <Heading level={1}>Heading 1 — 36px Clash Display</Heading>
      <Heading level={2}>Heading 2 — 28px Clash Display</Heading>
      <Heading level={3}>Heading 3 — 22px Geist</Heading>
      <Heading level={4}>Heading 4 — 18px Geist</Heading>
      <Heading level={5}>Heading 5 — 16px Geist</Heading>
      <Heading level={6}>Heading 6 — 14px Geist</Heading>
    </div>
  ),
};

/**
 * In context — Space page header
 */
export const SpacePageContext: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Heading level={1}>Design Club</Heading>
      <p className="text-[var(--color-text-secondary)]">
        Where UB designers come together to create, learn, and grow.
      </p>
      <div className="mt-8">
        <Heading level={3}>Recent Activity</Heading>
        <p className="text-[var(--color-text-muted)] text-sm mt-2">
          12 members active today
        </p>
      </div>
    </div>
  ),
};
