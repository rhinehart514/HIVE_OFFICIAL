/**
 * HiveLab IDE Type Definitions
 *
 * Core types for the IDE-like tool builder experience.
 */

export type ToolMode = 'select' | 'pan' | 'connect';

export interface CanvasElement {
  id: string;
  elementId: string;      // Reference to ElementDefinition
  instanceId: string;     // Unique instance ID
  position: { x: number; y: number };
  size: { width: number; height: number };
  config: Record<string, unknown>;
  zIndex: number;
  locked: boolean;
  visible: boolean;
}

export interface Connection {
  id: string;
  from: { instanceId: string; port: string };
  to: { instanceId: string; port: string };
}

export interface CanvasState {
  elements: CanvasElement[];
  connections: Connection[];
  selectedIds: string[];
  zoom: number;
  pan: { x: number; y: number };
  showGrid: boolean;
  snapToGrid: boolean;
  gridSize: number;
}

export interface HistoryEntry {
  elements: CanvasElement[];
  connections: Connection[];
  timestamp: number;
  description: string;
}

export interface IDEState {
  // Tool metadata
  toolId: string | null;
  toolName: string;
  toolDescription: string;

  // Canvas state
  canvas: CanvasState;

  // UI state
  mode: ToolMode;
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;
  leftPanelTab: 'elements' | 'layers';
  rightPanelTab: 'properties' | 'ai';

  // AI state
  aiPanelOpen: boolean;
  aiInput: string;
  aiLoading: boolean;

  // History
  history: HistoryEntry[];
  historyIndex: number;
}

export interface IDEActions {
  // Element operations
  addElement: (elementId: string, position: { x: number; y: number }) => void;
  updateElement: (id: string, updates: Partial<CanvasElement>) => void;
  deleteElements: (ids: string[]) => void;
  duplicateElements: (ids: string[]) => void;

  // Selection
  selectElements: (ids: string[], append?: boolean) => void;
  selectAll: () => void;
  clearSelection: () => void;

  // Connections
  addConnection: (from: Connection['from'], to: Connection['to']) => void;
  deleteConnection: (id: string) => void;

  // Canvas
  setZoom: (zoom: number) => void;
  setPan: (pan: { x: number; y: number }) => void;
  fitToScreen: () => void;
  toggleGrid: () => void;
  toggleSnapToGrid: () => void;

  // Mode
  setMode: (mode: ToolMode) => void;

  // Panels
  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;
  setLeftPanelTab: (tab: 'elements' | 'layers') => void;
  setRightPanelTab: (tab: 'properties' | 'ai') => void;

  // AI
  openAIPanel: () => void;
  closeAIPanel: () => void;
  submitAIPrompt: (prompt: string) => Promise<void>;

  // History
  undo: () => void;
  redo: () => void;
  pushHistory: (description: string) => void;

  // Tool
  setToolName: (name: string) => void;
  setToolDescription: (description: string) => void;
  save: () => Promise<void>;
  preview: () => void;
}

export interface KeyboardShortcut {
  key: string;
  modifiers?: ('meta' | 'ctrl' | 'alt' | 'shift')[];
  action: keyof IDEActions | (() => void);
  description: string;
  when?: 'always' | 'canvas-focused' | 'input-not-focused';
}

export const DEFAULT_CANVAS_STATE: CanvasState = {
  elements: [],
  connections: [],
  selectedIds: [],
  zoom: 1,
  pan: { x: 0, y: 0 },
  showGrid: true,
  snapToGrid: true,
  gridSize: 20,
};

export const DEFAULT_IDE_STATE: IDEState = {
  toolId: null,
  toolName: '',
  toolDescription: '',
  canvas: DEFAULT_CANVAS_STATE,
  mode: 'select',
  leftPanelOpen: true,
  rightPanelOpen: true,
  leftPanelTab: 'elements',
  rightPanelTab: 'properties',
  aiPanelOpen: false,
  aiInput: '',
  aiLoading: false,
  history: [],
  historyIndex: -1,
};
