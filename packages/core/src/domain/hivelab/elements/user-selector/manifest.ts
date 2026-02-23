import type { ElementSpec } from '../../element-spec';

export const userSelectorSpec: ElementSpec = {
  elementId: 'user-selector',
  name: 'User Selector',
  category: 'input',
  dataSource: 'campus-users',
  config: {
    allowMultiple: { type: 'boolean', description: 'Allow multiple selection', default: false, required: false },
    showAvatars: { type: 'boolean', description: 'Show user avatars', default: true, required: false },
  },
  connection: {
    minDepth: 'campus',
    levels: [
      { depth: 'campus', provides: 'Search and select campus users', requiredContext: ['campusId'] },
    ],
  },
  permissions: { create: 'anyone', interact: 'authenticated' },
  executeActions: [],
  state: { shared: [], personal: ['selections'] },
};
