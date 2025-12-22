'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStreamingGeneration } from '@hive/hooks';
import {
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Layers,
  Box,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { ideClasses } from '@hive/tokens';
import type {
  CanvasElement,
  Connection,
  ToolMode,
  HistoryEntry,
  CanvasState,
} from './types';
import type { ElementConnection } from '@hive/core';
import { DEFAULT_CANVAS_STATE } from './types';
import { IDEToolbar } from './ide-toolbar';
import { IDECanvas } from './ide-canvas';
import { AICommandPalette } from './ai-command-palette';
import { ElementPalette } from './element-palette';
import { LayersPanel } from './layers-panel';
import { PropertiesPanel } from './properties-panel';
import { OnboardingOverlay } from './onboarding-overlay';
import { useIDEKeyboard } from './use-ide-keyboard';

// Maximum history entries to prevent unbounded memory growth
const MAX_HISTORY = 50;

/**
 * Normalize connections to IDE format (Connection with { port } keys)
 *
 * Accepts either:
 * - ElementConnection[] (saved format with { output, input } keys)
 * - Connection[] (IDE format with { port } keys)
 *
 * Returns unified Connection[] for internal use
 */
function normalizeConnections(saved?: ElementConnection[] | Connection[]): Connection[] {
  if (!saved || saved.length === 0) return [];
  return saved.map((conn, idx) => {
    // Check if it's already in IDE format (has 'port' key)
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
    /**
     * Connections - accepts either format:
     * - ElementConnection[] (saved/API format with { output, input } keys)
     * - Connection[] (IDE format with { port } keys)
     * Both will be normalized to internal IDE format
     */
    connections?: ElementConnection[] | Connection[];
  };
  /** Show onboarding overlay for new/empty canvases */
  showOnboarding?: boolean;
  onSave: (composition: HiveLabComposition) => Promise<void>;
  onPreview: (composition: HiveLabComposition) => void;
  onCancel: () => void;
  userId: string;
  /** User context for element tier filtering */
  userContext?: UserContext;
  /**
   * Callback to receive connection flow control functions
   * Used by tool runtime to trigger visual feedback when data flows
   */
  onConnectionFlowReady?: (controls: ConnectionFlowControls) => void;
}

export interface ConnectionFlowControls {
  /** Trigger visual flow animation on specified connections */
  triggerFlow: (connectionIds: string[], duration?: number) => void;
  /** Get connection IDs from an element's outputs */
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

const PANEL_WIDTH = 280;

export function HiveLabIDE({
  initialComposition,
  showOnboarding: initialShowOnboarding = false,
  onSave,
  onPreview,
  onCancel,
  userId,
  userContext,
  onConnectionFlowReady,
}: HiveLabIDEProps) {
  // Tool metadata
  const [toolId] = useState(initialComposition?.id || `tool_${Date.now()}`);
  const [toolName, setToolName] = useState(initialComposition?.name || '');
  const [toolDescription] = useState(initialComposition?.description || '');

  // Onboarding state - show for empty canvas if not dismissed
  const [showOnboarding, setShowOnboarding] = useState(() => {
    // Check if user has dismissed onboarding before
    if (typeof window !== 'undefined') {
      return initialShowOnboarding && !localStorage.getItem('hivelab_onboarding_dismissed');
    }
    return initialShowOnboarding;
  });

  // Canvas state
  const [elements, setElements] = useState<CanvasElement[]>(
    initialComposition?.elements || []
  );
  const [connections, setConnections] = useState<Connection[]>(() =>
    normalizeConnections(initialComposition?.connections)
  );
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const gridSize = 20;

  // UI state
  const [mode, setMode] = useState<ToolMode>('select');
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [leftTab, setLeftTab] = useState<'elements' | 'layers'>('elements');
  const [aiPanelOpen, setAIPanelOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // History for undo/redo
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Connection flow feedback - tracks connections currently flowing data
  const [flowingConnections, setFlowingConnections] = useState<Set<string>>(new Set());

  // Refs
  const draggingElementId = useRef<string | null>(null);

  // Get selected element
  const selectedElement = elements.find((el) => selectedIds[0] === el.id) || null;

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
        // Truncate future history (everything after current index)
        const newHistory = [...prev.slice(0, historyIndex + 1), entry];
        // Limit to MAX_HISTORY entries (remove oldest)
        if (newHistory.length > MAX_HISTORY) {
          return newHistory.slice(newHistory.length - MAX_HISTORY);
        }
        return newHistory;
      });
      setHistoryIndex((prev) => Math.min(prev + 1, MAX_HISTORY - 1));
    },
    [elements, connections, historyIndex]
  );

  // Undo
  const undo = useCallback(() => {
    if (historyIndex < 0) return;
    const entry = history[historyIndex];
    if (entry) {
      setElements(entry.elements);
      setConnections(entry.connections);
      setHistoryIndex((prev) => prev - 1);
    }
  }, [history, historyIndex]);

  // Redo
  const redo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;
    const entry = history[historyIndex + 1];
    if (entry) {
      setElements(entry.elements);
      setConnections(entry.connections);
      setHistoryIndex((prev) => prev + 1);
    }
  }, [history, historyIndex]);

  // Space-tier element IDs (require isSpaceLeader)
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
      // Validate element access - space-tier requires isSpaceLeader
      if (SPACE_TIER_ELEMENTS.includes(elementId) && !userContext?.isSpaceLeader) {
        console.warn(`Cannot add ${elementId}: requires space leader access`);
        return; // Silently reject - element shouldn't be in palette anyway
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

  // Clipboard state for copy/paste
  const clipboardRef = useRef<CanvasElement[]>([]);

  // Copy selected elements to clipboard
  const copyElements = useCallback(() => {
    if (selectedIds.length === 0) return;
    const toCopy = elements.filter((el) => selectedIds.includes(el.id));
    clipboardRef.current = JSON.parse(JSON.stringify(toCopy)); // Deep clone
  }, [selectedIds, elements]);

  // Paste elements from clipboard
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

  // Cut selected elements (copy + delete)
  const cutElements = useCallback(() => {
    if (selectedIds.length === 0) return;
    copyElements();
    deleteElements([]);
    pushHistory(`Cut ${selectedIds.length} element(s)`);
  }, [selectedIds.length, copyElements, deleteElements, pushHistory]);

  // Selection
  const selectElements = useCallback((ids: string[], append = false) => {
    setSelectedIds((prev) => (append ? [...new Set([...prev, ...ids])] : ids));
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(elements.map((el) => el.id));
  }, [elements]);

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  /**
   * Trigger visual flow feedback on connections
   * Shows animated data flow for specified duration (default 600ms)
   */
  const triggerConnectionFlow = useCallback(
    (connectionIds: string[], duration = 600) => {
      if (connectionIds.length === 0) return;

      // Add connections to flowing set
      setFlowingConnections((prev) => {
        const next = new Set(prev);
        connectionIds.forEach((id) => next.add(id));
        return next;
      });

      // Remove after duration
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

  /**
   * Find connections affected by an element's output change
   * Used to trigger visual feedback when data cascades
   */
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
      const newConnection: Connection = {
        id: connectionId,
        from,
        to,
      };
      setConnections((prev) => [...prev, newConnection]);
      pushHistory('Add connection');

      // Trigger visual flow feedback when connection is created
      setTimeout(() => triggerConnectionFlow([connectionId], 800), 50);
    },
    [pushHistory, triggerConnectionFlow]
  );

  const deleteConnection = useCallback(
    (id: string) => {
      setConnections((prev) => prev.filter((conn) => conn.id !== id));
      pushHistory('Delete connection');
    },
    [pushHistory]
  );

  // Expose flow controls to parent component
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
    } finally {
      setSaving(false);
    }
  }, [toolId, toolName, toolDescription, elements, connections, onSave]);

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
    onElementAdded: (_element, _status) => {
      // Element added during AI generation - UI updates automatically via state
    },
    onComplete: (_composition) => {
      pushHistory('AI generation complete');
    },
    onError: (_error) => {
      // Generation error - state.error will be set
    },
    onStatusUpdate: (_status) => {
      // Status update - state.currentStatus will be set
    },
  });

  // Helper to get position near selection (Cursor-like behavior)
  const getPositionNearSelection = useCallback(() => {
    if (selectedIds.length === 0) {
      // No selection - place in center-ish area
      return { x: 100, y: 100 };
    }

    // Get bounds of selected elements
    const selected = elements.filter(el => selectedIds.includes(el.id));
    if (selected.length === 0) return { x: 100, y: 100 };

    // Find rightmost edge of selection
    const maxX = Math.max(...selected.map(el => el.position.x + (el.size?.width || 240)));
    const avgY = selected.reduce((sum, el) => sum + el.position.y, 0) / selected.length;

    // Place new elements to the right of selection with padding
    return { x: maxX + 40, y: avgY };
  }, [elements, selectedIds]);

  // Merge AI-generated elements into canvas when generation completes
  useEffect(() => {
    if (aiState.elements.length > 0 && !aiState.isGenerating) {
      // Get position near selection for Cursor-like placement
      const insertPosition = getPositionNearSelection();

      // Map AI elements to canvas elements with proper positioning
      const canvasElements: CanvasElement[] = aiState.elements.map((el, index) => ({
        id: `element_${Date.now()}_${index}`,
        elementId: el.elementId || 'unknown',
        instanceId: el.instanceId || `${el.elementId}_${Date.now()}_${index}`,
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

      if (canvasElements.length > 0) {
        setElements(prev => [...prev, ...canvasElements]);
        setSelectedIds(canvasElements.map(el => el.id));
      }
    }
  }, [aiState.elements, aiState.isGenerating, getPositionNearSelection]);

  // AI handler - selection-aware (Cursor-like)
  const handleAISubmit = useCallback(async (prompt: string, type: string) => {
    // Get selected elements for context
    const selectedElements = elements.filter(el => selectedIds.includes(el.id));
    const hasSelection = selectedElements.length > 0;

    // Determine if this is an iteration/modification based on selection or type
    const isIteration = type === 'modify' || type === 'iterate' || hasSelection;

    // Build context based on selection (Cursor-like behavior)
    // If elements are selected, AI acts on those; otherwise, on the whole canvas
    const elementsForContext = hasSelection ? selectedElements : elements;

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
        // Only include connections involving selected elements
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

    // Pass selection context to AI
    const selectionContext = hasSelection ? {
      count: selectedElements.length,
      types: selectedElements.map(el => el.elementId),
      prompt: `Acting on ${selectedElements.length} selected element(s): ${selectedElements.map(el => el.elementId).join(', ')}`,
    } : undefined;

    await generate({
      prompt: selectionContext ? `${selectionContext.prompt}. ${prompt}` : prompt,
      isIteration,
      existingComposition,
    });

    setAIPanelOpen(false);
  }, [generate, toolId, toolName, toolDescription, elements, connections, selectedIds]);

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
      openAIPanel: () => setAIPanelOpen(true),
      closeAIPanel: () => setAIPanelOpen(false),
    },
    mode,
    setMode,
    enabled: true,
  });

  return (
    <div className={cn("h-screen flex flex-col overflow-hidden", ideClasses.bgCanvas, ideClasses.textPrimary)}>
      {/* Toolbar */}
      <IDEToolbar
        mode={mode}
        onModeChange={setMode}
        zoom={zoom}
        onZoomChange={setZoom}
        showGrid={showGrid}
        onToggleGrid={() => setShowGrid((prev) => !prev)}
        canUndo={historyIndex >= 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={undo}
        onRedo={redo}
        onFitToScreen={fitToScreen}
        onOpenAI={() => setAIPanelOpen(true)}
        onPreview={preview}
        onSave={save}
        saving={saving}
        toolName={toolName}
        onToolNameChange={setToolName}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel */}
        <AnimatePresence mode="wait">
          {leftPanelOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: PANEL_WIDTH, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={cn("border-r flex flex-col overflow-hidden", ideClasses.borderDefault, ideClasses.bgPanel)}
            >
              {/* Tab Switcher */}
              <div className={cn("flex border-b", ideClasses.borderDefault)}>
                <button
                  type="button"
                  onClick={() => setLeftTab('elements')}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 py-2.5 text-sm transition-colors',
                    leftTab === 'elements'
                      ? 'bg-[#1a1a1a] text-white'
                      : 'text-[#666] hover:text-[#999]'
                  )}
                >
                  <Box className="h-4 w-4" />
                  Elements
                </button>
                <button
                  type="button"
                  onClick={() => setLeftTab('layers')}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 py-2.5 text-sm transition-colors',
                    leftTab === 'layers'
                      ? 'bg-[#1a1a1a] text-white'
                      : 'text-[#666] hover:text-[#999]'
                  )}
                >
                  <Layers className="h-4 w-4" />
                  Layers
                </button>
              </div>

              {/* Panel Content */}
              <div className="flex-1 overflow-hidden">
                {leftTab === 'elements' ? (
                  <ElementPalette
                    onDragStart={(id) => {
                      draggingElementId.current = id;
                    }}
                    onDragEnd={() => {
                      draggingElementId.current = null;
                    }}
                    userContext={userContext}
                  />
                ) : (
                  <LayersPanel
                    elements={elements}
                    connections={connections}
                    selectedIds={selectedIds}
                    onSelect={selectElements}
                    onUpdateElement={updateElement}
                    onDeleteElement={(id) => deleteElements([id])}
                    onDuplicateElement={(id) => duplicateElements([id])}
                    onReorder={setElements}
                  />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Panel Toggle - Left */}
        <button
          type="button"
          onClick={() => setLeftPanelOpen((prev) => !prev)}
          className={cn(
            "w-6 flex items-center justify-center border-r transition-colors",
            ideClasses.borderDefault,
            ideClasses.bgPanel,
            ideClasses.bgInteractiveHover,
            ideClasses.textMuted,
            "hover:text-white"
          )}
        >
          {leftPanelOpen ? (
            <PanelLeftClose className="h-4 w-4" />
          ) : (
            <PanelLeftOpen className="h-4 w-4" />
          )}
        </button>

        {/* Canvas */}
        <IDECanvas
          elements={elements}
          connections={connections}
          selectedIds={selectedIds}
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
          onDeleteConnection={deleteConnection}
          onZoomChange={setZoom}
          onPanChange={setPan}
          onDrop={addElement}
        />

        {/* Panel Toggle - Right */}
        <button
          type="button"
          onClick={() => setRightPanelOpen((prev) => !prev)}
          className={cn(
            "w-6 flex items-center justify-center border-l transition-colors",
            ideClasses.borderDefault,
            ideClasses.bgPanel,
            ideClasses.bgInteractiveHover,
            ideClasses.textMuted,
            "hover:text-white"
          )}
        >
          {rightPanelOpen ? (
            <PanelRightClose className="h-4 w-4" />
          ) : (
            <PanelRightOpen className="h-4 w-4" />
          )}
        </button>

        {/* Right Panel */}
        <AnimatePresence mode="wait">
          {rightPanelOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: PANEL_WIDTH, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={cn("border-l overflow-hidden", ideClasses.borderDefault, ideClasses.bgPanel)}
            >
              <PropertiesPanel
                selectedElement={selectedElement}
                onUpdateElement={updateElement}
                onDeleteElement={(id) => deleteElements([id])}
                onDuplicateElement={(id) => duplicateElements([id])}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Status Bar */}
      <div className={cn(
        "h-7 border-t flex items-center justify-between px-3 text-xs",
        ideClasses.bgToolbar,
        ideClasses.borderDefault,
        ideClasses.textMuted
      )}>
        <div className="flex items-center gap-4">
          <span>{elements.length} elements</span>
          <span>{connections.length} connections</span>
          {selectedIds.length > 0 && <span>{selectedIds.length} selected</span>}
        </div>
        {/* AI Generation Progress */}
        {aiState.isGenerating && (
          <div className="flex items-center gap-2">
            <div className={cn("w-24 h-1.5 rounded-full overflow-hidden", ideClasses.borderDefault.replace('border-', 'bg-'))}>
              <motion.div
                className="h-full bg-[var(--ide-accent-primary)]"
                initial={{ width: 0 }}
                animate={{ width: `${aiState.progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <span className={ideClasses.textAccent}>{aiState.currentStatus}</span>
          </div>
        )}
        <div className="flex items-center gap-4">
          <span>Grid: {showGrid ? 'On' : 'Off'}</span>
          <span>Snap: {snapToGrid ? 'On' : 'Off'}</span>
          <span>Zoom: {Math.round(zoom * 100)}%</span>
        </div>
      </div>

      {/* AI Command Palette - selection-aware */}
      <AICommandPalette
        open={aiPanelOpen}
        onClose={() => {
          setAIPanelOpen(false);
          if (aiState.isGenerating) {
            cancelGeneration();
          }
        }}
        onSubmit={handleAISubmit}
        loading={aiState.isGenerating}
        streamingText={aiState.currentStatus}
        selectedCount={selectedIds.length}
      />

      {/* Onboarding Overlay - show for new/empty canvas */}
      {showOnboarding && elements.length === 0 && (
        <OnboardingOverlay
          onDismiss={() => setShowOnboarding(false)}
          onOpenAI={() => {
            setShowOnboarding(false);
            setAIPanelOpen(true);
          }}
        />
      )}
    </div>
  );
}
