'use client';

/**
 * useDramaticHandleCheck — Hook for dramatic handle availability
 *
 * DRAMA.md: "400ms artificial delay on check, 'It's yours.' gold reveal"
 *
 * Wraps the existing HandleInput with dramatic timing:
 * 1. User stops typing → 300ms debounce
 * 2. "Checking..." state appears
 * 3. API call happens
 * 4. 400ms ARTIFICIAL PAUSE (builds anticipation)
 * 5. Result revealed with weight
 */

import * as React from 'react';
import type { HandleStatus } from '../HandleInput';

export interface UseDramaticHandleCheckOptions {
  /** Debounce delay in ms before checking (default: 300) */
  debounceMs?: number;
  /** Artificial pause after API response (default: 400) */
  anticipationMs?: number;
  /** Minimum handle length to check (default: 3) */
  minLength?: number;
  /** Maximum handle length (default: 20) */
  maxLength?: number;
  /** API endpoint for checking (default: /api/spaces/check-handle) */
  endpoint?: string;
  /** Called when status changes */
  onStatusChange?: (status: HandleStatus, available?: boolean) => void;
}

export interface DramaticHandleCheckResult {
  /** Current handle value */
  handle: string;
  /** Set handle value */
  setHandle: (value: string) => void;
  /** Current status for HandleInput */
  status: HandleStatus;
  /** Whether handle is available (only valid when status === 'available') */
  isAvailable: boolean;
  /** Status message override */
  statusMessage: string | undefined;
  /** Reset to idle state */
  reset: () => void;
}

const HANDLE_REGEX = /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/;

export function useDramaticHandleCheck(
  options: UseDramaticHandleCheckOptions = {}
): DramaticHandleCheckResult {
  const {
    debounceMs = 300,
    anticipationMs = 400,
    minLength = 3,
    maxLength = 20,
    endpoint = '/api/spaces/check-handle',
    onStatusChange,
  } = options;

  const [handle, setHandleInternal] = React.useState('');
  const [status, setStatus] = React.useState<HandleStatus>('idle');
  const [isAvailable, setIsAvailable] = React.useState(false);
  const [statusMessage, setStatusMessage] = React.useState<string | undefined>();

  const debounceRef = React.useRef<NodeJS.Timeout | undefined>(undefined);
  const abortRef = React.useRef<AbortController | undefined>(undefined);

  const updateStatus = React.useCallback(
    (newStatus: HandleStatus, available?: boolean) => {
      setStatus(newStatus);
      if (available !== undefined) {
        setIsAvailable(available);
      }
      onStatusChange?.(newStatus, available);
    },
    [onStatusChange]
  );

  const checkHandle = React.useCallback(
    async (value: string) => {
      // Cancel any pending request
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      // Validation
      if (value.length < minLength) {
        updateStatus('invalid');
        setStatusMessage(`At least ${minLength} characters`);
        return;
      }

      if (value.length > maxLength) {
        updateStatus('invalid');
        setStatusMessage(`Maximum ${maxLength} characters`);
        return;
      }

      if (!HANDLE_REGEX.test(value)) {
        updateStatus('invalid');
        setStatusMessage('Letters, numbers, and hyphens only');
        return;
      }

      // Show checking state
      updateStatus('checking');
      setStatusMessage(undefined);

      try {
        const response = await fetch(`${endpoint}?handle=${encodeURIComponent(value)}`, {
          signal: abortRef.current.signal,
        });

        const data = await response.json();

        // DRAMATIC PAUSE — 400ms artificial delay
        await new Promise((resolve) => setTimeout(resolve, anticipationMs));

        if (data.available) {
          updateStatus('available', true);
          setStatusMessage("It's yours.");
        } else {
          updateStatus('taken', false);
          setStatusMessage(data.suggestion ? `Try @${data.suggestion}` : 'Already taken');
        }
      } catch (error) {
        if ((error as Error).name === 'AbortError') return;
        updateStatus('invalid');
        setStatusMessage('Unable to check');
      }
    },
    [endpoint, minLength, maxLength, anticipationMs, updateStatus]
  );

  const setHandle = React.useCallback(
    (value: string) => {
      // Clean value
      const cleaned = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
      setHandleInternal(cleaned);

      // Reset if empty
      if (!cleaned) {
        updateStatus('idle');
        setStatusMessage(undefined);
        setIsAvailable(false);
        return;
      }

      // Debounce the check
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        checkHandle(cleaned);
      }, debounceMs);
    },
    [checkHandle, debounceMs, updateStatus]
  );

  const reset = React.useCallback(() => {
    setHandleInternal('');
    updateStatus('idle');
    setStatusMessage(undefined);
    setIsAvailable(false);
    clearTimeout(debounceRef.current);
    abortRef.current?.abort();
  }, [updateStatus]);

  // Cleanup
  React.useEffect(() => {
    return () => {
      clearTimeout(debounceRef.current);
      abortRef.current?.abort();
    };
  }, []);

  return {
    handle,
    setHandle,
    status,
    isAvailable,
    statusMessage,
    reset,
  };
}
