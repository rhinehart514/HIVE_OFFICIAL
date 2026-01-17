import type { Meta, StoryObj } from '@storybook/react';
import {
  Skeleton,
  SkeletonText,
  SkeletonAvatar,
  SkeletonCard,
  SkeletonListItem,
  SkeletonMessageBubble,
  SkeletonSpaceCard,
  SkeletonProfileHeader,
} from './Skeleton';
import { Card } from './Card';
import { Text } from './Text';

/**
 * Skeleton — Loading placeholder
 *
 * Animated placeholders for content loading states.
 * Includes pre-built compositions for common patterns.
 *
 * @see docs/design-system/PRIMITIVES.md (Skeleton)
 */
const meta: Meta<typeof Skeleton> = {
  title: 'Design System/Primitives/Feedback/Skeleton',
  component: Skeleton,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Loading placeholder with shimmer animation. Pre-built compositions available.',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'circle', 'text', 'card'],
      description: 'Shape variant',
    },
    width: {
      control: 'text',
      description: 'Width (CSS value or px)',
    },
    height: {
      control: 'text',
      description: 'Height (CSS value or px)',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Skeleton>;

/**
 * Default — Rectangle skeleton
 */
export const Default: Story = {
  args: {
    width: 200,
    height: 40,
  },
};

/**
 * All variants
 */
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div>
        <Text size="xs" tone="muted" className="mb-2">Default (rectangle)</Text>
        <Skeleton width={200} height={40} />
      </div>
      <div>
        <Text size="xs" tone="muted" className="mb-2">Circle (avatar)</Text>
        <Skeleton variant="circle" width={48} height={48} />
      </div>
      <div className="w-64">
        <Text size="xs" tone="muted" className="mb-2">Text (inline)</Text>
        <Skeleton variant="text" width="100%" />
      </div>
      <div className="w-64">
        <Text size="xs" tone="muted" className="mb-2">Card</Text>
        <Skeleton variant="card" width="100%" height={100} />
      </div>
    </div>
  ),
};

/**
 * Text block
 */
export const TextBlock: Story = {
  render: () => (
    <div className="w-64">
      <SkeletonText lines={3} lastLineWidth="60%" />
    </div>
  ),
};

/**
 * Avatar sizes
 */
export const Avatars: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <SkeletonAvatar size={24} />
      <SkeletonAvatar size={32} />
      <SkeletonAvatar size={40} />
      <SkeletonAvatar size={48} />
      <SkeletonAvatar size={64} />
    </div>
  ),
};

/**
 * List items
 */
export const ListItems: Story = {
  render: () => (
    <div className="w-80 border border-[var(--color-border)] rounded-xl divide-y divide-[var(--color-border)]">
      <SkeletonListItem />
      <SkeletonListItem />
      <SkeletonListItem />
    </div>
  ),
};

/**
 * Message bubbles
 */
export const MessageBubbles: Story = {
  render: () => (
    <div className="w-96 space-y-4">
      <SkeletonMessageBubble align="left" />
      <SkeletonMessageBubble align="right" />
      <SkeletonMessageBubble align="left" />
    </div>
  ),
};

/**
 * Space card
 */
export const SpaceCard: Story = {
  render: () => (
    <div className="w-72">
      <SkeletonSpaceCard />
    </div>
  ),
};

/**
 * Profile header
 */
export const ProfileHeader: Story = {
  render: () => (
    <div className="w-64">
      <SkeletonProfileHeader />
    </div>
  ),
};

/**
 * In context — Feed loading
 */
export const FeedLoadingContext: Story = {
  render: () => (
    <div className="w-[500px] space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="p-4">
          <div className="flex gap-3">
            <SkeletonAvatar size={40} />
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2">
                <Skeleton variant="text" width={100} />
                <Skeleton variant="text" width={60} />
              </div>
              <SkeletonText lines={2} lastLineWidth="80%" />
              <Skeleton height={200} className="rounded-lg" />
              <div className="flex gap-4 pt-2">
                <Skeleton width={60} height={24} className="rounded-full" />
                <Skeleton width={60} height={24} className="rounded-full" />
                <Skeleton width={60} height={24} className="rounded-full" />
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  ),
};

/**
 * In context — Space browse loading
 */
export const SpaceBrowseContext: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-4 w-[700px]">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <SkeletonSpaceCard key={i} />
      ))}
    </div>
  ),
};

/**
 * In context — Chat loading
 */
export const ChatLoadingContext: Story = {
  render: () => (
    <Card className="w-[500px] p-4">
      <div className="space-y-4">
        <SkeletonMessageBubble align="left" />
        <SkeletonMessageBubble align="right" />
        <SkeletonMessageBubble align="left" />
        <SkeletonMessageBubble align="left" />
        <SkeletonMessageBubble align="right" />
      </div>
    </Card>
  ),
};

/**
 * In context — Profile loading
 */
export const ProfileLoadingContext: Story = {
  render: () => (
    <Card className="w-80 p-6">
      <div className="space-y-6">
        <SkeletonProfileHeader />
        <div className="flex justify-center gap-6">
          <div className="text-center">
            <Skeleton variant="text" width={30} className="mx-auto" />
            <Skeleton variant="text" width={50} className="mt-1 mx-auto" />
          </div>
          <div className="text-center">
            <Skeleton variant="text" width={30} className="mx-auto" />
            <Skeleton variant="text" width={50} className="mt-1 mx-auto" />
          </div>
          <div className="text-center">
            <Skeleton variant="text" width={30} className="mx-auto" />
            <Skeleton variant="text" width={50} className="mt-1 mx-auto" />
          </div>
        </div>
        <Skeleton width="100%" height={36} className="rounded-lg" />
        <div className="space-y-2">
          <Skeleton variant="text" width="40%" />
          <SkeletonText lines={3} />
        </div>
      </div>
    </Card>
  ),
};

/**
 * In context — Sidebar loading
 */
export const SidebarLoadingContext: Story = {
  render: () => (
    <div className="w-56 p-3 border-r border-[var(--color-border)] space-y-4">
      <div className="space-y-1">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-3 p-2">
            <Skeleton variant="circle" width={20} height={20} />
            <Skeleton variant="text" width="70%" />
          </div>
        ))}
      </div>
      <div className="h-px bg-[var(--color-border)]" />
      <div className="space-y-1">
        <Skeleton variant="text" width="40%" className="mb-2" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 p-2">
            <Skeleton width={24} height={24} className="rounded-md" />
            <Skeleton variant="text" width="60%" />
          </div>
        ))}
      </div>
    </div>
  ),
};
