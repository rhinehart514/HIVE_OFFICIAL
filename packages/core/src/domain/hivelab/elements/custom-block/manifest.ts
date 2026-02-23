import type { ElementSpec } from '../../element-spec';

export const customBlockSpec: ElementSpec = {
  elementId: 'custom-block',
  name: 'Custom Block',
  category: 'display',
  dataSource: 'none',
  config: {
    html: { type: 'string', description: 'HTML content for iframe', required: true },
    css: { type: 'string', description: 'CSS styles', required: false },
    js: { type: 'string', description: 'JavaScript code', required: false },
    height: { type: 'number', description: 'Frame height', required: false },
  },
  connection: {
    minDepth: 'standalone',
    levels: [
      { depth: 'standalone', provides: 'Sandboxed HTML/CSS/JS block', requiredContext: [] },
    ],
  },
  permissions: { create: 'anyone', interact: 'anyone' },
  executeActions: [],
  state: { shared: [], personal: [] },
};
