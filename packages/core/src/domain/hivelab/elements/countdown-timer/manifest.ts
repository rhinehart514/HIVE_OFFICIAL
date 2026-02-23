import type { ElementSpec } from '../../element-spec';

export const countdownTimerSpec: ElementSpec = {
  elementId: 'countdown-timer',
  name: 'Countdown Timer',
  category: 'display',
  dataSource: 'none',
  config: {
    seconds: { type: 'number', description: 'Target seconds from now, OR use targetDate in config', required: true },
    label: { type: 'string', description: 'Display label', required: false },
    targetDate: { type: 'string', description: 'ISO date string to count down to', required: false },
    showDays: { type: 'boolean', description: 'Show days in display', default: true, required: false },
  },
  connection: {
    minDepth: 'standalone',
    levels: [
      { depth: 'standalone', provides: 'Countdown to a fixed target', requiredContext: [] },
    ],
  },
  permissions: { create: 'anyone', interact: 'anyone' },
  executeActions: ['finished'],
  state: { shared: [], personal: [] },
};
