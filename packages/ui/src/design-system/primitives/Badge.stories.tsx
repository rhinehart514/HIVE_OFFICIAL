import type { Meta, StoryObj } from '@storybook/react';
import { Badge, DotBadge, CountBadge } from './Badge';
import { Text } from './Text';
import { Card } from './Card';
import { SimpleAvatar } from './Avatar';
import { Button } from './Button';

/**
 * Badge — Status indicators
 *
 * GOLD variant for achievements — one of few gold uses!
 * Includes DotBadge and CountBadge helpers.
 *
 * @see docs/design-system/PRIMITIVES.md (Badge)
 */
const meta: Meta<typeof Badge> = {
  title: 'Design System/Primitives/Navigation/Badge',
  component: Badge,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Status badge with GOLD variant for achievements (one of few gold uses).',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['neutral', 'gold', 'error', 'success', 'outline'],
      description: 'Badge variant',
    },
    size: {
      control: 'select',
      options: ['sm', 'default', 'lg'],
      description: 'Badge size',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Badge>;

/**
 * Default — Neutral badge
 */
export const Default: Story = {
  args: {
    children: 'Badge',
  },
};

/**
 * Gold — Achievements
 */
export const Gold: Story = {
  args: {
    variant: 'gold',
    children: 'Early Adopter',
  },
  parameters: {
    docs: {
      description: {
        story:
          '✨ GOLD: Badge is one of the few components where gold is allowed (achievements).',
      },
    },
  },
};

/**
 * All variants
 */
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Badge variant="neutral">Neutral</Badge>
      <Badge variant="gold">Gold</Badge>
      <Badge variant="error">Error</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="outline">Outline</Badge>
    </div>
  ),
};

/**
 * All sizes
 */
export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Badge size="sm">Small</Badge>
      <Badge size="default">Default</Badge>
      <Badge size="lg">Large</Badge>
    </div>
  ),
};

/**
 * DotBadge — Notification indicator
 */
export const DotBadgeExample: Story = {
  render: () => (
    <div className="flex items-center gap-8">
      <DotBadge variant="error">
        <SimpleAvatar fallback="JD" />
      </DotBadge>
      <DotBadge variant="gold">
        <SimpleAvatar fallback="AB" />
      </DotBadge>
      <DotBadge variant="success">
        <SimpleAvatar fallback="CD" />
      </DotBadge>
      <DotBadge variant="neutral">
        <SimpleAvatar fallback="EF" />
      </DotBadge>
    </div>
  ),
};

/**
 * DotBadge positions
 */
export const DotBadgePositions: Story = {
  render: () => (
    <div className="flex items-center gap-8">
      <DotBadge position="top-right">
        <SimpleAvatar fallback="TR" />
      </DotBadge>
      <DotBadge position="top-left">
        <SimpleAvatar fallback="TL" />
      </DotBadge>
      <DotBadge position="bottom-right">
        <SimpleAvatar fallback="BR" />
      </DotBadge>
      <DotBadge position="bottom-left">
        <SimpleAvatar fallback="BL" />
      </DotBadge>
    </div>
  ),
};

/**
 * CountBadge — Numeric indicator
 */
export const CountBadgeExample: Story = {
  render: () => (
    <div className="flex items-center gap-8">
      <CountBadge count={3}>
        <Button variant="ghost" size="icon">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </Button>
      </CountBadge>
      <CountBadge count={12}>
        <Button variant="ghost" size="icon">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </Button>
      </CountBadge>
      <CountBadge count={150} max={99}>
        <Button variant="ghost" size="icon">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </Button>
      </CountBadge>
    </div>
  ),
};

/**
 * CountBadge variants
 */
export const CountBadgeVariants: Story = {
  render: () => (
    <div className="flex items-center gap-8">
      <CountBadge count={5} variant="error">
        <SimpleAvatar fallback="ER" />
      </CountBadge>
      <CountBadge count={5} variant="gold">
        <SimpleAvatar fallback="GO" />
      </CountBadge>
      <CountBadge count={5} variant="neutral">
        <SimpleAvatar fallback="NE" />
      </CountBadge>
    </div>
  ),
};

/**
 * In context — User roles
 */
export const UserRolesContext: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      {[
        { name: 'Jane Doe', role: 'Admin', variant: 'gold' as const },
        { name: 'John Smith', role: 'Moderator', variant: 'neutral' as const },
        { name: 'Alice Johnson', role: 'Member', variant: 'outline' as const },
      ].map((user, i) => (
        <div key={i} className="flex items-center justify-between w-72 p-3 rounded-lg bg-[var(--color-bg-elevated)]">
          <div className="flex items-center gap-3">
            <SimpleAvatar fallback={user.name.split(' ').map(n => n[0]).join('')} size="sm" />
            <Text size="sm">{user.name}</Text>
          </div>
          <Badge variant={user.variant}>{user.role}</Badge>
        </div>
      ))}
    </div>
  ),
};

/**
 * In context — Space status
 */
export const SpaceStatusContext: Story = {
  render: () => (
    <Card className="p-4 w-80">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Text weight="medium">UB Coders</Text>
            <Badge variant="gold" size="sm">Official</Badge>
          </div>
          <Text size="sm" tone="muted" className="mt-1">
            Computer Science community
          </Text>
        </div>
      </div>
    </Card>
  ),
};

/**
 * In context — Achievement badges
 */
export const AchievementBadgesContext: Story = {
  render: () => (
    <Card className="p-6 w-80">
      <Text weight="medium" className="mb-4">Achievements</Text>
      <div className="flex flex-wrap gap-2">
        <Badge variant="gold">🏆 Founding Member</Badge>
        <Badge variant="gold">⚡ Early Adopter</Badge>
        <Badge variant="gold">🎯 Top Contributor</Badge>
        <Badge variant="neutral">👋 First Post</Badge>
        <Badge variant="neutral">💬 10 Messages</Badge>
      </div>
    </Card>
  ),
};

/**
 * In context — Notifications
 */
export const NotificationsContext: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <CountBadge count={5} variant="error">
        <Button variant="ghost" size="icon">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </Button>
      </CountBadge>
      <DotBadge variant="gold">
        <Button variant="ghost" size="icon">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        </Button>
      </DotBadge>
      <Button variant="ghost" size="icon">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </Button>
    </div>
  ),
};

/**
 * Gold budget note
 */
export const GoldBudgetNote: Story = {
  render: () => (
    <Card className="max-w-md p-6">
      <div className="flex flex-col gap-4">
        <div className="flex gap-2">
          <Badge variant="gold">Achievement</Badge>
          <Badge variant="gold">Official</Badge>
        </div>
        <Text size="sm" tone="secondary">
          The Badge component with gold variant is one of the few places where gold is permitted in the design system. Use it for:
        </Text>
        <ul className="text-sm text-[var(--color-text-muted)] list-disc list-inside space-y-1">
          <li>Achievement badges</li>
          <li>Official/verified status</li>
          <li>Special recognition</li>
        </ul>
        <Text size="xs" tone="muted">
          Other gold uses: PresenceDot, Button CTA, Switch (on), Progress, LiveCounter
        </Text>
      </div>
    </Card>
  ),
};
