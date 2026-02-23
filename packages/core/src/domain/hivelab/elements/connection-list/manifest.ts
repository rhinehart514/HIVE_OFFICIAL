import type { ElementSpec } from '../../element-spec';

export const connectionListSpec: ElementSpec = {
  elementId: 'connection-list',
  name: 'Connection List',
  category: 'display',
  dataSource: 'user-connections',
  config: {
    maxConnections: { type: 'number', description: 'Max connections shown', required: false },
    showMutual: { type: 'boolean', description: 'Show mutual connections', default: false, required: false },
  },
  connection: {
    minDepth: 'standalone',
    levels: [
      { depth: 'standalone', provides: 'Display user connections list', requiredContext: [] },
      { depth: 'space', provides: 'Filter to mutual connections within space', requiredContext: ['spaceId'] },
    ],
  },
  permissions: { create: 'anyone', interact: 'authenticated' },
  executeActions: [],
  state: { shared: [], personal: [] },
};
