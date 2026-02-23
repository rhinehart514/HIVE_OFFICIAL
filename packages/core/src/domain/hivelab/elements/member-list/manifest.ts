import type { ElementSpec } from '../../element-spec';

export const memberListSpec: ElementSpec = {
  elementId: 'member-list',
  name: 'Member List',
  category: 'display',
  dataSource: 'space-members',
  config: {
    maxMembers: { type: 'number', description: 'Max members shown', required: false },
    showRole: { type: 'boolean', description: 'Show member role', default: true, required: false },
    showJoinDate: { type: 'boolean', description: 'Show join date', default: false, required: false },
  },
  connection: {
    minDepth: 'space',
    levels: [
      { depth: 'space', provides: 'Display space member list with roles', requiredContext: ['spaceId'] },
    ],
  },
  permissions: { create: 'space-member', interact: 'space-member' },
  executeActions: [],
  state: { shared: [], personal: [] },
};
