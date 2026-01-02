'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import type { GhostModeLevel, GhostModeDurationValue } from '@/lib/ghost-mode-constants';

export interface GhostModeState {
  enabled: boolean;
  level: GhostModeLevel;
  hideFromDirectory: boolean;
  hideActivity: boolean;
  hideSpaceMemberships: boolean;
  hideLastSeen: boolean;
  hideOnlineStatus: boolean;
}

export interface UseGhostModeReturn {
  // State
  state: GhostModeState;
  expiresAt: Date | null;
  isLoading: boolean;
  error: string | null;

  // Computed
  timeRemaining: number | null; // milliseconds, null if indefinite or not enabled
  isExpiringSoon: boolean; // less than 30 min remaining
  isEnabled: boolean;

  // Actions
  enable: (level: GhostModeLevel, durationMinutes: GhostModeDurationValue) => Promise<boolean>;
  disable: () => Promise<boolean>;
  updateLevel: (level: GhostModeLevel) => Promise<boolean>;
  refresh: () => Promise<void>;
}

const DEFAULT_STATE: GhostModeState = {
  enabled: false,
  level: 'normal',
  hideFromDirectory: false,
  hideActivity: false,
  hideSpaceMemberships: false,
  hideLastSeen: false,
  hideOnlineStatus: false,
};

export function useGhostMode(): UseGhostModeReturn {
  const [state, setState] = useState<GhostModeState>(DEFAULT_STATE);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  // Fetch current ghost mode status
  const refresh = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch('/api/privacy/ghost-mode', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch ghost mode status');
      }

      const data = await response.json();
      const ghostMode = data.ghostMode || DEFAULT_STATE;

      setState({
        enabled: ghostMode.enabled ?? false,
        level: ghostMode.level ?? 'normal',
        hideFromDirectory: ghostMode.hideFromDirectory ?? false,
        hideActivity: ghostMode.hideActivity ?? false,
        hideSpaceMemberships: ghostMode.hideSpaceMemberships ?? false,
        hideLastSeen: ghostMode.hideLastSeen ?? false,
        hideOnlineStatus: ghostMode.hideOnlineStatus ?? false,
      });

      // Handle expiry from privacy settings
      if (data.expiresAt) {
        setExpiresAt(new Date(data.expiresAt));
      } else {
        setExpiresAt(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Failed to fetch ghost mode:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Update time remaining every second when ghost mode is active with expiry
  useEffect(() => {
    if (!state.enabled || !expiresAt) {
      setTimeRemaining(null);
      return;
    }

    const updateTimeRemaining = () => {
      const now = new Date();
      const remaining = expiresAt.getTime() - now.getTime();

      if (remaining <= 0) {
        // Expired - auto-disable
        setTimeRemaining(0);
        disable().then((success) => {
          if (success) {
            toast.info('Ghost Mode has expired - you are now visible');
          }
        });
        return;
      }

      setTimeRemaining(remaining);
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [state.enabled, expiresAt]);

  // Check for expired ghost mode on mount
  useEffect(() => {
    if (!isLoading && state.enabled && expiresAt) {
      const now = new Date();
      if (expiresAt.getTime() < now.getTime()) {
        // Was expired while offline
        disable().then((success) => {
          if (success) {
            toast.info('Ghost Mode expired while you were away');
          }
        });
      }
    }
  }, [isLoading, state.enabled, expiresAt]);

  // Enable ghost mode
  const enable = useCallback(async (level: GhostModeLevel, durationMinutes: GhostModeDurationValue): Promise<boolean> => {
    try {
      setError(null);
      const response = await fetch('/api/privacy/ghost-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          enabled: true,
          level,
          duration: durationMinutes === -1 ? undefined : durationMinutes,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to enable ghost mode');
      }

      const data = await response.json();

      setState({
        enabled: true,
        level,
        hideFromDirectory: data.ghostMode?.hideFromDirectory ?? false,
        hideActivity: data.ghostMode?.hideActivity ?? false,
        hideSpaceMemberships: data.ghostMode?.hideSpaceMemberships ?? false,
        hideLastSeen: data.ghostMode?.hideLastSeen ?? false,
        hideOnlineStatus: data.ghostMode?.hideOnlineStatus ?? false,
      });

      if (data.expiresAt) {
        setExpiresAt(new Date(data.expiresAt));
      } else {
        setExpiresAt(null);
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to enable ghost mode');
      console.error('Failed to enable ghost mode:', err);
      return false;
    }
  }, []);

  // Disable ghost mode
  const disable = useCallback(async (): Promise<boolean> => {
    try {
      setError(null);
      const response = await fetch('/api/privacy/ghost-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          enabled: false,
          level: 'normal',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to disable ghost mode');
      }

      setState(DEFAULT_STATE);
      setExpiresAt(null);
      setTimeRemaining(null);

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disable ghost mode');
      console.error('Failed to disable ghost mode:', err);
      return false;
    }
  }, []);

  // Update level without changing enabled state
  const updateLevel = useCallback(async (level: GhostModeLevel): Promise<boolean> => {
    if (!state.enabled) {
      setError('Ghost mode must be enabled to change level');
      return false;
    }

    try {
      setError(null);
      const response = await fetch('/api/privacy/ghost-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          enabled: true,
          level,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update ghost mode level');
      }

      const data = await response.json();

      setState((prev) => ({
        ...prev,
        level,
        hideFromDirectory: data.ghostMode?.hideFromDirectory ?? prev.hideFromDirectory,
        hideActivity: data.ghostMode?.hideActivity ?? prev.hideActivity,
        hideSpaceMemberships: data.ghostMode?.hideSpaceMemberships ?? prev.hideSpaceMemberships,
        hideLastSeen: data.ghostMode?.hideLastSeen ?? prev.hideLastSeen,
        hideOnlineStatus: data.ghostMode?.hideOnlineStatus ?? prev.hideOnlineStatus,
      }));

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update ghost mode level');
      console.error('Failed to update ghost mode level:', err);
      return false;
    }
  }, [state.enabled]);

  // Computed values
  const isExpiringSoon = useMemo(() => {
    if (!timeRemaining) return false;
    return timeRemaining < 30 * 60 * 1000; // Less than 30 minutes
  }, [timeRemaining]);

  const isEnabled = state.enabled;

  return {
    state,
    expiresAt,
    isLoading,
    error,
    timeRemaining,
    isExpiringSoon,
    isEnabled,
    enable,
    disable,
    updateLevel,
    refresh,
  };
}
