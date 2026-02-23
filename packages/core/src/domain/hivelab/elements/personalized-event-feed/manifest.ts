import type { ElementSpec } from '../../element-spec';

export const personalizedEventFeedSpec: ElementSpec = {
  elementId: 'personalized-event-feed',
  name: 'Personalized Event Feed',
  category: 'display',
  dataSource: 'campus-events',
  config: {
    timeRange: { type: 'string', description: 'Time range filter', required: false },
    maxItems: { type: 'number', description: 'Max events shown', required: false },
    showFriendCount: { type: 'boolean', description: 'Show friend attendance', default: true, required: false },
    showMatchReasons: { type: 'boolean', description: 'Show why event matches', default: true, required: false },
    title: { type: 'string', description: 'Feed title', required: false },
  },
  connection: {
    minDepth: 'campus',
    levels: [
      { depth: 'campus', provides: 'Personalized campus events ranked by relevance', requiredContext: ['campusId', 'userId'] },
    ],
  },
  permissions: { create: 'anyone', interact: 'authenticated' },
  executeActions: [],
  state: { shared: [], personal: [] },
};
