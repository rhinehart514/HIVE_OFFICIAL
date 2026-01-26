/**
 * Core Element Types
 *
 * Shared types for the HiveLab element system.
 * These provide the foundation for consistent element behavior.
 */

import type { ElementProps, ElementSharedState, ElementUserState } from '../../../../lib/hivelab/element-system';

// ============================================================
// Element Mode - Edit vs Runtime
// ============================================================

export type ElementMode = 'edit' | 'runtime' | 'preview';

export interface ElementModeProps {
  /** Current rendering mode */
  mode: ElementMode;
  /** Whether the element is selected in the IDE */
  isSelected?: boolean;
  /** Whether the element is being dragged */
  isDragging?: boolean;
}

// ============================================================
// Element State - Unified state management
// ============================================================

export type ElementStatus =
  | 'empty'     // No data yet
  | 'loading'   // Fetching data
  | 'partial'   // Some data, incomplete
  | 'complete'  // Ready to display
  | 'disabled'  // Cannot interact
  | 'error'     // Something went wrong
  | 'success';  // Action completed

export interface ElementState<T = unknown> {
  /** Current status of the element */
  status: ElementStatus;
  /** The resolved data value */
  value: T | null;
  /** Error message if status is 'error' */
  error?: string;
  /** Progress percentage for loading states (0-100) */
  progress?: number;
}

// ============================================================
// Element Actions - Standard action types
// ============================================================

export type ElementActionType =
  | 'increment'
  | 'decrement'
  | 'select'
  | 'deselect'
  | 'submit'
  | 'reset'
  | 'toggle'
  | 'vote'
  | 'rsvp'
  | 'custom';

export interface ElementAction {
  type: ElementActionType;
  payload?: unknown;
  /** For optimistic updates - unique ID to track the action */
  optimisticId?: string;
}

// ============================================================
// Element Config - Base configuration
// ============================================================

export interface BaseElementConfig {
  /** Element-specific configuration */
  [key: string]: unknown;
}

// ============================================================
// Extended Element Props - With mode support
// ============================================================

export interface ExtendedElementProps<TConfig = BaseElementConfig> extends Omit<ElementProps, 'config'> {
  /** Element configuration */
  config: TConfig;
  /** Rendering mode */
  mode?: ElementMode;
  /** Whether this element is selected in the IDE */
  isSelected?: boolean;
  /** Callback when element requests focus */
  onFocus?: () => void;
  /** Callback when element requests blur */
  onBlur?: () => void;
}

// ============================================================
// State Extraction Helpers - For useElementState hook
// ============================================================

export interface StateExtractor<T> {
  /** Key pattern for shared state counters (e.g., "{id}:{optionId}") */
  counterKey?: (id: string, subKey?: string) => string;
  /** Key pattern for shared state collections */
  collectionKey?: (id: string, collectionName: string) => string;
  /** Key pattern for user state selections */
  selectionKey?: (id: string, field: string) => string;
  /** Transform raw state into typed value */
  transform?: (raw: {
    sharedState?: ElementSharedState;
    userState?: ElementUserState;
    data?: unknown;
  }) => T;
}

// ============================================================
// Element Component Types
// ============================================================

export type ElementComponent<TConfig = BaseElementConfig> = (
  props: ExtendedElementProps<TConfig>
) => React.JSX.Element;

export type ElementRenderer<TConfig = BaseElementConfig> = (
  props: ElementProps & { config: TConfig }
) => React.JSX.Element;
