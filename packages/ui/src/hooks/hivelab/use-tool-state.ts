/**
 * useTool State Hook
 *
 * React hook for managing HiveLab tool state with undo/redo support.
 * Uses Immer for immutable updates and provides keyboard shortcuts.
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import {
  addElement as addElementAction,
  canRedo as checkCanRedo,
  canUndo as checkCanUndo,
  createToolHistory,
  getLastActionDescription,
  redo as redoAction,
  reorderElements as reorderElementsAction,
  removeElement as removeElementAction,
  type Tool,
  type ToolHistory,
  undo as undoAction,
  updateElement as updateElementAction,
  updateTool as updateToolAction,
} from '../../lib/hivelab/tool-state-manager';

export interface UseToolStateOptions {
  initialTool: Tool;
  onAutoSave?: (tool: Tool) => void;
  autoSaveDelay?: number; // milliseconds
}

export interface UseToolStateReturn {
  // Current state
  tool: Tool;
  history: ToolHistory;

  // Actions
  addElement: (elementType: string, position?: number) => void;
  removeElement: (elementId: string) => void;
  updateElement: (elementId: string, updates: any) => void;
  reorderElements: (activeId: string, overId: string) => void;
  updateTool: (updates: Partial<Tool>) => void;

  // Undo/Redo
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  lastAction: string | null;

  // Utility
  reset: () => void;
}

export function useToolState({
  initialTool,
  onAutoSave,
  autoSaveDelay = 10000, // 10 seconds default
}: UseToolStateOptions): UseToolStateReturn {
  const [history, setHistory] = useState<ToolHistory>(() =>
    createToolHistory(initialTool)
  );

  const tool = history.present;
  const canUndo = checkCanUndo(history);
  const canRedo = checkCanRedo(history);
  const lastAction = getLastActionDescription(history);

  // Auto-save on tool changes (debounced)
  useEffect(() => {
    if (!onAutoSave) return;

    const timeoutId = setTimeout(() => {
      onAutoSave(tool);
    }, autoSaveDelay);

    return () => clearTimeout(timeoutId);
  }, [tool, onAutoSave, autoSaveDelay]);

  // Actions
  const addElement = useCallback((elementType: string, position?: number) => {
    setHistory((prev) => addElementAction(prev, elementType, position));
  }, []);

  const removeElement = useCallback((elementId: string) => {
    setHistory((prev) => removeElementAction(prev, elementId));
  }, []);

  const updateElement = useCallback((elementId: string, updates: any) => {
    setHistory((prev) => updateElementAction(prev, elementId, updates));
  }, []);

  const reorderElements = useCallback((activeId: string, overId: string) => {
    setHistory((prev) => reorderElementsAction(prev, activeId, overId));
  }, []);

  const updateTool = useCallback((updates: Partial<Tool>) => {
    setHistory((prev) => updateToolAction(prev, updates));
  }, []);

  const undo = useCallback(() => {
    setHistory((prev) => undoAction(prev));
  }, []);

  const redo = useCallback(() => {
    setHistory((prev) => redoAction(prev));
  }, []);

  const reset = useCallback(() => {
    setHistory(createToolHistory(initialTool));
  }, [initialTool]);

  // Keyboard shortcuts
  useHotkeys('mod+z', (e: KeyboardEvent) => {
    e.preventDefault();
    if (canUndo) undo();
  });

  useHotkeys('mod+shift+z', (e: KeyboardEvent) => {
    e.preventDefault();
    if (canRedo) redo();
  });

  return {
    tool,
    history,
    addElement,
    removeElement,
    updateElement,
    reorderElements,
    updateTool,
    undo,
    redo,
    canUndo,
    canRedo,
    lastAction,
    reset,
  };
}
