import type { Meta, StoryObj } from '@storybook/react';
import { TopBar, TopBarSkeleton } from './TopBar';
import { Button, Text } from '../primitives';
import { ChevronLeftIcon, Cog6ToothIcon, EllipsisVerticalIcon } from '@heroicons/react/24/outline';

const meta: Meta<typeof TopBar> = {
  title: 'Design System/Components/Navigation/TopBar',
  component: TopBar,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Page header bar with title, breadcrumbs, and actions. Three variants: minimal, breadcrumbs, collapsible.',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['minimal', 'breadcrumbs', 'collapsible'],
    },
    badgeVariant: {
      control: 'select',
      options: ['neutral', 'gold', 'success'],
    },
    collapsed: {
      control: 'boolean',
    },
    sticky: {
      control: 'boolean',
    },
    bordered: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof TopBar>;

/**
 * Minimal — Simple title + actions
 */
export const Minimal: Story = {
  args: {
    title: 'UB Coders',
    subtitle: '847 members',
    avatar: { fallback: 'UC' },
    badge: '23 online',
    badgeVariant: 'gold',
    variant: 'minimal',
    actions: (
      <>
        <Button variant="ghost" size="icon">
          <Cog6ToothIcon className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon">
          <EllipsisVerticalIcon className="h-5 w-5" />
        </Button>
      </>
    ),
  },
};

/**
 * With back button
 */
export const WithBackButton: Story = {
  args: {
    title: 'Space Settings',
    variant: 'minimal',
    leftAction: (
      <Button variant="ghost" size="icon">
        <ChevronLeftIcon className="h-5 w-5" />
      </Button>
    ),
    actions: (
      <Button variant="secondary" size="sm">
        Save Changes
      </Button>
    ),
  },
};

/**
 * Breadcrumbs — With navigation path
 */
export const Breadcrumbs: Story = {
  args: {
    title: 'General',
    subtitle: 'Main discussion channel',
    avatar: { fallback: 'G' },
    variant: 'breadcrumbs',
    breadcrumbs: [
      { label: 'Spaces', onClick: () => console.log('Spaces') },
      { label: 'UB Coders', onClick: () => console.log('UB Coders') },
      { label: 'General' },
    ],
    actions: (
      <>
        <Button variant="ghost" size="icon">
          <Cog6ToothIcon className="h-5 w-5" />
        </Button>
      </>
    ),
  },
};

/**
 * Collapsible — Shrinks on scroll
 */
export const Collapsible: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Text size="sm" tone="muted" className="px-4 pt-4">
        Expanded state:
      </Text>
      <TopBar
        title="UB Coders"
        subtitle="Where UB programmers connect and build together"
        avatar={{ fallback: 'UC' }}
        badge="23 online"
        badgeVariant="gold"
        variant="collapsible"
        collapsed={false}
        actions={
          <Button variant="secondary" size="sm">
            Join Space
          </Button>
        }
      />

      <Text size="sm" tone="muted" className="px-4 pt-4">
        Collapsed state (on scroll):
      </Text>
      <TopBar
        title="UB Coders"
        subtitle="Where UB programmers connect and build together"
        avatar={{ fallback: 'UC' }}
        badge="23 online"
        badgeVariant="gold"
        variant="collapsible"
        collapsed={true}
        actions={
          <Button variant="secondary" size="sm">
            Join Space
          </Button>
        }
      />
    </div>
  ),
};

/**
 * HiveLab context
 */
export const HiveLabContext: Story = {
  args: {
    title: 'GPA Calculator',
    subtitle: 'Draft',
    variant: 'breadcrumbs',
    breadcrumbs: [
      { label: 'Tools', onClick: () => console.log('Tools') },
      { label: 'My Tools', onClick: () => console.log('My Tools') },
      { label: 'GPA Calculator' },
    ],
    actions: (
      <>
        <Button variant="ghost" size="sm">
          Preview
        </Button>
        <Button variant="cta" size="sm">
          Deploy
        </Button>
      </>
    ),
  },
};

/**
 * Skeleton
 */
export const Skeleton: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <TopBarSkeleton variant="minimal" />
      <TopBarSkeleton variant="breadcrumbs" />
    </div>
  ),
};

/**
 * All variants comparison
 */
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col">
      <Text size="xs" tone="muted" className="px-4 py-2 bg-[var(--color-bg-elevated)]">
        Minimal
      </Text>
      <TopBar
        title="UB Coders"
        subtitle="847 members"
        avatar={{ fallback: 'UC' }}
        badge="23 online"
        badgeVariant="gold"
        variant="minimal"
        sticky={false}
      />

      <Text size="xs" tone="muted" className="px-4 py-2 bg-[var(--color-bg-elevated)] mt-4">
        Breadcrumbs
      </Text>
      <TopBar
        title="General"
        subtitle="Main discussion"
        avatar={{ fallback: 'G' }}
        variant="breadcrumbs"
        breadcrumbs={[
          { label: 'Spaces' },
          { label: 'UB Coders' },
          { label: 'General' },
        ]}
        sticky={false}
      />

      <Text size="xs" tone="muted" className="px-4 py-2 bg-[var(--color-bg-elevated)] mt-4">
        Collapsible (expanded)
      </Text>
      <TopBar
        title="Design Club"
        subtitle="Where UB designers create together"
        avatar={{ fallback: 'DC' }}
        badge="12 online"
        variant="collapsible"
        collapsed={false}
        sticky={false}
      />

      <Text size="xs" tone="muted" className="px-4 py-2 bg-[var(--color-bg-elevated)] mt-4">
        Collapsible (collapsed)
      </Text>
      <TopBar
        title="Design Club"
        subtitle="Where UB designers create together"
        avatar={{ fallback: 'DC' }}
        badge="12 online"
        variant="collapsible"
        collapsed={true}
        sticky={false}
      />
    </div>
  ),
};
