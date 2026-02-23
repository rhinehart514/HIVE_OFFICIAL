'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@hive/auth-logic';
import { useQuery } from '@tanstack/react-query';
import { useToolRuntime } from '@/hooks/use-tool-runtime';
import { useAnalytics } from '@/hooks/use-analytics';

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
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { track } = useAnalytics();
  const [hasInteracted, setHasInteracted] = useState(false);
  const [showCreatedBanner, setShowCreatedBanner] = useState(false);
  const [copied, setCopied] = useState(false);
  const interactionRef = useRef(false);

  // Show share banner when arriving from creation flow
  useEffect(() => {
    if (searchParams.get('just_created') === 'true') {
      setShowCreatedBanner(true);
    }
  }, [searchParams]);


  const handleShare = useCallback(async () => {
    const url = `${window.location.origin}/t/${toolId}`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: 'Check this out', url });
      } catch {
        // User cancelled share
      }
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [toolId]);

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

  // Track standalone view
  const hasTrackedView = useRef(false);
  useEffect(() => {
    if (tool && !hasTrackedView.current) {
      hasTrackedView.current = true;
      track('standalone_viewed', { toolId, isCreator: !!user && tool.ownerId === user.uid });
    }
  }, [toolId, user, tool, track]);

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
      track('standalone_interacted', { toolId, action });
    }
  }, [runtime, toolId, track]);

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
          <h2 className="text-xl font-semibold text-white mb-2">Private Creation</h2>
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
          <h2 className="text-xl font-semibold text-white mb-2">Not Found</h2>
          <p className="text-white/50 text-sm mb-6">
            This tool may have been deleted or the link is incorrect.
          </p>
          <button
            onClick={() => router.push('/discover')}
            className="px-6 py-2.5 bg-white text-black text-sm font-medium rounded-full hover:bg-white/90 transition-colors"
          >
            Explore
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

          {/* Just created — share banner */}
          {showCreatedBanner && (
            <div className="mt-4 rounded-2xl border border-[#FFD700]/20 bg-[#FFD700]/[0.04] p-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <p className="text-[15px] font-medium text-white mb-1">
                Your creation is live
              </p>
              <p className="text-[13px] text-white/50 mb-4">
                Share this link — anyone can use it, no account needed.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleShare}
                  className="flex-1 px-4 py-2.5 bg-[#FFD700] text-black text-sm font-medium rounded-xl hover:bg-[#FFD700]/90 transition-colors"
                >
                  {copied ? 'Copied!' : 'Share link'}
                </button>
                <button
                  onClick={() => router.push(`/lab/${toolId}`)}
                  className="px-4 py-2.5 bg-white/[0.06] text-white/60 text-sm font-medium rounded-xl hover:bg-white/[0.08] transition-colors"
                >
                  Edit
                </button>
              </div>
            </div>
          )}

          {/* Post-interaction CTA — appears after user engages */}
          {hasInteracted && !user && (
            <div className="mt-6 text-center animate-in fade-in duration-300">
              <Link
                href="/enter"
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-white text-black text-sm font-medium rounded-full hover:bg-white/90 transition-colors"
              >
                Create your own
              </Link>
            </div>
          )}
        </div>
      </main>

      {/* Made with HIVE — acquisition surface */}
      <footer className="pb-8 pt-4 text-center space-y-2">
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 group"
          >
            <span
              className="h-[6px] w-[6px] rounded-full bg-[#FFD700]"
              style={{ animation: 'pulse-breathe 3s ease-in-out infinite' }}
            />
            <span className="font-sans text-[10px] font-medium uppercase tracking-[0.18em] text-white/30 group-hover:text-white/50 transition-colors">
              Made with HIVE
            </span>
          </Link>
          <span className="text-white/15">·</span>
          <Link
            href={`/enter?from=tool&toolType=${tool.elements[0]?.elementId || 'poll'}`}
            className="font-sans text-[10px] font-medium uppercase tracking-[0.18em] text-white/30 hover:text-[#FFD700]/60 transition-colors"
          >
            Create your own
          </Link>
        </div>

        {/* Share button — always visible */}
        <button
          onClick={handleShare}
          className="text-[12px] text-white/20 hover:text-white/40 transition-colors"
        >
          {copied ? 'Copied!' : 'Share'}
        </button>
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
