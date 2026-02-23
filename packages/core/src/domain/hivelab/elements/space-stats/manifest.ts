import type { ElementSpec } from '../../element-spec';

export const spaceStatsSpec: ElementSpec = {
  elementId: 'space-stats',
  name: 'Space Stats',
  category: 'display',
  dataSource: 'space-stats',
  config: {
    metrics: { type: 'string[]', description: 'Metrics to show', required: false },
    showTrends: { type: 'boolean', description: 'Show trends', default: true, required: false },
  },
  connection: {
    minDepth: 'space',
    levels: [
      { depth: 'space', provides: 'Space analytics and growth metrics', requiredContext: ['spaceId'] },
    ],
  },
  permissions: { create: 'space-leader', interact: 'space-member' },
  executeActions: [],
  state: { shared: [], personal: [] },
};
