'use client';

import { useCallback, useRef } from 'react';

/**
 * useAnalytics — fire-and-forget event tracking via /api/analytics/track.
 *
 * Returns `track(name, properties?)` which never throws and never blocks UI.
 * Also returns `startTimer()` / `elapsed()` helpers for duration tracking.
 */
export function useAnalytics() {
  const timerRef = useRef<number | null>(null);

  const track = useCallback(
    (name: string, properties?: Record<string, unknown>) => {
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, properties }),
      }).catch(() => {});
    },
    []
  );

  const startTimer = useCallback(() => {
    timerRef.current = Date.now();
  }, []);

  const elapsed = useCallback((): number | null => {
    if (timerRef.current === null) return null;
    return Date.now() - timerRef.current;
  }, []);

  return { track, startTimer, elapsed };
}
