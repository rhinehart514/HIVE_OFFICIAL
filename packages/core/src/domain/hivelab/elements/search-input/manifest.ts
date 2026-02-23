import type { ElementSpec } from '../../element-spec';

export const searchInputSpec: ElementSpec = {
  elementId: 'search-input',
  name: 'Search Input',
  category: 'input',
  dataSource: 'none',
  config: {
    placeholder: { type: 'string', description: 'Placeholder text', required: false },
    showSuggestions: { type: 'boolean', description: 'Show suggestions', default: false, required: false },
    debounceMs: { type: 'number', description: 'Debounce delay in ms', required: false },
  },
  connection: {
    minDepth: 'standalone',
    levels: [
      { depth: 'standalone', provides: 'Search input with optional suggestions', requiredContext: [] },
    ],
  },
  permissions: { create: 'anyone', interact: 'anyone' },
  executeActions: [],
  state: { shared: [], personal: ['selections'] },
};
