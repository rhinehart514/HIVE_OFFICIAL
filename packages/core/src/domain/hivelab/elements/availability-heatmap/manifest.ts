import type { ElementSpec } from '../../element-spec';

export const availabilityHeatmapSpec: ElementSpec = {
  elementId: 'availability-heatmap',
  name: 'Availability Heatmap',
  category: 'display',
  dataSource: 'none',
  config: {
    startHour: { type: 'number', description: 'Start hour (0-23)', default: 8, required: false },
    endHour: { type: 'number', description: 'End hour (0-23)', default: 22, required: false },
    timeFormat: { type: 'string', description: '"12h" or "24h"', default: '12h', required: false },
    highlightThreshold: { type: 'number', description: 'Highlight threshold', default: 3, required: false },
  },
  connection: {
    minDepth: 'standalone',
    levels: [
      { depth: 'standalone', provides: 'Availability heatmap display', requiredContext: [] },
    ],
  },
  permissions: { create: 'anyone', interact: 'anyone' },
  executeActions: [],
  state: { shared: ['collections'], personal: ['selections'] },
};
