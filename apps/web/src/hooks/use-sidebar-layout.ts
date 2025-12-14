'use client';

/**
 * useSidebarLayout - Hook for managing HiveLab-powered space sidebar
 *
 * Manages the sidebar layout state for a space, including:
 * - Loading and persisting sidebar slot configuration
 * - Adding, removing, and reordering widgets
 * - Toggling collapse state
 * - Auto-deploying universal default template for new spaces
 *
 * @author HIVE Frontend Team
 * @version 1.0.0
 */

import { useState, useEffect, useCallback } from 'react';
import { secureApiFetch } from '@/lib/secure-auth-utils';

// ============================================================
// Types
// ============================================================

export interface SidebarSlot {
  /** Unique slot ID */
  slotId: string;
  /** HiveLab tool ID (null for system templates) */
  toolId: string | null;
  /** Deployment reference ID */
  deploymentId: string;
  /** Display name */
  name: string;
  /** Tool type/category */
  type: string;
  /** Slot order position */
  order: number;
  /** Whether collapsed */
  collapsed: boolean;
  /** Tool-specific configuration */
  config: Record<string, unknown>;
}

export interface UseSidebarLayoutOptions {
  /** Space ID */
  spaceId: string;
  /** Whether to auto-deploy universal template for new spaces */
  autoDeployDefault?: boolean;
}

export interface UseSidebarLayoutReturn {
  /** Current sidebar slots */
  slots: SidebarSlot[];
  /** Loading state */
  isLoading: boolean;
  /** Saving state */
  isSaving: boolean;
  /** Error message */
  error: string | null;
  /** Add a widget to the sidebar */
  addWidget: (widget: {
    toolId: string | null;
    name: string;
    type: string;
    config?: Record<string, unknown>;
  }) => Promise<void>;
  /** Remove a widget from the sidebar */
  removeWidget: (slotId: string) => Promise<void>;
  /** Reorder widgets */
  reorderWidgets: (newOrder: SidebarSlot[]) => Promise<void>;
  /** Toggle widget collapse state */
  toggleCollapse: (slotId: string) => void;
  /** Update widget configuration */
  updateWidgetConfig: (slotId: string, config: Record<string, unknown>) => Promise<void>;
  /** Refresh sidebar layout */
  refresh: () => Promise<void>;
}

// ============================================================
// Universal Default Template
// ============================================================

const UNIVERSAL_DEFAULT_SLOTS: Omit<SidebarSlot, 'deploymentId'>[] = [
  {
    slotId: 'slot-about',
    toolId: 'sys-about',
    name: 'About',
    type: 'space-stats',
    order: 0,
    collapsed: false,
    config: { showMembers: true, showOnline: true },
  },
  {
    slotId: 'slot-events',
    toolId: 'sys-events',
    name: 'Upcoming Events',
    type: 'space-events',
    order: 1,
    collapsed: false,
    config: { maxEvents: 5, showRsvp: true },
  },
  {
    slotId: 'slot-members',
    toolId: 'sys-members',
    name: 'Members',
    type: 'member-list',
    order: 2,
    collapsed: true,
    config: { maxVisible: 8, showRoles: true },
  },
];

// ============================================================
// Hook
// ============================================================

export function useSidebarLayout({
  spaceId,
  autoDeployDefault = true,
}: UseSidebarLayoutOptions): UseSidebarLayoutReturn {
  const [slots, setSlots] = useState<SidebarSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load sidebar layout
  const loadLayout = useCallback(async () => {
    if (!spaceId) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await secureApiFetch(`/api/spaces/${spaceId}/sidebar`);

      if (!res.ok) {
        // If no sidebar exists and autoDeployDefault is true, use defaults
        if (res.status === 404 && autoDeployDefault) {
          const defaultSlots: SidebarSlot[] = UNIVERSAL_DEFAULT_SLOTS.map((slot) => ({
            ...slot,
            deploymentId: `default-${slot.slotId}`,
          }));
          setSlots(defaultSlots);
          return;
        }
        throw new Error('Failed to load sidebar layout');
      }

      const data = await res.json();
      const loadedSlots = Array.isArray(data.slots) ? data.slots : [];

      // If no slots exist and autoDeployDefault is true, use defaults
      if (loadedSlots.length === 0 && autoDeployDefault) {
        const defaultSlots: SidebarSlot[] = UNIVERSAL_DEFAULT_SLOTS.map((slot) => ({
          ...slot,
          deploymentId: `default-${slot.slotId}`,
        }));
        setSlots(defaultSlots);
      } else {
        setSlots(loadedSlots);
      }
    } catch (err) {
      // On error, still show defaults for better UX
      if (autoDeployDefault) {
        const defaultSlots: SidebarSlot[] = UNIVERSAL_DEFAULT_SLOTS.map((slot) => ({
          ...slot,
          deploymentId: `default-${slot.slotId}`,
        }));
        setSlots(defaultSlots);
      }
      setError(err instanceof Error ? err.message : 'Failed to load sidebar');
    } finally {
      setIsLoading(false);
    }
  }, [spaceId, autoDeployDefault]);

  // Load on mount
  useEffect(() => {
    void loadLayout();
  }, [loadLayout]);

  // Save layout to API
  const saveLayout = useCallback(
    async (newSlots: SidebarSlot[]) => {
      if (!spaceId) return;

      setIsSaving(true);
      try {
        await secureApiFetch(`/api/spaces/${spaceId}/sidebar`, {
          method: 'PUT',
          body: JSON.stringify({ slots: newSlots }),
        });
      } catch {
        // Silently fail - optimistic update already applied
      } finally {
        setIsSaving(false);
      }
    },
    [spaceId]
  );

  // Add widget
  const addWidget = useCallback(
    async (widget: {
      toolId: string | null;
      name: string;
      type: string;
      config?: Record<string, unknown>;
    }) => {
      const newSlot: SidebarSlot = {
        slotId: `slot-${Date.now()}`,
        toolId: widget.toolId,
        deploymentId: `deployment-${Date.now()}`,
        name: widget.name,
        type: widget.type,
        order: slots.length,
        collapsed: false,
        config: widget.config || {},
      };

      const newSlots = [...slots, newSlot];
      setSlots(newSlots);
      await saveLayout(newSlots);
    },
    [slots, saveLayout]
  );

  // Remove widget
  const removeWidget = useCallback(
    async (slotId: string) => {
      const newSlots = slots
        .filter((s) => s.slotId !== slotId)
        .map((s, index) => ({ ...s, order: index }));

      setSlots(newSlots);
      await saveLayout(newSlots);
    },
    [slots, saveLayout]
  );

  // Reorder widgets
  const reorderWidgets = useCallback(
    async (newOrder: SidebarSlot[]) => {
      const reorderedSlots = newOrder.map((s, index) => ({ ...s, order: index }));
      setSlots(reorderedSlots);
      await saveLayout(reorderedSlots);
    },
    [saveLayout]
  );

  // Toggle collapse
  const toggleCollapse = useCallback((slotId: string) => {
    setSlots((prev) =>
      prev.map((s) =>
        s.slotId === slotId ? { ...s, collapsed: !s.collapsed } : s
      )
    );
    // Note: Not persisting collapse state to API for now (local preference)
  }, []);

  // Update widget config
  const updateWidgetConfig = useCallback(
    async (slotId: string, config: Record<string, unknown>) => {
      const newSlots = slots.map((s) =>
        s.slotId === slotId ? { ...s, config: { ...s.config, ...config } } : s
      );
      setSlots(newSlots);
      await saveLayout(newSlots);
    },
    [slots, saveLayout]
  );

  return {
    slots,
    isLoading,
    isSaving,
    error,
    addWidget,
    removeWidget,
    reorderWidgets,
    toggleCollapse,
    updateWidgetConfig,
    refresh: loadLayout,
  };
}

export default useSidebarLayout;
