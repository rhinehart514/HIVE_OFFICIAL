'use client';

/**
 * AutomationLogsViewer - View recent automation run history
 *
 * Sprint 4: Automations
 *
 * Displays a log of recent automation runs with:
 * - Status (success, skipped, failed)
 * - Trigger information
 * - Duration
 * - Error details for failures
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XMarkIcon,
  CheckCircleIcon,
  XCircleIcon,
  MinusCircleIcon,
  ClockIcon,
  BoltIcon,
  ChartBarIcon,
  ChevronDownIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { cn } from '../../../lib/utils';

// HiveLab Dark Panel Colors
const PANEL_COLORS = {
  bg: 'var(--hivelab-panel, #1A1A1A)',
  bgHover: 'var(--hivelab-surface-hover, #1A1A1A)',
  bgActive: 'var(--hivelab-surface, #141414)',
  border: 'var(--hivelab-border, rgba(255, 255, 255, 0.08))',
  textPrimary: 'var(--hivelab-text-primary, #FAF9F7)',
  textSecondary: 'var(--hivelab-text-secondary, #8A8A8A)',
  textTertiary: 'var(--hivelab-text-tertiary, #5A5A5A)',
  accent: 'var(--life-gold, #D4AF37)',
  accentLight: 'rgba(212, 175, 55, 0.1)',
  error: 'var(--hivelab-status-error)',
  errorLight: 'var(--hivelab-status-error-muted)',
  success: 'var(--hivelab-status-success)',
  successLight: 'var(--hivelab-status-success-muted)',
  warning: 'var(--hivelab-status-warning)',
  warningLight: 'var(--hivelab-status-warning-muted)',
};

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--hivelab-panel)]';

// ============================================================================
// Types
// ============================================================================

export interface AutomationRun {
  id: string;
  automationId: string;
  timestamp: string;
  status: 'success' | 'skipped' | 'failed';
  triggerType: 'event' | 'schedule' | 'threshold';
  triggerData?: Record<string, unknown>;
  conditionResults?: Array<{
    field: string;
    operator: string;
    expected: unknown;
    actual: unknown;
    met: boolean;
  }>;
  actionsExecuted: string[];
  error?: string;
  duration: number;
}

interface AutomationLogsViewerProps {
  isOpen: boolean;
  onClose: () => void;
  automationName: string;
  runs: AutomationRun[];
  loading?: boolean;
  onRefresh?: () => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

// ============================================================================
// Status Components
// ============================================================================

function StatusIcon({ status }: { status: 'success' | 'skipped' | 'failed' }) {
  switch (status) {
    case 'success':
      return <CheckCircleIcon className="h-4 w-4" style={{ color: PANEL_COLORS.success }} />;
    case 'skipped':
      return <MinusCircleIcon className="h-4 w-4" style={{ color: PANEL_COLORS.warning }} />;
    case 'failed':
      return <XCircleIcon className="h-4 w-4" style={{ color: PANEL_COLORS.error }} />;
  }
}

function StatusBadge({ status }: { status: 'success' | 'skipped' | 'failed' }) {
  const styles = {
    success: { bg: PANEL_COLORS.successLight, color: PANEL_COLORS.success },
    skipped: { bg: PANEL_COLORS.warningLight, color: PANEL_COLORS.warning },
    failed: { bg: PANEL_COLORS.errorLight, color: PANEL_COLORS.error },
  };

  const labels = {
    success: 'Success',
    skipped: 'Skipped',
    failed: 'Failed',
  };

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-label-xs font-medium uppercase tracking-wider"
      style={{ backgroundColor: styles[status].bg, color: styles[status].color }}
    >
      {labels[status]}
    </span>
  );
}

function TriggerIcon({ type }: { type: 'event' | 'schedule' | 'threshold' }) {
  switch (type) {
    case 'event':
      return <BoltIcon className="h-3.5 w-3.5" />;
    case 'schedule':
      return <ClockIcon className="h-3.5 w-3.5" />;
    case 'threshold':
      return <ChartBarIcon className="h-3.5 w-3.5" />;
  }
}

// ============================================================================
// Log Entry Component
// ============================================================================

function LogEntry({ run }: { run: AutomationRun }) {
  const [expanded, setExpanded] = useState(false);

  const formatTime = (iso: string) => {
    const date = new Date(iso);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (isToday) {
      return time;
    }

    const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    return `${dateStr} ${time}`;
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg overflow-hidden"
      style={{
        backgroundColor: PANEL_COLORS.bgActive,
        border: `1px solid ${PANEL_COLORS.border}`,
      }}
    >
      {/* Main Row */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className={cn('w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors', focusRing)}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = PANEL_COLORS.bgHover;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        {/* Status */}
        <StatusIcon status={run.status} />

        {/* Trigger Type */}
        <div
          className="flex items-center justify-center w-6 h-6 rounded"
          style={{ backgroundColor: PANEL_COLORS.bg, color: PANEL_COLORS.textSecondary }}
        >
          <TriggerIcon type={run.triggerType} />
        </div>

        {/* Time */}
        <span className="text-xs font-medium" style={{ color: PANEL_COLORS.textPrimary }}>
          {formatTime(run.timestamp)}
        </span>

        {/* Actions count */}
        <span className="text-xs" style={{ color: PANEL_COLORS.textTertiary }}>
          {run.actionsExecuted.length} action{run.actionsExecuted.length !== 1 ? 's' : ''}
        </span>

        {/* Duration */}
        <span className="text-xs" style={{ color: PANEL_COLORS.textTertiary }}>
          {formatDuration(run.duration)}
        </span>

        <div className="flex-1" />

        {/* Status Badge */}
        <StatusBadge status={run.status} />

        {/* Expand Arrow */}
        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          style={{ color: PANEL_COLORS.textTertiary }}
        >
          <ChevronDownIcon className="h-4 w-4" />
        </motion.div>
      </button>

      {/* Expanded Details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div
              className="px-3 py-3 space-y-3"
              style={{ borderTop: `1px solid ${PANEL_COLORS.border}` }}
            >
              {/* Trigger Data */}
              {run.triggerData && Object.keys(run.triggerData).length > 0 && (
                <div>
                  <span className="text-label-xs uppercase tracking-wider font-medium" style={{ color: PANEL_COLORS.textTertiary }}>
                    Trigger Data
                  </span>
                  <pre
                    className="mt-1 p-2 rounded text-label-xs font-mono overflow-x-auto"
                    style={{ backgroundColor: PANEL_COLORS.bg, color: PANEL_COLORS.textSecondary }}
                  >
                    {JSON.stringify(run.triggerData, null, 2)}
                  </pre>
                </div>
              )}

              {/* Condition Results */}
              {run.conditionResults && run.conditionResults.length > 0 && (
                <div>
                  <span className="text-label-xs uppercase tracking-wider font-medium" style={{ color: PANEL_COLORS.textTertiary }}>
                    Conditions
                  </span>
                  <div className="mt-1 space-y-1">
                    {run.conditionResults.map((result, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 px-2 py-1.5 rounded text-xs"
                        style={{ backgroundColor: PANEL_COLORS.bg }}
                      >
                        {result.met ? (
                          <CheckCircleIcon className="h-3.5 w-3.5" style={{ color: PANEL_COLORS.success }} />
                        ) : (
                          <XCircleIcon className="h-3.5 w-3.5" style={{ color: PANEL_COLORS.error }} />
                        )}
                        <span style={{ color: PANEL_COLORS.textSecondary }}>
                          {result.field} {result.operator} {String(result.expected)}
                        </span>
                        <span style={{ color: PANEL_COLORS.textTertiary }}>
                          (actual: {String(result.actual)})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions Executed */}
              {run.actionsExecuted.length > 0 && (
                <div>
                  <span className="text-label-xs uppercase tracking-wider font-medium" style={{ color: PANEL_COLORS.textTertiary }}>
                    Actions Executed
                  </span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {run.actionsExecuted.map((action, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded text-label-xs font-medium"
                        style={{ backgroundColor: PANEL_COLORS.accentLight, color: PANEL_COLORS.accent }}
                      >
                        {action}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Error */}
              {run.error && (
                <div>
                  <span className="text-label-xs uppercase tracking-wider font-medium" style={{ color: PANEL_COLORS.error }}>
                    Error
                  </span>
                  <div
                    className="mt-1 p-2 rounded text-xs"
                    style={{ backgroundColor: PANEL_COLORS.errorLight, color: PANEL_COLORS.error }}
                  >
                    {run.error}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function AutomationLogsViewer({
  isOpen,
  onClose,
  automationName,
  runs,
  loading = false,
  onRefresh,
  onLoadMore,
  hasMore = false,
}: AutomationLogsViewerProps) {
  // Stats
  const stats = {
    total: runs.length,
    success: runs.filter((r) => r.status === 'success').length,
    skipped: runs.filter((r) => r.status === 'skipped').length,
    failed: runs.filter((r) => r.status === 'failed').length,
    avgDuration:
      runs.length > 0
        ? Math.round(runs.reduce((sum, r) => sum + r.duration, 0) / runs.length)
        : 0,
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="fixed inset-4 z-50 flex items-center justify-center pointer-events-none"
          >
            <div
              className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl shadow-2xl pointer-events-auto overflow-hidden"
              style={{
                backgroundColor: PANEL_COLORS.bg,
                border: `1px solid ${PANEL_COLORS.border}`,
              }}
            >
              {/* Header */}
              <div
                className="flex items-center justify-between px-5 py-4"
                style={{ borderBottom: `1px solid ${PANEL_COLORS.border}` }}
              >
                <div>
                  <h2 className="text-lg font-semibold" style={{ color: PANEL_COLORS.textPrimary }}>
                    {automationName}
                  </h2>
                  <p className="text-xs mt-0.5" style={{ color: PANEL_COLORS.textTertiary }}>
                    Run history
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {onRefresh && (
                    <button
                      type="button"
                      onClick={onRefresh}
                      className={cn('p-2 rounded-lg transition-colors', focusRing)}
                      style={{ color: PANEL_COLORS.textSecondary }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = PANEL_COLORS.bgHover;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <ArrowPathIcon className={cn('h-4 w-4', loading && 'animate-spin')} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={onClose}
                    className={cn('p-2 rounded-lg transition-colors', focusRing)}
                    style={{ color: PANEL_COLORS.textSecondary }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = PANEL_COLORS.bgHover;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Stats Bar */}
              <div
                className="grid grid-cols-5 gap-px px-5 py-3"
                style={{ backgroundColor: PANEL_COLORS.bgActive, borderBottom: `1px solid ${PANEL_COLORS.border}` }}
              >
                <div className="text-center">
                  <div className="text-lg font-semibold" style={{ color: PANEL_COLORS.textPrimary }}>
                    {stats.total}
                  </div>
                  <div className="text-label-xs uppercase tracking-wider" style={{ color: PANEL_COLORS.textTertiary }}>
                    Total
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold" style={{ color: PANEL_COLORS.success }}>
                    {stats.success}
                  </div>
                  <div className="text-label-xs uppercase tracking-wider" style={{ color: PANEL_COLORS.textTertiary }}>
                    Success
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold" style={{ color: PANEL_COLORS.warning }}>
                    {stats.skipped}
                  </div>
                  <div className="text-label-xs uppercase tracking-wider" style={{ color: PANEL_COLORS.textTertiary }}>
                    Skipped
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold" style={{ color: PANEL_COLORS.error }}>
                    {stats.failed}
                  </div>
                  <div className="text-label-xs uppercase tracking-wider" style={{ color: PANEL_COLORS.textTertiary }}>
                    Failed
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold" style={{ color: PANEL_COLORS.textPrimary }}>
                    {stats.avgDuration}
                    <span className="text-xs font-normal" style={{ color: PANEL_COLORS.textTertiary }}>ms</span>
                  </div>
                  <div className="text-label-xs uppercase tracking-wider" style={{ color: PANEL_COLORS.textTertiary }}>
                    Avg Time
                  </div>
                </div>
              </div>

              {/* Logs List */}
              <div className="flex-1 overflow-y-auto p-4">
                {loading && runs.length === 0 ? (
                  <div className="flex items-center justify-center py-12">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-6 h-6 border-2 border-t-transparent rounded-full"
                      style={{ borderColor: PANEL_COLORS.accent, borderTopColor: 'transparent' }}
                    />
                  </div>
                ) : runs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <ClockIcon className="h-10 w-10 mb-3" style={{ color: PANEL_COLORS.textTertiary }} />
                    <h3 className="text-sm font-medium mb-1" style={{ color: PANEL_COLORS.textPrimary }}>
                      No runs yet
                    </h3>
                    <p className="text-xs" style={{ color: PANEL_COLORS.textTertiary }}>
                      This automation hasn't been triggered yet.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {runs.map((run) => (
                      <LogEntry key={run.id} run={run} />
                    ))}

                    {/* Load More */}
                    {hasMore && onLoadMore && (
                      <button
                        type="button"
                        onClick={onLoadMore}
                        disabled={loading}
                        className={cn(
                          'w-full py-2.5 rounded-lg text-xs font-medium transition-colors',
                          loading && 'opacity-50',
                          focusRing
                        )}
                        style={{
                          backgroundColor: PANEL_COLORS.bgActive,
                          color: PANEL_COLORS.textSecondary,
                          border: `1px solid ${PANEL_COLORS.border}`,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = PANEL_COLORS.textPrimary;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = PANEL_COLORS.textSecondary;
                        }}
                      >
                        {loading ? 'Loading...' : 'Load More'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default AutomationLogsViewer;
