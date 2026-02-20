'use client';

import { useState, useCallback, useEffect } from 'react';
import type { AutomationSummary } from '../automations-panel';
import type { AutomationData } from '../automation-builder-modal';
import { toast } from 'sonner';

// Stub type for automation runs
type AutomationRun = Record<string, unknown>;

function getTriggerSummaryText(trigger: {
  type: string;
  cron?: string;
  event?: string;
  path?: string;
  operator?: string;
  value?: number;
}): string {
  switch (trigger?.type) {
    case 'event':
      return `When ${trigger?.event || 'event'} occurs`;
    case 'schedule':
      return `Scheduled: ${trigger?.cron || 'custom'}`;
    case 'threshold':
      return `When ${trigger.path || 'value'} ${trigger.operator || '>'} ${trigger.value || 0}`;
    default:
      return 'Manual trigger';
  }
}

interface UseIDEAutomationsOptions {
  deploymentId?: string;
  /** Only fetch automations when enabled (opt-in) */
  enabled?: boolean;
}

export function useIDEAutomations({
  deploymentId,
  enabled = true,
}: UseIDEAutomationsOptions) {
  const [automations, setAutomations] = useState<AutomationSummary[]>([]);
  const [automationsLoading, setAutomationsLoading] = useState(false);
  const [automationBuilderOpen, setAutomationBuilderOpen] = useState(false);
  const [editingAutomation, setEditingAutomation] = useState<AutomationData | null>(null);
  const [automationLogsOpen, setAutomationLogsOpen] = useState(false);
  const [viewingAutomationId, setViewingAutomationId] = useState<string | null>(null);
  const [automationRuns, setAutomationRuns] = useState<AutomationRun[]>([]);
  const [automationRunsLoading, setAutomationRunsLoading] = useState(false);

  // Fetch automations from API
  const fetchAutomations = useCallback(async () => {
    if (!deploymentId) {
      setAutomations([]);
      return;
    }

    setAutomationsLoading(true);
    try {
      const response = await fetch(`/api/tools/${deploymentId}/automations`);
      if (response.ok) {
        const data = await response.json();
        const summaries: AutomationSummary[] = data.automations.map((auto: {
          id: string;
          name: string;
          enabled: boolean;
          trigger: { type: string; cron?: string; event?: string; path?: string; operator?: string; value?: number };
          runCount: number;
          errorCount: number;
          lastRun?: string;
        }) => ({
          id: auto.id,
          name: auto.name,
          enabled: auto.enabled,
          triggerType: auto.trigger.type as 'event' | 'schedule' | 'threshold',
          triggerSummary: getTriggerSummaryText(auto.trigger),
          runCount: auto.runCount,
          errorCount: auto.errorCount,
          lastRun: auto.lastRun,
        }));
        setAutomations(summaries);
      }
    } catch (error) {
      console.error('Failed to fetch automations:', error);
    } finally {
      setAutomationsLoading(false);
    }
  }, [deploymentId]);

  // Only fetch on mount when enabled
  useEffect(() => {
    if (enabled) {
      fetchAutomations();
    }
  }, [fetchAutomations, enabled]);

  const handleCreateAutomation = useCallback(() => {
    if (!deploymentId) {
      toast.error('Deploy the tool first to add automations');
      return;
    }
    setEditingAutomation(null);
    setAutomationBuilderOpen(true);
  }, [deploymentId]);

  const handleEditAutomation = useCallback(async (id: string) => {
    if (!deploymentId) return;

    try {
      const response = await fetch(`/api/tools/${deploymentId}/automations/${id}`);
      if (response.ok) {
        const data = await response.json();
        const auto = data.automation;
        setEditingAutomation({
          id: auto.id,
          name: auto.name,
          enabled: auto.enabled,
          trigger: auto.trigger,
          conditions: auto.conditions || [],
          actions: auto.actions || [],
          limits: auto.limits || { maxRunsPerDay: 100, cooldownSeconds: 60 },
        });
        setAutomationBuilderOpen(true);
      } else {
        toast.error('Failed to load automation');
      }
    } catch (error) {
      console.error('Failed to fetch automation:', error);
      toast.error('Failed to load automation');
    }
  }, [deploymentId]);

  const handleDeleteAutomation = useCallback(async (id: string) => {
    if (!deploymentId) return;

    try {
      const response = await fetch(`/api/tools/${deploymentId}/automations/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setAutomations(prev => prev.filter(a => a.id !== id));
        toast.success('Automation deleted');
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to delete automation');
      }
    } catch (error) {
      console.error('Failed to delete automation:', error);
      toast.error('Failed to delete automation');
    }
  }, [deploymentId]);

  const handleToggleAutomation = useCallback(async (id: string, enabled: boolean) => {
    if (!deploymentId) return;

    // Optimistic update
    setAutomations(prev =>
      prev.map(a => a.id === id ? { ...a, enabled } : a)
    );

    try {
      const response = await fetch(`/api/tools/${deploymentId}/automations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });

      if (response.ok) {
        toast.success(enabled ? 'Automation enabled' : 'Automation paused');
      } else {
        setAutomations(prev =>
          prev.map(a => a.id === id ? { ...a, enabled: !enabled } : a)
        );
        const data = await response.json();
        toast.error(data.error || 'Failed to update automation');
      }
    } catch (error) {
      setAutomations(prev =>
        prev.map(a => a.id === id ? { ...a, enabled: !enabled } : a)
      );
      console.error('Failed to toggle automation:', error);
      toast.error('Failed to update automation');
    }
  }, [deploymentId]);

  const handleViewAutomationLogs = useCallback(async (id: string) => {
    if (!deploymentId) return;

    setViewingAutomationId(id);
    setAutomationLogsOpen(true);
    setAutomationRunsLoading(true);

    try {
      const response = await fetch(`/api/tools/${deploymentId}/automations/${id}/runs?limit=50`);
      if (response.ok) {
        const data = await response.json();
        setAutomationRuns(data.runs || []);
      } else {
        setAutomationRuns([]);
      }
    } catch (error) {
      console.error('Failed to fetch automation runs:', error);
      setAutomationRuns([]);
    } finally {
      setAutomationRunsLoading(false);
    }
  }, [deploymentId]);

  const handleRunAutomationNow = useCallback(async (id: string) => {
    if (!deploymentId) return;

    try {
      const response = await fetch(`/api/tools/${deploymentId}/automations/${id}/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success('Automation triggered successfully');
        fetchAutomations();
      } else {
        toast.error(result.error || 'Failed to trigger automation');
      }
    } catch {
      toast.error('Failed to trigger automation');
    }
  }, [deploymentId, fetchAutomations]);

  const handleSaveAutomation = useCallback(async (data: AutomationData) => {
    if (!deploymentId) {
      toast.error('Deploy the tool first to add automations');
      return;
    }

    try {
      if (data.id) {
        const response = await fetch(`/api/tools/${deploymentId}/automations/${data.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: data.name,
            enabled: data.enabled,
            trigger: data.trigger,
            conditions: data.conditions,
            actions: data.actions,
            limits: data.limits,
          }),
        });

        if (response.ok) {
          const result = await response.json();
          const auto = result.automation;
          setAutomations(prev =>
            prev.map(a => a.id === data.id ? {
              id: auto.id,
              name: auto.name,
              enabled: auto.enabled,
              triggerType: auto.trigger.type,
              triggerSummary: getTriggerSummaryText(auto.trigger),
              runCount: auto.runCount,
              errorCount: auto.errorCount,
              lastRun: auto.lastRun,
            } : a)
          );
          toast.success('Automation updated');
        } else {
          const result = await response.json();
          toast.error(result.error || 'Failed to update automation');
          return;
        }
      } else {
        const response = await fetch(`/api/tools/${deploymentId}/automations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: data.name,
            trigger: data.trigger,
            conditions: data.conditions,
            actions: data.actions,
            limits: data.limits,
          }),
        });

        if (response.ok) {
          const result = await response.json();
          const auto = result.automation;
          const newAutomation: AutomationSummary = {
            id: auto.id,
            name: auto.name,
            enabled: auto.enabled,
            triggerType: auto.trigger.type,
            triggerSummary: getTriggerSummaryText(auto.trigger),
            runCount: 0,
            errorCount: 0,
          };
          setAutomations(prev => [...prev, newAutomation]);
          toast.success('Automation created');
        } else {
          const result = await response.json();
          toast.error(result.error || 'Failed to create automation');
          return;
        }
      }

      setAutomationBuilderOpen(false);
      setEditingAutomation(null);
    } catch (error) {
      console.error('Failed to save automation:', error);
      toast.error('Failed to save automation');
    }
  }, [deploymentId]);

  const closeAutomationBuilder = useCallback(() => {
    setAutomationBuilderOpen(false);
    setEditingAutomation(null);
  }, []);

  return {
    automations,
    automationsLoading,
    automationBuilderOpen,
    editingAutomation,
    automationLogsOpen,
    viewingAutomationId,
    automationRuns,
    automationRunsLoading,

    handleCreateAutomation,
    handleEditAutomation,
    handleDeleteAutomation,
    handleToggleAutomation,
    handleViewAutomationLogs,
    handleRunAutomationNow,
    handleSaveAutomation,
    closeAutomationBuilder,
  };
}
