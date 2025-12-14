/**
 * useIntentDetection Hook
 *
 * Provides real-time intent detection for chat messages.
 * Detects when a leader is typing a message that could create
 * a component (poll, RSVP, countdown, announcement).
 *
 * Features:
 * - Debounced detection to avoid spam
 * - Slash command detection (instant)
 * - Natural language detection (AI-powered)
 * - Preview generation for confirmation UI
 *
 * @example
 * ```tsx
 * const { intent, isDetecting, detectIntent, clearIntent } = useIntentDetection({
 *   spaceId,
 *   boardId,
 *   isLeader: true,
 * });
 *
 * // On input change
 * useEffect(() => {
 *   if (message.length > 5) {
 *     detectIntent(message);
 *   } else {
 *     clearIntent();
 *   }
 * }, [message, detectIntent, clearIntent]);
 *
 * // Render preview if intent detected
 * {intent && <IntentPreview intent={intent} onConfirm={handleConfirm} />}
 * ```
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { secureApiFetch } from '@/lib/api-client';
import type { IntentType, ComponentPreview } from '@/lib/hivelab';
import {
  isSlashCommand,
  parseSlashCommandToIntent,
  getCommandSuggestions,
  type CommandSuggestion,
} from '@/lib/hivelab';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface DetectedIntent {
  type: IntentType;
  confidence: number;
  preview: ComponentPreview | null;
  params: Record<string, unknown>;
  isSlashCommand: boolean;
  isValid: boolean;
  errors?: string[];
}

export interface UseIntentDetectionOptions {
  /** Space ID for API context */
  spaceId: string;
  /** Board ID for API context */
  boardId: string;
  /** Whether current user is a leader (required for component creation) */
  isLeader?: boolean;
  /** Debounce delay for NL detection (ms) */
  debounceMs?: number;
  /** Minimum characters before attempting NL detection */
  minCharsForDetection?: number;
  /** Whether to only use pattern matching (no AI) */
  patternOnly?: boolean;
}

export interface UseIntentDetectionResult {
  /** Detected intent, or null if none */
  intent: DetectedIntent | null;
  /** Whether detection is in progress */
  isDetecting: boolean;
  /** Detect intent from message */
  detectIntent: (message: string) => void;
  /** Clear current intent */
  clearIntent: () => void;
  /** Get slash command suggestions */
  getSlashSuggestions: (partialCommand: string) => CommandSuggestion[];
  /** Error message if detection failed */
  error: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook Implementation
// ─────────────────────────────────────────────────────────────────────────────

export function useIntentDetection(
  options: UseIntentDetectionOptions
): UseIntentDetectionResult {
  const {
    spaceId,
    boardId,
    isLeader = false,
    debounceMs = 500,
    minCharsForDetection = 10,
    patternOnly = false,
  } = options;

  const [intent, setIntent] = useState<DetectedIntent | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs for debouncing
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastMessageRef = useRef<string>('');

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  /**
   * Handle slash command detection (instant, no API call)
   */
  const handleSlashCommand = useCallback((message: string): DetectedIntent | null => {
    const parsed = parseSlashCommandToIntent(message);
    if (!parsed) return null;

    return {
      type: parsed.type,
      confidence: parsed.isValid ? 1.0 : 0.5,
      preview: {
        type: parsed.type,
        title: parsed.type.charAt(0).toUpperCase() + parsed.type.slice(1),
        description: getDescriptionFromParams(parsed.type, parsed.params),
        details: {},
      },
      params: parsed.params as Record<string, unknown>,
      isSlashCommand: true,
      isValid: parsed.isValid,
      errors: parsed.errors.length > 0 ? parsed.errors : undefined,
    };
  }, []);

  /**
   * Handle natural language detection (API call)
   */
  const handleNLDetection = useCallback(async (message: string): Promise<DetectedIntent | null> => {
    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      const response = await secureApiFetch(
        `/api/spaces/${spaceId}/chat/intent`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message,
            boardId,
            patternOnly,
            previewOnly: true,
          }),
          signal: abortControllerRef.current.signal,
        }
      );

      if (!response.ok) {
        throw new Error('Failed to detect intent');
      }

      const data = await response.json();

      if (!data.hasIntent) {
        return null;
      }

      return {
        type: data.type,
        confidence: data.confidence || 1,
        preview: data.preview,
        params: data.params || {},
        isSlashCommand: data.isSlashCommand || false,
        isValid: data.valid !== false,
        errors: data.errors,
      };
    } catch (err) {
      // Ignore abort errors
      if (err instanceof Error && err.name === 'AbortError') {
        return null;
      }
      throw err;
    }
  }, [spaceId, boardId, patternOnly]);

  /**
   * Main detection function
   */
  const detectIntent = useCallback((message: string) => {
    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Non-leaders don't get intent detection
    if (!isLeader) {
      setIntent(null);
      return;
    }

    // Empty or very short messages
    if (!message || message.trim().length < 2) {
      setIntent(null);
      setError(null);
      return;
    }

    lastMessageRef.current = message;

    // Slash commands are instant (no debounce)
    if (isSlashCommand(message)) {
      const slashIntent = handleSlashCommand(message);
      setIntent(slashIntent);
      setError(null);
      setIsDetecting(false);
      return;
    }

    // For NL detection, require minimum characters
    if (message.length < minCharsForDetection) {
      setIntent(null);
      return;
    }

    // Debounce NL detection
    setIsDetecting(true);
    debounceTimerRef.current = setTimeout(async () => {
      // Check if message changed during debounce
      if (message !== lastMessageRef.current) {
        return;
      }

      try {
        const detected = await handleNLDetection(message);
        // Only update if message is still the same
        if (message === lastMessageRef.current) {
          setIntent(detected);
          setError(null);
        }
      } catch (err) {
        if (message === lastMessageRef.current) {
          setError(err instanceof Error ? err.message : 'Detection failed');
          setIntent(null);
        }
      } finally {
        if (message === lastMessageRef.current) {
          setIsDetecting(false);
        }
      }
    }, debounceMs);
  }, [isLeader, debounceMs, minCharsForDetection, handleSlashCommand, handleNLDetection]);

  /**
   * Clear current intent
   */
  const clearIntent = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIntent(null);
    setError(null);
    setIsDetecting(false);
    lastMessageRef.current = '';
  }, []);

  /**
   * Get slash command suggestions
   */
  const getSlashSuggestions = useCallback((partialCommand: string): CommandSuggestion[] => {
    if (!isLeader) return [];
    return getCommandSuggestions(partialCommand);
  }, [isLeader]);

  return {
    intent,
    isDetecting,
    detectIntent,
    clearIntent,
    getSlashSuggestions,
    error,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function getDescriptionFromParams(type: IntentType, params: Record<string, unknown>): string {
  switch (type) {
    case 'poll':
      return (params.question as string) || 'Poll';
    case 'rsvp':
      return (params.eventTitle as string) || 'RSVP';
    case 'countdown':
      return (params.title as string) || 'Countdown';
    case 'announcement':
      const content = params.content as string;
      return content ? content.substring(0, 50) + (content.length > 50 ? '...' : '') : 'Announcement';
    default:
      return '';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Component Preview UI Helper
// ─────────────────────────────────────────────────────────────────────────────

export interface IntentPreviewProps {
  intent: DetectedIntent;
  onConfirm: () => void;
  onDismiss: () => void;
}

/**
 * Suggested preview UI for detected intents
 * This is exported as a helper but consumers can build their own UI
 */
export function getIntentPreviewConfig(intent: DetectedIntent): {
  icon: string;
  color: string;
  actionText: string;
} {
  switch (intent.type) {
    case 'poll':
      return { icon: '📊', color: 'blue', actionText: 'Create Poll' };
    case 'rsvp':
      return { icon: '📅', color: 'green', actionText: 'Create RSVP' };
    case 'countdown':
      return { icon: '⏱️', color: 'orange', actionText: 'Create Countdown' };
    case 'announcement':
      return { icon: '📢', color: 'yellow', actionText: 'Post Announcement' };
    default:
      return { icon: '✨', color: 'gray', actionText: 'Create' };
  }
}
