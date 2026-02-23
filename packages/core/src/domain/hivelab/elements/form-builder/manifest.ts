import type { ElementSpec } from '../../element-spec';

export const formBuilderSpec: ElementSpec = {
  elementId: 'form-builder',
  name: 'Form Builder',
  category: 'input',
  dataSource: 'none',
  config: {
    fields: { type: 'object[]', description: 'Array of {name, type, label, required?, placeholder?, options?}', default: [{ name: 'name', type: 'text', label: 'Name', required: true }, { name: 'email', type: 'email', label: 'Email', required: true }], required: true },
    title: { type: 'string', description: 'Form title', required: false },
    submitLabel: { type: 'string', description: 'Submit button label', required: false },
    submitButtonText: { type: 'string', description: 'Submit button text', required: false },
    validateOnChange: { type: 'boolean', description: 'Validate on change', default: true, required: false },
    showProgress: { type: 'boolean', description: 'Show progress', default: false, required: false },
    allowMultipleSubmissions: { type: 'boolean', description: 'Allow multiple submissions', default: false, required: false },
  },
  connection: {
    minDepth: 'standalone',
    levels: [
      { depth: 'standalone', provides: 'Basic form with submission collection', requiredContext: [] },
      { depth: 'space', provides: 'Submissions linked to space members, leader-only export', requiredContext: ['spaceId'] },
    ],
  },
  permissions: { create: 'anyone', interact: 'anyone' },
  executeActions: ['submit'],
  state: { shared: ['collections'], personal: ['participation'] },
};
