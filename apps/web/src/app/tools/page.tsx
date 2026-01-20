'use client';

export const dynamic = 'force-dynamic';

/**
 * HiveLab Tools Page - IDE-First Experience
 *
 * Users land directly in the full IDE with StartZone for empty state.
 * URL params: ?id=, ?template=, ?prompt=
 */

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useAuth } from '@hive/auth-logic';
import { apiClient } from '@/lib/api-client';
import {
  HiveLabIDE,
  HeaderBar,
  Skeleton,
  ToolDeployModal,
  getQuickTemplate,
  createToolFromTemplate,
  type HiveLabComposition,
  type IDECanvasElement,
  type IDEConnection,
  type UserContext,
  type ToolDeploymentTarget as DeploymentTarget,
  type ToolDeploymentConfig as DeploymentConfig,
} from '@hive/ui';

// Premium easing
const EASE = [0.22, 1, 0.36, 1] as const;

// Tool type for user's tools list
interface UserTool {
  id: string;
  name: string;
  description?: string;
  status: 'draft' | 'published' | 'deployed';
  updatedAt: Date | string;
  usageCount?: number;
}

interface Space {
  id: string;
  name: string;
  memberCount?: number;
  description?: string;
}

// Fetch user's tools
async function fetchUserTools(): Promise<UserTool[]> {
  const response = await apiClient.get('/api/tools');
  if (!response.ok) throw new Error('Failed to fetch tools');
  const data = await response.json();
  return (data.tools || []) as UserTool[];
}

// Fetch user's spaces for deployment
async function fetchUserSpaces(): Promise<Space[]> {
  const response = await fetch('/api/profile/my-spaces?limit=50', {
    credentials: 'include',
  });
  if (!response.ok) return [];
  const data = await response.json();
  return data.spaces || [];
}

// Create a new tool
async function createTool(
  composition: HiveLabComposition
): Promise<{ id: string }> {
  const response = await apiClient.post('/api/tools', {
    name: composition.name || 'Untitled Tool',
    description: composition.description,
    type: 'ai-generated',
    status: 'draft',
    config: { composition },
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
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to create tool');
  }

  const data = await response.json();
  return { id: data.tool?.id || data.toolId };
}

// Save existing tool
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

// Fetch a specific tool
async function fetchTool(toolId: string): Promise<{
  id: string;
  name: string;
  description: string;
  status: string;
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
}> {
  const response = await fetch(`/api/tools/${toolId}`, {
    credentials: 'include',
  });
  if (!response.ok) {
    if (response.status === 404) throw new Error('Tool not found');
    throw new Error('Failed to load tool');
  }
  const data = await response.json();
  return data.tool || data;
}

// Deploy tool
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
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to deploy tool');
  }
}

// Transform API tool data to IDE canvas elements
function transformToCanvasElements(tool: {
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
}): { elements: IDECanvasElement[]; connections: IDEConnection[] } {
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

// Guest preview - redirect to signup
function GuestPreview({ onSignUp }: { onSignUp: () => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ backgroundColor: 'var(--bg-void, #050504)' }}>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 50% 40%, rgba(255,255,255,0.02) 0%, transparent 50%),
            radial-gradient(ellipse 60% 40% at 50% 60%, rgba(255,215,0,0.015) 0%, transparent 50%)
          `,
        }}
      />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: EASE }}
        className="relative z-10 w-full max-w-4xl text-center"
      >
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: EASE }}
          className="text-[clamp(2.5rem,6vw,4.5rem)] font-semibold text-white tracking-[-0.03em] mb-8"
        >
          What will you build?
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-lg text-white/40 mb-12"
        >
          Sign up to start building tools for your campus
        </motion.p>
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5, ease: EASE }}
          onClick={onSignUp}
          className="inline-flex items-center gap-2.5 px-6 py-3
            text-black text-sm font-medium rounded-full
            bg-white transition-all duration-200
            hover:shadow-[0_0_30px_rgba(255,255,255,0.12)]
            active:scale-[0.98]"
        >
          Sign up to start building
        </motion.button>
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.9 }}
        className="absolute bottom-8 text-xs text-white/10 tracking-widest uppercase"
      >
        HiveLab
      </motion.div>
    </div>
  );
}

// Loading spinner
function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-void, #050504)' }}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-5 h-5 border-2 border-white/10 border-t-white/50 rounded-full animate-spin"
      />
    </div>
  );
}

// Main content component (uses searchParams)
function ToolsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { user, isLoading: authLoading } = useAuth();

  // URL params
  const toolIdParam = searchParams.get('id');
  const templateParam = searchParams.get('template');
  const promptParam = searchParams.get('prompt');

  // State
  const [currentToolId, setCurrentToolId] = useState<string | null>(toolIdParam);
  const [composition, setComposition] = useState<{
    id: string;
    name: string;
    description: string;
    elements: IDECanvasElement[];
    connections: IDEConnection[];
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [deployModalOpen, setDeployModalOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Queries
  const { data: userTools = [], isLoading: toolsLoading } = useQuery({
    queryKey: ['personal-tools', user?.uid],
    queryFn: fetchUserTools,
    enabled: !!user,
    staleTime: 60000,
  });

  const { data: userSpaces = [] } = useQuery({
    queryKey: ['user-spaces'],
    queryFn: fetchUserSpaces,
    enabled: !!user,
    staleTime: 300000,
  });

  const { data: existingTool, isLoading: toolLoading } = useQuery({
    queryKey: ['tool', toolIdParam],
    queryFn: () => fetchTool(toolIdParam!),
    enabled: !!user && !!toolIdParam,
    staleTime: 60000,
  });

  // User context
  const isSpaceLeader = userSpaces.length > 0;
  const leadingSpaceIds = userSpaces.map((s) => s.id);
  const userContext: UserContext = {
    userId: user?.uid || 'anonymous',
    campusId: 'ub-buffalo',
    isSpaceLeader,
    leadingSpaceIds,
  };

  // Deployment targets
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

  // Initialize composition based on URL params
  useEffect(() => {
    if (!user || isInitialized) return;

    // Load existing tool
    if (toolIdParam && existingTool) {
      const { elements, connections } = transformToCanvasElements(existingTool);
      setComposition({
        id: existingTool.id,
        name: existingTool.name || 'Untitled Tool',
        description: existingTool.description || '',
        elements,
        connections,
      });
      setCurrentToolId(existingTool.id);
      setIsInitialized(true);
      return;
    }

    // Load template
    if (templateParam) {
      const template = getQuickTemplate(templateParam);
      if (template) {
        const toolComposition = createToolFromTemplate(template);
        const elements: IDECanvasElement[] = toolComposition.elements.map((el, idx) => ({
          id: `element_${Date.now()}_${idx}`,
          elementId: el.elementId,
          instanceId: el.instanceId,
          position: el.position || { x: 100 + idx * 50, y: 100 + idx * 50 },
          size: el.size || { width: 240, height: 120 },
          config: el.config || {},
          zIndex: idx + 1,
          locked: false,
          visible: true,
        }));
        const connections: IDEConnection[] = (toolComposition.connections || []).map((conn, idx) => ({
          id: `conn_${Date.now()}_${idx}`,
          from: {
            instanceId: conn.from.instanceId,
            port: conn.from.output || 'output',
          },
          to: {
            instanceId: conn.to.instanceId,
            port: conn.to.input || 'input',
          },
        }));
        setComposition({
          id: `tool_${Date.now()}`,
          name: toolComposition.name || 'Untitled Tool',
          description: toolComposition.description || '',
          elements,
          connections,
        });
        setHasUnsavedChanges(true);
        setIsInitialized(true);
        return;
      }
    }

    // Fresh start with empty canvas
    if (!toolIdParam) {
      setComposition({
        id: `tool_${Date.now()}`,
        name: '',
        description: '',
        elements: [],
        connections: [],
      });
      setIsInitialized(true);
    }
  }, [user, toolIdParam, templateParam, existingTool, isInitialized]);

  // Handle save - creates new tool on first save, updates on subsequent saves
  const handleSave = useCallback(
    async (comp: HiveLabComposition) => {
      setSaving(true);
      try {
        if (!currentToolId) {
          // First save - create new tool
          const { id: newId } = await createTool(comp);
          setCurrentToolId(newId);

          // Update URL without page reload
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.delete('template');
          newUrl.searchParams.delete('prompt');
          newUrl.searchParams.set('id', newId);
          window.history.replaceState({}, '', newUrl.toString());

          queryClient.invalidateQueries({ queryKey: ['personal-tools'] });
          toast.success('Tool created', { description: 'Your tool has been saved.' });
        } else {
          // Update existing tool
          await saveTool(currentToolId, comp);
          queryClient.invalidateQueries({ queryKey: ['tool', currentToolId] });
          queryClient.invalidateQueries({ queryKey: ['personal-tools'] });
          toast.success('Tool saved');
        }
        setHasUnsavedChanges(false);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to save tool');
        throw error;
      } finally {
        setSaving(false);
      }
    },
    [currentToolId, queryClient]
  );

  // Handle preview
  const handlePreview = useCallback(
    (comp: HiveLabComposition) => {
      if (currentToolId) {
        localStorage.setItem(`hivelab_preview_${currentToolId}`, JSON.stringify(comp));
        // Add preview=true param so runtime knows to use localStorage
        router.push(`/tools/${currentToolId}/run?preview=true`);
      } else {
        toast.error('Save your tool first to preview it');
      }
    },
    [currentToolId, router]
  );

  // Handle cancel/back
  const handleCancel = useCallback(() => {
    if (hasUnsavedChanges) {
      const confirmLeave = window.confirm(
        'You have unsaved changes. Are you sure you want to leave?'
      );
      if (!confirmLeave) return;
    }
    router.push('/');
  }, [router, hasUnsavedChanges]);

  // Handle deploy
  const handleDeploy = useCallback(
    async (config: DeploymentConfig) => {
      if (!currentToolId) {
        toast.error('Save your tool first to deploy it');
        return;
      }

      // Save first if there are unsaved changes
      if (hasUnsavedChanges && composition) {
        await saveTool(currentToolId, {
          id: composition.id,
          name: composition.name,
          description: composition.description,
          elements: composition.elements,
          connections: composition.connections,
          layout: 'grid',
        });
      }

      await deployToolToTarget(currentToolId, config);
      setHasUnsavedChanges(false);

      // Find target name for toast
      const target = deploymentTargets.find((t) => t.id === config.targetId);
      const targetName = target?.name || (config.targetType === 'profile' ? 'your profile' : 'space');

      // Show success toast with action
      if (config.targetType === 'space' && config.targetId) {
        toast.success(`Deployed to ${targetName}`, {
          description: 'Space members can now use this tool.',
          action: {
            label: 'View in space',
            onClick: () => router.push(`/spaces/${config.targetId}`),
          },
        });
      } else {
        toast.success(`Deployed to ${targetName}`, {
          description: 'This tool is now visible on your profile.',
        });
      }
    },
    [currentToolId, hasUnsavedChanges, composition, deploymentTargets, router]
  );

  // Handle view in space
  const handleViewInSpace = useCallback(
    (spaceId: string) => {
      router.push(`/spaces/${spaceId}`);
    },
    [router]
  );

  // Handle tool selection from "Your Tools" drawer
  const handleToolSelect = useCallback(
    (id: string) => {
      if (hasUnsavedChanges) {
        const confirmLeave = window.confirm(
          'You have unsaved changes. Are you sure you want to switch tools?'
        );
        if (!confirmLeave) return;
      }

      // Reset state and navigate
      setIsInitialized(false);
      setComposition(null);
      setCurrentToolId(id);
      setHasUnsavedChanges(false);

      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('template');
      newUrl.searchParams.delete('prompt');
      newUrl.searchParams.set('id', id);
      window.history.replaceState({}, '', newUrl.toString());

      // Trigger re-fetch
      queryClient.invalidateQueries({ queryKey: ['tool', id] });
    },
    [hasUnsavedChanges, queryClient]
  );

  // Handle new tool creation
  const handleNewTool = useCallback(() => {
    if (hasUnsavedChanges) {
      const confirmLeave = window.confirm(
        'You have unsaved changes. Are you sure you want to start a new tool?'
      );
      if (!confirmLeave) return;
    }

    setIsInitialized(false);
    setComposition({
      id: `tool_${Date.now()}`,
      name: '',
      description: '',
      elements: [],
      connections: [],
    });
    setCurrentToolId(null);
    setHasUnsavedChanges(false);

    const newUrl = new URL(window.location.href);
    newUrl.searchParams.delete('id');
    newUrl.searchParams.delete('template');
    newUrl.searchParams.delete('prompt');
    window.history.replaceState({}, '', newUrl.toString());

    setIsInitialized(true);
  }, [hasUnsavedChanges]);

  // Guest preview
  if (!authLoading && !user) {
    return <GuestPreview onSignUp={() => router.push('/enter?redirect=/tools')} />;
  }

  // Loading state
  if (authLoading || toolsLoading || (toolIdParam && toolLoading && !composition)) {
    return <Loading />;
  }

  // Waiting for composition initialization
  if (!composition) {
    return <Loading />;
  }

  // Format user tools for the drawer
  const formattedUserTools = userTools.map((t) => ({
    id: t.id,
    name: t.name,
    status: t.status,
    updatedAt: typeof t.updatedAt === 'string' ? new Date(t.updatedAt) : t.updatedAt,
  }));

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
            layout: 'grid',
          })
        }
        onSave={() =>
          handleSave({
            id: composition.id,
            name: composition.name,
            description: composition.description,
            elements: composition.elements,
            connections: composition.connections,
            layout: 'grid',
          })
        }
        saving={saving}
        onBack={handleCancel}
        hasUnsavedChanges={hasUnsavedChanges}
        onDeploy={() => setDeployModalOpen(true)}
      />

      {/* HiveLab IDE */}
      <div className="flex-1 overflow-hidden">
        <HiveLabIDE
          initialComposition={composition}
          onSave={handleSave}
          onPreview={handlePreview}
          onCancel={handleCancel}
          userId={user?.uid || 'anonymous'}
          userContext={userContext}
          userTools={formattedUserTools}
          onToolSelect={handleToolSelect}
          onNewTool={handleNewTool}
          initialPrompt={promptParam}
        />
      </div>

      {/* Deploy Modal */}
      <ToolDeployModal
        open={deployModalOpen}
        onOpenChange={setDeployModalOpen}
        toolName={composition.name || 'Untitled Tool'}
        availableTargets={deploymentTargets}
        onDeploy={handleDeploy}
        onViewInSpace={handleViewInSpace}
      />
    </div>
  );
}

// Main export with Suspense boundary for useSearchParams
export default function ToolsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ToolsPageContent />
    </Suspense>
  );
}
