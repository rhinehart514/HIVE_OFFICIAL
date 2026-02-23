import type { ElementSpec } from '../../element-spec';

export const diningPickerSpec: ElementSpec = {
  elementId: 'dining-picker',
  name: 'Dining Picker',
  category: 'display',
  dataSource: 'campus-events',
  config: {
    title: { type: 'string', description: 'Picker title', required: false },
    showRecommendation: { type: 'boolean', description: 'Show AI recommendation', default: true, required: false },
    showFilters: { type: 'boolean', description: 'Show filters', default: true, required: false },
    maxItems: { type: 'number', description: 'Max items shown', required: false },
    sortBy: { type: 'string', description: 'Sort order', required: false },
  },
  connection: {
    minDepth: 'campus',
    levels: [
      { depth: 'campus', provides: 'Campus dining options with recommendations', requiredContext: ['campusId'] },
    ],
  },
  permissions: { create: 'anyone', interact: 'authenticated' },
  executeActions: [],
  state: { shared: [], personal: [] },
};
