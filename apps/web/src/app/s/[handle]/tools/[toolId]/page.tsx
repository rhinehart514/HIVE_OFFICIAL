'use client';

/**
 * Space Tool Page - /s/[handle]/tools/[toolId]
 *
 * Renders a deployed tool within a space context using ToolRuntimeProvider.
 * This provides full context injection (space, member, temporal) so tools
 * can adapt based on who's using them and when.
 *
 * @version 1.0.0 - HiveLab Phase 1 (Jan 2026)
 */

import * as React from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@hive/auth-logic';
import {
  ToolCanvas,
  ToolRuntimeProvider,
  useToolRuntimeContext,
  MOTION,
  Button,
  Skeleton,
} from '@hive/ui';
import type { ToolElement } from '@hive/ui';
import { useToolRuntime } from '@/hooks/use-tool-runtime';
import { ArrowLeft, Settings, Maximize2 } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface ToolDeployment {
  id: string;
  toolId: string;
  spaceId: string;
  surface: 'sidebar' | 'feed' | 'page';
  config: {
    elements: Array<{
      elementId: string;
      instanceId: string;
      config?: Record<string, unknown>;
      position?: { x: number; y: number };
      size?: { width: number; height: number };
      visibilityConditions?: unknown;
    }>;
    connections?: Array<{
      from: { instanceId: string; port: string };
      to: { instanceId: string; port: string };
    }>;
  };
  tool: {
    id: string;
    name: string;
    description?: string;
    creatorId: string;
  };
}

interface SpaceBasicInfo {
  id: string;
  name: string;
  handle: string;
}

// ============================================================================
// Data Fetching
// ============================================================================

async function fetchToolDeployment(
  spaceId: string,
  toolId: string,
  deploymentId?: string
): Promise<ToolDeployment | null> {
  // If we have a deploymentId, use the apps endpoint directly
  if (deploymentId) {
    const response = await fetch(
      `/api/spaces/${spaceId}/apps/${deploymentId}`,
      { credentials: 'include' }
    );

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error('Failed to load tool deployment');
    }

    const data = await response.json();
    if (!data.deployment) return null;

    // Transform apps response to ToolDeployment format
    return {
      id: data.deployment.id,
      toolId: data.deployment.toolId,
      spaceId: spaceId,
      surface: data.deployment.primarySurface || 'sidebar',
      config: {
        elements: data.tool.elements || data.tool.composition?.elements || [],
        connections: data.tool.composition?.connections || [],
      },
      tool: {
        id: data.tool.id,
        name: data.tool.name,
        description: data.tool.description,
        creatorId: '', // Not returned by apps endpoint
      },
    };
  }

  // Otherwise, find deployment by toolId from the tools list
  const response = await fetch(
    `/api/spaces/${spaceId}/tools?placement=all&status=active`,
    { credentials: 'include' }
  );

  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error('Failed to load space tools');
  }

  const data = await response.json();
  const tools = data.tools || [];
  const placement = tools.find((t: Record<string, unknown>) => t.toolId === toolId);

  if (!placement) return null;

  // Fetch full tool data
  const toolResponse = await fetch(`/api/tools/${toolId}`, {
    credentials: 'include',
  });

  if (!toolResponse.ok) return null;
  const toolData = await toolResponse.json();
  const tool = toolData.data || toolData.tool || toolData;

  return {
    id: placement.deploymentId || placement.placementId,
    toolId: toolId,
    spaceId: spaceId,
    surface: placement.placement || 'sidebar',
    config: {
      elements: tool.elements || tool.config?.composition?.elements || [],
      connections: tool.connections || tool.config?.composition?.connections || [],
    },
    tool: {
      id: tool.id,
      name: placement.name || tool.name,
      description: placement.description || tool.description,
      creatorId: tool.creatorId,
    },
  };
}

async function fetchSpaceByHandle(handle: string): Promise<SpaceBasicInfo | null> {
  // Use the resolve-slug endpoint to get spaceId from handle
  const response = await fetch(`/api/spaces/resolve-slug/${handle}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error('Failed to resolve space handle');
  }

  const data = await response.json();
  if (!data.found || !data.spaceId) return null;

  return {
    id: data.spaceId,
    name: '', // Will be enriched from deployment response
    handle: data.slug || handle,
  };
}

// ============================================================================
// Inner Component (has access to runtime context)
// ============================================================================

interface ToolContentProps {
  deployment: ToolDeployment;
  spaceId: string;
  toolId: string;
  onBack: () => void;
  onExpand: () => void;
}

function ToolContent({
  deployment,
  spaceId,
  toolId,
  onBack,
  onExpand,
}: ToolContentProps) {
  const { context, isLoading: contextLoading, error: contextError } = useToolRuntimeContext();
  const { user } = useAuth();

  // Runtime hook for state management
  const runtime = useToolRuntime({
    toolId,
    deploymentId: deployment.id,
    spaceId,
    enabled: true,
    autoSave: true,
    autoSaveDelay: 1500,
    enableRealtime: true,
  });

  // Transform deployment elements to ToolCanvas format
  const elements: ToolElement[] = React.useMemo(() => {
    return deployment.config.elements.map((el) => ({
      elementId: el.elementId,
      instanceId: el.instanceId,
      config: el.config || {},
      position: el.position,
      size: el.size,
    }));
  }, [deployment.config.elements]);

  // Show loading while context is being assembled
  if (contextLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-[var(--life-gold)] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-white/50 text-sm">Loading context...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="min-h-screen bg-[var(--bg-ground)]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: MOTION.duration.base, ease: MOTION.ease.premium }}
    >
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[var(--bg-ground)]/95 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 rounded-lg hover:bg-white/[0.06] transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white/70" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-white">
                {deployment.tool.name}
              </h1>
              {deployment.tool.description && (
                <p className="text-sm text-white/50 line-clamp-1">
                  {deployment.tool.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Status indicator */}
            <div className="flex items-center gap-2 text-xs text-white/40 mr-4">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live</span>
              {runtime.isSaving && <span className="text-[var(--life-gold)]">Saving...</span>}
            </div>

            <button
              onClick={onExpand}
              className="p-2 rounded-lg hover:bg-white/[0.06] transition-colors"
              title="Full screen"
            >
              <Maximize2 className="w-4 h-4 text-white/70" />
            </button>
          </div>
        </div>
      </div>

      {/* Tool Canvas */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {contextError && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
            <p className="text-sm text-red-400">
              Context error: {contextError}. Some features may be limited.
            </p>
          </div>
        )}

        <div className="bg-[var(--bg-surface)] rounded-2xl border border-white/[0.06] p-6">
          {elements.length > 0 ? (
            <ToolCanvas
              elements={elements}
              state={runtime.state}
              sharedState={runtime.sharedState}
              userState={runtime.userState}
              layout="stack"
              onElementChange={(instanceId, data) => {
                runtime.updateState({ [instanceId]: data });
              }}
              onElementAction={(instanceId, action, payload) => {
                runtime.executeAction(
                  instanceId,
                  action,
                  payload as Record<string, unknown>
                );
              }}
              isLoading={runtime.isLoading || runtime.isExecuting}
              error={runtime.error?.message || null}
              context={{
                spaceId,
                deploymentId: deployment.id,
                userId: user?.uid,
                isSpaceLeader: context?.member?.role === 'owner' ||
                              context?.member?.role === 'admin' ||
                              context?.member?.role === 'moderator',
                campusId: user?.campusId || 'ub-buffalo',
                runtimeContext: context || undefined,
              }}
            />
          ) : (
            <div className="text-center py-16">
              <p className="text-white/40">This tool has no elements configured.</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// Main Page Component
// ============================================================================

export default function SpaceToolPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const handle = params.handle as string;
  const toolId = params.toolId as string;
  const deploymentId = searchParams.get('deploymentId') || undefined;

  // First, resolve handle to space ID
  const {
    data: space,
    isLoading: spaceLoading,
    error: spaceError,
  } = useQuery({
    queryKey: ['space-by-handle', handle],
    queryFn: () => fetchSpaceByHandle(handle),
    enabled: !!handle,
    staleTime: 300000, // 5 minutes
  });

  // Then fetch the deployment
  const {
    data: deployment,
    isLoading: deploymentLoading,
    error: deploymentError,
  } = useQuery({
    queryKey: ['tool-deployment', space?.id, toolId, deploymentId],
    queryFn: () => fetchToolDeployment(space!.id, toolId, deploymentId),
    enabled: !!space?.id && !!toolId,
    staleTime: 60000,
  });

  // Navigation handlers
  const handleBack = React.useCallback(() => {
    router.push(`/s/${handle}`);
  }, [router, handle]);

  const handleExpand = React.useCallback(() => {
    // Open in new tab or go full screen
    const url = new URL(window.location.href);
    url.searchParams.set('fullscreen', 'true');
    window.open(url.toString(), '_blank');
  }, []);

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!authLoading && !user) {
      router.push('/enter');
    }
  }, [authLoading, user, router]);

  // Loading state
  if (authLoading || spaceLoading || deploymentLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-ground)] p-6">
        {/* Header skeleton */}
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          {/* Content skeleton */}
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  // Error: Space not found
  if (spaceError || !space) {
    return (
      <div className="min-h-screen bg-[var(--bg-ground)] flex items-center justify-center p-6">
        <motion.div
          className="max-w-md text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: MOTION.duration.base, ease: MOTION.ease.premium }}
        >
          <h2 className="text-xl font-semibold text-white mb-4">Space Not Found</h2>
          <p className="text-white/50 mb-6">
            The space @{handle} could not be found or is no longer available.
          </p>
          <Button variant="default" onClick={() => router.push('/spaces')}>
            Browse Spaces
          </Button>
        </motion.div>
      </div>
    );
  }

  // Error: Deployment not found
  if (deploymentError || !deployment) {
    return (
      <div className="min-h-screen bg-[var(--bg-ground)] flex items-center justify-center p-6">
        <motion.div
          className="max-w-md text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: MOTION.duration.base, ease: MOTION.ease.premium }}
        >
          <h2 className="text-xl font-semibold text-white mb-4">Tool Not Found</h2>
          <p className="text-white/50 mb-6">
            This tool is not deployed to {space.name} or is no longer available.
          </p>
          <Button variant="default" onClick={handleBack}>
            Back to {space.name}
          </Button>
        </motion.div>
      </div>
    );
  }

  // Render with ToolRuntimeProvider
  return (
    <ToolRuntimeProvider
      spaceId={space.id}
      deploymentId={deployment.id}
      userId={user?.uid || ''}
      campusId={user?.campusId || 'ub-buffalo'}
    >
      <ToolContent
        deployment={deployment}
        spaceId={space.id}
        toolId={toolId}
        onBack={handleBack}
        onExpand={handleExpand}
      />
    </ToolRuntimeProvider>
  );
}
