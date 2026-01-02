'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
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
import { AICommandPalette } from './ai-command-palette';
import { useIDEKeyboard } from './use-ide-keyboard';

// New layout components
import { HeaderBar } from './header-bar';
import { CommandBar } from './command-bar';
import { ElementRail, type RailState, type RailTab } from './element-rail';
import { ContextRail, type AlignmentType } from './context-rail';
import { FloatingActionBar } from './floating-action-bar';
import { StartZone } from './start-zone';
import { TemplateGallery } from './template-gallery';
import { toast } from '../../../atomic/00-Global/atoms/sonner-toast';
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
}: HiveLabIDEProps) {
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
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const gridSize = 20;

  // UI state - new layout
  const [mode, setMode] = useState<ToolMode>('select');
  const [elementRailState, setElementRailState] = useState<RailState>('expanded');
  const [elementRailTab, setElementRailTab] = useState<RailTab>('elements');
  const [aiPanelOpen, setAIPanelOpen] = useState(false);
  const [templateGalleryOpen, setTemplateGalleryOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deploying, setDeploying] = useState(false);
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

  // Refs
  const draggingElementId = useRef<string | null>(null);

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
        toast.warning('Auto-save failed', 'Your changes are not saved. Please save manually.');
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
      pushHistory('Delete connection');
    },
    [pushHistory]
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
      toast.success('Tool saved', 'Your changes have been saved.');
    } catch (error) {
      console.error('Save failed:', error);
      toast.error(
        'Failed to save tool',
        error instanceof Error ? error.message : 'Please try again.'
      );
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
      toast.success('Tool deployed', 'Your tool is now live!');
    } catch (error) {
      console.error('Deploy failed:', error);
      toast.error(
        'Failed to deploy tool',
        error instanceof Error ? error.message : 'Please try again.'
      );
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

  // Merge AI elements
  useEffect(() => {
    if (aiState.elements.length > 0 && !aiState.isGenerating) {
      const insertPosition = getPositionNearSelection();
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

    setAIPanelOpen(false);
  }, [generate, toolId, toolName, toolDescription, elements, connections, selectedIds]);

  // Handle quick prompt from StartZone
  const handleQuickPrompt = useCallback((prompt: string) => {
    setAIPanelOpen(true);
    // The AI palette will receive this prompt
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
    zoom,
  });

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#0A0A0A]">
      {/* Header Bar - Tool identity */}
      <HeaderBar
        toolName={toolName}
        onToolNameChange={setToolName}
        onPreview={preview}
        onSave={save}
        saving={saving}
        originSpaceId={originSpaceId}
        onDeploy={deploy}
        deploying={deploying}
        onBack={onCancel}
        hasUnsavedChanges={hasUnsavedChanges}
      />

      {/* Command Bar - Workflow triggers + mode */}
      <CommandBar
        mode={mode}
        onModeChange={setMode}
        onOpenAI={() => setAIPanelOpen(true)}
        onOpenTemplates={openTemplates}
        onToggleElements={toggleElementRail}
        elementsOpen={elementRailState !== 'hidden'}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={undo}
        onRedo={redo}
        isGenerating={aiState.isGenerating}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
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
          onOpenAI={() => setAIPanelOpen(true)}
          onOpenTemplates={openTemplates}
          userContext={userContext}
        />

        {/* Canvas Area */}
        <div className="flex-1 relative">
          {/* Start Zone - shown when canvas is empty */}
          <AnimatePresence>
            {isCanvasEmpty && !aiState.isGenerating && (
              <StartZone
                onOpenAI={() => setAIPanelOpen(true)}
                onOpenTemplates={openTemplates}
                onOpenElements={openElements}
                onQuickPrompt={handleQuickPrompt}
              />
            )}
          </AnimatePresence>

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
            onTransformEnd={() => pushHistory('Transform element')}
          />
        </div>

        {/* Context Rail (Right) - auto-show on selection */}
        <ContextRail
          selectedElements={selectedElements}
          allElements={elements}
          onUpdateElement={updateElement}
          onDeleteElements={deleteElements}
          onDuplicateElements={duplicateElements}
          onAlignElements={alignElements}
        />
      </div>

      {/* Floating Action Bar (Bottom Center) */}
      <FloatingActionBar
        zoom={zoom}
        onZoomChange={setZoom}
        showGrid={showGrid}
        onToggleGrid={() => setShowGrid(prev => !prev)}
        onFitToScreen={fitToScreen}
        onOpenAI={() => setAIPanelOpen(true)}
        snapToGrid={snapToGrid}
        onToggleSnap={() => setSnapToGrid(prev => !prev)}
      />

      {/* AI Command Palette */}
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

      {/* Template Gallery Modal */}
      <TemplateGallery
        isOpen={templateGalleryOpen}
        onClose={() => setTemplateGalleryOpen(false)}
        onSelectTemplate={loadTemplateComposition}
      />
    </div>
  );
}
