/**
 * useBentoGrid - State management for configurable bento grid layout
 *
 * Handles:
 * - Widget ordering and visibility
 * - Drag-drop reordering
 * - Size changes
 * - Persistence to API
 * - Edit mode toggle
 *
 * @version 1.0.0
 */

'use client';

import * as React from 'react';
import type { WidgetConfig, WidgetSize, WidgetType } from '@hive/core';
import { logger } from '@/lib/logger';

// Default widget layout
const DEFAULT_LAYOUT: WidgetConfig[] = [
  { id: 'identity', type: 'identity', size: '2x2', visible: true, order: 0 },
  { id: 'spaces', type: 'spaces', size: '1x1', visible: true, order: 1 },
  { id: 'tools', type: 'tools', size: '1x1', visible: true, order: 2 },
  { id: 'connections', type: 'connections', size: '1x1', visible: true, order: 3 },
  { id: 'interests', type: 'interests', size: '1x1', visible: true, order: 4 },
  { id: 'stats', type: 'stats', size: '4x1', visible: true, order: 5 },
  { id: 'heatmap', type: 'heatmap', size: '2x1', visible: true, order: 6 },
  { id: 'featuredTool', type: 'featuredTool', size: '2x1', visible: false, order: 7 },
];

// Widget metadata for the widget picker
export const WIDGET_METADATA: Record<WidgetType, {
  label: string;
  description: string;
  allowedSizes: WidgetSize[];
  defaultSize: WidgetSize;
}> = {
  identity: {
    label: 'Identity',
    description: 'Your photo, name, and bio',
    allowedSizes: ['2x2'],
    defaultSize: '2x2',
  },
  heatmap: {
    label: 'Activity',
    description: 'Your contribution heatmap',
    allowedSizes: ['2x1', '4x1'],
    defaultSize: '2x1',
  },
  spaces: {
    label: 'Spaces',
    description: 'Communities you belong to',
    allowedSizes: ['1x1', '2x1', '1x2'],
    defaultSize: '1x1',
  },
  tools: {
    label: 'Tools',
    description: 'Your AI tools',
    allowedSizes: ['1x1', '2x1', '1x2'],
    defaultSize: '1x1',
  },
  connections: {
    label: 'Connections',
    description: 'Your network',
    allowedSizes: ['1x1', '2x1'],
    defaultSize: '1x1',
  },
  interests: {
    label: 'Interests',
    description: 'What you care about',
    allowedSizes: ['1x1', '2x1'],
    defaultSize: '1x1',
  },
  stats: {
    label: 'Stats',
    description: 'Quick numbers overview',
    allowedSizes: ['2x1', '4x1'],
    defaultSize: '4x1',
  },
  featuredTool: {
    label: 'Featured Tool',
    description: 'Spotlight your best creation',
    allowedSizes: ['2x1', '2x2'],
    defaultSize: '2x1',
  },
  // Legacy types - not shown in picker
  spaces_hub: { label: 'Spaces Hub', description: '', allowedSizes: ['1x1'], defaultSize: '1x1' },
  friends_network: { label: 'Friends', description: '', allowedSizes: ['1x1'], defaultSize: '1x1' },
  schedule_overlap: { label: 'Schedule', description: '', allowedSizes: ['1x1'], defaultSize: '1x1' },
  active_now: { label: 'Active Now', description: '', allowedSizes: ['1x1'], defaultSize: '1x1' },
  discovery: { label: 'Discovery', description: '', allowedSizes: ['1x1'], defaultSize: '1x1' },
  vibe_check: { label: 'Vibe Check', description: '', allowedSizes: ['1x1'], defaultSize: '1x1' },
  custom: { label: 'Custom', description: '', allowedSizes: ['1x1'], defaultSize: '1x1' },
};

export interface UseBentoGridReturn {
  /** Current widget configuration */
  widgets: WidgetConfig[];
  /** Visible widgets sorted by order */
  visibleWidgets: WidgetConfig[];
  /** Hidden widgets for the picker */
  hiddenWidgets: WidgetConfig[];
  /** Edit mode state */
  isEditMode: boolean;
  /** Whether there are unsaved changes */
  isDirty: boolean;
  /** Whether save is in progress */
  isSaving: boolean;

  // Actions
  toggleEditMode: () => void;
  reorderWidgets: (activeId: string, overId: string) => void;
  toggleVisibility: (widgetId: string) => void;
  resizeWidget: (widgetId: string, size: WidgetSize) => void;
  saveLayout: () => Promise<void>;
  cancelEdit: () => void;
  resetLayout: () => void;
}

interface UseBentoGridOptions {
  initialLayout?: WidgetConfig[];
  isOwnProfile: boolean;
  onSave?: (layout: WidgetConfig[]) => Promise<void>;
}

export function useBentoGrid({
  initialLayout,
  isOwnProfile,
  onSave,
}: UseBentoGridOptions): UseBentoGridReturn {
  // Parse initial layout or use default
  const parsedInitial = React.useMemo(() => {
    if (!initialLayout || initialLayout.length === 0) {
      return DEFAULT_LAYOUT;
    }
    // Merge with defaults to ensure all widget types exist
    const layoutMap = new Map(initialLayout.map((w) => [w.id, w]));
    return DEFAULT_LAYOUT.map((defaultWidget) => {
      const saved = layoutMap.get(defaultWidget.id);
      return saved ? { ...defaultWidget, ...saved } : defaultWidget;
    });
  }, [initialLayout]);

  const [widgets, setWidgets] = React.useState<WidgetConfig[]>(parsedInitial);
  const [savedWidgets, setSavedWidgets] = React.useState<WidgetConfig[]>(parsedInitial);
  const [isEditMode, setIsEditMode] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  // Computed values
  const visibleWidgets = React.useMemo(
    () => widgets.filter((w) => w.visible).sort((a, b) => a.order - b.order),
    [widgets]
  );

  const hiddenWidgets = React.useMemo(
    () => widgets.filter((w) => !w.visible).sort((a, b) => a.order - b.order),
    [widgets]
  );

  const isDirty = React.useMemo(() => {
    return JSON.stringify(widgets) !== JSON.stringify(savedWidgets);
  }, [widgets, savedWidgets]);

  // Toggle edit mode
  const toggleEditMode = React.useCallback(() => {
    if (!isOwnProfile) return;
    setIsEditMode((prev) => !prev);
  }, [isOwnProfile]);

  // Reorder widgets via drag-drop
  const reorderWidgets = React.useCallback((activeId: string, overId: string) => {
    if (activeId === overId) return;

    setWidgets((prev) => {
      const activeIndex = prev.findIndex((w) => w.id === activeId);
      const overIndex = prev.findIndex((w) => w.id === overId);

      if (activeIndex === -1 || overIndex === -1) return prev;

      const newWidgets = [...prev];
      const [removed] = newWidgets.splice(activeIndex, 1);
      newWidgets.splice(overIndex, 0, removed);

      // Update order values
      return newWidgets.map((w, i) => ({ ...w, order: i }));
    });
  }, []);

  // Toggle widget visibility
  const toggleVisibility = React.useCallback((widgetId: string) => {
    setWidgets((prev) =>
      prev.map((w) =>
        w.id === widgetId ? { ...w, visible: !w.visible } : w
      )
    );
  }, []);

  // Resize widget
  const resizeWidget = React.useCallback((widgetId: string, size: WidgetSize) => {
    setWidgets((prev) =>
      prev.map((w) =>
        w.id === widgetId ? { ...w, size } : w
      )
    );
  }, []);

  // Save layout
  const saveLayout = React.useCallback(async () => {
    if (!isOwnProfile || !isDirty) return;

    setIsSaving(true);
    try {
      if (onSave) {
        await onSave(widgets);
      } else {
        // Default save to API
        const response = await fetch('/api/profile/v2', {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            grid: {
              cards: widgets.map((w) => ({
                id: w.id,
                type: w.type,
                size: w.size,
                visible: w.visible,
                position: { x: 0, y: w.order },
              })),
              lastModified: new Date(),
            },
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to save layout');
        }
      }

      setSavedWidgets(widgets);
      setIsEditMode(false);
    } catch (err) {
      logger.error('Failed to save bento layout', { component: 'useBentoGrid' }, err instanceof Error ? err : undefined);
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [isOwnProfile, isDirty, widgets, onSave]);

  // Cancel edit and revert changes
  const cancelEdit = React.useCallback(() => {
    setWidgets(savedWidgets);
    setIsEditMode(false);
  }, [savedWidgets]);

  // Reset to default layout
  const resetLayout = React.useCallback(() => {
    setWidgets(DEFAULT_LAYOUT);
  }, []);

  return {
    widgets,
    visibleWidgets,
    hiddenWidgets,
    isEditMode,
    isDirty,
    isSaving,
    toggleEditMode,
    reorderWidgets,
    toggleVisibility,
    resizeWidget,
    saveLayout,
    cancelEdit,
    resetLayout,
  };
}

export { DEFAULT_LAYOUT };
