'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useAuth } from '@hive/auth-logic';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Copy } from 'lucide-react';
import { Skeleton } from '@hive/ui';
import { useToolRuntime } from '@/hooks/use-tool-runtime';
import { apiClient } from '@/lib/api-client';

const LazyToolCanvas = dynamic(
  () => import('@hive/ui').then(mod => ({ default: mod.ToolCanvas })),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-4 animate-pulse">
        <div className="h-11 bg-white/[0.04] rounded-lg" />
        <div className="h-11 bg-white/[0.04] rounded-lg" />
        <div className="h-11 bg-white/[0.04] rounded-lg" />
      </div>
    ),
  }
);

const LazyShareButton = dynamic(
  () => import('@/components/share/ShareButton').then(mod => ({ default: mod.ShareButton })),
  { ssr: false, loading: () => <div className="w-[72px] h-[34px] bg-white/[0.04] rounded-lg animate-pulse" /> }
);

interface ToolData {
  id: string;
  name: string;
  description?: string;
  visibility: 'public' | 'private' | 'unlisted';
  status: 'draft' | 'published' | 'archived';
  ownerId: string;
  ownerName?: string;
  ownerAvatar?: string;
  campusId?: string;
  campusName?: string;
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
  createdAt: string;
  updatedAt?: string;
  viewCount?: number;
}

async function fetchTool(toolId: string): Promise<ToolData> {
  const response = await fetch(`/api/tools/${toolId}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    if (response.status === 404) throw new Error('Tool not found');
    if (response.status === 403) throw new Error('This tool is private');
    throw new Error('Failed to load tool');
  }

  const result = await response.json();
  return result.data || result;
}

export function StandaloneToolClient({ toolId, baseUrl }: { toolId: string; baseUrl: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const [isCloning, setIsCloning] = useState(false);

  const {
    data: tool,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['tool', toolId],
    queryFn: () => fetchTool(toolId),
    staleTime: 60000,
    retry: (failureCount, error) => {
      if (error instanceof Error && (error.message.includes('private') || error.message.includes('not found'))) {
        return false;
      }
      return failureCount < 2;
    },
  });

  const handleClone = useCallback(async () => {
    if (!user) {
      router.push(`/enter?redirect=/t/${toolId}`);
      return;
    }
    if (isCloning) return;

    setIsCloning(true);
    try {
      const res = await apiClient.post(`/api/tools/${toolId}/clone`, {});
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to clone');
      toast.success('Tool cloned to your lab');
      router.push(`/lab/${json.data.tool.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to clone tool');
      setIsCloning(false);
    }
  }, [user, toolId, router, isCloning]);

  const runtime = useToolRuntime({
    toolId,
    enabled: !!tool,
    autoSave: true,
    autoSaveDelay: 1500,
    enableRealtime: true,
  });

  // Loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="w-full max-w-[480px] space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-full max-w-xs" />
          <div className="mt-6 rounded-2xl bg-[#0A0A0A] border border-white/[0.08] p-8">
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    );
  }

  // Error: private
  if (error instanceof Error && error.message.includes('private')) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <h2 className="text-xl font-semibold text-white mb-2">Private Tool</h2>
          <p className="text-white/50 text-sm mb-6">
            Sign in to view this tool if you have access.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.push('/enter')}
              className="px-5 py-2.5 bg-[#FFD700] text-black text-sm font-medium rounded-full hover:opacity-90 transition-opacity"
            >
              Sign In
            </button>
            <button
              onClick={() => router.push('/discover')}
              className="px-5 py-2.5 bg-white/[0.06] text-white/50 text-sm font-medium rounded-full hover:bg-white/[0.06] transition-colors"
            >
              Explore
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Error: not found
  if (error || !tool) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <h2 className="text-xl font-semibold text-white mb-2">Tool Not Found</h2>
          <p className="text-white/50 text-sm mb-6">
            This tool may have been deleted or the link is incorrect.
          </p>
          <button
            onClick={() => router.push('/discover')}
            className="px-5 py-2.5 bg-[#FFD700] text-black text-sm font-medium rounded-full hover:opacity-90 transition-opacity"
          >
            Explore Tools
          </button>
        </div>
      </div>
    );
  }

  const toolUrl = `${baseUrl}/t/${toolId}`;

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Tool content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-[480px]">
          {/* Tool header */}
          <div className="flex items-center justify-between mb-6">
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-semibold text-white truncate">
                {tool.name}
              </h1>
              {tool.description && (
                <p className="text-sm text-white/50 truncate mt-0.5">
                  {tool.description}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 flex-shrink-0 ml-4">
              <LazyShareButton url={toolUrl} title={tool.name} description={tool.description} />
              {user && tool.ownerId === user.uid && (
                <button
                  onClick={() => router.push(`/lab/${toolId}`)}
                  className="px-4 py-2 text-[13px] font-medium bg-[#FFD700] text-black rounded-full hover:opacity-90 transition-opacity"
                >
                  Edit
                </button>
              )}
              {user && tool.ownerId !== user.uid && (
                <button
                  onClick={handleClone}
                  disabled={isCloning}
                  className="px-4 py-2 text-[13px] font-medium bg-white/[0.06] text-white rounded-full hover:bg-white/[0.10] transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {isCloning ? 'Cloning...' : 'Clone'}
                </button>
              )}
              {!user && (
                <button
                  onClick={handleClone}
                  className="px-4 py-2 text-[13px] font-medium bg-white/[0.06] text-white rounded-full hover:bg-white/[0.10] transition-colors flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Clone
                </button>
              )}
            </div>
          </div>

          {/* Tool canvas */}
          <div className="rounded-2xl bg-[#0A0A0A] border border-white/[0.08] p-6">
            {tool.elements.length > 0 ? (
              <LazyToolCanvas
                elements={tool.elements}
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
                  isSpaceLeader: false,
                }}
              />
            ) : (
              <div className="text-center py-12">
                <p className="text-white/50 text-sm">This tool has no elements yet</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* HIVE watermark + CTA */}
      <footer className="pb-8 text-center">
        {/* Watermark */}
        <div className="flex items-center justify-center gap-1.5 mb-3">
          <span className="h-[6px] w-[6px] rounded-full bg-[#FFD700]" />
          <span className="font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-white/30">
            HIVE
          </span>
        </div>

        {/* CTA */}
        {!user && (
          <Link
            href="/enter"
            className="text-[13px] text-white/50 hover:text-white transition-colors"
          >
            Sign up to build your own &rarr;
          </Link>
        )}
      </footer>
    </div>
  );
}
