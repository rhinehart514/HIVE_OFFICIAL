'use client';

/**
 * CampusProvider - Context for the Campus navigation system
 *
 * Manages:
 * - Mobile drawer state (peek/half/full)
 * - Spotlight search overlay state
 * - Hover preview state (which orb, position)
 * - Space order (drag to reorder, persisted)
 * - Responsive detection
 */

import * as React from 'react';
import { usePathname } from 'next/navigation';

// ============================================
// CONSTANTS
// ============================================

const STORAGE_KEYS = {
  SPACE_ORDER: 'hive-dock-space-order',
  DRAWER_DEFAULT: 'hive-drawer-default',
} as const;

const BREAKPOINTS = {
  MOBILE: 768,
  DESKTOP: 1024,
} as const;

// ============================================
// TYPES
// ============================================

export type DrawerState = 'closed' | 'peek' | 'half' | 'full';

export interface CampusContextValue {
  // Mobile drawer
  drawerState: DrawerState;
  setDrawerState: (state: DrawerState) => void;
  openDrawer: () => void;
  closeDrawer: () => void;

  // Spotlight search
  isSpotlightOpen: boolean;
  setSpotlightOpen: (open: boolean) => void;
  openSpotlight: () => void;
  closeSpotlight: () => void;

  // Quick create
  isQuickCreateOpen: boolean;
  setQuickCreateOpen: (open: boolean) => void;

  // Hover preview
  hoveredOrbId: string | null;
  setHoveredOrbId: (id: string | null) => void;
  previewPosition: { x: number; y: number } | null;
  setPreviewPosition: (pos: { x: number; y: number } | null) => void;

  // Space order (drag reorder)
  spaceOrder: string[];
  setSpaceOrder: (order: string[]) => void;

  // Responsive
  isMobile: boolean;
  isDesktop: boolean;

  // Current context
  activeSpaceId: string | undefined;
}

// ============================================
// CONTEXT
// ============================================

const CampusContext = React.createContext<CampusContextValue | null>(null);

// ============================================
// HOOKS
// ============================================

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

function usePersistedState<T>(
  key: string,
  defaultValue: T
): [T, (value: T) => void] {
  const [state, setState] = React.useState<T>(() => {
    if (typeof window === 'undefined') return defaultValue;
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const setPersistedState = React.useCallback(
    (value: T) => {
      setState(value);
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch {
        // Ignore localStorage errors
      }
    },
    [key]
  );

  return [state, setPersistedState];
}

// ============================================
// PROVIDER
// ============================================

export interface CampusProviderProps {
  children: React.ReactNode;
  initialSpaceOrder?: string[];
}

export function CampusProvider({
  children,
  initialSpaceOrder = [],
}: CampusProviderProps) {
  const pathname = usePathname();

  // Responsive detection
  const isMobile = useMediaQuery(`(max-width: ${BREAKPOINTS.MOBILE - 1}px)`);
  const isDesktop = useMediaQuery(`(min-width: ${BREAKPOINTS.DESKTOP}px)`);

  // Drawer state (mobile)
  const [drawerState, setDrawerState] = React.useState<DrawerState>('closed');

  // Spotlight search
  const [isSpotlightOpen, setSpotlightOpen] = React.useState(false);

  // Quick create
  const [isQuickCreateOpen, setQuickCreateOpen] = React.useState(false);

  // Hover preview
  const [hoveredOrbId, setHoveredOrbId] = React.useState<string | null>(null);
  const [previewPosition, setPreviewPosition] = React.useState<{
    x: number;
    y: number;
  } | null>(null);

  // Space order (persisted)
  const [spaceOrder, setSpaceOrder] = usePersistedState<string[]>(
    STORAGE_KEYS.SPACE_ORDER,
    initialSpaceOrder
  );

  // Detect active space from pathname
  const activeSpaceId = React.useMemo(() => {
    if (!pathname) return undefined;
    const match = pathname.match(/^\/spaces\/([^/]+)/);
    if (
      match &&
      match[1] &&
      !['browse', 'create', 'claim', 'search', 's'].includes(match[1])
    ) {
      return match[1];
    }
    return undefined;
  }, [pathname]);

  // Helper functions
  const openDrawer = React.useCallback(() => setDrawerState('peek'), []);
  const closeDrawer = React.useCallback(() => setDrawerState('closed'), []);
  const openSpotlight = React.useCallback(() => setSpotlightOpen(true), []);
  const closeSpotlight = React.useCallback(() => setSpotlightOpen(false), []);

  // Keyboard shortcut: Cmd+K for spotlight
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSpotlightOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Close drawer when switching to desktop
  React.useEffect(() => {
    if (isDesktop && drawerState !== 'closed') {
      setDrawerState('closed');
    }
  }, [isDesktop, drawerState]);

  // Clear hover state when navigating
  React.useEffect(() => {
    setHoveredOrbId(null);
    setPreviewPosition(null);
  }, [pathname]);

  const value = React.useMemo<CampusContextValue>(
    () => ({
      // Drawer
      drawerState,
      setDrawerState,
      openDrawer,
      closeDrawer,

      // Spotlight
      isSpotlightOpen,
      setSpotlightOpen,
      openSpotlight,
      closeSpotlight,

      // Quick create
      isQuickCreateOpen,
      setQuickCreateOpen,

      // Hover preview
      hoveredOrbId,
      setHoveredOrbId,
      previewPosition,
      setPreviewPosition,

      // Space order
      spaceOrder,
      setSpaceOrder,

      // Responsive
      isMobile,
      isDesktop,

      // Context
      activeSpaceId,
    }),
    [
      drawerState,
      openDrawer,
      closeDrawer,
      isSpotlightOpen,
      openSpotlight,
      closeSpotlight,
      isQuickCreateOpen,
      hoveredOrbId,
      previewPosition,
      spaceOrder,
      setSpaceOrder,
      isMobile,
      isDesktop,
      activeSpaceId,
    ]
  );

  return (
    <CampusContext.Provider value={value}>{children}</CampusContext.Provider>
  );
}

// ============================================
// CONSUMER HOOKS
// ============================================

export function useCampus(): CampusContextValue {
  const context = React.useContext(CampusContext);
  if (!context) {
    throw new Error('useCampus must be used within a CampusProvider');
  }
  return context;
}

export function useCampusOptional(): CampusContextValue | null {
  return React.useContext(CampusContext);
}

export default CampusProvider;
