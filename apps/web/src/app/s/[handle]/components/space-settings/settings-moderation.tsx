'use client';

import { Shield, ChevronDown } from 'lucide-react';
import { Text } from '@hive/ui';

interface SettingsModerationProps {
  onOpenPanel: () => void;
}

export function SettingsModeration({ onOpenPanel }: SettingsModerationProps) {
  return (
    <>
      <h2
        className="text-title-lg font-semibold text-white mb-2"
        style={{ fontFamily: 'var(--font-clash)' }}
      >
        Moderation
      </h2>
      <Text size="sm" tone="muted" className="mb-8">
        Review flagged content and manage community guidelines
      </Text>

      <div
        className="p-6 rounded-lg bg-white/[0.05] border border-white/[0.05] cursor-pointer hover:bg-white/[0.10] transition-colors"
        onClick={onOpenPanel}
      >
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-lg bg-white/[0.05]">
            <Shield className="w-6 h-6 text-white/50" />
          </div>
          <div className="flex-1">
            <Text weight="medium" className="mb-1">Open Moderation Queue</Text>
            <Text size="sm" tone="muted">
              Review and act on flagged or hidden content in your space
            </Text>
          </div>
          <ChevronDown className="w-5 h-5 text-white/50 -rotate-90" />
        </div>
      </div>
    </>
  );
}
