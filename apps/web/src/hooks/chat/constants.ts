/**
 * Chat Constants
 *
 * Timing and configuration constants for the chat system.
 */

// Message fetching
export const CHAT_DEFAULT_LIMIT = 50;
export const DEFAULT_BOARD_ID = "general";

// Typing indicators
export const TYPING_INDICATOR_INTERVAL_MS = 3000; // Only send typing indicator every 3s while typing
export const TYPING_TTL_MS = 5000; // Auto-clear typing after 5s of no activity
export const TYPING_CLEANUP_INTERVAL_MS = 30000; // Clean up stale typing every 30s

// SSE reconnection
export const SSE_RECONNECT_BASE_DELAY_MS = 1000;
export const SSE_RECONNECT_MAX_DELAY_MS = 30000;

// In-flight message tracking
export const IN_FLIGHT_CLEANUP_DELAY_MS = 5000;
