import type { ElementSpec } from '../../element-spec';

export const directoryListSpec: ElementSpec = {
  elementId: 'directory-list',
  name: 'Directory List',
  category: 'display',
  dataSource: 'none',
  config: {
    title: { type: 'string', description: 'Directory title', required: false },
    fields: { type: 'string[]', description: 'Fields to display', required: false },
    entries: { type: 'object[]', description: 'Directory entries', required: false },
    useSpaceMembers: { type: 'boolean', description: 'Pull from space members', default: false, required: false },
  },
  connection: {
    minDepth: 'standalone',
    levels: [
      { depth: 'standalone', provides: 'Static directory display', requiredContext: [] },
    ],
  },
  permissions: { create: 'anyone', interact: 'anyone' },
  executeActions: [],
  state: { shared: [], personal: [] },
};
