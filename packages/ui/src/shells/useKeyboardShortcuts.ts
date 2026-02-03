/**
 * Shell Keyboard Shortcuts Hook
 *
 * Centralized keyboard navigation for the HIVE Shell.
 * Supports G+key navigation (vim-style), ⌘K command palette, ⌘. space switcher.
 *
 * @example
 * ```tsx
 * useKeyboardShortcuts({
 *   onOpenCommandPalette: () => setCommandPaletteOpen(true),
 *   onOpenSpaceSwitcher: () => setSpaceSwitcherOpen(true),
 *   onNavigate: (path) => router.push(path),
 *   isCommandPaletteOpen,
 * });
 * ```
 */

import { useEffect, useCallback, useRef } from 'react';

// ============================================
// TYPES
// ============================================

export interface UseKeyboardShortcutsOptions {
  /** Handler to open command palette (⌘K) */
  onOpenCommandPalette?: () => void;
  /** Handler to close command palette */
  onCloseCommandPalette?: () => void;
  /** Whether command palette is currently open */
  isCommandPaletteOpen?: boolean;

  /** Handler to toggle space switcher (⌘.) */
  onToggleSpaceSwitcher?: () => void;

  /** Handler for navigation (G + key) */
  onNavigate?: (path: string) => void;

  /** Whether to enable shortcuts (e.g., disable when modal open) */
  enabled?: boolean;
}

// ============================================
// NAVIGATION SHORTCUTS
// ============================================

/**
 * G + key navigation shortcuts.
 * Vim-style navigation: press G, then key within 1 second.
 */
const NAVIGATION_SHORTCUTS: Record<string, string> = {
  f: '/feed',
  s: '/spaces',
  c: '/calendar',
  h: '/tools', // HiveLab
  p: '/me',
  n: '/notifications',
  ',': '/settings',
};

// ============================================
// HOOK
// ============================================

/**
 * Hook for shell keyboard shortcuts.
 * Handles ⌘K (command palette), ⌘. (space switcher), and G+key navigation.
 */
export function useKeyboardShortcuts({
  onOpenCommandPalette,
  onCloseCommandPalette,
  isCommandPaletteOpen = false,
  onToggleSpaceSwitcher,
  onNavigate,
  enabled = true,
}: UseKeyboardShortcutsOptions = {}): void {
  // Track G key state for vim-style navigation
  const gPressedRef = useRef(false);
  const gTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Reset G state
  const resetGState = useCallback(() => {
    gPressedRef.current = false;
    if (gTimeoutRef.current) {
      clearTimeout(gTimeoutRef.current);
      gTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger in input fields
      const target = e.target as HTMLElement;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target.isContentEditable
      ) {
        return;
      }

      // ⌘K or Ctrl+K: Command palette
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenCommandPalette?.();
        return;
      }

      // Escape: Close command palette
      if (e.key === 'Escape' && isCommandPaletteOpen) {
        e.preventDefault();
        onCloseCommandPalette?.();
        return;
      }

      // ⌘. or Ctrl+.: Space switcher
      if (e.key === '.' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onToggleSpaceSwitcher?.();
        return;
      }

      // G key: Start vim-style navigation
      if (e.key === 'g' && !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) {
        gPressedRef.current = true;
        // Reset after 1 second
        gTimeoutRef.current = setTimeout(resetGState, 1000);
        return;
      }

      // Handle G + key navigation
      if (gPressedRef.current && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const keyLower = e.key.toLowerCase();
        const path = NAVIGATION_SHORTCUTS[keyLower];

        if (path) {
          e.preventDefault();
          onNavigate?.(path);
          resetGState();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      resetGState();
    };
  }, [
    enabled,
    isCommandPaletteOpen,
    onOpenCommandPalette,
    onCloseCommandPalette,
    onToggleSpaceSwitcher,
    onNavigate,
    resetGState,
  ]);
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get shortcut display string for a navigation path.
 */
export function getShortcutForPath(path: string): string | undefined {
  for (const [key, shortcutPath] of Object.entries(NAVIGATION_SHORTCUTS)) {
    if (shortcutPath === path) {
      return `G ${key.toUpperCase()}`;
    }
  }
  return undefined;
}

/**
 * All available navigation shortcuts.
 */
export const AVAILABLE_SHORTCUTS = {
  commandPalette: '⌘K',
  spaceSwitcher: '⌘.',
  navigation: Object.entries(NAVIGATION_SHORTCUTS).map(([key, path]) => ({
    key: `G ${key.toUpperCase()}`,
    path,
    label: getPathLabel(path),
  })),
};

/**
 * Get human-readable label for a path.
 */
function getPathLabel(path: string): string {
  const labels: Record<string, string> = {
    '/feed': 'Feed',
    '/spaces': 'Spaces',
    '/calendar': 'Calendar',
    '/tools': 'HiveLab',
    '/me': 'Profile',
    '/notifications': 'Notifications',
    '/settings': 'Settings',
  };
  return labels[path] || path;
}

export default useKeyboardShortcuts;
