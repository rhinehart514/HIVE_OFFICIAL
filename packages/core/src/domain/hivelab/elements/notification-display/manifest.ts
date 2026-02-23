import type { ElementSpec } from '../../element-spec';

export const notificationDisplaySpec: ElementSpec = {
  elementId: 'notification-display',
  name: 'Notification Display',
  category: 'display',
  dataSource: 'none',
  config: {
    maxNotifications: { type: 'number', description: 'Max notifications shown', required: false },
    groupByType: { type: 'boolean', description: 'Group by type', default: false, required: false },
    autoMarkRead: { type: 'boolean', description: 'Auto-mark as read', default: false, required: false },
  },
  connection: {
    minDepth: 'standalone',
    levels: [
      { depth: 'standalone', provides: 'Notification display list', requiredContext: [] },
    ],
  },
  permissions: { create: 'anyone', interact: 'anyone' },
  executeActions: [],
  state: { shared: [], personal: [] },
  aliases: ['notification-center'],
};
