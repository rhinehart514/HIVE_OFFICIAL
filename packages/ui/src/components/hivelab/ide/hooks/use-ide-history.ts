'use client';

import { useState, useCallback } from 'react';
import type { CanvasElement, Connection, HistoryEntry } from '../types';
import type { ElementConnection } from '@hive/core';
import { normalizeConnections } from './use-canvas-state';

const MAX_HISTORY = 50;

interface UseIDEHistoryOptions {
  initialElements?: CanvasElement[];
  initialConnections?: ElementConnection[] | Connection[];
}

export function useIDEHistory({
  initialElements,
  initialConnections,
}: UseIDEHistoryOptions) {
  const [history, setHistory] = useState<HistoryEntry[]>(() => [{
    elements: initialElements || [],
    connections: normalizeConnections(initialConnections),
    timestamp: Date.now(),
    description: 'Initial state',
  }]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const pushHistory = useCallback(
    (
      description: string,
      currentElements: CanvasElement[],
      currentConnections: Connection[]
    ) => {
      const entry: HistoryEntry = {
        elements: JSON.parse(JSON.stringify(currentElements)),
        connections: JSON.parse(JSON.stringify(currentConnections)),
        timestamp: Date.now(),
        description,
      };
      setHistory((prev) => {
        const newHistory = [...prev.slice(0, historyIndex + 1), entry];
        if (newHistory.length > MAX_HISTORY) {
          return newHistory.slice(newHistory.length - MAX_HISTORY);
        }
        return newHistory;
      });
      setHistoryIndex((prev) => Math.min(prev + 1, MAX_HISTORY - 1));
    },
    [historyIndex]
  );

  const undo = useCallback((): HistoryEntry | null => {
    if (historyIndex <= 0) return null;
    const previousEntry = history[historyIndex - 1];
    if (previousEntry) {
      setHistoryIndex(historyIndex - 1);
      return previousEntry;
    }
    return null;
  }, [history, historyIndex]);

  const redo = useCallback((): HistoryEntry | null => {
    if (historyIndex >= history.length - 1) return null;
    const nextEntry = history[historyIndex + 1];
    if (nextEntry) {
      setHistoryIndex(historyIndex + 1);
      return nextEntry;
    }
    return null;
  }, [history, historyIndex]);

  return {
    history,
    historyIndex,
    pushHistory,
    undo,
    redo,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
  };
}
