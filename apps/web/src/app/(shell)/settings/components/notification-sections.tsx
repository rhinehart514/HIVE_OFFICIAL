'use client';

import React from 'react';
import { Card, Badge } from '@hive/ui';
import { EnvelopeIcon, DevicePhoneMobileIcon, BellIcon, MoonIcon, UsersIcon } from '@heroicons/react/24/outline';
import { CollapsibleSection, SettingRow } from './ui-primitives';
import type { NotificationSettings, UserSpace } from '../types';

const Moon = MoonIcon;

interface NotificationSectionsProps {
  notificationSettings: NotificationSettings;
  onNotificationChange: (category: keyof NotificationSettings, setting: string, value: boolean) => void;
  onQuietHoursChange: (settings: NotificationSettings) => void;
  userSpaces: UserSpace[];
}

export function NotificationSections({
  notificationSettings,
  onNotificationChange,
  onQuietHoursChange,
  userSpaces,
}: NotificationSectionsProps) {
  return (
    <div className="space-y-6">
      <CollapsibleSection title="Email Notifications" icon={EnvelopeIcon} defaultOpen={true}>
        <div className="divide-y divide-white/[0.06]">
          <SettingRow
            label="Space Invitations"
            description="Get notified when you're invited to join a space"
            checked={notificationSettings.email.spaceInvites}
            onCheckedChange={(v) => onNotificationChange('email', 'spaceInvites', v)}
          />
          <SettingRow
            label="Event Reminders"
            description="Reminders for upcoming events and meetings"
            checked={notificationSettings.email.eventReminders}
            onCheckedChange={(v) => onNotificationChange('email', 'eventReminders', v)}
          />
          <SettingRow
            label="Creation Updates"
            description="New creation launches and updates from builders"
            checked={notificationSettings.email.toolUpdates}
            onCheckedChange={(v) => onNotificationChange('email', 'toolUpdates', v)}
          />
          <SettingRow
            label="Weekly Digest"
            description="Summary of your week's activity and highlights"
            checked={notificationSettings.email.weeklyDigest}
            onCheckedChange={(v) => onNotificationChange('email', 'weeklyDigest', v)}
          />
          <SettingRow
            label="Security Alerts"
            description="Important security and account notifications"
            checked={notificationSettings.email.securityAlerts}
            onCheckedChange={(v) => onNotificationChange('email', 'securityAlerts', v)}
          />
          <SettingRow
            label="Direct Messages"
            description="Email notifications for direct messages"
            checked={notificationSettings.email.directMessages}
            onCheckedChange={(v) => onNotificationChange('email', 'directMessages', v)}
          />
          <SettingRow
            label="Mentions & Replies"
            description="Get notified when someone mentions or replies to you"
            checked={notificationSettings.email.mentionsAndReplies}
            onCheckedChange={(v) => onNotificationChange('email', 'mentionsAndReplies', v)}
          />
          <SettingRow
            label="Builder Updates"
            description="Updates about HiveLab and creation features"
            checked={notificationSettings.email.builderUpdates}
            onCheckedChange={(v) => onNotificationChange('email', 'builderUpdates', v)}
          />
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Push Notifications" icon={DevicePhoneMobileIcon}>
        <div className="divide-y divide-white/[0.06]">
          <SettingRow
            label="Space Activity"
            description="Real-time notifications for space updates"
            checked={notificationSettings.push.spaceActivity}
            onCheckedChange={(v) => onNotificationChange('push', 'spaceActivity', v)}
          />
          <SettingRow
            label="Creation Launches"
            description="Notifications when new creations are available"
            checked={notificationSettings.push.toolLaunches}
            onCheckedChange={(v) => onNotificationChange('push', 'toolLaunches', v)}
          />
          <SettingRow
            label="Event Reminders"
            description="Push reminders for upcoming events"
            checked={notificationSettings.push.eventReminders}
            onCheckedChange={(v) => onNotificationChange('push', 'eventReminders', v)}
          />
          <SettingRow
            label="Direct Messages"
            description="Instant notifications for direct messages"
            checked={notificationSettings.push.directMessages}
            onCheckedChange={(v) => onNotificationChange('push', 'directMessages', v)}
          />
          <SettingRow
            label="Emergency Alerts"
            description="Critical campus and safety notifications"
            checked={notificationSettings.push.emergencyAlerts}
            onCheckedChange={(v) => onNotificationChange('push', 'emergencyAlerts', v)}
          />
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="In-App Notifications" icon={BellIcon}>
        <div className="divide-y divide-white/[0.06]">
          <SettingRow
            label="Real-time Notifications"
            description="Show notifications as they arrive"
            checked={notificationSettings.inApp.realTimeNotifications}
            onCheckedChange={(v) => onNotificationChange('inApp', 'realTimeNotifications', v)}
          />
          <SettingRow
            label="Sound Effects"
            description="Play sounds for notifications"
            checked={notificationSettings.inApp.soundEffects}
            onCheckedChange={(v) => onNotificationChange('inApp', 'soundEffects', v)}
          />
          <SettingRow
            label="Desktop Notifications"
            description="Show browser notifications"
            checked={notificationSettings.inApp.desktopNotifications}
            onCheckedChange={(v) => onNotificationChange('inApp', 'desktopNotifications', v)}
          />
        </div>
      </CollapsibleSection>

      <Card className="p-6 border-[var(--hive-brand-primary)]/20 bg-[var(--hive-brand-primary)]/5">
        <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
          <Moon className="h-5 w-5 text-[var(--hive-brand-primary)]" />
          Quiet Hours
          <Badge variant="default" className="text-xs bg-[var(--hive-brand-primary)]/20 text-[var(--hive-brand-primary)] border-0">
            Focus Mode
          </Badge>
        </h3>
        <p className="text-sm text-white/50 mb-4">
          Pause non-urgent notifications during study time or when you need to focus.
        </p>
        <SettingRow
          label="Enable Quiet Hours"
          description="Emergency alerts will still come through"
          checked={notificationSettings.quietHours.enabled}
          onCheckedChange={(v) => {
            onQuietHoursChange({
              ...notificationSettings,
              quietHours: { ...notificationSettings.quietHours, enabled: v },
            });
          }}
        />
        {notificationSettings.quietHours.enabled && (
          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/[0.06]">
            <div>
              <label className="text-sm font-medium text-white mb-2 block">Start Time</label>
              <input
                type="time"
                value={notificationSettings.quietHours.startTime}
                onChange={(e) => {
                  onQuietHoursChange({
                    ...notificationSettings,
                    quietHours: { ...notificationSettings.quietHours, startTime: e.target.value },
                  });
                }}
                className="w-full px-3 py-2 rounded-lg bg-white/[0.06] border border-white/[0.06] text-white text-sm focus:border-[var(--hive-brand-primary)]/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-white mb-2 block">End Time</label>
              <input
                type="time"
                value={notificationSettings.quietHours.endTime}
                onChange={(e) => {
                  onQuietHoursChange({
                    ...notificationSettings,
                    quietHours: { ...notificationSettings.quietHours, endTime: e.target.value },
                  });
                }}
                className="w-full px-3 py-2 rounded-lg bg-white/[0.06] border border-white/[0.06] text-white text-sm focus:border-[var(--hive-brand-primary)]/50 focus:outline-none"
              />
            </div>
          </div>
        )}
      </Card>

      <Card className="p-6 bg-white/[0.06] border-white/[0.06]">
        <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
          <UsersIcon className="h-5 w-5 text-[var(--hive-brand-primary)]" />
          Space Notifications
        </h3>
        <p className="text-sm text-white/50 mb-4">Customize notifications for individual spaces.</p>
        <div className="space-y-2">
          {userSpaces.map((space) => (
            <div
              key={space.id}
              className="flex items-center justify-between p-3 rounded-lg bg-white/[0.06] border border-white/[0.06]"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[var(--hive-brand-primary)]/10 flex items-center justify-center text-sm font-medium text-[var(--hive-brand-primary)]">
                  {space.name.charAt(0)}
                </div>
                <span className="text-sm text-white">{space.name}</span>
              </div>
              <button
                onClick={() => {
                  onQuietHoursChange({
                    ...notificationSettings,
                    spaceSettings: {
                      ...notificationSettings.spaceSettings,
                      [space.id]: {
                        ...notificationSettings.spaceSettings[space.id],
                        muted: !notificationSettings.spaceSettings[space.id]?.muted,
                      },
                    },
                  });
                }}
                className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                  notificationSettings.spaceSettings[space.id]?.muted
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-white/[0.06] text-white/50 hover:bg-white/[0.06]'
                }`}
              >
                {notificationSettings.spaceSettings[space.id]?.muted ? 'Muted' : 'Mute'}
              </button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
