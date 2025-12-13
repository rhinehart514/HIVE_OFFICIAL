'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { ToolPreviewPage, renderElement, Skeleton, type ToolComposition } from '@hive/ui';
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

  useEffect(() => {
    setIsClient(true);
  }, []);

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
        {comp.elements.map((element, index) => (
          <div key={element.instanceId || index}>
            {renderElement(element.elementId, {
              id: element.instanceId,
              config: element.config,
              onChange: (_data) => {
                // Data change handled by runtime - no logging needed in preview
              },
              onAction: (_action, _payload) => {
                // Action handled by runtime - no logging needed in preview
              },
            })}
          </div>
        ))}
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
