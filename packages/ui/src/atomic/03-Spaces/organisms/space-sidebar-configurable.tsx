'use client';

/**
 * SpaceSidebarConfigurable - HiveLab-powered sidebar for Spaces
 *
 * A fully configurable sidebar where every widget is a deployed HiveLab tool.
 * Leaders can enter edit mode to drag-and-drop reorder widgets, configure them,
 * or remove them. New widgets can be added from the Widget Gallery.
 *
 * Philosophy: "Everything is a Tool" - no hard-coded widgets.
 *
 * ## Visual Language
 * - Edit mode: gold border, drag handles visible
 * - Collapsible widget cards
 * - [+ Add Widget] CTA at bottom (leaders only)
 * - Smooth reorder animations
 *
 * @author HIVE Frontend Team
 * @version 1.0.0
 */

import * as React from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { Edit3, Plus, X, Info, Calendar, Users, Wrench } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { SidebarToolSlot, type SidebarSlotData } from '../molecules/sidebar-tool-slot';

// ============================================================
// Types
// ============================================================

/** Event data for sidebar display */
export interface SidebarEventData {
  id: string;
  title: string;
  date: Date;
  location?: string;
}

/** Member data for sidebar display */
export interface SidebarMemberData {
  id: string;
  name: string;
  avatarUrl?: string;
  isOnline?: boolean;
}

/** Tool data for sidebar display */
export interface SidebarToolData {
  id: string;
  name: string;
  icon?: string;
  description?: string;
}

export interface SpaceSidebarConfigurableProps {
  /** Sidebar slots/widgets */
  slots: SidebarSlotData[];
  /** Space ID for tool runtime context */
  spaceId: string;
  /** Whether user is a space leader */
  isLeader?: boolean;
  /** Whether edit mode is currently active */
  isEditMode?: boolean;
  /** Callback when edit mode toggles */
  onEditModeChange?: (editMode: boolean) => void;
  /** Callback when a widget is clicked (to open tool) */
  onWidgetClick?: (slot: SidebarSlotData) => void;
  /** Callback when add widget is clicked */
  onAddWidget?: () => void;
  /** Callback when a widget is removed */
  onRemoveWidget?: (slotId: string) => void;
  /** Callback when a widget is configured */
  onConfigureWidget?: (slotId: string) => void;
  /** Callback when widget collapse state changes */
  onToggleCollapse?: (slotId: string) => void;
  /** Callback when widgets are reordered */
  onReorder?: (newOrder: SidebarSlotData[]) => void;
  /** Custom tool renderer for HiveLab tools (non-system) */
  renderCustomTool?: (slot: SidebarSlotData, spaceId: string) => React.ReactNode;
  /** Space metadata for rendering */
  spaceData?: {
    name?: string;
    description?: string;
    memberCount?: number;
    onlineCount?: number;
    category?: string;
  };
  /** Upcoming events for sys-events widget */
  events?: SidebarEventData[];
  /** Members to display in sys-members widget */
  members?: SidebarMemberData[];
  /** Deployed tools for sys-tools widget */
  tools?: SidebarToolData[];
  /** Callback when an event is clicked */
  onEventClick?: (eventId: string) => void;
  /** Callback when a member is clicked */
  onMemberClick?: (memberId: string) => void;
  /** Callback when a tool is clicked */
  onToolClick?: (toolId: string) => void;
  /** Loading state */
  isLoading?: boolean;
  /** Additional className */
  className?: string;
}

// ============================================================
// System Tool Renderers
// ============================================================

function AboutToolContent({
  spaceData,
}: {
  spaceData?: SpaceSidebarConfigurableProps['spaceData'];
}) {
  return (
    <div className="space-y-3">
      {spaceData?.description && (
        <p className="text-sm text-neutral-300 leading-relaxed">
          {spaceData.description}
        </p>
      )}
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1.5">
          <Users className="w-4 h-4 text-neutral-500" />
          <span className="text-white font-medium">
            {spaceData?.memberCount ?? 0}
          </span>
          <span className="text-neutral-500">members</span>
        </div>
        {(spaceData?.onlineCount ?? 0) > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#FFD700] animate-pulse" />
            <span className="text-[#FFD700] font-medium">
              {spaceData?.onlineCount}
            </span>
            <span className="text-neutral-500">online</span>
          </div>
        )}
      </div>
    </div>
  );
}

function EventsToolContent({
  events = [],
  onEventClick,
}: {
  events?: SidebarEventData[];
  onEventClick?: (eventId: string) => void;
}) {
  if (events.length === 0) {
    return (
      <div className="text-sm text-neutral-400">
        <div className="flex items-center gap-2 py-2">
          <Calendar className="w-4 h-4 text-neutral-500" />
          <span>No upcoming events</span>
        </div>
      </div>
    );
  }

  // Format relative date
  const formatRelativeDate = (date: Date) => {
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-2">
      {events.slice(0, 3).map((event) => (
        <button
          key={event.id}
          onClick={() => onEventClick?.(event.id)}
          className="w-full text-left flex items-center gap-2 py-1.5 px-2 -mx-2 rounded-lg hover:bg-white/5 transition-colors"
        >
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#FFD700]/10 flex items-center justify-center">
            <Calendar className="w-4 h-4 text-[#FFD700]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white truncate">{event.title}</p>
            <p className="text-xs text-neutral-500">{formatRelativeDate(event.date)}</p>
          </div>
        </button>
      ))}
      {events.length > 3 && (
        <p className="text-xs text-neutral-500 text-center pt-1">
          +{events.length - 3} more
        </p>
      )}
    </div>
  );
}

function MembersToolContent({
  members = [],
  onMemberClick,
}: {
  members?: SidebarMemberData[];
  onMemberClick?: (memberId: string) => void;
}) {
  if (members.length === 0) {
    return (
      <div className="text-sm text-neutral-400">
        <div className="flex items-center gap-2 py-2">
          <Users className="w-4 h-4 text-neutral-500" />
          <span>No members yet</span>
        </div>
      </div>
    );
  }

  // Show avatars stacked with online indicator
  const displayMembers = members.slice(0, 8);
  const remainingCount = members.length - displayMembers.length;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1">
        {displayMembers.map((member) => (
          <button
            key={member.id}
            onClick={() => onMemberClick?.(member.id)}
            className="relative group"
            title={member.name}
          >
            <div className="w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center overflow-hidden ring-2 ring-neutral-900 group-hover:ring-[#FFD700]/30 transition-all">
              {member.avatarUrl ? (
                <img src={member.avatarUrl} alt={member.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs text-white font-medium">
                  {member.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            {member.isOnline && (
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 ring-2 ring-neutral-900" />
            )}
          </button>
        ))}
        {remainingCount > 0 && (
          <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center ring-2 ring-neutral-900">
            <span className="text-xs text-neutral-400">+{remainingCount}</span>
          </div>
        )}
      </div>
      <button
        onClick={() => onMemberClick?.('')}
        className="text-xs text-[#FFD700] hover:underline"
      >
        View all members
      </button>
    </div>
  );
}

function ToolsToolContent({
  tools = [],
  onToolClick,
}: {
  tools?: SidebarToolData[];
  onToolClick?: (toolId: string) => void;
}) {
  if (tools.length === 0) {
    return (
      <div className="text-sm text-neutral-400">
        <div className="flex items-center gap-2 py-2">
          <Wrench className="w-4 h-4 text-neutral-500" />
          <span>No tools deployed</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {tools.slice(0, 5).map((tool) => (
        <button
          key={tool.id}
          onClick={() => onToolClick?.(tool.id)}
          className="w-full text-left flex items-center gap-2 py-1.5 px-2 -mx-2 rounded-lg hover:bg-white/5 transition-colors group"
        >
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#FFD700]/10 flex items-center justify-center">
            {tool.icon ? (
              <span className="text-sm">{tool.icon}</span>
            ) : (
              <Wrench className="w-4 h-4 text-[#FFD700]" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white truncate group-hover:text-[#FFD700] transition-colors">
              {tool.name}
            </p>
            {tool.description && (
              <p className="text-xs text-neutral-500 truncate">{tool.description}</p>
            )}
          </div>
        </button>
      ))}
      {tools.length > 5 && (
        <p className="text-xs text-neutral-500 text-center pt-1">
          +{tools.length - 5} more tools
        </p>
      )}
    </div>
  );
}

// ============================================================
// Component
// ============================================================

export function SpaceSidebarConfigurable({
  slots,
  spaceId,
  isLeader = false,
  isEditMode = false,
  onEditModeChange,
  onWidgetClick,
  onAddWidget,
  onRemoveWidget,
  onConfigureWidget,
  onToggleCollapse,
  onReorder,
  renderCustomTool,
  spaceData,
  events = [],
  members = [],
  tools = [],
  onEventClick,
  onMemberClick,
  onToolClick,
  isLoading = false,
  className,
}: SpaceSidebarConfigurableProps) {
  // Internal edit mode state if not controlled
  const [internalEditMode, setInternalEditMode] = React.useState(false);
  const editMode = onEditModeChange ? isEditMode : internalEditMode;
  const setEditMode = onEditModeChange || setInternalEditMode;

  // Handle reorder
  const handleReorder = (newOrder: SidebarSlotData[]) => {
    onReorder?.(newOrder);
  };

  // Render content for a slot based on its type
  const renderSlotContent = (slot: SidebarSlotData) => {
    // System tools have special renderers
    if (slot.toolId?.startsWith('sys-')) {
      switch (slot.toolId) {
        case 'sys-about':
          return <AboutToolContent spaceData={spaceData} />;
        case 'sys-events':
          return <EventsToolContent events={events} onEventClick={onEventClick} />;
        case 'sys-members':
          return <MembersToolContent members={members} onMemberClick={onMemberClick} />;
        case 'sys-tools':
          return <ToolsToolContent tools={tools} onToolClick={onToolClick} />;
        default:
          return null;
      }
    }

    // Custom HiveLab tools - use the renderCustomTool prop if provided
    if (slot.toolId && renderCustomTool) {
      return renderCustomTool(slot, spaceId);
    }

    // Fallback for when no custom renderer is provided
    return (
      <div className="text-sm text-[#A1A1A6]">
        <div className="flex items-center gap-2 py-2">
          <Wrench className="w-4 h-4 text-[#818187]" />
          <span>{slot.name || 'Custom tool'}</span>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className={cn('h-full p-4 space-y-4', className)}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-xl bg-neutral-900/50 border border-neutral-800/50 animate-pulse"
          >
            <div className="h-10 border-b border-neutral-800/50" />
            <div className="p-3 space-y-2">
              <div className="h-4 bg-neutral-800 rounded w-3/4" />
              <div className="h-4 bg-neutral-800 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('h-full flex flex-col', className)}>
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-neutral-800/50">
        <h2 className="text-sm font-medium text-neutral-300">Widgets</h2>

        {/* Edit mode toggle (leaders only) */}
        {isLeader && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setEditMode(!editMode)}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium',
              'transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD700]/40',
              editMode
                ? 'bg-[#FFD700]/10 text-[#FFD700] border border-[#FFD700]/30'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            )}
          >
            {editMode ? (
              <>
                <X className="w-3.5 h-3.5" />
                Done
              </>
            ) : (
              <>
                <Edit3 className="w-3.5 h-3.5" />
                Edit
              </>
            )}
          </motion.button>
        )}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-4">
        {slots.length === 0 ? (
          <div className="text-center py-8">
            <Info className="w-8 h-8 mx-auto text-neutral-600 mb-3" />
            <p className="text-sm text-neutral-400">No widgets added yet</p>
            {isLeader && (
              <p className="text-xs text-neutral-500 mt-1">
                Click "Edit" to customize this sidebar
              </p>
            )}
          </div>
        ) : editMode ? (
          // Reorderable list in edit mode
          <Reorder.Group
            axis="y"
            values={slots}
            onReorder={handleReorder}
            className="space-y-3"
          >
            <AnimatePresence>
              {slots.map((slot) => (
                <Reorder.Item key={slot.slotId} value={slot}>
                  <SidebarToolSlot
                    slot={slot}
                    isEditMode={editMode}
                    onClick={() => onWidgetClick?.(slot)}
                    onConfigure={() => onConfigureWidget?.(slot.slotId)}
                    onRemove={() => onRemoveWidget?.(slot.slotId)}
                    onToggleCollapse={() => onToggleCollapse?.(slot.slotId)}
                  >
                    {renderSlotContent(slot)}
                  </SidebarToolSlot>
                </Reorder.Item>
              ))}
            </AnimatePresence>
          </Reorder.Group>
        ) : (
          // Static list in view mode
          <div className="space-y-3">
            <AnimatePresence>
              {slots.map((slot) => (
                <SidebarToolSlot
                  key={slot.slotId}
                  slot={slot}
                  isEditMode={false}
                  onClick={() => onWidgetClick?.(slot)}
                  onToggleCollapse={() => onToggleCollapse?.(slot.slotId)}
                >
                  {renderSlotContent(slot)}
                </SidebarToolSlot>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Add Widget button (edit mode only) */}
        {editMode && onAddWidget && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.01, borderColor: 'rgba(255, 215, 0, 0.5)' }}
            whileTap={{ scale: 0.99 }}
            onClick={onAddWidget}
            className={cn(
              'mt-4 w-full flex items-center justify-center gap-2',
              'px-4 py-3 rounded-xl',
              'border-2 border-dashed border-[#FFD700]/30',
              'text-sm font-medium text-[#FFD700]',
              'hover:bg-[#FFD700]/5 transition-all duration-200',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD700]/40'
            )}
          >
            <Plus className="w-4 h-4" />
            Add Widget
          </motion.button>
        )}
      </div>
    </div>
  );
}

export default SpaceSidebarConfigurable;
