import type { ElementSpec } from '../../element-spec';

export const mapViewSpec: ElementSpec = {
  elementId: 'map-view',
  name: 'Map View',
  category: 'display',
  dataSource: 'none',
  config: {
    defaultZoom: { type: 'number', description: 'Default zoom level', required: false },
    allowMarkers: { type: 'boolean', description: 'Allow user markers', default: false, required: false },
    showControls: { type: 'boolean', description: 'Show zoom controls', default: true, required: false },
  },
  connection: {
    minDepth: 'standalone',
    levels: [
      { depth: 'standalone', provides: 'Map display with optional markers', requiredContext: [] },
    ],
  },
  permissions: { create: 'anyone', interact: 'anyone' },
  executeActions: [],
  state: { shared: [], personal: [] },
};
