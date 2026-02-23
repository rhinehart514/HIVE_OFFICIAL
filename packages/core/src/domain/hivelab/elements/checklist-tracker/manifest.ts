import type { ElementSpec } from '../../element-spec';

export const checklistTrackerSpec: ElementSpec = {
  elementId: 'checklist-tracker',
  name: 'Checklist Tracker',
  category: 'action',
  dataSource: 'none',
  config: {
    items: { type: 'string[]|string', description: 'Checklist items — array of strings or objects with {text, completed}', default: ['Item 1', 'Item 2', 'Item 3'], required: true },
    title: { type: 'string', description: 'Checklist title', default: 'Checklist', required: false },
    allowMemberAdd: { type: 'boolean', description: 'Allow members to add items', default: false, required: false },
  },
  connection: {
    minDepth: 'standalone',
    levels: [
      { depth: 'standalone', provides: 'Basic checklist with per-user completion', requiredContext: [] },
      { depth: 'space', provides: 'Shared progress visible to all members', requiredContext: ['spaceId'] },
    ],
  },
  permissions: { create: 'anyone', interact: 'anyone' },
  executeActions: ['toggle_complete', 'add_item', 'remove_item'],
  state: { shared: ['collections'], personal: ['participation'] },
};
