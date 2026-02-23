import type { ElementSpec } from '../../element-spec';

export const datePickerSpec: ElementSpec = {
  elementId: 'date-picker',
  name: 'Date Picker',
  category: 'input',
  dataSource: 'none',
  config: {
    includeTime: { type: 'boolean', description: 'Include time picker', default: false, required: false },
    allowRange: { type: 'boolean', description: 'Allow date range', default: false, required: false },
    minDate: { type: 'string', description: 'Min date (ISO)', required: false },
    maxDate: { type: 'string', description: 'Max date (ISO)', required: false },
  },
  connection: {
    minDepth: 'standalone',
    levels: [
      { depth: 'standalone', provides: 'Date/time picker input', requiredContext: [] },
    ],
  },
  permissions: { create: 'anyone', interact: 'anyone' },
  executeActions: [],
  state: { shared: [], personal: ['selections'] },
};
