'use client';

/**
 * /tools/[toolId]/runs — Tool Run History (Redesigned)
 *
 * Per DRAMA plan:
 * - Timeline layout grouped by date
 * - StatCounter count-up animation (600ms)
 * - Timeline items stagger entrance (60ms between)
 * - Detail drawer slides from right
 * - Copy input/output, re-run with same input
 */

import * as React from 'react';
import { use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  ArrowLeft,
  Play,
  CheckCircle,
  XCircle,
  AlertCircle,
  X,
  Copy,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '@hive/auth-logic';
import { MOTION } from '@hive/tokens';
import { toast } from 'sonner';

// Premium easing
const EASE = MOTION.ease.premium;

// Colors
const COLORS = {
  gold: 'var(--life-gold, #D4AF37)',
  bg: 'var(--bg-ground, #0A0A09)',
  text: 'var(--hivelab-text-primary, #FAF9F7)',
  textSecondary: 'var(--hivelab-text-secondary, #8A8A8A)',
  textTertiary: 'var(--hivelab-text-tertiary, #5A5A5A)',
  surface: 'var(--hivelab-surface, #141414)',
  border: 'var(--hivelab-border, rgba(255, 255, 255, 0.08))',
  success: '#22c55e',
  error: '#ef4444',
};

interface ToolRun {
  id: string;
  status: 'success' | 'failed' | 'pending';
  startedAt: string;
  completedAt?: string;
  duration?: number;
  userId: string;
  userName: string;
  inputSummary: string;
  outputSummary?: string;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
}

/**
 * StatCounter — Animated count-up
 */
function StatCounter({
  value,
  label,
  color = COLORS.text,
  delay = 0,
}: {
  value: number;
  label: string;
  color?: string;
  delay?: number;
}) {
  const shouldReduceMotion = useReducedMotion();
  const [displayValue, setDisplayValue] = React.useState(0);

  React.useEffect(() => {
    if (shouldReduceMotion) {
      setDisplayValue(value);
      return;
    }

    // Count-up animation over 600ms
    const startTime = Date.now() + delay * 1000;
    const duration = 600;

    const tick = () => {
      const now = Date.now();
      if (now < startTime) {
        requestAnimationFrame(tick);
        return;
      }

      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(value * eased));

      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    };

    requestAnimationFrame(tick);
  }, [value, delay, shouldReduceMotion]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: EASE }}
      className="text-center"
    >
      <div className="text-2xl font-semibold tabular-nums" style={{ color }}>
        {displayValue}
      </div>
      <div className="text-xs mt-1" style={{ color: COLORS.textTertiary }}>
        {label}
      </div>
    </motion.div>
  );
}

/**
 * TimelineItem — Single run in the timeline
 */
function TimelineItem({
  run,
  index,
  onSelect,
}: {
  run: ToolRun;
  index: number;
  onSelect: (run: ToolRun) => void;
}) {
  const shouldReduceMotion = useReducedMotion();
  const time = new Date(run.startedAt);

  return (
    <motion.button
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: shouldReduceMotion ? 0 : 0.3,
        delay: shouldReduceMotion ? 0 : index * 0.06, // 60ms stagger
        ease: EASE,
      }}
      onClick={() => onSelect(run)}
      className="w-full flex items-start gap-3 p-3 rounded-lg text-left transition-all group"
      style={{ backgroundColor: 'transparent' }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
      }}
    >
      {/* Timeline dot */}
      <div className="relative">
        <div
          className="w-2.5 h-2.5 rounded-full mt-1.5"
          style={{
            backgroundColor: run.status === 'success'
              ? COLORS.success
              : run.status === 'failed'
                ? COLORS.error
                : COLORS.gold,
          }}
        />
        {/* Line connecting to next item */}
        <div
          className="absolute left-1 top-4 w-px h-[calc(100%+8px)]"
          style={{ backgroundColor: COLORS.border }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className="text-sm font-medium"
              style={{ color: COLORS.text }}
            >
              {time.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
              })}
            </span>
            <span
              className="text-sm truncate"
              style={{ color: COLORS.textSecondary }}
            >
              {run.inputSummary}
            </span>
          </div>
          <ChevronRight
            className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ color: COLORS.textTertiary }}
          />
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span
            className={`text-xs px-1.5 py-0.5 rounded ${
              run.status === 'success'
                ? 'bg-green-500/10 text-green-400'
                : run.status === 'failed'
                  ? 'bg-red-500/10 text-red-400'
                  : 'bg-amber-500/10 text-amber-400'
            }`}
          >
            {run.status}
          </span>
          {run.outputSummary && (
            <span
              className="text-xs truncate"
              style={{ color: COLORS.textTertiary }}
            >
              {run.outputSummary}
            </span>
          )}
        </div>
      </div>
    </motion.button>
  );
}

/**
 * RunDetailDrawer — Slides in from right
 */
function RunDetailDrawer({
  run,
  onClose,
  onRerun,
  toolName: _toolName,
}: {
  run: ToolRun | null;
  onClose: () => void;
  onRerun: (run: ToolRun) => void;
  toolName: string;
}) {
  const copyToClipboard = React.useCallback((text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${type} copied to clipboard`);
  }, []);

  if (!run) return null;

  const startTime = new Date(run.startedAt);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50"
        onClick={onClose}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/50 " />

        {/* Drawer */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{
            type: 'spring',
            damping: 30,
            stiffness: 300,
          }}
          onClick={(e) => e.stopPropagation()}
          className="absolute right-0 top-0 h-full w-full max-w-md overflow-y-auto"
          style={{ backgroundColor: COLORS.surface }}
        >
          {/* Header */}
          <div
            className="sticky top-0 flex items-center justify-between p-4 border-b"
            style={{
              backgroundColor: COLORS.surface,
              borderColor: COLORS.border,
            }}
          >
            <h2 className="font-semibold" style={{ color: COLORS.text }}>
              Run Detail
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg transition-colors"
              style={{ color: COLORS.textSecondary }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-6">
            {/* Status */}
            <div className="flex items-center gap-3">
              {run.status === 'success' ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : run.status === 'failed' ? (
                <XCircle className="h-5 w-5 text-red-400" />
              ) : (
                <AlertCircle className="h-5 w-5 text-amber-500" />
              )}
              <div>
                <div className="font-medium capitalize" style={{ color: COLORS.text }}>
                  {run.status}
                </div>
                <div className="text-xs" style={{ color: COLORS.textTertiary }}>
                  {run.duration ? `${(run.duration / 1000).toFixed(2)}s` : 'Duration unknown'}
                </div>
              </div>
            </div>

            {/* Timestamp */}
            <div>
              <div className="text-xs font-medium mb-1" style={{ color: COLORS.textTertiary }}>
                Timestamp
              </div>
              <div className="text-sm" style={{ color: COLORS.text }}>
                {startTime.toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
                {' at '}
                {startTime.toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                })}
              </div>
            </div>

            {/* Input */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium" style={{ color: COLORS.textTertiary }}>
                  Input
                </span>
                <button
                  onClick={() => copyToClipboard(JSON.stringify(run.input || run.inputSummary, null, 2), 'Input')}
                  className="flex items-center gap-1 text-xs transition-colors"
                  style={{ color: COLORS.textSecondary }}
                >
                  <Copy className="h-3 w-3" />
                  Copy
                </button>
              </div>
              <pre
                className="p-3 rounded-lg text-xs overflow-x-auto"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  color: COLORS.text,
                }}
              >
                {run.input
                  ? JSON.stringify(run.input, null, 2)
                  : run.inputSummary}
              </pre>
            </div>

            {/* Output/Error */}
            {run.status === 'failed' && run.error ? (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-red-400">
                    Error
                  </span>
                  <button
                    onClick={() => copyToClipboard(run.error || '', 'Error')}
                    className="flex items-center gap-1 text-xs transition-colors"
                    style={{ color: COLORS.textSecondary }}
                  >
                    <Copy className="h-3 w-3" />
                    Copy
                  </button>
                </div>
                <pre
                  className="p-3 rounded-lg text-xs overflow-x-auto text-red-400"
                  style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                >
                  {run.error}
                </pre>
              </div>
            ) : run.output || run.outputSummary ? (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium" style={{ color: COLORS.textTertiary }}>
                    Output
                  </span>
                  <button
                    onClick={() => copyToClipboard(JSON.stringify(run.output || run.outputSummary, null, 2), 'Output')}
                    className="flex items-center gap-1 text-xs transition-colors"
                    style={{ color: COLORS.textSecondary }}
                  >
                    <Copy className="h-3 w-3" />
                    Copy
                  </button>
                </div>
                <pre
                  className="p-3 rounded-lg text-xs overflow-x-auto"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    color: COLORS.text,
                  }}
                >
                  {run.output
                    ? JSON.stringify(run.output, null, 2)
                    : run.outputSummary}
                </pre>
              </div>
            ) : null}

            {/* Actions */}
            <div className="flex gap-2 pt-4 border-t" style={{ borderColor: COLORS.border }}>
              <button
                onClick={() => onRerun(run)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all"
                style={{
                  backgroundColor: COLORS.gold,
                  color: '#000',
                }}
              >
                <RefreshCw className="h-4 w-4" />
                Re-run with same input
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Group runs by date
 */
function groupRunsByDate(runs: ToolRun[]): Map<string, ToolRun[]> {
  const groups = new Map<string, ToolRun[]>();
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  runs.forEach((run) => {
    const runDate = new Date(run.startedAt);
    let label: string;

    if (runDate.toDateString() === today.toDateString()) {
      label = 'Today';
    } else if (runDate.toDateString() === yesterday.toDateString()) {
      label = 'Yesterday';
    } else {
      label = runDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      });
    }

    if (!groups.has(label)) {
      groups.set(label, []);
    }
    groups.get(label)!.push(run);
  });

  return groups;
}

interface Props {
  params: Promise<{ toolId: string }>;
}

export default function ToolRunsPage({ params }: Props) {
  const { toolId } = use(params);
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const [runs, setRuns] = React.useState<ToolRun[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [toolName, setToolName] = React.useState('');
  const [selectedRun, setSelectedRun] = React.useState<ToolRun | null>(null);

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!isAuthenticated) {
      router.push(`/enter?redirect=/lab/${toolId}/runs`);
    }
  }, [isAuthenticated, router, toolId]);

  // Fetch tool info and runs
  React.useEffect(() => {
    async function fetchData() {
      if (!toolId || !isAuthenticated) return;

      try {
        // Fetch tool info
        const toolRes = await fetch(`/api/tools/${toolId}`);
        if (toolRes.ok) {
          const toolData = await toolRes.json();
          setToolName(toolData.name || 'Tool');
        }

        // Fetch runs
        const runsRes = await fetch(`/api/tools/${toolId}/runs`, {
          credentials: 'include',
        });
        if (runsRes.ok) {
          const data = await runsRes.json();
          setRuns(data.runs || []);
        }
      } catch {
        // Failed to fetch runs
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [toolId, isAuthenticated]);

  // Stats
  const totalRuns = runs.length;
  const successRuns = runs.filter((r) => r.status === 'success').length;
  const failedRuns = runs.filter((r) => r.status === 'failed').length;

  // Group runs by date
  const groupedRuns = groupRunsByDate(runs);

  // Handle re-run
  const handleRerun = React.useCallback((run: ToolRun) => {
    // Navigate to the tool with the input pre-filled
    const encodedInput = encodeURIComponent(JSON.stringify(run.input || run.inputSummary));
    router.push(`/lab/${toolId}?input=${encodedInput}`);
  }, [toolId, router]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.bg }}>
      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Link
              href={`/lab/${toolId}`}
              className="p-2 -ml-2 rounded-lg transition-colors"
              style={{ color: COLORS.textSecondary }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = COLORS.text;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = COLORS.textSecondary;
              }}
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-xl font-semibold" style={{ color: COLORS.text }}>
                Run History
              </h1>
              <p className="text-sm" style={{ color: COLORS.textSecondary }}>
                {toolName}
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push(`/lab/${toolId}`)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              backgroundColor: COLORS.gold,
              color: '#000',
            }}
          >
            <Play className="h-4 w-4" />
            Run Now
          </button>
        </div>

        {/* Stats */}
        {!isLoading && runs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="grid grid-cols-3 gap-4 p-4 rounded-lg mb-8"
            style={{
              backgroundColor: COLORS.surface,
              border: `1px solid ${COLORS.border}`,
            }}
          >
            <StatCounter value={totalRuns} label="Total Runs" delay={0} />
            <StatCounter value={successRuns} label="Successful" color={COLORS.success} delay={0.1} />
            <StatCounter value={failedRuns} label="Failed" color={COLORS.error} delay={0.2} />
          </motion.div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.1 }}
                className="h-16 rounded-lg"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.04)' }}
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && runs.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div
              className="w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
            >
              <Play className="h-6 w-6" style={{ color: COLORS.textTertiary }} />
            </div>
            <h2 className="text-lg font-medium mb-2" style={{ color: COLORS.text }}>
              No runs yet
            </h2>
            <p className="text-sm mb-6" style={{ color: COLORS.textSecondary }}>
              Run your tool to see history here
            </p>
            <button
              onClick={() => router.push(`/lab/${toolId}`)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                backgroundColor: COLORS.gold,
                color: '#000',
              }}
            >
              Run this tool
            </button>
          </motion.div>
        )}

        {/* Timeline */}
        {!isLoading && runs.length > 0 && (
          <div className="space-y-6">
            {Array.from(groupedRuns.entries()).map(([dateLabel, dateRuns], groupIndex) => (
              <div key={dateLabel}>
                <motion.h3
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: groupIndex * 0.1 }}
                  className="text-xs font-medium uppercase tracking-wide mb-3 pl-6"
                  style={{ color: COLORS.textTertiary }}
                >
                  {dateLabel}
                </motion.h3>
                <div className="space-y-1">
                  {dateRuns.map((run, index) => (
                    <TimelineItem
                      key={run.id}
                      run={run}
                      index={index}
                      onSelect={setSelectedRun}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Detail Drawer */}
        {selectedRun && (
          <RunDetailDrawer
            run={selectedRun}
            onClose={() => setSelectedRun(null)}
            onRerun={handleRerun}
            toolName={toolName}
          />
        )}
      </div>
    </div>
  );
}
