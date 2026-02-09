'use client';

/**
 * LeaderDashboard - At-a-glance panel for space leaders
 *
 * Shows:
 * - Key metrics (engagement, growth, active members)
 * - Pending actions (tool approvals, claims, reports)
 * - Quick actions (create event, add tool, settings)
 *
 * Replaces need for separate admin tab — everything in one panel.
 *
 * @version 1.0.0 - Phase 1 New Build (Feb 2026)
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Users,
  MessageSquare,
  Calendar,
  AlertCircle,
  Wrench,
  Settings,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Text } from '@hive/ui/design-system/primitives';
import { MOTION, durationSeconds } from '@hive/tokens';

// ============================================================
// Types
// ============================================================

interface SpaceMetrics {
  memberCount: number;
  memberGrowth: number; // percentage change
  activeMembers: number;
  messagesThisWeek: number;
  messageGrowth: number;
  upcomingEvents: number;
}

interface PendingItem {
  id: string;
  type: 'tool' | 'claim' | 'report' | 'event';
  title: string;
  description?: string;
  timestamp: string;
  urgent?: boolean;
}

interface LeaderDashboardProps {
  spaceId: string;
  metrics?: SpaceMetrics;
  pendingItems?: PendingItem[];
  isLoading?: boolean;
  onCreateEvent?: () => void;
  onAddTool?: () => void;
  onOpenSettings?: () => void;
  onViewPending?: (item: PendingItem) => void;
  className?: string;
}

// ============================================================
// Metric Card
// ============================================================

interface MetricCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  growth?: number;
  color?: string;
}

function MetricCard({ icon: Icon, label, value, growth, color = 'text-white/50' }: MetricCardProps) {
  const hasGrowth = growth !== undefined && growth !== 0;
  const isPositive = growth && growth > 0;

  return (
    <div
      className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] transition-colors"
    >
      <div className="flex items-start justify-between mb-2">
        <Icon className={cn('w-5 h-5', color)} />
        {hasGrowth && (
          <div className={cn(
            'flex items-center gap-1 text-xs font-medium',
            isPositive ? 'text-green-400' : 'text-red-400'
          )}>
            <TrendingUp className={cn('w-3 h-3', !isPositive && 'rotate-180')} />
            <span>{Math.abs(growth!)}%</span>
          </div>
        )}
      </div>
      <div className="text-2xl font-semibold text-white mb-1">
        {value}
      </div>
      <Text size="xs" tone="muted">
        {label}
      </Text>
    </div>
  );
}

// ============================================================
// Pending Item
// ============================================================

interface PendingItemRowProps {
  item: PendingItem;
  onClick: () => void;
}

function PendingItemRow({ item, onClick }: PendingItemRowProps) {
  const getIcon = () => {
    switch (item.type) {
      case 'tool': return Wrench;
      case 'claim': return Users;
      case 'report': return AlertCircle;
      case 'event': return Calendar;
    }
  };

  const Icon = getIcon();

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full px-3 py-2.5 rounded-lg',
        'flex items-center gap-3',
        'hover:bg-white/[0.04] transition-colors',
        'text-left group'
      )}
    >
      <div className={cn(
        'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
        'bg-white/[0.06]',
        item.urgent && 'bg-amber-500/20'
      )}>
        <Icon className={cn(
          'w-4 h-4',
          item.urgent ? 'text-amber-400' : 'text-white/50'
        )} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <Text size="sm" weight="medium" className="text-white truncate">
            {item.title}
          </Text>
          {item.urgent && (
            <span className="text-xs text-amber-400 font-medium">Urgent</span>
          )}
        </div>
        {item.description && (
          <Text size="xs" tone="muted" className="truncate">
            {item.description}
          </Text>
        )}
      </div>

      <ChevronRight className="w-4 h-4 text-white/50 group-hover:text-white transition-colors flex-shrink-0" />
    </button>
  );
}

// ============================================================
// Quick Action
// ============================================================

interface QuickActionProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}

function QuickAction({ icon: Icon, label, onClick }: QuickActionProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'p-3 rounded-lg',
        'flex items-center gap-3',
        'bg-white/[0.02] border border-white/[0.06]',
        'hover:bg-white/[0.04] hover:border-white/[0.12]',
        'transition-colors'
      )}
    >
      <Icon className="w-5 h-5 text-white/50" />
      <Text size="sm" weight="medium">
        {label}
      </Text>
    </button>
  );
}

// ============================================================
// Main Component
// ============================================================

export function LeaderDashboard({
  spaceId: _spaceId,
  metrics,
  pendingItems = [],
  isLoading = false,
  onCreateEvent,
  onAddTool,
  onOpenSettings,
  onViewPending,
  className,
}: LeaderDashboardProps) {
  if (isLoading) {
    return (
      <div className={cn('p-6 space-y-6', className)}>
        {/* Loading skeleton */}
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-white/[0.02] rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  const hasPending = pendingItems.length > 0;

  return (
    <motion.div
      className={cn('p-6 space-y-6', className)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: durationSeconds.gentle, ease: MOTION.ease.premium }}
    >
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-1">
          Leader Dashboard
        </h2>
        <Text size="sm" tone="muted">
          Overview and quick actions for this space
        </Text>
      </div>

      {/* Metrics Grid */}
      {metrics && (
        <div className="grid grid-cols-2 gap-3">
          <MetricCard
            icon={Users}
            label="Members"
            value={metrics.memberCount}
            growth={metrics.memberGrowth}
            color="text-blue-400"
          />
          <MetricCard
            icon={MessageSquare}
            label="Messages this week"
            value={metrics.messagesThisWeek}
            growth={metrics.messageGrowth}
            color="text-green-400"
          />
          <MetricCard
            icon={CheckCircle2}
            label="Active members"
            value={metrics.activeMembers}
            color="text-purple-400"
          />
          <MetricCard
            icon={Calendar}
            label="Upcoming events"
            value={metrics.upcomingEvents}
            color="text-amber-400"
          />
        </div>
      )}

      {/* Pending Items */}
      {hasPending && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-white">
              Pending Actions
            </h3>
            <span className="text-xs text-amber-400 font-medium">
              {pendingItems.length} item{pendingItems.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="space-y-1 p-2 rounded-lg bg-white/[0.02] border border-white/[0.06]">
            {pendingItems.slice(0, 3).map((item) => (
              <PendingItemRow
                key={item.id}
                item={item}
                onClick={() => onViewPending?.(item)}
              />
            ))}
            {pendingItems.length > 3 && (
              <button
                className="w-full py-2 text-xs text-white/40 hover:text-white/60 transition-colors"
              >
                View all {pendingItems.length} items
              </button>
            )}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h3 className="text-sm font-medium text-white mb-3">
          Quick Actions
        </h3>
        <div className="space-y-2">
          {onCreateEvent && (
            <QuickAction
              icon={Calendar}
              label="Create Event"
              onClick={onCreateEvent}
            />
          )}
          {onAddTool && (
            <QuickAction
              icon={Wrench}
              label="Add Tool"
              onClick={onAddTool}
            />
          )}
          {onOpenSettings && (
            <QuickAction
              icon={Settings}
              label="Space Settings"
              onClick={onOpenSettings}
            />
          )}
        </div>
      </div>
    </motion.div>
  );
}

LeaderDashboard.displayName = 'LeaderDashboard';

export default LeaderDashboard;
