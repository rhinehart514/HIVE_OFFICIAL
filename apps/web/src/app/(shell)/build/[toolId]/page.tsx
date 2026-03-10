'use client';

import { use, useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Link2,
  Check,
  Send,
  Rocket,
  Clock,
  RotateCcw,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '@hive/auth-logic';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { MOTION, durationSeconds } from '@hive/tokens';
import { BrandSpinner } from '@hive/ui';
import { useToolRuntime } from '@/hooks/use-tool-runtime';

const LazyToolCanvas = dynamic(
  () => import('@hive/ui').then((mod) => ({ default: mod.ToolCanvas })),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-3 animate-pulse p-4">
        <div className="h-12 bg-white/[0.03] rounded-lg" />
        <div className="h-12 bg-white/[0.03] rounded-lg" />
        <div className="h-12 bg-white/[0.03] rounded-lg" />
      </div>
    ),
  }
);

const EASE = MOTION.ease.premium;

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

interface ToolData {
  id: string;
  name: string;
  description?: string;
  status?: string;
  ownerId?: string;
  createdBy?: string;
  currentVersion?: string;
  createdAt?: string;
  elements?: Array<{
    elementId: string;
    instanceId?: string;
    config?: Record<string, unknown>;
    position?: { x: number; y: number };
    size?: { width: number; height: number };
  }>;
  connections?: Array<{
    from: { instanceId: string; port?: string };
    to: { instanceId: string; port?: string };
  }>;
  pages?: Array<{
    id: string;
    name: string;
    elements: Array<{
      elementId: string;
      instanceId: string;
      config: Record<string, unknown>;
      position?: { x: number; y: number };
      size?: { width: number; height: number };
    }>;
    connections?: Array<{
      from: { instanceId: string; port: string };
      to: { instanceId: string; port: string };
    }>;
    isStartPage?: boolean;
  }>;
  versions?: VersionEntry[];
}

interface VersionEntry {
  version: string;
  createdAt: unknown;
  changelog?: string;
  elementCount?: number;
  restoredFrom?: string;
}

interface SpaceOption {
  id: string;
  name: string;
  handle?: string;
}

// --------------------------------------------------------------------------
// Data fetching helpers
// --------------------------------------------------------------------------

async function fetchTool(toolId: string): Promise<ToolData> {
  const res = await fetch(`/api/tools/${toolId}`, { credentials: 'include' });
  if (res.status === 404) throw new Error('not_found');
  if (!res.ok) throw new Error('Failed to load');
  const result = await res.json();
  return result.data || result;
}

async function fetchMySpaces(): Promise<SpaceOption[]> {
  const res = await fetch('/api/spaces/mine?roles=owner,admin,moderator,leader,builder', {
    credentials: 'include',
  });
  if (!res.ok) return [];
  const result = await res.json();
  const spaces = result.data?.spaces || result.spaces || [];
  return spaces.map((s: Record<string, unknown>) => ({
    id: s.id as string,
    name: (s.name as string) || 'Untitled Space',
    handle: s.handle as string | undefined,
  }));
}

async function fetchVersions(toolId: string): Promise<VersionEntry[]> {
  const res = await fetch(`/api/tools/${toolId}/versions`, { credentials: 'include' });
  if (!res.ok) return [];
  const result = await res.json();
  return result.data?.versions || result.versions || [];
}

// --------------------------------------------------------------------------
// Page Component
// --------------------------------------------------------------------------

interface Props {
  params: Promise<{ toolId: string }>;
}

export default function BuildStudioPage({ params }: Props) {
  const { toolId } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isLoading: authLoading } = useAuth();

  // Local state
  const [copied, setCopied] = useState(false);
  const [iterateInput, setIterateInput] = useState('');
  const [isIterating, setIsIterating] = useState(false);
  const [showDeployPicker, setShowDeployPicker] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [mobileTab, setMobileTab] = useState<'preview' | 'chat'>('preview');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const deployRef = useRef<HTMLDivElement>(null);

  // Data queries
  const {
    data: tool,
    isLoading: toolLoading,
    error: toolError,
    refetch,
  } = useQuery({
    queryKey: ['tool', toolId],
    queryFn: () => fetchTool(toolId),
    enabled: !!user && !!toolId,
    staleTime: 60_000,
  });

  const { data: spaces = [] } = useQuery({
    queryKey: ['my-spaces'],
    queryFn: fetchMySpaces,
    enabled: !!user && showDeployPicker,
    staleTime: 5 * 60_000,
  });

  const { data: versions = [] } = useQuery({
    queryKey: ['tool-versions', toolId],
    queryFn: () => fetchVersions(toolId),
    enabled: !!user && showVersions,
    staleTime: 60_000,
  });

  // Tool runtime for live preview
  const runtime = useToolRuntime({
    toolId,
    enabled: !!tool,
    autoSave: true,
    autoSaveDelay: 1500,
    enableRealtime: false,
  });

  // Auth redirect
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/enter');
    }
  }, [authLoading, user, router]);

  // Close deploy picker on outside click
  useEffect(() => {
    if (!showDeployPicker) return;
    function handleClick(e: MouseEvent) {
      if (deployRef.current && !deployRef.current.contains(e.target as Node)) {
        setShowDeployPicker(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showDeployPicker]);

  // ---------- Actions ----------

  const handleShare = useCallback(async () => {
    const url = `${window.location.origin}/t/${toolId}`;
    if (tool?.status === 'draft') {
      try {
        await fetch(`/api/tools/${toolId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ status: 'published', visibility: 'public' }),
        });
      } catch {
        // non-blocking
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Link copied!');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.success(`Share: ${url}`);
    }
  }, [toolId, tool?.status]);

  const handleDeploy = useCallback(
    async (spaceId: string, spaceName: string) => {
      setIsDeploying(true);
      try {
        const res = await fetch(`/api/tools/${toolId}/deploy`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ spaceId }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Deploy failed');
        }
        toast.success(`Deployed to ${spaceName}`);
        setShowDeployPicker(false);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Deploy failed');
      } finally {
        setIsDeploying(false);
      }
    },
    [toolId]
  );

  const handleIterate = useCallback(async () => {
    const prompt = iterateInput.trim();
    if (!prompt || isIterating) return;

    setIsIterating(true);
    setIterateInput('');

    try {
      const response = await fetch('/api/tools/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          prompt,
          mode: 'code',
          existingCode: tool?.elements?.[0]?.config?.code || undefined,
          existingName: tool?.name,
          isIteration: true,
        }),
      });

      if (!response.ok || !response.body) throw new Error('Generation failed');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          try {
            const chunk = JSON.parse(trimmed);
            if (chunk.type === 'code' && chunk.data?.code) {
              await fetch(`/api/tools/${toolId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                  name: chunk.data.name || tool?.name,
                  elements: [
                    {
                      elementId: 'custom-block',
                      instanceId: 'code_app_1',
                      config: {
                        code: chunk.data.code,
                        metadata: {
                          name: chunk.data.name || tool?.name || '',
                          description: chunk.data.description || '',
                          createdBy: 'ai',
                        },
                      },
                    },
                  ],
                  type: 'code',
                }),
              });
            }
            if (chunk.type === 'error') {
              throw new Error(chunk.data?.error || 'Generation failed');
            }
          } catch (e) {
            if (e instanceof SyntaxError) continue;
            throw e;
          }
        }
      }

      toast.success('Updated!');
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to iterate');
    } finally {
      setIsIterating(false);
    }
  }, [iterateInput, isIterating, toolId, tool, refetch]);

  const handleRestore = useCallback(
    async (version: string) => {
      setIsRestoring(true);
      try {
        const res = await fetch(`/api/tools/${toolId}/versions/${version}/restore`, {
          method: 'POST',
          credentials: 'include',
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Restore failed');
        }
        toast.success(`Restored to v${version}`);
        refetch();
        queryClient.invalidateQueries({ queryKey: ['tool-versions', toolId] });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Restore failed');
      } finally {
        setIsRestoring(false);
      }
    },
    [toolId, refetch, queryClient]
  );

  // ---------- Render states ----------

  if (authLoading || toolLoading) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center">
        <BrandSpinner size="md" variant="gold" />
      </div>
    );
  }

  if (toolError || !tool) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <h2 className="text-xl font-semibold text-white mb-2">Not found</h2>
          <p className="text-white/50 text-sm mb-6">
            This may have been deleted or you don&apos;t have access.
          </p>
          <button
            onClick={() => router.push('/discover')}
            className="px-6 py-2.5 bg-white text-black text-sm font-semibold rounded-full hover:bg-white/90 transition-colors"
          >
            Go to Discover
          </button>
        </div>
      </div>
    );
  }

  const isOwner =
    user?.uid === tool.ownerId || user?.uid === tool.createdBy;
  const hasElements = (tool.elements?.length ?? 0) > 0;

  // ---------- Preview panel ----------

  const previewPanel = (
    <div className="flex-1 flex flex-col items-center px-4 py-6 overflow-auto">
      <div className="w-full max-w-[520px]">
        {/* Tool info */}
        <div className="mb-4">
          <h2 className="text-lg font-medium text-white truncate">
            {tool.name || 'Untitled'}
          </h2>
          {tool.description && (
            <p className="text-sm text-white/30 mt-1 line-clamp-2">
              {tool.description}
            </p>
          )}
          <div className="flex items-center gap-3 mt-2 text-xs text-white/30">
            {tool.currentVersion && <span>v{tool.currentVersion}</span>}
            {tool.createdAt && (
              <span>
                Created{' '}
                {new Date(tool.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            )}
          </div>
        </div>

        {/* Canvas */}
        {hasElements ? (
          <div className="rounded-2xl bg-void border border-white/[0.06] p-5 sm:p-6">
            <LazyToolCanvas
              elements={tool.elements!.map((el) => ({
                elementId: el.elementId,
                instanceId: el.instanceId || `${el.elementId}_0`,
                config: (el.config as Record<string, unknown>) || {},
                position: el.position,
                size: el.size,
              }))}
              pages={tool.pages}
              state={runtime.state}
              sharedState={runtime.sharedState}
              userState={runtime.userState}
              connections={tool.connections || []}
              layout="stack"
              onElementChange={(instanceId: string, data: unknown) => {
                runtime.updateState({ [instanceId]: data });
              }}
              onElementAction={(
                instanceId: string,
                action: string,
                payload: unknown
              ) => {
                runtime.executeAction(
                  instanceId,
                  action,
                  payload as Record<string, unknown>
                );
              }}
              isLoading={runtime.isLoading || runtime.isExecuting}
              error={runtime.error?.message || null}
              context={{
                userId: user?.uid,
                userDisplayName:
                  user?.displayName || user?.fullName || undefined,
                userRole: 'member',
                isSpaceLeader: false,
              }}
            />
          </div>
        ) : (
          <div className="rounded-2xl bg-void border border-white/[0.06] p-8 text-center">
            <p className="text-white/30 text-sm mb-4">This app is empty</p>
            <p className="text-white/30 text-xs">
              Describe what you want below
            </p>
          </div>
        )}

        {/* Version history */}
        {isOwner && (
          <div className="mt-4">
            <button
              onClick={() => setShowVersions(!showVersions)}
              className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/50 transition-colors"
            >
              <Clock className="w-3 h-3" />
              Version history
              <ChevronDown
                className={`w-3 h-3 transition-transform ${showVersions ? 'rotate-180' : ''}`}
              />
            </button>

            <AnimatePresence>
              {showVersions && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: EASE }}
                  className="overflow-hidden"
                >
                  <div className="mt-2 space-y-1 max-h-48 overflow-y-auto">
                    {versions.length === 0 && (
                      <p className="text-xs text-white/30 py-2">
                        No versions yet
                      </p>
                    )}
                    {versions.map((v) => (
                      <div
                        key={v.version}
                        className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-white/[0.03] group"
                      >
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-mono text-white/50">
                            v{v.version}
                          </span>
                          {v.changelog && (
                            <span className="text-xs text-white/30 ml-2 truncate">
                              {v.changelog}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => handleRestore(v.version)}
                          disabled={isRestoring}
                          className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-[11px] text-white/30 hover:text-white/50 transition-[color,opacity] duration-100 disabled:opacity-30"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Restore
                        </button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );

  // ---------- Chat / iterate panel ----------

  const chatPanel = isOwner ? (
    <div className="border-t lg:border-t-0 lg:border-l border-white/[0.06] bg-black/80 px-4 py-3 lg:py-6 lg:w-[360px] lg:flex lg:flex-col lg:justify-end">
      <div className="max-w-[520px] mx-auto lg:max-w-none w-full">
        <p className="text-xs text-white/30 mb-2 hidden lg:block">
          Describe a change
        </p>
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={iterateInput}
            onChange={(e) => setIterateInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleIterate();
              }
            }}
            placeholder={
              isIterating ? 'Updating...' : 'Make the button bigger...'
            }
            disabled={isIterating}
            rows={2}
            className="flex-1 resize-none bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5
              text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-white/[0.15]
              disabled:opacity-40 transition-colors"
          />
          <button
            onClick={handleIterate}
            disabled={!iterateInput.trim() || isIterating}
            className="p-2.5 rounded-full bg-white text-black disabled:opacity-30 disabled:bg-white/50
              hover:bg-white/90 transition-colors shrink-0"
          >
            {isIterating ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              >
                <Send className="w-4 h-4" />
              </motion.div>
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  // ---------- Main layout ----------

  return (
    <div className="min-h-screen bg-void flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] shrink-0">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-white/30 hover:text-white/50 transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <h1 className="text-sm font-medium text-white truncate max-w-[180px]">
          {tool.name || 'Untitled'}
        </h1>

        <div className="flex items-center gap-2">
          {/* Deploy to Space */}
          {isOwner && (
            <div className="relative" ref={deployRef}>
              <button
                onClick={() => setShowDeployPicker(!showDeployPicker)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full
                  text-[13px] font-medium bg-[#FFD700]/10 text-[#FFD700] border border-[#FFD700]/20
                  hover:bg-[#FFD700]/20 transition-colors"
              >
                <Rocket className="w-3.5 h-3.5" />
                Deploy
              </button>

              <AnimatePresence>
                {showDeployPicker && (
                  <motion.div
                    initial={{ opacity: 0, y: 4, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.95 }}
                    transition={{
                      duration: durationSeconds.quick,
                      ease: EASE,
                    }}
                    className="absolute right-0 top-full mt-2 w-64 bg-[#141414] border border-white/[0.08]
                      rounded-xl shadow-md z-50 overflow-hidden"
                  >
                    <div className="px-3 py-2 border-b border-white/[0.06]">
                      <p className="text-xs font-medium text-white/50">
                        Deploy to Space
                      </p>
                    </div>
                    <div className="max-h-48 overflow-y-auto py-1">
                      {spaces.length === 0 && (
                        <p className="text-xs text-white/30 px-3 py-3 text-center">
                          No spaces found
                        </p>
                      )}
                      {spaces.map((space) => (
                        <button
                          key={space.id}
                          onClick={() => handleDeploy(space.id, space.name)}
                          disabled={isDeploying}
                          className="w-full text-left px-3 py-2 text-sm text-white/50
                            hover:bg-white/[0.06] hover:text-white/70 transition-colors
                            disabled:opacity-40"
                        >
                          {space.name}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Share */}
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-black text-[13px] font-semibold hover:bg-white/90 transition-colors"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <Link2 className="w-3.5 h-3.5" />
            )}
            {copied ? 'Copied' : 'Share'}
          </button>
        </div>
      </header>

      {/* Mobile tab toggle */}
      {isOwner && (
        <div className="flex lg:hidden border-b border-white/[0.06]">
          <button
            onClick={() => setMobileTab('preview')}
            className={`flex-1 py-2 text-xs font-medium text-center transition-colors ${
              mobileTab === 'preview'
                ? 'text-white/70 border-b-2 border-white/20'
                : 'text-white/30'
            }`}
          >
            Preview
          </button>
          <button
            onClick={() => setMobileTab('chat')}
            className={`flex-1 py-2 text-xs font-medium text-center transition-colors ${
              mobileTab === 'chat'
                ? 'text-white/70 border-b-2 border-white/20'
                : 'text-white/30'
            }`}
          >
            Iterate
          </button>
        </div>
      )}

      {/* Desktop: side-by-side. Mobile: tab toggle */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Preview — always visible on desktop, toggled on mobile */}
        <div
          className={`flex-1 flex flex-col overflow-auto ${
            isOwner && mobileTab !== 'preview' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {previewPanel}
        </div>

        {/* Chat — always visible on desktop, toggled on mobile */}
        {isOwner && (
          <div
            className={`lg:flex lg:flex-col ${
              mobileTab !== 'chat' ? 'hidden lg:flex' : 'flex flex-col flex-1'
            }`}
          >
            {chatPanel}
          </div>
        )}
      </div>
    </div>
  );
}
