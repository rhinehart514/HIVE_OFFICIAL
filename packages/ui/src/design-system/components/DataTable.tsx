'use client';

/**
 * DataTable Component
 * Source: docs/design-system/COMPONENTS.md
 *
 * P2 Blocker - Sortable, filterable data table for admin.
 * Three variants: basic, sorting, full (with pagination).
 */

import * as React from 'react';
import { cn } from '../../lib/utils';
import { Text, Button, Input } from '../primitives';

export interface DataTableColumn<T> {
  /** Unique key for the column */
  key: keyof T | string;
  /** Display header */
  header: string;
  /** Whether column is sortable */
  sortable?: boolean;
  /** Custom cell renderer */
  render?: (value: unknown, row: T, index: number) => React.ReactNode;
  /** Width (e.g., '150px', '20%') */
  width?: string;
  /** Alignment */
  align?: 'left' | 'center' | 'right';
}

export interface DataTableProps<T> {
  /** Column definitions */
  columns: DataTableColumn<T>[];
  /** Row data */
  data: T[];
  /** Unique key extractor for rows */
  getRowKey: (row: T, index: number) => string | number;
  /** Variant type */
  variant?: 'basic' | 'sorting' | 'full';
  /** Current sort column */
  sortColumn?: keyof T | string;
  /** Sort direction */
  sortDirection?: 'asc' | 'desc';
  /** Sort change handler */
  onSort?: (column: keyof T | string, direction: 'asc' | 'desc') => void;
  /** Row click handler */
  onRowClick?: (row: T, index: number) => void;
  /** Selected row keys */
  selectedKeys?: Set<string | number>;
  /** Selection change handler */
  onSelectionChange?: (keys: Set<string | number>) => void;
  /** Enable row selection */
  selectable?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Empty state message */
  emptyMessage?: string;
  /** Pagination config (for full variant) */
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
  };
  /** Search/filter value (for full variant) */
  searchValue?: string;
  /** Search change handler */
  onSearchChange?: (value: string) => void;
  /** Search placeholder */
  searchPlaceholder?: string;
  /** Additional className */
  className?: string;
}

/**
 * Sort icon component
 */
const SortIcon: React.FC<{ direction?: 'asc' | 'desc' | null }> = ({ direction }) => (
  <svg
    className={cn(
      'w-4 h-4 ml-1 inline-block transition-transform',
      direction === 'desc' && 'rotate-180',
      !direction && 'opacity-30'
    )}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12l4-4 4 4" />
  </svg>
);

/**
 * DataTable - Main component
 */
function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  getRowKey,
  variant = 'basic',
  sortColumn,
  sortDirection,
  onSort,
  onRowClick,
  selectedKeys,
  onSelectionChange,
  selectable = false,
  loading = false,
  emptyMessage = 'No data available',
  pagination,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search...',
  className,
}: DataTableProps<T>) {
  // Handle sort click
  const handleSortClick = (column: DataTableColumn<T>) => {
    if (!column.sortable || !onSort) return;

    const newDirection =
      sortColumn === column.key && sortDirection === 'asc' ? 'desc' : 'asc';
    onSort(column.key, newDirection);
  };

  // Handle row selection
  const handleRowSelect = (key: string | number) => {
    if (!onSelectionChange || !selectedKeys) return;

    const newKeys = new Set(selectedKeys);
    if (newKeys.has(key)) {
      newKeys.delete(key);
    } else {
      newKeys.add(key);
    }
    onSelectionChange(newKeys);
  };

  // Handle select all
  const handleSelectAll = () => {
    if (!onSelectionChange) return;

    const allKeys = data.map((row, i) => getRowKey(row, i));
    const allSelected = allKeys.every((key) => selectedKeys?.has(key));

    if (allSelected) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(allKeys));
    }
  };

  // Get cell value
  const getCellValue = (row: T, column: DataTableColumn<T>, index: number) => {
    const value = column.key in row ? row[column.key as keyof T] : undefined;

    if (column.render) {
      return column.render(value, row, index);
    }

    if (value === null || value === undefined) {
      return <Text tone="muted">—</Text>;
    }

    return String(value);
  };

  // Calculate pagination
  const totalPages = pagination ? Math.ceil(pagination.total / pagination.pageSize) : 1;

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Search bar (for full variant) */}
      {variant === 'full' && onSearchChange && (
        <div className="flex items-center justify-between">
          <div className="w-64">
            <Input
              type="search"
              value={searchValue || ''}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-9"
            />
          </div>
          {selectedKeys && selectedKeys.size > 0 && (
            <Text size="sm" tone="muted">
              {selectedKeys.size} selected
            </Text>
          )}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-[var(--color-border)]">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-[var(--color-bg-elevated)]">
              {/* Selection checkbox */}
              {selectable && (
                <th className="w-10 px-3 py-3 border-b border-[var(--color-border)]">
                  <input
                    type="checkbox"
                    checked={
                      data.length > 0 &&
                      data.every((row, i) => selectedKeys?.has(getRowKey(row, i)))
                    }
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-[var(--color-border)]"
                  />
                </th>
              )}

              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className={cn(
                    'px-4 py-3 border-b border-[var(--color-border)]',
                    'text-left font-medium',
                    column.sortable && variant !== 'basic' && 'cursor-pointer select-none hover:bg-[var(--color-bg-hover)]',
                    column.align === 'center' && 'text-center',
                    column.align === 'right' && 'text-right'
                  )}
                  style={{ width: column.width }}
                  onClick={() =>
                    column.sortable && variant !== 'basic' && handleSortClick(column)
                  }
                >
                  <Text size="sm" tone="muted" weight="medium" className="inline-flex items-center">
                    {column.header}
                    {column.sortable && variant !== 'basic' && (
                      <SortIcon
                        direction={sortColumn === column.key ? sortDirection : null}
                      />
                    )}
                  </Text>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              // Loading state
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="px-4 py-12 text-center"
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-6 w-6 border-2 border-[var(--color-border)] border-t-white rounded-full animate-spin" />
                    <Text size="sm" tone="muted">
                      Loading...
                    </Text>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              // Empty state
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="px-4 py-12 text-center"
                >
                  <Text tone="muted">{emptyMessage}</Text>
                </td>
              </tr>
            ) : (
              // Data rows
              data.map((row, index) => {
                const rowKey = getRowKey(row, index);
                const isSelected = selectedKeys?.has(rowKey);

                return (
                  <tr
                    key={rowKey}
                    className={cn(
                      'transition-colors duration-[var(--duration-snap)]',
                      'hover:bg-[var(--color-bg-hover)]',
                      onRowClick && 'cursor-pointer',
                      isSelected && 'bg-[var(--color-accent-gold)]/5'
                    )}
                    onClick={() => onRowClick?.(row, index)}
                  >
                    {/* Selection checkbox */}
                    {selectable && (
                      <td
                        className="w-10 px-3 py-3 border-b border-[var(--color-border)]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleRowSelect(rowKey)}
                          className="w-4 h-4 rounded border-[var(--color-border)]"
                        />
                      </td>
                    )}

                    {columns.map((column) => (
                      <td
                        key={String(column.key)}
                        className={cn(
                          'px-4 py-3 border-b border-[var(--color-border)]',
                          column.align === 'center' && 'text-center',
                          column.align === 'right' && 'text-right'
                        )}
                      >
                        <Text size="sm">{getCellValue(row, column, index)}</Text>
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination (for full variant) */}
      {variant === 'full' && pagination && totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <Text size="sm" tone="muted">
            Showing {(pagination.page - 1) * pagination.pageSize + 1} to{' '}
            {Math.min(pagination.page * pagination.pageSize, pagination.total)} of{' '}
            {pagination.total}
          </Text>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
            >
              Previous
            </Button>
            <Text size="sm" className="px-2">
              Page {pagination.page} of {totalPages}
            </Text>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page >= totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

DataTable.displayName = 'DataTable';

/**
 * DataTableSkeleton - Loading placeholder
 */
const DataTableSkeleton: React.FC<{
  columns?: number;
  rows?: number;
  className?: string;
}> = ({ columns = 4, rows = 5, className }) => (
  <div className={cn('rounded-lg border border-[var(--color-border)] overflow-hidden', className)}>
    {/* Header */}
    <div className="flex bg-[var(--color-bg-elevated)] border-b border-[var(--color-border)]">
      {Array.from({ length: columns }).map((_, i) => (
        <div key={i} className="flex-1 px-4 py-3">
          <div className="h-4 w-24 bg-[var(--color-bg-page)] rounded animate-pulse" />
        </div>
      ))}
    </div>

    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div
        key={rowIndex}
        className="flex border-b border-[var(--color-border)] last:border-b-0"
      >
        {Array.from({ length: columns }).map((_, colIndex) => (
          <div key={colIndex} className="flex-1 px-4 py-3">
            <div
              className="h-4 bg-[var(--color-bg-elevated)] rounded animate-pulse"
              style={{ width: `${50 + Math.random() * 40}%` }}
            />
          </div>
        ))}
      </div>
    ))}
  </div>
);

DataTableSkeleton.displayName = 'DataTableSkeleton';

export { DataTable, DataTableSkeleton };
