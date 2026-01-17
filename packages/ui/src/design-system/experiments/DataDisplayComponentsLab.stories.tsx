import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';

// Import data display components
import {
  AspectRatio,
  AspectRatioImage,
  AspectRatioVideo,
} from '../components/AspectRatio';
import {
  DataTable,
  SimpleDataTable,
} from '../components/DataTable';
import {
  StatCard,
  SimpleStatCard,
  StatCardGrid,
} from '../components/StatCard';

const meta: Meta = {
  title: 'Experiments/Data Display Components Lab',
  parameters: {
    layout: 'padded',
    backgrounds: { default: 'hive-dark' },
  },
};

export default meta;
type Story = StoryObj;

// ============================================
// ASPECT RATIO LAB
// ============================================

/**
 * EXPERIMENT: Aspect Ratio Presets
 * Compare: Common ratios side-by-side
 * Decisions: Content fitting behavior
 */
export const AspectRatioLab: Story = {
  render: () => (
    <div className="space-y-12 max-w-4xl">
      <div className="text-sm text-[var(--color-text-muted)] mb-4">
        <strong>ASPECT RATIO</strong> - Maintaining consistent dimensions
      </div>

      {/* Ratio comparison */}
      <div className="space-y-4">
        <div className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wider">
          Common Ratios
        </div>
        <div className="grid grid-cols-4 gap-4">
          <div className="space-y-2">
            <div className="text-xs text-[var(--color-text-muted)] text-center">1:1 (Square)</div>
            <AspectRatio ratio={1}>
              <div className="w-full h-full bg-gradient-to-br from-[#FFD700]/20 to-[#FFD700]/5 rounded-lg flex items-center justify-center border border-[var(--color-border)]">
                <span className="text-xs text-[var(--color-text-muted)]">1:1</span>
              </div>
            </AspectRatio>
          </div>
          <div className="space-y-2">
            <div className="text-xs text-[var(--color-text-muted)] text-center">4:3 (Standard)</div>
            <AspectRatio ratio={4 / 3}>
              <div className="w-full h-full bg-gradient-to-br from-blue-500/20 to-blue-500/5 rounded-lg flex items-center justify-center border border-[var(--color-border)]">
                <span className="text-xs text-[var(--color-text-muted)]">4:3</span>
              </div>
            </AspectRatio>
          </div>
          <div className="space-y-2">
            <div className="text-xs text-[var(--color-text-muted)] text-center">16:9 (Widescreen)</div>
            <AspectRatio ratio={16 / 9}>
              <div className="w-full h-full bg-gradient-to-br from-purple-500/20 to-purple-500/5 rounded-lg flex items-center justify-center border border-[var(--color-border)]">
                <span className="text-xs text-[var(--color-text-muted)]">16:9</span>
              </div>
            </AspectRatio>
          </div>
          <div className="space-y-2">
            <div className="text-xs text-[var(--color-text-muted)] text-center">3:2 (Photo)</div>
            <AspectRatio ratio={3 / 2}>
              <div className="w-full h-full bg-gradient-to-br from-green-500/20 to-green-500/5 rounded-lg flex items-center justify-center border border-[var(--color-border)]">
                <span className="text-xs text-[var(--color-text-muted)]">3:2</span>
              </div>
            </AspectRatio>
          </div>
        </div>
      </div>

      {/* Portrait vs landscape */}
      <div className="space-y-4">
        <div className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wider">
          Portrait vs Landscape
        </div>
        <div className="flex gap-8 items-end">
          <div className="space-y-2 w-32">
            <div className="text-xs text-[var(--color-text-muted)] text-center">9:16 (Story)</div>
            <AspectRatio ratio={9 / 16}>
              <div className="w-full h-full bg-gradient-to-br from-pink-500/20 to-pink-500/5 rounded-lg flex items-center justify-center border border-[var(--color-border)]">
                <span className="text-xs text-[var(--color-text-muted)]">9:16</span>
              </div>
            </AspectRatio>
          </div>
          <div className="space-y-2 flex-1 max-w-md">
            <div className="text-xs text-[var(--color-text-muted)] text-center">21:9 (Ultrawide)</div>
            <AspectRatio ratio={21 / 9}>
              <div className="w-full h-full bg-gradient-to-br from-orange-500/20 to-orange-500/5 rounded-lg flex items-center justify-center border border-[var(--color-border)]">
                <span className="text-xs text-[var(--color-text-muted)]">21:9</span>
              </div>
            </AspectRatio>
          </div>
        </div>
      </div>

      {/* Content fitting */}
      <div className="space-y-4">
        <div className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wider">
          Content Fitting (object-fit)
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <div className="text-xs text-[var(--color-text-muted)] text-center">cover (crop)</div>
            <AspectRatio ratio={1}>
              <img
                src="https://picsum.photos/400/300"
                alt="Demo"
                className="w-full h-full object-cover rounded-lg"
              />
            </AspectRatio>
          </div>
          <div className="space-y-2">
            <div className="text-xs text-[var(--color-text-muted)] text-center">contain (letterbox)</div>
            <AspectRatio ratio={1}>
              <div className="w-full h-full bg-[var(--color-bg-elevated)] rounded-lg flex items-center justify-center">
                <img
                  src="https://picsum.photos/400/300"
                  alt="Demo"
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            </AspectRatio>
          </div>
          <div className="space-y-2">
            <div className="text-xs text-[var(--color-text-muted)] text-center">fill (stretch)</div>
            <AspectRatio ratio={1}>
              <img
                src="https://picsum.photos/400/300"
                alt="Demo"
                className="w-full h-full object-fill rounded-lg"
              />
            </AspectRatio>
          </div>
        </div>
      </div>

      {/* Use cases */}
      <div className="space-y-4">
        <div className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wider">
          Common Use Cases
        </div>
        <div className="grid grid-cols-3 gap-6">
          <div className="space-y-2">
            <div className="text-xs text-[var(--color-text-muted)]">Profile Avatar</div>
            <div className="w-24">
              <AspectRatioImage
                ratio={1}
                src="https://picsum.photos/200"
                alt="Avatar"
                className="rounded-xl"
              />
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-xs text-[var(--color-text-muted)]">Video Thumbnail</div>
            <AspectRatioImage
              ratio={16 / 9}
              src="https://picsum.photos/640/360"
              alt="Video"
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <div className="text-xs text-[var(--color-text-muted)]">Card Image</div>
            <AspectRatioImage
              ratio={3 / 2}
              src="https://picsum.photos/600/400"
              alt="Card"
              className="rounded-xl"
            />
          </div>
        </div>
      </div>
    </div>
  ),
};

// ============================================
// DATA TABLE LAB
// ============================================

interface MockUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive' | 'pending';
  joinedAt: string;
}

const mockUsers: MockUser[] = [
  { id: '1', name: 'Alice Johnson', email: 'alice@example.com', role: 'Admin', status: 'active', joinedAt: '2024-01-15' },
  { id: '2', name: 'Bob Smith', email: 'bob@example.com', role: 'Member', status: 'active', joinedAt: '2024-02-20' },
  { id: '3', name: 'Carol Davis', email: 'carol@example.com', role: 'Leader', status: 'pending', joinedAt: '2024-03-10' },
  { id: '4', name: 'David Wilson', email: 'david@example.com', role: 'Member', status: 'inactive', joinedAt: '2024-01-05' },
  { id: '5', name: 'Eva Martinez', email: 'eva@example.com', role: 'Member', status: 'active', joinedAt: '2024-03-25' },
];

const columns = [
  { key: 'name', header: 'Name', sortable: true },
  { key: 'email', header: 'Email' },
  { key: 'role', header: 'Role', sortable: true },
  {
    key: 'status',
    header: 'Status',
    render: (value: unknown) => {
      const status = value as string;
      const colors = {
        active: 'bg-green-500/20 text-green-400',
        inactive: 'bg-red-500/20 text-red-400',
        pending: 'bg-yellow-500/20 text-yellow-400',
      };
      return (
        <span className={`px-2 py-0.5 rounded-full text-xs ${colors[status as keyof typeof colors]}`}>
          {status}
        </span>
      );
    },
  },
  { key: 'joinedAt', header: 'Joined', sortable: true },
];

/**
 * EXPERIMENT: Data Table Variants
 * Compare: basic vs sorting vs full
 * Decisions: Row selection, pagination, search integration
 */
export const DataTableLab: Story = {
  render: () => {
    const [sortColumn, setSortColumn] = React.useState<string>('name');
    const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc');
    const [selectedKeys, setSelectedKeys] = React.useState<Set<string | number>>(new Set());
    const [page, setPage] = React.useState(1);
    const [search, setSearch] = React.useState('');

    return (
      <div className="space-y-12 max-w-4xl">
        <div className="text-sm text-[var(--color-text-muted)] mb-4">
          <strong>DATA TABLE</strong> - Sortable, filterable data display
        </div>

        {/* Basic variant */}
        <div className="space-y-4">
          <div className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wider">
            Basic - Simple data display
          </div>
          <div className="border border-[var(--color-border)] rounded-xl overflow-hidden">
            <SimpleDataTable
              columns={columns}
              data={mockUsers}
              getRowKey={(row) => row.id}
              variant="basic"
            />
          </div>
        </div>

        {/* Sorting variant */}
        <div className="space-y-4">
          <div className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wider">
            Sorting - Click headers to sort
          </div>
          <div className="border border-[var(--color-border)] rounded-xl overflow-hidden">
            <SimpleDataTable
              columns={columns}
              data={mockUsers}
              getRowKey={(row) => row.id}
              variant="sorting"
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onSort={(col, dir) => {
                setSortColumn(col as string);
                setSortDirection(dir);
              }}
            />
          </div>
        </div>

        {/* Full variant */}
        <div className="space-y-4">
          <div className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wider">
            Full - Search, selection, pagination
          </div>
          <div className="border border-[var(--color-border)] rounded-xl overflow-hidden">
            <DataTable
              columns={columns}
              data={mockUsers}
              getRowKey={(row) => row.id}
              variant="full"
              selectable
              selectedKeys={selectedKeys}
              onSelectionChange={setSelectedKeys}
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onSort={(col, dir) => {
                setSortColumn(col as string);
                setSortDirection(dir);
              }}
              searchValue={search}
              onSearchChange={setSearch}
              searchPlaceholder="Search users..."
              pagination={{
                page,
                pageSize: 3,
                total: mockUsers.length,
                onPageChange: setPage,
              }}
            />
          </div>
          <div className="text-xs text-[var(--color-text-muted)]">
            Selected: {selectedKeys.size} row(s)
          </div>
        </div>

        {/* Row click handler */}
        <div className="space-y-4">
          <div className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wider">
            Clickable Rows
          </div>
          <div className="border border-[var(--color-border)] rounded-xl overflow-hidden">
            <SimpleDataTable
              columns={columns.slice(0, 3)}
              data={mockUsers.slice(0, 3)}
              getRowKey={(row) => row.id}
              onRowClick={(row) => alert(`Clicked: ${row.name}`)}
            />
          </div>
        </div>

        {/* Empty state */}
        <div className="space-y-4">
          <div className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wider">
            Empty State
          </div>
          <div className="border border-[var(--color-border)] rounded-xl overflow-hidden">
            <SimpleDataTable
              columns={columns}
              data={[]}
              getRowKey={(row) => row.id}
              emptyMessage="No users found"
            />
          </div>
        </div>
      </div>
    );
  },
};

// ============================================
// STAT CARD LAB
// ============================================

/**
 * EXPERIMENT: Stat Card Variants
 * Compare: sizes and trend indicators
 * Decisions: When to use sparklines, color for trends
 */
export const StatCardLab: Story = {
  render: () => (
    <div className="space-y-12 max-w-4xl">
      <div className="text-sm text-[var(--color-text-muted)] mb-4">
        <strong>STAT CARD</strong> - Metric display with trends
      </div>

      {/* Size comparison */}
      <div className="space-y-4">
        <div className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wider">
          Size Variants
        </div>
        <div className="grid grid-cols-3 gap-4">
          <SimpleStatCard
            label="Active Users"
            value="2,847"
            trend={{ value: 12.5, direction: 'up' }}
            size="sm"
          />
          <SimpleStatCard
            label="Active Users"
            value="2,847"
            trend={{ value: 12.5, direction: 'up' }}
            size="default"
          />
          <SimpleStatCard
            label="Active Users"
            value="2,847"
            trend={{ value: 12.5, direction: 'up' }}
            size="lg"
          />
        </div>
        <div className="flex gap-4 text-xs text-[var(--color-text-muted)]">
          <span>sm</span>
          <span>default</span>
          <span>lg</span>
        </div>
      </div>

      {/* Trend directions */}
      <div className="space-y-4">
        <div className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wider">
          Trend Indicators
        </div>
        <div className="grid grid-cols-3 gap-4">
          <SimpleStatCard
            label="Revenue"
            value="$48,234"
            trend={{ value: 15.3, direction: 'up' }}
            trendLabel="vs last month"
          />
          <SimpleStatCard
            label="Bounce Rate"
            value="32.5%"
            trend={{ value: 8.2, direction: 'down' }}
            trendLabel="vs last week"
          />
          <SimpleStatCard
            label="Sessions"
            value="12,847"
            trend={{ value: 0, direction: 'neutral' }}
            trendLabel="no change"
          />
        </div>
      </div>

      {/* With icons */}
      <div className="space-y-4">
        <div className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wider">
          With Icons
        </div>
        <div className="grid grid-cols-3 gap-4">
          <SimpleStatCard
            label="Total Spaces"
            value="156"
            icon="🏠"
            trend={{ value: 5, direction: 'up' }}
          />
          <SimpleStatCard
            label="New Members"
            value="847"
            icon="👥"
            trend={{ value: 23.1, direction: 'up' }}
          />
          <SimpleStatCard
            label="Tools Created"
            value="42"
            icon="🔧"
            trend={{ value: 12, direction: 'up' }}
          />
        </div>
      </div>

      {/* Grid layout */}
      <div className="space-y-4">
        <div className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wider">
          Dashboard Grid
        </div>
        <StatCardGrid columns={4}>
          <SimpleStatCard label="Users" value="32,847" trend={{ value: 12, direction: 'up' }} />
          <SimpleStatCard label="Revenue" value="$128.4K" trend={{ value: 8.3, direction: 'up' }} />
          <SimpleStatCard label="Orders" value="1,284" trend={{ value: 5.2, direction: 'down' }} />
          <SimpleStatCard label="Conversion" value="3.24%" trend={{ value: 0.5, direction: 'up' }} />
        </StatCardGrid>
      </div>

      {/* Loading state */}
      <div className="space-y-4">
        <div className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wider">
          Loading State
        </div>
        <div className="grid grid-cols-3 gap-4">
          <SimpleStatCard
            label="Loading..."
            value=""
            loading
          />
          <SimpleStatCard
            label="Active Users"
            value="2,847"
            trend={{ value: 12.5, direction: 'up' }}
          />
          <SimpleStatCard
            label="Loading..."
            value=""
            loading
          />
        </div>
      </div>

      {/* Compact inline */}
      <div className="space-y-4">
        <div className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wider">
          Compact / Mini (Inline)
        </div>
        <div className="flex flex-wrap gap-4">
          <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--color-bg-surface)] border border-[var(--color-border)]">
            <span className="text-sm text-[var(--color-text-muted)]">Users:</span>
            <span className="text-sm font-medium text-white">2,847</span>
            <span className="text-xs text-green-400">↑12%</span>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--color-bg-surface)] border border-[var(--color-border)]">
            <span className="text-sm text-[var(--color-text-muted)]">Revenue:</span>
            <span className="text-sm font-medium text-white">$48.2K</span>
            <span className="text-xs text-green-400">↑8%</span>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--color-bg-surface)] border border-[var(--color-border)]">
            <span className="text-sm text-[var(--color-text-muted)]">Bounce:</span>
            <span className="text-sm font-medium text-white">32.5%</span>
            <span className="text-xs text-red-400">↓3%</span>
          </div>
        </div>
      </div>
    </div>
  ),
};

// ============================================
// MASTER SHOWCASE
// ============================================

/**
 * MASTER SHOWCASE: All Data Display Components
 */
export const MasterShowcase: Story = {
  render: () => (
    <div className="space-y-16 max-w-4xl">
      <div className="text-lg font-medium text-white">
        Data Display Components - Complete Collection
      </div>

      {/* Aspect Ratio */}
      <section className="space-y-4">
        <h3 className="text-sm font-medium text-[var(--color-text-secondary)]">Aspect Ratio</h3>
        <div className="flex gap-4">
          <div className="w-32">
            <AspectRatio ratio={1}>
              <div className="w-full h-full bg-gradient-to-br from-[#FFD700]/20 to-[#FFD700]/5 rounded-lg flex items-center justify-center border border-[var(--color-border)]">
                <span className="text-xs text-[var(--color-text-muted)]">1:1</span>
              </div>
            </AspectRatio>
          </div>
          <div className="flex-1 max-w-xs">
            <AspectRatio ratio={16 / 9}>
              <div className="w-full h-full bg-gradient-to-br from-purple-500/20 to-purple-500/5 rounded-lg flex items-center justify-center border border-[var(--color-border)]">
                <span className="text-xs text-[var(--color-text-muted)]">16:9</span>
              </div>
            </AspectRatio>
          </div>
        </div>
      </section>

      {/* Data Table */}
      <section className="space-y-4">
        <h3 className="text-sm font-medium text-[var(--color-text-secondary)]">Data Table</h3>
        <div className="border border-[var(--color-border)] rounded-xl overflow-hidden">
          <SimpleDataTable
            columns={columns.slice(0, 4)}
            data={mockUsers.slice(0, 3)}
            getRowKey={(row) => row.id}
            variant="basic"
          />
        </div>
      </section>

      {/* Stat Cards */}
      <section className="space-y-4">
        <h3 className="text-sm font-medium text-[var(--color-text-secondary)]">Stat Cards</h3>
        <StatCardGrid columns={3}>
          <SimpleStatCard label="Users" value="32,847" trend={{ value: 12, direction: 'up' }} icon="👥" />
          <SimpleStatCard label="Revenue" value="$128.4K" trend={{ value: 8.3, direction: 'up' }} icon="💰" />
          <SimpleStatCard label="Conversion" value="3.24%" trend={{ value: 0.5, direction: 'up' }} icon="📈" />
        </StatCardGrid>
      </section>
    </div>
  ),
};
