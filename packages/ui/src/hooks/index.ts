// Re-export hooks only (no providers for now to fix build)
export { useShell } from "./use-shell"
// useWelcomeMat - REMOVED (Jan 2026) - Legacy /welcome flow deleted

// HiveLab hooks
export { useToolState, type UseToolStateOptions, type UseToolStateReturn } from "./hivelab/use-tool-state"
export {
  useConnectionCascade,
  type CascadeContext,
  type CascadeResult,
} from "./hivelab/use-connection-cascade"
export { useSpaceContext } from "./hivelab/use-space-context"
export { useMemberContext } from "./hivelab/use-member-context"
export {
  useMediaQuery,
  useIsDesktop,
  useIsTablet,
  useIsMobile,
  useIsLargeScreen,
  useIsMediumScreen,
  useIsSmallScreen
} from "./use-media-query"
export { useMobile, useIsMobile as useMobileBreakpoint } from "./use-mobile"
export {
  useGestureActions,
  MESSAGE_GESTURE_CONFIG,
  CARD_GESTURE_CONFIG,
  LIST_ITEM_GESTURE_CONFIG,
  type SwipeDirection,
  type GestureAction,
  type GestureConfig,
  type GestureCallbacks,
  type UseGestureActionsOptions,
  type GestureState,
  type UseGestureActionsReturn,
} from "./use-gesture-actions"