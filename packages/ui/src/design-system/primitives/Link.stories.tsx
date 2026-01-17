import type { Meta, StoryObj } from '@storybook/react';
import { Link } from './Link';
import { Text } from './Text';

/**
 * Link — Styled anchor links
 *
 * Underlined links with hover fade effect.
 * Use external={true} for links opening in new tabs.
 *
 * @see docs/design-system/PRIMITIVES.md (Typography Primitives)
 */
const meta: Meta<typeof Link> = {
  title: 'Design System/Primitives/Typography/Link',
  component: Link,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Anchor links with underline styling and hover opacity fade. WHITE focus ring.',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'subtle', 'muted'],
      description: 'Visual variant',
    },
    size: {
      control: 'select',
      options: ['inherit', 'sm', 'xs'],
      description: 'Text size (inherit by default)',
    },
    external: {
      control: 'boolean',
      description: 'External link with icon (opens in new tab)',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Link>;

/**
 * Default — Standard link
 */
export const Default: Story = {
  args: {
    href: '#',
    children: 'View all spaces',
  },
};

/**
 * External — Opens in new tab
 */
export const External: Story = {
  args: {
    href: 'https://hive.college',
    children: 'Visit HIVE',
    external: true,
  },
};

/**
 * Subtle — Less prominent
 */
export const Subtle: Story = {
  args: {
    href: '#',
    variant: 'subtle',
    children: 'Learn more',
  },
};

/**
 * Muted — Lowest prominence
 */
export const Muted: Story = {
  args: {
    href: '#',
    variant: 'muted',
    children: 'Terms of Service',
  },
};

/**
 * All variants
 */
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Link href="#">Default link</Link>
      <Link href="#" variant="subtle">Subtle link</Link>
      <Link href="#" variant="muted">Muted link</Link>
      <Link href="https://hive.college" external>External link</Link>
    </div>
  ),
};

/**
 * In context — Within text
 */
export const InTextContext: Story = {
  render: () => (
    <Text className="max-w-md">
      By signing up, you agree to our{' '}
      <Link href="#">Terms of Service</Link> and{' '}
      <Link href="#">Privacy Policy</Link>. Read our{' '}
      <Link href="https://docs.hive.college" external>documentation</Link>{' '}
      to learn more about building on HIVE.
    </Text>
  ),
};

/**
 * In context — Footer links
 */
export const FooterContext: Story = {
  render: () => (
    <div className="flex gap-6">
      <Link href="#" variant="muted" size="sm">Privacy</Link>
      <Link href="#" variant="muted" size="sm">Terms</Link>
      <Link href="#" variant="muted" size="sm">Contact</Link>
      <Link href="https://twitter.com/hivecollege" variant="muted" size="sm" external>Twitter</Link>
    </div>
  ),
};

/**
 * Focus state — WHITE ring (never gold)
 */
export const FocusState: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Text size="sm" tone="muted">Tab to see WHITE focus ring (never gold):</Text>
      <Link href="#">Focus this link</Link>
    </div>
  ),
};
