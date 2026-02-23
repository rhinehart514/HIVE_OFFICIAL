import type { ElementSpec } from '../../element-spec';

export const spaceEventsSpec: ElementSpec = {
  elementId: 'space-events',
  name: 'Space Events',
  category: 'display',
  dataSource: 'space-events',
  config: {
    showPast: { type: 'boolean', description: 'Show past events', default: false, required: false },
    maxEvents: { type: 'number', description: 'Max events shown', required: false },
    showRsvpCount: { type: 'boolean', description: 'Show RSVP counts', default: true, required: false },
  },
  connection: {
    minDepth: 'space',
    levels: [
      { depth: 'space', provides: 'Display events for this space', requiredContext: ['spaceId'] },
    ],
  },
  permissions: { create: 'space-member', interact: 'space-member' },
  executeActions: [],
  state: { shared: [], personal: [] },
};
