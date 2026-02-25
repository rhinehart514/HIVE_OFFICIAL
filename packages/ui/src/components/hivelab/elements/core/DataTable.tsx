'use client';

/**
 * DataTable Element
 *
 * Sortable, filterable data table with CRUD operations.
 * Config: columns, pageSize, allowRowActions, title
 * Actions: add_row, edit_row, delete_row
 * State: collections.rows, counters.rowCount
 */

import * as React from 'react';
import { useState, useCallback, useMemo } from 'react';
import {
  TableCellsIcon,
  PlusIcon,
  XMarkIcon,
  PencilSquareIcon,
  TrashIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { springPresets } from '@hive/tokens';

import { Button } from '../../../../design-system/primitives';
import { Card, CardContent } from '../../../../design-system/primitives';
import { AnimatedNumber, numberSpringPresets } from '../../../motion-primitives/animated-number';

import type { ElementProps } from '../../../../lib/hivelab/element-system';
import { StateContainer, type ElementMode } from '../core';

// ============================================================
// Types
// ============================================================

interface ColumnConfig {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'email' | 'select';
  sortable?: boolean;
  filterable?: boolean;
  options?: string[];
  width?: string;
}

interface RowEntry {
  id: string;
  createdAt: string;
  createdBy: string;
  data: Record<string, unknown>;
}

interface DataTableConfig {
  title?: string;
  columns?: ColumnConfig[];
  pageSize?: number;
  allowRowActions?: boolean;
}

interface DataTableElementProps extends ElementProps {
  config: DataTableConfig;
  mode?: ElementMode;
}

// ============================================================
// DataTable Element
// ============================================================

export function DataTableElement({
  id,
  config,
  onAction,
  sharedState,
  userState,
  context,
  mode = 'runtime',
}: DataTableElementProps) {
  const prefersReducedMotion = useReducedMotion();
  const instanceId = id || 'data-table';

  const [showForm, setShowForm] = useState(false);
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(0);

  const title = config.title || 'Data Table';
  const columns: ColumnConfig[] = config.columns || [
    { key: 'name', label: 'Name', type: 'text', sortable: true, filterable: true },
    { key: 'email', label: 'Email', type: 'email', sortable: true, filterable: true },
    { key: 'status', label: 'Status', type: 'text', sortable: true },
  ];
  const pageSize = config.pageSize || 10;
  const allowRowActions = config.allowRowActions !== false;

  const rowsKey = `${instanceId}:rows`;
  const rowsMap = (sharedState?.collections?.[rowsKey] || {}) as Record<string, RowEntry>;
  const allRows = Object.values(rowsMap);

  const rowCount = sharedState?.counters?.[`${instanceId}:rowCount`] ?? allRows.length;
  const currentUserId = context?.userId || userState?.userId as string || '';

  const processedRows = useMemo(() => {
    let result = [...allRows];

    // Apply filters
    for (const [key, value] of Object.entries(filters)) {
      if (value.trim()) {
        result = result.filter(row => {
          const cellValue = String(row.data?.[key] ?? '').toLowerCase();
          return cellValue.includes(value.toLowerCase());
        });
      }
    }

    // Apply sorting
    if (sortKey) {
      result.sort((a, b) => {
        const aVal = String(a.data?.[sortKey] ?? '');
        const bVal = String(b.data?.[sortKey] ?? '');
        const cmp = aVal.localeCompare(bVal, undefined, { numeric: true });
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }

    return result;
  }, [allRows, filters, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(processedRows.length / pageSize));
  const pagedRows = processedRows.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const handleAddRow = useCallback(() => {
    onAction?.('add_row', { data: formData });
    setFormData({});
    setShowForm(false);
  }, [formData, onAction]);

  const handleEditRow = useCallback(() => {
    if (!editingRowId) return;
    onAction?.('edit_row', { rowId: editingRowId, data: formData });
    setFormData({});
    setEditingRowId(null);
    setShowForm(false);
  }, [editingRowId, formData, onAction]);

  const handleDeleteRow = useCallback((rowId: string) => {
    onAction?.('delete_row', { rowId });
  }, [onAction]);

  const startEdit = (row: RowEntry) => {
    setEditingRowId(row.id);
    const data: Record<string, string> = {};
    for (const col of columns) {
      data[col.key] = String(row.data?.[col.key] ?? '');
    }
    setFormData(data);
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingRowId(null);
    setFormData({});
  };

  const hasFilterable = columns.some(c => c.filterable);

  return (
    <StateContainer status="success">
      <Card className="overflow-hidden">
        <CardContent className="p-6 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TableCellsIcon className="h-5 w-5 text-primary" />
              <span className="font-semibold">{title}</span>
              <span className="text-xs text-muted-foreground tabular-nums ml-1">
                <AnimatedNumber value={rowCount} springOptions={numberSpringPresets.quick} /> rows
              </span>
            </div>
            <Button
              onClick={() => {
                if (showForm) {
                  cancelForm();
                } else {
                  setEditingRowId(null);
                  setFormData({});
                  setShowForm(true);
                }
              }}
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs"
            >
              {showForm ? (
                <>
                  <XMarkIcon className="h-3.5 w-3.5 mr-1" />
                  Cancel
                </>
              ) : (
                <>
                  <PlusIcon className="h-3.5 w-3.5 mr-1" />
                  Add Row
                </>
              )}
            </Button>
          </div>

          {/* Add/Edit Form */}
          <AnimatePresence>
            {showForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={prefersReducedMotion ? { duration: 0 } : springPresets.snappy}
                className="border rounded-lg p-4 space-y-3 bg-muted/20"
              >
                <div className="text-xs font-medium text-muted-foreground">
                  {editingRowId ? 'Edit Row' : 'New Row'}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {columns.map((col) => (
                    <div key={col.key}>
                      <label className="text-xs text-muted-foreground mb-0.5 block">{col.label}</label>
                      {col.type === 'select' && col.options ? (
                        <select
                          value={formData[col.key] || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, [col.key]: e.target.value }))}
                          className="w-full px-3 py-1.5 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                        >
                          <option value="">Select...</option>
                          {col.options.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={col.type === 'number' ? 'number' : col.type === 'email' ? 'email' : col.type === 'date' ? 'date' : 'text'}
                          value={formData[col.key] || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, [col.key]: e.target.value }))}
                          className="w-full px-3 py-1.5 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                      )}
                    </div>
                  ))}
                </div>
                <Button
                  onClick={editingRowId ? handleEditRow : handleAddRow}
                  size="sm"
                  className="w-full"
                >
                  {editingRowId ? 'Save Changes' : 'Add Row'}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Table */}
          {processedRows.length === 0 && !showForm ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No data yet. Add the first entry.
            </div>
          ) : (
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    {columns.map((col) => (
                      <th
                        key={col.key}
                        className={`text-left px-2 py-2 text-xs font-medium text-muted-foreground ${
                          col.sortable ? 'cursor-pointer select-none hover:text-foreground' : ''
                        }`}
                        style={col.width ? { width: col.width } : undefined}
                        onClick={() => col.sortable && handleSort(col.key)}
                      >
                        <div className="flex items-center gap-1">
                          {col.label}
                          {col.sortable && sortKey === col.key && (
                            sortDir === 'asc'
                              ? <ChevronUpIcon className="h-3 w-3" />
                              : <ChevronDownIcon className="h-3 w-3" />
                          )}
                        </div>
                      </th>
                    ))}
                    {allowRowActions && (
                      <th className="text-right px-2 py-2 text-xs font-medium text-muted-foreground w-20">
                        Actions
                      </th>
                    )}
                  </tr>

                  {/* Filter Row */}
                  {hasFilterable && (
                    <tr className="border-b">
                      {columns.map((col) => (
                        <th key={col.key} className="px-2 py-1">
                          {col.filterable ? (
                            <input
                              type="text"
                              placeholder="Filter..."
                              value={filters[col.key] || ''}
                              onChange={(e) => {
                                setFilters(prev => ({ ...prev, [col.key]: e.target.value }));
                                setCurrentPage(0);
                              }}
                              className="w-full px-2 py-1 text-xs border rounded bg-background focus:outline-none focus:ring-1 focus:ring-primary/30"
                            />
                          ) : null}
                        </th>
                      ))}
                      {allowRowActions && <th />}
                    </tr>
                  )}
                </thead>
                <tbody>
                  <AnimatePresence>
                    {pagedRows.map((row) => {
                      const isOwner = row.createdBy === currentUserId;
                      return (
                        <motion.tr
                          key={row.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className={`border-b last:border-0 ${isOwner ? 'bg-primary/5' : ''}`}
                        >
                          {columns.map((col) => (
                            <td key={col.key} className="px-2 py-2 text-xs">
                              {String(row.data?.[col.key] ?? '')}
                            </td>
                          ))}
                          {allowRowActions && (
                            <td className="px-2 py-2 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => startEdit(row)}
                                  className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                                  aria-label="Edit row"
                                >
                                  <PencilSquareIcon className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteRow(row.id)}
                                  className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                                  aria-label="Delete row"
                                >
                                  <TrashIcon className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          )}
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Page {currentPage + 1} of {totalPages}
              </span>
              <div className="flex gap-1">
                <Button
                  onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                >
                  Previous
                </Button>
                <Button
                  onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={currentPage >= totalPages - 1}
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </StateContainer>
  );
}

export default DataTableElement;
