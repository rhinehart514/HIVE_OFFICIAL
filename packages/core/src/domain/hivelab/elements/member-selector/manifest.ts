import type { ElementSpec } from '../../element-spec';

export const memberSelectorSpec: ElementSpec = {
  elementId: 'member-selector',
  name: 'Member Selector',
  category: 'input',
  dataSource: 'space-members',
  config: {
    allowMultiple: { type: 'boolean', description: 'Allow multiple selection', default: false, required: false },
    filterByRole: { type: 'string', description: 'Filter by role', required: false },
    showAvatars: { type: 'boolean', description: 'Show avatars', default: true, required: false },
  },
  connection: {
    minDepth: 'space',
    levels: [
      { depth: 'space', provides: 'Select from space members', requiredContext: ['spaceId'] },
    ],
  },
  permissions: { create: 'space-member', interact: 'space-member' },
  executeActions: [],
  state: { shared: [], personal: ['selections'] },
};
