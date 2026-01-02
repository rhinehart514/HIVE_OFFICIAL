"use client";

/**
 * SpaceDynamicContent - Tab-Aware Content Renderer
 *
 * Renders different content based on active tab type:
 * - feed: Post feed with composer
 * - widget: Widget grid (leader-editable)
 * - resource: Files/links view
 * - custom: Custom content area
 *
 * Features:
 * - T2 motion tier transitions between tabs
 * - Widget drag-and-drop for leaders
 * - Empty states per content type
 * - Responsive layout (uses SpaceSplitLayout)
 *
 * @author HIVE Frontend Team
 * @version 1.0.0
 */

import * as React from "react";
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  type Variants,
  Reorder,
} from "framer-motion";
import {
  MessageSquare,
  LayoutGrid,
  FolderOpen,
  Layers,
  Plus,
  GripVertical,
  Settings2,
  Calendar,
  BarChart3,
  Link2,
  FileText,
  Rss,
} from "lucide-react";
import { cn } from "../../../lib/utils";
import { springPresets, easingArrays } from "@hive/tokens";
import { GlassCard, GlassWidget } from "../atoms/glass-surface";
import { SpaceSplitLayout } from "../layouts/space-split-layout";
import { CollapsibleWidget } from "../molecules/collapsible-widget";
import {
  sectionRevealVariants,
  listStaggerVariants,
  staggerItemVariants,
} from "../../../lib/motion-variants-spaces";

// ============================================================
// Types
// ============================================================

export type TabContentType = "feed" | "widget" | "resource" | "custom";

export interface SpaceWidget {
  id: string;
  type: "calendar" | "poll" | "links" | "files" | "rss" | "custom";
  title: string;
  config: Record<string, unknown>;
  order: number;
  isEnabled: boolean;
  isVisible: boolean;
}

export interface SpaceDynamicContentProps {
  /** Active tab type */
  tabType: TabContentType;
  /** Active tab ID */
  tabId: string;
  /** Active tab name (for display) */
  tabName?: string;
  /** Widgets to render (for widget tabs) */
  widgets: SpaceWidget[];
  /** Whether user is space leader */
  isLeader: boolean;
  /** Whether currently in edit mode (leaders only) */
  isEditMode?: boolean;
  /** Toggle edit mode */
  onToggleEditMode?: () => void;
  /** Callback for widget reorder */
  onWidgetReorder?: (orderedIds: string[]) => void;
  /** Callback for adding widget */
  onAddWidget?: () => void;
  /** Callback for editing widget */
  onEditWidget?: (widgetId: string) => void;
  /** Callback for removing widget */
  onRemoveWidget?: (widgetId: string) => void;
  /** Sidebar content (rendered in 40% rail) */
  sidebar?: React.ReactNode;
  /** Mobile inline sections */
  mobileInlineSections?: React.ReactNode;
  /** Feed content (slot for feed tab) */
  feedContent?: React.ReactNode;
  /** Resource content (slot for resource tab) */
  resourceContent?: React.ReactNode;
  /** Custom content (slot for custom tab) */
  customContent?: React.ReactNode;
  /** Loading state */
  isLoading?: boolean;
  /** Additional className */
  className?: string;
}

// ============================================================
// Motion Variants (T2 Medium)
// ============================================================

const contentTransitionVariants: Variants = {
  initial: {
    opacity: 0,
    y: 16,
    scale: 0.98,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: easingArrays.silk,
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    scale: 0.99,
    transition: {
      duration: 0.2,
      ease: easingArrays.default,
    },
  },
};

const widgetGridVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
};

const widgetCardVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: springPresets.snappy,
  },
  hover: {
    y: -4,
    boxShadow: "0 16px 32px rgba(0,0,0,0.25)",
    transition: { duration: 0.2 },
  },
  dragging: {
    scale: 1.02,
    boxShadow: "0 24px 48px rgba(0,0,0,0.35), 0 0 0 2px rgba(255,215,0,0.3)",
    zIndex: 50,
  },
};

const emptyStateVariants: Variants = {
  initial: { opacity: 0, scale: 0.9 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: easingArrays.silk,
    },
  },
};

// ============================================================
// Subcomponents
// ============================================================

const WIDGET_ICONS: Record<SpaceWidget["type"], React.ComponentType<{ className?: string }>> = {
  calendar: Calendar,
  poll: BarChart3,
  links: Link2,
  files: FileText,
  rss: Rss,
  custom: Layers,
};

interface DraggableWidgetCardProps {
  widget: SpaceWidget;
  isLeader: boolean;
  isEditMode: boolean;
  onEdit?: () => void;
  onRemove?: () => void;
}

function DraggableWidgetCard({
  widget,
  isLeader,
  isEditMode,
  onEdit,
  onRemove,
}: DraggableWidgetCardProps) {
  const Icon = WIDGET_ICONS[widget.type] || Layers;

  return (
    <motion.div
      variants={widgetCardVariants}
      whileHover={!isEditMode ? "hover" : undefined}
      className={cn(
        "relative",
        isEditMode && "cursor-grab active:cursor-grabbing"
      )}
    >
      <GlassCard className="p-4 min-h-[120px]">
        {/* Edit mode drag handle */}
        {isEditMode && (
          <div className="absolute top-2 left-2 text-neutral-500">
            <GripVertical className="w-4 h-4" />
          </div>
        )}

        {/* Widget header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-white/[0.06]">
              <Icon className="w-4 h-4 text-neutral-400" />
            </div>
            <h3 className="font-medium text-sm text-neutral-100">
              {widget.title}
            </h3>
          </div>

          {/* Edit/Remove buttons (edit mode only) */}
          {isEditMode && isLeader && (
            <div className="flex items-center gap-1">
              <button
                onClick={onEdit}
                className="p-1 rounded hover:bg-white/10 text-neutral-400 hover:text-neutral-200 transition-colors"
                aria-label="Edit widget"
              >
                <Settings2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onRemove}
                className="p-1 rounded hover:bg-red-500/20 text-neutral-400 hover:text-red-400 transition-colors"
                aria-label="Remove widget"
              >
                <span className="text-xs font-bold">&times;</span>
              </button>
            </div>
          )}
        </div>

        {/* Widget content placeholder */}
        <div className="text-sm text-neutral-400">
          {widget.type === "calendar" && "Upcoming events will appear here"}
          {widget.type === "poll" && "Active polls will appear here"}
          {widget.type === "links" && "Quick links will appear here"}
          {widget.type === "files" && "Shared files will appear here"}
          {widget.type === "rss" && "RSS feed items will appear here"}
          {widget.type === "custom" && "Custom widget content"}
        </div>
      </GlassCard>
    </motion.div>
  );
}

interface EmptyStateProps {
  type: TabContentType;
  isLeader: boolean;
  onAddWidget?: () => void;
}

function EmptyState({ type, isLeader, onAddWidget }: EmptyStateProps) {
  const content = {
    feed: {
      icon: MessageSquare,
      title: "No posts yet",
      description: "Be the first to start a conversation in this space.",
      action: null,
    },
    widget: {
      icon: LayoutGrid,
      title: "No widgets configured",
      description: isLeader
        ? "Add widgets to customize this tab for your members."
        : "The space leader hasn't added any widgets yet.",
      action: isLeader ? "Add Widget" : null,
    },
    resource: {
      icon: FolderOpen,
      title: "No resources shared",
      description: isLeader
        ? "Share files, links, and documents with your members."
        : "No resources have been shared in this space yet.",
      action: isLeader ? "Add Resource" : null,
    },
    custom: {
      icon: Layers,
      title: "Custom content area",
      description: isLeader
        ? "Configure this tab with custom content."
        : "This tab is being set up by the space leader.",
      action: isLeader ? "Configure" : null,
    },
  };

  const { icon: Icon, title, description, action } = content[type];

  return (
    <motion.div
      variants={emptyStateVariants}
      initial="initial"
      animate="animate"
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-neutral-800/50 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-neutral-500" />
      </div>
      <h3 className="text-lg font-medium text-neutral-200 mb-2">{title}</h3>
      <p className="text-sm text-neutral-400 max-w-sm mb-6">{description}</p>
      {action && onAddWidget && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onAddWidget}
          className={cn(
            "inline-flex items-center gap-2 px-4 py-2",
            "bg-[#FFD700] text-black font-medium text-sm rounded-lg",
            "hover:bg-[#FFD700]/90 transition-colors",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
          )}
        >
          <Plus className="w-4 h-4" />
          <span>{action}</span>
        </motion.button>
      )}
    </motion.div>
  );
}

interface LoadingSkeletonProps {
  type: TabContentType;
}

function LoadingSkeleton({ type }: LoadingSkeletonProps) {
  const skeletonCount = type === "widget" ? 4 : 3;

  return (
    <div className="space-y-4 animate-pulse">
      {Array.from({ length: skeletonCount }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "rounded-2xl bg-neutral-800/30",
            type === "widget" ? "h-32" : "h-24"
          )}
        />
      ))}
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================

export function SpaceDynamicContent({
  tabType,
  tabId,
  tabName,
  widgets,
  isLeader,
  isEditMode = false,
  onToggleEditMode,
  onWidgetReorder,
  onAddWidget,
  onEditWidget,
  onRemoveWidget,
  sidebar,
  mobileInlineSections,
  feedContent,
  resourceContent,
  customContent,
  isLoading = false,
  className,
}: SpaceDynamicContentProps) {
  const shouldReduceMotion = useReducedMotion();
  const [widgetOrder, setWidgetOrder] = React.useState<string[]>([]);

  // Initialize widget order when widgets change
  React.useEffect(() => {
    const sortedIds = [...widgets]
      .filter((w) => w.isEnabled && w.isVisible)
      .sort((a, b) => a.order - b.order)
      .map((w) => w.id);
    setWidgetOrder(sortedIds);
  }, [widgets]);

  // Handle widget reorder
  const handleReorder = React.useCallback(
    (newOrder: string[]) => {
      setWidgetOrder(newOrder);
      onWidgetReorder?.(newOrder);
    },
    [onWidgetReorder]
  );

  // Get widgets in order
  const orderedWidgets = React.useMemo(() => {
    return widgetOrder
      .map((id) => widgets.find((w) => w.id === id))
      .filter(Boolean) as SpaceWidget[];
  }, [widgetOrder, widgets]);

  // Render main content based on tab type
  const renderMainContent = () => {
    if (isLoading) {
      return <LoadingSkeleton type={tabType} />;
    }

    switch (tabType) {
      case "feed":
        return feedContent || <EmptyState type="feed" isLeader={isLeader} />;

      case "widget":
        if (orderedWidgets.length === 0) {
          return (
            <EmptyState
              type="widget"
              isLeader={isLeader}
              onAddWidget={onAddWidget}
            />
          );
        }

        return (
          <div className="space-y-4">
            {/* Edit mode toggle for leaders */}
            {isLeader && onToggleEditMode && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-400">
                  {isEditMode
                    ? "Drag widgets to reorder"
                    : `${orderedWidgets.length} widgets`}
                </span>
                <button
                  onClick={onToggleEditMode}
                  className={cn(
                    "text-sm font-medium px-3 py-1.5 rounded-lg transition-colors",
                    isEditMode
                      ? "bg-white/[0.12] text-white border border-white/20"
                      : "text-neutral-400 hover:text-neutral-200 hover:bg-white/5"
                  )}
                >
                  {isEditMode ? "Done Editing" : "Edit Layout"}
                </button>
              </div>
            )}

            {/* Widget grid - draggable if edit mode */}
            {isEditMode && isLeader ? (
              <Reorder.Group
                axis="y"
                values={widgetOrder}
                onReorder={handleReorder}
                className="grid gap-4 md:grid-cols-2"
              >
                {orderedWidgets.map((widget) => (
                  <Reorder.Item
                    key={widget.id}
                    value={widget.id}
                    className="cursor-grab active:cursor-grabbing"
                  >
                    <DraggableWidgetCard
                      widget={widget}
                      isLeader={isLeader}
                      isEditMode={isEditMode}
                      onEdit={() => onEditWidget?.(widget.id)}
                      onRemove={() => onRemoveWidget?.(widget.id)}
                    />
                  </Reorder.Item>
                ))}
              </Reorder.Group>
            ) : (
              <motion.div
                variants={shouldReduceMotion ? undefined : widgetGridVariants}
                initial="hidden"
                animate="visible"
                className="grid gap-4 md:grid-cols-2"
              >
                {orderedWidgets.map((widget) => (
                  <DraggableWidgetCard
                    key={widget.id}
                    widget={widget}
                    isLeader={isLeader}
                    isEditMode={false}
                  />
                ))}
              </motion.div>
            )}

            {/* Add widget button for leaders */}
            {isLeader && onAddWidget && (
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={onAddWidget}
                className={cn(
                  "w-full py-4 rounded-2xl",
                  "border-2 border-dashed border-neutral-700 hover:border-white/30",
                  "text-neutral-500 hover:text-neutral-300",
                  "flex items-center justify-center gap-2",
                  "transition-colors duration-200"
                )}
              >
                <Plus className="w-5 h-5" />
                <span className="font-medium">Add Widget</span>
              </motion.button>
            )}
          </div>
        );

      case "resource":
        return (
          resourceContent || (
            <EmptyState
              type="resource"
              isLeader={isLeader}
              onAddWidget={onAddWidget}
            />
          )
        );

      case "custom":
        return (
          customContent || (
            <EmptyState
              type="custom"
              isLeader={isLeader}
              onAddWidget={onAddWidget}
            />
          )
        );

      default:
        return null;
    }
  };

  return (
    <SpaceSplitLayout
      sidebar={sidebar}
      mobileInlineSections={mobileInlineSections}
      containerWidth="7xl"
      animate={!shouldReduceMotion}
      className={className}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={tabId}
          variants={shouldReduceMotion ? undefined : contentTransitionVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          {renderMainContent()}
        </motion.div>
      </AnimatePresence>
    </SpaceSplitLayout>
  );
}

// ============================================================
// Exports
// ============================================================

export default SpaceDynamicContent;
