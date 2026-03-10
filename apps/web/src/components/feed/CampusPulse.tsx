'use client';

import { useQuery } from '@tanstack/react-query';
import { Mono } from '@hive/ui/design-system/primitives';

/* ─── Types ─────────────────────────────────────────────────────── */

interface DiningStatus {
  location: {
    id: string;
    name: string;
    type: string;
    building: string;
  };
  isOpen: boolean;
  minutesUntilClose?: number;
  currentMealPeriod?: {
    type: string;
  };
}

interface StudySpot {
  space: {
    id: string;
    name: string;
    noiseLevel: string;
  };
  building: {
    name: string;
    abbreviation?: string;
  };
  isAvailable: boolean;
  busyness?: number;
  busynessLabel?: string;
}

/* ─── Data fetching ─────────────────────────────────────────────── */

async function fetchDining(): Promise<DiningStatus[]> {
  const res = await fetch('/api/campus/dining?sortBy=closing-soon', {
    credentials: 'include',
  });
  if (!res.ok) return [];
  const payload = await res.json();
  return payload?.data?.locations ?? [];
}

async function fetchStudySpots(): Promise<StudySpot[]> {
  const res = await fetch('/api/campus/buildings/study-spots?sortBy=busyness&limit=6', {
    credentials: 'include',
  });
  if (!res.ok) return [];
  const payload = await res.json();
  return payload?.data?.spots ?? [];
}

/* ─── Helpers ────────────────────────────────────────────────────── */

function closingLabel(minutes: number | undefined): string | null {
  if (minutes === undefined) return null;
  if (minutes <= 30) return `Closes in ${minutes}m`;
  if (minutes <= 60) return `Closes in 1h`;
  return null;
}

function busynessColor(label: string | undefined): string {
  switch (label) {
    case 'Not busy':
    case 'Low':
      return 'bg-emerald-400';
    case 'Moderate':
    case 'Somewhat busy':
      return 'bg-amber-400';
    case 'Busy':
    case 'Very busy':
      return 'bg-red-400';
    default:
      return 'bg-white/30';
  }
}

/* ─── Component ──────────────────────────────────────────────────── */

export function CampusPulse() {
  const dining = useQuery({
    queryKey: ['campus-pulse-dining'],
    queryFn: fetchDining,
    staleTime: 60_000,
  });

  const study = useQuery({
    queryKey: ['campus-pulse-study'],
    queryFn: fetchStudySpots,
    staleTime: 60_000,
  });

  const diningItems = dining.data ?? [];
  const studyItems = study.data ?? [];

  // Nothing to show yet
  if (diningItems.length === 0 && studyItems.length === 0 && !dining.isLoading) {
    return null;
  }

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-breathe" />
        <Mono size="label" className="text-white/50">
          OPEN NOW
        </Mono>
        {diningItems.filter(d => d.minutesUntilClose !== undefined && d.minutesUntilClose <= 30).length > 0 && (
          <span className="text-[11px] font-mono text-amber-400/70">
            {diningItems.filter(d => d.minutesUntilClose !== undefined && d.minutesUntilClose <= 30).length} closing soon
          </span>
        )}
      </div>

      <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
        {/* Dining cards */}
        {diningItems.map((item) => {
          const closing = closingLabel(item.minutesUntilClose);
          const closingSoon = item.minutesUntilClose !== undefined && item.minutesUntilClose <= 30;

          return (
            <div
              key={item.location.id}
              className="shrink-0 w-[180px] rounded-2xl border border-white/[0.05] bg-card p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    item.isOpen ? 'bg-emerald-400' : 'bg-red-400'
                  }`}
                />
                <span className="text-[11px] font-mono uppercase tracking-wider text-white/30">
                  {item.isOpen ? 'Open' : 'Closed'}
                </span>
              </div>
              <p className="text-[14px] font-medium text-white/70 leading-snug line-clamp-1">
                {item.location.name}
              </p>
              <p className="text-[11px] text-white/30 mt-1">
                {item.location.building}
              </p>
              {closing && (
                <p
                  className={`text-[11px] mt-2 font-medium ${
                    closingSoon ? 'text-amber-400' : 'text-white/50'
                  }`}
                >
                  {closing}
                </p>
              )}
              {item.currentMealPeriod && !closing && (
                <p className="text-[11px] mt-2 text-[#FFD700]/70 font-medium capitalize">
                  {item.currentMealPeriod.type}
                </p>
              )}
            </div>
          );
        })}

        {/* Study spot cards */}
        {studyItems.map((item) => (
          <div
            key={item.space.id}
            className="shrink-0 w-[180px] rounded-2xl border border-white/[0.05] bg-card p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`w-2 h-2 rounded-full ${busynessColor(item.busynessLabel)}`}
              />
              <span className="text-[11px] font-mono uppercase tracking-wider text-white/30">
                {item.busynessLabel ?? 'Unknown'}
              </span>
            </div>
            <p className="text-[14px] font-medium text-white/70 leading-snug line-clamp-1">
              {item.space.name}
            </p>
            <p className="text-[11px] text-white/30 mt-1">
              {item.building.abbreviation ?? item.building.name}
            </p>
            <p className="text-[11px] mt-2 text-white/50 capitalize">
              {item.space.noiseLevel}
            </p>
          </div>
        ))}

        {/* Loading skeleton */}
        {dining.isLoading && (
          <>
            {[1, 2, 3].map((i) => (
              <div
                key={`skel-${i}`}
                className="shrink-0 w-[180px] rounded-2xl border border-white/[0.05] bg-card p-4 animate-pulse"
              >
                <div className="h-2 w-12 bg-white/[0.05] rounded mb-3" />
                <div className="h-4 w-24 bg-white/[0.05] rounded mb-2" />
                <div className="h-3 w-16 bg-white/[0.05] rounded" />
              </div>
            ))}
          </>
        )}
      </div>
    </section>
  );
}
