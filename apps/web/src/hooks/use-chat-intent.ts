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

import { useState, useCallback } from 'react';

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

/**
 * Quick detection of potential intent triggers (client-side heuristic)
 * Returns true if the message might contain a component intent
 */
export function mightHaveIntent(message: string): boolean {
  const lower = message.toLowerCase().trim();

  // Slash commands
  if (lower.startsWith('/')) return true;

  // Common poll triggers
  if (
    lower.includes('poll') ||
    lower.includes('vote') ||
    lower.includes("let's vote") ||
    lower.includes('voting')
  ) {
    return true;
  }

  // RSVP triggers
  if (
    lower.includes('rsvp') ||
    lower.includes('sign up') ||
    lower.includes('registration') ||
    lower.includes('attend')
  ) {
    return true;
  }

  // Countdown triggers
  if (
    lower.includes('countdown') ||
    lower.includes('timer') ||
    lower.includes('days until')
  ) {
    return true;
  }

  // Announcement triggers
  if (lower.includes('announce') || message.includes('📢')) {
    return true;
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

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/spaces/${spaceId}/chat/intent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
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
        const errorMessage = err instanceof Error ? err.message : 'Intent check failed';
        setError(errorMessage);
        return { hasIntent: false, intentType: 'none', error: errorMessage };
      } finally {
        setIsLoading(false);
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

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/spaces/${spaceId}/chat/intent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
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
        const errorMessage = err instanceof Error ? err.message : 'Component creation failed';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setIsLoading(false);
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
