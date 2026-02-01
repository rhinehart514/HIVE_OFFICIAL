'use client';

/**
 * useKeyboardNav - Keyboard navigation for Space Residence
 *
 * Shortcuts:
 * - ↑/↓: Navigate boards
 * - Enter: Open selected board
 * - ⌘K / Ctrl+K: Open search
 * - Escape: Close modals/panels
 *
 * @version 2.0.0 - Split Panel Rebuild (Jan 2026)
 */

import * as React from 'react';

interface UseKeyboardNavOptions {
  /** List of board IDs in order */
  boardIds: string[];
  /** Currently active board */
  activeBoard: string;
  /** Change board handler */
  onBoardChange: (boardId: string) => void;
  /** Open search handler */
  onOpenSearch?: () => void;
  /** Close handler (for modals, panels) */
  onClose?: () => void;
  /** Whether keyboard navigation is enabled */
  enabled?: boolean;
}

export function useKeyboardNav({
  boardIds,
  activeBoard,
  onBoardChange,
  onOpenSearch,
  onClose,
  enabled = true,
}: UseKeyboardNavOptions) {
  // Track highlighted board (for navigation before Enter)
  const [highlightedIndex, setHighlightedIndex] = React.useState<number>(-1);

  // Reset highlighted index when active board changes
  React.useEffect(() => {
    setHighlightedIndex(-1);
  }, [activeBoard]);

  React.useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if focused on input/textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Only allow Escape in inputs
        if (e.key !== 'Escape') return;
      }

      switch (e.key) {
        case 'ArrowUp': {
          e.preventDefault();
          const currentIndex = highlightedIndex >= 0
            ? highlightedIndex
            : boardIds.indexOf(activeBoard);
          const newIndex = Math.max(0, currentIndex - 1);
          setHighlightedIndex(newIndex);
          break;
        }

        case 'ArrowDown': {
          e.preventDefault();
          const currentIndex = highlightedIndex >= 0
            ? highlightedIndex
            : boardIds.indexOf(activeBoard);
          const newIndex = Math.min(boardIds.length - 1, currentIndex + 1);
          setHighlightedIndex(newIndex);
          break;
        }

        case 'Enter': {
          if (highlightedIndex >= 0 && highlightedIndex < boardIds.length) {
            e.preventDefault();
            onBoardChange(boardIds[highlightedIndex]);
            setHighlightedIndex(-1);
          }
          break;
        }

        case 'k': {
          // ⌘K or Ctrl+K for search
          if ((e.metaKey || e.ctrlKey) && onOpenSearch) {
            e.preventDefault();
            onOpenSearch();
          }
          break;
        }

        case 'Escape': {
          if (onClose) {
            e.preventDefault();
            onClose();
          }
          // Reset navigation
          setHighlightedIndex(-1);
          break;
        }

        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [
    enabled,
    boardIds,
    activeBoard,
    highlightedIndex,
    onBoardChange,
    onOpenSearch,
    onClose,
  ]);

  return {
    /** Currently highlighted board index (-1 if none) */
    highlightedIndex,
    /** Highlighted board ID (or null) */
    highlightedBoard: highlightedIndex >= 0 ? boardIds[highlightedIndex] : null,
    /** Reset navigation state */
    resetNavigation: () => setHighlightedIndex(-1),
  };
}

export default useKeyboardNav;
