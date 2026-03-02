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

  const campusName = data?.campusName ?? 'UB';
  const spaceCount = data?.spaces ?? 0;
  const eventsToday = data?.eventsToday ?? 0;

  return (
    <div className="flex items-center gap-1.5 text-[13px] text-white/35 tabular-nums">
      <span className="text-white/50 font-medium">{campusName}</span>
      {spaceCount > 0 && (
        <>
          <span className="text-white/15">&middot;</span>
          <span>{spaceCount} orgs</span>
        </>
      )}
      {eventsToday > 0 && (
        <>
          <span className="text-white/15">&middot;</span>
          <span>
            {eventsToday} event{eventsToday !== 1 ? 's' : ''} today
          </span>
        </>
      )}
    </div>
  );
}
