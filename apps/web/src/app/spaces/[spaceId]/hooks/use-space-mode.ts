'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export type SpaceMode = 'hub' | 'chat' | 'events' | 'tools' | 'members';

interface UseSpaceModeOptions {
  spaceId: string;
  defaultMode?: SpaceMode;
  persistToUrl?: boolean;
}

interface UseSpaceModeReturn {
  mode: SpaceMode;
  setMode: (mode: SpaceMode) => void;
  isHub: boolean;
  isChat: boolean;
  isEvents: boolean;
  isTools: boolean;
  isMembers: boolean;
  goToHub: () => void;
  goToChat: () => void;
  goToEvents: () => void;
  goToTools: () => void;
  goToMembers: () => void;
}

export function useSpaceMode({
  spaceId,
  defaultMode = 'hub',
  persistToUrl = true,
}: UseSpaceModeOptions): UseSpaceModeReturn {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get initial mode from URL or default
  const urlMode = searchParams.get('mode') as SpaceMode | null;
  const initialMode = urlMode && isValidMode(urlMode) ? urlMode : defaultMode;

  const [mode, setModeState] = useState<SpaceMode>(initialMode);

  // Update URL when mode changes
  const setMode = useCallback((newMode: SpaceMode) => {
    setModeState(newMode);

    if (persistToUrl) {
      const url = new URL(window.location.href);
      if (newMode === 'hub') {
        url.searchParams.delete('mode');
      } else {
        url.searchParams.set('mode', newMode);
      }
      router.replace(url.pathname + url.search, { scroll: false });
    }
  }, [router, persistToUrl]);

  // Sync with URL changes (browser back/forward)
  useEffect(() => {
    if (persistToUrl) {
      const urlMode = searchParams.get('mode') as SpaceMode | null;
      const targetMode = urlMode && isValidMode(urlMode) ? urlMode : 'hub';
      if (targetMode !== mode) {
        setModeState(targetMode);
      }
    }
  }, [searchParams, mode, persistToUrl]);

  // Keyboard shortcut: Cmd+K to open command palette (handled elsewhere)
  // Keyboard shortcut: Escape to return to hub
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mode !== 'hub') {
        setMode('hub');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, setMode]);

  return {
    mode,
    setMode,
    isHub: mode === 'hub',
    isChat: mode === 'chat',
    isEvents: mode === 'events',
    isTools: mode === 'tools',
    isMembers: mode === 'members',
    goToHub: () => setMode('hub'),
    goToChat: () => setMode('chat'),
    goToEvents: () => setMode('events'),
    goToTools: () => setMode('tools'),
    goToMembers: () => setMode('members'),
  };
}

function isValidMode(mode: string): mode is SpaceMode {
  return ['hub', 'chat', 'events', 'tools', 'members'].includes(mode);
}
