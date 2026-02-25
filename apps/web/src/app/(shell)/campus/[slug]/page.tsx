'use client';

/**
 * Campus Tool Page — /campus/[slug]
 *
 * Renders a deployed campus tool with full interactivity.
 * Uses the same ToolCanvas + useToolRuntime pattern as /t/[toolId].
 */

import { useCallback, useRef, useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, Share2, Users, Check } from 'lucide-react';
import { MOTION, durationSeconds } from '@hive/tokens';
import { BrandSpinner } from '@hive/ui';
import { useAuth } from '@hive/auth-logic';
import { useToolRuntime } from '@/hooks/use-tool-runtime';
import { useAnalytics } from '@/hooks/use-analytics';

const EASE = MOTION.ease.premium;

const LazyToolCanvas = dynamic(
  () => import('@hive/ui').then((mod) => ({ default: mod.ToolCanvas })),
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

interface CampusToolData {
  id: string;
  toolId: string;
  slug: string;
  name: string;
  description?: string;
  category: string;
  badge: 'official' | 'community';
  weeklyUsers: number;
  creatorName?: string;
  creatorId?: string;
  deploymentId?: string;
  elements: Array<{
    elementId: string;
    instanceId: string;
    config: Record<string, unknown>;
    position?: { x: number; y: number };
    size?: { width: number; height: number };
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
    isStartPage?: boolean;
  }>;
  connections?: Array<{
    from: { instanceId: string; port: string };
    to: { instanceId: string; port: string };
  }>;
}

async function fetchCampusTool(slug: string): Promise<CampusToolData> {
  const response = await fetch(`/api/campus/tools/${slug}`, {
    credentials: 'include',
  });
  if (!response.ok) {
    if (response.status === 404) throw new Error('Tool not found');
    throw new Error('Failed to load tool');
  }
  const result = await response.json();
  return result.data || result;
}

export default function CampusToolPage() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();
  const { user } = useAuth();
  const { track } = useAnalytics();
  const [copied, setCopied] = useState(false);
  const interactionRef = useRef(false);

  const {
    data: tool,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['campus-tool', slug],
    queryFn: () => fetchCampusTool(slug),
    staleTime: 60000,
    retry: (failureCount, err) => {
      if (err instanceof Error && err.message.includes('not found')) return false;
      return failureCount < 2;
    },
  });

  const toolId = tool?.toolId || tool?.id || '';
  const deploymentId = tool?.deploymentId;

  const runtime = useToolRuntime({
    toolId,
    deploymentId,
    enabled: !!tool && !!toolId,
    autoSave: true,
    autoSaveDelay: 1500,
    enableRealtime: true,
  });

  const hasTrackedView = useRef(false);
  useEffect(() => {
    if (tool && !hasTrackedView.current) {
      hasTrackedView.current = true;
      track('campus_tool_viewed', { slug, toolId: tool.id });
    }
  }, [tool, slug, track]);

  const handleElementChange = useCallback(
    (instanceId: string, data: unknown) => {
      runtime.updateState({ [instanceId]: data });
      if (!interactionRef.current) {
        interactionRef.current = true;
        track('campus_tool_interacted', { slug, toolId });
      }
    },
    [runtime, slug, toolId, track]
  );

  const handleElementAction = useCallback(
    (instanceId: string, action: string, payload: unknown) => {
      runtime.executeAction(instanceId, action, payload as Record<string, unknown>);
      if (!interactionRef.current) {
        interactionRef.current = true;
        track('campus_tool_interacted', { slug, toolId, action });
      }
    },
    [runtime, slug, toolId, track]
  );

  const handleShare = useCallback(async () => {
    const url = `${window.location.origin}/campus/${slug}`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: tool?.name || 'Campus Tool', url });
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [slug, tool?.name]);

  // Loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <BrandSpinner size="md" variant="gold" />
      </div>
    );
  }

  // Not found
  if (error || !tool) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE }}
          className="text-center max-w-sm"
        >
          <h2 className="text-xl font-semibold text-white mb-2">Not Found</h2>
          <p className="text-white/50 text-sm mb-6">
            This campus tool may have been removed or the link is incorrect.
          </p>
          <button
            onClick={() => router.push('/campus')}
            className="px-6 py-2.5 bg-white text-black text-sm font-medium rounded-full hover:bg-white/90 transition-colors"
          >
            Browse Campus Tools
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-[560px] mx-auto px-6 py-6">
        {/* Navigation + share */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: durationSeconds.quick, ease: EASE }}
          className="flex items-center justify-between mb-6"
        >
          <Link
            href="/campus"
            className="flex items-center gap-1.5 text-white/35 hover:text-white/60 transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Campus
          </Link>
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white/30 hover:text-white/55 hover:bg-white/[0.04] transition-all text-sm"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Share'}
          </button>
        </motion.div>

        {/* Tool header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: durationSeconds.standard, delay: 0.05, ease: EASE }}
          className="mb-6"
        >
          <div className="flex items-start justify-between gap-3 mb-2">
            <h1 className="text-lg font-semibold text-white leading-tight">
              {tool.name}
            </h1>
            <span
              className={`
                shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider
                ${tool.badge === 'official'
                  ? 'bg-[#FFD700]/15 text-[#FFD700]'
                  : 'bg-white/[0.06] text-white/35'
                }
              `}
            >
              {tool.badge === 'official' ? 'Official' : 'Community'}
            </span>
          </div>

          {tool.description && (
            <p className="text-sm text-white/45 leading-relaxed mb-3">
              {tool.description}
            </p>
          )}

          <div className="flex items-center gap-3 text-[12px] text-white/25">
            <span className="inline-flex px-2 py-0.5 rounded-full bg-[#FFD700]/[0.06] text-[#FFD700]/70 text-[11px]">
              {tool.category}
            </span>
            {tool.weeklyUsers > 0 && (
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {tool.weeklyUsers} this week
              </span>
            )}
            {tool.creatorName && (
              <span>by {tool.creatorName}</span>
            )}
          </div>
        </motion.div>

        {/* Tool surface */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: durationSeconds.standard, delay: 0.1, ease: EASE }}
          className="rounded-2xl bg-[#080808] border border-white/[0.06] p-6 sm:p-8"
        >
          {tool.elements && tool.elements.length > 0 ? (
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
              <p className="text-white/40 text-sm">This tool has no elements yet.</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
