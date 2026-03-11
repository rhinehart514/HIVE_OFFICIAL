'use client';

import { BarChart3, ChevronDown } from 'lucide-react';
import { Text } from '@hive/ui';

interface SettingsAnalyticsProps {
  onOpenPanel: () => void;
}

export function SettingsAnalytics({ onOpenPanel }: SettingsAnalyticsProps) {
  return (
    <>
      <h2
        className="text-title-lg font-semibold text-white mb-2"
        style={{ fontFamily: 'var(--font-clash)' }}
      >
        Analytics
      </h2>
      <Text size="sm" tone="muted" className="mb-8">
        Understand your space&apos;s growth and engagement
      </Text>

      <div
        className="p-6 rounded-lg bg-white/[0.05] border border-white/[0.05] cursor-pointer hover:bg-white/[0.10] transition-colors"
        onClick={onOpenPanel}
      >
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-lg bg-white/[0.05]">
            <BarChart3 className="w-6 h-6 text-white/50" />
          </div>
          <div className="flex-1">
            <Text weight="medium" className="mb-1">Open Analytics Dashboard</Text>
            <Text size="sm" tone="muted">
              View member growth, engagement metrics, and activity insights
            </Text>
          </div>
          <ChevronDown className="w-5 h-5 text-white/50 -rotate-90" />
        </div>
      </div>
    </>
  );
}
