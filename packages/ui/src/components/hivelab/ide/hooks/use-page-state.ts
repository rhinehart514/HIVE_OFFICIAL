'use client';

import { useState, useCallback, useRef } from 'react';
import type { CanvasElement, Connection, Page } from '../types';
import type { ElementConnection } from '@hive/core';
import { normalizeConnections } from './use-canvas-state';

interface UsePageStateOptions {
  initialElements?: CanvasElement[];
  initialConnections?: ElementConnection[] | Connection[];
  initialPages?: Page[];
}

function generatePageId(): string {
  return `page_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

/**
 * Wraps legacy single-page tools into a one-page array.
 * If `pages` already exist, returns them.
 */
function initializePages(
  initialPages?: Page[],
  initialElements?: CanvasElement[],
  initialConnections?: ElementConnection[] | Connection[]
): Page[] {
  if (initialPages && initialPages.length > 0) {
    return initialPages;
  }
  return [
    {
      id: generatePageId(),
      name: 'Page 1',
      elements: initialElements || [],
      connections: normalizeConnections(initialConnections),
      isStartPage: true,
    },
  ];
}

export function usePageState({
  initialElements,
  initialConnections,
  initialPages,
}: UsePageStateOptions) {
  const [pages, setPages] = useState<Page[]>(() =>
    initializePages(initialPages, initialElements, initialConnections)
  );
  const [activePageId, setActivePageId] = useState<string>(
    () => pages.find((p) => p.isStartPage)?.id || pages[0]?.id || ''
  );

  const activePage = pages.find((p) => p.id === activePageId) || pages[0];

  /**
   * Sync the active page's elements/connections from canvas state.
   * Called continuously as the canvas is edited so page data stays fresh.
   */
  const syncActivePage = useCallback(
    (elements: CanvasElement[], connections: Connection[]) => {
      setPages((prev) =>
        prev.map((p) =>
          p.id === activePageId ? { ...p, elements, connections } : p
        )
      );
    },
    [activePageId]
  );

  const addPage = useCallback((name?: string) => {
    const newPage: Page = {
      id: generatePageId(),
      name: name || `Page ${pages.length + 1}`,
      elements: [],
      connections: [],
    };
    setPages((prev) => [...prev, newPage]);
    setActivePageId(newPage.id);
    return newPage;
  }, [pages.length]);

  const deletePage = useCallback(
    (pageId: string) => {
      setPages((prev) => {
        if (prev.length <= 1) return prev; // Can't delete last page
        const filtered = prev.filter((p) => p.id !== pageId);
        // If we deleted the start page, assign new start
        if (prev.find((p) => p.id === pageId)?.isStartPage && filtered.length > 0) {
          filtered[0].isStartPage = true;
        }
        return filtered;
      });
      // If we deleted the active page, switch to first page
      if (pageId === activePageId) {
        setActivePageId((prevId) => {
          const remaining = pages.filter((p) => p.id !== pageId);
          return remaining[0]?.id || prevId;
        });
      }
    },
    [activePageId, pages]
  );

  const renamePage = useCallback((pageId: string, name: string) => {
    setPages((prev) =>
      prev.map((p) => (p.id === pageId ? { ...p, name } : p))
    );
  }, []);

  const duplicatePage = useCallback(
    (pageId: string) => {
      const page = pages.find((p) => p.id === pageId);
      if (!page) return;

      const newId = generatePageId();
      const now = Date.now();

      // Deep clone elements with new IDs
      const idMap = new Map<string, string>();
      const newElements: CanvasElement[] = page.elements.map((el, idx) => {
        const newElId = `element_${now}_${idx}`;
        const newInstanceId = `${el.elementId}_${now}_${idx}`;
        idMap.set(el.instanceId, newInstanceId);
        return {
          ...JSON.parse(JSON.stringify(el)),
          id: newElId,
          instanceId: newInstanceId,
        };
      });

      // Remap connections
      const newConnections: Connection[] = page.connections.map((conn, idx) => ({
        id: `conn_${now}_${idx}`,
        from: {
          instanceId: idMap.get(conn.from.instanceId) || conn.from.instanceId,
          port: conn.from.port,
        },
        to: {
          instanceId: idMap.get(conn.to.instanceId) || conn.to.instanceId,
          port: conn.to.port,
        },
        transform: conn.transform,
      }));

      const newPage: Page = {
        id: newId,
        name: `${page.name} (copy)`,
        elements: newElements,
        connections: newConnections,
      };

      setPages((prev) => {
        const idx = prev.findIndex((p) => p.id === pageId);
        const copy = [...prev];
        copy.splice(idx + 1, 0, newPage);
        return copy;
      });
      setActivePageId(newId);
    },
    [pages]
  );

  const reorderPages = useCallback((fromIndex: number, toIndex: number) => {
    setPages((prev) => {
      const copy = [...prev];
      const [moved] = copy.splice(fromIndex, 1);
      copy.splice(toIndex, 0, moved);
      return copy;
    });
  }, []);

  const setStartPage = useCallback((pageId: string) => {
    setPages((prev) =>
      prev.map((p) => ({
        ...p,
        isStartPage: p.id === pageId,
      }))
    );
  }, []);

  const isMultiPage = pages.length > 1;

  return {
    pages,
    setPages,
    activePageId,
    setActivePageId,
    activePage,
    isMultiPage,
    syncActivePage,
    addPage,
    deletePage,
    renamePage,
    duplicatePage,
    reorderPages,
    setStartPage,
  };
}
