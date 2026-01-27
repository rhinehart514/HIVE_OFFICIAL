'use client';

/**
 * AutomationsPanel - IDE panel for managing tool automations
 *
 * Sprint 4: Automations
 *
 * Displays a list of automations for the current tool with:
 * - Enable/disable toggle
 * - Run count and status
 * - Quick actions (edit, delete, view logs)
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlusIcon,
  BoltIcon,
  ClockIcon,
  ChartBarIcon,
  PencilSquareIcon,
  TrashIcon,
  PlayIcon,
  EllipsisHorizontalIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChevronRightIcon,
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

export interface AutomationSummary {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  triggerType: 'event' | 'schedule' | 'threshold';
  triggerSummary: string;
  lastRun?: string;
  nextRun?: string;
  runCount: number;
  errorCount: number;
}

interface AutomationsPanelProps {
  automations: AutomationSummary[];
  loading?: boolean;
  onCreateAutomation: () => void;
  onEditAutomation: (id: string) => void;
  onDeleteAutomation: (id: string) => void;
  onToggleAutomation: (id: string, enabled: boolean) => void;
  onViewLogs: (id: string) => void;
  onRunNow?: (id: string) => void;
}

// ============================================================================
// Trigger Type Icons
// ============================================================================

function TriggerIcon({ type }: { type: 'event' | 'schedule' | 'threshold' }) {
  const iconClass = 'h-4 w-4';

  switch (type) {
    case 'event':
      return <BoltIcon className={iconClass} />;
    case 'schedule':
      return <ClockIcon className={iconClass} />;
    case 'threshold':
      return <ChartBarIcon className={iconClass} />;
    default:
      return <BoltIcon className={iconClass} />;
  }
}

function getTriggerLabel(type: 'event' | 'schedule' | 'threshold'): string {
  switch (type) {
    case 'event':
      return 'Event';
    case 'schedule':
      return 'Schedule';
    case 'threshold':
      return 'Threshold';
    default:
      return 'Unknown';
  }
}

// ============================================================================
// Status Badge
// ============================================================================

function StatusBadge({ enabled, errorCount }: { enabled: boolean; errorCount: number }) {
  if (!enabled) {
    return (
      <span
        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-label-xs font-medium"
        style={{ backgroundColor: PANEL_COLORS.bgActive, color: PANEL_COLORS.textTertiary }}
      >
        Disabled
      </span>
    );
  }

  if (errorCount > 0) {
    return (
      <span
        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-label-xs font-medium"
        style={{ backgroundColor: PANEL_COLORS.warningLight, color: PANEL_COLORS.warning }}
      >
        <ExclamationTriangleIcon className="h-3 w-3" />
        {errorCount} errors
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-label-xs font-medium"
      style={{ backgroundColor: PANEL_COLORS.successLight, color: PANEL_COLORS.success }}
    >
      <CheckCircleIcon className="h-3 w-3" />
      Active
    </span>
  );
}

// ============================================================================
// Automation Row
// ============================================================================

function AutomationRow({
  automation,
  onEdit,
  onDelete,
  onToggle,
  onViewLogs,
  onRunNow,
}: {
  automation: AutomationSummary;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: (enabled: boolean) => void;
  onViewLogs: () => void;
  onRunNow?: () => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const formatTime = (iso: string) => {
    const date = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="rounded-lg overflow-hidden"
      style={{
        backgroundColor: PANEL_COLORS.bgHover,
        border: `1px solid ${PANEL_COLORS.border}`,
      }}
    >
      {/* Main Row */}
      <div
        className="flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors"
        onClick={() => setExpanded(!expanded)}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = PANEL_COLORS.bgActive;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        {/* Toggle */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggle(!automation.enabled);
          }}
          className={cn(
            'relative w-8 h-5 rounded-full transition-colors duration-200',
            focusRing
          )}
          style={{
            backgroundColor: automation.enabled ? PANEL_COLORS.accent : PANEL_COLORS.bgActive,
          }}
          aria-label={automation.enabled ? 'Disable automation' : 'Enable automation'}
        >
          <motion.div
            className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm"
            animate={{ left: automation.enabled ? 14 : 2 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        </button>

        {/* Trigger Icon */}
        <div
          className="flex items-center justify-center w-7 h-7 rounded-md"
          style={{
            backgroundColor: PANEL_COLORS.bgActive,
            color: automation.enabled ? PANEL_COLORS.accent : PANEL_COLORS.textTertiary,
          }}
        >
          <TriggerIcon type={automation.triggerType} />
        </div>

        {/* Name & Summary */}
        <div className="flex-1 min-w-0">
          <div
            className="text-sm font-medium truncate"
            style={{ color: automation.enabled ? PANEL_COLORS.textPrimary : PANEL_COLORS.textSecondary }}
          >
            {automation.name}
          </div>
          <div
            className="text-xs truncate"
            style={{ color: PANEL_COLORS.textTertiary }}
          >
            {automation.triggerSummary}
          </div>
        </div>

        {/* Status Badge */}
        <StatusBadge enabled={automation.enabled} errorCount={automation.errorCount} />

        {/* Expand Arrow */}
        <motion.div
          animate={{ rotate: expanded ? 90 : 0 }}
          transition={{ duration: 0.2 }}
          style={{ color: PANEL_COLORS.textTertiary }}
        >
          <ChevronRightIcon className="h-4 w-4" />
        </motion.div>
      </div>

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
              {/* Description */}
              {automation.description && (
                <p className="text-xs" style={{ color: PANEL_COLORS.textSecondary }}>
                  {automation.description}
                </p>
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-label-xs uppercase tracking-wider" style={{ color: PANEL_COLORS.textTertiary }}>
                    Runs
                  </span>
                  <span className="text-xs font-medium" style={{ color: PANEL_COLORS.textSecondary }}>
                    {automation.runCount}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-label-xs uppercase tracking-wider" style={{ color: PANEL_COLORS.textTertiary }}>
                    Last Run
                  </span>
                  <span className="text-xs font-medium" style={{ color: PANEL_COLORS.textSecondary }}>
                    {automation.lastRun ? formatTime(automation.lastRun) : 'Never'}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={onEdit}
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors',
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
                  <PencilSquareIcon className="h-3.5 w-3.5" />
                  Edit
                </button>

                <button
                  type="button"
                  onClick={onViewLogs}
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors',
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
                  <ChartBarIcon className="h-3.5 w-3.5" />
                  Logs
                </button>

                {onRunNow && automation.enabled && (
                  <button
                    type="button"
                    onClick={onRunNow}
                    className={cn(
                      'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors',
                      focusRing
                    )}
                    style={{
                      backgroundColor: PANEL_COLORS.accentLight,
                      color: PANEL_COLORS.accent,
                      border: `1px solid rgba(212, 175, 55, 0.2)`,
                    }}
                  >
                    <PlayIcon className="h-3.5 w-3.5" />
                    Run Now
                  </button>
                )}

                <div className="flex-1" />

                <button
                  type="button"
                  onClick={onDelete}
                  className={cn(
                    'p-1.5 rounded-md transition-colors',
                    focusRing
                  )}
                  style={{ color: PANEL_COLORS.textTertiary }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = PANEL_COLORS.error;
                    e.currentTarget.style.backgroundColor = PANEL_COLORS.errorLight;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = PANEL_COLORS.textTertiary;
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                  aria-label="Delete automation"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================================================
// Empty State
// ============================================================================

function EmptyState({ onCreateAutomation }: { onCreateAutomation: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-12 px-4 text-center"
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
        style={{ backgroundColor: PANEL_COLORS.accentLight }}
      >
        <BoltIcon className="h-6 w-6" style={{ color: PANEL_COLORS.accent }} />
      </div>

      <h3
        className="text-sm font-semibold mb-1"
        style={{ color: PANEL_COLORS.textPrimary }}
      >
        Automate your tool
      </h3>

      <p
        className="text-xs mb-4 max-w-[200px]"
        style={{ color: PANEL_COLORS.textTertiary }}
      >
        Create automations to trigger actions on events, schedules, or when values cross thresholds.
      </p>

      <button
        type="button"
        onClick={onCreateAutomation}
        className={cn(
          'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
          focusRing
        )}
        style={{
          backgroundColor: PANEL_COLORS.accent,
          color: 'black',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-1px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        <PlusIcon className="h-4 w-4" />
        Create Automation
      </button>
    </motion.div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function AutomationsPanel({
  automations,
  loading = false,
  onCreateAutomation,
  onEditAutomation,
  onDeleteAutomation,
  onToggleAutomation,
  onViewLogs,
  onRunNow,
}: AutomationsPanelProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: `1px solid ${PANEL_COLORS.border}` }}
      >
        <div className="flex items-center gap-2">
          <BoltIcon className="h-4 w-4" style={{ color: PANEL_COLORS.textSecondary }} />
          <h3 className="text-sm font-semibold" style={{ color: PANEL_COLORS.textPrimary }}>
            Automations
          </h3>
          {automations.length > 0 && (
            <span
              className="px-1.5 py-0.5 rounded text-label-xs font-medium"
              style={{ backgroundColor: PANEL_COLORS.bgActive, color: PANEL_COLORS.textSecondary }}
            >
              {automations.length}
            </span>
          )}
        </div>

        {automations.length > 0 && (
          <button
            type="button"
            onClick={onCreateAutomation}
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors',
              focusRing
            )}
            style={{
              backgroundColor: PANEL_COLORS.accentLight,
              color: PANEL_COLORS.accent,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(212, 175, 55, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = PANEL_COLORS.accentLight;
            }}
          >
            <PlusIcon className="h-3.5 w-3.5" />
            New
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-6 h-6 border-2 border-t-transparent rounded-full"
              style={{ borderColor: PANEL_COLORS.accent, borderTopColor: 'transparent' }}
            />
          </div>
        ) : automations.length === 0 ? (
          <EmptyState onCreateAutomation={onCreateAutomation} />
        ) : (
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {automations.map((automation) => (
                <AutomationRow
                  key={automation.id}
                  automation={automation}
                  onEdit={() => onEditAutomation(automation.id)}
                  onDelete={() => onDeleteAutomation(automation.id)}
                  onToggle={(enabled) => onToggleAutomation(automation.id, enabled)}
                  onViewLogs={() => onViewLogs(automation.id)}
                  onRunNow={onRunNow ? () => onRunNow(automation.id) : undefined}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Footer with stats */}
      {automations.length > 0 && (
        <div
          className="px-4 py-3 flex items-center justify-between text-xs"
          style={{ borderTop: `1px solid ${PANEL_COLORS.border}` }}
        >
          <span style={{ color: PANEL_COLORS.textTertiary }}>
            {automations.filter((a) => a.enabled).length} active
          </span>
          <span style={{ color: PANEL_COLORS.textTertiary }}>
            {automations.reduce((sum, a) => sum + a.runCount, 0)} total runs
          </span>
        </div>
      )}
    </div>
  );
}

export default AutomationsPanel;
