'use client';

import { useState, useCallback, useRef } from 'react';
import { logger } from '@/lib/logger';

// =============================================================================
// Types
// =============================================================================

export interface ContentCheckResult {
  isAllowed: boolean;
  warnings: string[];
  blockedReason?: string;
  suggestedEdit?: string;
  confidence: number;
  processingTime: number;
}

export interface ContentModerationOptions {
  /** Enable real-time checking as user types */
  realtimeCheck?: boolean;
  /** Debounce delay for real-time checks (ms) */
  debounceMs?: number;
  /** Context for analysis (affects sensitivity) */
  context?: 'chat' | 'post' | 'profile' | 'event' | 'space';
  /** User's trust score (0-1) */
  userTrustScore?: number;
  /** Whether this is user's first post in this context */
  isFirstPost?: boolean;
}

// =============================================================================
// Client-side content moderation
// =============================================================================

/**
 * Quick client-side content check patterns
 * These run instantly before server validation
 */
const QUICK_CHECK_PATTERNS = {
  // Severe patterns that should be blocked immediately
  slurs: [
    /\bn[i1l]gg[ae3]r?\b/i,
    /\bf[a4]gg?[o0]t\b/i,
    /\bk[i1l]ke\b/i,
    /\br[e3]t[a4]rd\b/i,
  ],
  threats: [
    /\b(kill|murder|shoot|stab|hurt)\s+(you|him|her|them|everyone)\b/i,
    /\bi('ll|\s+will)\s+(kill|hurt|find)\s+you\b/i,
  ],
  selfHarm: [
    /\b(kill|hurt|cut)\s+my?self\b/i,
    /\bwant\s+to\s+die\b/i,
    /\bend\s+(my\s+)?life\b/i,
  ],
  // Warning patterns (allowed but flagged)
  warnings: {
    profanity: /\b(fuck|shit|ass|damn|bitch)\b/i,
    spam: /(.)\1{4,}|(\b\w+\b)\s+\2{2,}/,
    capsLock: /[A-Z]{10,}/,
    excessiveEmoji: /[\u{1F600}-\u{1F64F}]{5,}/u,
  },
};

/**
 * Client-side quick check (runs instantly)
 */
function quickClientCheck(content: string): {
  blocked: boolean;
  blockedReason?: string;
  warnings: string[];
} {
  const warnings: string[] = [];

  // Check for severe content (block)
  if (QUICK_CHECK_PATTERNS.slurs.some(p => p.test(content))) {
    return {
      blocked: true,
      blockedReason: 'This message contains prohibited language.',
      warnings: [],
    };
  }

  if (QUICK_CHECK_PATTERNS.threats.some(p => p.test(content))) {
    return {
      blocked: true,
      blockedReason: 'This message contains threatening language.',
      warnings: [],
    };
  }

  // Self-harm content gets special handling (not blocked, but escalated)
  if (QUICK_CHECK_PATTERNS.selfHarm.some(p => p.test(content))) {
    warnings.push('If you are struggling, please reach out for help.');
  }

  // Check for warning patterns
  if (QUICK_CHECK_PATTERNS.warnings.profanity.test(content)) {
    warnings.push('This message contains strong language.');
  }

  if (QUICK_CHECK_PATTERNS.warnings.spam.test(content)) {
    warnings.push('Please avoid repetitive text.');
  }

  if (QUICK_CHECK_PATTERNS.warnings.capsLock.test(content)) {
    warnings.push('Please avoid excessive caps lock.');
  }

  if (QUICK_CHECK_PATTERNS.warnings.excessiveEmoji.test(content)) {
    warnings.push('Consider using fewer emojis.');
  }

  return { blocked: false, warnings };
}

// =============================================================================
// Hook
// =============================================================================

/**
 * useContentModeration - Real-time content moderation hook
 *
 * Provides instant client-side checks and optional server-side validation
 * for content before submission.
 *
 * @example
 * ```tsx
 * function ChatInput() {
 *   const { checkContent, isChecking, lastResult } = useContentModeration({
 *     context: 'chat',
 *     realtimeCheck: true,
 *   });
 *
 *   const handleSubmit = async (content: string) => {
 *     const result = await checkContent(content);
 *     if (!result.isAllowed) {
 *       showError(result.blockedReason);
 *       return;
 *     }
 *     sendMessage(content);
 *   };
 *
 *   return (
 *     <input onChange={e => checkContent(e.target.value)} />
 *     {lastResult?.warnings.map(w => <Warning>{w}</Warning>)}
 *   );
 * }
 * ```
 */
export function useContentModeration(options: ContentModerationOptions = {}) {
  const {
    realtimeCheck = false,
    debounceMs = 300,
    context = 'chat',
    userTrustScore = 0.5,
    isFirstPost = false,
  } = options;

  const [isChecking, setIsChecking] = useState(false);
  const [lastResult, setLastResult] = useState<ContentCheckResult | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastCheckedContentRef = useRef<string>('');

  /**
   * Check content for moderation (client-side quick check + optional server)
   */
  const checkContent = useCallback(
    async (content: string, requireServerCheck = false): Promise<ContentCheckResult> => {
      const startTime = Date.now();

      // Skip empty content
      if (!content.trim()) {
        const emptyResult: ContentCheckResult = {
          isAllowed: true,
          warnings: [],
          confidence: 1,
          processingTime: 0,
        };
        setLastResult(emptyResult);
        return emptyResult;
      }

      // Skip if same content was just checked
      if (content === lastCheckedContentRef.current && lastResult && !requireServerCheck) {
        return lastResult;
      }
      lastCheckedContentRef.current = content;

      // Quick client-side check (instant)
      const quickResult = quickClientCheck(content);

      if (quickResult.blocked) {
        const result: ContentCheckResult = {
          isAllowed: false,
          warnings: [],
          blockedReason: quickResult.blockedReason,
          confidence: 0.95,
          processingTime: Date.now() - startTime,
        };
        setLastResult(result);
        return result;
      }

      // For real-time typing, just return quick check results
      if (realtimeCheck && !requireServerCheck) {
        const result: ContentCheckResult = {
          isAllowed: true,
          warnings: quickResult.warnings,
          confidence: 0.7, // Lower confidence for client-only check
          processingTime: Date.now() - startTime,
        };
        setLastResult(result);
        return result;
      }

      // Server-side check for final submission
      setIsChecking(true);

      try {
        const response = await fetch('/api/content/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            content,
            context,
            userTrustScore,
            isFirstPost,
          }),
        });

        if (!response.ok) {
          throw new Error('Content check failed');
        }

        const serverResult = await response.json();

        const result: ContentCheckResult = {
          isAllowed: serverResult.isAllowed,
          warnings: [...quickResult.warnings, ...(serverResult.warnings || [])],
          blockedReason: serverResult.blockedReason,
          suggestedEdit: serverResult.suggestedEdit,
          confidence: serverResult.confidence,
          processingTime: Date.now() - startTime,
        };

        setLastResult(result);
        return result;
      } catch (error) {
        logger.warn('Server content check failed, using client result', {
          component: 'useContentModeration',
        });

        // Fallback to client-only result
        const result: ContentCheckResult = {
          isAllowed: true,
          warnings: quickResult.warnings,
          confidence: 0.6,
          processingTime: Date.now() - startTime,
        };
        setLastResult(result);
        return result;
      } finally {
        setIsChecking(false);
      }
    },
    [context, userTrustScore, isFirstPost, realtimeCheck, lastResult]
  );

  /**
   * Debounced content check for real-time typing
   */
  const checkContentDebounced = useCallback(
    (content: string) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        checkContent(content, false);
      }, debounceMs);
    },
    [checkContent, debounceMs]
  );

  /**
   * Check content before final submission (always includes server check)
   */
  const checkBeforeSubmit = useCallback(
    (content: string) => checkContent(content, true),
    [checkContent]
  );

  /**
   * Clear the last result
   */
  const clearResult = useCallback(() => {
    setLastResult(null);
    lastCheckedContentRef.current = '';
  }, []);

  return {
    checkContent,
    checkContentDebounced,
    checkBeforeSubmit,
    clearResult,
    isChecking,
    lastResult,
    hasWarnings: (lastResult?.warnings.length ?? 0) > 0,
    isBlocked: lastResult?.isAllowed === false,
  };
}

export default useContentModeration;
