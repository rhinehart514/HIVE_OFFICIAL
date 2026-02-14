import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';
import { Icon } from './Icon';
import { Text } from './Text';
import { PlusIcon, ArrowRightIcon, TrashIcon } from '@heroicons/react/24/outline';

/**
 * Button — Interactive trigger primitive
 *
 * 6 variants with a clear primary action.
 * Primary (gold) is reserved for key actions and brand moments.
 * Focus ring is WHITE, never gold.
 *
 * @see docs/design-system/PRIMITIVES.md (Button)
 */
const meta: Meta<typeof Button> = {
  title: 'Design System/Primitives/Inputs/Button',
  component: Button,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Interactive button with 6 variants. Primary (gold) is reserved for key actions and brand accents. Focus rings are WHITE.',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'default', 'secondary', 'ghost', 'destructive', 'link'],
      description: 'Visual variant (primary = gold)',
    },
    size: {
      control: 'select',
      options: ['sm', 'default', 'lg', 'xl', 'icon'],
      description: 'Button size',
    },
    loading: {
      control: 'boolean',
      description: 'Loading state with spinner',
    },
    disabled: {
      control: 'boolean',
      description: 'Disabled state',
    },
    asChild: {
      control: 'boolean',
      description: 'Render as child element (Radix pattern)',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

/**
 * Default — Neutral dark button
 */
export const Default: Story = {
  args: {
    children: 'Get Started',
  },
};

/**
 * Primary — Gold button for key actions
 */
export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Enter HIVE',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Use primary for high-priority actions and brand-accent moments, such as major confirmations or entry points.',
      },
    },
  },
};

/**
 * Secondary — Alternate neutral button
 */
export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Learn More',
  },
};

/**
 * Ghost — Transparent hover
 */
export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: 'Cancel',
  },
};

/**
 * Destructive — Red for danger
 */
export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: 'Delete Space',
  },
};

/**
 * Link — Text-only style
 */
export const LinkVariant: Story = {
  args: {
    variant: 'link',
    children: 'Learn more',
  },
};

/**
 * All variants comparison
 */
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex gap-3">
        <Button variant="default">Default</Button>
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="link">Link</Button>
      </div>
      <Text size="xs" tone="muted">
        Primary uses gold for key actions and brand accents.
      </Text>
    </div>
  ),
};

/**
 * All sizes
 */
export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
      <Button size="xl">Extra Large</Button>
      <Button size="icon">
        <Icon icon={PlusIcon} size="default" />
      </Button>
    </div>
  ),
};

/**
 * With Icons — Using leadingIcon/trailingIcon props
 */
export const WithIcons: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex gap-3">
        <Button leadingIcon={<PlusIcon />}>Create Space</Button>
        <Button trailingIcon={<ArrowRightIcon />} variant="secondary">
          Continue
        </Button>
        <Button leadingIcon={<TrashIcon />} variant="destructive">
          Delete
        </Button>
      </div>
      <div className="flex gap-3">
        <Button leadingIcon={<PlusIcon />} trailingIcon={<ArrowRightIcon />}>
          Both Icons
        </Button>
        <Button leadingIcon={<PlusIcon />} variant="primary">
          Add to HIVE
        </Button>
      </div>
    </div>
  ),
};

/**
 * Loading with Icons — Icons preserve layout during loading
 */
export const LoadingWithIcons: Story = {
  render: () => (
    <div className="flex gap-3">
      <Button loading leadingIcon={<PlusIcon />}>
        Creating...
      </Button>
      <Button loading trailingIcon={<ArrowRightIcon />} variant="primary">
        Processing...
      </Button>
    </div>
  ),
};

/**
 * Loading state
 */
export const Loading: Story = {
  args: {
    loading: true,
    children: 'Saving...',
  },
};

/**
 * Disabled state
 */
export const Disabled: Story = {
  args: {
    disabled: true,
    children: 'Disabled',
  },
};

/**
 * Focus state — border and ring stay white
 */
export const FocusState: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Text size="sm" tone="muted">
        Tab to see white focus treatment (never gold):
      </Text>
      <div className="flex gap-3">
        <Button>Focus me</Button>
        <Button variant="primary">Focus me (primary button, white focus)</Button>
      </div>
    </div>
  ),
};

/**
 * In context — Form actions
 */
export const FormActionsContext: Story = {
  render: () => (
    <div className="flex justify-end gap-3 p-4 border-t border-[var(--color-border)]">
      <Button variant="ghost">Cancel</Button>
      <Button>Save Changes</Button>
    </div>
  ),
};

/**
 * In context — Hero primary action
 */
export const HeroCTAContext: Story = {
  render: () => (
    <div className="flex flex-col items-center gap-6 text-center">
      <div>
        <Text size="lg" weight="medium">Ready to build?</Text>
        <Text size="sm" tone="secondary">Join 847 students already on HIVE.</Text>
      </div>
      <div className="flex gap-3">
        <Button variant="primary" size="lg">
          Enter HIVE
          <Icon icon={ArrowRightIcon} size="sm" />
        </Button>
        <Button variant="secondary" size="lg">Learn More</Button>
      </div>
    </div>
  ),
};
