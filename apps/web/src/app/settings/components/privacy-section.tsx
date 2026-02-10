'use client';

import React from 'react';
import { Button, Card, Badge, toast } from '@hive/ui';
import { EyeIcon, MoonIcon, BookmarkIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { SettingRow } from './ui-primitives';
import { GhostModeModal } from '@/components/privacy/GhostModeModal';
import { useGhostMode } from '@/hooks/use-ghost-mode';
import { getGhostModeLevelConfig } from '@/lib/ghost-mode-constants';
import type { PrivacySettings } from '../types';

const Moon = MoonIcon;

interface PrivacySectionProps {
  privacySettings: PrivacySettings;
  onPrivacyChange: (setting: keyof PrivacySettings, value: unknown) => void;
  onSavePrivacy: () => void;
  isUpdating: boolean;
  ghostModeEnabled: boolean;
  showGhostModeModal: boolean;
  setShowGhostModeModal: (show: boolean) => void;
  onToggleGhostMode: () => void;
}

export function PrivacySection({
  privacySettings,
  onPrivacyChange,
  onSavePrivacy,
  isUpdating,
  ghostModeEnabled,
  showGhostModeModal,
  setShowGhostModeModal,
  onToggleGhostMode: _onToggleGhostMode,
}: PrivacySectionProps) {
  const ghostMode = useGhostMode();

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

      {ghostModeEnabled && (
        <Card className="p-6 border-white/[0.06] bg-white/[0.06]">
          <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <Moon className="h-5 w-5 text-white/50" />
            Ghost Mode
            <Badge variant="default" className="text-xs bg-white/[0.06] text-white/50 border-0">
              Privacy
            </Badge>
          </h3>
          <p className="text-sm text-white/50 mb-4">
            Control your visibility across HIVE. Stay focused during study sessions or go invisible when you need privacy.
          </p>

          {ghostMode.isEnabled ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-white/[0.06] border border-white/[0.06]">
                <div className="flex items-center gap-3">
                  {(() => {
                    const levelConfig = getGhostModeLevelConfig(ghostMode.state.level);
                    const LevelIcon = levelConfig.icon;
                    return (
                      <>
                        <div className="w-10 h-10 rounded-lg bg-white/[0.06] flex items-center justify-center">
                          <LevelIcon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{levelConfig.label}</p>
                          <p className="text-xs text-white/50">{levelConfig.description}</p>
                        </div>
                      </>
                    );
                  })()}
                </div>
                {ghostMode.expiresAt && (
                  <div className="text-right">
                    <p className="text-xs text-white/50">Expires in</p>
                    <p className="text-sm font-mono text-white/50">
                      {ghostMode.timeRemaining
                        ? `${Math.floor(ghostMode.timeRemaining / (1000 * 60 * 60))}h ${Math.floor((ghostMode.timeRemaining % (1000 * 60 * 60)) / (1000 * 60))}m`
                        : 'Soon'}
                    </p>
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setShowGhostModeModal(true)}
                  className="flex-1 border-white/[0.06] text-white hover:bg-white/[0.06]"
                >
                  Change Settings
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => ghostMode.disable()}
                  className="text-white/50 hover:text-white hover:bg-white/[0.06]"
                >
                  Turn Off
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="secondary"
              onClick={() => setShowGhostModeModal(true)}
              className="w-full border-white/[0.06] text-white hover:bg-white/[0.06]"
            >
              <Moon className="h-4 w-4 mr-2" />
              Enable Ghost Mode
            </Button>
          )}
        </Card>
      )}

      <GhostModeModal
        open={showGhostModeModal}
        onOpenChange={setShowGhostModeModal}
        currentState={{
          enabled: ghostMode.isEnabled,
          level: ghostMode.state.level,
          expiresAt: ghostMode.expiresAt,
        }}
        onActivate={async (level, duration) => {
          const success = await ghostMode.enable(level, duration);
          if (success) {
            toast.success('Ghost Mode activated');
          }
          return success;
        }}
        onDeactivate={async () => {
          const success = await ghostMode.disable();
          if (success) {
            toast.success('Ghost Mode deactivated');
          }
          return success;
        }}
      />
    </div>
  );
}
