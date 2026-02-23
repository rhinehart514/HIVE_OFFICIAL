import type { ElementSpec } from '../../element-spec';

export const leaderboardSpec: ElementSpec = {
  elementId: 'leaderboard',
  name: 'Leaderboard',
  category: 'display',
  dataSource: 'none',
  config: {
    title: { type: 'string', description: 'Leaderboard title', required: false },
    maxEntries: { type: 'number', description: 'Max entries shown', default: 10, required: false },
    showRank: { type: 'boolean', description: 'Show rank numbers', default: true, required: false },
    showScore: { type: 'boolean', description: 'Show scores', default: true, required: false },
    scoreLabel: { type: 'string', description: 'Label for score column', default: 'Points', required: false },
    highlightTop: { type: 'number', description: 'Highlight top N entries', default: 3, required: false },
  },
  connection: {
    minDepth: 'standalone',
    levels: [
      { depth: 'standalone', provides: 'Manual score tracking leaderboard', requiredContext: [] },
      { depth: 'space', provides: 'Auto-populated from space member activity', requiredContext: ['spaceId'] },
    ],
  },
  permissions: { create: 'anyone', interact: 'anyone' },
  executeActions: ['refresh'],
  state: { shared: ['collections'], personal: [] },
};
