'use client';

/**
 * ModerationPanel - Content moderation drawer for space moderators
 * CREATED: Feb 2, 2026
 *
 * Shows flagged/hidden content queue with approve/reject actions.
 * Accessible to space owners, admins, and moderators.
 *
 * @version 1.0.0 - Spaces Moderation (Deep Audit Task #4)
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Shield,
  Check,
  EyeOff,
  Trash2,
  RotateCcw,
  AlertTriangle,
  MessageSquare,
  Calendar,
  FileText,
  Loader2,
  CheckSquare,
  Square,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';
import {
  Text,
  Button,
  Avatar,
  AvatarImage,
  AvatarFallback,
  getInitials,
} from '@hive/ui';
import { MOTION, durationSeconds } from '@hive/tokens';

// Types matching the API response
interface ModerationItem {
  id: string;
  type: 'post' | 'comment' | 'event';
  content: {
    title?: string;
    text?: string;
    description?: string;
    type?: string;
    createdAt?: string;
    startDate?: string;
  };
  author: {
    id: string;
    name: string;
    avatar?: string;
  } | null;
  status: 'flagged' | 'hidden' | 'removed' | 'approved';
  flagCount?: number;
  flaggedAt?: string;
  hiddenAt?: string;
  reason?: string;
}

interface ModerationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  spaceId: string;
  spaceName: string;
  className?: string;
}

type ModerationAction = 'approve' | 'hide' | 'unhide' | 'remove' | 'restore';

const ACTION_CONFIG: Record<ModerationAction, { icon: typeof Check; label: string; color: string }> = {
  approve: { icon: Check, label: 'Approve', color: 'text-green-400' },
  hide: { icon: EyeOff, label: 'Hide', color: 'text-yellow-400' },
  unhide: { icon: RotateCcw, label: 'Unhide', color: 'text-white/50' },
  remove: { icon: Trash2, label: 'Remove', color: 'text-red-400' },
  restore: { icon: RotateCcw, label: 'Restore', color: 'text-white/50' },
};

const TYPE_ICON: Record<string, typeof FileText> = {
  post: FileText,
  comment: MessageSquare,
  event: Calendar,
};

export function ModerationPanel({
  isOpen,
  onClose,
  spaceId,
  spaceName,
  className,
}: ModerationPanelProps) {
  const [items, setItems] = React.useState<ModerationItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [filter, setFilter] = React.useState<'flagged' | 'hidden' | 'all'>('flagged');
  const [actionInProgress, setActionInProgress] = React.useState<string | null>(null);
  const [summary, setSummary] = React.useState({ flagged: 0, hidden: 0, removed: 0 });

  // Fetch moderation queue
  const fetchQueue = React.useCallback(async () => {
    if (!spaceId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/spaces/${spaceId}/moderation?status=${filter}&limit=50`
      );

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('You do not have moderation permissions for this space');
        }
        throw new Error('Failed to load moderation queue');
      }

      const data = await response.json();
      setItems(data.data?.items || []);
      setSummary(data.data?.summary || { flagged: 0, hidden: 0, removed: 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load queue');
    } finally {
      setLoading(false);
    }
  }, [spaceId, filter]);

  React.useEffect(() => {
    if (isOpen) {
      fetchQueue();
    }
  }, [isOpen, fetchQueue]);

  // Handle single item action
  const handleAction = async (item: ModerationItem, action: ModerationAction) => {
    const actionId = `${item.id}-${action}`;
    setActionInProgress(actionId);

    try {
      const response = await fetch(`/api/spaces/${spaceId}/moderation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentId: item.id,
          contentType: item.type,
          action,
        }),
      });

      if (!response.ok) {
        throw new Error('Action failed');
      }

      // Refresh the queue
      await fetchQueue();
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    } catch (err) {
      logger.error('Moderation action failed', err instanceof Error ? err : new Error(String(err)));
    } finally {
      setActionInProgress(null);
    }
  };

  // Handle bulk action
  const handleBulkAction = async (action: ModerationAction) => {
    if (selectedIds.size === 0) return;

    setActionInProgress(`bulk-${action}`);

    try {
      const itemsToProcess = items.filter(item => selectedIds.has(item.id));

      const response = await fetch(`/api/spaces/${spaceId}/moderation`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: itemsToProcess.map(item => ({
            contentId: item.id,
            contentType: item.type,
          })),
          action,
        }),
      });

      if (!response.ok) {
        throw new Error('Bulk action failed');
      }

      // Refresh and clear selection
      await fetchQueue();
      setSelectedIds(new Set());
    } catch (err) {
      logger.error('Bulk moderation action failed', err instanceof Error ? err : new Error(String(err)));
    } finally {
      setActionInProgress(null);
    }
  };

  // Toggle item selection
  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Toggle all selection
  const toggleAllSelection = () => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map(item => item.id)));
    }
  };

  // Get available actions for an item based on its status
  const getAvailableActions = (item: ModerationItem): ModerationAction[] => {
    switch (item.status) {
      case 'flagged':
        return ['approve', 'hide', 'remove'];
      case 'hidden':
        return ['unhide', 'remove'];
      case 'removed':
        return ['restore'];
      default:
        return ['hide', 'remove'];
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: durationSeconds.quick }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 "
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Drawer Panel */}
          <motion.div
            className={cn(
              'relative h-full w-full max-w-lg bg-[var(--bg-ground)] border-l border-white/[0.06] overflow-hidden flex flex-col',
              className
            )}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: durationSeconds.smooth, ease: MOTION.ease.premium }}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-white/[0.06] bg-[var(--bg-ground)]">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-white/50" />
                <div>
                  <Text weight="medium" className="text-white">
                    Moderation Queue
                  </Text>
                  <Text size="xs" tone="muted">
                    {spaceName}
                  </Text>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white/50 hover:text-white/50"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 px-6 py-3 border-b border-white/[0.06]">
              {(['flagged', 'hidden', 'all'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={cn(
                    'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                    filter === tab
                      ? 'bg-white/[0.06] text-white'
                      : 'text-white/50 hover:text-white/50 hover:bg-white/[0.06]'
                  )}
                >
                  {tab === 'flagged' && `Flagged (${summary.flagged})`}
                  {tab === 'hidden' && `Hidden (${summary.hidden})`}
                  {tab === 'all' && 'All'}
                </button>
              ))}
            </div>

            {/* Bulk Actions Bar */}
            {selectedIds.size > 0 && (
              <div className="flex items-center justify-between px-6 py-3 bg-white/[0.06] border-b border-white/[0.06]">
                <Text size="sm" className="text-white/50">
                  {selectedIds.size} selected
                </Text>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleBulkAction('approve')}
                    disabled={!!actionInProgress}
                    className="text-green-400 hover:bg-green-400/10"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleBulkAction('hide')}
                    disabled={!!actionInProgress}
                    className="text-yellow-400 hover:bg-yellow-400/10"
                  >
                    <EyeOff className="h-4 w-4 mr-1" />
                    Hide
                  </Button>
                </div>
              </div>
            )}

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6  text-white/50" />
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-12 px-6">
                  <AlertTriangle className="h-8 w-8 text-red-400 mb-3" />
                  <Text className="text-white/50 text-center">{error}</Text>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={fetchQueue}
                    className="mt-4 text-white/50"
                  >
                    Try again
                  </Button>
                </div>
              ) : items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-6">
                  <Shield className="h-10 w-10 text-white/50 mb-4" />
                  <Text weight="medium" className="text-white/50 mb-1">
                    Queue is clear
                  </Text>
                  <Text size="sm" tone="muted" className="text-center">
                    No {filter === 'all' ? '' : filter} content to review.
                  </Text>
                </div>
              ) : (
                <>
                  {/* Select All Header */}
                  <div className="flex items-center gap-3 px-6 py-2 border-b border-white/[0.06]">
                    <button
                      onClick={toggleAllSelection}
                      className="p-0.5 text-white/50 hover:text-white/50"
                    >
                      {selectedIds.size === items.length ? (
                        <CheckSquare className="h-4 w-4" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                    <Text size="xs" tone="muted">
                      {items.length} items
                    </Text>
                  </div>

                  {/* Items List */}
                  <div className="divide-y divide-white/[0.06]">
                    {items.map(item => {
                      const TypeIcon = TYPE_ICON[item.type] || FileText;
                      const availableActions = getAvailableActions(item);

                      return (
                        <div
                          key={`${item.type}-${item.id}`}
                          className={cn(
                            'px-6 py-4 hover:bg-white/[0.06] transition-colors',
                            selectedIds.has(item.id) && 'bg-white/[0.06]'
                          )}
                        >
                          <div className="flex items-start gap-3">
                            {/* Checkbox */}
                            <button
                              onClick={() => toggleSelection(item.id)}
                              className="mt-1 p-0.5 text-white/50 hover:text-white/50"
                            >
                              {selectedIds.has(item.id) ? (
                                <CheckSquare className="h-4 w-4" />
                              ) : (
                                <Square className="h-4 w-4" />
                              )}
                            </button>

                            {/* Author Avatar */}
                            <Avatar size="sm" className="mt-0.5">
                              {item.author?.avatar && (
                                <AvatarImage src={item.author.avatar} />
                              )}
                              <AvatarFallback className="text-xs">
                                {item.author ? getInitials(item.author.name) : '?'}
                              </AvatarFallback>
                            </Avatar>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <TypeIcon className="h-3.5 w-3.5 text-white/50" />
                                <Text size="xs" tone="muted" className="capitalize">
                                  {item.type}
                                </Text>
                                <span
                                  className={cn(
                                    'px-1.5 py-0.5 rounded text-[10px] font-medium uppercase',
                                    item.status === 'flagged' && 'bg-yellow-500/20 text-yellow-400',
                                    item.status === 'hidden' && 'bg-orange-500/20 text-orange-400',
                                    item.status === 'removed' && 'bg-red-500/20 text-red-400'
                                  )}
                                >
                                  {item.status}
                                </span>
                                {item.flagCount && item.flagCount > 1 && (
                                  <Text size="xs" tone="muted">
                                    {item.flagCount} reports
                                  </Text>
                                )}
                              </div>

                              {/* Title/Preview */}
                              <Text size="sm" className="text-white line-clamp-2 mb-1">
                                {item.content.title || item.content.text || item.content.description || 'No content'}
                              </Text>

                              {/* Author & Time */}
                              <div className="flex items-center gap-2">
                                <Text size="xs" tone="muted">
                                  by {item.author?.name || 'Unknown'}
                                </Text>
                                {item.flaggedAt && (
                                  <Text size="xs" tone="muted">
                                    · flagged {new Date(item.flaggedAt).toLocaleDateString()}
                                  </Text>
                                )}
                              </div>

                              {/* Reason if present */}
                              {item.reason && (
                                <div className="mt-2 p-2 rounded bg-white/[0.06] border border-white/[0.06]">
                                  <Text size="xs" tone="muted">
                                    Reason: {item.reason}
                                  </Text>
                                </div>
                              )}

                              {/* Actions */}
                              <div className="flex items-center gap-1 mt-3">
                                {availableActions.map(action => {
                                  const config = ACTION_CONFIG[action];
                                  const ActionIcon = config.icon;
                                  const isLoading = actionInProgress === `${item.id}-${action}`;

                                  const hoverBgMap: Record<string, string> = {
                                    green: 'hover:bg-green-400/10',
                                    yellow: 'hover:bg-yellow-400/10',
                                    white: 'hover:bg-white/[0.06]',
                                    red: 'hover:bg-red-400/10',
                                  };
                                  const colorKey = config.color.split('-')[1] || '';
                                  const hoverBg = hoverBgMap[colorKey] || 'hover:bg-white/[0.06]';

                                  return (
                                    <Button
                                      key={action}
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleAction(item, action)}
                                      disabled={!!actionInProgress}
                                      className={cn('h-7 px-2 text-xs', config.color, hoverBg)}
                                    >
                                      {isLoading ? (
                                        <Loader2 className="h-3 w-3  mr-1" />
                                      ) : (
                                        <ActionIcon className="h-3 w-3 mr-1" />
                                      )}
                                      {config.label}
                                    </Button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

ModerationPanel.displayName = 'ModerationPanel';
