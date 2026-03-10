'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@hive/auth-logic';
import { useQuery } from '@tanstack/react-query';
import { useToolRuntime } from '@/hooks/use-tool-runtime';
import { useShellState } from '@/hooks/useShellState';
import { useAnalytics } from '@/hooks/use-analytics';
import { Shuffle, Users, X } from 'lucide-react';
import type { ShellFormat, ShellConfig, ShellAction } from '@/lib/shells/types';

const LazyShellRenderer = dynamic(
  () => import('@/components/shells/ShellRenderer'),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-2 animate-pulse">
        <div className="h-10 bg-white/[0.03] rounded-xl" />
        <div className="h-10 bg-white/[0.03] rounded-xl" />
      </div>
    ),
  }
);

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

interface ToolPage {
  id: string;
  name: string;
  elements: Array<{
    elementId: string;
    instanceId: string;
    config: Record<string, unknown>;
    position?: { x: number; y: number };
    size?: { width: number; height: number };
    onAction?: { type: 'navigate'; targetPageId: string };
  }>;
  connections?: Array<{
    from: { instanceId: string; port: string };
    to: { instanceId: string; port: string };
  }>;
  isStartPage?: boolean;
}

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
  pages?: ToolPage[];
  shellFormat?: ShellFormat;
  shellConfig?: ShellConfig;
  type?: 'shell' | 'code';
  createdAt: string;
  updatedAt?: string;
  viewCount?: number;
  useCount?: number;
  forkCount?: number;
  deployedSpaces?: string[];
  provenance?: {
    spaceId?: string;
    spaceName?: string;
  };
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

async function fetchSpaceName(spaceId: string): Promise<string | null> {
  try {
    const response = await fetch(`/api/spaces/${spaceId}`, { credentials: 'include' });
    if (!response.ok) return null;
    const result = await response.json();
    const space = result.data || result;
    return space.name || null;
  } catch {
    return null;
  }
}

export function StandaloneToolClient({ toolId, baseUrl: _baseUrl }: { toolId: string; baseUrl: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { track } = useAnalytics();
  const [hasInteracted, setHasInteracted] = useState(false);
  const [showCreatedBanner, setShowCreatedBanner] = useState(false);
  const [showConvertBanner, setShowConvertBanner] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isRemixing, setIsRemixing] = useState(false);
  const [spaceName, setSpaceName] = useState<string | null>(null);
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

  // Fetch space name for provenance
  useEffect(() => {
    if (!tool) return;
    const spaceId = tool.provenance?.spaceId || tool.deployedSpaces?.[0];
    if (spaceId) {
      fetchSpaceName(spaceId).then(setSpaceName);
    }
  }, [tool]);

  // Shell tools use RTDB state, not the element runtime
  const isShellTool = tool?.type === 'shell' || !!tool?.shellFormat;
  const shellState = useShellState(isShellTool ? toolId : null);

  // Session-scoped anonymous ID for unauthenticated interactions
  const anonIdRef = useRef<string | null>(null);
  const getAnonId = useCallback(() => {
    if (anonIdRef.current) return anonIdRef.current;
    const key = 'hive_anon_session';
    let id = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(key) : null;
    if (!id) {
      id = crypto.randomUUID();
      try { sessionStorage.setItem(key, id); } catch {}
    }
    anonIdRef.current = id;
    return id;
  }, []);

  const handleShellAction = useCallback((action: ShellAction) => {
    if (user) {
      // Authenticated: use direct RTDB client write
      shellState.dispatch(action, user.uid, {
        displayName: user.displayName || user.fullName || 'Member',
        photoURL: user.photoURL || '',
      });
    } else {
      // Anonymous: optimistic local update + API persist (Admin SDK bypasses RTDB auth rules)
      const sessionId = getAnonId();
      const anonUserId = `anon:${sessionId}`;
      // Optimistic update for immediate UI feedback (RTDB write will fail silently, that's fine)
      shellState.dispatch(action, anonUserId, {
        displayName: 'Guest',
        photoURL: '',
      });
      // Persist via server
      fetch(`/api/tools/${toolId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...action, sessionId }),
      }).catch(() => {});
    }

    if (!interactionRef.current) {
      interactionRef.current = true;
      setHasInteracted(true);
      track('standalone_interacted', { toolId, action: action.type });
      if (!user) {
        setTimeout(() => setShowConvertBanner(true), 2000);
      }
    }
  }, [shellState, user, toolId, track, getAnonId]);

  const runtime = useToolRuntime({
    toolId,
    enabled: !!tool && !isShellTool,
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
      // Show conversion banner for unauthenticated users after interaction
      if (!user) {
        setTimeout(() => setShowConvertBanner(true), 2000);
      }
    }
  }, [runtime, user]);

  const handleElementAction = useCallback((instanceId: string, action: string, payload: unknown) => {
    runtime.executeAction(instanceId, action, payload as Record<string, unknown>);
    if (!interactionRef.current) {
      interactionRef.current = true;
      setHasInteracted(true);
      track('standalone_interacted', { toolId, action });
      if (!user) {
        setTimeout(() => setShowConvertBanner(true), 2000);
      }
    }
  }, [runtime, toolId, track, user]);

  const handleRemix = useCallback(async () => {
    if (!user) {
      router.push(`/enter?redirect=${encodeURIComponent(`/t/${toolId}`)}`);
      return;
    }

    setIsRemixing(true);
    try {
      const response = await fetch(`/api/tools/${toolId}/clone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ mode: 'remix' }),
      });

      if (!response.ok) throw new Error('Failed to remix');

      const result = await response.json();
      const newToolId = result.data?.toolId || result.toolId;
      track('tool_remixed', { sourceToolId: toolId, newToolId });
      router.push(`/build/${newToolId}`);
    } catch {
      // Silently fail, user can retry
    } finally {
      setIsRemixing(false);
    }
  }, [user, toolId, router, track]);

  // Loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-void)] flex items-center justify-center p-6">
        <div className="w-full max-w-[480px]">
          <div className="rounded-2xl bg-void border border-white/[0.06] p-8">
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
      <div className="min-h-screen bg-[var(--bg-void)] flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <h2 className="text-xl font-semibold text-white mb-2">Private Creation</h2>
          <p className="text-white/50 text-sm mb-6">
            Sign in to view this app if you have access.
          </p>
          <button
            onClick={() => router.push('/enter')}
            className="px-6 py-2.5 bg-white text-black text-sm font-semibold rounded-full hover:bg-white/90 transition-colors"
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
      <div className="min-h-screen bg-[var(--bg-void)] flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <h2 className="text-xl font-semibold text-white mb-2">Not Found</h2>
          <p className="text-white/50 text-sm mb-6">
            This may have been deleted or the link is incorrect.
          </p>
          <button
            onClick={() => router.push('/discover')}
            className="px-6 py-2.5 bg-white text-black text-sm font-semibold rounded-full hover:bg-white/90 transition-colors"
          >
            Explore
          </button>
        </div>
      </div>
    );
  }

  const usageCount = tool.useCount || tool.viewCount || 0;
  const toolFormat = tool.shellFormat || tool.elements?.[0]?.elementId || 'poll';

  // Derive response count from shell state if available
  const responseCount = (() => {
    if (!isShellTool || !shellState.state) return usageCount;
    const s = shellState.state;
    const voteCount = 'votes' in s && s.votes ? Object.keys(s.votes as Record<string, unknown>).length : 0;
    const attendeeCount = 'attendees' in s && s.attendees ? Object.keys(s.attendees as Record<string, unknown>).length : 0;
    return voteCount + attendeeCount || usageCount;
  })();

  return (
    <div className="min-h-screen bg-[var(--bg-void)] flex flex-col">
      {/* Minimal header — way back to HIVE */}
      <header className="flex items-center justify-between px-6 py-4 flex-shrink-0">
        <Link
          href="/discover"
          className="flex items-center gap-2 rounded-full px-2 py-1.5 transition-colors hover:bg-white/[0.04]"
        >
          <span className="h-4 w-4 rounded-full bg-[var(--life-gold,#FFD700)]" aria-hidden />
          <span className="font-display text-[12px] font-semibold tracking-[0.08em] text-white/50">
            HIVE
          </span>
        </Link>
        <div className="flex items-center gap-3">
          {tool.ownerName && (
            <span className="text-[12px] text-white/30 font-sans tracking-wide">
              by {tool.ownerName}
            </span>
          )}
          {/* Remix button */}
          <button
            onClick={handleRemix}
            disabled={isRemixing}
            className="flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-[12px] font-medium text-white/50 transition-colors hover:bg-white/[0.06] hover:text-white/70 disabled:opacity-50"
          >
            <Shuffle className="h-3 w-3" />
            {isRemixing ? 'Remixing...' : 'Remix this'}
          </button>
        </div>
      </header>

      {/* Tool — centered, frameless */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-6">
        <div className="w-full max-w-[480px]">
          {/* Tool surface */}
          <div className="rounded-2xl bg-[var(--bg-surface)] border border-white/[0.06] p-6 sm:p-8">
            {/* Tool title inside the card */}
            <div className="mb-5">
              <h1 className="font-display text-lg font-semibold text-white leading-tight">
                {tool.name}
              </h1>
              {tool.description && (
                <p className="text-sm text-white/50 mt-1 leading-relaxed">
                  {tool.description}
                </p>
              )}

              {/* Usage counter + space context + remix chain */}
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {usageCount > 0 && (
                  <span className="flex items-center gap-1 text-[11px] text-white/30">
                    <Users className="h-3 w-3" />
                    {usageCount} {usageCount === 1 ? 'person' : 'people'} participated
                  </span>
                )}
                {(tool.forkCount ?? 0) > 0 && (
                  <>
                    {usageCount > 0 && <span className="text-white/30 text-[11px]">·</span>}
                    <span className="flex items-center gap-1 text-[11px] text-[#FFD700]/50">
                      <Shuffle className="h-3 w-3" />
                      {tool.forkCount} {tool.forkCount === 1 ? 'remix' : 'remixes'}
                    </span>
                  </>
                )}
                {spaceName && (
                  <>
                    {(usageCount > 0 || (tool.forkCount ?? 0) > 0) && <span className="text-white/30 text-[11px]">·</span>}
                    <span className="text-[11px] text-white/30">
                      Built for {spaceName}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Tool canvas — shell tools or element-based tools */}
            {isShellTool && tool.shellFormat && tool.shellConfig ? (
              <LazyShellRenderer
                format={tool.shellFormat}
                shellId={toolId}
                config={tool.shellConfig}
                state={shellState.state}
                currentUserId={user?.uid || `anon:${getAnonId()}`}
                creatorId={tool.ownerId}
                isCreator={!!user && tool.ownerId === user.uid}
                onAction={handleShellAction}
                compact={false}
              />
            ) : tool.elements && tool.elements.length > 0 ? (
              <LazyToolCanvas
                elements={tool.elements}
                pages={tool.pages}
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
                <p className="text-white/50 text-sm mb-4">This app isn't ready yet — the creator is still working on it</p>
                {user && tool.ownerId === user.uid && (
                  <button
                    onClick={() => router.push(`/build/${toolId}`)}
                    className="px-4 py-2 text-sm font-semibold text-black bg-white rounded-full hover:bg-white/90 transition-colors"
                  >
                    Open in editor
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Creator impact banner — shows when creator views their own tool (from push notification) */}
          {user && tool.ownerId === user.uid && !showCreatedBanner && (
            <div className="mt-4 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[13px] text-white/50">
                  {isShellTool && shellState.state ? (
                    (() => {
                      const s = shellState.state;
                      const voteCount = 'votes' in s && s.votes ? Object.keys(s.votes).length : 0;
                      const attendeeCount = 'attendees' in s && s.attendees ? Object.keys(s.attendees).length : 0;
                      const total = voteCount + attendeeCount;
                      if (total > 0) {
                        return <span className="text-white/70 font-medium">{total} {total === 1 ? 'response' : 'responses'} so far</span>;
                      }
                      return <span>Waiting for responses...</span>;
                    })()
                  ) : usageCount > 0 ? (
                    <span className="text-white/70 font-medium">{usageCount} {usageCount === 1 ? 'person' : 'people'} used this</span>
                  ) : (
                    <span>Share the link to get responses</span>
                  )}
                </p>
              </div>
              <div className="flex gap-2">
                <Link
                  href="/build"
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#FFD700] text-black text-sm font-semibold rounded-full hover:bg-[#FFD700]/90 transition-colors"
                >
                  Make another
                </Link>
                <button
                  onClick={handleShare}
                  className="px-4 py-2.5 bg-white/[0.06] text-white/50 text-sm font-medium rounded-full border border-white/[0.06] hover:bg-white/[0.08] transition-colors"
                >
                  {copied ? 'Copied!' : 'Share'}
                </button>
              </div>
            </div>
          )}

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
                  className="flex-1 px-4 py-2.5 bg-white text-black text-sm font-semibold rounded-full hover:bg-white/90 transition-colors"
                >
                  {copied ? 'Copied!' : 'Share link'}
                </button>
                <button
                  onClick={() => router.push(`/build/${toolId}`)}
                  className="px-4 py-2.5 bg-white/[0.06] text-white/50 text-sm font-medium rounded-full border border-white/[0.06] hover:bg-white/[0.08] transition-colors"
                >
                  Edit
                </button>
              </div>
            </div>
          )}

          {/* Post-interaction CTA — appears after user engages (unauthenticated only) */}
          {hasInteracted && !user && (
            <div className="mt-6 text-center animate-in fade-in duration-300">
              <Link
                href="/enter"
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-white text-black text-sm font-semibold rounded-full hover:bg-white/90 transition-colors"
              >
                Create your own
              </Link>
            </div>
          )}
        </div>
      </main>

      {/* Sticky viral CTA bar — appears after first interaction for all users */}
      <div
        className={`fixed bottom-0 inset-x-0 z-40 transition-transform duration-200 ${
          hasInteracted ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="bg-surface border-t border-white/[0.05]">
          <div className="mx-auto max-w-[480px] flex items-center justify-between px-4 h-[56px]">
            <div className="flex items-center gap-2 min-w-0">
              {responseCount > 0 && (
                <span className="text-[13px] text-white/70 font-medium whitespace-nowrap">
                  {responseCount} {responseCount === 1 ? 'person' : 'people'}{' '}
                  {toolFormat === 'poll' ? 'voted' : toolFormat === 'rsvp' ? 'responded' : 'participated'}
                </span>
              )}
              <Link
                href="/"
                className="flex items-center gap-1.5 shrink-0"
              >
                <span
                  className="h-[5px] w-[5px] rounded-full bg-[#FFD700]"
                  style={{ animation: 'pulse-breathe 3s ease-in-out infinite' }}
                />
                <span className="text-[11px] font-display font-semibold tracking-[0.06em] text-[#FFD700]/70">
                  HIVE
                </span>
              </Link>
            </div>
            <Link
              href={user
                ? `/build?hint=${toolFormat}`
                : `/enter?redirect=${encodeURIComponent(`/build?hint=${toolFormat}`)}`
              }
              className="shrink-0 rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-black transition-opacity hover:opacity-90"
            >
              Make one for your org
            </Link>
          </div>
        </div>
      </div>

      {/* Non-blocking conversion banner for unauthenticated users — dismissed by sticky bar */}
      {showConvertBanner && !user && !hasInteracted && (
        <div className="fixed bottom-0 inset-x-0 z-40 animate-in slide-in-from-bottom duration-300">
          <div className="mx-auto max-w-[480px] px-4 pb-4">
            <div className="flex items-center gap-3 rounded-2xl border border-[#FFD700]/15 bg-surface/95 px-5 py-3.5">
              <div className="flex-1">
                <p className="text-[13px] font-medium text-white/70">Like this?</p>
                <p className="text-[11px] text-white/30">Create your own in seconds.</p>
              </div>
              <Link
                href="/enter"
                className="shrink-0 rounded-full bg-white px-4 py-2 text-[12px] font-medium text-black transition-opacity hover:opacity-90"
              >
                Create
              </Link>
              <button
                onClick={() => setShowConvertBanner(false)}
                className="shrink-0 rounded-full p-1.5 text-white/30 hover:text-white/50 transition-colors"
                aria-label="Dismiss"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Made with HIVE — acquisition surface */}
      <footer className={`pt-4 text-center space-y-2 ${hasInteracted ? 'pb-[72px]' : 'pb-8'}`}>
        {/* Response social proof */}
        {responseCount > 0 && (
          <p className="text-[11px] font-mono text-white/50">
            {responseCount} {responseCount === 1 ? 'person' : 'people'} {toolFormat === 'poll' ? 'voted' : toolFormat === 'rsvp' ? 'responded' : 'participated'}
          </p>
        )}

        <div className="flex items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 group"
          >
            <span
              className="h-[6px] w-[6px] rounded-full bg-[#FFD700]"
              style={{ animation: 'pulse-breathe 3s ease-in-out infinite' }}
            />
            <span className="font-display text-[11px] font-semibold tracking-[0.06em] text-white/50 group-hover:text-white/70 transition-colors">
              Made with HIVE{tool.campusId === 'ub' ? ' at UB' : ''}
            </span>
          </Link>
          <span className="text-white/30">·</span>
          <Link
            href={`/enter?redirect=${encodeURIComponent(`/build?hint=${toolFormat}`)}`}
            className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-white/70 hover:text-[#FFD700]/60 transition-colors"
          >
            {toolFormat === 'poll'
              ? 'Make a poll for your org'
              : toolFormat === 'rsvp'
                ? 'Create an RSVP for your next event'
                : toolFormat === 'bracket'
                  ? 'Run a bracket for your group'
                  : 'Create your own app'}
          </Link>
        </div>

        {/* Share button — always visible */}
        <button
          onClick={handleShare}
          className="text-[12px] text-white/30 hover:text-white/50 transition-colors"
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
