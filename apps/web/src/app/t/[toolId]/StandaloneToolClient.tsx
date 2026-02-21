'use client';

import { useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useAuth } from '@hive/auth-logic';
import { useQuery } from '@tanstack/react-query';
import { useToolRuntime } from '@/hooks/use-tool-runtime';

const LazyToolCanvas = dynamic(
  () => import('@hive/ui').then(mod => ({ default: mod.ToolCanvas })),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-4 animate-pulse">
        <div className="h-11 bg-white/[0.03] rounded-lg" />
        <div className="h-11 bg-white/[0.03] rounded-lg" />
        <div className="h-11 bg-white/[0.03] rounded-lg" />
      </div>
    ),
  }
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

export function StandaloneToolClient({ toolId, baseUrl: _baseUrl }: { toolId: string; baseUrl: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const [hasInteracted, setHasInteracted] = useState(false);
  const interactionRef = useRef(false);

  const {
    data: tool,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['tool', toolId],
    queryFn: () => fetchTool(toolId),
    staleTime: 60000,
    retry: (failureCount, err) => {
      if (err instanceof Error && (err.message.includes('private') || err.message.includes('not found'))) {
        return false;
      }
      return failureCount < 2;
    },
  });

  const runtime = useToolRuntime({
    toolId,
    enabled: !!tool,
    autoSave: true,
    autoSaveDelay: 1500,
    enableRealtime: true,
  });

  const handleElementChange = useCallback((instanceId: string, data: unknown) => {
    runtime.updateState({ [instanceId]: data });
    if (!interactionRef.current) {
      interactionRef.current = true;
      setHasInteracted(true);
    }
  }, [runtime]);

  const handleElementAction = useCallback((instanceId: string, action: string, payload: unknown) => {
    runtime.executeAction(instanceId, action, payload as Record<string, unknown>);
    if (!interactionRef.current) {
      interactionRef.current = true;
      setHasInteracted(true);
    }
  }, [runtime]);

  // Loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="w-full max-w-[480px]">
          <div className="rounded-2xl bg-[#080808] border border-white/[0.06] p-8">
            <div className="space-y-4 animate-pulse">
              <div className="h-6 w-40 bg-white/[0.04] rounded-lg" />
              <div className="h-4 w-64 bg-white/[0.03] rounded-lg" />
              <div className="h-px bg-white/[0.06] my-4" />
              <div className="h-11 bg-white/[0.03] rounded-lg" />
              <div className="h-11 bg-white/[0.03] rounded-lg" />
              <div className="h-11 bg-white/[0.03] rounded-lg" />
            </div>
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
          <button
            onClick={() => router.push('/enter')}
            className="px-6 py-2.5 bg-white text-black text-sm font-medium rounded-full hover:bg-white/90 transition-colors"
          >
            Sign In
          </button>
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
            className="px-6 py-2.5 bg-white text-black text-sm font-medium rounded-full hover:bg-white/90 transition-colors"
          >
            Explore Tools
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Minimal header — way back to HIVE */}
      <header className="flex items-center justify-between px-6 py-4 flex-shrink-0">
        <Link
          href="/discover"
          className="flex items-center gap-2 rounded-full px-2 py-1.5 transition-colors hover:bg-white/[0.04]"
        >
          <span className="h-4 w-4 rounded-full bg-[#FFD700]" aria-hidden />
          <span className="font-sans text-[10px] font-medium uppercase tracking-[0.18em] text-white/40">
            HIVE
          </span>
        </Link>
        {tool.ownerName && (
          <span className="text-[12px] text-white/25 font-sans tracking-wide">
            by {tool.ownerName}
          </span>
        )}
      </header>

      {/* Tool — centered, frameless */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-6">
        <div className="w-full max-w-[480px]">
          {/* Tool surface */}
          <div className="rounded-2xl bg-[#080808] border border-white/[0.06] p-6 sm:p-8">
            {/* Tool title inside the card */}
            <div className="mb-5">
              <h1 className="text-lg font-semibold text-white leading-tight">
                {tool.name}
              </h1>
              {tool.description && (
                <p className="text-sm text-white/50 mt-1 leading-relaxed">
                  {tool.description}
                </p>
              )}
            </div>

            {/* Tool canvas */}
            {tool.elements.length > 0 ? (
              <LazyToolCanvas
                elements={tool.elements}
                state={runtime.state}
                sharedState={runtime.sharedState}
                userState={runtime.userState}
                connections={tool.connections || []}
                layout="stack"
                onElementChange={handleElementChange}
                onElementAction={handleElementAction}
                isLoading={runtime.isLoading || runtime.isExecuting}
                error={runtime.error?.message || null}
                context={{
                  userId: user?.uid,
                  userDisplayName: user?.displayName || user?.fullName || undefined,
                  userRole: user ? 'member' : 'guest',
                  isSpaceLeader: false,
                }}
              />
            ) : (
              <div className="text-center py-12">
                <p className="text-white/50 text-sm">This tool has no elements yet</p>
              </div>
            )}
          </div>

          {/* Post-interaction CTA — appears after user engages */}
          {hasInteracted && !user && (
            <div className="mt-6 text-center animate-in fade-in duration-300">
              <Link
                href="/enter"
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-white text-black text-sm font-medium rounded-full hover:bg-white/90 transition-colors"
              >
                Create your own tool
              </Link>
            </div>
          )}
        </div>
      </main>

      {/* HIVE watermark + CTA */}
      <footer className="pb-8 pt-2 text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 group"
        >
          <span
            className="h-[6px] w-[6px] rounded-full bg-[#FFD700]"
            style={{ animation: 'pulse-breathe 3s ease-in-out infinite' }}
          />
          <span className="font-sans text-[10px] font-medium uppercase tracking-[0.18em] text-white/30 group-hover:text-white/50 transition-colors">
            HIVE
          </span>
        </Link>

        {/* Persistent subtle CTA for non-auth users */}
        {!user && !hasInteracted && (
          <div className="mt-3">
            <Link
              href="/enter"
              className="text-[13px] text-white/30 hover:text-white/60 transition-colors"
            >
              Build your own &rarr;
            </Link>
          </div>
        )}
      </footer>

      {/* Breathing animation for the yellow dot */}
      <style jsx>{`
        @keyframes pulse-breathe {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
