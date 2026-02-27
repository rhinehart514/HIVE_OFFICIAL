'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AutomationBuilderModal } from './automation-builder-modal';
import { AutomationLogsViewer } from './automation-logs-viewer';
import type {
  CanvasElement,
  Connection,
  ToolMode,
  HiveLabComposition,
  Page,
} from './types';
import type { ElementConnection } from '@hive/core';
import { IDECanvas } from './ide-canvas';
import { useIDEKeyboard } from './use-ide-keyboard';

// Context provider for state management (Phase 2)
import { HiveLabProvider } from './context';

// Layout components
import { ElementRail, type RailState, type RailTab, type UserToolItem } from './element-rail';
import { ContextRail } from './context-rail';
import { FloatingActionBar, type FloatingActionBarRef } from './floating-action-bar';
import { TemplateOverlay } from './template-overlay';
import { TemplateGallery } from './template-gallery';
import { MobilePreview } from './mobile-preview';
import { PageTabs } from './page-tabs';
import type { ToolComposition } from '../../../lib/hivelab/element-system';

// Extracted hooks
import {
  useCanvasState,
  useIDEHistory,
  useIDEAutomations,
  useIDEAI,
  useIDESave,
  useIDEDeploy,
  useIDESpaceTools,
  usePageState,
} from './hooks';

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
    pages?: Page[];
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
  userTools?: UserToolItem[];
  onToolSelect?: (id: string) => void;
  onNewTool?: () => void;
  initialPrompt?: string | null;
  deploymentId?: string;
}

export interface ConnectionFlowControls {
  triggerFlow: (connectionIds: string[], duration?: number) => void;
  getConnectionsFrom: (instanceId: string) => string[];
}

// Deploy success celebration overlay
function DeploySuccessOverlay({
  confettiParticles,
  onContinue,
  onViewInSpace,
}: {
  confettiParticles: Array<{
    id: number;
    targetX: number;
    targetY: number;
    rotation: number;
    delay: number;
    size: number;
    color: string;
    isCircle: boolean;
  }>;
  onContinue: () => void;
  onViewInSpace: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {confettiParticles.map((particle) => (
          <motion.div
            key={particle.id}
            initial={{ x: '50%', y: '50%', scale: 0, opacity: 1 }}
            animate={{
              x: `${particle.targetX}%`,
              y: `${particle.targetY}%`,
              scale: [0, 1, 0.5],
              opacity: [1, 1, 0],
              rotate: particle.rotation,
            }}
            transition={{ duration: 1.5, delay: particle.delay, ease: 'easeOut' }}
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
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className="relative z-10 flex flex-col items-center gap-4 p-8 bg-[var(--hivelab-panel)] backdrop-blur-xl rounded-3xl border border-[var(--life-gold)]/20 shadow-2xl"
      >
        <motion.div
          animate={{
            boxShadow: [
              '0 0 0 0 rgba(255,215,0,0)',
              '0 0 40px 20px rgba(255,215,0,0.15)',
              '0 0 0 0 rgba(255,215,0,0)',
            ],
          }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 rounded-3xl"
        />
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
        <div className="text-center">
          <h3 className="text-xl font-bold text-[var(--hivelab-text-primary)] mb-1">
            Tool Deployed!
          </h3>
          <p className="text-sm text-[var(--hivelab-text-secondary)]">
            Your tool is now live in the space
          </p>
        </div>
        <div className="flex gap-3 mt-2">
          <button
            type="button"
            onClick={onContinue}
            className="px-4 py-2 text-sm font-medium text-[var(--hivelab-text-secondary)] hover:text-[var(--hivelab-text-primary)] transition-colors"
          >
            Continue Editing
          </button>
          <button
            type="button"
            onClick={onViewInSpace}
            className="px-4 py-2 text-sm font-semibold bg-[var(--life-gold)] text-black rounded-lg hover:bg-[var(--life-gold)]/90 transition-colors"
          >
            View in Space
          </button>
        </div>
      </motion.div>
    </motion.div>
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
  deploymentId,
}: HiveLabIDEProps) {
  const isMobile = useIsMobile();

  // Tool metadata
  const [toolId] = useState(initialComposition?.id || `tool_${Date.now()}`);
  const [toolName, setToolName] = useState(initialComposition?.name || '');
  const [toolDescription] = useState(initialComposition?.description || '');

  // UI state
  const [mode, setMode] = useState<ToolMode>('select');
  const [elementRailState, setElementRailState] = useState<RailState>('collapsed');
  const [elementRailTab, setElementRailTab] = useState<RailTab>('elements');
  const [templateGalleryOpen, setTemplateGalleryOpen] = useState(false);
  // Refs
  const floatingBarRef = useRef<FloatingActionBarRef>(null);
  const draggingElementId = useRef<string | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 1000, height: 800 });
  const gridSize = 20;

  // ---- Pages ----
  const pageState = usePageState({
    initialElements: initialComposition?.elements,
    initialConnections: initialComposition?.connections,
    initialPages: initialComposition?.pages,
  });

  // ---- History ----
  const historyHook = useIDEHistory({
    initialElements: pageState.activePage?.elements || initialComposition?.elements,
    initialConnections: pageState.activePage?.connections || initialComposition?.connections,
  });

  // Ref-based bridge so pushHistory always reads current canvas state
  const elementsRef = useRef<CanvasElement[]>(initialComposition?.elements || []);
  const connectionsRef = useRef<Connection[]>([]);

  const pushHistory = useCallback((description: string) => {
    historyHook.pushHistory(description, elementsRef.current, connectionsRef.current);
  }, [historyHook]);

  // ---- Canvas State ----
  const canvas = useCanvasState({
    initialElements: pageState.activePage?.elements || initialComposition?.elements,
    initialConnections: pageState.activePage?.connections || initialComposition?.connections,
    isSpaceLeader: userContext?.isSpaceLeader,
    snapToGrid: true,
    gridSize,
    pushHistory,
  });

  // Keep refs in sync with canvas state for history
  elementsRef.current = canvas.elements;
  connectionsRef.current = canvas.connections;

  // Sync canvas edits back to active page
  const syncRef = useRef(false);
  useEffect(() => {
    // Skip the initial render — only sync after user edits
    if (!syncRef.current) {
      syncRef.current = true;
      return;
    }
    pageState.syncActivePage(canvas.elements, canvas.connections);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvas.elements, canvas.connections]);

  // Page switching: load the new page's data into canvas
  const prevActivePageId = useRef(pageState.activePageId);
  const handleSelectPage = useCallback(
    (pageId: string) => {
      if (pageId === pageState.activePageId) return;
      // Save current page state before switching
      pageState.syncActivePage(canvas.elements, canvas.connections);
      pageState.setActivePageId(pageId);
    },
    [pageState, canvas.elements, canvas.connections]
  );

  // When activePageId changes, load new page data into canvas
  useEffect(() => {
    if (prevActivePageId.current === pageState.activePageId) return;
    prevActivePageId.current = pageState.activePageId;
    const page = pageState.pages.find((p) => p.id === pageState.activePageId);
    if (page) {
      syncRef.current = false; // prevent sync-back during load
      canvas.setElements(page.elements);
      canvas.setConnections(page.connections);
      canvas.selectElements([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageState.activePageId]);

  // Undo/Redo wired to canvas state
  const undo = useCallback(() => {
    const entry = historyHook.undo();
    if (entry) {
      canvas.setElements(entry.elements);
      canvas.setConnections(entry.connections);
    }
  }, [historyHook, canvas]);

  const redo = useCallback(() => {
    const entry = historyHook.redo();
    if (entry) {
      canvas.setElements(entry.elements);
      canvas.setConnections(entry.connections);
    }
  }, [historyHook, canvas]);

  // ---- Save ----
  const saveHook = useIDESave({
    toolId,
    toolName,
    toolDescription,
    elements: canvas.elements,
    connections: canvas.connections,
    pages: pageState.pages,
    onSave,
  });

  // ---- Deploy ----
  const deployHook = useIDEDeploy({
    buildComposition: saveHook.buildComposition,
    onSave,
    onDeploy,
    setSaving: saveHook.setSaving,
    setHasUnsavedChanges: saveHook.setHasUnsavedChanges,
  });

  // ---- AI ----
  const aiHook = useIDEAI({
    elements: canvas.elements,
    connections: canvas.connections,
    selectedIds: canvas.selectedIds,
    toolId,
    toolName,
    toolDescription,
    setElements: canvas.setElements,
    setSelectedIds: (ids: string[]) => canvas.selectElements(ids),
    pushHistory,
    onPagesGenerated: useCallback((pages: Page[]) => {
      pageState.setPages(pages);
      const startPage = pages.find((p) => p.isStartPage) || pages[0];
      if (startPage) {
        pageState.setActivePageId(startPage.id);
        canvas.setElements(startPage.elements);
        canvas.setConnections(startPage.connections);
      }
    }, [pageState, canvas]),
  });

  // ---- Automations (opt-in: only fetch when deploymentId exists) ----
  const automationHook = useIDEAutomations({
    deploymentId,
    enabled: !!deploymentId,
  });

  // ---- Space Tools (cross-tool connections) ----
  const spaceToolsHook = useIDESpaceTools({
    deploymentId,
    originSpaceId,
  });

  // ---- Canvas container size tracking ----
  useEffect(() => {
    if (!canvasContainerRef.current) return;

    const updateSize = () => {
      if (canvasContainerRef.current) {
        const { width, height } = canvasContainerRef.current.getBoundingClientRect();
        setCanvasSize({ width, height });
      }
    };

    updateSize();
    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(canvasContainerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // ---- Connection flow controls ----
  useEffect(() => {
    if (onConnectionFlowReady) {
      onConnectionFlowReady({
        triggerFlow: canvas.triggerConnectionFlow,
        getConnectionsFrom: canvas.getConnectionsFromElement,
      });
    }
  }, [onConnectionFlowReady, canvas.triggerConnectionFlow, canvas.getConnectionsFromElement]);

  // ---- Preview ----
  const preview = useCallback(() => {
    onPreview(saveHook.buildComposition());
  }, [onPreview, saveHook]);

  // ---- Quick prompt from StartZone ----
  const handleQuickPrompt = useCallback((prompt: string) => {
    floatingBarRef.current?.focusInput();
    setTimeout(() => {
      aiHook.handleAISubmit(prompt, 'generate');
    }, 100);
  }, [aiHook]);

  // ---- Rail toggles ----
  const openElements = useCallback(() => {
    setElementRailState('expanded');
    setElementRailTab('elements');
  }, []);

  const openTemplates = useCallback(() => {
    setTemplateGalleryOpen(true);
  }, []);

  // ---- Auto-focus AI chat bar with initial prompt on mount ----
  useEffect(() => {
    if (initialPrompt && canvas.elements.length === 0) {
      floatingBarRef.current?.focusInput();
    }
  }, [initialPrompt, canvas.elements.length]);

  // ---- Load template composition into canvas ----
  const loadTemplateComposition = useCallback(
    (composition: ToolComposition) => {
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

      canvas.setElements(newElements);
      canvas.setConnections(newConnections);
      setToolName(composition.name || 'Untitled App');
      canvas.selectElements([]);
      pushHistory(`Load template: ${composition.name}`);
      setTemplateGalleryOpen(false);
    },
    [canvas, pushHistory]
  );

  // ---- Keyboard shortcuts ----
  useIDEKeyboard({
    actions: {
      deleteElements: canvas.deleteElements,
      duplicateElements: canvas.duplicateElements,
      copyElements: canvas.copyElements,
      pasteElements: canvas.pasteElements,
      cutElements: canvas.cutElements,
      selectAll: canvas.selectAll,
      clearSelection: canvas.clearSelection,
      undo,
      redo,
      save: saveHook.save,
      toggleGrid: canvas.toggleGrid,
      setZoom: canvas.setZoom,
      openAIPanel: () => {
        floatingBarRef.current?.focusInput();
      },
      closeAIPanel: () => {
        // AI lives in the floating bar now
      },
    },
    mode,
    setMode,
    enabled: true,
    zoom: canvas.zoom,
  });

  // ---- Mobile: read-only preview ----
  if (isMobile) {
    return (
      <MobilePreview
        toolName={toolName}
        toolDescription={toolDescription}
        elements={canvas.elements}
        onBack={onCancel}
      />
    );
  }

  return (
    <HiveLabProvider
      initialDocument={{
        id: toolId,
        name: toolName,
        description: toolDescription,
        elements: canvas.elements,
        connections: canvas.connections,
      }}
    >
    <div className="h-full w-full flex overflow-hidden bg-[var(--hivelab-bg)]">
        {/* Element Rail (Left) */}
        <ElementRail
          state={elementRailState}
          onStateChange={setElementRailState}
          activeTab={elementRailTab}
          onTabChange={setElementRailTab}
          elements={canvas.elements}
          connections={canvas.connections}
          selectedIds={canvas.selectedIds}
          onDragStart={(id) => { draggingElementId.current = id; }}
          onDragEnd={() => { draggingElementId.current = null; }}
          onSelect={canvas.selectElements}
          onUpdateElement={canvas.updateElement}
          onDeleteElement={(id) => canvas.deleteElements([id])}
          onDuplicateElement={(id) => canvas.duplicateElements([id])}
          onReorder={canvas.setElements}
          onOpenAI={() => floatingBarRef.current?.focusInput()}
          onOpenTemplates={openTemplates}
          userContext={userContext}
          userTools={userTools}
          onToolSelect={onToolSelect}
          onNewTool={onNewTool}
          spaceTools={spaceToolsHook.otherTools}
          spaceToolsLoading={spaceToolsHook.otherToolsLoading}
          currentDeploymentId={deploymentId}
          onCreateConnection={(sourceDeploymentId, outputPath, outputType) => {
            spaceToolsHook.handleOpenConnectionBuilder({
              deploymentId: sourceDeploymentId,
              path: outputPath,
              type: outputType,
            });
          }}
          automations={automationHook.automations}
          automationsLoading={automationHook.automationsLoading}
          onCreateAutomation={automationHook.handleCreateAutomation}
          onEditAutomation={automationHook.handleEditAutomation}
          onDeleteAutomation={automationHook.handleDeleteAutomation}
          onToggleAutomation={automationHook.handleToggleAutomation}
          onViewAutomationLogs={automationHook.handleViewAutomationLogs}
          onRunAutomationNow={automationHook.handleRunAutomationNow}
        />

        {/* Canvas Area */}
        <div ref={canvasContainerRef} className="flex-1 flex flex-col relative">
          {/* Page Tabs — always show when canvas has elements */}
          {canvas.elements.length > 0 && (
            <PageTabs
              pages={pageState.pages}
              activePageId={pageState.activePageId}
              onSelectPage={handleSelectPage}
              onAddPage={() => pageState.addPage()}
              onDeletePage={pageState.deletePage}
              onRenamePage={pageState.renamePage}
              onDuplicatePage={pageState.duplicatePage}
              onReorderPages={pageState.reorderPages}
              onSetStartPage={pageState.setStartPage}
            />
          )}

          <AnimatePresence>
            {canvas.isCanvasEmpty && !aiHook.aiState.isGenerating && (
              <TemplateOverlay
                onSelectTemplate={loadTemplateComposition}
                onStartFromScratch={openElements}
                onOpenAI={() => {
                  floatingBarRef.current?.focusInput();
                }}
                onSeeAllTemplates={openTemplates}
              />
            )}
          </AnimatePresence>

          <IDECanvas
            elements={canvas.elements}
            connections={canvas.connections}
            selectedIds={canvas.selectedIds}
            selectedConnectionId={canvas.selectedConnectionId}
            zoom={canvas.zoom}
            pan={canvas.pan}
            showGrid={canvas.showGrid}
            gridSize={gridSize}
            snapToGrid={canvas.snapToGrid}
            mode={mode}
            flowingConnections={canvas.flowingConnections}
            onSelect={canvas.selectElements}
            onUpdateElement={canvas.updateElement}
            onDeleteElements={canvas.deleteElements}
            onAddConnection={canvas.addConnection}
            onUpdateConnection={canvas.updateConnection}
            onDeleteConnection={canvas.deleteConnection}
            onSelectConnection={canvas.selectConnection}
            onZoomChange={canvas.setZoom}
            onPanChange={canvas.setPan}
            onDrop={canvas.addElement}
            onTransformEnd={() => pushHistory('Transform element')}
          />
        </div>

        {/* Context Rail (Right) */}
        {canvas.selectedElements.length > 0 && (
          <ContextRail
            selectedElements={canvas.selectedElements}
            allElements={canvas.elements}
            connections={canvas.connections}
            selectedConnectionId={canvas.selectedConnectionId}
            onUpdateElement={canvas.updateElement}
            onDeleteElements={canvas.deleteElements}
            onDuplicateElements={canvas.duplicateElements}
            onAlignElements={canvas.alignElements}
            onDistributeElements={canvas.distributeElements}
            onUpdateConnection={canvas.updateConnection}
            onDeleteConnection={canvas.deleteConnection}
            pages={pageState.pages.map((p) => ({ id: p.id, name: p.name }))}
          />
        )}

      {/* Floating Action Bar */}
      <FloatingActionBar
        ref={floatingBarRef}
        zoom={canvas.zoom}
        onZoomChange={canvas.setZoom}
        showGrid={canvas.showGrid}
        onToggleGrid={canvas.toggleGrid}
        onFitToScreen={canvas.fitToScreen}
        snapToGrid={canvas.snapToGrid}
        onToggleSnap={canvas.toggleSnap}
        onUndo={undo}
        onRedo={redo}
        canUndo={historyHook.canUndo}
        canRedo={historyHook.canRedo}
        onAISubmit={aiHook.handleAISubmit}
        aiLoading={aiHook.aiState.isGenerating}
        aiStreamingText={aiHook.aiState.currentStatus}
        selectedCount={canvas.selectedIds.length}
        onAICancel={aiHook.cancelGeneration}
        initialPrompt={initialPrompt}
      />

      {/* Template Gallery Modal */}
      <TemplateGallery
        isOpen={templateGalleryOpen}
        onClose={() => setTemplateGalleryOpen(false)}
        onSelectTemplate={loadTemplateComposition}
      />

      {/* Automation Builder Modal */}
      <AutomationBuilderModal
        isOpen={automationHook.automationBuilderOpen}
        onClose={automationHook.closeAutomationBuilder}
        onSave={automationHook.handleSaveAutomation}
        initialData={automationHook.editingAutomation || undefined}
        elements={canvas.elements}
        mode={automationHook.editingAutomation ? 'edit' : 'create'}
        deploymentId={deploymentId}
      />

      {/* Automation Logs Viewer */}
      <AutomationLogsViewer
        isOpen={automationHook.automationLogsOpen}
        onClose={automationHook.closeAutomationLogs}
        automationName={automationHook.automations.find(a => a.id === automationHook.viewingAutomationId)?.name ?? 'Automation'}
        runs={automationHook.automationRuns as any}
        loading={automationHook.automationRunsLoading}
        onRefresh={() => {
          if (automationHook.viewingAutomationId) {
            automationHook.handleViewAutomationLogs(automationHook.viewingAutomationId);
          }
        }}
      />

      {/* Deploy Success Celebration */}
      <AnimatePresence>
        {deployHook.showDeploySuccess && (
          <DeploySuccessOverlay
            confettiParticles={deployHook.confettiParticles}
            onContinue={() => deployHook.setShowDeploySuccess(false)}
            onViewInSpace={() => {
              deployHook.setShowDeploySuccess(false);
              onCancel();
            }}
          />
        )}
      </AnimatePresence>
    </div>
    </HiveLabProvider>
  );
}
