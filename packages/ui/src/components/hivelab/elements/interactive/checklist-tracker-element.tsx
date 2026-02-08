'use client';

/**
 * ChecklistTracker Element
 *
 * Shared progress tracking for event prep, onboarding, semester goals.
 * Config: items (title, assignee), allowMemberAdd
 * Actions: toggle_complete, add_item, remove_item
 * State: collections.completions
 */

import * as React from 'react';
import { useState, useCallback, useMemo } from 'react';
import {
  CheckCircleIcon,
  PlusIcon,
  TrashIcon,
  ClipboardDocumentCheckIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { springPresets } from '@hive/tokens';

import { Button } from '../../../../design-system/primitives';
import { Card, CardContent } from '../../../../design-system/primitives';

import type { ElementProps } from '../../../../lib/hivelab/element-system';
import { StateContainer, type ElementMode } from '../core';

// ============================================================
// Types
// ============================================================

interface ChecklistItem {
  id: string;
  title: string;
  assignee?: string;
}

interface CompletionEntry {
  id: string;
  createdAt: string;
  createdBy: string;
  data: {
    itemId: string;
    completedBy: string;
    completedByName: string;
    completedAt: string;
  };
}

interface ChecklistTrackerConfig {
  items?: ChecklistItem[];
  allowMemberAdd?: boolean;
  title?: string;
}

interface ChecklistTrackerElementProps extends ElementProps {
  config: ChecklistTrackerConfig;
  mode?: ElementMode;
}

// ============================================================
// ChecklistTracker Element
// ============================================================

export function ChecklistTrackerElement({
  id,
  config,
  data,
  onAction,
  sharedState,
  userState,
  context,
  mode = 'runtime',
}: ChecklistTrackerElementProps) {
  const prefersReducedMotion = useReducedMotion();
  const instanceId = id || 'checklist';

  const [newItemTitle, setNewItemTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const items: ChecklistItem[] = config.items || [];
  const allowMemberAdd = config.allowMemberAdd ?? false;

  // Extract completions from shared state
  const completionsKey = `${instanceId}:completions`;
  const completionsMap = (sharedState?.collections?.[completionsKey] || {}) as Record<string, CompletionEntry>;
  const completions = Object.values(completionsMap);

  // Also check for dynamically added items
  const addedItemsKey = `${instanceId}:added_items`;
  const addedItemsMap = (sharedState?.collections?.[addedItemsKey] || {}) as Record<string, { id: string; createdAt: string; createdBy: string; data: { id: string; title: string; addedBy: string } }>;
  const dynamicItems: ChecklistItem[] = Object.values(addedItemsMap).map(entry => ({
    id: entry.data.id,
    title: entry.data.title,
  }));

  const allItems = useMemo(() => [...items, ...dynamicItems], [items, dynamicItems]);

  // Map completions by item ID
  const completionsByItem = useMemo(() => {
    const map: Record<string, CompletionEntry> = {};
    for (const completion of completions) {
      if (completion.data?.itemId) {
        map[completion.data.itemId] = completion;
      }
    }
    return map;
  }, [completions]);

  const completedCount = Object.keys(completionsByItem).length;
  const totalCount = allItems.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const currentUserId = context?.userId || userState?.userId as string || '';

  const handleToggle = useCallback((itemId: string) => {
    const isCompleted = !!completionsByItem[itemId];
    onAction?.('toggle_complete', {
      itemId,
      completed: !isCompleted,
    });
  }, [completionsByItem, onAction]);

  const handleAddItem = useCallback(() => {
    if (!newItemTitle.trim()) return;
    setIsAdding(true);

    onAction?.('add_item', {
      title: newItemTitle.trim(),
    });

    setNewItemTitle('');
    setIsAdding(false);
  }, [newItemTitle, onAction]);

  const handleRemoveItem = useCallback((itemId: string) => {
    onAction?.('remove_item', { itemId });
  }, [onAction]);

  const getProgressColor = () => {
    if (progressPercent >= 100) return 'bg-green-500';
    if (progressPercent >= 70) return 'bg-emerald-500';
    if (progressPercent >= 30) return 'bg-blue-500';
    return 'bg-primary';
  };

  return (
    <StateContainer status="success">
      <Card className="overflow-hidden">
        <CardContent className="p-6 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClipboardDocumentCheckIcon className="h-5 w-5 text-primary" />
              <span className="font-semibold">{config.title || 'Checklist'}</span>
            </div>
            <span className="text-sm text-muted-foreground tabular-nums">
              {completedCount}/{totalCount}
            </span>
          </div>

          {/* Progress bar */}
          <div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${getProgressColor()}`}
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={prefersReducedMotion ? { duration: 0 } : springPresets.default}
              />
            </div>
            {progressPercent >= 100 && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-green-600 mt-1 text-center font-medium"
              >
                All done!
              </motion.div>
            )}
          </div>

          {/* Items list */}
          <div className="space-y-1">
            {allItems.map((item) => {
              const completion = completionsByItem[item.id];
              const isCompleted = !!completion;

              return (
                <motion.div
                  key={item.id}
                  initial={false}
                  layout
                  className={`flex items-center gap-3 p-2 rounded-md transition-colors group ${
                    isCompleted ? 'bg-muted/30' : 'hover:bg-muted/50'
                  }`}
                >
                  {/* Checkbox */}
                  <button
                    onClick={() => handleToggle(item.id)}
                    className="flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                    aria-label={`${isCompleted ? 'Uncheck' : 'Check'} ${item.title}`}
                  >
                    <AnimatePresence mode="wait">
                      {isCompleted ? (
                        <motion.div
                          key="checked"
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.8, opacity: 0 }}
                          transition={springPresets.snappy}
                        >
                          <CheckCircleSolidIcon className="h-5 w-5 text-green-500" />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="unchecked"
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.8, opacity: 0 }}
                          transition={springPresets.snappy}
                        >
                          <CheckCircleIcon className="h-5 w-5 text-muted-foreground/50" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </button>

                  {/* Item content */}
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                      {item.title}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {item.assignee && (
                        <span>Assigned: {item.assignee}</span>
                      )}
                      {isCompleted && completion.data?.completedByName && (
                        <span>Done by {completion.data.completedByName}</span>
                      )}
                    </div>
                  </div>

                  {/* Remove button (only for dynamic items) */}
                  {dynamicItems.some(d => d.id === item.id) && (
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-destructive/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      aria-label={`Remove ${item.title}`}
                    >
                      <TrashIcon className="h-3.5 w-3.5 text-destructive" />
                    </button>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Add item form */}
          {allowMemberAdd && (
            <div className="flex items-center gap-2 pt-2 border-t border-border">
              <input
                type="text"
                value={newItemTitle}
                onChange={(e) => setNewItemTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                placeholder="Add an item..."
                className="flex-1 text-sm bg-transparent border-none outline-none placeholder:text-muted-foreground/50 focus:ring-0"
                aria-label="New checklist item"
              />
              <Button
                onClick={handleAddItem}
                disabled={!newItemTitle.trim() || isAdding}
                variant="ghost"
                size="sm"
                className="h-7 px-2"
                aria-label="Add item"
              >
                <PlusIcon className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </StateContainer>
  );
}

export default ChecklistTrackerElement;
