'use client';

import type { Meta, StoryObj } from '@storybook/react';
import {
  Skeleton,
  SkeletonText,
  SkeletonAvatar,
  SkeletonCard,
  SkeletonListItem,
  SkeletonButton,
} from './Skeleton';

const meta: Meta<typeof Skeleton> = {
  title: 'Design System/Components/Skeleton',
  component: Skeleton,
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'dark' },
  },
  decorators: [
    (Story) => (
      <div className="p-8 w-[400px]">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    animation: {
      control: 'select',
      options: ['pulse', 'shimmer', 'none'],
    },
    rounded: {
      control: 'select',
      options: ['none', 'sm', 'default', 'lg', 'full'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Skeleton>;

/**
 * Basic skeleton rectangle.
 */
export const Default: Story = {
  args: {
    className: 'h-12 w-full',
  },
};

/**
 * Skeleton with pulse animation (default).
 */
export const Pulse: Story = {
  args: {
    animation: 'pulse',
    className: 'h-12 w-full',
  },
};

/**
 * Skeleton with shimmer animation.
 */
export const Shimmer: Story = {
  args: {
    animation: 'shimmer',
    className: 'h-12 w-full',
  },
};

/**
 * Skeleton without animation.
 */
export const NoAnimation: Story = {
  args: {
    animation: 'none',
    className: 'h-12 w-full',
  },
};

/**
 * Different rounded corners.
 */
export const RoundedVariants: Story = {
  render: () => (
    <div className="space-y-4">
      <Skeleton rounded="none" className="h-10 w-full" />
      <Skeleton rounded="sm" className="h-10 w-full" />
      <Skeleton rounded="default" className="h-10 w-full" />
      <Skeleton rounded="lg" className="h-10 w-full" />
      <Skeleton rounded="full" className="h-10 w-full" />
    </div>
  ),
};

/**
 * Text skeleton with multiple lines.
 */
export const TextLines: StoryObj<typeof SkeletonText> = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h4 className="text-sm text-[var(--color-text-muted)] mb-2">3 lines (default)</h4>
        <SkeletonText />
      </div>
      <div>
        <h4 className="text-sm text-[var(--color-text-muted)] mb-2">5 lines</h4>
        <SkeletonText lines={5} />
      </div>
      <div>
        <h4 className="text-sm text-[var(--color-text-muted)] mb-2">Custom widths</h4>
        <SkeletonText lines={4} widths={[100, 90, 95, 40]} />
      </div>
    </div>
  ),
};

/**
 * Avatar skeleton in different sizes.
 */
export const AvatarSizes: StoryObj<typeof SkeletonAvatar> = {
  render: () => (
    <div className="flex items-center gap-4">
      <div className="flex flex-col items-center gap-2">
        <SkeletonAvatar size="xs" />
        <span className="text-xs text-[var(--color-text-muted)]">XS</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <SkeletonAvatar size="sm" />
        <span className="text-xs text-[var(--color-text-muted)]">SM</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <SkeletonAvatar size="md" />
        <span className="text-xs text-[var(--color-text-muted)]">MD</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <SkeletonAvatar size="lg" />
        <span className="text-xs text-[var(--color-text-muted)]">LG</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <SkeletonAvatar size="xl" />
        <span className="text-xs text-[var(--color-text-muted)]">XL</span>
      </div>
    </div>
  ),
};

/**
 * Card skeleton with header and content.
 */
export const Card: StoryObj<typeof SkeletonCard> = {
  render: () => (
    <SkeletonCard showHeader showFooter contentLines={4} />
  ),
};

/**
 * Card skeleton variants.
 */
export const CardVariants: StoryObj<typeof SkeletonCard> = {
  render: () => (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm text-[var(--color-text-muted)] mb-2">With header</h4>
        <SkeletonCard showHeader />
      </div>
      <div>
        <h4 className="text-sm text-[var(--color-text-muted)] mb-2">Without header</h4>
        <SkeletonCard showHeader={false} contentLines={2} />
      </div>
      <div>
        <h4 className="text-sm text-[var(--color-text-muted)] mb-2">With footer</h4>
        <SkeletonCard showHeader showFooter contentLines={2} />
      </div>
    </div>
  ),
};

/**
 * List item skeleton.
 */
export const ListItems: StoryObj<typeof SkeletonListItem> = {
  render: () => (
    <div className="space-y-2">
      <SkeletonListItem />
      <SkeletonListItem />
      <SkeletonListItem />
      <SkeletonListItem showTrailing />
      <SkeletonListItem showAvatar={false} showTrailing />
    </div>
  ),
};

/**
 * Button skeleton in different sizes.
 */
export const Buttons: StoryObj<typeof SkeletonButton> = {
  render: () => (
    <div className="flex items-center gap-4">
      <div className="flex flex-col items-center gap-2">
        <SkeletonButton size="sm" />
        <span className="text-xs text-[var(--color-text-muted)]">Small</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <SkeletonButton size="default" />
        <span className="text-xs text-[var(--color-text-muted)]">Default</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <SkeletonButton size="lg" />
        <span className="text-xs text-[var(--color-text-muted)]">Large</span>
      </div>
    </div>
  ),
};

/**
 * Full width button skeleton.
 */
export const FullWidthButton: StoryObj<typeof SkeletonButton> = {
  render: () => (
    <SkeletonButton fullWidth />
  ),
};

/**
 * Profile page skeleton composition.
 */
export const ProfilePageSkeleton: Story = {
  decorators: [
    (Story) => (
      <div className="p-8 w-[600px]">
        <Story />
      </div>
    ),
  ],
  render: () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <SkeletonAvatar size="xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <SkeletonButton />
      </div>

      {/* Stats */}
      <div className="flex gap-4">
        <Skeleton className="h-20 flex-1 rounded-xl" />
        <Skeleton className="h-20 flex-1 rounded-xl" />
        <Skeleton className="h-20 flex-1 rounded-xl" />
      </div>

      {/* Content */}
      <SkeletonCard showHeader contentLines={4} />
    </div>
  ),
};

/**
 * Space card skeleton composition.
 */
export const SpaceCardSkeleton: Story = {
  render: () => (
    <div className="w-80 p-4 rounded-xl border border-[var(--color-border)] bg-[#141414]">
      {/* Image */}
      <Skeleton className="h-32 w-full rounded-lg mb-4" />

      {/* Title */}
      <Skeleton className="h-5 w-3/4 mb-2" />

      {/* Description */}
      <SkeletonText lines={2} widths={[100, 80]} />

      {/* Footer */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex -space-x-2">
          <SkeletonAvatar size="xs" />
          <SkeletonAvatar size="xs" />
          <SkeletonAvatar size="xs" />
        </div>
        <SkeletonButton size="sm" />
      </div>
    </div>
  ),
};

/**
 * Feed skeleton with multiple cards.
 */
export const FeedSkeleton: Story = {
  decorators: [
    (Story) => (
      <div className="p-8 w-[500px]">
        <Story />
      </div>
    ),
  ],
  render: () => (
    <div className="space-y-4">
      <SkeletonCard showHeader contentLines={3} showFooter />
      <SkeletonCard showHeader contentLines={2} showFooter />
      <SkeletonCard showHeader contentLines={4} showFooter />
    </div>
  ),
};

/**
 * Chat message skeleton.
 */
export const ChatMessageSkeleton: Story = {
  render: () => (
    <div className="space-y-4">
      {/* Incoming message */}
      <div className="flex items-start gap-2">
        <SkeletonAvatar size="sm" />
        <div className="space-y-1">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-16 w-64 rounded-2xl rounded-tl-md" />
        </div>
      </div>

      {/* Outgoing message */}
      <div className="flex items-start gap-2 justify-end">
        <div className="space-y-1 items-end">
          <Skeleton className="h-10 w-48 rounded-2xl rounded-tr-md" />
        </div>
      </div>

      {/* Incoming message */}
      <div className="flex items-start gap-2">
        <SkeletonAvatar size="sm" />
        <div className="space-y-1">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-24 w-72 rounded-2xl rounded-tl-md" />
        </div>
      </div>
    </div>
  ),
};

/**
 * Shimmer animation comparison.
 */
export const AnimationComparison: Story = {
  decorators: [
    (Story) => (
      <div className="p-8 w-[500px]">
        <Story />
      </div>
    ),
  ],
  render: () => (
    <div className="space-y-8">
      <div>
        <h4 className="text-sm font-medium text-white mb-2">Pulse (default)</h4>
        <SkeletonCard animation="pulse" showHeader contentLines={2} />
      </div>
      <div>
        <h4 className="text-sm font-medium text-white mb-2">Shimmer</h4>
        <SkeletonCard animation="shimmer" showHeader contentLines={2} />
      </div>
      <div>
        <h4 className="text-sm font-medium text-white mb-2">None</h4>
        <SkeletonCard animation="none" showHeader contentLines={2} />
      </div>
    </div>
  ),
};
