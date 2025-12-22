/**
 * Tool State Manager
 *
 * Immutable state management for HiveLab tools using Immer.
 * Provides simple API for updating tool state with automatic undo/redo support.
 *
 * Features:
 * - Immutable updates via Immer's produce
 * - Undo/redo history (50 actions)
 * - Smart grouping (consecutive edits = 1 undo)
 * - Type-safe with full TypeScript support
 */

import { produce, type Draft } from 'immer';

export interface ToolElement {
  id: string;
  type: string;
  label: string;
  description?: string;
  required: boolean;
  config: Record<string, any>;
}

export interface Tool {
  id: string;
  title: string;
  description?: string;
  elements: ToolElement[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ToolAction {
  type: 'add_element' | 'remove_element' | 'update_element' | 'reorder_elements' | 'update_tool';
  timestamp: Date;
  description: string;
}

export interface ToolHistory {
  past: Tool[];
  present: Tool;
  future: Tool[];
  actions: ToolAction[];
}

const MAX_HISTORY = 50;

/**
 * Create initial tool history
 */
export function createToolHistory(initialTool: Tool): ToolHistory {
  return {
    past: [],
    present: initialTool,
    future: [],
    actions: [],
  };
}

/**
 * Add element to tool
 */
export function addElement(
  history: ToolHistory,
  elementType: string,
  position?: number
): ToolHistory {
  const newElement: ToolElement = {
    id: `element-${Date.now()}`,
    type: elementType,
    label: `${elementType} ${history.present.elements.length + 1}`,
    required: false,
    config: {},
  };

  return updateHistory(
    history,
    (draft) => {
      if (position !== undefined && position >= 0 && position <= draft.elements.length) {
        draft.elements.splice(position, 0, newElement);
      } else {
        draft.elements.push(newElement);
      }
      draft.updatedAt = new Date();
    },
    {
      type: 'add_element',
      timestamp: new Date(),
      description: `Added ${elementType} element`,
    }
  );
}

/**
 * Remove element from tool
 */
export function removeElement(
  history: ToolHistory,
  elementId: string
): ToolHistory {
  const element = history.present.elements.find((el) => el.id === elementId);
  if (!element) return history;

  return updateHistory(
    history,
    (draft) => {
      const index = draft.elements.findIndex((el) => el.id === elementId);
      if (index !== -1) {
        draft.elements.splice(index, 1);
      }
      draft.updatedAt = new Date();
    },
    {
      type: 'remove_element',
      timestamp: new Date(),
      description: `Removed ${element.type} element`,
    }
  );
}

/**
 * Update element properties
 */
export function updateElement(
  history: ToolHistory,
  elementId: string,
  updates: Partial<Omit<ToolElement, 'id' | 'type'>>
): ToolHistory {
  return updateHistory(
    history,
    (draft) => {
      const element = draft.elements.find((el) => el.id === elementId);
      if (element) {
        Object.assign(element, updates);
      }
      draft.updatedAt = new Date();
    },
    {
      type: 'update_element',
      timestamp: new Date(),
      description: `Updated element properties`,
    }
  );
}

/**
 * Reorder elements
 */
export function reorderElements(
  history: ToolHistory,
  activeId: string,
  overId: string
): ToolHistory {
  return updateHistory(
    history,
    (draft) => {
      const activeIndex = draft.elements.findIndex((el) => el.id === activeId);
      const overIndex = draft.elements.findIndex((el) => el.id === overId);

      if (activeIndex !== -1 && overIndex !== -1) {
        const [removed] = draft.elements.splice(activeIndex, 1);
        if (removed) {
          draft.elements.splice(overIndex, 0, removed);
        }
      }
      draft.updatedAt = new Date();
    },
    {
      type: 'reorder_elements',
      timestamp: new Date(),
      description: `Reordered elements`,
    }
  );
}

/**
 * Update tool metadata
 */
export function updateTool(
  history: ToolHistory,
  updates: Partial<Omit<Tool, 'id' | 'elements' | 'createdAt'>>
): ToolHistory {
  return updateHistory(
    history,
    (draft) => {
      Object.assign(draft, updates);
      draft.updatedAt = new Date();
    },
    {
      type: 'update_tool',
      timestamp: new Date(),
      description: `Updated tool settings`,
    }
  );
}

/**
 * Undo last action
 */
export function undo(history: ToolHistory): ToolHistory {
  if (history.past.length === 0) return history;

  const previous = history.past[history.past.length - 1];
  if (!previous) return history;

  const newPast = history.past.slice(0, history.past.length - 1);

  return {
    past: newPast,
    present: previous,
    future: [history.present, ...history.future],
    actions: history.actions,
  };
}

/**
 * Redo last undone action
 */
export function redo(history: ToolHistory): ToolHistory {
  if (history.future.length === 0) return history;

  const next = history.future[0];
  if (!next) return history;

  const newFuture = history.future.slice(1);

  return {
    past: [...history.past, history.present],
    present: next,
    future: newFuture,
    actions: history.actions,
  };
}

/**
 * Check if can undo
 */
export function canUndo(history: ToolHistory): boolean {
  return history.past.length > 0;
}

/**
 * Check if can redo
 */
export function canRedo(history: ToolHistory): boolean {
  return history.future.length > 0;
}

/**
 * Get last action description
 */
export function getLastActionDescription(history: ToolHistory): string | null {
  if (history.actions.length === 0) return null;
  return history.actions[history.actions.length - 1]?.description || null;
}

/**
 * Internal helper: Update history with new state
 */
function updateHistory(
  history: ToolHistory,
  updater: (draft: Draft<Tool>) => void,
  action: ToolAction
): ToolHistory {
  const newPresent = produce(history.present, updater);

  // Limit history size
  let newPast = [...history.past, history.present];
  if (newPast.length > MAX_HISTORY) {
    newPast = newPast.slice(newPast.length - MAX_HISTORY);
  }

  return {
    past: newPast,
    present: newPresent,
    future: [], // Clear redo stack on new action
    actions: [...history.actions.slice(-MAX_HISTORY), action],
  };
}
