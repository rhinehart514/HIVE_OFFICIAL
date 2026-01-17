/**
 * Space Entry Wrapper Component
 *
 * Handles entry animation on first visit to a space.
 * Shows an animated transition before revealing the space content.
 */

import * as React from 'react';
import { SpaceEntryAnimation } from '@hive/ui';
import { SpaceContextProvider } from '@/contexts/space';

interface SpaceEntryWrapperProps {
  spaceId: string;
  children: React.ReactNode;
}

export function SpaceEntryWrapper({ spaceId, children }: SpaceEntryWrapperProps) {
  const [showEntry, setShowEntry] = React.useState(false);
  const [spaceData, setSpaceData] = React.useState<{
    name: string;
    category?: string;
    onlineCount?: number;
  } | null>(null);

  React.useEffect(() => {
    const key = `hive-space-entered-${spaceId}`;
    if (sessionStorage.getItem(key) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    fetch(`/api/spaces/${spaceId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.space) {
          setSpaceData({ name: d.space.name, category: d.space.category, onlineCount: d.space.onlineCount });
          setShowEntry(true);
        }
      })
      .catch(() => {});
  }, [spaceId]);

  const handleComplete = React.useCallback(() => {
    sessionStorage.setItem(`hive-space-entered-${spaceId}`, 'true');
    setShowEntry(false);
  }, [spaceId]);

  return (
    <>
      {showEntry && spaceData && (
        <SpaceEntryAnimation
          spaceName={spaceData.name}
          category={spaceData.category}
          onComplete={handleComplete}
        />
      )}
      <SpaceContextProvider spaceId={spaceId}>{children}</SpaceContextProvider>
    </>
  );
}
