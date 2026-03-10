'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Mono } from '@hive/ui/design-system/primitives';
import { useAuth } from '@hive/auth-logic';
import ShellRenderer from '@/components/shells/ShellRenderer';
import { useShellState } from '@/hooks/useShellState';
import type { ShellFormat, ShellConfig, ShellAction } from '@/lib/shells/types';

/* ─── Types ─────────────────────────────────────────────────────── */

interface TrendingTool {
  id: string;
  name: string;
  description: string;
  shellFormat: ShellFormat | null;
  shellConfig: ShellConfig;
  ownerId: string | null;
  ownerName: string | null;
  ownerHandle: string | null;
  createdAt: string;
  spaceId: string | null;
  spaceName: string | null;
  spaceHandle: string | null;
}

/* ─── Discover API response shape ────────────────────────────────── */

interface DiscoverTool {
  id: string;
  title: string;
  description: string;
  type: string;
  shellFormat: string | null;
  shellConfig: Record<string, unknown> | null;
  category: string;
  creator: { id: string | null; name: string };
  spaceOrigin: { id: string | null; name: string | null; type: string | null };
  forkCount: number;
  useCount: number;
  createdAt: string;
  thumbnail: string | null;
}

/* ─── Data fetching ─────────────────────────────────────────────── */

async function fetchTrendingTools(): Promise<TrendingTool[]> {
  const res = await fetch('/api/tools/discover?sort=trending&limit=6', { credentials: 'include' });
  if (!res.ok) return [];
  const payload = await res.json();
  const tools: DiscoverTool[] = payload?.data?.tools ?? [];
  // Only return tools with a native shell format
  return tools
    .filter(
      (t) => t.shellFormat && ['poll', 'bracket', 'rsvp'].includes(t.shellFormat)
    )
    .map((t) => ({
      id: t.id,
      name: t.title,
      description: t.description,
      shellFormat: t.shellFormat as ShellFormat | null,
      shellConfig: t.shellConfig as ShellConfig,
      ownerId: t.creator.id,
      ownerName: t.creator.name || null,
      ownerHandle: null,
      createdAt: t.createdAt,
      spaceId: t.spaceOrigin.id,
      spaceName: t.spaceOrigin.name,
      spaceHandle: null,
    }));
}

/* ─── Individual app card with its own shell state ──────────────── */

function AppCard({
  tool,
  userId,
  index,
}: {
  tool: TrendingTool;
  userId: string;
  index: number;
}) {
  const { state, dispatch } = useShellState(tool.id);
  const [expanded, setExpanded] = useState(false);
  const [joinedSpaces, setJoinedSpaces] = useState<Set<string>>(new Set());
  const [hasInteracted, setHasInteracted] = useState(false);

  const handleAction = useCallback(
    (action: ShellAction) => {
      dispatch(action, userId);
      setHasInteracted(true);
    },
    [dispatch, userId]
  );

  const handleJoin = useCallback(
    async (spaceId: string) => {
      try {
        const res = await fetch('/api/spaces/join-v2', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ spaceId }),
        });
        if (res.ok) {
          setJoinedSpaces((prev) => new Set(prev).add(spaceId));
        }
      } catch {
        // Silent fail — not critical
      }
    },
    []
  );

  const creatorLabel =
    tool.ownerId === 'hive-system' ? 'Created by HIVE' : tool.ownerName || 'Anonymous';

  const showJoinPrompt =
    hasInteracted && tool.spaceId && tool.spaceName && !joinedSpaces.has(tool.spaceId);

  return (
    <div
      className="rounded-2xl border border-white/[0.05] bg-card overflow-hidden"
    >
      <div className="p-4">
        {/* Header: title + creator */}
        <div className="mb-1">
          <h3 className="text-[15px] font-semibold text-white leading-snug">{tool.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            {tool.ownerHandle && tool.ownerId !== 'hive-system' ? (
              <Link
                href={`/u/${tool.ownerHandle}`}
                className="text-[12px] text-white/50 hover:text-white/70 transition-colors"
              >
                {creatorLabel}
              </Link>
            ) : (
              <span className="text-[12px] text-white/50">{creatorLabel}</span>
            )}
            {tool.spaceName && (
              <>
                <span className="text-[11px] text-white/30">in</span>
                {tool.spaceHandle ? (
                  <Link
                    href={`/s/${tool.spaceHandle}`}
                    className="text-[12px] text-white/50 hover:text-white/70 transition-colors"
                  >
                    {tool.spaceName}
                  </Link>
                ) : (
                  <span className="text-[12px] text-white/50">{tool.spaceName}</span>
                )}
              </>
            )}
          </div>
        </div>

        {tool.description && (
          <p className="mt-1 mb-3 text-[13px] text-white/50 line-clamp-2 leading-relaxed">
            {tool.description}
          </p>
        )}

        {/* Inline shell — always visible in compact mode */}
        {tool.shellFormat && tool.shellConfig && (
          <div className="mt-3">
            <ShellRenderer
              format={tool.shellFormat}
              shellId={tool.id}
              config={tool.shellConfig}
              state={state}
              currentUserId={userId}
              creatorId={tool.ownerId || ''}
              isCreator={tool.ownerId === userId}
              onAction={handleAction}
              compact
            />
          </div>
        )}

        {/* Post-engagement join prompt */}
        <AnimatePresence>
          {showJoinPrompt && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-3 pt-3 border-t border-white/[0.05]"
            >
              <div className="flex items-center gap-2 text-[13px]">
                <span className="text-white/30">
                  From{' '}
                  <span className="text-white/50 font-medium">{tool.spaceName}</span>
                </span>
                <button
                  onClick={() => handleJoin(tool.spaceId!)}
                  className="text-[#FFD700]/70 hover:text-[#FFD700] font-medium transition-colors"
                >
                  Join
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ─── Section ───────────────────────────────────────────────────── */

export function NewAppsSection() {
  const { user } = useAuth();

  const { data: tools = [] } = useQuery({
    queryKey: ['feed-trending-apps'],
    queryFn: fetchTrendingTools,
    staleTime: 60_000,
    enabled: !!user,
  });

  if (!user) return null;

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <Mono size="label" className="text-white/50">
          TRENDING APPS
        </Mono>
      </div>

      {tools.length > 0 ? (
        <div className="space-y-3">
          {tools.map((tool, i) => (
            <AppCard key={tool.id} tool={tool} userId={user.uid} index={i} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-white/[0.05] bg-card p-5">
          <p className="text-[15px] text-white/70 mb-1">
            No one&apos;s made anything yet today.
          </p>
          <p className="text-[13px] text-white/30 mb-4">
            Be the first — polls, brackets, RSVPs. Takes 30 seconds.
          </p>
          <Link
            href="/build"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FFD700] text-black text-[13px] font-semibold hover:opacity-90 transition-opacity duration-100"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Make something
          </Link>
        </div>
      )}

      {tools.length > 0 && (
        <Link
          href="/build"
          className="flex items-center gap-2 mt-4 text-[13px] text-white/30 hover:text-white/50 transition-colors"
        >
          Make your own
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      )}
    </section>
  );
}
