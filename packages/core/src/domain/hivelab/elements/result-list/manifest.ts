import type { ElementSpec } from '../../element-spec';

export const resultListSpec: ElementSpec = {
  elementId: 'result-list',
  name: 'Result List',
  category: 'display',
  dataSource: 'none',
  config: {
    itemsPerPage: { type: 'number', description: 'Items per page', required: false },
    showPagination: { type: 'boolean', description: 'Show pagination', default: true, required: false },
    cardStyle: { type: 'string', description: 'Card style', required: false },
  },
  connection: {
    minDepth: 'standalone',
    levels: [
      { depth: 'standalone', provides: 'Paginated result list', requiredContext: [] },
    ],
  },
  permissions: { create: 'anyone', interact: 'anyone' },
  executeActions: [],
  state: { shared: [], personal: [] },
};
