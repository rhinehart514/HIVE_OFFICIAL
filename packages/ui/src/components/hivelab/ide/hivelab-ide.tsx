'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useStreamingGeneration } from '@hive/hooks';
import { cn } from '../../../lib/utils';
import type {
  CanvasElement,
  Connection,
  ToolMode,
  HistoryEntry,
} from './types';
import type { ElementConnection } from '@hive/core';
import { IDECanvas } from './ide-canvas';
import { useIDEKeyboard } from './use-ide-keyboard';

// New layout components
import { ElementRail, type RailState, type RailTab, type UserToolItem } from './element-rail';
import { ContextRail, type AlignmentType } from './context-rail';
import { FloatingActionBar, type FloatingActionBarRef } from './floating-action-bar';
import { TemplateOverlay } from './template-overlay';
import { TemplateGallery } from './template-gallery';
import { AIChatPill, type AIChatPillRef } from './ai-chat-pill';
import { CanvasMinimap } from './canvas-minimap';
import { toast } from 'sonner';

// Sprint 4: Automations
import type { AutomationSummary } from './automations-panel';
import { AutomationBuilderModal, type AutomationData } from './automation-builder-modal';
import { AutomationLogsViewer, type AutomationRun } from './automation-logs-viewer';

// Mobile detection hook
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}
import type { ToolComposition } from '../../../lib/hivelab/element-system';

// Maximum history entries to prevent unbounded memory growth
const MAX_HISTORY = 50;

/**
 * Normalize connections to IDE format (Connection with { port } keys)
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

export interface UserContext {
  userId?: string;
  campusId?: string;
  isSpaceLeader?: boolean;
  leadingSpaceIds?: string[];
}

export interface HiveLabIDEProps {
  initialComposition?: {
    id?: string;
    name?: string;
    description?: string;
    elements?: CanvasElement[];
    connections?: ElementConnection[] | Connection[];
  };
  showOnboarding?: boolean;
  onSave: (composition: HiveLabComposition) => Promise<void>;
  onPreview: (composition: HiveLabComposition) => void;
  onCancel: () => void;
  userId: string;
  userContext?: UserContext;
  onConnectionFlowReady?: (controls: ConnectionFlowControls) => void;
  originSpaceId?: string;
  onDeploy?: (composition: HiveLabComposition) => Promise<void>;
  /** User's tools for the "Your Tools" drawer */
  userTools?: UserToolItem[];
  /** Callback when user selects a tool from the drawer */
  onToolSelect?: (id: string) => void;
  /** Callback when user clicks "New Tool" */
  onNewTool?: () => void;
  /** Initial prompt to pre-fill AI palette (opens AI panel on mount) */
  initialPrompt?: string | null;
}

export interface ConnectionFlowControls {
  triggerFlow: (connectionIds: string[], duration?: number) => void;
  getConnectionsFrom: (instanceId: string) => string[];
}

export interface HiveLabComposition {
  id: string;
  name: string;
  description: string;
  elements: CanvasElement[];
  connections: Connection[];
  layout: 'grid' | 'flow' | 'tabs' | 'sidebar';
}

// Mobile gate component
function MobileGate({ onBack }: { onBack: () => void }) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6 text-center"
      style={{ backgroundColor: 'var(--hivelab-bg, #0A0A0A)' }}
    >
      <div className="max-w-sm">
        {/* Icon */}
        <div
          className="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: 'var(--hivelab-surface, #1A1A1A)' }}
        >
          <svg
            className="w-8 h-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
            style={{ color: 'var(--life-gold, #D4AF37)' }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25"
            />
          </svg>
        </div>

        {/* Title */}
        <h1
          className="text-xl font-semibold mb-2"
          style={{ color: 'var(--hivelab-text-primary, #FAF9F7)' }}
        >
          Desktop Required
        </h1>

        {/* Description */}
        <p
          className="text-sm mb-6 leading-relaxed"
          style={{ color: 'var(--hivelab-text-secondary, #8A8A8A)' }}
        >
          HiveLab's visual builder requires a larger screen. Open this page on
          your laptop or desktop for the best experience.
        </p>

        {/* Back button */}
        <button
          type="button"
          onClick={onBack}
          className="px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
          style={{
            backgroundColor: 'var(--hivelab-surface, #1A1A1A)',
            color: 'var(--hivelab-text-primary, #FAF9F7)',
            border: '1px solid var(--hivelab-border, rgba(255, 255, 255, 0.08))',
          }}
        >
          Go Back
        </button>
      </div>
    </div>
  );
}

export function HiveLabIDE({
  initialComposition,
  onSave,
  onPreview,
  onCancel,
  userId,
  userContext,
  onConnectionFlowReady,
  originSpaceId,
  onDeploy,
  userTools,
  onToolSelect,
  onNewTool,
  initialPrompt,
}: HiveLabIDEProps) {
  // Mobile gate
  const isMobile = useIsMobile();

  // Tool metadata
  const [toolId] = useState(initialComposition?.id || `tool_${Date.now()}`);
  const [toolName, setToolName] = useState(initialComposition?.name || '');
  const [toolDescription] = useState(initialComposition?.description || '');

  // Canvas state
  const [elements, setElements] = useState<CanvasElement[]>(
    initialComposition?.elements || []
  );
  const [connections, setConnections] = useState<Connection[]>(() =>
    normalizeConnections(initialComposition?.connections)
  );
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const gridSize = 20;

  // UI state - new layout
  const [mode, setMode] = useState<ToolMode>('select');
  // Start collapsed like Make.com - icon-only sidebar by default
  const [elementRailState, setElementRailState] = useState<RailState>('collapsed');
  const [elementRailTab, setElementRailTab] = useState<RailTab>('elements');
  const [templateGalleryOpen, setTemplateGalleryOpen] = useState(false);

  // Sprint 4: Automations state
  const [automations, setAutomations] = useState<AutomationSummary[]>([]);
  const [automationsLoading, setAutomationsLoading] = useState(false);
  const [automationBuilderOpen, setAutomationBuilderOpen] = useState(false);
  const [automationLogsOpen, setAutomationLogsOpen] = useState(false);
  const [editingAutomation, setEditingAutomation] = useState<AutomationData | null>(null);
  const [viewingAutomationId, setViewingAutomationId] = useState<string | null>(null);
  const [automationRuns, setAutomationRuns] = useState<AutomationRun[]>([]);
  const [automationRunsLoading, setAutomationRunsLoading] = useState(false);

  // Ref for floating action bar (includes AI input)
  const floatingBarRef = useRef<FloatingActionBarRef>(null);
  // Ref for AI chat pill
  const aiChatPillRef = useRef<AIChatPillRef>(null);
  // AI chat dock position
  const [aiChatDock, setAIChatDock] = useState<'float' | 'left'>('float');
  const [saving, setSaving] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [showDeploySuccess, setShowDeploySuccess] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastAutoSave, setLastAutoSave] = useState<number>(0);

  // History for undo/redo - initialize with current state
  const [history, setHistory] = useState<HistoryEntry[]>(() => [{
    elements: initialComposition?.elements || [],
    connections: normalizeConnections(initialComposition?.connections),
    timestamp: Date.now(),
    description: 'Initial state',
  }]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Connection flow feedback
  const [flowingConnections, setFlowingConnections] = useState<Set<string>>(new Set());

  // Memoized confetti particles for deploy celebration
  const confettiParticles = useMemo(() => {
    if (!showDeploySuccess) return [];
    return Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      targetX: 50 + (Math.random() - 0.5) * 80,
      targetY: 50 + (Math.random() - 0.5) * 80,
      rotation: Math.random() * 360,
      delay: Math.random() * 0.3,
      size: Math.random() * 8 + 4,
      color: ['#FFD700', '#FFA500', '#FFDF00', '#DAA520'][Math.floor(Math.random() * 4)],
      isCircle: Math.random() > 0.5,
    }));
  }, [showDeploySuccess]);

  // Refs
  const draggingElementId = useRef<string | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 1000, height: 800 });

  // Track canvas container size for minimap
  useEffect(() => {
    if (!canvasContainerRef.current) return;

    const updateSize = () => {
      if (canvasContainerRef.current) {
        const { width, height } = canvasContainerRef.current.getBoundingClientRect();
        setCanvasSize({ width, height });
      }
    };

    // Initial size
    updateSize();

    // ResizeObserver for dynamic updates
    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(canvasContainerRef.current);

    return () => resizeObserver.disconnect();
  }, []);

  // Derived state
  const selectedElements = elements.filter((el) => selectedIds.includes(el.id));
  const isCanvasEmpty = elements.length === 0;

  // Track unsaved changes
  useEffect(() => {
    if (elements.length > 0 || connections.length > 0) {
      setHasUnsavedChanges(true);
    }
  }, [elements, connections]);

  // Warn user before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Auto-save every 30 seconds when there are unsaved changes
  useEffect(() => {
    // Don't auto-save if there are no unsaved changes or already saving
    if (!hasUnsavedChanges || saving) return;

    // Don't auto-save if elements is empty (no real content yet)
    if (elements.length === 0) return;

    const AUTO_SAVE_INTERVAL = 30000; // 30 seconds

    const timeoutId = setTimeout(async () => {
      // Double-check we still have unsaved changes and aren't saving
      if (!hasUnsavedChanges || saving) return;

      try {
        setSaving(true);
        const composition: HiveLabComposition = {
          id: toolId,
          name: toolName || 'Untitled Tool',
          description: toolDescription,
          elements,
          connections,
          layout: 'grid',
        };
        await onSave(composition);
        setHasUnsavedChanges(false);
        setLastAutoSave(Date.now());
      } catch (error) {
        console.error('Auto-save failed:', error);
        // Show a warning toast so user knows to manually save
        toast.warning('Auto-save failed', { description: 'Your changes are not saved. Please save manually.' });
      } finally {
        setSaving(false);
      }
    }, AUTO_SAVE_INTERVAL);

    return () => clearTimeout(timeoutId);
  }, [hasUnsavedChanges, saving, elements, connections, toolId, toolName, toolDescription, onSave]);

  // Push to history with MAX_HISTORY limit
  const pushHistory = useCallback(
    (description: string) => {
      const entry: HistoryEntry = {
        elements: JSON.parse(JSON.stringify(elements)),
        connections: JSON.parse(JSON.stringify(connections)),
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
    [elements, connections, historyIndex]
  );

  // Undo/Redo
  const undo = useCallback(() => {
    // Can't undo if we're at the initial state (index 0)
    if (historyIndex <= 0) return;
    const previousEntry = history[historyIndex - 1];
    if (previousEntry) {
      setElements(previousEntry.elements);
      setConnections(previousEntry.connections);
      setHistoryIndex(historyIndex - 1);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    // Can't redo if we're at the latest state
    if (historyIndex >= history.length - 1) return;
    const nextEntry = history[historyIndex + 1];
    if (nextEntry) {
      setElements(nextEntry.elements);
      setConnections(nextEntry.connections);
      setHistoryIndex(historyIndex + 1);
    }
  }, [history, historyIndex]);

  // Space-tier element IDs
  const SPACE_TIER_ELEMENTS = [
    'member-list',
    'member-selector',
    'space-events',
    'space-feed',
    'space-stats',
    'announcement',
    'role-gate',
  ];

  // Element operations
  const addElement = useCallback(
    (elementId: string, position: { x: number; y: number }) => {
      if (SPACE_TIER_ELEMENTS.includes(elementId) && !userContext?.isSpaceLeader) {
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
    [elements.length, pushHistory, userContext?.isSpaceLeader]
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

  // Clipboard
  const clipboardRef = useRef<CanvasElement[]>([]);
  // Track which AI elements have been processed to prevent duplicate additions
  const processedAIElementIdsRef = useRef<Set<string>>(new Set());

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

  // Alignment
  const alignElements = useCallback(
    (alignment: AlignmentType) => {
      if (selectedIds.length < 2) return;

      const selected = elements.filter((el) => selectedIds.includes(el.id));
      if (selected.length < 2) return;

      // Calculate bounding box of selected elements
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

          // Snap to grid if enabled
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

  // Distribute elements evenly
  const distributeElements = useCallback(
    (direction: 'horizontal' | 'vertical') => {
      if (selectedIds.length < 3) return; // Need at least 3 elements to distribute

      const selected = elements.filter((el) => selectedIds.includes(el.id));
      if (selected.length < 3) return;

      // Sort elements by position
      const sorted = [...selected].sort((a, b) =>
        direction === 'horizontal'
          ? a.position.x - b.position.x
          : a.position.y - b.position.y
      );

      // Calculate total span
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

            // Snap to grid if enabled
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

            // Snap to grid if enabled
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

  // Selection
  const selectElements = useCallback((ids: string[], append = false) => {
    setSelectedIds((prev) => (append ? [...new Set([...prev, ...ids])] : ids));
    // Clear connection selection when selecting elements (mutually exclusive)
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

  // Connection flow feedback
  const triggerConnectionFlow = useCallback(
    (connectionIds: string[], duration = 600) => {
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

  // Connections
  const addConnection = useCallback(
    (from: Connection['from'], to: Connection['to']) => {
      const connectionId = `conn_${Date.now()}`;
      const newConnection: Connection = { id: connectionId, from, to };
      setConnections((prev) => [...prev, newConnection]);
      pushHistory('Add connection');
      setTimeout(() => triggerConnectionFlow([connectionId], 800), 50);
    },
    [pushHistory, triggerConnectionFlow]
  );

  const deleteConnection = useCallback(
    (id: string) => {
      setConnections((prev) => prev.filter((conn) => conn.id !== id));
      // Clear selection if deleting selected connection
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
      // Clear element selection when selecting a connection (mutually exclusive)
      if (id !== null) {
        setSelectedIds([]);
      }
    },
    []
  );

  // Expose flow controls
  useEffect(() => {
    if (onConnectionFlowReady) {
      onConnectionFlowReady({
        triggerFlow: triggerConnectionFlow,
        getConnectionsFrom: getConnectionsFromElement,
      });
    }
  }, [onConnectionFlowReady, triggerConnectionFlow, getConnectionsFromElement]);

  // Canvas controls
  const fitToScreen = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  // Save
  const save = useCallback(async () => {
    setSaving(true);
    try {
      const composition: HiveLabComposition = {
        id: toolId,
        name: toolName || 'Untitled Tool',
        description: toolDescription,
        elements,
        connections,
        layout: 'grid',
      };
      await onSave(composition);
      setHasUnsavedChanges(false);
      toast.success('Tool saved', { description: 'Your changes have been saved.' });
    } catch (error) {
      console.error('Save failed:', error);
      toast.error('Failed to save tool', {
        description: error instanceof Error ? error.message : 'Please try again.'
      });
    } finally {
      setSaving(false);
    }
  }, [toolId, toolName, toolDescription, elements, connections, onSave]);

  // Deploy
  const deploy = useCallback(async () => {
    if (!onDeploy) return;
    setSaving(true);
    setDeploying(true);
    try {
      const composition: HiveLabComposition = {
        id: toolId,
        name: toolName || 'Untitled Tool',
        description: toolDescription,
        elements,
        connections,
        layout: 'grid',
      };
      await onSave(composition);
      await onDeploy(composition);
      setHasUnsavedChanges(false);
      setShowDeploySuccess(true);
    } catch (error) {
      console.error('Deploy failed:', error);
      toast.error('Failed to deploy tool', {
        description: error instanceof Error ? error.message : 'Please try again.'
      });
    } finally {
      setSaving(false);
      setDeploying(false);
    }
  }, [toolId, toolName, toolDescription, elements, connections, onSave, onDeploy]);

  // Preview
  const preview = useCallback(() => {
    const composition: HiveLabComposition = {
      id: toolId,
      name: toolName || 'Untitled Tool',
      description: toolDescription,
      elements,
      connections,
      layout: 'grid',
    };
    onPreview(composition);
  }, [toolId, toolName, toolDescription, elements, connections, onPreview]);

  // AI streaming generation
  const { state: aiState, generate, cancel: cancelGeneration } = useStreamingGeneration({
    onComplete: () => pushHistory('AI generation complete'),
    onError: () => {},
    onStatusUpdate: () => {},
    onElementAdded: () => {},
  });

  // Position helper for AI
  const getPositionNearSelection = useCallback(() => {
    if (selectedIds.length === 0) return { x: 100, y: 100 };
    const selected = elements.filter(el => selectedIds.includes(el.id));
    if (selected.length === 0) return { x: 100, y: 100 };
    const maxX = Math.max(...selected.map(el => el.position.x + (el.size?.width || 240)));
    const avgY = selected.reduce((sum, el) => sum + el.position.y, 0) / selected.length;
    return { x: maxX + 40, y: avgY };
  }, [elements, selectedIds]);

  // Merge AI elements - only process new elements that haven't been added yet
  useEffect(() => {
    if (aiState.elements.length > 0 && !aiState.isGenerating) {
      // Filter to only elements we haven't processed yet
      const newElements = aiState.elements.filter(
        el => el.instanceId && !processedAIElementIdsRef.current.has(el.instanceId)
      );

      if (newElements.length === 0) return;

      const insertPosition = getPositionNearSelection();
      const timestamp = Date.now();
      const canvasElements: CanvasElement[] = newElements.map((el, index) => ({
        id: `element_${timestamp}_${index}`,
        elementId: el.elementId || 'unknown',
        instanceId: el.instanceId || `${el.elementId}_${timestamp}_${index}`,
        position: el.position || {
          x: insertPosition.x + (index % 3) * 280,
          y: insertPosition.y + Math.floor(index / 3) * 160,
        },
        size: el.size || { width: 260, height: 140 },
        config: el.config || {},
        zIndex: elements.length + index + 1,
        locked: false,
        visible: true,
      }));

      // Mark these elements as processed
      newElements.forEach(el => {
        if (el.instanceId) {
          processedAIElementIdsRef.current.add(el.instanceId);
        }
      });

      if (canvasElements.length > 0) {
        setElements(prev => [...prev, ...canvasElements]);
        setSelectedIds(canvasElements.map(el => el.id));
      }
    }
  }, [aiState.elements, aiState.isGenerating, getPositionNearSelection]);

  // AI handler
  const handleAISubmit = useCallback(async (prompt: string, type: string) => {
    const selectedEls = elements.filter(el => selectedIds.includes(el.id));
    const hasSelection = selectedEls.length > 0;
    const isIteration = type === 'modify' || type === 'iterate' || hasSelection;
    const elementsForContext = hasSelection ? selectedEls : elements;

    const existingComposition = isIteration ? {
      id: toolId,
      name: toolName || 'Untitled Tool',
      description: toolDescription,
      elements: elementsForContext.map(el => ({
        elementId: el.elementId,
        instanceId: el.instanceId,
        type: el.elementId,
        name: el.elementId,
        config: el.config,
        position: el.position,
        size: el.size,
      })),
      connections: connections.filter(conn =>
        elementsForContext.some(el =>
          el.instanceId === conn.from.instanceId || el.instanceId === conn.to.instanceId
        )
      ).map(conn => ({
        from: { instanceId: conn.from.instanceId, output: conn.from.port || 'default' },
        to: { instanceId: conn.to.instanceId, input: conn.to.port || 'default' },
      })),
      layout: 'flow' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } : undefined;

    const selectionContext = hasSelection ? {
      count: selectedEls.length,
      types: selectedEls.map(el => el.elementId),
      prompt: `Acting on ${selectedEls.length} selected element(s): ${selectedEls.map(el => el.elementId).join(', ')}`,
    } : undefined;

    await generate({
      prompt: selectionContext ? `${selectionContext.prompt}. ${prompt}` : prompt,
      isIteration,
      existingComposition,
    });
  }, [generate, toolId, toolName, toolDescription, elements, connections, selectedIds]);

  // Handle quick prompt from StartZone
  const handleQuickPrompt = useCallback((prompt: string) => {
    floatingBarRef.current?.focusInput();
    // Submit the prompt directly
    setTimeout(() => {
      handleAISubmit(prompt, 'generate');
    }, 100);
  }, [handleAISubmit]);

  // Toggle element rail
  const toggleElementRail = useCallback(() => {
    setElementRailState(prev => {
      if (prev === 'expanded') return 'collapsed';
      if (prev === 'collapsed') return 'hidden';
      return 'expanded';
    });
  }, []);

  // Open elements (expand rail to elements tab)
  const openElements = useCallback(() => {
    setElementRailState('expanded');
    setElementRailTab('elements');
  }, []);

  // Open templates
  const openTemplates = useCallback(() => {
    setTemplateGalleryOpen(true);
  }, []);

  // Auto-focus AI chat bar with initial prompt on mount
  useEffect(() => {
    if (initialPrompt && elements.length === 0) {
      floatingBarRef.current?.focusInput();
    }
  }, [initialPrompt, elements.length]);

  // Load template composition into canvas
  const loadTemplateComposition = useCallback(
    (composition: ToolComposition) => {
      // Convert template elements to canvas elements
      const newElements: CanvasElement[] = composition.elements.map((el, idx) => ({
        id: `element_${Date.now()}_${idx}`,
        elementId: el.elementId,
        instanceId: el.instanceId,
        position: el.position || { x: 100 + idx * 50, y: 100 + idx * 50 },
        size: el.size || { width: 240, height: 120 },
        config: el.config || {},
        zIndex: idx + 1,
        locked: false,
        visible: true,
      }));

      // Convert connections
      const newConnections: Connection[] = (composition.connections || []).map((conn, idx) => ({
        id: `conn_${Date.now()}_${idx}`,
        from: {
          instanceId: conn.from.instanceId,
          port: conn.from.output || 'output',
        },
        to: {
          instanceId: conn.to.instanceId,
          port: conn.to.input || 'input',
        },
      }));

      setElements(newElements);
      setConnections(newConnections);
      setToolName(composition.name || 'Untitled Tool');
      setSelectedIds([]);
      pushHistory(`Load template: ${composition.name}`);
      setTemplateGalleryOpen(false);
    },
    [pushHistory]
  );

  // ============================================================================
  // Sprint 4: Automation Handlers
  // ============================================================================

  // Open automation builder for creating a new automation
  const handleCreateAutomation = useCallback(() => {
    setEditingAutomation(null);
    setAutomationBuilderOpen(true);
  }, []);

  // Open automation builder for editing an existing automation
  const handleEditAutomation = useCallback((id: string) => {
    const automation = automations.find(a => a.id === id);
    if (automation) {
      // Convert AutomationSummary to AutomationData for editing
      setEditingAutomation({
        id: automation.id,
        name: automation.name,
        enabled: automation.enabled,
        trigger: {
          type: automation.triggerType,
          // These would be fetched from the full automation data in a real implementation
        } as AutomationData['trigger'],
        conditions: [],
        actions: [],
        limits: { maxRunsPerDay: 100, cooldownSeconds: 60 },
      });
      setAutomationBuilderOpen(true);
    }
  }, [automations]);

  // Delete an automation
  const handleDeleteAutomation = useCallback(async (id: string) => {
    // In a real implementation, this would call the API
    setAutomations(prev => prev.filter(a => a.id !== id));
    toast.success('Automation deleted');
  }, []);

  // Toggle automation enabled state
  const handleToggleAutomation = useCallback(async (id: string, enabled: boolean) => {
    // In a real implementation, this would call the API
    setAutomations(prev =>
      prev.map(a => a.id === id ? { ...a, enabled } : a)
    );
    toast.success(enabled ? 'Automation enabled' : 'Automation paused');
  }, []);

  // View automation logs
  const handleViewAutomationLogs = useCallback((id: string) => {
    setViewingAutomationId(id);
    setAutomationLogsOpen(true);
    // In a real implementation, this would fetch logs from the API
    setAutomationRunsLoading(true);
    // Simulate loading logs
    setTimeout(() => {
      setAutomationRuns([]);
      setAutomationRunsLoading(false);
    }, 500);
  }, []);

  // Run automation immediately
  const handleRunAutomationNow = useCallback(async (id: string) => {
    // In a real implementation, this would call the API
    toast.success('Automation triggered');
  }, []);

  // Save automation from builder
  const handleSaveAutomation = useCallback(async (data: AutomationData) => {
    if (data.id) {
      // Update existing
      setAutomations(prev =>
        prev.map(a => a.id === data.id ? {
          ...a,
          name: data.name,
          enabled: data.enabled,
          triggerType: data.trigger.type,
          triggerSummary: getTriggerSummary(data.trigger),
        } : a)
      );
      toast.success('Automation updated');
    } else {
      // Create new
      const newAutomation: AutomationSummary = {
        id: `auto_${Date.now()}`,
        name: data.name,
        enabled: data.enabled,
        triggerType: data.trigger.type,
        triggerSummary: getTriggerSummary(data.trigger),
        runCount: 0,
        errorCount: 0,
      };
      setAutomations(prev => [...prev, newAutomation]);
      toast.success('Automation created');
    }
    setAutomationBuilderOpen(false);
    setEditingAutomation(null);
  }, []);

  // Helper to generate trigger summary text
  function getTriggerSummary(trigger: AutomationData['trigger']): string {
    switch (trigger.type) {
      case 'event':
        return `When ${trigger.event || 'event'} occurs`;
      case 'schedule':
        return `Every ${trigger.cron || 'day'}`;
      case 'threshold':
        return `When ${trigger.path || 'value'} ${trigger.operator || '>'} ${trigger.value || 0}`;
      default:
        return 'Manual trigger';
    }
  }

  // Keyboard shortcuts
  useIDEKeyboard({
    actions: {
      deleteElements,
      duplicateElements,
      copyElements,
      pasteElements,
      cutElements,
      selectAll,
      clearSelection,
      undo,
      redo,
      save,
      toggleGrid: () => setShowGrid((prev) => !prev),
      setZoom,
      openAIPanel: () => {
        floatingBarRef.current?.focusInput();
        aiChatPillRef.current?.focusInput();
      },
      closeAIPanel: () => {
        aiChatPillRef.current?.collapse();
      }
    },
    mode,
    setMode,
    enabled: true,
    zoom,
  });

  // Show mobile gate on small screens
  if (isMobile) {
    return <MobileGate onBack={onCancel} />;
  }

  return (
    <div
      className="h-full w-full flex overflow-hidden bg-[var(--hivelab-bg)]"
    >
        {/* Element Rail (Left) */}
        <ElementRail
          state={elementRailState}
          onStateChange={setElementRailState}
          activeTab={elementRailTab}
          onTabChange={setElementRailTab}
          elements={elements}
          connections={connections}
          selectedIds={selectedIds}
          onDragStart={(id) => {
            draggingElementId.current = id;
          }}
          onDragEnd={() => {
            draggingElementId.current = null;
          }}
          onSelect={selectElements}
          onUpdateElement={updateElement}
          onDeleteElement={(id) => deleteElements([id])}
          onDuplicateElement={(id) => duplicateElements([id])}
          onReorder={setElements}
          onOpenAI={() => floatingBarRef.current?.focusInput()}
          onOpenTemplates={openTemplates}
          userContext={userContext}
          userTools={userTools}
          onToolSelect={onToolSelect}
          onNewTool={onNewTool}
          // Sprint 4: Automations
          automations={automations}
          automationsLoading={automationsLoading}
          onCreateAutomation={handleCreateAutomation}
          onEditAutomation={handleEditAutomation}
          onDeleteAutomation={handleDeleteAutomation}
          onToggleAutomation={handleToggleAutomation}
          onViewAutomationLogs={handleViewAutomationLogs}
          onRunAutomationNow={handleRunAutomationNow}
        />

        {/* Canvas Area */}
        <div ref={canvasContainerRef} className="flex-1 flex flex-col relative">
          {/* Template Overlay - shown when canvas is empty */}
          <AnimatePresence>
            {isCanvasEmpty && !aiState.isGenerating && (
              <TemplateOverlay
                onSelectTemplate={loadTemplateComposition}
                onStartFromScratch={openElements}
                onOpenAI={() => {
                  floatingBarRef.current?.focusInput();
                  aiChatPillRef.current?.expand();
                }}
                onSeeAllTemplates={openTemplates}
              />
            )}
          </AnimatePresence>

          {/* Canvas */}
          <IDECanvas
            elements={elements}
            connections={connections}
            selectedIds={selectedIds}
            selectedConnectionId={selectedConnectionId}
            zoom={zoom}
            pan={pan}
            showGrid={showGrid}
            gridSize={gridSize}
            snapToGrid={snapToGrid}
            mode={mode}
            flowingConnections={flowingConnections}
            onSelect={selectElements}
            onUpdateElement={updateElement}
            onDeleteElements={deleteElements}
            onAddConnection={addConnection}
            onUpdateConnection={updateConnection}
            onDeleteConnection={deleteConnection}
            onSelectConnection={selectConnection}
            onZoomChange={setZoom}
            onPanChange={setPan}
            onDrop={addElement}
            onTransformEnd={() => pushHistory('Transform element')}
          />

          {/* Minimap - shows overview of canvas for large tools */}
          {!isCanvasEmpty && (
            <CanvasMinimap
              elements={elements}
              connections={connections}
              selectedIds={selectedIds}
              zoom={zoom}
              pan={pan}
              containerWidth={canvasSize.width}
              containerHeight={canvasSize.height}
              onPanChange={setPan}
            />
          )}
        </div>

        {/* Context Rail (Right) - auto-show on selection */}
        <ContextRail
          selectedElements={selectedElements}
          allElements={elements}
          connections={connections}
          selectedConnectionId={selectedConnectionId}
          onUpdateElement={updateElement}
          onDeleteElements={deleteElements}
          onDuplicateElements={duplicateElements}
          onAlignElements={alignElements}
          onDistributeElements={distributeElements}
          onUpdateConnection={updateConnection}
          onDeleteConnection={deleteConnection}
        />

      {/* Unified Floating Action Bar with AI Input */}
      <FloatingActionBar
        ref={floatingBarRef}
        zoom={zoom}
        onZoomChange={setZoom}
        showGrid={showGrid}
        onToggleGrid={() => setShowGrid(prev => !prev)}
        onFitToScreen={fitToScreen}
        snapToGrid={snapToGrid}
        onToggleSnap={() => setSnapToGrid(prev => !prev)}
        onUndo={undo}
        onRedo={redo}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onAISubmit={handleAISubmit}
        aiLoading={aiState.isGenerating}
        aiStreamingText={aiState.currentStatus}
        selectedCount={selectedIds.length}
        onAICancel={cancelGeneration}
        initialPrompt={initialPrompt}
      />

      {/* Template Gallery Modal */}
      <TemplateGallery
        isOpen={templateGalleryOpen}
        onClose={() => setTemplateGalleryOpen(false)}
        onSelectTemplate={loadTemplateComposition}
      />

      {/* Sprint 4: Automation Builder Modal */}
      <AutomationBuilderModal
        isOpen={automationBuilderOpen}
        onClose={() => {
          setAutomationBuilderOpen(false);
          setEditingAutomation(null);
        }}
        onSave={handleSaveAutomation}
        initialData={editingAutomation || undefined}
        elements={elements}
        mode={editingAutomation ? 'edit' : 'create'}
      />

      {/* Sprint 4: Automation Logs Viewer */}
      <AutomationLogsViewer
        isOpen={automationLogsOpen}
        onClose={() => {
          setAutomationLogsOpen(false);
          setViewingAutomationId(null);
        }}
        automationName={automations.find(a => a.id === viewingAutomationId)?.name || 'Automation'}
        runs={automationRuns}
        loading={automationRunsLoading}
        onRefresh={() => {
          setAutomationRunsLoading(true);
          setTimeout(() => setAutomationRunsLoading(false), 500);
        }}
        onLoadMore={() => {}}
        hasMore={false}
      />

      {/* AI Chat Pill - Floating/Dockable */}
      {!isCanvasEmpty && (
        <AIChatPill
          ref={aiChatPillRef}
          onSubmit={handleAISubmit}
          isLoading={aiState.isGenerating}
          streamingStatus={aiState.currentStatus}
          selectedCount={selectedIds.length}
          onCancel={cancelGeneration}
          initialPrompt={initialPrompt}
          dockPosition={aiChatDock}
          onDockChange={setAIChatDock}
        />
      )}

      {/* Deploy Success Celebration */}
      <AnimatePresence>
        {showDeploySuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            {/* Confetti particles */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              {confettiParticles.map((particle) => (
                <motion.div
                  key={particle.id}
                  initial={{
                    x: '50%',
                    y: '50%',
                    scale: 0,
                    opacity: 1,
                  }}
                  animate={{
                    x: `${particle.targetX}%`,
                    y: `${particle.targetY}%`,
                    scale: [0, 1, 0.5],
                    opacity: [1, 1, 0],
                    rotate: particle.rotation,
                  }}
                  transition={{
                    duration: 1.5,
                    delay: particle.delay,
                    ease: 'easeOut',
                  }}
                  className="absolute"
                  style={{
                    width: particle.size,
                    height: particle.size,
                    backgroundColor: particle.color,
                    borderRadius: particle.isCircle ? '50%' : '2px',
                  }}
                />
              ))}
            </div>

            {/* Celebration card */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="relative z-10 flex flex-col items-center gap-4 p-8 bg-[var(--hivelab-panel)] backdrop-blur-xl rounded-3xl border border-[var(--life-gold)]/20 shadow-2xl"
            >
              {/* Gold glow pulse */}
              <motion.div
                animate={{
                  boxShadow: [
                    '0 0 0 0 rgba(212,175,55,0)',
                    '0 0 40px 20px rgba(212,175,55,0.15)',
                    '0 0 0 0 rgba(212,175,55,0)',
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 rounded-3xl"
              />

              {/* Success icon */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.2 }}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[var(--life-gold)] to-[#B8860B]"
              >
                <svg className="h-8 w-8 text-black" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </motion.div>

              {/* Message */}
              <div className="text-center">
                <h3 className="text-xl font-bold text-[var(--hivelab-text-primary)] mb-1">
                  Tool Deployed!
                </h3>
                <p className="text-sm text-[var(--hivelab-text-secondary)]">
                  Your tool is now live in the space
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setShowDeploySuccess(false)}
                  className="px-4 py-2 text-sm font-medium text-[var(--hivelab-text-secondary)] hover:text-[var(--hivelab-text-primary)] transition-colors"
                >
                  Continue Editing
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDeploySuccess(false);
                    onCancel();
                  }}
                  className="px-4 py-2 text-sm font-semibold bg-[var(--life-gold)] text-black rounded-lg hover:bg-[var(--life-gold)]/90 transition-colors"
                >
                  View in Space
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
