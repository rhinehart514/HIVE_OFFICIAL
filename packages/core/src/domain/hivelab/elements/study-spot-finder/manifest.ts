import type { ElementSpec } from '../../element-spec';

export const studySpotFinderSpec: ElementSpec = {
  elementId: 'study-spot-finder',
  name: 'Study Spot Finder',
  category: 'display',
  dataSource: 'campus-events',
  config: {
    title: { type: 'string', description: 'Finder title', required: false },
    showFilters: { type: 'boolean', description: 'Show filters', default: true, required: false },
    showRecommendation: { type: 'boolean', description: 'Show recommendation', default: true, required: false },
    defaultNoiseLevel: { type: 'string', description: 'Default noise preference', required: false },
    defaultNeedsPower: { type: 'boolean', description: 'Default power outlet pref', default: false, required: false },
    maxItems: { type: 'number', description: 'Max items shown', required: false },
  },
  connection: {
    minDepth: 'campus',
    levels: [
      { depth: 'campus', provides: 'Campus study spots with availability and recommendations', requiredContext: ['campusId'] },
    ],
  },
  permissions: { create: 'anyone', interact: 'authenticated' },
  executeActions: [],
  state: { shared: [], personal: [] },
};
