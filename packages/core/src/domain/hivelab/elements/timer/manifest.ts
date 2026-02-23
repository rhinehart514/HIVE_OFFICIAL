import type { ElementSpec } from '../../element-spec';

export const timerSpec: ElementSpec = {
  elementId: 'timer',
  name: 'Timer',
  category: 'action',
  dataSource: 'none',
  config: {
    label: { type: 'string', description: 'Timer label', default: 'Timer', required: false },
    showControls: { type: 'boolean', description: 'Show start/stop/reset', default: true, required: false },
    countUp: { type: 'boolean', description: 'Count up (true) or down (false)', default: true, required: false },
    initialSeconds: { type: 'number', description: 'Starting seconds for countdown', default: 0, required: false },
  },
  connection: {
    minDepth: 'standalone',
    levels: [
      { depth: 'standalone', provides: 'Basic timer with start/stop/lap', requiredContext: [] },
    ],
  },
  permissions: { create: 'anyone', interact: 'anyone' },
  executeActions: ['start', 'stop', 'lap', 'reset'],
  state: { shared: ['counters'], personal: [] },
};
