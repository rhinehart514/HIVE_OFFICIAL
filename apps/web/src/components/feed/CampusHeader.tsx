'use client';

import { useQuery } from '@tanstack/react-query';
import type { CampusStats } from './types';

async function fetchCampusStats(): Promise<CampusStats> {
  const [statsRes, eventsRes] = await Promise.all([
    fetch('/api/campus/stats?campusId=ub-buffalo', { credentials: 'include' }),
    fetch('/api/events/personalized?timeRange=today&maxItems=1&sort=soonest', {
      credentials: 'include',
    }),
  ]);

  let spaces = 0;
  if (statsRes.ok) {
    const data = await statsRes.json();
    const s = data?.data?.spaces ?? data?.spaces;
    if (typeof s === 'number' && s > 0) spaces = s;
  }

  let eventsToday = 0;
  if (eventsRes.ok) {
    const data = await eventsRes.json();
    eventsToday = data?.data?.meta?.totalAvailable ?? 0;
  }

  return { campusName: 'UB', spaces, eventsToday };
}

export function CampusHeader() {
  const { data } = useQuery({
    queryKey: ['campus-header-stats'],
    queryFn: fetchCampusStats,
    staleTime: 5 * 60_000,
  });

  const spaceCount = data?.spaces ?? 0;
  const eventsToday = data?.eventsToday ?? 0;

  // Campus-specific status line with personality
  function campusStatus(): string {
    const hour = new Date().getHours();
    if (eventsToday > 3) return `${eventsToday} things happening today`;
    if (eventsToday > 0) return `${eventsToday} event${eventsToday !== 1 ? 's' : ''} today`;
    if (hour < 10) return 'Campus is waking up';
    if (hour < 14) return 'Between classes energy';
    if (hour < 18) return 'Afternoon on campus';
    if (hour < 22) return 'Campus is alive';
    return 'Night owls only';
  }

  return (
    <div className="flex items-center gap-2 text-[13px] text-white/30 tabular-nums">
      <span className="w-1.5 h-1.5 rounded-full bg-[#FFD700]/50 animate-breathe" />
      <span>{campusStatus()}</span>
      {spaceCount > 0 && (
        <>
          <span className="text-white/30">&middot;</span>
          <span>{spaceCount} orgs</span>
        </>
      )}
    </div>
  );
}
