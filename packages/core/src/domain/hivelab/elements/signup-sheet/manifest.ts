import type { ElementSpec } from '../../element-spec';

export const signupSheetSpec: ElementSpec = {
  elementId: 'signup-sheet',
  name: 'Signup Sheet',
  category: 'action',
  dataSource: 'none',
  config: {
    slots: { type: 'object[]', description: 'Array of {label, maxSignups} slot objects', default: [{ label: 'Slot 1', maxSignups: 5 }, { label: 'Slot 2', maxSignups: 5 }, { label: 'Slot 3', maxSignups: 5 }], required: true },
    title: { type: 'string', description: 'Sheet title', default: 'Sign Up Sheet', required: false },
    allowMultipleSignups: { type: 'boolean', description: 'Allow signing up for multiple slots', default: false, required: false },
  },
  connection: {
    minDepth: 'standalone',
    levels: [
      { depth: 'standalone', provides: 'Basic signup with slot management', requiredContext: [] },
      { depth: 'space', provides: 'Member names auto-filled, member-only signups', requiredContext: ['spaceId'] },
    ],
  },
  permissions: { create: 'anyone', interact: 'anyone' },
  executeActions: ['signup', 'cancel'],
  state: { shared: ['collections'], personal: ['participation'] },
};
