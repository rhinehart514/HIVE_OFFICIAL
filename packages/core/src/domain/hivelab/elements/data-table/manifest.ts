import type { ElementSpec } from '../../element-spec';

export const dataTableSpec: ElementSpec = {
  elementId: 'data-table',
  name: 'Data Table',
  category: 'action',
  dataSource: 'none',
  config: {
    title: { type: 'string', description: 'Table title', default: 'Data Table', required: false },
    columns: {
      type: 'object[]',
      description: 'Column definitions (name, type, sortable, filterable)',
      default: [
        { key: 'name', label: 'Name', type: 'text', sortable: true, filterable: true },
        { key: 'value', label: 'Value', type: 'text', sortable: true, filterable: false },
        { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'], sortable: true, filterable: true },
      ],
      required: true,
    },
    permissions: {
      type: 'string',
      description: 'Who can add/edit rows: anyone, authenticated, creator-only',
      default: 'authenticated',
      required: false,
    },
    allowExport: { type: 'boolean', description: 'Allow CSV export', default: true, required: false },
    pageSize: { type: 'number', description: 'Rows per page', default: 20, required: false },
    allowRowActions: { type: 'boolean', description: 'Show edit/delete actions per row', default: true, required: false },
  },
  connection: {
    minDepth: 'standalone',
    levels: [
      { depth: 'standalone', provides: 'Basic CRUD table with sort/filter', requiredContext: [] },
      { depth: 'space', provides: 'Member contributions tracked, role-based edit permissions', requiredContext: ['spaceId'] },
    ],
  },
  permissions: { create: 'anyone', interact: 'authenticated' },
  executeActions: ['add_row', 'edit_row', 'delete_row'],
  state: { shared: ['counters', 'collections'], personal: ['participation'] },
  aliases: ['data-table-element'],
};
