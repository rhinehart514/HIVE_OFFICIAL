'use client';

import { useState, useCallback, useEffect } from 'react';
import type { OtherToolData } from '../other-tools-panel';
import { toast } from 'sonner';

// Stub type for connection create data
type ConnectionCreateData = { source: unknown; target: unknown; transform?: unknown; label?: string };

interface UseIDESpaceToolsOptions {
  deploymentId?: string;
  originSpaceId?: string;
}

export function useIDESpaceTools({
  deploymentId,
  originSpaceId,
}: UseIDESpaceToolsOptions) {
  const [otherTools, setOtherTools] = useState<OtherToolData[]>([]);
  const [otherToolsLoading, setOtherToolsLoading] = useState(false);
  const [connectionBuilderOpen, setConnectionBuilderOpen] = useState(false);
  const [connectionCreating, setConnectionCreating] = useState(false);
  const [connectionError, setConnectionError] = useState<string | undefined>();
  const [preSelectedConnectionSource, setPreSelectedConnectionSource] = useState<{
    deploymentId: string;
    path: string;
    type: string;
  } | undefined>();

  // Fetch other tools in the same space
  useEffect(() => {
    if (!deploymentId || !originSpaceId) {
      setOtherTools([]);
      return;
    }

    const fetchOtherTools = async () => {
      setOtherToolsLoading(true);
      try {
        const response = await fetch(`/api/spaces/${originSpaceId}/tools`);
        if (response.ok) {
          const data = await response.json();
          const tools: OtherToolData[] = (data.tools || [])
            .filter((tool: { deploymentId: string }) => tool.deploymentId !== deploymentId)
            .map((tool: {
              deploymentId: string;
              name: string;
              toolId: string;
              outputs?: Array<{ path: string; type: string; label?: string }>;
            }) => ({
              deploymentId: tool.deploymentId,
              name: tool.name,
              toolId: tool.toolId,
              outputs: tool.outputs || [],
            }));
          setOtherTools(tools);
        }
      } catch (error) {
        console.error('Failed to fetch other tools:', error);
      } finally {
        setOtherToolsLoading(false);
      }
    };

    fetchOtherTools();
  }, [deploymentId, originSpaceId]);

  const handleOpenConnectionBuilder = useCallback((preSelected?: {
    deploymentId: string;
    path: string;
    type: string;
  }) => {
    if (!deploymentId) {
      toast.error('Deploy the tool first to add connections');
      return;
    }
    setPreSelectedConnectionSource(preSelected);
    setConnectionError(undefined);
    setConnectionBuilderOpen(true);
  }, [deploymentId]);

  const handleCreateConnection = useCallback(async (data: ConnectionCreateData) => {
    if (!deploymentId) {
      toast.error('Deploy the tool first to add connections');
      return;
    }

    setConnectionCreating(true);
    setConnectionError(undefined);

    try {
      const response = await fetch(`/api/tools/${deploymentId}/connections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: data.source,
          target: data.target,
          transform: data.transform,
          label: data.label,
        }),
      });

      if (response.ok) {
        toast.success('Connection created');
        setConnectionBuilderOpen(false);
        setPreSelectedConnectionSource(undefined);
      } else {
        const result = await response.json();
        setConnectionError(result.error || 'Failed to create connection');
        toast.error(result.error || 'Failed to create connection');
      }
    } catch (error) {
      console.error('Failed to create connection:', error);
      setConnectionError('Failed to create connection');
      toast.error('Failed to create connection');
    } finally {
      setConnectionCreating(false);
    }
  }, [deploymentId]);

  return {
    otherTools,
    otherToolsLoading,
    connectionBuilderOpen,
    connectionCreating,
    connectionError,
    preSelectedConnectionSource,
    handleOpenConnectionBuilder,
    handleCreateConnection,
  };
}
