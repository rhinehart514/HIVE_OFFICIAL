'use client';

/**
 * useGestureActions - Touch gesture handler for message interactions
 *
 * Provides swipe and long-press gesture detection for mobile experiences:
 * - Swipe left → Reply
 * - Swipe right → React
 * - Long press → Context menu
 *
 * Features:
 * - Velocity-based gesture detection
 * - Configurable thresholds
 * - Visual feedback ready (returns progress values)
 * - Haptic feedback callbacks
 * - Touch and pointer event support
 *
 * @example
 * const { handlers, swipeProgress, isLongPressing } = useGestureActions({
 *   onSwipeLeft: () => openReply(),
 *   onSwipeRight: () => openReactions(),
 *   onLongPress: () => openContextMenu(),
 * });
 *
 * <div {...handlers}>Message content</div>
 *
 * @author HIVE Frontend Team
 * @version 1.0.0
 */

import * as React from 'react';

// ============================================================
// Types
// ============================================================

export type SwipeDirection = 'left' | 'right' | 'up' | 'down';
export type GestureAction = 'reply' | 'react' | 'menu' | 'pin' | 'delete';

export interface GestureConfig {
  /** Minimum distance to trigger swipe (px) */
  swipeThreshold?: number;
  /** Minimum velocity to trigger swipe (px/ms) */
  velocityThreshold?: number;
  /** Time required for long press (ms) */
  longPressDelay?: number;
  /** Maximum movement allowed during long press (px) */
  longPressMoveTolerance?: number;
  /** Whether to enable swipe gestures */
  enableSwipe?: boolean;
  /** Whether to enable long press */
  enableLongPress?: boolean;
  /** Directions to allow swipe */
  allowedDirections?: SwipeDirection[];
}

export interface GestureCallbacks {
  /** Called when swipe left completes */
  onSwipeLeft?: () => void;
  /** Called when swipe right completes */
  onSwipeRight?: () => void;
  /** Called when swipe up completes */
  onSwipeUp?: () => void;
  /** Called when swipe down completes */
  onSwipeDown?: () => void;
  /** Called when long press triggers */
  onLongPress?: () => void;
  /** Called with progress during active swipe (0-1) */
  onSwipeProgress?: (progress: number, direction: SwipeDirection) => void;
  /** Called for haptic feedback */
  onHaptic?: (type: 'light' | 'medium' | 'heavy') => void;
}

export interface UseGestureActionsOptions extends GestureConfig, GestureCallbacks {}

export interface GestureState {
  /** Whether a gesture is currently active */
  isActive: boolean;
  /** Whether currently long pressing */
  isLongPressing: boolean;
  /** Current swipe direction (if any) */
  swipeDirection: SwipeDirection | null;
  /** Current swipe progress (0-1) */
  swipeProgress: number;
  /** Current swipe offset in pixels */
  swipeOffset: { x: number; y: number };
}

export interface UseGestureActionsReturn extends GestureState {
  /** Event handlers to spread onto the element */
  handlers: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: (e: React.TouchEvent) => void;
    onTouchCancel: (e: React.TouchEvent) => void;
    onPointerDown: (e: React.PointerEvent) => void;
    onPointerMove: (e: React.PointerEvent) => void;
    onPointerUp: (e: React.PointerEvent) => void;
    onPointerCancel: (e: React.PointerEvent) => void;
  };
  /** Reset gesture state */
  reset: () => void;
}

// ============================================================
// Constants
// ============================================================

const DEFAULT_CONFIG: Required<GestureConfig> = {
  swipeThreshold: 80,
  velocityThreshold: 0.5,
  longPressDelay: 500,
  longPressMoveTolerance: 10,
  enableSwipe: true,
  enableLongPress: true,
  allowedDirections: ['left', 'right'],
};

// ============================================================
// Hook Implementation
// ============================================================

export function useGestureActions(
  options: UseGestureActionsOptions = {}
): UseGestureActionsReturn {
  const {
    swipeThreshold = DEFAULT_CONFIG.swipeThreshold,
    velocityThreshold = DEFAULT_CONFIG.velocityThreshold,
    longPressDelay = DEFAULT_CONFIG.longPressDelay,
    longPressMoveTolerance = DEFAULT_CONFIG.longPressMoveTolerance,
    enableSwipe = DEFAULT_CONFIG.enableSwipe,
    enableLongPress = DEFAULT_CONFIG.enableLongPress,
    allowedDirections = DEFAULT_CONFIG.allowedDirections,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onLongPress,
    onSwipeProgress,
    onHaptic,
  } = options;

  // State
  const [state, setState] = React.useState<GestureState>({
    isActive: false,
    isLongPressing: false,
    swipeDirection: null,
    swipeProgress: 0,
    swipeOffset: { x: 0, y: 0 },
  });

  // Refs for tracking
  const startPosRef = React.useRef<{ x: number; y: number } | null>(null);
  const startTimeRef = React.useRef<number>(0);
  const longPressTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const hasTriggeredLongPressRef = React.useRef(false);
  const activePointerRef = React.useRef<number | null>(null);

  // Reset function
  const reset = React.useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    startPosRef.current = null;
    startTimeRef.current = 0;
    hasTriggeredLongPressRef.current = false;
    activePointerRef.current = null;
    setState({
      isActive: false,
      isLongPressing: false,
      swipeDirection: null,
      swipeProgress: 0,
      swipeOffset: { x: 0, y: 0 },
    });
  }, []);

  // Calculate swipe direction from delta
  const getSwipeDirection = React.useCallback(
    (deltaX: number, deltaY: number): SwipeDirection | null => {
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      // Determine primary direction
      if (absX > absY) {
        const dir: SwipeDirection = deltaX < 0 ? 'left' : 'right';
        return allowedDirections.includes(dir) ? dir : null;
      } else if (absY > absX) {
        const dir: SwipeDirection = deltaY < 0 ? 'up' : 'down';
        return allowedDirections.includes(dir) ? dir : null;
      }
      return null;
    },
    [allowedDirections]
  );

  // Handle gesture start
  const handleStart = React.useCallback(
    (x: number, y: number, pointerId?: number) => {
      startPosRef.current = { x, y };
      startTimeRef.current = Date.now();
      hasTriggeredLongPressRef.current = false;
      if (pointerId !== undefined) {
        activePointerRef.current = pointerId;
      }

      setState((prev) => ({
        ...prev,
        isActive: true,
        swipeDirection: null,
        swipeProgress: 0,
        swipeOffset: { x: 0, y: 0 },
      }));

      // Start long press timer
      if (enableLongPress && onLongPress) {
        longPressTimerRef.current = setTimeout(() => {
          if (!hasTriggeredLongPressRef.current) {
            hasTriggeredLongPressRef.current = true;
            onHaptic?.('medium');
            onLongPress();
            setState((prev) => ({ ...prev, isLongPressing: true }));
          }
        }, longPressDelay);
      }
    },
    [enableLongPress, onLongPress, longPressDelay, onHaptic]
  );

  // Handle gesture move
  const handleMove = React.useCallback(
    (x: number, y: number, pointerId?: number) => {
      if (!startPosRef.current) return;
      if (pointerId !== undefined && activePointerRef.current !== pointerId) return;

      const deltaX = x - startPosRef.current.x;
      const deltaY = y - startPosRef.current.y;
      const distance = Math.sqrt(deltaX ** 2 + deltaY ** 2);

      // Cancel long press if moved too much
      if (distance > longPressMoveTolerance && longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }

      // Skip if long press already triggered
      if (hasTriggeredLongPressRef.current) return;

      // Skip if swipe disabled
      if (!enableSwipe) return;

      const direction = getSwipeDirection(deltaX, deltaY);
      if (!direction) return;

      // Calculate progress based on threshold
      const relevantDelta = direction === 'left' || direction === 'right' ? Math.abs(deltaX) : Math.abs(deltaY);
      const progress = Math.min(relevantDelta / swipeThreshold, 1);

      // Notify progress
      onSwipeProgress?.(progress, direction);

      setState((prev) => ({
        ...prev,
        swipeDirection: direction,
        swipeProgress: progress,
        swipeOffset: { x: deltaX, y: deltaY },
      }));
    },
    [enableSwipe, swipeThreshold, longPressMoveTolerance, getSwipeDirection, onSwipeProgress]
  );

  // Handle gesture end
  const handleEnd = React.useCallback(
    (x: number, y: number, pointerId?: number) => {
      if (!startPosRef.current) {
        reset();
        return;
      }

      if (pointerId !== undefined && activePointerRef.current !== pointerId) return;

      // Cancel long press timer
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }

      // Skip if long press was triggered
      if (hasTriggeredLongPressRef.current) {
        reset();
        return;
      }

      const deltaX = x - startPosRef.current.x;
      const deltaY = y - startPosRef.current.y;
      const distance = Math.sqrt(deltaX ** 2 + deltaY ** 2);
      const duration = Date.now() - startTimeRef.current;
      const velocity = distance / duration;

      // Check if swipe meets threshold
      const meetsDistanceThreshold = distance >= swipeThreshold;
      const meetsVelocityThreshold = velocity >= velocityThreshold;

      if (enableSwipe && (meetsDistanceThreshold || meetsVelocityThreshold)) {
        const direction = getSwipeDirection(deltaX, deltaY);

        if (direction) {
          onHaptic?.('light');

          switch (direction) {
            case 'left':
              onSwipeLeft?.();
              break;
            case 'right':
              onSwipeRight?.();
              break;
            case 'up':
              onSwipeUp?.();
              break;
            case 'down':
              onSwipeDown?.();
              break;
          }
        }
      }

      reset();
    },
    [
      enableSwipe,
      swipeThreshold,
      velocityThreshold,
      getSwipeDirection,
      onSwipeLeft,
      onSwipeRight,
      onSwipeUp,
      onSwipeDown,
      onHaptic,
      reset,
    ]
  );

  // Touch handlers
  const handleTouchStart = React.useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];
      handleStart(touch.clientX, touch.clientY);
    },
    [handleStart]
  );

  const handleTouchMove = React.useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];
      handleMove(touch.clientX, touch.clientY);
    },
    [handleMove]
  );

  const handleTouchEnd = React.useCallback(
    (e: React.TouchEvent) => {
      if (e.changedTouches.length !== 1) return;
      const touch = e.changedTouches[0];
      handleEnd(touch.clientX, touch.clientY);
    },
    [handleEnd]
  );

  const handleTouchCancel = React.useCallback(() => {
    reset();
  }, [reset]);

  // Pointer handlers (for desktop/hybrid devices)
  const handlePointerDown = React.useCallback(
    (e: React.PointerEvent) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      handleStart(e.clientX, e.clientY, e.pointerId);
    },
    [handleStart]
  );

  const handlePointerMove = React.useCallback(
    (e: React.PointerEvent) => {
      handleMove(e.clientX, e.clientY, e.pointerId);
    },
    [handleMove]
  );

  const handlePointerUp = React.useCallback(
    (e: React.PointerEvent) => {
      handleEnd(e.clientX, e.clientY, e.pointerId);
    },
    [handleEnd]
  );

  const handlePointerCancel = React.useCallback(() => {
    reset();
  }, [reset]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  return {
    ...state,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onTouchCancel: handleTouchCancel,
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerCancel,
    },
    reset,
  };
}

// ============================================================
// Preset Configurations
// ============================================================

/**
 * Preset for message gestures
 * - Swipe left → Reply
 * - Swipe right → React
 * - Long press → Context menu
 */
export const MESSAGE_GESTURE_CONFIG: GestureConfig = {
  swipeThreshold: 80,
  velocityThreshold: 0.5,
  longPressDelay: 500,
  enableSwipe: true,
  enableLongPress: true,
  allowedDirections: ['left', 'right'],
};

/**
 * Preset for card gestures (like Tinder cards)
 * - All directions allowed
 * - Higher threshold for intentional swipes
 */
export const CARD_GESTURE_CONFIG: GestureConfig = {
  swipeThreshold: 100,
  velocityThreshold: 0.6,
  longPressDelay: 600,
  enableSwipe: true,
  enableLongPress: false,
  allowedDirections: ['left', 'right', 'up', 'down'],
};

/**
 * Preset for list items
 * - Only horizontal swipes
 * - Long press for selection
 */
export const LIST_ITEM_GESTURE_CONFIG: GestureConfig = {
  swipeThreshold: 60,
  velocityThreshold: 0.4,
  longPressDelay: 400,
  enableSwipe: true,
  enableLongPress: true,
  allowedDirections: ['left', 'right'],
};

export default useGestureActions;
