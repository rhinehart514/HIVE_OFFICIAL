'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@hive/ui';
import { Button } from '@hive/ui';
import { Loader2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  GHOST_MODE_LEVELS,
  GHOST_MODE_DURATIONS,
  type GhostModeLevel,
  type GhostModeDurationValue,
  type GhostModeLevelConfig,
} from '@/lib/ghost-mode-constants';
import { GhostModeCountdown } from './GhostModeCountdown';

export interface GhostModeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentState?: {
    enabled: boolean;
    level: GhostModeLevel;
    expiresAt: Date | null;
  };
  onActivate: (level: GhostModeLevel, durationMinutes: GhostModeDurationValue) => Promise<boolean>;
  onDeactivate: () => Promise<boolean>;
}

export function GhostModeModal({
  open,
  onOpenChange,
  currentState,
  onActivate,
  onDeactivate,
}: GhostModeModalProps) {
  const [selectedLevel, setSelectedLevel] = useState<GhostModeLevel>(
    currentState?.level ?? 'minimal'
  );
  const [selectedDuration, setSelectedDuration] = useState<GhostModeDurationValue>(240); // 4 hours default
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isCurrentlyEnabled = currentState?.enabled ?? false;

  const handleActivate = async () => {
    setIsSubmitting(true);
    try {
      const success = await onActivate(selectedLevel, selectedDuration);
      if (success) {
        onOpenChange(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivate = async () => {
    setIsSubmitting(true);
    try {
      const success = await onDeactivate();
      if (success) {
        onOpenChange(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedLevelConfig = GHOST_MODE_LEVELS.find((l) => l.value === selectedLevel);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] bg-[#141414] border-[#2A2A2A]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-white">
            Ghost Mode
          </DialogTitle>
          <DialogDescription className="text-white/60">
            Control your visibility across HIVE
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Current Status */}
          {isCurrentlyEnabled && currentState?.expiresAt && (
            <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/60">Currently active</span>
                <GhostModeCountdown expiresAt={currentState.expiresAt} variant="full" />
              </div>
            </div>
          )}

          {/* Level Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-white/80">Select Level</label>
            <div className="space-y-2">
              {GHOST_MODE_LEVELS.map((level) => (
                <LevelOption
                  key={level.value}
                  config={level}
                  isSelected={selectedLevel === level.value}
                  onSelect={() => setSelectedLevel(level.value)}
                />
              ))}
            </div>
          </div>

          {/* What Gets Hidden Preview */}
          {selectedLevelConfig && selectedLevelConfig.hides.length > 0 && (
            <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
              <h4 className="text-sm font-medium text-white/80 mb-2">What gets hidden:</h4>
              <ul className="space-y-1">
                {selectedLevelConfig.hides.map((item) => (
                  <li key={item} className="text-sm text-white/50 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
                    {formatHiddenItem(item)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Duration Selection - only show when enabling */}
          {(!isCurrentlyEnabled || selectedLevel !== currentState?.level) && selectedLevel !== 'normal' && (
            <div className="space-y-3">
              <label className="text-sm font-medium text-white/80">Duration</label>
              <div className="flex flex-wrap gap-2">
                {GHOST_MODE_DURATIONS.map((duration) => (
                  <button
                    key={duration.value}
                    type="button"
                    onClick={() => setSelectedDuration(duration.value)}
                    className={cn(
                      'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                      selectedDuration === duration.value
                        ? 'bg-white text-black'
                        : 'bg-white/[0.06] text-white/70 hover:bg-white/[0.1] hover:text-white'
                    )}
                  >
                    {duration.shortLabel}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="flex-1 text-white/70 hover:text-white hover:bg-white/[0.06]"
            disabled={isSubmitting}
          >
            Cancel
          </Button>

          {isCurrentlyEnabled ? (
            <Button
              variant="secondary"
              onClick={handleDeactivate}
              disabled={isSubmitting}
              className="flex-1 border-white/20 text-white hover:bg-white/10"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Turn Off Ghost Mode'
              )}
            </Button>
          ) : (
            <Button
              onClick={handleActivate}
              disabled={isSubmitting || selectedLevel === 'normal'}
              className="flex-1 bg-[#FFD700] text-black hover:bg-[#FFD700]/90 disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Activate Ghost Mode'
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface LevelOptionProps {
  config: GhostModeLevelConfig;
  isSelected: boolean;
  onSelect: () => void;
}

function LevelOption({ config, isSelected, onSelect }: LevelOptionProps) {
  const Icon = config.icon;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'w-full flex items-start gap-4 p-4 rounded-lg border transition-all text-left',
        isSelected
          ? 'border-white/30 bg-white/[0.04]'
          : 'border-white/10 bg-transparent hover:border-white/20 hover:bg-white/[0.02]'
      )}
    >
      <div
        className={cn(
          'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center',
          isSelected ? 'bg-white/10' : 'bg-white/[0.04]'
        )}
      >
        <Icon className={cn('w-5 h-5', isSelected ? 'text-white' : 'text-white/60')} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn('font-medium', isSelected ? 'text-white' : 'text-white/80')}>
            {config.label}
          </span>
          {isSelected && (
            <Check className="w-4 h-4 text-[#FFD700]" />
          )}
        </div>
        <p className="text-sm text-white/50 mt-0.5">{config.detailedDescription}</p>
      </div>
    </button>
  );
}

function formatHiddenItem(item: string): string {
  const labels: Record<string, string> = {
    lastSeen: 'Last seen timestamp',
    activity: 'Activity feed and history',
    onlineStatus: 'Online/offline status',
    directory: 'Campus directory listing',
    spaceMemberships: 'Space membership visibility',
    search: 'Search results',
  };
  return labels[item] || item;
}
