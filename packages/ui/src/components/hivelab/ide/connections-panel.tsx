'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRightIcon,
  ArrowPathIcon,
  TrashIcon,
  PencilIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ClockIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { cn } from '../../../lib/utils';
import type {
  ToolConnection,
  ResolvedConnection,
  DataTransform,
  ConnectionStatus,
} from '@hive/core';

// ============================================================================
// TYPES
// ============================================================================

export interface ConnectionWithMetadata extends ToolConnection {
  /** Source tool name */
  sourceToolName?: string;
  /** Target element name on this tool */
  targetElementName?: string;
  /** Resolved value if available */
  resolvedValue?: ResolvedConnection;
}

export interface ConnectionsPanelProps {
  /** Connections targeting this tool (incoming) */
  incomingConnections: ConnectionWithMetadata[];
  /** Connections from this tool (outgoing) */
  outgoingConnections?: ConnectionWithMetadata[];
  /** Whether data is loading */
  loading?: boolean;
  /** Callback to edit a connection */
  onEdit?: (connection: ToolConnection) => void;
  /** Callback to delete a connection */
  onDelete?: (connectionId: string) => void;
  /** Callback to toggle connection enabled/disabled */
  onToggleEnabled?: (connectionId: string, enabled: boolean) => void;
  /** Callback to test a connection (fetch current value) */
  onTest?: (connectionId: string) => void;
  /** Callback to add a new connection */
  onAddConnection?: () => void;
  /** Callback to refresh connection data */
  onRefresh?: () => void;
}

// ============================================================================
// STYLING
// ============================================================================

const COLORS = {
  bg: 'var(--hivelab-panel, #1A1A1A)',
  bgHover: 'var(--hivelab-surface-hover, #2a2a2a)',
  bgActive: 'var(--hivelab-surface, #333333)',
  border: 'var(--hivelab-border, rgba(255, 255, 255, 0.08))',
  textPrimary: 'var(--hivelab-text-primary, #ffffff)',
  textSecondary: 'var(--hivelab-text-secondary, rgba(255,255,255,0.7))',
  textTertiary: 'var(--hivelab-text-tertiary, rgba(255,255,255,0.5))',
  accent: 'var(--life-gold, #D4AF37)',
  success: '#22c55e',
  error: '#ef4444',
  warning: '#f59e0b',
};

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1a1a]';

// ============================================================================
// STATUS INDICATOR
// ============================================================================

function ConnectionStatusIndicator({ status }: { status: ConnectionStatus }) {
  const getStatusConfig = (s: ConnectionStatus) => {
    switch (s) {
      case 'connected':
        return {
          icon: CheckCircleIcon,
          color: COLORS.success,
          label: 'Connected',
        };
      case 'error':
        return {
          icon: ExclamationCircleIcon,
          color: COLORS.error,
          label: 'Error',
        };
      case 'stale':
        return {
          icon: ClockIcon,
          color: COLORS.warning,
          label: 'Stale',
        };
      case 'pending':
      default:
        return {
          icon: ClockIcon,
          color: COLORS.textTertiary,
          label: 'Pending',
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-1" style={{ color: config.color }}>
      <Icon className="w-3.5 h-3.5" />
      <span className="text-label-xs font-medium">{config.label}</span>
    </div>
  );
}

// ============================================================================
// TRANSFORM BADGE
// ============================================================================

function TransformBadge({ transform }: { transform?: DataTransform }) {
  if (!transform) return null;

  const getTransformLabel = (t: DataTransform) => {
    switch (t) {
      case 'toArray':
        return 'Array';
      case 'toCount':
        return 'Count';
      case 'toBoolean':
        return 'Bool';
      case 'toSorted':
        return 'Sorted';
      case 'toTop5':
        return 'Top 5';
      case 'toKeys':
        return 'Keys';
      case 'toValues':
        return 'Values';
      case 'flatten':
        return 'Flat';
      case 'unique':
        return 'Unique';
      default:
        return t;
    }
  };

  return (
    <span
      className="text-label-xs px-1.5 py-0.5 rounded font-medium"
      style={{
        backgroundColor: `${COLORS.accent}20`,
        color: COLORS.accent,
      }}
    >
      {getTransformLabel(transform)}
    </span>
  );
}

// ============================================================================
// CONNECTION CARD
// ============================================================================

function ConnectionCard({
  connection,
  direction,
  onEdit,
  onDelete,
  onToggleEnabled,
  onTest,
}: {
  connection: ConnectionWithMetadata;
  direction: 'incoming' | 'outgoing';
  onEdit?: () => void;
  onDelete?: () => void;
  onToggleEnabled?: (enabled: boolean) => void;
  onTest?: () => void;
}) {
  const [showActions, setShowActions] = useState(false);

  const sourcePath = connection.source.path.split('.').pop() || connection.source.path;
  const targetPath = connection.target.inputPath;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        'rounded-lg overflow-hidden transition-colors duration-150',
        !connection.enabled && 'opacity-50'
      )}
      style={{
        backgroundColor: COLORS.bgActive,
        border: `1px solid ${COLORS.border}`,
      }}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Main content */}
      <div className="px-3 py-2.5">
        {/* Connection flow visualization */}
        <div className="flex items-center gap-2 text-xs">
          {/* Source */}
          <div
            className="flex-1 px-2 py-1 rounded truncate"
            style={{ backgroundColor: COLORS.bg }}
            title={connection.source.path}
          >
            <span style={{ color: COLORS.textTertiary }}>
              {connection.sourceToolName || 'Tool'}
            </span>
            <span style={{ color: COLORS.textPrimary }}>
              .{sourcePath}
            </span>
          </div>

          {/* Arrow with transform */}
          <div className="flex items-center gap-1 shrink-0">
            {connection.transform && (
              <TransformBadge transform={connection.transform} />
            )}
            <ArrowRightIcon className="w-4 h-4" style={{ color: COLORS.accent }} />
          </div>

          {/* Target */}
          <div
            className="flex-1 px-2 py-1 rounded truncate"
            style={{ backgroundColor: COLORS.bg }}
            title={`${connection.target.elementId}.${connection.target.inputPath}`}
          >
            <span style={{ color: COLORS.textTertiary }}>
              {connection.targetElementName || connection.target.elementId}
            </span>
            <span style={{ color: COLORS.textPrimary }}>
              .{targetPath}
            </span>
          </div>
        </div>

        {/* Status and label row */}
        <div className="flex items-center justify-between mt-2">
          {connection.resolvedValue ? (
            <ConnectionStatusIndicator status={connection.resolvedValue.status} />
          ) : (
            <span className="text-label-xs" style={{ color: COLORS.textTertiary }}>
              Not resolved
            </span>
          )}

          {connection.label && (
            <span className="text-label-xs truncate max-w-[100px]" style={{ color: COLORS.textSecondary }}>
              {connection.label}
            </span>
          )}
        </div>

        {/* Resolved value preview (if connected) */}
        {connection.resolvedValue?.status === 'connected' &&
          connection.resolvedValue.value !== undefined && (
            <div
              className="mt-2 px-2 py-1.5 rounded text-label-xs font-mono overflow-hidden"
              style={{ backgroundColor: COLORS.bg, color: COLORS.textTertiary }}
            >
              {formatValue(connection.resolvedValue.value)}
            </div>
          )}

        {/* Error message */}
        {connection.resolvedValue?.status === 'error' && connection.resolvedValue.error && (
          <div
            className="mt-2 px-2 py-1.5 rounded text-label-xs"
            style={{ backgroundColor: `${COLORS.error}10`, color: COLORS.error }}
          >
            {connection.resolvedValue.error}
          </div>
        )}
      </div>

      {/* Actions bar (appears on hover) */}
      <AnimatePresence>
        {showActions && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="border-t overflow-hidden"
            style={{ borderColor: COLORS.border }}
          >
            <div className="flex items-center gap-1 px-2 py-1.5">
              {/* Toggle enabled */}
              {onToggleEnabled && (
                <button
                  type="button"
                  onClick={() => onToggleEnabled(!connection.enabled)}
                  className={cn(
                    'px-2 py-1 rounded text-label-xs transition-colors',
                    focusRing
                  )}
                  style={{
                    backgroundColor: connection.enabled ? COLORS.bgHover : `${COLORS.success}20`,
                    color: connection.enabled ? COLORS.textSecondary : COLORS.success,
                  }}
                >
                  {connection.enabled ? 'Disable' : 'Enable'}
                </button>
              )}

              {/* Test connection */}
              {onTest && (
                <button
                  type="button"
                  onClick={onTest}
                  className={cn(
                    'p-1 rounded transition-colors',
                    focusRing
                  )}
                  style={{ color: COLORS.textTertiary }}
                  title="Test connection"
                >
                  <ArrowPathIcon className="w-3.5 h-3.5" />
                </button>
              )}

              <div className="flex-1" />

              {/* Edit */}
              {onEdit && (
                <button
                  type="button"
                  onClick={onEdit}
                  className={cn(
                    'p-1 rounded transition-colors',
                    focusRing
                  )}
                  style={{ color: COLORS.textTertiary }}
                  title="Edit connection"
                >
                  <PencilIcon className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Delete */}
              {onDelete && (
                <button
                  type="button"
                  onClick={onDelete}
                  className={cn(
                    'p-1 rounded transition-colors hover:text-red-400',
                    focusRing
                  )}
                  style={{ color: COLORS.textTertiary }}
                  title="Delete connection"
                >
                  <TrashIcon className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================================================
// HELPER
// ============================================================================

function formatValue(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';

  if (Array.isArray(value)) {
    return `[${value.length} items]`;
  }

  if (typeof value === 'object') {
    const keys = Object.keys(value);
    return `{${keys.length} keys}`;
  }

  if (typeof value === 'string') {
    return value.length > 50 ? `"${value.slice(0, 50)}..."` : `"${value}"`;
  }

  return String(value);
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ConnectionsPanel({
  incomingConnections,
  outgoingConnections,
  loading,
  onEdit,
  onDelete,
  onToggleEnabled,
  onTest,
  onAddConnection,
  onRefresh,
}: ConnectionsPanelProps) {
  const hasConnections = incomingConnections.length > 0 || (outgoingConnections?.length || 0) > 0;

  // Loading state
  if (loading) {
    return (
      <div className="p-4 space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="animate-pulse">
            <div
              className="h-20 rounded-lg"
              style={{ backgroundColor: COLORS.bgActive }}
            />
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  if (!hasConnections) {
    return (
      <div className="p-4 text-center">
        <div
          className="w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: `${COLORS.accent}10` }}
        >
          <ArrowRightIcon className="w-7 h-7" style={{ color: COLORS.accent }} />
        </div>
        <p className="text-sm font-medium mb-1" style={{ color: COLORS.textPrimary }}>
          No connections yet
        </p>
        <p className="text-xs leading-relaxed mb-4" style={{ color: COLORS.textTertiary }}>
          Connect this tool to other tools in your space to share data between them.
        </p>
        {onAddConnection && (
          <button
            type="button"
            onClick={onAddConnection}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium',
              'transition-colors duration-150',
              focusRing
            )}
            style={{
              backgroundColor: `${COLORS.accent}15`,
              color: COLORS.accent,
              border: `1px solid ${COLORS.accent}30`,
            }}
          >
            <PlusIcon className="w-4 h-4" />
            Add Connection
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="p-3 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-medium" style={{ color: COLORS.textSecondary }}>
          Connections ({incomingConnections.length + (outgoingConnections?.length || 0)})
        </span>
        <div className="flex items-center gap-1">
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className={cn('p-1 rounded transition-colors', focusRing)}
              style={{ color: COLORS.textTertiary }}
              title="Refresh"
            >
              <ArrowPathIcon className="w-3.5 h-3.5" />
            </button>
          )}
          {onAddConnection && (
            <button
              type="button"
              onClick={onAddConnection}
              className={cn('p-1 rounded transition-colors', focusRing)}
              style={{ color: COLORS.accent }}
              title="Add connection"
            >
              <PlusIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Incoming Connections */}
      {incomingConnections.length > 0 && (
        <div className="space-y-2">
          <div className="text-label-xs uppercase tracking-wide px-1" style={{ color: COLORS.textTertiary }}>
            Incoming
          </div>
          <AnimatePresence>
            {incomingConnections.map((conn) => (
              <ConnectionCard
                key={conn.id}
                connection={conn}
                direction="incoming"
                onEdit={onEdit ? () => onEdit(conn) : undefined}
                onDelete={onDelete ? () => onDelete(conn.id) : undefined}
                onToggleEnabled={
                  onToggleEnabled
                    ? (enabled) => onToggleEnabled(conn.id, enabled)
                    : undefined
                }
                onTest={onTest ? () => onTest(conn.id) : undefined}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Outgoing Connections */}
      {outgoingConnections && outgoingConnections.length > 0 && (
        <div className="space-y-2">
          <div className="text-label-xs uppercase tracking-wide px-1" style={{ color: COLORS.textTertiary }}>
            Outgoing
          </div>
          <AnimatePresence>
            {outgoingConnections.map((conn) => (
              <ConnectionCard
                key={conn.id}
                connection={conn}
                direction="outgoing"
                onEdit={onEdit ? () => onEdit(conn) : undefined}
                onDelete={onDelete ? () => onDelete(conn.id) : undefined}
                onToggleEnabled={
                  onToggleEnabled
                    ? (enabled) => onToggleEnabled(conn.id, enabled)
                    : undefined
                }
                onTest={onTest ? () => onTest(conn.id) : undefined}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

export default ConnectionsPanel;
