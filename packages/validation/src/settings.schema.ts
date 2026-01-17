import { z } from 'zod';

/**
 * Settings Validation Schemas
 *
 * Validates user settings including notifications, privacy, and account preferences.
 */

// Quiet hours schema
export const QuietHoursSchema = z.object({
  enabled: z.boolean(),
  startTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  endTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
});
export type QuietHours = z.infer<typeof QuietHoursSchema>;

// Email notification settings
export const EmailNotificationSettingsSchema = z.object({
  spaceInvites: z.boolean(),
  eventReminders: z.boolean(),
  toolUpdates: z.boolean(),
  weeklyDigest: z.boolean(),
  securityAlerts: z.boolean(),
  directMessages: z.boolean(),
  mentionsAndReplies: z.boolean(),
  builderUpdates: z.boolean(),
});
export type EmailNotificationSettings = z.infer<typeof EmailNotificationSettingsSchema>;

// Push notification settings
export const PushNotificationSettingsSchema = z.object({
  spaceActivity: z.boolean(),
  toolLaunches: z.boolean(),
  eventReminders: z.boolean(),
  directMessages: z.boolean(),
  weeklyDigest: z.boolean(),
  emergencyAlerts: z.boolean(),
});
export type PushNotificationSettings = z.infer<typeof PushNotificationSettingsSchema>;

// In-app notification settings
export const InAppNotificationSettingsSchema = z.object({
  realTimeNotifications: z.boolean(),
  soundEffects: z.boolean(),
  desktopNotifications: z.boolean(),
  emailPreview: z.boolean(),
});
export type InAppNotificationSettings = z.infer<typeof InAppNotificationSettingsSchema>;

// Space-specific notification settings
export const SpaceNotificationSettingsSchema = z.record(
  z.string(),
  z.object({
    muted: z.boolean().optional(),
    muteUntil: z.date().optional(),
    digest: z.enum(['all', 'mentions', 'none']).optional(),
  })
);
export type SpaceNotificationSettings = z.infer<typeof SpaceNotificationSettingsSchema>;

// Full notification settings
export const NotificationSettingsSchema = z.object({
  email: EmailNotificationSettingsSchema,
  push: PushNotificationSettingsSchema,
  inApp: InAppNotificationSettingsSchema,
  quietHours: QuietHoursSchema,
  spaceSettings: SpaceNotificationSettingsSchema,
});
export type NotificationSettings = z.infer<typeof NotificationSettingsSchema>;

// Update notification settings input (partial)
export const UpdateNotificationSettingsInputSchema = z.object({
  email: EmailNotificationSettingsSchema.partial().optional(),
  push: PushNotificationSettingsSchema.partial().optional(),
  inApp: InAppNotificationSettingsSchema.partial().optional(),
  quietHours: QuietHoursSchema.partial().optional(),
  spaceSettings: SpaceNotificationSettingsSchema.optional(),
});
export type UpdateNotificationSettingsInput = z.infer<typeof UpdateNotificationSettingsInputSchema>;

// Ghost mode schema
export const GhostModeSchema = z.object({
  enabled: z.boolean(),
  level: z.enum(['light', 'moderate', 'full']),
  duration: z.enum(['1h', '4h', '12h', '24h', 'indefinite']),
  expiresAt: z.date().nullable(),
});
export type GhostMode = z.infer<typeof GhostModeSchema>;

// Privacy settings
export const PrivacySettingsSchema = z.object({
  profileVisibility: z.enum(['public', 'campus', 'private']),
  showActivity: z.boolean(),
  showSpaces: z.boolean(),
  showConnections: z.boolean(),
  showOnlineStatus: z.boolean(),
  allowDirectMessages: z.boolean(),
  ghostMode: GhostModeSchema,
});
export type PrivacySettings = z.infer<typeof PrivacySettingsSchema>;

// Update privacy settings input
export const UpdatePrivacySettingsInputSchema = PrivacySettingsSchema.partial();
export type UpdatePrivacySettingsInput = z.infer<typeof UpdatePrivacySettingsInputSchema>;

// Data retention settings
export const DataRetentionSchema = z.object({
  autoDelete: z.boolean(),
  retentionDays: z.number().int().min(30).max(730),
});
export type DataRetention = z.infer<typeof DataRetentionSchema>;

// Account settings
export const AccountSettingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']),
  emailFrequency: z.enum(['realtime', 'daily', 'weekly', 'never']),
  dataRetention: DataRetentionSchema,
});
export type AccountSettings = z.infer<typeof AccountSettingsSchema>;

// Update account settings input
export const UpdateAccountSettingsInputSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  emailFrequency: z.enum(['realtime', 'daily', 'weekly', 'never']).optional(),
  dataRetention: DataRetentionSchema.partial().optional(),
});
export type UpdateAccountSettingsInput = z.infer<typeof UpdateAccountSettingsInputSchema>;
