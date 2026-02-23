import type { ElementSpec } from '../../element-spec';

export const tagCloudSpec: ElementSpec = {
  elementId: 'tag-cloud',
  name: 'Tag Cloud',
  category: 'display',
  dataSource: 'none',
  config: {
    maxTags: { type: 'number', description: 'Max tags to display', required: false },
    sortBy: { type: 'string', description: 'Sort by frequency or alphabetical', required: false },
    showCounts: { type: 'boolean', description: 'Show counts', default: false, required: false },
  },
  connection: {
    minDepth: 'standalone',
    levels: [
      { depth: 'standalone', provides: 'Static tag cloud display', requiredContext: [] },
    ],
  },
  permissions: { create: 'anyone', interact: 'anyone' },
  executeActions: [],
  state: { shared: [], personal: [] },
};
