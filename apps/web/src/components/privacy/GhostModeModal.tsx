'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@hive/ui';
import { Button } from '@hive/ui';
import { ArrowPathIcon, CheckIcon } from '@heroicons/react/24/outline';
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
      <DialogContent className="sm:max-w-[480px] bg-[var(--bg-elevated)] border-[var(--border-subtle)]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-[var(--text-primary)]">
            Ghost Mode
          </DialogTitle>
          <DialogDescription className="text-[var(--text-secondary)]">
            Control your visibility across HIVE
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Current Status */}
          {isCurrentlyEnabled && currentState?.expiresAt && (
            <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--text-secondary)]">Currently active</span>
                <GhostModeCountdown expiresAt={currentState.expiresAt} variant="full" />
              </div>
            </div>
          )}

          {/* Level Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-[var(--text-secondary)]">Select Level</label>
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
            <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-4">
              <h4 className="text-sm font-medium text-[var(--text-secondary)] mb-2">What gets hidden:</h4>
              <ul className="space-y-1">
                {selectedLevelConfig.hides.map((item) => (
                  <li key={item} className="text-sm text-[var(--text-tertiary)] flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)]" />
                    {formatHiddenItem(item)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Duration Selection - only show when enabling */}
          {(!isCurrentlyEnabled || selectedLevel !== currentState?.level) && selectedLevel !== 'normal' && (
            <div className="space-y-3">
              <label className="text-sm font-medium text-[var(--text-secondary)]">Duration</label>
              <div className="flex flex-wrap gap-2">
                {GHOST_MODE_DURATIONS.map((duration) => (
                  <button
                    key={duration.value}
                    type="button"
                    onClick={() => setSelectedDuration(duration.value)}
                    className={cn(
                      'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]',
                      selectedDuration === duration.value
                        ? 'bg-[var(--text-primary)] text-[var(--text-inverse)]'
                        : 'bg-[var(--bg-muted)] text-[var(--text-secondary)] hover:bg-[var(--bg-emphasis)] hover:text-[var(--text-primary)]'
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
            className="flex-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)]"
            disabled={isSubmitting}
          >
            Cancel
          </Button>

          {isCurrentlyEnabled ? (
            <Button
              variant="secondary"
              onClick={handleDeactivate}
              disabled={isSubmitting}
              className="flex-1 border-[var(--border-default)] text-[var(--text-primary)] hover:bg-[var(--bg-emphasis)]"
            >
              {isSubmitting ? (
                <ArrowPathIcon className="h-4 w-4 animate-spin" />
              ) : (
                'Turn Off Ghost Mode'
              )}
            </Button>
          ) : (
            <Button
              onClick={handleActivate}
              disabled={isSubmitting || selectedLevel === 'normal'}
              className="flex-1 bg-[var(--life-gold)] text-[var(--text-inverse)] hover:bg-[var(--life-gold-hover)] disabled:opacity-50"
            >
              {isSubmitting ? (
                <ArrowPathIcon className="h-4 w-4 animate-spin" />
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
        'w-full flex items-start gap-4 p-4 rounded-lg border transition-all duration-200 text-left',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]',
        isSelected
          ? 'border-[var(--border-emphasis)] bg-[var(--bg-muted)]'
          : 'border-[var(--border-subtle)] bg-transparent hover:border-[var(--border-default)] hover:bg-[var(--bg-subtle)]'
      )}
    >
      <div
        className={cn(
          'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center',
          isSelected ? 'bg-[var(--bg-emphasis)]' : 'bg-[var(--bg-muted)]'
        )}
      >
        <Icon className={cn('w-5 h-5', isSelected ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]')} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn('font-medium', isSelected ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]')}>
            {config.label}
          </span>
          {isSelected && (
            <CheckIcon className="w-4 h-4 text-[var(--life-gold)]" />
          )}
        </div>
        <p className="text-sm text-[var(--text-tertiary)] mt-0.5">{config.detailedDescription}</p>
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
