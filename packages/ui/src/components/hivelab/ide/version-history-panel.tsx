'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../lib/utils';
import { FOCUS_RING, WORKSHOP_TRANSITION } from '../tokens';
import { toast } from 'sonner';

interface VersionEntry {
  version: string;
  createdAt: string | { toDate?: () => Date };
  createdBy?: string;
  changelog?: string;
  elementCount?: number;
  compositionHash?: string;
  isStable?: boolean;
  restoredFrom?: string;
}

interface VersionHistoryPanelProps {
  toolId: string;
  currentVersion?: string;
  onRestore?: (version: string) => void;
  onClose?: () => void;
}

const PANEL_COLORS = {
  bg: 'var(--hivelab-panel)',
  bgHover: 'var(--hivelab-surface-hover)',
  bgActive: 'var(--hivelab-surface)',
  border: 'var(--hivelab-border)',
  textPrimary: 'var(--hivelab-text-primary)',
  textSecondary: 'var(--hivelab-text-secondary)',
  textTertiary: 'var(--hivelab-text-tertiary)',
  accent: 'var(--life-gold)',
};

function formatTimestamp(ts: string | { toDate?: () => Date }): string {
  const date = typeof ts === 'string'
    ? new Date(ts)
    : ts?.toDate?.() || new Date();
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function VersionHistoryPanel({
  toolId,
  currentVersion,
  onRestore,
  onClose,
}: VersionHistoryPanelProps) {
  const [versions, setVersions] = useState<VersionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [confirmRestore, setConfirmRestore] = useState<string | null>(null);

  const fetchVersions = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch(`/api/tools/${toolId}/versions`);
      if (res.ok) {
        const data = await res.json();
        setVersions(data.versions || []);
      } else {
        setFetchError('Failed to load version history');
      }
    } catch (err) {
      console.error('Failed to fetch versions:', err);
      setFetchError('Network error — could not load versions');
    } finally {
      setLoading(false);
    }
  }, [toolId]);

  useEffect(() => {
    fetchVersions();
  }, [fetchVersions]);

  const handleRestore = useCallback(async (version: string) => {
    setRestoring(version);
    try {
      const res = await fetch(`/api/tools/${toolId}/versions/${version}/restore`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        toast.success(`Restored to v${version}`);
        setConfirmRestore(null);
        onRestore?.(data.newVersion);
        fetchVersions();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to restore');
      }
    } catch {
      toast.error('Failed to restore version');
    } finally {
      setRestoring(null);
    }
  }, [toolId, onRestore, fetchVersions]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      transition={WORKSHOP_TRANSITION}
      className="flex flex-col h-full"
      style={{ backgroundColor: PANEL_COLORS.bg }}
    >
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{ borderBottom: `1px solid ${PANEL_COLORS.border}` }}
      >
        <div>
          <h3
            className="text-sm font-semibold"
            style={{ color: PANEL_COLORS.textPrimary }}
          >
            Version History
          </h3>
          {currentVersion && (
            <p className="text-xs mt-0.5" style={{ color: PANEL_COLORS.textTertiary }}>
              Current: v{currentVersion}
            </p>
          )}
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className={cn('p-1.5 rounded-lg transition-colors', FOCUS_RING)}
            style={{ color: PANEL_COLORS.textTertiary }}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-3 rounded w-20 mb-1" style={{ backgroundColor: PANEL_COLORS.bgHover }} />
                <div className="h-2 rounded w-32" style={{ backgroundColor: PANEL_COLORS.bgHover }} />
              </div>
            ))}
          </div>
        ) : fetchError ? (
          <div className="p-6 text-center">
            <p className="text-sm" style={{ color: PANEL_COLORS.textSecondary }}>
              {fetchError}
            </p>
            <button
              type="button"
              onClick={fetchVersions}
              className={cn('mt-2 px-3 py-1 text-xs rounded-md transition-colors', FOCUS_RING)}
              style={{
                color: PANEL_COLORS.textSecondary,
                border: `1px solid ${PANEL_COLORS.border}`,
              }}
            >
              Retry
            </button>
          </div>
        ) : versions.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-sm" style={{ color: PANEL_COLORS.textSecondary }}>
              No versions yet
            </p>
            <p className="text-xs mt-1" style={{ color: PANEL_COLORS.textTertiary }}>
              Versions are created when you save changes
            </p>
          </div>
        ) : (
          <div className="py-2">
            {versions.map((v, i) => {
              const isCurrent = v.version === currentVersion;
              const isConfirming = confirmRestore === v.version;

              return (
                <div key={v.version} className="relative">
                  {/* Timeline connector */}
                  {i < versions.length - 1 && (
                    <div
                      className="absolute left-6 top-8 bottom-0 w-px"
                      style={{ backgroundColor: PANEL_COLORS.border }}
                    />
                  )}

                  <div
                    className={cn(
                      'px-4 py-2.5 flex items-start gap-3 transition-colors',
                      !isCurrent && 'cursor-pointer',
                    )}
                    style={{
                      backgroundColor: isCurrent ? PANEL_COLORS.bgActive : 'transparent',
                    }}
                    onMouseEnter={(e) => {
                      if (!isCurrent) e.currentTarget.style.backgroundColor = PANEL_COLORS.bgHover;
                    }}
                    onMouseLeave={(e) => {
                      if (!isCurrent) e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    {/* Dot */}
                    <div
                      className="mt-1.5 h-2.5 w-2.5 rounded-full flex-shrink-0 relative z-10"
                      style={{
                        backgroundColor: isCurrent ? PANEL_COLORS.accent : PANEL_COLORS.textTertiary,
                        boxShadow: isCurrent ? `0 0 0 3px ${PANEL_COLORS.bg}` : undefined,
                      }}
                    />

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className="text-sm font-medium"
                          style={{ color: PANEL_COLORS.textPrimary }}
                        >
                          v{v.version}
                        </span>
                        {isCurrent && (
                          <span
                            className="px-1.5 py-0.5 text-[10px] font-medium rounded"
                            style={{
                              backgroundColor: PANEL_COLORS.accent,
                              color: '#000',
                            }}
                          >
                            Current
                          </span>
                        )}
                        {v.restoredFrom && (
                          <span
                            className="text-[10px]"
                            style={{ color: PANEL_COLORS.textTertiary }}
                          >
                            from v{v.restoredFrom}
                          </span>
                        )}
                      </div>

                      <p className="text-xs mt-0.5" style={{ color: PANEL_COLORS.textTertiary }}>
                        {formatTimestamp(v.createdAt)}
                        {v.elementCount !== undefined && ` \u00B7 ${v.elementCount} elements`}
                      </p>

                      {v.changelog && (
                        <p
                          className="text-xs mt-1 line-clamp-2"
                          style={{ color: PANEL_COLORS.textSecondary }}
                        >
                          {v.changelog}
                        </p>
                      )}

                      {/* Restore button */}
                      <AnimatePresence>
                        {!isCurrent && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-2"
                          >
                            {isConfirming ? (
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleRestore(v.version)}
                                  disabled={restoring === v.version}
                                  className={cn(
                                    'px-3 py-1 text-xs font-medium rounded-md transition-colors',
                                    FOCUS_RING,
                                  )}
                                  style={{
                                    backgroundColor: PANEL_COLORS.accent,
                                    color: '#000',
                                    opacity: restoring === v.version ? 0.5 : 1,
                                  }}
                                >
                                  {restoring === v.version ? 'Restoring...' : 'Confirm'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmRestore(null)}
                                  className={cn(
                                    'px-3 py-1 text-xs rounded-md transition-colors',
                                    FOCUS_RING,
                                  )}
                                  style={{
                                    color: PANEL_COLORS.textSecondary,
                                    border: `1px solid ${PANEL_COLORS.border}`,
                                  }}
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setConfirmRestore(v.version)}
                                className={cn(
                                  'px-3 py-1 text-xs rounded-md transition-colors',
                                  FOCUS_RING,
                                )}
                                style={{
                                  color: PANEL_COLORS.textSecondary,
                                  border: `1px solid ${PANEL_COLORS.border}`,
                                }}
                              >
                                Restore this version
                              </button>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}
