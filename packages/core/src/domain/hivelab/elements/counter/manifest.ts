import type { ElementSpec } from '../../element-spec';

export const counterSpec: ElementSpec = {
  elementId: 'counter',
  name: 'Counter',
  category: 'action',
  dataSource: 'none',
  config: {
    label: { type: 'string', description: 'Counter label', default: 'Count', required: false },
    initialValue: { type: 'number', description: 'Starting value', default: 0, required: false },
    step: { type: 'number', description: 'Increment/decrement step', default: 1, required: false },
    min: { type: 'number', description: 'Minimum value', default: 0, required: false },
    max: { type: 'number', description: 'Maximum value', default: 999, required: false },
    showControls: { type: 'boolean', description: 'Show +/- buttons', default: true, required: false },
  },
  connection: {
    minDepth: 'standalone',
    levels: [
      { depth: 'standalone', provides: 'Basic counter with increment/decrement', requiredContext: [] },
    ],
  },
  permissions: { create: 'anyone', interact: 'anyone' },
  executeActions: ['increment', 'decrement', 'reset'],
  state: { shared: ['counters'], personal: [] },
  aliases: ['counter-element'],
};
