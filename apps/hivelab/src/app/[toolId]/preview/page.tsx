'use client';

import { useState, useEffect, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ToolPreviewPage,
  renderElement,
  Skeleton,
  useConnectionCascade,
  type ToolComposition,
  type IDECanvasElement as CanvasElement,
  type IDEConnection as Connection,
} from '@hive/ui';
import { apiClient } from '@/lib/api-client';

/**
 * HiveLab Tool Preview Page
 *
 * Preview and run tools with live/preview mode toggle.
 * Shows tool information, stats, and quick actions.
 */

interface Props {
  params: Promise<{ toolId: string }>;
}

export default function ToolPreviewPageRoute({ params }: Props) {
  const { toolId } = use(params);
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [composition, setComposition] = useState<ToolComposition | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Element states for cascade (keyed by instanceId)
  const [elementStates, setElementStates] = useState<Record<string, Record<string, unknown>>>({});

  // Track which elements were recently updated for visual feedback
  const [recentlyUpdated, setRecentlyUpdated] = useState<Set<string>>(new Set());

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Handler to update element state
  const handleStateUpdate = useCallback((instanceId: string, newState: Record<string, unknown>) => {
    setElementStates((prev) => ({
      ...prev,
      [instanceId]: { ...prev[instanceId], ...newState },
    }));
  }, []);

  // Handler when cascade completes
  const handleCascadeComplete = useCallback((updatedElements: string[]) => {
    // Flash visual feedback on updated elements
    setRecentlyUpdated(new Set(updatedElements));
    setTimeout(() => setRecentlyUpdated(new Set()), 600);
  }, []);

  // Prepare cascade context
  const cascadeElements: CanvasElement[] = composition?.elements?.map((el, idx) => ({
    id: el.instanceId || `element_${idx}`,
    elementId: el.elementId,
    instanceId: el.instanceId || `${el.elementId}_${idx}`,
    position: el.position || { x: 0, y: 0 },
    size: el.size || { width: 240, height: 120 },
    config: el.config || {},
    zIndex: idx + 1,
    locked: false,
    visible: true,
  })) || [];

  const cascadeConnections: Connection[] = (composition?.connections || []).map((conn, idx) => {
    // Normalize connection format
    const from = conn.from as { instanceId: string; port?: string; output?: string };
    const to = conn.to as { instanceId: string; port?: string; input?: string };
    return {
      id: `conn_${idx}`,
      from: { instanceId: from.instanceId, port: from.port || from.output || 'output' },
      to: { instanceId: to.instanceId, port: to.port || to.input || 'input' },
    };
  });

  // Initialize cascade hook
  const { handleElementAction } = useConnectionCascade({
    elements: cascadeElements,
    connections: cascadeConnections,
    elementStates,
    onStateUpdate: handleStateUpdate,
    onCascadeComplete: handleCascadeComplete,
  });

  // Fetch tool data
  useEffect(() => {
    if (!isClient || !toolId) return;

    const fetchTool = async () => {
      try {
        setIsLoading(true);

        // First check localStorage for preview data
        const previewData = localStorage.getItem(`hivelab_preview_${toolId}`);
        if (previewData) {
          setComposition(JSON.parse(previewData));
          setIsLoading(false);
          return;
        }

        // Fetch from API
        const response = await apiClient.get(`/api/tools/${toolId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch tool');
        }

        const data = await response.json();
        const tool = data.tool || data;

        setComposition({
          id: tool.id,
          name: tool.name || 'Untitled Tool',
          description: tool.description || '',
          elements: tool.elements || [],
          connections: tool.connections || [],
          layout: tool.layout || 'flow',
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load tool');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTool();
  }, [isClient, toolId]);

  // Handle back navigation
  const handleBack = () => {
    router.push(`/${toolId}`);
  };

  // Handle edit navigation
  const handleEdit = () => {
    router.push(`/${toolId}`);
  };

  // Handle run tool
  const handleRun = async (_composition: ToolComposition) => {
    // Track tool usage
    try {
      await apiClient.post(`/api/tools/${toolId}/run`);
    } catch {
      // Silently fail analytics
    }
  };

  // Handle open settings
  const handleOpenSettings = () => {
    router.push(`/${toolId}/deploy`);
  };

  // Render tool runtime (elements with interactivity)
  const renderRuntime = (comp: ToolComposition, _mode: 'preview' | 'live') => {
    return (
      <div className="space-y-4">
        {comp.elements.map((element, index) => {
          const instanceId = element.instanceId || `${element.elementId}_${index}`;
          const currentState = elementStates[instanceId] || {};
          const isUpdated = recentlyUpdated.has(instanceId);

          return (
            <div
              key={instanceId}
              className={`transition-all duration-300 ${
                isUpdated ? 'ring-2 ring-[var(--hive-brand-primary)] ring-opacity-50' : ''
              }`}
            >
              {renderElement(element.elementId, {
                id: instanceId,
                config: element.config,
                data: currentState,
                onChange: (data) => {
                  // Update local state
                  handleStateUpdate(instanceId, data);
                },
                onAction: (action, payload) => {
                  // Update state with action result
                  const newState = {
                    ...currentState,
                    ...payload,
                    _lastAction: action,
                    _lastActionAt: new Date().toISOString(),
                  };
                  handleStateUpdate(instanceId, newState);

                  // Trigger cascade to connected elements
                  handleElementAction(instanceId, element.elementId, action, newState);
                },
              })}
            </div>
          );
        })}
      </div>
    );
  };

  if (!isClient || isLoading) {
    return (
      <div className="min-h-[calc(100vh-56px)] p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-8 w-48" />
          </div>
          <div className="grid grid-cols-3 gap-8">
            <div className="col-span-2">
              <Skeleton className="h-[500px] w-full" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !composition) {
    return (
      <div className="min-h-[calc(100vh-56px)] flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-[var(--hive-status-error)]">{error || 'Tool not found'}</p>
          <button
            onClick={() => router.push('/')}
            className="text-[var(--hive-brand-primary)] hover:underline"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <ToolPreviewPage
      composition={composition}
      initialMode="preview"
      onBack={handleBack}
      onEdit={handleEdit}
      onRun={handleRun}
      onOpenSettings={handleOpenSettings}
      renderRuntime={renderRuntime}
    />
  );
}
