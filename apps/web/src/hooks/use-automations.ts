/**
 * useAutomations Hook
 *
 * Fetches and manages automations for a space.
 * Part of HiveLab Phase 3 - makes automations visible to leaders.
 */

import { useState, useEffect, useCallback } from 'react';
import { secureApiFetch } from '@/lib/secure-api-fetch';

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
  isLeader: boolean;
}

interface UseAutomationsActions {
  refetch: () => Promise<void>;
  toggle: (automationId: string) => Promise<boolean>;
  remove: (automationId: string) => Promise<boolean>;
}

export function useAutomations(spaceId: string | null): UseAutomationsState & UseAutomationsActions {
  const [state, setState] = useState<UseAutomationsState>({
    automations: [],
    isLoading: false,
    error: null,
    isLeader: false,
  });

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
    if (!spaceId) return false;

    try {
      const response = await secureApiFetch(
        `/api/spaces/${spaceId}/automations/${automationId}/toggle`,
        { method: 'POST' }
      );

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      const newEnabled = data.data?.enabled;

      // Update local state
      setState(prev => ({
        ...prev,
        automations: prev.automations.map(a =>
          a.id === automationId ? { ...a, enabled: newEnabled } : a
        ),
      }));

      return true;
    } catch {
      return false;
    }
  }, [spaceId]);

  const remove = useCallback(async (automationId: string): Promise<boolean> => {
    if (!spaceId) return false;

    try {
      const response = await secureApiFetch(
        `/api/spaces/${spaceId}/automations/${automationId}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        return false;
      }

      // Update local state
      setState(prev => ({
        ...prev,
        automations: prev.automations.filter(a => a.id !== automationId),
      }));

      return true;
    } catch {
      return false;
    }
  }, [spaceId]);

  useEffect(() => {
    fetchAutomations();
  }, [fetchAutomations]);

  return {
    ...state,
    refetch: fetchAutomations,
    toggle,
    remove,
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
