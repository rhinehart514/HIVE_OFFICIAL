import type { ElementSpec } from '../../element-spec';

export const announcementSpec: ElementSpec = {
  elementId: 'announcement',
  name: 'Announcement',
  category: 'action',
  dataSource: 'space-members',
  config: {
    pinned: { type: 'boolean', description: 'Pin announcement', default: false, required: false },
    sendNotification: { type: 'boolean', description: 'Notify members', default: true, required: false },
    expiresAt: { type: 'string', description: 'Expiration date (ISO)', required: false },
  },
  connection: {
    minDepth: 'space',
    levels: [
      { depth: 'space', provides: 'Announcements to space members with pin/notify', requiredContext: ['spaceId'] },
    ],
  },
  permissions: { create: 'space-leader', interact: 'space-member' },
  executeActions: ['create', 'pin', 'unpin', 'delete'],
  state: { shared: ['collections', 'timeline'], personal: [] },
};
