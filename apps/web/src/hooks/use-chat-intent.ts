/**
 * useChatIntent Hook
 *
 * Frontend hook for detecting and creating inline components from chat messages.
 * Part of HiveLab Winter 2025 Strategy: Chat-First Foundation
 *
 * Usage:
 * ```tsx
 * const { checkIntent, createComponent, isLoading } = useChatIntent(spaceId);
 *
 * // In message send handler:
 * const intent = await checkIntent(message, boardId);
 * if (intent.hasIntent) {
 *   // Show confirmation or create directly
 *   const result = await createComponent(message, boardId);
 * }
 * ```
 */

import { useState, useCallback, useRef, useEffect } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type IntentType = 'poll' | 'rsvp' | 'countdown' | 'announcement' | 'help' | 'none';

export interface IntentCheckResult {
  hasIntent: boolean;
  intentType: IntentType;
  confidence?: number;
  isCommand?: boolean;
  isValid?: boolean;
  canCreate?: boolean;
  preview?: string;
  confirmation?: string;
  helpText?: string;
  error?: string;
  params?: Record<string, unknown>;
  needsMoreInfo?: boolean;
  confirmationMessage?: string;
}

export interface ComponentCreationResult {
  success: boolean;
  created?: boolean;
  component?: {
    id: string;
    type: string;
    config: Record<string, unknown>;
  };
  description?: string;
  error?: string;
}

export interface UseChatIntentReturn {
  /** Check if a message contains a component intent */
  checkIntent: (message: string, boardId: string) => Promise<IntentCheckResult>;

  /** Create component from message (call after confirmation) */
  createComponent: (
    message: string,
    boardId: string,
    messageId?: string
  ) => Promise<ComponentCreationResult>;

  /** Preview what would be created without actually creating */
  previewComponent: (message: string, boardId: string) => Promise<IntentCheckResult>;

  /** Loading state */
  isLoading: boolean;

  /** Error state */
  error: string | null;

  /** Clear error */
  clearError: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Quick detection (client-side, no API call)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Quick check if message starts with a slash command (no API needed)
 */
export function isSlashCommand(message: string): boolean {
  return message.trim().startsWith('/');
}

/**
 * Get the command name from a slash command
 */
export function getSlashCommandName(message: string): string | null {
  const match = message.trim().match(/^\/(\w+)/);
  return match ? match[1].toLowerCase() : null;
}

// P3 OPTIMIZATION: Use Set for O(1) keyword lookup
const INTENT_KEYWORDS = new Set([
  'poll', 'vote', "let's vote", 'voting',
  'rsvp', 'sign up', 'registration', 'attend',
  'countdown', 'timer', 'days until',
  'announce',
]);

/**
 * Quick detection of potential intent triggers (client-side heuristic)
 * Returns true if the message might contain a component intent
 */
export function mightHaveIntent(message: string): boolean {
  const lower = message.toLowerCase().trim();

  // Slash commands - fastest check
  if (lower.startsWith('/')) return true;

  // Emoji check (announcement)
  if (message.includes('📢')) return true;

  // P3 OPTIMIZATION: Check keywords using Set for faster lookup
  for (const keyword of INTENT_KEYWORDS) {
    if (lower.includes(keyword)) return true;
  }

  return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook Implementation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Hook for detecting and creating inline components from chat messages
 */
export function useChatIntent(spaceId: string): UseChatIntentReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // P2 FIX: Track abort controllers to cancel previous requests on new ones
  const checkIntentControllerRef = useRef<AbortController | null>(null);
  const createComponentControllerRef = useRef<AbortController | null>(null);

  // P2 FIX: Cleanup on unmount
  useEffect(() => {
    return () => {
      checkIntentControllerRef.current?.abort();
      createComponentControllerRef.current?.abort();
    };
  }, []);

  /**
   * Check if a message contains a component intent
   */
  const checkIntent = useCallback(
    async (message: string, boardId: string): Promise<IntentCheckResult> => {
      if (!spaceId || !boardId || !message.trim()) {
        return { hasIntent: false, intentType: 'none' };
      }

      // Quick check - if no obvious triggers, skip API call
      if (!mightHaveIntent(message)) {
        return { hasIntent: false, intentType: 'none' };
      }

      // P2 FIX: Cancel previous request to avoid race condition
      checkIntentControllerRef.current?.abort();
      const controller = new AbortController();
      checkIntentControllerRef.current = controller;

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/spaces/${spaceId}/chat/intent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          signal: controller.signal,
          body: JSON.stringify({
            message,
            boardId,
            createIfDetected: false,
          }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || `Intent check failed: ${response.status}`);
        }

        const data = await response.json();
        return data as IntentCheckResult;
      } catch (err) {
        // P2 FIX: Handle abort gracefully - not an error, just superseded
        if (err instanceof Error && err.name === 'AbortError') {
          return { hasIntent: false, intentType: 'none' };
        }
        const errorMessage = err instanceof Error ? err.message : 'Intent check failed';
        setError(errorMessage);
        return { hasIntent: false, intentType: 'none', error: errorMessage };
      } finally {
        // P2 FIX: Only update loading if this is still the current request
        if (checkIntentControllerRef.current === controller) {
          setIsLoading(false);
          checkIntentControllerRef.current = null;
        }
      }
    },
    [spaceId]
  );

  /**
   * Create component from message
   */
  const createComponent = useCallback(
    async (
      message: string,
      boardId: string,
      messageId?: string
    ): Promise<ComponentCreationResult> => {
      if (!spaceId || !boardId || !message.trim()) {
        return { success: false, error: 'Missing required parameters' };
      }

      // P2 FIX: Cancel previous request to avoid race condition
      createComponentControllerRef.current?.abort();
      const controller = new AbortController();
      createComponentControllerRef.current = controller;

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/spaces/${spaceId}/chat/intent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          signal: controller.signal,
          body: JSON.stringify({
            message,
            boardId,
            messageId,
            createIfDetected: true,
          }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || `Component creation failed: ${response.status}`);
        }

        const data = await response.json();

        if (data.created && data.component) {
          return {
            success: true,
            created: true,
            component: data.component,
            description: data.description,
          };
        }

        // Component wasn't created (e.g., needs more info)
        return {
          success: false,
          error: data.confirmationMessage || data.error || 'Component not created',
        };
      } catch (err) {
        // P2 FIX: Handle abort gracefully
        if (err instanceof Error && err.name === 'AbortError') {
          return { success: false, error: 'Request cancelled' };
        }
        const errorMessage = err instanceof Error ? err.message : 'Component creation failed';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        // P2 FIX: Only update loading if this is still the current request
        if (createComponentControllerRef.current === controller) {
          setIsLoading(false);
          createComponentControllerRef.current = null;
        }
      }
    },
    [spaceId]
  );

  /**
   * Preview what would be created without actually creating
   */
  const previewComponent = useCallback(
    async (message: string, boardId: string): Promise<IntentCheckResult> => {
      // Same as checkIntent but emphasizes the preview use case
      return checkIntent(message, boardId);
    },
    [checkIntent]
  );

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    checkIntent,
    createComponent,
    previewComponent,
    isLoading,
    error,
    clearError,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Utility: Slash Command Autocomplete
// ─────────────────────────────────────────────────────────────────────────────

const SLASH_COMMANDS = [
  { command: '/poll', description: 'Create a poll', syntax: '/poll "Question?" Option1 Option2' },
  { command: '/rsvp', description: 'Create an RSVP', syntax: '/rsvp "Event Name" --date=tomorrow' },
  { command: '/countdown', description: 'Create a countdown', syntax: '/countdown "Event" 2024-12-20' },
  { command: '/announce', description: 'Post announcement', syntax: '/announce Your message here' },
  { command: '/help', description: 'Show help', syntax: '/help [command]' },
];

/**
 * Get autocomplete suggestions for slash commands
 */
export function getSlashCommandSuggestions(input: string): typeof SLASH_COMMANDS {
  if (!input.startsWith('/')) {
    return [];
  }

  const partial = input.slice(1).toLowerCase();

  if (!partial) {
    return SLASH_COMMANDS;
  }

  return SLASH_COMMANDS.filter(cmd =>
    cmd.command.slice(1).startsWith(partial)
  );
}

export default useChatIntent;
