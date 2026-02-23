import type { ElementSpec } from '../../element-spec';

export const qrCodeGeneratorSpec: ElementSpec = {
  elementId: 'qr-code-generator',
  name: 'QR Code Generator',
  category: 'display',
  dataSource: 'none',
  config: {
    url: { type: 'string', description: 'URL to encode', required: false },
    size: { type: 'number', description: 'QR code size in px', required: false },
    label: { type: 'string', description: 'Label below QR code', required: false },
  },
  connection: {
    minDepth: 'standalone',
    levels: [
      { depth: 'standalone', provides: 'QR code generation from URL', requiredContext: [] },
    ],
  },
  permissions: { create: 'anyone', interact: 'anyone' },
  executeActions: [],
  state: { shared: [], personal: [] },
};
