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
  ToolErrorBoundary,
  ToolRuntimeProvider,
  useToolRuntimeContext,
  MOTION,
  Button,
  Skeleton,
} from '@hive/ui';
import type { ToolElement } from '@hive/ui';
import { useToolRuntime } from '@/hooks/use-tool-runtime';
import { ArrowLeft, Share2, Check, Users, GitFork, Loader2, MessageSquare, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { FeedbackModal } from '@/components/hivelab/FeedbackModal';

// ============================================================================
// Types
// ============================================================================

interface RemixedFrom {
  toolId: string;
  toolName: string;
  creatorId: string;
  creatorName: string;
}

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
    creatorName?: string;
    creatorPhotoURL?: string;
    useCount?: number;
    remixedFrom?: RemixedFrom | null;
    remixCount?: number;
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
        creatorId: data.tool.creatorId || '',
        creatorName: data.tool.creatorName || data.tool.metadata?.creatorName,
        creatorPhotoURL: data.tool.creatorPhotoURL || data.tool.metadata?.creatorPhotoURL,
        useCount: data.tool.useCount ?? data.tool.metadata?.useCount,
        remixedFrom: data.tool.remixedFrom || null,
        remixCount: data.tool.remixCount ?? 0,
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
      creatorName: tool.creatorName || tool.metadata?.creatorName,
      creatorPhotoURL: tool.creatorPhotoURL || tool.metadata?.creatorPhotoURL,
      useCount: tool.useCount ?? tool.metadata?.useCount,
      remixedFrom: tool.remixedFrom || null,
      remixCount: tool.remixCount ?? 0,
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
}

function ToolContent({
  deployment,
  spaceId,
  toolId,
  onBack,
}: ToolContentProps) {
  const { context, isLoading: contextLoading, error: contextError } = useToolRuntimeContext();
  const { user } = useAuth();
  const router = useRouter();
  const [linkCopied, setLinkCopied] = React.useState(false);
  const [remixing, setRemixing] = React.useState(false);

  const isOwner = user?.uid === deployment.tool.creatorId;
  const canRemix = !isOwner;
  const [feedbackOpen, setFeedbackOpen] = React.useState(false);
  const [feedbackVariant, setFeedbackVariant] = React.useState<'review' | 'report'>('review');

  const handleRemix = React.useCallback(async () => {
    if (remixing) return;
    setRemixing(true);
    try {
      const response = await fetch('/api/tools/remix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ sourceToolId: toolId }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to remix tool');
      }

      const result = await response.json();
      const newToolId = result.data?.toolId;
      if (newToolId) {
        router.push(`/lab/${newToolId}`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remix tool');
      setRemixing(false);
    }
  }, [toolId, remixing, router]);

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

  const handleShare = React.useCallback(async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Fallback for browsers that don't support clipboard API
      const input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
    }
    setLinkCopied(true);
    toast.success('Link copied!');
    setTimeout(() => setLinkCopied(false), 2000);
  }, []);

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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          {/* Top row: back + title + actions */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={onBack}
                className="shrink-0 p-2 -ml-2 rounded-lg hover:bg-white/[0.06] transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <ArrowLeft className="w-5 h-5 text-white/70" />
              </button>
              <div className="min-w-0">
                <h1 className="text-lg font-semibold text-white truncate">
                  {deployment.tool.name}
                </h1>
                {deployment.tool.description && (
                  <p className="text-sm text-white/50 line-clamp-1 hidden sm:block">
                    {deployment.tool.description}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              {/* Remix count badge */}
              {deployment.tool.remixCount != null && deployment.tool.remixCount > 0 && (
                <div className="hidden sm:flex items-center gap-1.5 text-xs text-white/40 px-2 py-1 rounded-md bg-white/[0.04]">
                  <GitFork className="w-3.5 h-3.5" />
                  <span>{deployment.tool.remixCount} remix{deployment.tool.remixCount !== 1 ? 'es' : ''}</span>
                </div>
              )}

              {/* Usage count */}
              {deployment.tool.useCount != null && deployment.tool.useCount > 0 && (
                <div className="hidden sm:flex items-center gap-1.5 text-xs text-white/40 px-2 py-1 rounded-md bg-white/[0.04]">
                  <Users className="w-3.5 h-3.5" />
                  <span>{deployment.tool.useCount}</span>
                </div>
              )}

              {/* Remix button - visible on published tools the user doesn't own */}
              {canRemix && (
                <button
                  onClick={handleRemix}
                  disabled={remixing}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/[0.08] hover:bg-white/[0.12] text-white/80 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[36px]"
                >
                  {remixing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <GitFork className="w-3.5 h-3.5" />
                  )}
                  <span className="hidden sm:inline">{remixing ? 'Remixing...' : 'Remix'}</span>
                </button>
              )}

              {/* Feedback button */}
              {!isOwner && (
                <button
                  onClick={() => {
                    setFeedbackVariant('review');
                    setFeedbackOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/[0.08] hover:bg-white/[0.12] text-white/80 hover:text-white transition-colors min-h-[36px]"
                  title="Leave feedback"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Feedback</span>
                </button>
              )}

              {/* Report issue button */}
              {!isOwner && (
                <button
                  onClick={() => {
                    setFeedbackVariant('report');
                    setFeedbackOpen(true);
                  }}
                  className="p-2 rounded-lg hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
                  title="Report an issue"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Share button */}
              <button
                onClick={handleShare}
                className="p-2 rounded-lg hover:bg-white/[0.06] transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                title="Copy link"
              >
                <AnimatePresence mode="wait">
                  {linkCopied ? (
                    <motion.div
                      key="check"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    >
                      <Check className="w-4 h-4 text-emerald-400" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="share"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                    >
                      <Share2 className="w-4 h-4 text-white/70" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>

              {/* Spacer for alignment */}
            </div>
          </div>

          {/* Bottom row: creator attribution + remix attribution + status */}
          <div className="flex items-center justify-between mt-2 pl-12">
            <div className="flex items-center gap-3">
              {/* Creator attribution */}
              {deployment.tool.creatorName && (
                <button
                  onClick={() => router.push(`/profile/${deployment.tool.creatorId}`)}
                  className="flex items-center gap-2 text-xs text-white/40 hover:text-white/60 transition-colors"
                >
                  {deployment.tool.creatorPhotoURL ? (
                    <img
                      src={deployment.tool.creatorPhotoURL}
                      alt=""
                      className="w-4 h-4 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-4 h-4 rounded-full bg-white/[0.08] flex items-center justify-center text-[10px] text-white/50">
                      {deployment.tool.creatorName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span>Built by {deployment.tool.creatorName}</span>
                </button>
              )}

              {/* Remix attribution */}
              {deployment.tool.remixedFrom && (
                <div className="flex items-center gap-1.5 text-xs text-white/30">
                  <GitFork className="w-3 h-3" />
                  <span>
                    Based on{' '}
                    <button
                      onClick={() => router.push(`/lab/${deployment.tool.remixedFrom!.toolId}`)}
                      className="text-white/50 hover:text-white/70 underline-offset-2 hover:underline transition-colors"
                    >
                      {deployment.tool.remixedFrom.toolName}
                    </button>
                    {' '}by {deployment.tool.remixedFrom.creatorName}
                  </span>
                </div>
              )}
            </div>

            {/* Status indicator */}
            <div className="flex items-center gap-2 text-xs text-white/40">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live</span>
              {runtime.isSaving && <span className="text-[var(--life-gold)]">Saving...</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Modal */}
      <FeedbackModal
        toolId={toolId}
        toolName={deployment.tool.name}
        open={feedbackOpen}
        onOpenChange={setFeedbackOpen}
        variant={feedbackVariant}
      />

      {/* Tool Canvas */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {contextError && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
            <p className="text-sm text-red-400">
              Context error: {contextError}. Some features may be limited.
            </p>
          </div>
        )}

        <div className="bg-[var(--bg-surface)] rounded-2xl border border-white/[0.06] p-4 sm:p-6 overflow-x-hidden">
          <ToolErrorBoundary onRetry={() => runtime.reload()}>
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
                isLoading={runtime.isLoading}
                error={runtime.error?.message || null}
                onRetry={() => runtime.reload()}
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onBack}
                  className="mt-4"
                >
                  Back to space
                </Button>
              </div>
            )}
          </ToolErrorBoundary>
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
      />
    </ToolRuntimeProvider>
  );
}
