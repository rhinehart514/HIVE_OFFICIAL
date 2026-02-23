import type { ElementSpec } from '../../element-spec';

export const roleGateSpec: ElementSpec = {
  elementId: 'role-gate',
  name: 'Role Gate',
  category: 'layout',
  dataSource: 'space-members',
  config: {
    allowedRoles: { type: 'string[]', description: 'Roles allowed to see gated content', required: true },
    fallbackMessage: { type: 'string', description: 'Message shown to non-authorized members', required: false },
  },
  connection: {
    minDepth: 'space',
    levels: [
      { depth: 'space', provides: 'Role-based content gating within space', requiredContext: ['spaceId'] },
    ],
  },
  permissions: { create: 'space-leader', interact: 'space-member' },
  executeActions: [],
  state: { shared: [], personal: [] },
};
