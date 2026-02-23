import type { ElementSpec } from '../../element-spec';

export const filterSelectorSpec: ElementSpec = {
  elementId: 'filter-selector',
  name: 'Filter Selector',
  category: 'filter',
  dataSource: 'none',
  config: {
    options: { type: 'string[]', description: 'Filter options', required: false },
    allowMultiple: { type: 'boolean', description: 'Allow multiple selection', default: true, required: false },
    showCounts: { type: 'boolean', description: 'Show counts per option', default: false, required: false },
  },
  connection: {
    minDepth: 'standalone',
    levels: [
      { depth: 'standalone', provides: 'Filter selection input', requiredContext: [] },
    ],
  },
  permissions: { create: 'anyone', interact: 'anyone' },
  executeActions: [],
  state: { shared: [], personal: ['selections'] },
};
