'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRightIcon,
  ChevronDownIcon,
  ArrowPathIcon,
  LinkIcon,
} from '@heroicons/react/24/outline';
import { cn } from '../../../lib/utils';
import type { ToolOutput, ToolOutputManifest, DataTransform } from '@hive/core';

// ============================================================================
// TYPES
// ============================================================================

export interface OtherToolData {
  deploymentId: string;
  name: string;
  description?: string;
  outputs: ToolOutput[];
  lastUpdated?: string;
}

export interface OtherToolsPanelProps {
  /** List of other tools deployed to the same space */
  tools: OtherToolData[];
  /** Whether to show loading state */
  loading?: boolean;
  /** Error message if loading failed */
  error?: string;
  /** Callback when user wants to create a connection from an output */
  onCreateConnection?: (
    sourceDeploymentId: string,
    outputPath: string,
    outputType: string
  ) => void;
  /** Callback to refresh the tool list */
  onRefresh?: () => void;
  /** Current tool's deployment ID (to exclude from list) */
  currentDeploymentId?: string;
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
};

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--hivelab-panel)]';

// ============================================================================
// OUTPUT TYPE BADGE
// ============================================================================

function OutputTypeBadge({ type }: { type: string }) {
  const getTypeStyle = (t: string) => {
    switch (t) {
      case 'memberList':
        return { bg: '#22c55e20', color: '#22c55e', label: 'Members' };
      case 'counter':
        return { bg: '#3b82f620', color: '#3b82f6', label: 'Count' };
      case 'collection':
        return { bg: '#a855f720', color: '#a855f7', label: 'Collection' };
      case 'array':
        return { bg: '#f9731620', color: '#f97316', label: 'Array' };
      case 'number':
        return { bg: '#06b6d420', color: '#06b6d4', label: 'Number' };
      case 'boolean':
        return { bg: '#ec489920', color: '#ec4899', label: 'Boolean' };
      default:
        return { bg: COLORS.bgActive, color: COLORS.textTertiary, label: type };
    }
  };

  const style = getTypeStyle(type);

  return (
    <span
      className="text-label-xs px-1.5 py-0.5 rounded font-medium"
      style={{ backgroundColor: style.bg, color: style.color }}
    >
      {style.label}
    </span>
  );
}

// ============================================================================
// TOOL OUTPUT ROW
// ============================================================================

function ToolOutputRow({
  output,
  deploymentId,
  onConnect,
}: {
  output: ToolOutput;
  deploymentId: string;
  onConnect?: (path: string, type: string) => void;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 px-2 py-1.5 rounded-md group',
        'transition-colors duration-150',
        'hover:bg-[var(--hivelab-surface-hover)]'
      )}
    >
      {/* Output icon */}
      <div
        className="w-4 h-4 rounded flex items-center justify-center shrink-0"
        style={{ backgroundColor: COLORS.bgActive }}
      >
        <div className="w-1.5 h-1.5 rounded-full bg-current" style={{ color: COLORS.accent }} />
      </div>

      {/* Output name and description */}
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium truncate" style={{ color: COLORS.textPrimary }}>
          {output.name}
        </div>
        {output.description && (
          <div className="text-label-xs truncate" style={{ color: COLORS.textTertiary }}>
            {output.description}
          </div>
        )}
      </div>

      {/* Type badge */}
      <OutputTypeBadge type={output.type} />

      {/* Connect button - appears on hover */}
      {onConnect && (
        <button
          type="button"
          onClick={() => onConnect(output.path, output.type)}
          className={cn(
            'p-1 rounded opacity-0 group-hover:opacity-100',
            'transition-opacity duration-150',
            focusRing
          )}
          style={{ color: COLORS.accent }}
          title="Create connection"
        >
          <LinkIcon className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

// ============================================================================
// TOOL CARD (EXPANDABLE)
// ============================================================================

function ToolCard({
  tool,
  expanded,
  onToggle,
  onCreateConnection,
}: {
  tool: OtherToolData;
  expanded: boolean;
  onToggle: () => void;
  onCreateConnection?: (path: string, type: string) => void;
}) {
  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{
        backgroundColor: expanded ? COLORS.bgActive : 'transparent',
        border: `1px solid ${expanded ? COLORS.border : 'transparent'}`,
      }}
    >
      {/* Header */}
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          'w-full flex items-center gap-2 px-3 py-2.5',
          'transition-colors duration-150',
          !expanded && 'hover:bg-[var(--hivelab-surface-hover)] rounded-lg',
          focusRing
        )}
      >
        {/* Expand/collapse chevron */}
        <motion.div
          animate={{ rotate: expanded ? 90 : 0 }}
          transition={{ duration: 0.15 }}
        >
          <ChevronRightIcon className="w-4 h-4" style={{ color: COLORS.textTertiary }} />
        </motion.div>

        {/* Tool icon */}
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{
            backgroundColor: `${COLORS.accent}15`,
            color: COLORS.accent,
          }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z"
            />
          </svg>
        </div>

        {/* Tool name and output count */}
        <div className="flex-1 text-left min-w-0">
          <div className="text-sm font-medium truncate" style={{ color: COLORS.textPrimary }}>
            {tool.name}
          </div>
          <div className="text-label-xs" style={{ color: COLORS.textTertiary }}>
            {tool.outputs.length} output{tool.outputs.length !== 1 ? 's' : ''}
          </div>
        </div>
      </button>

      {/* Outputs list (expanded) */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-2 pb-2 space-y-0.5">
              {tool.outputs.map((output) => (
                <ToolOutputRow
                  key={output.path}
                  output={output}
                  deploymentId={tool.deploymentId}
                  onConnect={
                    onCreateConnection
                      ? (path, type) => onCreateConnection(path, type)
                      : undefined
                  }
                />
              ))}
              {tool.outputs.length === 0 && (
                <div
                  className="text-xs text-center py-3"
                  style={{ color: COLORS.textTertiary }}
                >
                  No outputs available
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function OtherToolsPanel({
  tools,
  loading,
  error,
  onCreateConnection,
  onRefresh,
  currentDeploymentId,
}: OtherToolsPanelProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Filter out current tool
  const otherTools = useMemo(
    () => tools.filter((t) => t.deploymentId !== currentDeploymentId),
    [tools, currentDeploymentId]
  );

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="p-4 space-y-3">
        {/* Skeleton tools */}
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="flex items-center gap-2 px-3 py-2.5">
              <div className="w-4 h-4 rounded bg-white/10" />
              <div className="w-7 h-7 rounded-lg bg-white/10" />
              <div className="flex-1 space-y-1">
                <div className="h-3 bg-white/10 rounded w-24" />
                <div className="h-2 bg-white/10 rounded w-16" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-4 text-center">
        <div
          className="w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: 'var(--hivelab-status-error-muted)' }}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="var(--hivelab-status-error)"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
        </div>
        <p className="text-sm mb-3" style={{ color: COLORS.textSecondary }}>
          {error}
        </p>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs',
              'transition-colors duration-150',
              focusRing
            )}
            style={{
              backgroundColor: COLORS.bgHover,
              color: COLORS.textSecondary,
            }}
          >
            <ArrowPathIcon className="w-3.5 h-3.5" />
            Retry
          </button>
        )}
      </div>
    );
  }

  // Empty state
  if (otherTools.length === 0) {
    return (
      <div className="p-4 text-center">
        <div
          className="w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: `${COLORS.accent}10` }}
        >
          <LinkIcon className="w-7 h-7" style={{ color: COLORS.accent }} />
        </div>
        <p className="text-sm font-medium mb-1" style={{ color: COLORS.textPrimary }}>
          No other tools in this space
        </p>
        <p className="text-xs leading-relaxed" style={{ color: COLORS.textTertiary }}>
          Deploy other tools to this space to create connections between them.
        </p>
      </div>
    );
  }

  return (
    <div className="p-3 space-y-1">
      {/* Header with refresh button */}
      <div className="flex items-center justify-between px-1 pb-2">
        <span className="text-xs font-medium" style={{ color: COLORS.textSecondary }}>
          Tools in Space ({otherTools.length})
        </span>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            className={cn(
              'p-1 rounded transition-colors duration-150',
              focusRing
            )}
            style={{ color: COLORS.textTertiary }}
            title="Refresh app list"
          >
            <ArrowPathIcon className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Tool list */}
      {otherTools.map((tool) => (
        <ToolCard
          key={tool.deploymentId}
          tool={tool}
          expanded={expandedIds.has(tool.deploymentId)}
          onToggle={() => toggleExpanded(tool.deploymentId)}
          onCreateConnection={
            onCreateConnection
              ? (path, type) =>
                  onCreateConnection(tool.deploymentId, path, type)
              : undefined
          }
        />
      ))}
    </div>
  );
}

export default OtherToolsPanel;
