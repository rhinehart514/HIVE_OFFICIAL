'use client';

/**
 * Standalone Tool Client Component
 *
 * Interactive client component for standalone tool pages.
 * Handles state, runtime, and user interactions.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@hive/auth-logic';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { MOTION } from '@hive/ui/design-system/primitives';
import { ToolCanvas, Skeleton, SimpleAvatar, getInitials } from '@hive/ui';
import { useToolRuntime } from '@/hooks/use-tool-runtime';
import { ShareButton } from '@/components/share/ShareButton';

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

// Fetch tool data - works without auth for public tools
async function fetchTool(toolId: string): Promise<ToolData> {
  const response = await fetch(`/api/tools/${toolId}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Tool not found');
    }
    if (response.status === 403) {
      throw new Error('This tool is private');
    }
    throw new Error('Failed to load tool');
  }

  const result = await response.json();
  return result.data || result;
}

export function StandaloneToolClient({ toolId, baseUrl }: { toolId: string; baseUrl: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  // Fetch tool data
  const {
    data: tool,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['tool', toolId],
    queryFn: () => fetchTool(toolId),
    staleTime: 60000,
    retry: (failureCount, error) => {
      // Don't retry on 403/404
      if (error instanceof Error && (error.message.includes('private') || error.message.includes('not found'))) {
        return false;
      }
      return failureCount < 2;
    },
  });

  // Runtime hook for tool state and actions
  const runtime = useToolRuntime({
    toolId,
    enabled: !!tool,
    autoSave: true,
    autoSaveDelay: 1500,
    enableRealtime: true, // Enable real-time for standalone tools
  });

  // Track view
  useEffect(() => {
    if (tool && tool.ownerId !== user?.uid) {
      // View tracking is handled by the GET endpoint
    }
  }, [tool, user]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-ground)] flex items-center justify-center p-4">
        <div className="w-full max-w-4xl space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-full max-w-md" />
          <div className="mt-8 bg-[var(--bg-surface)] rounded-2xl p-8 border border-white/[0.06]">
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  // Error state - private tool
  if (error instanceof Error && error.message.includes('private')) {
    return (
      <div className="min-h-screen bg-[var(--bg-ground)] flex items-center justify-center p-4">
        <motion.div
          className="bg-[var(--bg-surface)] rounded-2xl p-8 max-w-md w-full text-center border border-white/[0.06]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: MOTION.duration.base, ease: MOTION.ease.premium }}
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--life-gold)]/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-[var(--life-gold)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">
            Private Tool
          </h2>
          <p className="text-white/60 mb-6">
            This tool is private. Sign in to view it if you have access.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.push('/enter')}
              className="px-4 py-2 bg-[var(--life-gold)] text-black rounded-lg font-medium hover:bg-[var(--life-gold)]/90 transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => router.push('/discover')}
              className="px-4 py-2 bg-white/[0.06] text-white rounded-lg font-medium hover:bg-white/[0.08] transition-colors"
            >
              Explore Tools
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Error state - not found or other
  if (error || !tool) {
    return (
      <div className="min-h-screen bg-[var(--bg-ground)] flex items-center justify-center p-4">
        <motion.div
          className="bg-[var(--bg-surface)] rounded-2xl p-8 max-w-md w-full text-center border border-white/[0.06]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: MOTION.duration.base, ease: MOTION.ease.premium }}
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-500/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">
            Tool Not Found
          </h2>
          <p className="text-white/60 mb-6">
            This tool may have been deleted or the link is incorrect.
          </p>
          <button
            onClick={() => router.push('/discover')}
            className="px-4 py-2 bg-[var(--life-gold)] text-black rounded-lg font-medium hover:bg-[var(--life-gold)]/90 transition-colors"
          >
            Explore Tools
          </button>
        </motion.div>
      </div>
    );
  }

  const toolUrl = `${baseUrl}/t/${toolId}`;

  return (
    <div className="min-h-screen bg-[var(--bg-ground)]">
      {/* Header - minimal chrome */}
      <header className="border-b border-white/[0.06] bg-[var(--bg-ground)]/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          {/* Logo/Back */}
          <button
            onClick={() => router.push('/discover')}
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="text-sm font-medium hidden sm:inline">Back</span>
          </button>

          {/* Builder attribution */}
          <div className="flex items-center gap-2 min-w-0 flex-1 justify-center sm:justify-start">
            <SimpleAvatar
              src={tool.ownerAvatar}
              alt={tool.ownerName || 'Builder'}
              fallback={getInitials(tool.ownerName || 'Builder')}
              size="sm"
              className="shrink-0"
            />
            <div className="min-w-0">
              <div className="text-sm font-medium text-white truncate">
                {tool.ownerName || 'Anonymous'}
              </div>
              {tool.campusName && (
                <div className="text-xs text-white/50 truncate">
                  {tool.campusName}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <ShareButton
              url={toolUrl}
              title={tool.name}
              description={tool.description}
            />
            {!user && (
              <button
                onClick={() => router.push('/enter')}
                className="px-3 py-1.5 text-sm font-medium bg-white/[0.06] text-white rounded-lg hover:bg-white/[0.08] transition-colors"
              >
                Sign In
              </button>
            )}
            {user && tool.ownerId === user.uid && (
              <button
                onClick={() => router.push(`/lab/${toolId}`)}
                className="px-3 py-1.5 text-sm font-medium bg-[var(--life-gold)] text-black rounded-lg hover:bg-[var(--life-gold)]/90 transition-colors"
              >
                Edit
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: MOTION.duration.base, ease: MOTION.ease.premium }}
        >
          {/* Tool header */}
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-semibold text-white mb-2">
              {tool.name}
            </h1>
            {tool.description && (
              <p className="text-white/60 text-base md:text-lg">
                {tool.description}
              </p>
            )}
          </div>

          {/* Tool canvas */}
          <div className="bg-[var(--bg-surface)] rounded-2xl p-6 md:p-8 border border-white/[0.06]">
            {tool.elements.length > 0 ? (
              <ToolCanvas
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
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/[0.04] flex items-center justify-center">
                  <svg className="w-8 h-8 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <p className="text-white/50">
                  This tool has no elements yet
                </p>
              </div>
            )}
          </div>

          {/* Footer attribution */}
          <div className="mt-6 flex items-center justify-between text-sm text-white/40">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span>{tool.viewCount || 0} views</span>
            </div>
            <div>
              Built with{' '}
              <Link
                href="/"
                className="text-[var(--life-gold)] hover:underline"
              >
                HIVE
              </Link>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Login prompt for anonymous users */}
      {!user && showLoginPrompt && (
        <motion.div
          className="fixed bottom-4 right-4 bg-[var(--bg-surface)] rounded-2xl p-4 shadow-lg border border-white/[0.06] max-w-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: MOTION.duration.fast, ease: MOTION.ease.premium }}
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--life-gold)]/10 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-[var(--life-gold)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white mb-1">
                Create your own tools
              </p>
              <p className="text-xs text-white/60 mb-3">
                Sign in to build and share tools with your campus
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => router.push('/enter')}
                  className="px-3 py-1.5 text-xs font-medium bg-[var(--life-gold)] text-black rounded-lg hover:bg-[var(--life-gold)]/90 transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => setShowLoginPrompt(false)}
                  className="px-3 py-1.5 text-xs font-medium text-white/60 hover:text-white transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
