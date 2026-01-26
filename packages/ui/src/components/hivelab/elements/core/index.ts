/**
 * Core Element Abstractions
 *
 * Centralized exports for the HiveLab element system foundation.
 *
 * This module provides:
 * - Type definitions for elements
 * - State management hooks (DRY pattern)
 * - UI state components (Empty, Loading, Error, Success)
 * - Element wrapper for edit/runtime mode separation
 */

// Types
export type {
  ElementMode,
  ElementModeProps,
  ElementStatus,
  ElementState,
  ElementActionType,
  ElementAction,
  BaseElementConfig,
  ExtendedElementProps,
  StateExtractor,
  ElementComponent,
  ElementRenderer,
} from './types';

// State Management
export {
  useElementState,
  usePollState,
  useCounterState,
  useRsvpState,
  useLeaderboardState,
} from './use-element-state';

export type {
  PollState,
  CounterState,
  RsvpState,
  LeaderboardState,
  LeaderboardEntry,
} from './use-element-state';

// State Components
export {
  ElementEmpty,
  ElementLoading,
  ElementError,
  ElementSkeleton,
  ElementSuccess,
  StateContainer,
} from './element-states';

// Element Wrapper
export {
  ElementWrapper,
  withElementWrapper,
} from './element-wrapper';
