export interface NotificationSettings {
  email: {
    spaceInvites: boolean;
    eventReminders: boolean;
    toolUpdates: boolean;
    weeklyDigest: boolean;
    securityAlerts: boolean;
    directMessages: boolean;
    mentionsAndReplies: boolean;
    builderUpdates: boolean;
  };
  push: {
    spaceActivity: boolean;
    toolLaunches: boolean;
    eventReminders: boolean;
    directMessages: boolean;
    weeklyDigest: boolean;
    emergencyAlerts: boolean;
  };
  inApp: {
    realTimeNotifications: boolean;
    soundEffects: boolean;
    desktopNotifications: boolean;
    emailPreview: boolean;
  };
  quietHours: {
    enabled: boolean;
    startTime: string;
    endTime: string;
  };
  spaceSettings: Record<string, { muted: boolean; pinned: boolean }>;
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'friends' | 'private';
  showActivity: boolean;
  showSpaces: boolean;
  showConnections: boolean;
  showOnlineStatus: boolean;
  allowDirectMessages: boolean;
  ghostMode: {
    enabled: boolean;
    level: 'minimal' | 'moderate' | 'maximum';
    duration: '30m' | '1h' | '4h' | 'indefinite';
    expiresAt: Date | null;
  };
}

export interface AccountSettings {
  theme: 'dark' | 'light' | 'auto';
  emailFrequency: 'immediate' | 'daily' | 'weekly' | 'never';
  dataRetention: {
    autoDelete: boolean;
    retentionDays: 90 | 180 | 365;
  };
}

export interface UserSpace {
  id: string;
  name: string;
  avatarUrl?: string;
}

export interface CalendarStatus {
  available: boolean;
  connected: boolean;
  provider?: string;
  connectedAt?: string;
  lastSyncedAt?: string;
  sharing?: { enabled: boolean; spaceIds: string[] };
}

export interface ExportProgress {
  current: number;
  total: number;
  currentItem: string;
}
