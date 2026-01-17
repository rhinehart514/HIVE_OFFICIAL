import type { Meta, StoryObj } from '@storybook/react';
import { StatCard, StatCardGroup, StatCardSkeleton } from './StatCard';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * STATCARD VISUAL REFERENCE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Displays a single metric/KPI with optional trend indicator.
 *
 * STRUCTURE:
 *   [ICON]           Optional 32x32 icon container
 *   Label            text-sm, muted
 *   Value  ↑ 12.5%   text-3xl bold + trend indicator
 *   vs last week     Optional trend label
 *   ▂▃▄▅▆▇█          Optional sparkline
 *
 * SIZE VARIANTS:
 * - sm: Compact, value text-xl, p-3
 * - default: Standard, value text-3xl, p-5
 * - lg: Hero, value text-5xl, p-6
 *
 * TREND COLORS:
 * - Positive (up): #22C55E (green)
 * - Negative (down): #FF6B6B (red)
 * - Neutral: text-muted (gray)
 *
 * FEATURES:
 * - Auto-formatted numbers with commas
 * - Compact notation (K, M, B)
 * - Currency prefix support
 * - Sparkline mini chart
 * - Loading skeleton state
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

const meta: Meta<typeof StatCard> = {
  title: 'Design System/Components/Data/StatCard',
  component: StatCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Displays a single metric/KPI with optional trend indicator.',
      },
    },
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'default', 'lg'],
    },
    variant: {
      control: 'select',
      options: ['default', 'outline', 'ghost'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof StatCard>;

/**
 * Default — Basic stat card
 */
export const Default: Story = {
  args: {
    label: 'Active Users',
    value: 2847,
  },
};

/**
 * With trend
 */
export const WithTrend: Story = {
  args: {
    label: 'Active Users',
    value: 2847,
    trend: 12.5,
    trendLabel: 'vs last week',
  },
};

/**
 * Negative trend
 */
export const NegativeTrend: Story = {
  args: {
    label: 'Bounce Rate',
    value: '45.2%',
    trend: -8.3,
    trendLabel: 'vs last month',
  },
};

/**
 * Neutral trend
 */
export const NeutralTrend: Story = {
  args: {
    label: 'Conversion Rate',
    value: '3.2%',
    trend: 0,
    trendLabel: 'no change',
  },
};

/**
 * With icon
 */
export const WithIcon: Story = {
  args: {
    label: 'Total Revenue',
    value: 156420,
    currency: '$',
    compact: true,
    trend: 23.5,
    trendLabel: 'vs last quarter',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5 text-[var(--color-text-muted)]">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
      </svg>
    ),
  },
};

/**
 * With sparkline
 */
export const WithSparkline: Story = {
  args: {
    label: 'Page Views',
    value: 48293,
    compact: true,
    trend: 15.2,
    sparkline: [120, 145, 132, 168, 185, 192, 178, 205, 215, 238],
  },
};

/**
 * Negative sparkline
 */
export const NegativeSparkline: Story = {
  args: {
    label: 'Error Rate',
    value: '2.4%',
    trend: -5.8,
    trendLabel: 'improving',
    sparkline: [45, 42, 38, 35, 32, 28, 25, 24, 23, 22],
  },
};

/**
 * Small size
 */
export const Small: Story = {
  args: {
    size: 'sm',
    label: 'Messages',
    value: 847,
    trend: 5.2,
  },
};

/**
 * Large size
 */
export const Large: Story = {
  args: {
    size: 'lg',
    label: 'Monthly Active Users',
    value: 32847,
    trend: 15.3,
    trendLabel: 'vs last month',
    sparkline: [250, 280, 295, 310, 325, 340, 360, 385, 410, 450],
  },
};

/**
 * Compact number formatting
 */
export const CompactNumbers: Story = {
  render: () => (
    <div className="flex gap-4">
      <StatCard label="Views" value={1234567} compact />
      <StatCard label="Revenue" value={45600000} compact currency="$" />
      <StatCard label="Users" value={2500000000} compact />
    </div>
  ),
};

/**
 * Currency formatting
 */
export const CurrencyFormatting: Story = {
  render: () => (
    <div className="flex gap-4">
      <StatCard label="Revenue" value={12345} currency="$" />
      <StatCard label="Revenue (compact)" value={1234567} currency="$" compact />
    </div>
  ),
};

/**
 * Loading state
 */
export const Loading: Story = {
  args: {
    label: 'Active Users',
    value: 0,
    loading: true,
  },
};

/**
 * Skeleton variant
 */
export const Skeleton: Story = {
  render: () => (
    <div className="flex gap-4">
      <StatCardSkeleton size="sm" />
      <StatCardSkeleton size="default" />
      <StatCardSkeleton size="lg" />
    </div>
  ),
};

/**
 * Clickable
 */
export const Clickable: Story = {
  args: {
    label: 'New Users',
    value: 342,
    trend: 28.5,
    onClick: () => alert('Clicked!'),
    tooltip: 'Click to view details',
  },
};

/**
 * Stat card group
 */
export const Group: Story = {
  render: () => (
    <StatCardGroup columns={4}>
      <StatCard
        label="Active Users"
        value={2847}
        trend={12.5}
        icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5 text-[var(--color-text-muted)]">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
          </svg>
        }
      />
      <StatCard
        label="Messages Sent"
        value={48293}
        compact
        trend={8.2}
        icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5 text-[var(--color-text-muted)]">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
          </svg>
        }
      />
      <StatCard
        label="Spaces Created"
        value={156}
        trend={-3.4}
        icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5 text-[var(--color-text-muted)]">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
          </svg>
        }
      />
      <StatCard
        label="Tools Built"
        value={89}
        trend={45.2}
        icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5 text-[var(--color-text-muted)]">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
          </svg>
        }
      />
    </StatCardGroup>
  ),
};

/**
 * Dashboard layout
 */
export const DashboardLayout: Story = {
  render: () => (
    <div className="space-y-6 w-[800px]">
      {/* Hero stat */}
      <StatCard
        size="lg"
        label="Total Platform Users"
        value={32847}
        trend={15.3}
        trendLabel="vs last month"
        sparkline={[250, 280, 295, 310, 325, 340, 360, 385, 410, 450]}
      />

      {/* Stat row */}
      <StatCardGroup columns={4}>
        <StatCard label="DAU" value={8234} trend={5.2} />
        <StatCard label="WAU" value={18293} trend={8.7} />
        <StatCard label="MAU" value={32847} trend={15.3} />
        <StatCard label="Retention" value="67.2%" trend={2.1} />
      </StatCardGroup>

      {/* Loading row */}
      <StatCardGroup columns={4}>
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </StatCardGroup>
    </div>
  ),
};

/**
 * All variants
 */
export const AllVariants: Story = {
  render: () => (
    <div className="flex gap-4">
      <StatCard variant="default" label="Default" value={1234} />
      <StatCard variant="outline" label="Outline" value={1234} />
      <StatCard variant="ghost" label="Ghost" value={1234} />
    </div>
  ),
};
