'use client';

import { useState, useCallback, useRef } from 'react';
import type { CanvasElement, Connection } from '../types';
import type { AlignmentType } from '../context-rail';
import type { ElementConnection } from '@hive/core';

/**
 * Normalize connections from saved format (ElementConnection) to IDE format (Connection with port keys)
 */
function normalizeConnections(saved?: ElementConnection[] | Connection[]): Connection[] {
  if (!saved || saved.length === 0) return [];
  return saved.map((conn, idx) => {
    const fromConn = conn.from as { instanceId: string; port?: string; output?: string };
    const toConn = conn.to as { instanceId: string; port?: string; input?: string };
    const isIDEFormat = 'port' in fromConn || 'port' in toConn;

    return {
      id: (conn as Connection).id || `conn_${idx}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      from: {
        instanceId: fromConn.instanceId,
        port: isIDEFormat ? (fromConn.port || 'output') : (fromConn.output || 'output'),
      },
      to: {
        instanceId: toConn.instanceId,
        port: isIDEFormat ? (toConn.port || 'input') : (toConn.input || 'input'),
      },
    };
  });
}

export { normalizeConnections };

// Space-tier element IDs that require leader access
const SPACE_TIER_ELEMENTS = [
  'member-list',
  'member-selector',
  'space-events',
  'space-feed',
  'space-stats',
  'announcement',
  'role-gate',
];

interface UseCanvasStateOptions {
  initialElements?: CanvasElement[];
  initialConnections?: ElementConnection[] | Connection[];
  isSpaceLeader?: boolean;
  snapToGrid: boolean;
  gridSize: number;
  pushHistory: (description: string) => void;
}

export function useCanvasState({
  initialElements,
  initialConnections,
  isSpaceLeader,
  snapToGrid,
  gridSize,
  pushHistory,
}: UseCanvasStateOptions) {
  // Canvas elements and connections
  const [elements, setElements] = useState<CanvasElement[]>(initialElements || []);
  const [connections, setConnections] = useState<Connection[]>(() =>
    normalizeConnections(initialConnections)
  );
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGridState, setSnapToGrid] = useState(true);

  // Connection flow feedback
  const [flowingConnections, setFlowingConnections] = useState<Set<string>>(new Set());

  // Clipboard
  const clipboardRef = useRef<CanvasElement[]>([]);

  // Derived state
  const selectedElements = elements.filter((el) => selectedIds.includes(el.id));
  const isCanvasEmpty = elements.length === 0;

  // ---- Element CRUD ----

  const addElement = useCallback(
    (elementId: string, position: { x: number; y: number }) => {
      if (SPACE_TIER_ELEMENTS.includes(elementId) && !isSpaceLeader) {
        console.warn(`Cannot add ${elementId}: requires space leader access`);
        return;
      }

      const newElement: CanvasElement = {
        id: `element_${Date.now()}`,
        elementId,
        instanceId: `${elementId}_${Date.now()}`,
        position,
        size: { width: 240, height: 120 },
        config: {},
        zIndex: elements.length + 1,
        locked: false,
        visible: true,
      };
      setElements((prev) => [...prev, newElement]);
      setSelectedIds([newElement.id]);
      pushHistory(`Add ${elementId}`);
    },
    [elements.length, pushHistory, isSpaceLeader]
  );

  const updateElement = useCallback(
    (id: string, updates: Partial<CanvasElement>) => {
      setElements((prev) =>
        prev.map((el) => (el.id === id ? { ...el, ...updates } : el))
      );
    },
    []
  );

  const deleteElements = useCallback(
    (ids: string[]) => {
      const toDelete = ids.length > 0 ? ids : selectedIds;
      if (toDelete.length === 0) return;

      setElements((prev) => prev.filter((el) => !toDelete.includes(el.id)));
      setConnections((prev) =>
        prev.filter(
          (conn) =>
            !toDelete.some(
              (id) =>
                elements.find((el) => el.id === id)?.instanceId === conn.from.instanceId ||
                elements.find((el) => el.id === id)?.instanceId === conn.to.instanceId
            )
        )
      );
      setSelectedIds([]);
      pushHistory(`Delete ${toDelete.length} element(s)`);
    },
    [selectedIds, elements, pushHistory]
  );

  const duplicateElements = useCallback(
    (ids: string[]) => {
      const toDuplicate = ids.length > 0 ? ids : selectedIds;
      if (toDuplicate.length === 0) return;

      const newElements = elements
        .filter((el) => toDuplicate.includes(el.id))
        .map((el) => ({
          ...el,
          id: `element_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          instanceId: `${el.elementId}_${Date.now()}`,
          position: { x: el.position.x + 30, y: el.position.y + 30 },
          zIndex: elements.length + 1,
        }));

      setElements((prev) => [...prev, ...newElements]);
      setSelectedIds(newElements.map((el) => el.id));
      pushHistory(`Duplicate ${newElements.length} element(s)`);
    },
    [selectedIds, elements, pushHistory]
  );

  // ---- Clipboard ----

  const copyElements = useCallback(() => {
    if (selectedIds.length === 0) return;
    const toCopy = elements.filter((el) => selectedIds.includes(el.id));
    clipboardRef.current = JSON.parse(JSON.stringify(toCopy));
  }, [selectedIds, elements]);

  const pasteElements = useCallback(() => {
    if (clipboardRef.current.length === 0) return;

    const now = Date.now();
    const newElements = clipboardRef.current.map((el, i) => ({
      ...el,
      id: `element_${now}_${i}_${Math.random().toString(36).slice(2)}`,
      instanceId: `${el.elementId}_${now}_${i}`,
      position: { x: el.position.x + 40, y: el.position.y + 40 },
      zIndex: elements.length + i + 1,
    }));

    setElements((prev) => [...prev, ...newElements]);
    setSelectedIds(newElements.map((el) => el.id));
    pushHistory(`Paste ${newElements.length} element(s)`);
  }, [elements.length, pushHistory]);

  const cutElements = useCallback(() => {
    if (selectedIds.length === 0) return;
    copyElements();
    deleteElements([]);
    pushHistory(`Cut ${selectedIds.length} element(s)`);
  }, [selectedIds.length, copyElements, deleteElements, pushHistory]);

  // ---- Selection ----

  const selectElements = useCallback((ids: string[], append = false) => {
    setSelectedIds((prev) => (append ? [...new Set([...prev, ...ids])] : ids));
    if (ids.length > 0) {
      setSelectedConnectionId(null);
    }
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(elements.map((el) => el.id));
    setSelectedConnectionId(null);
  }, [elements]);

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
    setSelectedConnectionId(null);
  }, []);

  // ---- Alignment & Distribution ----

  const alignElements = useCallback(
    (alignment: AlignmentType) => {
      if (selectedIds.length < 2) return;

      const selected = elements.filter((el) => selectedIds.includes(el.id));
      if (selected.length < 2) return;

      let minX = Infinity,
        maxX = -Infinity,
        minY = Infinity,
        maxY = -Infinity;

      selected.forEach((el) => {
        minX = Math.min(minX, el.position.x);
        maxX = Math.max(maxX, el.position.x + el.size.width);
        minY = Math.min(minY, el.position.y);
        maxY = Math.max(maxY, el.position.y + el.size.height);
      });

      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;

      setElements((prev) =>
        prev.map((el) => {
          if (!selectedIds.includes(el.id)) return el;

          let newX = el.position.x;
          let newY = el.position.y;

          switch (alignment) {
            case 'left':
              newX = minX;
              break;
            case 'center':
              newX = centerX - el.size.width / 2;
              break;
            case 'right':
              newX = maxX - el.size.width;
              break;
            case 'top':
              newY = minY;
              break;
            case 'middle':
              newY = centerY - el.size.height / 2;
              break;
            case 'bottom':
              newY = maxY - el.size.height;
              break;
          }

          if (snapToGrid) {
            newX = Math.round(newX / gridSize) * gridSize;
            newY = Math.round(newY / gridSize) * gridSize;
          }

          return {
            ...el,
            position: { x: newX, y: newY },
          };
        })
      );

      pushHistory(`Align ${selected.length} elements (${alignment})`);
    },
    [selectedIds, elements, snapToGrid, gridSize, pushHistory]
  );

  const distributeElements = useCallback(
    (direction: 'horizontal' | 'vertical') => {
      if (selectedIds.length < 3) return;

      const selected = elements.filter((el) => selectedIds.includes(el.id));
      if (selected.length < 3) return;

      const sorted = [...selected].sort((a, b) =>
        direction === 'horizontal'
          ? a.position.x - b.position.x
          : a.position.y - b.position.y
      );

      const first = sorted[0];
      const last = sorted[sorted.length - 1];

      if (direction === 'horizontal') {
        const startX = first.position.x;
        const endX = last.position.x;
        const totalWidth = sorted.reduce((sum, el) => sum + el.size.width, 0);
        const availableSpace = endX + last.size.width - startX - totalWidth;
        const gap = availableSpace / (sorted.length - 1);

        let currentX = startX;

        setElements((prev) =>
          prev.map((el) => {
            const sortIndex = sorted.findIndex((s) => s.id === el.id);
            if (sortIndex === -1) return el;

            let newX = currentX;
            currentX += el.size.width + gap;

            if (snapToGrid) {
              newX = Math.round(newX / gridSize) * gridSize;
            }

            return {
              ...el,
              position: { ...el.position, x: newX },
            };
          })
        );
      } else {
        const startY = first.position.y;
        const endY = last.position.y;
        const totalHeight = sorted.reduce((sum, el) => sum + el.size.height, 0);
        const availableSpace = endY + last.size.height - startY - totalHeight;
        const gap = availableSpace / (sorted.length - 1);

        let currentY = startY;

        setElements((prev) =>
          prev.map((el) => {
            const sortIndex = sorted.findIndex((s) => s.id === el.id);
            if (sortIndex === -1) return el;

            let newY = currentY;
            currentY += el.size.height + gap;

            if (snapToGrid) {
              newY = Math.round(newY / gridSize) * gridSize;
            }

            return {
              ...el,
              position: { ...el.position, y: newY },
            };
          })
        );
      }

      pushHistory(`Distribute ${selected.length} elements (${direction})`);
    },
    [selectedIds, elements, snapToGrid, gridSize, pushHistory]
  );

  // ---- Connections ----

  const triggerConnectionFlow = useCallback(
    (connectionIds: string[], duration = 300) => {
      if (connectionIds.length === 0) return;
      setFlowingConnections((prev) => {
        const next = new Set(prev);
        connectionIds.forEach((id) => next.add(id));
        return next;
      });
      setTimeout(() => {
        setFlowingConnections((prev) => {
          const next = new Set(prev);
          connectionIds.forEach((id) => next.delete(id));
          return next;
        });
      }, duration);
    },
    []
  );

  const getConnectionsFromElement = useCallback(
    (instanceId: string): string[] => {
      return connections
        .filter((conn) => conn.from.instanceId === instanceId)
        .map((conn) => conn.id);
    },
    [connections]
  );

  const addConnection = useCallback(
    (from: Connection['from'], to: Connection['to']) => {
      const connectionId = `conn_${Date.now()}`;
      const newConnection: Connection = { id: connectionId, from, to };
      setConnections((prev) => [...prev, newConnection]);
      pushHistory('Add connection');
      setTimeout(() => triggerConnectionFlow([connectionId]), 50);
    },
    [pushHistory, triggerConnectionFlow]
  );

  const deleteConnection = useCallback(
    (id: string) => {
      setConnections((prev) => prev.filter((conn) => conn.id !== id));
      if (selectedConnectionId === id) {
        setSelectedConnectionId(null);
      }
      pushHistory('Delete connection');
    },
    [pushHistory, selectedConnectionId]
  );

  const updateConnection = useCallback(
    (id: string, updates: Partial<Connection>) => {
      setConnections((prev) =>
        prev.map((conn) => (conn.id === id ? { ...conn, ...updates } : conn))
      );
      pushHistory('Update connection');
    },
    [pushHistory]
  );

  const selectConnection = useCallback(
    (id: string | null) => {
      setSelectedConnectionId(id);
      if (id !== null) {
        setSelectedIds([]);
      }
    },
    []
  );

  // ---- Canvas controls ----

  const fitToScreen = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const toggleGrid = useCallback(() => setShowGrid((prev) => !prev), []);
  const toggleSnap = useCallback(() => setSnapToGrid((prev) => !prev), []);

  return {
    // State
    elements,
    setElements,
    connections,
    setConnections,
    selectedIds,
    selectedConnectionId,
    zoom,
    setZoom,
    pan,
    setPan,
    showGrid,
    snapToGrid: snapToGridState,
    flowingConnections,

    // Derived
    selectedElements,
    isCanvasEmpty,

    // Element ops
    addElement,
    updateElement,
    deleteElements,
    duplicateElements,

    // Clipboard
    copyElements,
    pasteElements,
    cutElements,

    // Selection
    selectElements,
    selectAll,
    clearSelection,

    // Alignment
    alignElements,
    distributeElements,

    // Connections
    addConnection,
    deleteConnection,
    updateConnection,
    selectConnection,
    triggerConnectionFlow,
    getConnectionsFromElement,

    // Canvas controls
    fitToScreen,
    toggleGrid,
    toggleSnap,
  };
}
