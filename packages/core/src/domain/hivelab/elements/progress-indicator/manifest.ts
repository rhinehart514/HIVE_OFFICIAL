import type { ElementSpec } from '../../element-spec';

export const progressIndicatorSpec: ElementSpec = {
  elementId: 'progress-indicator',
  name: 'Progress Indicator',
  category: 'display',
  dataSource: 'none',
  config: {
    value: { type: 'number', description: 'Current value', default: 0, required: false },
    max: { type: 'number', description: 'Max/target value', default: 100, required: false },
    variant: { type: 'string', description: '"bar" or "circular"', default: 'bar', required: false },
    label: { type: 'string', description: 'Label text', default: '', required: false },
    title: { type: 'string', description: 'Title text', required: false },
    showLabel: { type: 'boolean', description: 'Show label', default: true, required: false },
    color: { type: 'string', description: 'Color scheme', default: 'primary', required: false },
    unit: { type: 'string', description: 'Unit label (%, $, etc.)', required: false },
  },
  connection: {
    minDepth: 'standalone',
    levels: [
      { depth: 'standalone', provides: 'Manual progress tracking', requiredContext: [] },
      { depth: 'space', provides: 'Shared progress visible to all members', requiredContext: ['spaceId'] },
    ],
  },
  permissions: { create: 'anyone', interact: 'anyone' },
  executeActions: ['set', 'increment', 'reset'],
  state: { shared: ['counters'], personal: [] },
};
