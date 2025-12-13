/**
 * Widget Priority Engine
 *
 * Score-based ordering system for sidebar widgets with context modifiers.
 * Determines optimal widget visibility and ordering based on:
 * - Base priority per widget type
 * - User membership status
 * - Time-sensitive content (urgent events)
 * - Content availability (active tools, pinned messages)
 *
 * @example
 * const prioritized = prioritizeWidgets(widgets, {
 *   userMembership: 'member',
 *   hasUrgentEvent: true,
 *   hasActiveTools: true,
 * });
 */

// Widget types that can appear in sidebar
export type WidgetType =
  | 'pinned-messages'
  | 'about'
  | 'upcoming-events'
  | 'tools'
  | 'members'
  | 'leaders'
  | 'quick-actions'
  | 'custom';

export type UserMembership = 'visitor' | 'member' | 'leader' | 'owner';

// Base priority scores (higher = more important, appears higher)
const BASE_PRIORITIES: Record<WidgetType, number> = {
  'pinned-messages': 100,  // Always most important if present
  'about': 40,             // Important for context
  'upcoming-events': 70,   // Time-sensitive
  'tools': 60,             // Interactive features
  'members': 30,           // Social proof
  'leaders': 20,           // Secondary info
  'quick-actions': 50,     // Actionable items
  'custom': 35,            // User-added widgets
};

// Context modifiers
const MODIFIERS = {
  // Event urgency: +50 if event within 24h
  URGENT_EVENT: 50,

  // Active content: +20 if widget has active/recent content
  HAS_CONTENT: 20,

  // Visitor boost: +30 to about for visitors
  VISITOR_ABOUT_BOOST: 30,

  // Leader boost: +25 to tools for leaders (they configure)
  LEADER_TOOLS_BOOST: 25,

  // Pinned messages with recent activity: +10
  RECENT_PINS: 10,

  // Empty penalty: -100 if widget would be empty
  EMPTY_PENALTY: -100,
};

export interface WidgetData {
  type: WidgetType;
  id: string;
  /** Whether widget has any content to show */
  hasContent: boolean;
  /** For events: is there one within 24h */
  isUrgent?: boolean;
  /** For pinned: recent pin activity */
  hasRecentActivity?: boolean;
  /** Custom priority override (optional) */
  priorityOverride?: number;
  /** Whether to force show regardless of score */
  forceShow?: boolean;
  /** Whether to force hide regardless of score */
  forceHide?: boolean;
}

export interface PriorityContext {
  userMembership: UserMembership;
  /** Maximum number of widgets to show expanded */
  maxExpanded?: number;
  /** Minimum score to be visible */
  visibilityThreshold?: number;
}

export interface PrioritizedWidget extends WidgetData {
  /** Calculated priority score */
  score: number;
  /** Whether widget should be visible */
  isVisible: boolean;
  /** Whether widget should start expanded */
  defaultExpanded: boolean;
  /** Position in sidebar (0 = top) */
  position: number;
}

/**
 * Calculate priority score for a single widget
 */
export function calculateWidgetScore(
  widget: WidgetData,
  context: PriorityContext
): number {
  // Use override if provided
  if (widget.priorityOverride !== undefined) {
    return widget.priorityOverride;
  }

  // Start with base priority
  let score = BASE_PRIORITIES[widget.type] ?? 0;

  // Apply empty penalty
  if (!widget.hasContent) {
    score += MODIFIERS.EMPTY_PENALTY;
  }

  // Apply context-specific modifiers
  switch (widget.type) {
    case 'upcoming-events':
      if (widget.isUrgent) {
        score += MODIFIERS.URGENT_EVENT;
      }
      break;

    case 'about':
      if (context.userMembership === 'visitor') {
        score += MODIFIERS.VISITOR_ABOUT_BOOST;
      }
      break;

    case 'tools':
      if (context.userMembership === 'leader' || context.userMembership === 'owner') {
        score += MODIFIERS.LEADER_TOOLS_BOOST;
      }
      if (widget.hasContent) {
        score += MODIFIERS.HAS_CONTENT;
      }
      break;

    case 'pinned-messages':
      if (widget.hasRecentActivity) {
        score += MODIFIERS.RECENT_PINS;
      }
      break;

    case 'members':
    case 'leaders':
      if (widget.hasContent) {
        score += MODIFIERS.HAS_CONTENT;
      }
      break;
  }

  return score;
}

/**
 * Determine if widget should be expanded by default
 */
export function shouldExpandByDefault(
  widget: WidgetData,
  score: number,
  context: PriorityContext,
  position: number
): boolean {
  // Force states
  if (widget.forceShow) return true;
  if (widget.forceHide) return false;

  // No content = collapsed
  if (!widget.hasContent) return false;

  // Top N widgets expanded (default 3)
  const maxExpanded = context.maxExpanded ?? 3;
  if (position < maxExpanded && score > 0) {
    return true;
  }

  // Special cases that should always expand
  if (widget.type === 'pinned-messages' && widget.hasContent) {
    return true;
  }

  if (widget.type === 'upcoming-events' && widget.isUrgent) {
    return true;
  }

  return false;
}

/**
 * Prioritize and order widgets based on context
 */
export function prioritizeWidgets(
  widgets: WidgetData[],
  context: PriorityContext
): PrioritizedWidget[] {
  const visibilityThreshold = context.visibilityThreshold ?? -50;

  // Calculate scores
  const scored = widgets.map(widget => ({
    ...widget,
    score: calculateWidgetScore(widget, context),
  }));

  // Sort by score (descending)
  const sorted = [...scored].sort((a, b) => b.score - a.score);

  // Apply visibility and expansion
  return sorted.map((widget, index) => {
    const isVisible =
      widget.forceShow ||
      (!widget.forceHide && widget.score >= visibilityThreshold);

    return {
      ...widget,
      isVisible,
      defaultExpanded: shouldExpandByDefault(widget, widget.score, context, index),
      position: index,
    };
  });
}

/**
 * Get default widget configuration for a space
 */
export function getDefaultWidgets(
  context: PriorityContext,
  data: {
    hasPinnedMessages?: boolean;
    hasEvents?: boolean;
    hasUrgentEvent?: boolean;
    hasTools?: boolean;
    memberCount?: number;
  }
): WidgetData[] {
  return [
    {
      type: 'pinned-messages',
      id: 'pinned-messages',
      hasContent: data.hasPinnedMessages ?? false,
      hasRecentActivity: false,
    },
    {
      type: 'about',
      id: 'about',
      hasContent: true, // About always has content (space description)
    },
    {
      type: 'upcoming-events',
      id: 'upcoming-events',
      hasContent: data.hasEvents ?? false,
      isUrgent: data.hasUrgentEvent ?? false,
    },
    {
      type: 'tools',
      id: 'tools',
      hasContent: data.hasTools ?? false,
    },
    {
      type: 'members',
      id: 'members',
      hasContent: (data.memberCount ?? 0) > 0,
    },
    {
      type: 'leaders',
      id: 'leaders',
      hasContent: true, // Leaders always exist
    },
  ];
}

/**
 * Hook-friendly function to get prioritized widget state
 */
export function getWidgetPriorityState(
  widgets: WidgetData[],
  context: PriorityContext
): {
  orderedWidgets: PrioritizedWidget[];
  visibleWidgets: PrioritizedWidget[];
  expandedWidgetIds: Set<string>;
  collapsedWidgetIds: Set<string>;
} {
  const prioritized = prioritizeWidgets(widgets, context);
  const visible = prioritized.filter(w => w.isVisible);

  const expandedIds = new Set<string>();
  const collapsedIds = new Set<string>();

  for (const widget of visible) {
    if (widget.defaultExpanded) {
      expandedIds.add(widget.id);
    } else {
      collapsedIds.add(widget.id);
    }
  }

  return {
    orderedWidgets: prioritized,
    visibleWidgets: visible,
    expandedWidgetIds: expandedIds,
    collapsedWidgetIds: collapsedIds,
  };
}

// Re-export types for consumers
export type { PrioritizedWidget as WidgetPriority };
