'use client';

/**
 * RightRail — Empty slot for contextual content (trending, events, suggestions).
 *
 * Hidden below xl breakpoint. On xl+ it provides structure so content pages
 * don't float centered — they left-anchor against this rail.
 *
 * Width: 280px — matches the Twitter/Linear/Discord pattern.
 */

export function RightRail() {
  return (
    <aside className="hidden xl:block w-[280px] shrink-0 border-l border-white/[0.04]">
      {/* Slot reserved for: trending spaces, upcoming events, suggested people */}
    </aside>
  );
}
