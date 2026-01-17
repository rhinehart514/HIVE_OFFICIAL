import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { DataTable, DataTableSkeleton } from './DataTable';
import { Text, Badge } from '../primitives';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive' | 'pending';
  joined: string;
}

const mockUsers: User[] = [
  { id: '1', name: 'Jane Doe', email: 'jane@example.com', role: 'Admin', status: 'active', joined: '2024-01-15' },
  { id: '2', name: 'John Smith', email: 'john@example.com', role: 'Member', status: 'active', joined: '2024-02-20' },
  { id: '3', name: 'Alice Johnson', email: 'alice@example.com', role: 'Member', status: 'pending', joined: '2024-03-10' },
  { id: '4', name: 'Bob Wilson', email: 'bob@example.com', role: 'Moderator', status: 'active', joined: '2024-01-22' },
  { id: '5', name: 'Carol Martinez', email: 'carol@example.com', role: 'Member', status: 'inactive', joined: '2023-11-05' },
  { id: '6', name: 'Dave Brown', email: 'dave@example.com', role: 'Member', status: 'active', joined: '2024-04-01' },
  { id: '7', name: 'Eve Davis', email: 'eve@example.com', role: 'Admin', status: 'active', joined: '2023-09-15' },
  { id: '8', name: 'Frank Miller', email: 'frank@example.com', role: 'Member', status: 'pending', joined: '2024-04-20' },
];

const columns = [
  { key: 'name' as const, header: 'Name', sortable: true },
  { key: 'email' as const, header: 'Email', sortable: true },
  { key: 'role' as const, header: 'Role', sortable: true },
  {
    key: 'status' as const,
    header: 'Status',
    sortable: true,
    render: (value: unknown) => {
      const status = value as 'active' | 'inactive' | 'pending';
      const variant = status === 'active' ? 'success' : status === 'pending' ? 'gold' : 'neutral';
      return <Badge variant={variant} size="sm">{status}</Badge>;
    },
  },
  { key: 'joined' as const, header: 'Joined', sortable: true },
];

const meta: Meta<typeof DataTable> = {
  title: 'Design System/Components/Data/DataTable',
  component: DataTable,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Sortable, filterable data table for admin. Three variants: basic, sorting, full (with pagination).',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['basic', 'sorting', 'full'],
    },
    loading: {
      control: 'boolean',
    },
    selectable: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof DataTable<User>>;

/**
 * Default — Basic variant
 */
export const Default: Story = {
  render: () => (
    <DataTable
      columns={columns}
      data={mockUsers.slice(0, 5)}
      getRowKey={(row) => row.id}
      variant="basic"
    />
  ),
};

/**
 * Sorting variant
 */
export const Sorting: Story = {
  render: () => {
    const [sortColumn, setSortColumn] = useState<keyof User>('name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    const sortedData = [...mockUsers].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];
      const cmp = String(aVal).localeCompare(String(bVal));
      return sortDirection === 'asc' ? cmp : -cmp;
    });

    return (
      <DataTable
        columns={columns}
        data={sortedData}
        getRowKey={(row) => row.id}
        variant="sorting"
        sortColumn={sortColumn}
        sortDirection={sortDirection}
        onSort={(col, dir) => {
          setSortColumn(col as keyof User);
          setSortDirection(dir);
        }}
      />
    );
  },
};

/**
 * Full variant with pagination
 */
export const Full: Story = {
  render: () => {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [sortColumn, setSortColumn] = useState<keyof User>('name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [selectedKeys, setSelectedKeys] = useState<Set<string | number>>(new Set());
    const pageSize = 3;

    // Filter data
    const filteredData = mockUsers.filter(
      (user) =>
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase())
    );

    // Sort data
    const sortedData = [...filteredData].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];
      const cmp = String(aVal).localeCompare(String(bVal));
      return sortDirection === 'asc' ? cmp : -cmp;
    });

    // Paginate
    const paginatedData = sortedData.slice((page - 1) * pageSize, page * pageSize);

    return (
      <DataTable
        columns={columns}
        data={paginatedData}
        getRowKey={(row) => row.id}
        variant="full"
        sortColumn={sortColumn}
        sortDirection={sortDirection}
        onSort={(col, dir) => {
          setSortColumn(col as keyof User);
          setSortDirection(dir);
        }}
        selectable
        selectedKeys={selectedKeys}
        onSelectionChange={setSelectedKeys}
        searchValue={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        searchPlaceholder="Search users..."
        pagination={{
          page,
          pageSize,
          total: filteredData.length,
          onPageChange: setPage,
        }}
      />
    );
  },
};

/**
 * With row selection
 */
export const WithSelection: Story = {
  render: () => {
    const [selectedKeys, setSelectedKeys] = useState<Set<string | number>>(new Set(['1', '3']));

    return (
      <DataTable
        columns={columns}
        data={mockUsers.slice(0, 5)}
        getRowKey={(row) => row.id}
        variant="basic"
        selectable
        selectedKeys={selectedKeys}
        onSelectionChange={setSelectedKeys}
      />
    );
  },
};

/**
 * With row click
 */
export const WithRowClick: Story = {
  render: () => (
    <DataTable
      columns={columns}
      data={mockUsers.slice(0, 5)}
      getRowKey={(row) => row.id}
      variant="basic"
      onRowClick={(row) => alert(`Clicked: ${row.name}`)}
    />
  ),
};

/**
 * Loading state
 */
export const Loading: Story = {
  render: () => (
    <DataTable
      columns={columns}
      data={[]}
      getRowKey={(row) => row.id}
      variant="basic"
      loading
    />
  ),
};

/**
 * Empty state
 */
export const Empty: Story = {
  render: () => (
    <DataTable
      columns={columns}
      data={[]}
      getRowKey={(row) => row.id}
      variant="basic"
      emptyMessage="No users found matching your criteria."
    />
  ),
};

/**
 * Custom cell rendering
 */
export const CustomCells: Story = {
  render: () => {
    const customColumns = [
      {
        key: 'name' as const,
        header: 'User',
        render: (value: unknown, row: User) => (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[var(--color-bg-elevated)] flex items-center justify-center">
              <Text size="xs" weight="medium">
                {String(value).charAt(0)}
              </Text>
            </div>
            <div>
              <Text size="sm" weight="medium">
                {String(value)}
              </Text>
              <Text size="xs" tone="muted">
                {row.email}
              </Text>
            </div>
          </div>
        ),
      },
      { key: 'role' as const, header: 'Role' },
      {
        key: 'status' as const,
        header: 'Status',
        render: (value: unknown) => {
          const status = value as 'active' | 'inactive' | 'pending';
          const variant = status === 'active' ? 'success' : status === 'pending' ? 'gold' : 'neutral';
          return <Badge variant={variant} size="sm">{status}</Badge>;
        },
      },
      {
        key: 'actions' as const,
        header: '',
        width: '100px',
        align: 'right' as const,
        render: () => (
          <button className="text-xs text-[var(--color-text-muted)] hover:text-white">
            Edit
          </button>
        ),
      },
    ];

    return (
      <DataTable
        columns={customColumns}
        data={mockUsers.slice(0, 5)}
        getRowKey={(row) => row.id}
        variant="basic"
      />
    );
  },
};

/**
 * Skeleton loading
 */
export const Skeleton: Story = {
  render: () => <DataTableSkeleton columns={5} rows={5} />,
};

/**
 * All variants comparison
 */
export const AllVariants: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <Text size="xs" tone="muted" className="mb-3">
          Basic
        </Text>
        <DataTable
          columns={columns.slice(0, 3)}
          data={mockUsers.slice(0, 3)}
          getRowKey={(row) => row.id}
          variant="basic"
        />
      </div>

      <div>
        <Text size="xs" tone="muted" className="mb-3">
          Sorting (click headers)
        </Text>
        <DataTable
          columns={columns.slice(0, 3)}
          data={mockUsers.slice(0, 3)}
          getRowKey={(row) => row.id}
          variant="sorting"
          sortColumn="name"
          sortDirection="asc"
          onSort={() => {}}
        />
      </div>

      <div>
        <Text size="xs" tone="muted" className="mb-3">
          Full (search + pagination)
        </Text>
        <DataTable
          columns={columns.slice(0, 3)}
          data={mockUsers.slice(0, 3)}
          getRowKey={(row) => row.id}
          variant="full"
          searchValue=""
          onSearchChange={() => {}}
          pagination={{
            page: 1,
            pageSize: 3,
            total: 8,
            onPageChange: () => {},
          }}
        />
      </div>
    </div>
  ),
};
