'use client';

import { Flag, RotateCcw } from 'lucide-react';
import { useFeatureFlags, FEATURE_FLAGS } from '@/hooks/use-feature-flags';
import { useAdminToolbar } from '../AdminToolbarProvider';

export function FlagOverrides() {
  const { flags, isLoading } = useFeatureFlags();
  const { flagOverrides, setFlagOverride, clearAllOverrides, hasOverrides } = useAdminToolbar();

  const overrideCount = Object.keys(flagOverrides).length;
  const allFlags = Object.values(FEATURE_FLAGS);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8 text-white/50 text-sm">
        Loading flags...
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-white/50 text-[11px] font-medium uppercase tracking-wider">
          <Flag size={12} />
          Feature Flags
          {overrideCount > 0 && (
            <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded-full text-[10px] font-bold">
              {overrideCount}
            </span>
          )}
        </div>

        {hasOverrides && (
          <button
            onClick={clearAllOverrides}
            className="flex items-center gap-1 px-2 py-1 text-[11px] text-white/50 hover:text-white/50 hover:bg-white/[0.06] rounded transition-colors"
          >
            <RotateCcw size={10} />
            Reset All
          </button>
        )}
      </div>

      {/* Flag List */}
      <div className="space-y-1">
        {allFlags.map(flagId => {
          const serverValue = flags[flagId] === true;
          const hasOverride = flagId in flagOverrides;
          const effectiveValue = hasOverride ? flagOverrides[flagId] : serverValue;

          return (
            <div
              key={flagId}
              className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/[0.06] transition-colors"
            >
              <div className="min-w-0">
                <p className="text-[12px] text-white/50 font-sans truncate">{flagId}</p>
                <p className="text-[10px] text-white/50">
                  Server: {serverValue ? 'ON' : 'OFF'}
                  {hasOverride && ' → Overridden'}
                </p>
              </div>

              {/* Toggle */}
              <button
                onClick={() => {
                  if (hasOverride) {
                    // If overriding to same as server, clear override
                    // Otherwise toggle the override
                    if (flagOverrides[flagId] === !serverValue) {
                      setFlagOverride(flagId, null); // clear override
                    } else {
                      setFlagOverride(flagId, !effectiveValue);
                    }
                  } else {
                    // Start overriding to opposite of server
                    setFlagOverride(flagId, !serverValue);
                  }
                }}
                className={`
                  relative w-9 h-5 rounded-full transition-colors flex-shrink-0
                  ${effectiveValue
                    ? 'bg-emerald-500/40'
                    : 'bg-white/[0.06]'
                  }
                  ${hasOverride ? 'ring-2 ring-blue-500/50' : ''}
                `}
              >
                <span
                  className={`
                    absolute top-0.5 w-4 h-4 rounded-full transition-all duration-200
                    ${effectiveValue
                      ? 'left-[18px] bg-emerald-400'
                      : 'left-0.5 bg-white/50'
                    }
                  `}
                />
              </button>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <p className="text-[10px] text-white/50 text-center pt-1">
        Overrides are session-scoped. Close tab to reset.
      </p>
    </div>
  );
}
