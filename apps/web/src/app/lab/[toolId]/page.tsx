'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '@hive/auth-logic';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  HiveLabIDE,
  HeaderBar,
  Skeleton,
  ToolDeployModal,
  ToolCanvas,
  BuilderOnboarding,
  type HiveLabComposition,
  type IDECanvasElement,
  type IDEConnection,
  type UserContext,
  type ToolDeploymentTarget as DeploymentTarget,
  type ToolDeploymentConfig as DeploymentConfig,
  type PageMode,
} from '@hive/ui';
import { useToolRuntime } from '@/hooks/use-tool-runtime';
import { ToolAnalyticsPanel } from './components/analytics-panel';
import { AutomationAwarenessPanel } from './components/automation-awareness-panel';

// Feature flag: Automations are now enabled
const AUTOMATIONS_ENABLED = true;

/**
 * Tool Studio Page - Full HiveLabIDE Experience
 *
 * Canvas-first IDE with:
 * - Element palette (drag-drop)
 * - Properties panel
 * - Layers panel
 * - AI Command Palette (⌘K)
 * - Smart guides & grid snapping
 * - Undo/redo history
 * - Auto-save
 * - Deploy modal with space selection
 * - Analytics panel
 */

interface ToolApiResponse {
  tool: {
    id: string;
    name: string;
    description: string;
    status: 'draft' | 'published' | 'archived';
    visibility?: 'public' | 'private' | 'space';
    category?: string;
    config?: {
      composition?: {
        elements?: Array<{
          id?: string;
          elementId: string;
          instanceId?: string;
          config?: Record<string, unknown>;
          position?: { x: number; y: number };
          size?: { width: number; height: number };
        }>;
        connections?: Array<{
          from: { instanceId: string; port?: string; output?: string };
          to: { instanceId: string; port?: string; input?: string };
        }>;
      };
    };
    elements?: Array<{
      id?: string;
      elementId: string;
      instanceId?: string;
      config?: Record<string, unknown>;
      position?: { x: number; y: number };
      size?: { width: number; height: number };
    }>;
    connections?: Array<{
      from: { instanceId: string; port?: string; output?: string };
      to: { instanceId: string; port?: string; input?: string };
    }>;
    createdAt: string;
    updatedAt: string;
    remixedFrom?: {
      toolId: string;
      toolName: string;
      creatorId: string;
      creatorName: string;
    } | null;
  };
}

interface Space {
  id: string;
  name: string;
  handle?: string;
  memberCount?: number;
  description?: string;
}

// Fetch tool data
async function fetchTool(toolId: string): Promise<ToolApiResponse['tool']> {
  const response = await fetch(`/api/tools/${toolId}`, {
    credentials: 'include',
  });
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Tool not found');
    }
    throw new Error('Failed to load tool');
  }
  const result = await response.json();
  // API returns { success: true, data: { ...tool } }
  return result.data || result.tool || result;
}

// Fetch user's spaces for deployment
async function fetchUserSpaces(): Promise<Space[]> {
  const response = await fetch('/api/profile/my-spaces?limit=50', {
    credentials: 'include',
  });
  if (!response.ok) {
    return [];
  }
  const data = await response.json();
  return data.spaces || [];
}

// Save tool
async function saveTool(
  toolId: string,
  composition: HiveLabComposition
): Promise<void> {
  const response = await fetch(`/api/tools/${toolId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      name: composition.name,
      description: composition.description,
      elements: composition.elements.map((el) => ({
        elementId: el.elementId,
        instanceId: el.instanceId,
        config: el.config,
        position: el.position,
        size: el.size,
      })),
      connections: composition.connections.map((conn) => ({
        from: conn.from,
        to: conn.to,
      })),
      layout: composition.layout,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to save tool');
  }
}

// Deploy tool to space
async function deployToolToTarget(
  toolId: string,
  config: DeploymentConfig
): Promise<void> {
  const response = await fetch(`/api/tools/${toolId}/deploy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      targetType: config.targetType,
      targetId: config.targetId,
      surface: config.surface,
      permissions: config.permissions,
      settings: config.settings,
      privacy: config.privacy,
    }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const err = new Error(errorData.error || errorData.message || 'Failed to deploy tool');
    if (errorData.validationErrors) {
      (err as any).validationErrors = errorData.validationErrors;
    }
    throw err;
  }
}

// Transform API tool data to IDE canvas elements
function transformToCanvasElements(
  tool: ToolApiResponse['tool']
): { elements: IDECanvasElement[]; connections: IDEConnection[] } {
  // Get elements from either nested composition or flat structure
  const rawElements =
    tool.config?.composition?.elements || tool.elements || [];
  const rawConnections =
    tool.config?.composition?.connections || tool.connections || [];

  const elements: IDECanvasElement[] = rawElements.map((el, index) => ({
    id: el.id || `element_${index}`,
    elementId: el.elementId,
    instanceId: el.instanceId || `${el.elementId}_${index}`,
    position: el.position || { x: 100 + index * 50, y: 100 + index * 50 },
    size: el.size || { width: 240, height: 120 },
    config: el.config || {},
    zIndex: index + 1,
    locked: false,
    visible: true,
  }));

  const connections: IDEConnection[] = rawConnections.map((conn, index) => ({
    id: `conn_${index}`,
    from: {
      instanceId: conn.from.instanceId,
      port: conn.from.port || conn.from.output || 'output',
    },
    to: {
      instanceId: conn.to.instanceId,
      port: conn.to.port || conn.to.input || 'input',
    },
  }));

  return { elements, connections };
}

interface Props {
  params: Promise<{ toolId: string }>;
}

export default function ToolStudioPage({ params }: Props) {
  const { toolId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { user, isLoading: authLoading } = useAuth();

  const isNewTool = searchParams.get('new') === 'true';
  const showDeployOnMount = searchParams.get('deploy') === 'true';
  const showAnalyticsOnMount = searchParams.get('analytics') === 'true';
  const preselectedSpaceId = searchParams.get('spaceId');
  const initialMode = searchParams.get('mode') as PageMode | null;
  const initialPrompt = searchParams.get('prompt');

  // Page mode state - edit (IDE) or use (runtime)
  const [pageMode, setPageMode] = useState<PageMode>(initialMode === 'use' ? 'use' : 'edit');

  // State
  const [composition, setComposition] = useState<{
    id: string;
    name: string;
    description: string;
    elements: IDECanvasElement[];
    connections: IDEConnection[];
  } | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Modal states
  const [deployModalOpen, setDeployModalOpen] = useState(showDeployOnMount);
  const [analyticsOpen, setAnalyticsOpen] = useState(showAnalyticsOnMount);
  const [automationsOpen, setAutomationsOpen] = useState(false);

  // Queries
  const {
    data: tool,
    isLoading: toolLoading,
    error: toolError,
  } = useQuery({
    queryKey: ['tool', toolId],
    queryFn: () => fetchTool(toolId),
    enabled: !!user && !!toolId && !isNewTool,
    staleTime: 60000,
  });

  const { data: userSpaces = [] } = useQuery({
    queryKey: ['user-spaces'],
    queryFn: fetchUserSpaces,
    enabled: !!user,
    staleTime: 300000,
  });

  // Runtime hook for "use" mode - manages tool state and actions
  // Only active when in "use" mode and we have a composition
  const runtime = useToolRuntime({
    toolId,
    enabled: pageMode === 'use' && !isNewTool,
    autoSave: true,
    autoSaveDelay: 1500,
    enableRealtime: false, // Single user preview - no need for real-time
  });

  // Handle mode change - update URL and reset runtime if switching to use
  const handleModeChange = useCallback((newMode: PageMode) => {
    setPageMode(newMode);
    // Update URL without navigation
    const url = new URL(window.location.href);
    if (newMode === 'use') {
      url.searchParams.set('mode', 'use');
    } else {
      url.searchParams.delete('mode');
    }
    window.history.replaceState({}, '', url.toString());
  }, []);

  // Check if user is a space leader (for gated elements)
  const isSpaceLeader = userSpaces.length > 0;
  const leadingSpaceIds = userSpaces.map((s) => s.id);

  // User context for element permissions
  const userContext: UserContext = {
    userId: user?.uid || 'anonymous',
    campusId: 'ub-buffalo',
    isSpaceLeader,
    leadingSpaceIds,
  };

  // Build deployment targets from user's spaces + profile
  const deploymentTargets: DeploymentTarget[] = [
    {
      id: 'profile',
      name: 'My Profile',
      type: 'profile',
      description: 'Add this tool to your personal profile',
    },
    ...userSpaces.map((space) => ({
      id: space.id,
      name: space.name,
      type: 'space' as const,
      description: space.description || `Deploy to ${space.name}`,
    })),
  ];

  // Initialize composition from tool or blank
  useEffect(() => {
    if (isNewTool) {
      // New tool - start with blank canvas
      setComposition({
        id: toolId,
        name: '',
        description: '',
        elements: [],
        connections: [],
      });

      // Show onboarding for new tools (unless dismissed)
      const hasSeenOnboarding = localStorage.getItem(
        'hivelab_onboarding_dismissed'
      );
      if (!hasSeenOnboarding) {
        setShowOnboarding(true);
      }

      // Clean up URL
      window.history.replaceState({}, '', `/lab/${toolId}`);
      return;
    }

    if (tool) {
      const { elements, connections } = transformToCanvasElements(tool);
      setComposition({
        id: tool.id,
        name: tool.name || 'Untitled Tool',
        description: tool.description || '',
        elements,
        connections,
      });
    }
  }, [tool, toolId, isNewTool]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/enter');
    }
  }, [authLoading, user, router]);

  // Handle save
  const handleSave = useCallback(
    async (comp: HiveLabComposition) => {
      setSaving(true);
      try {
        await saveTool(toolId, comp);
        setHasUnsavedChanges(false);
        queryClient.invalidateQueries({ queryKey: ['tool', toolId] });
        // Show "just saved" animation
        setJustSaved(true);
        setTimeout(() => setJustSaved(false), 2000);
        // No toast - the header shows saved state
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'Failed to save tool'
        );
        throw error;
      } finally {
        setSaving(false);
      }
    },
    [toolId, queryClient]
  );

  // Handle preview - now just toggles to Use mode on same page
  const handlePreview = useCallback(
    (_comp: HiveLabComposition) => {
      // Instead of navigating away, toggle to Use mode on this page
      // The composition is already in state, no need for localStorage
      handleModeChange('use');
    },
    [handleModeChange]
  );

  // Handle cancel/back
  const handleCancel = useCallback(() => {
    if (hasUnsavedChanges) {
      const confirmLeave = window.confirm(
        'You have unsaved changes. Are you sure you want to leave?'
      );
      if (!confirmLeave) return;
    }
    router.push('/lab');
  }, [router, hasUnsavedChanges]);

  // Handle deploy via modal
  const handleDeploy = useCallback(
    async (config: DeploymentConfig) => {
      // Save first if there are unsaved changes
      if (hasUnsavedChanges && composition) {
        await saveTool(toolId, {
          id: composition.id,
          name: composition.name,
          description: composition.description,
          elements: composition.elements,
          connections: composition.connections,
          layout: 'flow',
        });
      }

      await deployToolToTarget(toolId, config);
      setHasUnsavedChanges(false);

      // Show success toast with space info
      const targetSpace = userSpaces.find((s) => s.id === config.targetId);
      const targetName = config.targetType === 'profile'
        ? 'your profile'
        : targetSpace?.name || 'the space';
      const toolName = composition?.name || 'Your tool';

      toast.success(`${toolName} is live!`, {
        description: `Deployed to ${targetName}. ${config.targetType === 'space' ? 'Space members can now use it.' : 'Visible on your profile.'}`,
        action: config.targetType === 'space' ? {
          label: 'View',
          onClick: () => {
            const handle = targetSpace?.handle || config.targetId;
            router.push(`/s/${handle}/tools/${toolId}`);
          },
        } : undefined,
      });
    },
    [toolId, hasUnsavedChanges, composition, userSpaces, router]
  );

  // Handle view in space after deployment
  const handleViewInSpace = useCallback(
    (spaceId: string) => {
      const space = userSpaces.find((s) => s.id === spaceId);
      const handle = space?.handle || spaceId;
      router.push(`/s/${handle}/tools/${toolId}`);
    },
    [router, userSpaces, toolId]
  );

  // Loading state
  if (authLoading || (toolLoading && !isNewTool)) {
    return (
      <div className="h-screen bg-[var(--hivelab-bg)] flex flex-col">
        {/* Header skeleton */}
        <div className="h-12 bg-[var(--hivelab-panel)] border-b border-[var(--hivelab-border)] flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-7 w-7 rounded-lg" />
            <Skeleton className="h-5 w-16" />
          </div>
          <Skeleton className="h-5 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-20 rounded-lg" />
            <Skeleton className="h-8 w-16 rounded-lg" />
          </div>
        </div>

        {/* Main content skeleton */}
        <div className="flex-1 flex">
          {/* Left rail */}
          <div className="w-12 bg-[var(--hivelab-panel)] border-r border-[var(--hivelab-border)] p-2 space-y-2">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>

          {/* Canvas */}
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4">
              <Skeleton className="h-16 w-16 mx-auto rounded-2xl" />
              <Skeleton className="h-6 w-32 mx-auto" />
              <Skeleton className="h-4 w-48 mx-auto" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (toolError && !isNewTool) {
    return (
      <div className="h-screen bg-[var(--hivelab-bg)] flex items-center justify-center">
        <div className="bg-[var(--hivelab-panel)] rounded-2xl p-8 shadow-lg max-w-md text-center border border-[var(--hivelab-border)]">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-500/10 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-[var(--hivelab-text-primary)] mb-2">
            Tool not found
          </h2>
          <p className="text-[var(--hivelab-text-secondary)] mb-6">
            This tool may have been deleted or you don't have access to it.
          </p>
          <button
            onClick={() => router.push('/lab')}
            className="px-4 py-2 bg-[var(--life-gold)] text-black rounded-lg font-medium hover:bg-[var(--life-gold)]/90 transition-colors"
          >
            Back to Tools
          </button>
        </div>
      </div>
    );
  }

  // No composition yet
  if (!composition) {
    return (
      <div className="h-screen bg-[var(--hivelab-bg)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[var(--life-gold)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[var(--hivelab-text-secondary)]">Preparing canvas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[var(--hivelab-bg)]">
      {/* Header Bar */}
      <HeaderBar
        toolName={composition.name || 'Untitled Tool'}
        onToolNameChange={(name: string) => {
          setComposition((prev) => (prev ? { ...prev, name } : null));
          setHasUnsavedChanges(true);
        }}
        onPreview={() =>
          handlePreview({
            id: composition.id,
            name: composition.name,
            description: composition.description,
            elements: composition.elements,
            connections: composition.connections,
            layout: 'flow',
          })
        }
        onSave={() =>
          handleSave({
            id: composition.id,
            name: composition.name,
            description: composition.description,
            elements: composition.elements,
            connections: composition.connections,
            layout: 'flow',
          })
        }
        saving={saving}
        justSaved={justSaved}
        onBack={handleCancel}
        hasUnsavedChanges={hasUnsavedChanges}
        onDeploy={() => setDeployModalOpen(true)}
        onAnalytics={() => setAnalyticsOpen(true)}
        onAutomations={AUTOMATIONS_ENABLED ? () => setAutomationsOpen(true) : undefined}
        mode={pageMode}
        onModeChange={handleModeChange}
        canEdit={true}
      />

      {/* Remix attribution banner - persistent, cannot be dismissed */}
      {tool?.remixedFrom && (
        <div className="flex items-center gap-2 px-4 py-2 bg-[var(--hivelab-panel)] border-b border-[var(--hivelab-border)] text-xs text-[var(--hivelab-text-secondary)]">
          <svg className="w-3.5 h-3.5 shrink-0 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="18" r="3" /><circle cx="6" cy="6" r="3" /><circle cx="18" cy="6" r="3" /><path d="M18 9v2c0 .6-.4 1-1 1H7c-.6 0-1-.4-1-1V9" /><path d="M12 12v3" />
          </svg>
          <span>
            Based on{' '}
            <a
              href={`/lab/${tool.remixedFrom.toolId}?mode=use`}
              className="text-[var(--life-gold)] hover:underline"
            >
              {tool.remixedFrom.toolName}
            </a>
            {' '}by {tool.remixedFrom.creatorName}
          </span>
        </div>
      )}

      {/* Main content area - IDE or Runtime based on mode */}
      <div className="flex-1 overflow-hidden">
        {pageMode === 'edit' ? (
          /* Edit Mode: Full HiveLab IDE */
          <HiveLabIDE
            initialComposition={composition}
            showOnboarding={showOnboarding}
            onSave={handleSave}
            onPreview={handlePreview}
            onCancel={handleCancel}
            userId={user?.uid || 'anonymous'}
            userContext={userContext}
            initialPrompt={isNewTool ? initialPrompt : null}
          />
        ) : (
          /* Use Mode: Interactive ToolCanvas */
          <div className="h-full bg-[var(--hivelab-bg)] p-4 md:p-8 overflow-auto">
            <div className="max-w-4xl mx-auto">
              {/* Tool info header */}
              <div className="mb-6">
                <h1 className="text-xl font-semibold text-[var(--hivelab-text-primary)]">
                  {composition.name || 'Untitled Tool'}
                </h1>
                {composition.description && (
                  <p className="text-sm text-[var(--hivelab-text-secondary)] mt-1">
                    {composition.description}
                  </p>
                )}
              </div>

              {/* Runtime status indicator */}
              <div className="mb-4 flex items-center gap-2 text-xs text-[var(--hivelab-text-tertiary)]">
                <div className="w-2 h-2 rounded-full bg-[var(--life-gold)] animate-pulse" />
                <span>Live Preview</span>
                {runtime.isSaving && <span className="text-[var(--life-gold)]">Saving...</span>}
              </div>

              {/* Tool Canvas with runtime */}
              <div className="bg-[var(--hivelab-panel)] rounded-2xl p-6 border border-[var(--hivelab-border)]">
                {composition.elements.length > 0 ? (
                  <ToolCanvas
                    elements={composition.elements.map(el => ({
                      elementId: el.elementId,
                      instanceId: el.instanceId,
                      config: el.config,
                      position: el.position,
                      size: el.size,
                    }))}
                    state={runtime.state}
                    sharedState={runtime.sharedState}
                    userState={runtime.userState}
                    layout="stack"
                    onElementChange={(instanceId, data) => {
                      runtime.updateState({ [instanceId]: data });
                    }}
                    onElementAction={(instanceId, action, payload) => {
                      runtime.executeAction(instanceId, action, payload as Record<string, unknown>);
                    }}
                    isLoading={runtime.isLoading || runtime.isExecuting}
                    error={runtime.error?.message || null}
                    context={{
                      userId: user?.uid,
                      isSpaceLeader,
                    }}
                  />
                ) : (
                  /* Empty state */
                  <div className="text-center py-16">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--life-gold)]/10 flex items-center justify-center">
                      <svg className="w-8 h-8 text-[var(--life-gold)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-[var(--hivelab-text-primary)] mb-2">
                      No elements yet
                    </h3>
                    <p className="text-sm text-[var(--hivelab-text-secondary)] mb-4">
                      Switch to Edit mode to add elements to your tool.
                    </p>
                    <button
                      onClick={() => handleModeChange('edit')}
                      className="px-4 py-2 text-sm font-medium text-black bg-[var(--life-gold)] rounded-lg hover:bg-[var(--life-gold)]/90 transition-colors"
                    >
                      Switch to Edit
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Deploy Modal */}
      <ToolDeployModal
        open={deployModalOpen}
        onOpenChange={setDeployModalOpen}
        toolName={composition.name || 'Untitled Tool'}
        availableTargets={deploymentTargets}
        onDeploy={handleDeploy}
        onViewInSpace={handleViewInSpace}
        initialConfig={
          preselectedSpaceId
            ? { targetType: 'space', targetId: preselectedSpaceId }
            : undefined
        }
      />

      {/* Analytics Panel */}
      {analyticsOpen && (
        <ToolAnalyticsPanel
          toolId={toolId}
          toolName={composition.name || 'Untitled Tool'}
          onClose={() => setAnalyticsOpen(false)}
        />
      )}

      {/* Automation Awareness Panel (hidden until backend ready) */}
      {AUTOMATIONS_ENABLED && automationsOpen && (
        <AutomationAwarenessPanel
          toolId={toolId}
          toolName={composition.name || 'Untitled Tool'}
          elementIds={composition.elements.map((el) => el.instanceId)}
          onClose={() => setAutomationsOpen(false)}
        />
      )}

      {/* Builder Onboarding — 3-step tour for first-time builders */}
      <BuilderOnboarding
        show={showOnboarding}
        onDismiss={() => setShowOnboarding(false)}
      />
    </div>
  );
}
