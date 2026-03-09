'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Mono } from '@hive/ui/design-system/primitives';
import { useAuth } from '@hive/auth-logic';
import ShellRenderer from '@/components/shells/ShellRenderer';
import { useShellState } from '@/hooks/useShellState';
import type { ShellFormat, ShellConfig, ShellAction } from '@/lib/shells/types';

/* ─── Types ─────────────────────────────────────────────────────── */

interface RecentTool {
  id: string;
  name: string;
  description: string;
  shellFormat: ShellFormat | null;
  shellConfig: ShellConfig;
  ownerId: string | null;
  ownerName: string | null;
  createdAt: string;
  spaceId: string | null;
  spaceName: string | null;
}

/* ─── Data fetching ─────────────────────────────────────────────── */

async function fetchRecentTools(): Promise<RecentTool[]> {
  const res = await fetch('/api/tools/recent?limit=10', { credentials: 'include' });
  if (!res.ok) return [];
  const payload = await res.json();
  const tools = payload?.data?.tools ?? [];
  // Only return tools with a native shell format
  return tools.filter(
    (t: RecentTool) => t.shellFormat && ['poll', 'bracket', 'rsvp'].includes(t.shellFormat)
  );
}

/* ─── Individual app card with its own shell state ──────────────── */

function AppCard({
  tool,
  userId,
  index,
}: {
  tool: RecentTool;
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
      className="rounded-2xl border border-white/[0.06] bg-[#080808] overflow-hidden"
    >
      <div className="p-4">
        {/* Header: title + creator */}
        <div className="mb-1">
          <h3 className="text-[15px] font-semibold text-white leading-snug">{tool.name}</h3>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-[12px] text-white/40">{creatorLabel}</span>
            {tool.spaceName && (
              <>
                <span className="text-[10px] text-white/20">in</span>
                <span className="text-[12px] text-white/50">{tool.spaceName}</span>
              </>
            )}
          </div>
        </div>

        {tool.description && (
          <p className="mt-1 mb-3 text-[13px] text-white/35 line-clamp-2 leading-relaxed">
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
              className="mt-3 pt-3 border-t border-white/[0.04]"
            >
              <div className="flex items-center gap-2 text-[13px]">
                <span className="text-white/40">
                  From{' '}
                  <span className="text-white/60 font-medium">{tool.spaceName}</span>
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
    queryKey: ['feed-new-apps'],
    queryFn: fetchRecentTools,
    staleTime: 60_000,
    enabled: !!user,
  });

  if (!user) return null;

  if (tools.length === 0) {
    return (
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Mono size="label" className="text-white/50">
            New Apps
          </Mono>
        </div>
        <p className="text-sm text-white/25 py-2">
          Nobody&apos;s made anything yet — be the first.{' '}
          <Link
            href="/build"
            className="text-white/40 hover:text-white/60 transition-colors underline underline-offset-2"
          >
            Make a poll or bracket
          </Link>{' '}
          and see what your campus thinks.
        </p>
      </section>
    );
  }

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <Mono size="label" className="text-white/50">
          New Apps
        </Mono>
      </div>

      <div className="space-y-3">
        {tools.map((tool, i) => (
          <AppCard key={tool.id} tool={tool} userId={user.uid} index={i} />
        ))}
      </div>

      <Link
        href="/build"
        className="flex items-center gap-1.5 mt-4 text-[13px] text-white/30 hover:text-white/50 transition-colors"
      >
        Make your own
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </section>
  );
}
