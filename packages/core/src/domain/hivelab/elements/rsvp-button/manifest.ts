import type { ElementSpec } from '../../element-spec';

export const rsvpButtonSpec: ElementSpec = {
  elementId: 'rsvp-button',
  name: 'RSVP Button',
  category: 'action',
  dataSource: 'campus-events',
  config: {
    eventName: { type: 'string', description: 'Name of the event', default: 'Event', required: true, resolvedFrom: 'eventName' },
    maxAttendees: { type: 'number', description: 'Max capacity', default: 100, required: false },
    showCount: { type: 'boolean', description: 'Show attendee count', default: true, required: false },
    requireConfirmation: { type: 'boolean', description: 'Require confirmation', default: false, required: false },
    allowWaitlist: { type: 'boolean', description: 'Allow waitlist', default: true, required: false },
    closeAt: { type: 'string', description: 'ISO date to close RSVPs', required: false, resolvedFrom: 'closeAt' },
  },
  connection: {
    minDepth: 'standalone',
    levels: [
      { depth: 'standalone', provides: 'Basic RSVP with manual event name', requiredContext: [] },
      { depth: 'space', provides: 'Member-only RSVPs, attendee list from space members', requiredContext: ['spaceId'] },
      { depth: 'event+space', provides: 'Auto-resolved event name and close date, linked to campus event', requiredContext: ['spaceId', 'eventId'] },
    ],
  },
  permissions: { create: 'anyone', interact: 'anyone' },
  executeActions: ['rsvp', 'cancel'],
  state: { shared: ['counters', 'collections'], personal: ['participation'] },
};
