import type { ElementSpec } from '../../element-spec';

export const photoGallerySpec: ElementSpec = {
  elementId: 'photo-gallery',
  name: 'Photo Gallery',
  category: 'display',
  dataSource: 'none',
  config: {
    maxPhotos: { type: 'number', description: 'Max photos allowed', required: false },
    allowUpload: { type: 'boolean', description: 'Allow user uploads', default: false, required: false },
    columns: { type: 'number', description: 'Grid columns', default: 3, required: false },
    showCaptions: { type: 'boolean', description: 'Show captions', default: true, required: false },
    uploadLabel: { type: 'string', description: 'Upload button label', required: false },
    emptyMessage: { type: 'string', description: 'Empty state message', required: false },
  },
  connection: {
    minDepth: 'standalone',
    levels: [
      { depth: 'standalone', provides: 'Photo gallery with optional upload', requiredContext: [] },
    ],
  },
  permissions: { create: 'anyone', interact: 'anyone' },
  executeActions: ['upload'],
  state: { shared: ['collections'], personal: [] },
};
