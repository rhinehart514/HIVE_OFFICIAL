'use client';

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useMemo,
  type ReactNode,
  type Dispatch,
} from 'react';
import type {
  CanvasElement,
  Connection,
  ToolMode,
  HistoryEntry,
} from '../types';
import type { RailState, RailTab } from '../element-rail';
import type { AutomationSummary } from '../automations-panel';
import type { AutomationData } from '../automation-builder-modal';
import type { AutomationRun } from '../automation-logs-viewer';
import type { OtherToolData } from '../other-tools-panel';

// ============================================
// HiveLab IDE State Management
// Single source of truth for all IDE state
// ============================================

// Maximum history entries
const MAX_HISTORY = 50;

// ============================================
// State Types
// ============================================

export interface IDEDocument {
  id: string;
  name: string;
  description: string;
  elements: CanvasElement[];
  connections: Connection[];
}

export interface IDESelection {
  elementIds: string[];
  connectionId: string | null;
}

export interface IDEViewport {
  zoom: number;
  pan: { x: number; y: number };
  showGrid: boolean;
  snapToGrid: boolean;
  gridSize: number;
}

export interface IDEUI {
  mode: ToolMode;
  railState: RailState;
  railTab: RailTab;
  templateGalleryOpen: boolean;
  aiChatDock: 'float' | 'left';
  saving: boolean;
  deploying: boolean;
  showDeploySuccess: boolean;
  hasUnsavedChanges: boolean;
  lastAutoSave: number;
}

export interface IDEHistory {
  entries: HistoryEntry[];
  currentIndex: number;
}

export interface IDEConnectionBuilder {
  open: boolean;
  creating: boolean;
  error?: string;
  preSelectedSource?: {
    deploymentId: string;
    path: string;
    type: string;
  };
}

export interface IDEAutomations {
  items: AutomationSummary[];
  loading: boolean;
  builderOpen: boolean;
  logsOpen: boolean;
  editingItem: AutomationData | null;
  viewingId: string | null;
  runs: AutomationRun[];
  runsLoading: boolean;
}

export interface IDESpaceTools {
  items: OtherToolData[];
  loading: boolean;
}

export interface HiveLabState {
  document: IDEDocument;
  selection: IDESelection;
  viewport: IDEViewport;
  ui: IDEUI;
  history: IDEHistory;
  flowingConnectionIds: Set<string>;
  connectionBuilder: IDEConnectionBuilder;
  automations: IDEAutomations;
  spaceTools: IDESpaceTools;
}

// ============================================
// Action Types
// ============================================

export type IDEAction =
  // Document actions
  | { type: 'SET_DOCUMENT_NAME'; name: string }
  | { type: 'ADD_ELEMENT'; element: CanvasElement }
  | { type: 'UPDATE_ELEMENT'; id: string; updates: Partial<CanvasElement> }
  | { type: 'DELETE_ELEMENTS'; ids: string[] }
  | { type: 'SET_ELEMENTS'; elements: CanvasElement[] }
  | { type: 'ADD_CONNECTION'; connection: Connection }
  | { type: 'DELETE_CONNECTION'; id: string }
  | { type: 'SET_CONNECTIONS'; connections: Connection[] }
  // Selection actions
  | { type: 'SELECT_ELEMENTS'; ids: string[]; additive?: boolean }
  | { type: 'SELECT_CONNECTION'; id: string | null }
  | { type: 'CLEAR_SELECTION' }
  // Viewport actions
  | { type: 'SET_ZOOM'; zoom: number }
  | { type: 'SET_PAN'; pan: { x: number; y: number } }
  | { type: 'TOGGLE_GRID' }
  | { type: 'TOGGLE_SNAP' }
  // UI actions
  | { type: 'SET_MODE'; mode: ToolMode }
  | { type: 'SET_RAIL_STATE'; state: RailState }
  | { type: 'SET_RAIL_TAB'; tab: RailTab }
  | { type: 'SET_TEMPLATE_GALLERY_OPEN'; open: boolean }
  | { type: 'SET_AI_CHAT_DOCK'; dock: 'float' | 'left' }
  | { type: 'SET_SAVING'; saving: boolean }
  | { type: 'SET_DEPLOYING'; deploying: boolean }
  | { type: 'SET_DEPLOY_SUCCESS'; show: boolean }
  | { type: 'SET_HAS_UNSAVED_CHANGES'; hasChanges: boolean }
  | { type: 'SET_LAST_AUTO_SAVE'; timestamp: number }
  // History actions
  | { type: 'PUSH_HISTORY'; description: string }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  // Connection flow actions
  | { type: 'START_CONNECTION_FLOW'; ids: string[] }
  | { type: 'END_CONNECTION_FLOW'; ids: string[] }
  // Connection builder actions
  | { type: 'OPEN_CONNECTION_BUILDER'; preSelected?: IDEConnectionBuilder['preSelectedSource'] }
  | { type: 'CLOSE_CONNECTION_BUILDER' }
  | { type: 'SET_CONNECTION_BUILDER_CREATING'; creating: boolean }
  | { type: 'SET_CONNECTION_BUILDER_ERROR'; error?: string }
  // Automation actions
  | { type: 'SET_AUTOMATIONS'; items: AutomationSummary[] }
  | { type: 'SET_AUTOMATIONS_LOADING'; loading: boolean }
  | { type: 'OPEN_AUTOMATION_BUILDER'; editing?: AutomationData }
  | { type: 'CLOSE_AUTOMATION_BUILDER' }
  | { type: 'OPEN_AUTOMATION_LOGS'; automationId: string }
  | { type: 'CLOSE_AUTOMATION_LOGS' }
  | { type: 'SET_AUTOMATION_RUNS'; runs: AutomationRun[] }
  | { type: 'SET_AUTOMATION_RUNS_LOADING'; loading: boolean }
  // Space tools actions
  | { type: 'SET_SPACE_TOOLS'; items: OtherToolData[] }
  | { type: 'SET_SPACE_TOOLS_LOADING'; loading: boolean };

// ============================================
// Reducer
// ============================================

function ideReducer(state: HiveLabState, action: IDEAction): HiveLabState {
  switch (action.type) {
    // Document actions
    case 'SET_DOCUMENT_NAME':
      return {
        ...state,
        document: { ...state.document, name: action.name },
        ui: { ...state.ui, hasUnsavedChanges: true },
      };

    case 'ADD_ELEMENT':
      return {
        ...state,
        document: {
          ...state.document,
          elements: [...state.document.elements, action.element],
        },
        selection: { ...state.selection, elementIds: [action.element.id] },
        ui: { ...state.ui, hasUnsavedChanges: true },
      };

    case 'UPDATE_ELEMENT':
      return {
        ...state,
        document: {
          ...state.document,
          elements: state.document.elements.map((el) =>
            el.id === action.id ? { ...el, ...action.updates } : el
          ),
        },
        ui: { ...state.ui, hasUnsavedChanges: true },
      };

    case 'DELETE_ELEMENTS': {
      const idsToDelete = new Set(action.ids);
      const instanceIdsToDelete = new Set(
        state.document.elements
          .filter((el) => idsToDelete.has(el.id))
          .map((el) => el.instanceId)
      );
      return {
        ...state,
        document: {
          ...state.document,
          elements: state.document.elements.filter((el) => !idsToDelete.has(el.id)),
          connections: state.document.connections.filter(
            (conn) =>
              !instanceIdsToDelete.has(conn.from.instanceId) &&
              !instanceIdsToDelete.has(conn.to.instanceId)
          ),
        },
        selection: { elementIds: [], connectionId: null },
        ui: { ...state.ui, hasUnsavedChanges: true },
      };
    }

    case 'SET_ELEMENTS':
      return {
        ...state,
        document: { ...state.document, elements: action.elements },
        ui: { ...state.ui, hasUnsavedChanges: true },
      };

    case 'ADD_CONNECTION':
      return {
        ...state,
        document: {
          ...state.document,
          connections: [...state.document.connections, action.connection],
        },
        ui: { ...state.ui, hasUnsavedChanges: true },
      };

    case 'DELETE_CONNECTION':
      return {
        ...state,
        document: {
          ...state.document,
          connections: state.document.connections.filter((c) => c.id !== action.id),
        },
        selection: {
          ...state.selection,
          connectionId: state.selection.connectionId === action.id ? null : state.selection.connectionId,
        },
        ui: { ...state.ui, hasUnsavedChanges: true },
      };

    case 'SET_CONNECTIONS':
      return {
        ...state,
        document: { ...state.document, connections: action.connections },
        ui: { ...state.ui, hasUnsavedChanges: true },
      };

    // Selection actions
    case 'SELECT_ELEMENTS':
      return {
        ...state,
        selection: {
          ...state.selection,
          elementIds: action.additive
            ? [...new Set([...state.selection.elementIds, ...action.ids])]
            : action.ids,
          connectionId: null,
        },
      };

    case 'SELECT_CONNECTION':
      return {
        ...state,
        selection: {
          elementIds: [],
          connectionId: action.id,
        },
      };

    case 'CLEAR_SELECTION':
      return {
        ...state,
        selection: { elementIds: [], connectionId: null },
      };

    // Viewport actions
    case 'SET_ZOOM':
      return {
        ...state,
        viewport: { ...state.viewport, zoom: action.zoom },
      };

    case 'SET_PAN':
      return {
        ...state,
        viewport: { ...state.viewport, pan: action.pan },
      };

    case 'TOGGLE_GRID':
      return {
        ...state,
        viewport: { ...state.viewport, showGrid: !state.viewport.showGrid },
      };

    case 'TOGGLE_SNAP':
      return {
        ...state,
        viewport: { ...state.viewport, snapToGrid: !state.viewport.snapToGrid },
      };

    // UI actions
    case 'SET_MODE':
      return {
        ...state,
        ui: { ...state.ui, mode: action.mode },
      };

    case 'SET_RAIL_STATE':
      return {
        ...state,
        ui: { ...state.ui, railState: action.state },
      };

    case 'SET_RAIL_TAB':
      return {
        ...state,
        ui: { ...state.ui, railTab: action.tab },
      };

    case 'SET_TEMPLATE_GALLERY_OPEN':
      return {
        ...state,
        ui: { ...state.ui, templateGalleryOpen: action.open },
      };

    case 'SET_AI_CHAT_DOCK':
      return {
        ...state,
        ui: { ...state.ui, aiChatDock: action.dock },
      };

    case 'SET_SAVING':
      return {
        ...state,
        ui: { ...state.ui, saving: action.saving },
      };

    case 'SET_DEPLOYING':
      return {
        ...state,
        ui: { ...state.ui, deploying: action.deploying },
      };

    case 'SET_DEPLOY_SUCCESS':
      return {
        ...state,
        ui: { ...state.ui, showDeploySuccess: action.show },
      };

    case 'SET_HAS_UNSAVED_CHANGES':
      return {
        ...state,
        ui: { ...state.ui, hasUnsavedChanges: action.hasChanges },
      };

    case 'SET_LAST_AUTO_SAVE':
      return {
        ...state,
        ui: { ...state.ui, lastAutoSave: action.timestamp },
      };

    // History actions
    case 'PUSH_HISTORY': {
      const entry: HistoryEntry = {
        elements: JSON.parse(JSON.stringify(state.document.elements)),
        connections: JSON.parse(JSON.stringify(state.document.connections)),
        timestamp: Date.now(),
        description: action.description,
      };
      const newEntries = [
        ...state.history.entries.slice(0, state.history.currentIndex + 1),
        entry,
      ];
      const trimmedEntries =
        newEntries.length > MAX_HISTORY
          ? newEntries.slice(newEntries.length - MAX_HISTORY)
          : newEntries;
      return {
        ...state,
        history: {
          entries: trimmedEntries,
          currentIndex: Math.min(state.history.currentIndex + 1, MAX_HISTORY - 1),
        },
      };
    }

    case 'UNDO': {
      if (state.history.currentIndex <= 0) return state;
      const prevEntry = state.history.entries[state.history.currentIndex - 1];
      if (!prevEntry) return state;
      return {
        ...state,
        document: {
          ...state.document,
          elements: prevEntry.elements,
          connections: prevEntry.connections,
        },
        history: {
          ...state.history,
          currentIndex: state.history.currentIndex - 1,
        },
      };
    }

    case 'REDO': {
      if (state.history.currentIndex >= state.history.entries.length - 1) return state;
      const nextEntry = state.history.entries[state.history.currentIndex + 1];
      if (!nextEntry) return state;
      return {
        ...state,
        document: {
          ...state.document,
          elements: nextEntry.elements,
          connections: nextEntry.connections,
        },
        history: {
          ...state.history,
          currentIndex: state.history.currentIndex + 1,
        },
      };
    }

    // Connection flow actions
    case 'START_CONNECTION_FLOW': {
      const newFlowing = new Set(state.flowingConnectionIds);
      action.ids.forEach((id) => newFlowing.add(id));
      return {
        ...state,
        flowingConnectionIds: newFlowing,
      };
    }

    case 'END_CONNECTION_FLOW': {
      const newFlowing = new Set(state.flowingConnectionIds);
      action.ids.forEach((id) => newFlowing.delete(id));
      return {
        ...state,
        flowingConnectionIds: newFlowing,
      };
    }

    // Connection builder actions
    case 'OPEN_CONNECTION_BUILDER':
      return {
        ...state,
        connectionBuilder: {
          ...state.connectionBuilder,
          open: true,
          preSelectedSource: action.preSelected,
          error: undefined,
        },
      };

    case 'CLOSE_CONNECTION_BUILDER':
      return {
        ...state,
        connectionBuilder: {
          open: false,
          creating: false,
          error: undefined,
          preSelectedSource: undefined,
        },
      };

    case 'SET_CONNECTION_BUILDER_CREATING':
      return {
        ...state,
        connectionBuilder: {
          ...state.connectionBuilder,
          creating: action.creating,
        },
      };

    case 'SET_CONNECTION_BUILDER_ERROR':
      return {
        ...state,
        connectionBuilder: {
          ...state.connectionBuilder,
          error: action.error,
        },
      };

    // Automation actions
    case 'SET_AUTOMATIONS':
      return {
        ...state,
        automations: { ...state.automations, items: action.items },
      };

    case 'SET_AUTOMATIONS_LOADING':
      return {
        ...state,
        automations: { ...state.automations, loading: action.loading },
      };

    case 'OPEN_AUTOMATION_BUILDER':
      return {
        ...state,
        automations: {
          ...state.automations,
          builderOpen: true,
          editingItem: action.editing || null,
        },
      };

    case 'CLOSE_AUTOMATION_BUILDER':
      return {
        ...state,
        automations: {
          ...state.automations,
          builderOpen: false,
          editingItem: null,
        },
      };

    case 'OPEN_AUTOMATION_LOGS':
      return {
        ...state,
        automations: {
          ...state.automations,
          logsOpen: true,
          viewingId: action.automationId,
        },
      };

    case 'CLOSE_AUTOMATION_LOGS':
      return {
        ...state,
        automations: {
          ...state.automations,
          logsOpen: false,
          viewingId: null,
        },
      };

    case 'SET_AUTOMATION_RUNS':
      return {
        ...state,
        automations: { ...state.automations, runs: action.runs },
      };

    case 'SET_AUTOMATION_RUNS_LOADING':
      return {
        ...state,
        automations: { ...state.automations, runsLoading: action.loading },
      };

    // Space tools actions
    case 'SET_SPACE_TOOLS':
      return {
        ...state,
        spaceTools: { ...state.spaceTools, items: action.items },
      };

    case 'SET_SPACE_TOOLS_LOADING':
      return {
        ...state,
        spaceTools: { ...state.spaceTools, loading: action.loading },
      };

    default:
      return state;
  }
}

// ============================================
// Context
// ============================================

interface IDEContextValue {
  state: HiveLabState;
  dispatch: Dispatch<IDEAction>;
  // Derived state helpers
  selectedElements: CanvasElement[];
  isCanvasEmpty: boolean;
  canUndo: boolean;
  canRedo: boolean;
}

const IDEContext = createContext<IDEContextValue | null>(null);

// ============================================
// Provider
// ============================================

export interface HiveLabProviderProps {
  children: ReactNode;
  initialDocument?: Partial<IDEDocument>;
}

export function HiveLabProvider({ children, initialDocument }: HiveLabProviderProps) {
  const initialState: HiveLabState = {
    document: {
      id: initialDocument?.id || `tool_${Date.now()}`,
      name: initialDocument?.name || '',
      description: initialDocument?.description || '',
      elements: initialDocument?.elements || [],
      connections: initialDocument?.connections || [],
    },
    selection: {
      elementIds: [],
      connectionId: null,
    },
    viewport: {
      zoom: 1,
      pan: { x: 0, y: 0 },
      showGrid: true,
      snapToGrid: true,
      gridSize: 20,
    },
    ui: {
      mode: 'select',
      railState: 'collapsed',
      railTab: 'elements',
      templateGalleryOpen: false,
      aiChatDock: 'float',
      saving: false,
      deploying: false,
      showDeploySuccess: false,
      hasUnsavedChanges: false,
      lastAutoSave: 0,
    },
    history: {
      entries: [
        {
          elements: initialDocument?.elements || [],
          connections: initialDocument?.connections || [],
          timestamp: Date.now(),
          description: 'Initial state',
        },
      ],
      currentIndex: 0,
    },
    flowingConnectionIds: new Set(),
    connectionBuilder: {
      open: false,
      creating: false,
    },
    automations: {
      items: [],
      loading: false,
      builderOpen: false,
      logsOpen: false,
      editingItem: null,
      viewingId: null,
      runs: [],
      runsLoading: false,
    },
    spaceTools: {
      items: [],
      loading: false,
    },
  };

  const [state, dispatch] = useReducer(ideReducer, initialState);

  // Derived state
  const selectedElements = useMemo(
    () => state.document.elements.filter((el) => state.selection.elementIds.includes(el.id)),
    [state.document.elements, state.selection.elementIds]
  );

  const isCanvasEmpty = state.document.elements.length === 0;
  const canUndo = state.history.currentIndex > 0;
  const canRedo = state.history.currentIndex < state.history.entries.length - 1;

  const value = useMemo(
    () => ({
      state,
      dispatch,
      selectedElements,
      isCanvasEmpty,
      canUndo,
      canRedo,
    }),
    [state, selectedElements, isCanvasEmpty, canUndo, canRedo]
  );

  return <IDEContext.Provider value={value}>{children}</IDEContext.Provider>;
}

// ============================================
// Hook
// ============================================

export function useHiveLab() {
  const context = useContext(IDEContext);
  if (!context) {
    throw new Error('useHiveLab must be used within a HiveLabProvider');
  }
  return context;
}

// ============================================
// Action Helpers (optional convenience hooks)
// ============================================

/**
 * Convenience hook for common element operations
 */
export function useElementActions() {
  const { state, dispatch } = useHiveLab();

  const addElement = useCallback(
    (elementId: string, position: { x: number; y: number }) => {
      const newElement: CanvasElement = {
        id: `element_${Date.now()}`,
        elementId,
        instanceId: `${elementId}_${Date.now()}`,
        position,
        size: { width: 240, height: 120 },
        config: {},
        zIndex: state.document.elements.length + 1,
        locked: false,
        visible: true,
      };
      dispatch({ type: 'ADD_ELEMENT', element: newElement });
      dispatch({ type: 'PUSH_HISTORY', description: `Add ${elementId}` });
      return newElement;
    },
    [state.document.elements.length, dispatch]
  );

  const updateElement = useCallback(
    (id: string, updates: Partial<CanvasElement>) => {
      dispatch({ type: 'UPDATE_ELEMENT', id, updates });
    },
    [dispatch]
  );

  const deleteElements = useCallback(
    (ids: string[]) => {
      if (ids.length === 0) return;
      dispatch({ type: 'DELETE_ELEMENTS', ids });
      dispatch({ type: 'PUSH_HISTORY', description: `Delete ${ids.length} element(s)` });
    },
    [dispatch]
  );

  const duplicateElements = useCallback(
    (ids: string[]) => {
      if (ids.length === 0) return;
      const now = Date.now();
      const toDuplicate = state.document.elements.filter((el) => ids.includes(el.id));
      const newElements = toDuplicate.map((el, i) => ({
        ...el,
        id: `element_${now}_${i}_${Math.random().toString(36).slice(2)}`,
        instanceId: `${el.elementId}_${now}_${i}`,
        position: { x: el.position.x + 30, y: el.position.y + 30 },
        zIndex: state.document.elements.length + i + 1,
      }));
      newElements.forEach((el) => dispatch({ type: 'ADD_ELEMENT', element: el }));
      dispatch({ type: 'SELECT_ELEMENTS', ids: newElements.map((el) => el.id) });
      dispatch({ type: 'PUSH_HISTORY', description: `Duplicate ${newElements.length} element(s)` });
    },
    [state.document.elements, dispatch]
  );

  return {
    addElement,
    updateElement,
    deleteElements,
    duplicateElements,
  };
}

/**
 * Convenience hook for selection operations
 */
export function useSelectionActions() {
  const { dispatch } = useHiveLab();

  const selectElements = useCallback(
    (ids: string[], additive = false) => {
      dispatch({ type: 'SELECT_ELEMENTS', ids, additive });
    },
    [dispatch]
  );

  const selectConnection = useCallback(
    (id: string | null) => {
      dispatch({ type: 'SELECT_CONNECTION', id });
    },
    [dispatch]
  );

  const clearSelection = useCallback(() => {
    dispatch({ type: 'CLEAR_SELECTION' });
  }, [dispatch]);

  return {
    selectElements,
    selectConnection,
    clearSelection,
  };
}

/**
 * Convenience hook for history operations
 */
export function useHistoryActions() {
  const { dispatch, canUndo, canRedo } = useHiveLab();

  const undo = useCallback(() => {
    dispatch({ type: 'UNDO' });
  }, [dispatch]);

  const redo = useCallback(() => {
    dispatch({ type: 'REDO' });
  }, [dispatch]);

  const pushHistory = useCallback(
    (description: string) => {
      dispatch({ type: 'PUSH_HISTORY', description });
    },
    [dispatch]
  );

  return {
    undo,
    redo,
    pushHistory,
    canUndo,
    canRedo,
  };
}
