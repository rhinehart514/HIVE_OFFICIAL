/**
 * useAutomations Hook
 *
 * Fetches and manages automations for a space.
 * Part of HiveLab Phase 3 - makes automations visible to leaders.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { secureApiFetch } from '@/lib/secure-auth-utils';

export interface AutomationDTO {
  id: string;
  spaceId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  description?: string;
  enabled: boolean;
  trigger: {
    type: 'member_join' | 'event_reminder' | 'schedule' | 'keyword' | 'reaction_threshold';
    config: Record<string, unknown>;
  };
  action: {
    type: 'send_message' | 'create_component' | 'assign_role' | 'notify';
    config: Record<string, unknown>;
  };
  stats: {
    timesTriggered: number;
    lastTriggered?: string;
    successCount: number;
    failureCount: number;
  };
}

interface UseAutomationsState {
  automations: AutomationDTO[];
  isLoading: boolean;
  error: string | null;
  // P2 FIX: Added action-specific error for user feedback
  actionError: string | null;
  isLeader: boolean;
}

interface UseAutomationsActions {
  refetch: () => Promise<void>;
  toggle: (automationId: string) => Promise<boolean>;
  remove: (automationId: string) => Promise<boolean>;
  clearActionError: () => void;
}

export function useAutomations(spaceId: string | null): UseAutomationsState & UseAutomationsActions {
  const [state, setState] = useState<UseAutomationsState>({
    automations: [],
    isLoading: false,
    error: null,
    actionError: null,
    isLeader: false,
  });

  // P2 FIX: Track in-flight operations to prevent double-click race conditions
  const togglingRef = useRef<Set<string>>(new Set());
  const removingRef = useRef<Set<string>>(new Set());

  const fetchAutomations = useCallback(async () => {
    if (!spaceId) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await secureApiFetch(`/api/spaces/${spaceId}/automations`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch automations');
      }

      const data = await response.json();

      setState(prev => ({
        ...prev,
        automations: data.data?.automations || [],
        isLeader: data.data?.isLeader || false,
        isLoading: false,
      }));
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Failed to load automations',
        isLoading: false,
      }));
    }
  }, [spaceId]);

  const toggle = useCallback(async (automationId: string): Promise<boolean> => {
    // P2 FIX: Prevent double-click race condition
    if (!spaceId || togglingRef.current.has(automationId)) return false;

    togglingRef.current.add(automationId);
    setState(prev => ({ ...prev, actionError: null }));

    // P2 FIX: Optimistic update - toggle current state
    setState(prev => ({
      ...prev,
      automations: prev.automations.map(a =>
        a.id === automationId ? { ...a, enabled: !a.enabled } : a
      ),
    }));

    try {
      const response = await secureApiFetch(
        `/api/spaces/${spaceId}/automations/${automationId}/toggle`,
        { method: 'POST' }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to toggle automation');
      }

      const data = await response.json();
      const newEnabled = data.data?.enabled;

      // Confirm with server state
      setState(prev => ({
        ...prev,
        automations: prev.automations.map(a =>
          a.id === automationId ? { ...a, enabled: newEnabled } : a
        ),
      }));

      return true;
    } catch (err) {
      // P2 FIX: Rollback optimistic update on error
      setState(prev => ({
        ...prev,
        automations: prev.automations.map(a =>
          a.id === automationId ? { ...a, enabled: !a.enabled } : a
        ),
        actionError: err instanceof Error ? err.message : 'Failed to toggle automation',
      }));
      return false;
    } finally {
      togglingRef.current.delete(automationId);
    }
  }, [spaceId]);

  const remove = useCallback(async (automationId: string): Promise<boolean> => {
    // P2 FIX: Prevent double-click race condition
    if (!spaceId || removingRef.current.has(automationId)) return false;

    removingRef.current.add(automationId);
    setState(prev => ({ ...prev, actionError: null }));

    // Store for potential rollback
    const removedAutomation = state.automations.find(a => a.id === automationId);

    // P2 FIX: Optimistic update
    setState(prev => ({
      ...prev,
      automations: prev.automations.filter(a => a.id !== automationId),
    }));

    try {
      const response = await secureApiFetch(
        `/api/spaces/${spaceId}/automations/${automationId}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to remove automation');
      }

      return true;
    } catch (err) {
      // P2 FIX: Rollback optimistic update on error
      if (removedAutomation) {
        setState(prev => ({
          ...prev,
          automations: [...prev.automations, removedAutomation],
          actionError: err instanceof Error ? err.message : 'Failed to remove automation',
        }));
      }
      return false;
    } finally {
      removingRef.current.delete(automationId);
    }
  }, [spaceId, state.automations]);

  // P2 FIX: Clear action error
  const clearActionError = useCallback(() => {
    setState(prev => ({ ...prev, actionError: null }));
  }, []);

  useEffect(() => {
    fetchAutomations();
  }, [fetchAutomations]);

  return {
    ...state,
    refetch: fetchAutomations,
    toggle,
    remove,
    clearActionError,
  };
}

// Helper to get trigger description
export function getTriggerDescription(trigger: AutomationDTO['trigger']): string {
  switch (trigger.type) {
    case 'member_join':
      return 'When a new member joins';
    case 'event_reminder': {
      const minutes = (trigger.config as { beforeMinutes?: number }).beforeMinutes || 30;
      return `${minutes} minutes before events`;
    }
    case 'schedule':
      return 'On schedule';
    case 'keyword':
      return 'When keywords detected';
    case 'reaction_threshold':
      return 'When reactions threshold reached';
    default:
      return 'Custom trigger';
  }
}

// Helper to get action description
export function getActionDescription(action: AutomationDTO['action']): string {
  switch (action.type) {
    case 'send_message':
      return 'Send a message';
    case 'create_component':
      return `Create ${(action.config as { componentType?: string }).componentType || 'component'}`;
    case 'assign_role':
      return 'Assign role';
    case 'notify':
      return 'Send notification';
    default:
      return 'Custom action';
  }
}

// Helper to get trigger icon
export function getTriggerIcon(triggerType: AutomationDTO['trigger']['type']): string {
  switch (triggerType) {
    case 'member_join':
      return '👋';
    case 'event_reminder':
      return '⏰';
    case 'schedule':
      return '📅';
    case 'keyword':
      return '🔍';
    case 'reaction_threshold':
      return '⭐';
    default:
      return '⚡';
  }
}
