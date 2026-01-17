import type { Meta, StoryObj } from '@storybook/react';
import { Card } from './Card';
import { Heading } from './Heading';
import { Text } from './Text';

/**
 * Card — Foundational container primitive
 *
 * Every surface in HIVE is a card variant.
 * Supports atmosphere, warmth (edge-based), and elevation.
 *
 * CRITICAL: Warmth uses box-shadow inset, NOT background tint.
 *
 * @see docs/design-system/PRIMITIVES.md (Card)
 */
const meta: Meta<typeof Card> = {
  title: 'Design System/Primitives/Containers/Card',
  component: Card,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'The foundational container. Every surface in HIVE is a card variant. Supports atmosphere-aware styling and edge-based warmth.',
      },
    },
  },
  argTypes: {
    atmosphere: {
      control: 'select',
      options: ['landing', 'spaces', 'workshop'],
      description: 'Atmosphere level (inherits from context if not specified)',
    },
    warmth: {
      control: 'select',
      options: ['none', 'low', 'medium', 'high'],
      description: 'Activity indication via edge warmth (box-shadow inset)',
    },
    elevation: {
      control: 'select',
      options: ['resting', 'raised', 'floating'],
      description: 'Shadow depth',
    },
    translucent: {
      control: 'boolean',
      description: 'Apple-style glass effect with heavy blur',
    },
    noPadding: {
      control: 'boolean',
      description: 'Remove default padding',
    },
    interactive: {
      control: 'boolean',
      description: 'Clickable card with hover/press states',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Card>;

/**
 * Default — Spaces atmosphere
 */
export const Default: Story = {
  args: {
    children: (
      <div>
        <Heading level={4}>Space Card</Heading>
        <Text size="sm" tone="secondary" className="mt-2">
          Default card with spaces atmosphere.
        </Text>
      </div>
    ),
  },
};

/**
 * Landing atmosphere — Rich, glass-like
 */
export const LandingAtmosphere: Story = {
  args: {
    atmosphere: 'landing',
    children: (
      <div>
        <Heading level={4}>Landing Card</Heading>
        <Text size="sm" tone="secondary" className="mt-2">
          Blurred background for premium feel.
        </Text>
      </div>
    ),
  },
};

/**
 * Workshop atmosphere — Utilitarian
 */
export const WorkshopAtmosphere: Story = {
  args: {
    atmosphere: 'workshop',
    children: (
      <div>
        <Heading level={4}>Workshop Card</Heading>
        <Text size="sm" tone="secondary" className="mt-2">
          Compact, focused styling for IDE.
        </Text>
      </div>
    ),
  },
};

/**
 * All atmospheres comparison
 */
export const AllAtmospheres: Story = {
  render: () => (
    <div className="flex gap-4">
      <Card atmosphere="landing" className="w-48">
        <Text size="sm" weight="medium">Landing</Text>
        <Text size="xs" tone="muted">Glass + blur</Text>
      </Card>
      <Card atmosphere="spaces" className="w-48">
        <Text size="sm" weight="medium">Spaces</Text>
        <Text size="xs" tone="muted">Solid card</Text>
      </Card>
      <Card atmosphere="workshop" className="w-48">
        <Text size="sm" weight="medium">Workshop</Text>
        <Text size="xs" tone="muted">Utilitarian</Text>
      </Card>
    </div>
  ),
};

/**
 * Warmth levels — Edge-based activity indication
 */
export const WarmthLevels: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Text size="sm" tone="muted" className="mb-2">
        Warmth is edge-based (box-shadow inset), not background tint:
      </Text>
      <div className="flex gap-4">
        <Card warmth="none" className="w-40">
          <Text size="sm">None</Text>
          <Text size="xs" tone="muted">No activity</Text>
        </Card>
        <Card warmth="low" className="w-40">
          <Text size="sm">Low</Text>
          <Text size="xs" tone="muted">Subtle edge</Text>
        </Card>
        <Card warmth="medium" className="w-40">
          <Text size="sm">Medium</Text>
          <Text size="xs" tone="muted">Active</Text>
        </Card>
        <Card warmth="high" className="w-40">
          <Text size="sm">High</Text>
          <Text size="xs" tone="muted">Very active</Text>
        </Card>
      </div>
    </div>
  ),
};

/**
 * Elevation levels — Shadow depth
 */
export const ElevationLevels: Story = {
  render: () => (
    <div className="flex gap-4">
      <Card elevation="resting" className="w-40">
        <Text size="sm">Resting</Text>
        <Text size="xs" tone="muted">2px shadow</Text>
      </Card>
      <Card elevation="raised" className="w-40">
        <Text size="sm">Raised</Text>
        <Text size="xs" tone="muted">4px shadow</Text>
      </Card>
      <Card elevation="floating" className="w-40">
        <Text size="sm">Floating</Text>
        <Text size="xs" tone="muted">8px shadow</Text>
      </Card>
    </div>
  ),
};

/**
 * Translucent — Apple glass effect
 */
export const Translucent: Story = {
  args: {
    translucent: true,
    children: (
      <div>
        <Heading level={4}>Glass Card</Heading>
        <Text size="sm" tone="secondary" className="mt-2">
          Heavy blur (40px) with saturation. Premium landing feel.
        </Text>
      </div>
    ),
  },
};

/**
 * Combined — Warmth + Elevation
 */
export const Combined: Story = {
  args: {
    warmth: 'medium',
    elevation: 'raised',
    children: (
      <div>
        <Heading level={4}>Active Space</Heading>
        <Text size="sm" tone="secondary" className="mt-2">
          12 members online • Medium warmth edge
        </Text>
      </div>
    ),
  },
};

/**
 * In context — Space discovery card
 */
export const SpaceDiscoveryContext: Story = {
  render: () => (
    <Card warmth="low" className="w-72">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-lg bg-[var(--color-bg-elevated)]" />
        <div className="flex-1">
          <Heading level={4}>Design Club</Heading>
          <Text size="xs" tone="muted">127 members</Text>
          <Text size="sm" tone="secondary" className="mt-2">
            Where UB designers come together to create and learn.
          </Text>
        </div>
      </div>
    </Card>
  ),
};

/**
 * Interactive — Clickable card with hover/press states
 */
export const Interactive: Story = {
  args: {
    interactive: true,
    children: (
      <div>
        <Heading level={4}>Clickable Card</Heading>
        <Text size="sm" tone="secondary" className="mt-2">
          Hover to see scale effect. Click to see press state.
        </Text>
      </div>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive cards scale slightly on hover (1.01x) and shrink on press (0.99x). Use for clickable items like SpaceCard, ProfileCard.',
      },
    },
  },
};

/**
 * Interactive with warmth — Active clickable card
 */
export const InteractiveWithWarmth: Story = {
  render: () => (
    <div className="flex gap-4">
      <Card interactive warmth="low" className="w-48">
        <Text size="sm" weight="medium">Low warmth</Text>
        <Text size="xs" tone="muted">Subtle activity</Text>
      </Card>
      <Card interactive warmth="medium" className="w-48">
        <Text size="sm" weight="medium">Medium warmth</Text>
        <Text size="xs" tone="muted">Active space</Text>
      </Card>
      <Card interactive warmth="high" className="w-48">
        <Text size="sm" weight="medium">High warmth</Text>
        <Text size="xs" tone="muted">Very active</Text>
      </Card>
    </div>
  ),
};

/**
 * Glass variants — Translucent options
 */
export const GlassVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4 p-8" style={{ background: 'linear-gradient(135deg, #1a1a2e, #16213e)' }}>
      <Text size="sm" tone="muted" className="mb-2">
        Glass cards on gradient background:
      </Text>
      <div className="flex gap-4">
        <Card translucent className="w-56">
          <Text size="sm" weight="medium">Heavy Glass</Text>
          <Text size="xs" tone="muted">40px blur + saturation</Text>
        </Card>
        <Card atmosphere="landing" className="w-56">
          <Text size="sm" weight="medium">Landing Glass</Text>
          <Text size="xs" tone="muted">12px blur</Text>
        </Card>
        <Card translucent interactive className="w-56">
          <Text size="sm" weight="medium">Interactive Glass</Text>
          <Text size="xs" tone="muted">Hover me</Text>
        </Card>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Glass cards for premium landing/onboarding experiences. Heavy blur (40px) with saturation creates depth.',
      },
    },
  },
};

/**
 * As button — Polymorphic card
 */
export const AsButton: Story = {
  render: () => (
    <Card
      as="button"
      interactive
      warmth="low"
      className="w-64 text-left"
      onClick={() => alert('Card clicked!')}
    >
      <Heading level={4}>Button Card</Heading>
      <Text size="sm" tone="secondary" className="mt-2">
        Rendered as a button element for accessibility.
      </Text>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Use `as="button"` for clickable cards that need proper semantics. Better for accessibility than onClick on a div.',
      },
    },
  },
};

/**
 * All card styles comparison
 */
export const AllCardStyles: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div>
        <Text size="xs" tone="muted" className="mb-2">Static Cards</Text>
        <div className="flex gap-3">
          <Card className="w-36"><Text size="sm">Default</Text></Card>
          <Card atmosphere="landing" className="w-36"><Text size="sm">Landing</Text></Card>
          <Card atmosphere="workshop" className="w-36"><Text size="sm">Workshop</Text></Card>
          <Card translucent className="w-36"><Text size="sm">Glass</Text></Card>
        </div>
      </div>
      <div>
        <Text size="xs" tone="muted" className="mb-2">Interactive Cards (hover me)</Text>
        <div className="flex gap-3">
          <Card interactive className="w-36"><Text size="sm">Default</Text></Card>
          <Card interactive warmth="low" className="w-36"><Text size="sm">+ Warmth</Text></Card>
          <Card interactive elevation="raised" className="w-36"><Text size="sm">+ Raised</Text></Card>
          <Card interactive translucent className="w-36"><Text size="sm">+ Glass</Text></Card>
        </div>
      </div>
    </div>
  ),
};
