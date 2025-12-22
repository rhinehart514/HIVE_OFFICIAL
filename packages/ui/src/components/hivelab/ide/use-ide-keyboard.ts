'use client';

import { useEffect, useCallback } from 'react';
import type { IDEActions, ToolMode } from './types';

interface UseIDEKeyboardOptions {
  actions: Partial<IDEActions>;
  mode: ToolMode;
  setMode: (mode: ToolMode) => void;
  enabled?: boolean;
}

/**
 * Keyboard shortcuts for HiveLab IDE
 *
 * Shortcuts:
 * - V: Select mode
 * - H: Pan mode (hand)
 * - C: Connect mode
 * - Delete/Backspace: Delete selected
 * - Cmd+D: Duplicate selected
 * - Cmd+A: Select all
 * - Escape: Clear selection / Cancel
 * - Cmd+Z: Undo
 * - Cmd+Shift+Z: Redo
 * - Cmd+K: Open AI palette
 * - Cmd+S: Save
 * - Cmd+G: Toggle grid
 * - Cmd+0: Reset zoom
 * - Cmd++: Zoom in
 * - Cmd+-: Zoom out
 * - Space (hold): Temporary pan mode
 */
export function useIDEKeyboard({
  actions,
  mode,
  setMode,
  enabled = true,
}: UseIDEKeyboardOptions) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      // Check if typing in an input
      const target = e.target as HTMLElement;
      const isInputFocused =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      const isMeta = e.metaKey || e.ctrlKey;
      const isShift = e.shiftKey;

      // Shortcuts that work even when typing
      if (isMeta && e.key === 'k') {
        e.preventDefault();
        actions.openAIPanel?.();
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        actions.closeAIPanel?.();
        actions.clearSelection?.();
        return;
      }

      // Shortcuts that don't work when typing in inputs
      if (isInputFocused) return;

      // Tool mode shortcuts
      if (e.key === 'v' || e.key === 'V') {
        e.preventDefault();
        setMode('select');
        return;
      }

      if (e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        setMode('pan');
        return;
      }

      if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        setMode('connect');
        return;
      }

      // Spacebar for temporary pan
      if (e.key === ' ' && !e.repeat) {
        e.preventDefault();
        // Store current mode and switch to pan
        (window as unknown as { __hivePreviousMode?: ToolMode }).__hivePreviousMode = mode;
        setMode('pan');
        return;
      }

      // Delete
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        actions.deleteElements?.([]); // Will use selected IDs
        return;
      }

      // Duplicate (Cmd+D)
      if (isMeta && e.key === 'd') {
        e.preventDefault();
        actions.duplicateElements?.([]); // Will use selected IDs
        return;
      }

      // Copy (Cmd+C)
      if (isMeta && e.key === 'c') {
        e.preventDefault();
        actions.copyElements?.();
        return;
      }

      // Paste (Cmd+V)
      if (isMeta && e.key === 'v') {
        e.preventDefault();
        actions.pasteElements?.();
        return;
      }

      // Cut (Cmd+X)
      if (isMeta && e.key === 'x') {
        e.preventDefault();
        actions.cutElements?.();
        return;
      }

      // Select all (Cmd+A)
      if (isMeta && e.key === 'a') {
        e.preventDefault();
        actions.selectAll?.();
        return;
      }

      // Undo (Cmd+Z)
      if (isMeta && !isShift && e.key === 'z') {
        e.preventDefault();
        actions.undo?.();
        return;
      }

      // Redo (Cmd+Shift+Z)
      if (isMeta && isShift && e.key === 'z') {
        e.preventDefault();
        actions.redo?.();
        return;
      }

      // Save (Cmd+S)
      if (isMeta && e.key === 's') {
        e.preventDefault();
        actions.save?.();
        return;
      }

      // Toggle grid (Cmd+G)
      if (isMeta && e.key === 'g') {
        e.preventDefault();
        actions.toggleGrid?.();
        return;
      }

      // Reset zoom (Cmd+0)
      if (isMeta && e.key === '0') {
        e.preventDefault();
        actions.setZoom?.(1);
        return;
      }

      // Zoom in (Cmd+=)
      if (isMeta && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        // actions.setZoom will be called with current + 0.1
        return;
      }

      // Zoom out (Cmd+-)
      if (isMeta && e.key === '-') {
        e.preventDefault();
        // actions.setZoom will be called with current - 0.1
        return;
      }
    },
    [enabled, actions, mode, setMode]
  );

  const handleKeyUp = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      // Release spacebar - restore previous mode
      if (e.key === ' ') {
        const previousMode = (window as unknown as { __hivePreviousMode?: ToolMode }).__hivePreviousMode;
        if (previousMode) {
          setMode(previousMode);
          delete (window as unknown as { __hivePreviousMode?: ToolMode }).__hivePreviousMode;
        }
      }
    },
    [enabled, setMode]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);
}

/**
 * Keyboard shortcut display helper
 */
export function formatShortcut(
  key: string,
  modifiers: ('meta' | 'ctrl' | 'alt' | 'shift')[] = []
): string {
  const isMac = typeof navigator !== 'undefined' && /Mac/.test(navigator.platform);

  const modMap: Record<string, string> = {
    meta: isMac ? '⌘' : 'Ctrl',
    ctrl: isMac ? '⌃' : 'Ctrl',
    alt: isMac ? '⌥' : 'Alt',
    shift: '⇧',
  };

  const parts = modifiers.map((m) => modMap[m]);
  parts.push(key.toUpperCase());

  return parts.join(isMac ? '' : '+');
}

export const SHORTCUTS = [
  { key: 'V', description: 'Select tool' },
  { key: 'H', description: 'Pan tool (hand)' },
  { key: 'C', description: 'Connect tool' },
  { key: 'Space', description: 'Hold to pan' },
  { key: 'Delete', description: 'Delete selected' },
  { key: '⌘C', description: 'Copy' },
  { key: '⌘V', description: 'Paste' },
  { key: '⌘X', description: 'Cut' },
  { key: '⌘D', description: 'Duplicate' },
  { key: '⌘A', description: 'Select all' },
  { key: '⌘Z', description: 'Undo' },
  { key: '⌘⇧Z', description: 'Redo' },
  { key: '⌘K', description: 'AI Assistant' },
  { key: '⌘S', description: 'Save' },
  { key: '⌘G', description: 'Toggle grid' },
  { key: 'Esc', description: 'Cancel / Deselect' },
];
