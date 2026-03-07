'use client';

/**
 * ShellRenderer — Resolves format → shell component and renders it.
 *
 * Handles loading/error states. Used by stream cards and standalone views.
 */

import { Suspense, lazy, useMemo } from 'react';
import { CARD } from '@hive/tokens';
import { isNativeFormat } from '@/lib/shells';
import type { ShellFormat, ShellConfig, ShellAction, PollConfig, PollState, BracketConfig, BracketState, RSVPConfig, RSVPState } from '@/lib/shells/types';
import type { ShellState } from '@/lib/shells/types';

// Lazy-load shell components
const PollCard = lazy(() => import('./PollCard'));
const BracketCard = lazy(() => import('./BracketCard'));
const RSVPCard = lazy(() => import('./RSVPCard'));

// ============================================================================
// TYPES
// ============================================================================

export interface ShellRendererProps {
  format: ShellFormat;
  shellId: string;
  config: ShellConfig;
  state: ShellState | null;
  currentUserId: string;
  creatorId: string;
  isCreator: boolean;
  onAction: (action: ShellAction) => void;
  compact?: boolean;
}

// ============================================================================
// LOADING SKELETON
// ============================================================================

function ShellSkeleton() {
  return (
    <div className={`${CARD.default} p-4 max-w-sm animate-pulse`}>
      <div className="h-4 bg-white/[0.04] rounded w-3/4 mb-3" />
      <div className="space-y-2">
        <div className="h-10 bg-white/[0.03] rounded-xl" />
        <div className="h-10 bg-white/[0.03] rounded-xl" />
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function ShellRenderer({
  format,
  shellId,
  config,
  state,
  currentUserId,
  creatorId,
  isCreator,
  onAction,
  compact = true,
}: ShellRendererProps) {
  if (!isNativeFormat(format)) {
    return null;
  }

  const shared = { shellId, currentUserId, creatorId, isCreator, onAction, compact };

  return (
    <Suspense fallback={<ShellSkeleton />}>
      {format === 'poll' && <PollCard {...shared} config={config as PollConfig} state={state as PollState | null} />}
      {format === 'bracket' && <BracketCard {...shared} config={config as BracketConfig} state={state as BracketState | null} />}
      {format === 'rsvp' && <RSVPCard {...shared} config={config as RSVPConfig} state={state as RSVPState | null} />}
    </Suspense>
  );
}
