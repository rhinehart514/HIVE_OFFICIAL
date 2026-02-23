import type { ElementSpec } from '../../element-spec';

export const chartDisplaySpec: ElementSpec = {
  elementId: 'chart-display',
  name: 'Chart Display',
  category: 'display',
  dataSource: 'none',
  config: {
    chartType: { type: 'string', description: '"bar", "line", or "pie"', default: 'bar', required: true },
    title: { type: 'string', description: 'Chart title', required: false },
    data: { type: 'object[]', description: 'Chart data array', required: false },
    height: { type: 'number', description: 'Chart height in px', required: false },
    showLegend: { type: 'boolean', description: 'Show legend', default: true, required: false },
    dataKey: { type: 'string', description: 'Primary data key', required: false },
    secondaryKey: { type: 'string', description: 'Secondary data key', required: false },
  },
  connection: {
    minDepth: 'standalone',
    levels: [
      { depth: 'standalone', provides: 'Static or connected chart display', requiredContext: [] },
    ],
  },
  permissions: { create: 'anyone', interact: 'anyone' },
  executeActions: [],
  state: { shared: [], personal: [] },
};
