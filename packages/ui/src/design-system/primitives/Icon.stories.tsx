import type { Meta, StoryObj } from '@storybook/react';
import { Icon } from './Icon';
import { Text } from './Text';
import {
  HomeIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  SparklesIcon,
  ChatBubbleLeftRightIcon,
  BellIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  CheckCircleIcon as CheckCircleSolid,
} from '@heroicons/react/24/solid';

/**
 * Icon — Heroicons wrapper
 *
 * Provides consistent sizing for Heroicons.
 * Import icons from @heroicons/react/24/outline or /24/solid.
 *
 * @see docs/design-system/PRIMITIVES.md (Icon)
 */
const meta: Meta<typeof Icon> = {
  title: 'Design System/Primitives/Containers/Icon',
  component: Icon,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Heroicons wrapper for consistent sizing. Use 24/outline for navigation and buttons, 24/solid for status indicators.',
      },
    },
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'default', 'lg'],
      description: 'Size: sm (16px), default (20px), lg (24px)',
    },
    strokeWidth: {
      control: { type: 'range', min: 1, max: 3, step: 0.5 },
      description: 'Stroke width (outline icons only)',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Icon>;

/**
 * Default — 20px outline icon
 */
export const Default: Story = {
  args: {
    icon: HomeIcon,
    size: 'default',
  },
};

/**
 * All sizes
 */
export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      <div className="flex flex-col items-center gap-2">
        <Icon icon={HomeIcon} size="sm" />
        <Text size="xs" tone="muted">16px</Text>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Icon icon={HomeIcon} size="default" />
        <Text size="xs" tone="muted">20px</Text>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Icon icon={HomeIcon} size="lg" />
        <Text size="xs" tone="muted">24px</Text>
      </div>
    </div>
  ),
};

/**
 * Common icons — Navigation set
 */
export const NavigationIcons: Story = {
  render: () => (
    <div className="flex gap-4">
      <Icon icon={HomeIcon} />
      <Icon icon={UserGroupIcon} />
      <Icon icon={SparklesIcon} />
      <Icon icon={ChatBubbleLeftRightIcon} />
      <Icon icon={BellIcon} />
      <Icon icon={Cog6ToothIcon} />
    </div>
  ),
};

/**
 * Common icons — Action set
 */
export const ActionIcons: Story = {
  render: () => (
    <div className="flex gap-4">
      <Icon icon={MagnifyingGlassIcon} />
      <Icon icon={PlusIcon} />
      <Icon icon={CheckIcon} />
      <Icon icon={XMarkIcon} />
    </div>
  ),
};

/**
 * Outline vs Solid
 */
export const OutlineVsSolid: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <Icon icon={HomeIcon} />
        <Text size="sm" tone="muted">Outline — Navigation, buttons</Text>
      </div>
      <div className="flex items-center gap-4">
        <Icon icon={HomeIconSolid} />
        <Text size="sm" tone="muted">Solid — Status indicators</Text>
      </div>
    </div>
  ),
};

/**
 * With color inheritance
 */
export const ColorInheritance: Story = {
  render: () => (
    <div className="flex gap-6">
      <div className="text-[var(--color-text-primary)]">
        <Icon icon={HomeIcon} />
      </div>
      <div className="text-[var(--color-text-secondary)]">
        <Icon icon={HomeIcon} />
      </div>
      <div className="text-[var(--color-text-muted)]">
        <Icon icon={HomeIcon} />
      </div>
      <div className="text-[var(--color-accent-gold)]">
        <Icon icon={HomeIcon} />
      </div>
      <div className="text-[var(--color-status-success)]">
        <Icon icon={CheckCircleSolid} />
      </div>
    </div>
  ),
};

/**
 * In context — Button with icon
 */
export const ButtonContext: Story = {
  render: () => (
    <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-card)] transition-colors">
      <Icon icon={PlusIcon} size="sm" />
      <span>Create Space</span>
    </button>
  ),
};

/**
 * In context — Navigation item
 */
export const NavigationContext: Story = {
  render: () => (
    <nav className="flex flex-col gap-1 w-48">
      <a className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)]">
        <Icon icon={HomeIcon} />
        <span>Home</span>
      </a>
      <a className="flex items-center gap-3 px-3 py-2 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-elevated)]/50">
        <Icon icon={UserGroupIcon} />
        <span>Spaces</span>
      </a>
      <a className="flex items-center gap-3 px-3 py-2 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-elevated)]/50">
        <Icon icon={SparklesIcon} />
        <span>Lab</span>
      </a>
    </nav>
  ),
};
