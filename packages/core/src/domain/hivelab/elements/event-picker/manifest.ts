import type { ElementSpec } from '../../element-spec';

export const eventPickerSpec: ElementSpec = {
  elementId: 'event-picker',
  name: 'Event Picker',
  category: 'input',
  dataSource: 'campus-events',
  config: {
    showPastEvents: { type: 'boolean', description: 'Show past events', default: false, required: false },
    filterByCategory: { type: 'string', description: 'Filter by event category', required: false },
    maxEvents: { type: 'number', description: 'Max events shown', required: false },
  },
  connection: {
    minDepth: 'campus',
    levels: [
      { depth: 'campus', provides: 'Browse and select from campus events', requiredContext: ['campusId'] },
    ],
  },
  permissions: { create: 'anyone', interact: 'authenticated' },
  executeActions: [],
  state: { shared: [], personal: ['selections'] },
};
