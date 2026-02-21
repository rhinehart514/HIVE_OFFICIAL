'use client';

import React from 'react';
import { Button, Card } from '@hive/ui';
import { EyeIcon, BookmarkIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { SettingRow } from './ui-primitives';
import type { PrivacySettings } from '../types';

interface PrivacySectionProps {
  privacySettings: PrivacySettings;
  onPrivacyChange: (setting: keyof PrivacySettings, value: unknown) => void;
  onSavePrivacy: () => void;
  isUpdating: boolean;
}

export function PrivacySection({
  privacySettings,
  onPrivacyChange,
  onSavePrivacy,
  isUpdating,
}: PrivacySectionProps) {
  return (
    <div className="space-y-6">
      <Card className="p-6 bg-white/[0.06] border-white/[0.06]">
        <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
          <EyeIcon className="h-5 w-5 text-[var(--hive-brand-primary)]" />
          Profile Visibility
        </h3>
        <div className="divide-y divide-white/[0.06]">
          <SettingRow
            label="Show Activity Feed"
            description="Let others see your recent activity and interactions"
            checked={privacySettings.showActivity}
            onCheckedChange={(v) => onPrivacyChange('showActivity', v)}
          />
          <SettingRow
            label="Show Spaces"
            description="Display the spaces you're part of on your profile"
            checked={privacySettings.showSpaces}
            onCheckedChange={(v) => onPrivacyChange('showSpaces', v)}
          />
          <SettingRow
            label="Show Connections"
            description="Display your connections and network on your profile"
            checked={privacySettings.showConnections}
            onCheckedChange={(v) => onPrivacyChange('showConnections', v)}
          />
          <SettingRow
            label="Show Online Status"
            description="Let others see when you're active on HIVE"
            checked={privacySettings.showOnlineStatus}
            onCheckedChange={(v) => onPrivacyChange('showOnlineStatus', v)}
          />
          <SettingRow
            label="Allow Direct Messages"
            description="Let other students send you direct messages"
            checked={privacySettings.allowDirectMessages}
            onCheckedChange={(v) => onPrivacyChange('allowDirectMessages', v)}
          />
        </div>
        <div className="mt-4 pt-4 border-t border-white/[0.06]">
          <Button
            onClick={onSavePrivacy}
            disabled={isUpdating}
            aria-label={isUpdating ? 'Saving privacy settings' : 'Save privacy settings'}
            className="bg-[var(--hive-brand-primary)] text-black hover:bg-[var(--hive-brand-primary)]/90"
          >
            {isUpdating ? <ArrowPathIcon className="h-4 w-4  mr-2" aria-hidden="true" /> : <BookmarkIcon className="h-4 w-4 mr-2" aria-hidden="true" />}
            Save Privacy Settings
          </Button>
        </div>
      </Card>
    </div>
  );
}
