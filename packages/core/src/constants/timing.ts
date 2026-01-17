/**
 * Timing Constants
 *
 * Standard timing values for debouncing, throttling, animations, and TTLs.
 * Use these constants instead of hardcoded numbers.
 *
 * @example
 * import { TIMING } from '@hive/core/constants';
 * setTimeout(() => {...}, TIMING.DEBOUNCE_DEFAULT);
 */

export const TIMING = {
  // Debouncing
  DEBOUNCE_FAST: 150,
  DEBOUNCE_DEFAULT: 300,
  DEBOUNCE_SLOW: 500,

  // Throttling
  THROTTLE_TYPING: 3000, // Typing indicators
  THROTTLE_PRESENCE: 5000, // Presence updates
  THROTTLE_ANALYTICS: 10000, // Analytics events

  // SSE/Realtime
  SSE_RECONNECT_BASE: 1000,
  SSE_RECONNECT_MAX: 30000,
  SSE_HEARTBEAT_INTERVAL: 30000,

  // TTLs
  TTL_TYPING: 5000, // Auto-clear typing after this
  TTL_PRESENCE: 60000, // Consider user offline after this
  TTL_CACHE_SHORT: 60000, // 1 minute cache
  TTL_CACHE_MEDIUM: 300000, // 5 minute cache
  TTL_CACHE_LONG: 3600000, // 1 hour cache

  // Animations (match Framer Motion)
  ANIMATION_SNAP: 150,
  ANIMATION_DEFAULT: 300,
  ANIMATION_SMOOTH: 500,
  ANIMATION_DRAMATIC: 700,

  // Toast/Notification durations
  TOAST_SHORT: 2000,
  TOAST_DEFAULT: 3000,
  TOAST_LONG: 5000,

  // Polling intervals
  POLL_FAST: 5000,
  POLL_DEFAULT: 15000,
  POLL_SLOW: 60000,

  // Cleanup intervals
  CLEANUP_TYPING: 30000,
  CLEANUP_PRESENCE: 60000,

  // Request timeouts
  TIMEOUT_API_DEFAULT: 10000,
  TIMEOUT_API_LONG: 30000,
  TIMEOUT_UPLOAD: 120000,
} as const;

export type TimingValue = (typeof TIMING)[keyof typeof TIMING];
