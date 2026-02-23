import type { ElementSpec } from '../../element-spec';

export const spaceFeedSpec: ElementSpec = {
  elementId: 'space-feed',
  name: 'Space Feed',
  category: 'display',
  dataSource: 'space-feed',
  config: {
    maxPosts: { type: 'number', description: 'Max posts shown', required: false },
    showEngagement: { type: 'boolean', description: 'Show engagement', default: true, required: false },
  },
  connection: {
    minDepth: 'space',
    levels: [
      { depth: 'space', provides: 'Display space activity feed', requiredContext: ['spaceId'] },
    ],
  },
  permissions: { create: 'space-member', interact: 'space-member' },
  executeActions: [],
  state: { shared: [], personal: [] },
};
