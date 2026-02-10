'use client';

/**
 * BentoProfileGrid - Apple-style configurable bento grid for profile
 *
 * Main container that orchestrates:
 * - DnD context for widget reordering
 * - Grid layout with responsive columns
 * - Edit mode with toolbar
 * - Widget picker for hidden widgets
 *
 * Design: Apple widget grid aesthetic with HIVE's warm dark palette
 *
 * @version 1.0.0
 */

import * as React from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { motion } from 'framer-motion';
import type { WidgetConfig, WidgetType } from '@hive/core';
import { EASE_PREMIUM } from '@hive/ui';
import { useBentoGrid } from '../hooks/use-bento-grid';
import { BentoWidget } from './BentoWidget';
import { BentoEditToolbar } from './BentoEditToolbar';
import { WidgetPicker } from './WidgetPicker';
import { cn } from '@/lib/utils';

// LOCKED: Premium easing
const EASE = EASE_PREMIUM;

// Staggered entrance animation
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: EASE },
  },
};

interface BentoProfileGridProps {
  /** Initial widget layout from API */
  initialLayout?: WidgetConfig[];
  /** Whether this is the current user's profile */
  isOwnProfile: boolean;
  /** Render function for each widget type */
  renderWidget: (type: WidgetType, isEditMode: boolean) => React.ReactNode;
  /** Custom save handler */
  onSaveLayout?: (layout: WidgetConfig[]) => Promise<void>;
  className?: string;
}

export function BentoProfileGrid({
  initialLayout,
  isOwnProfile,
  renderWidget,
  onSaveLayout,
  className,
}: BentoProfileGridProps) {
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [showWidgetPicker, setShowWidgetPicker] = React.useState(false);

  const {
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
  } = useBentoGrid({
    initialLayout,
    isOwnProfile,
    onSave: onSaveLayout,
  });

  // DnD sensors with accessibility
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      reorderWidgets(active.id as string, over.id as string);
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  // Get widget IDs for sortable context
  const widgetIds = visibleWidgets.map((w) => w.id);

  return (
    <>
      {/* Customize button - own profile only */}
      {isOwnProfile && !isEditMode && (
        <motion.div
          className="flex justify-end mb-4 px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <motion.button
            onClick={toggleEditMode}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              color: 'var(--text-secondary)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
            whileHover={{
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
            }}
            whileTap={{ opacity: 0.8 }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            Customize
          </motion.button>
        </motion.div>
      )}

      {/* Hidden widgets toggle - edit mode only */}
      {isEditMode && hiddenWidgets.length > 0 && (
        <motion.div
          className="flex justify-end mb-4 px-4"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <motion.button
            onClick={() => setShowWidgetPicker(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
            style={{
              backgroundColor: 'rgba(255, 215, 0, 0.08)',
              color: 'var(--life-gold)',
              border: '1px solid rgba(255, 215, 0, 0.2)',
            }}
            whileHover={{
              backgroundColor: 'rgba(255, 215, 0, 0.12)',
            }}
            whileTap={{ opacity: 0.8 }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Widget ({hiddenWidgets.length})
          </motion.button>
        </motion.div>
      )}

      {/* Grid */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <SortableContext items={widgetIds} strategy={rectSortingStrategy}>
          <motion.div
            className={cn(
              'grid gap-4 px-4 pb-24',
              'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
              'max-w-[1200px] mx-auto',
              className
            )}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {visibleWidgets.map((widget) => (
              <BentoWidget
                key={widget.id}
                widget={widget}
                isEditMode={isEditMode}
                onToggleVisibility={() => toggleVisibility(widget.id)}
                onResize={(size) => resizeWidget(widget.id, size)}
              >
                <motion.div variants={itemVariants}>
                  {renderWidget(widget.type, isEditMode)}
                </motion.div>
              </BentoWidget>
            ))}
          </motion.div>
        </SortableContext>

        {/* Drag overlay */}
        <DragOverlay>
          {activeId && (
            <div
              className="rounded-full p-4 opacity-80"
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '2px solid var(--life-gold)',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
              }}
            >
              <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                Moving widget...
              </span>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Edit toolbar */}
      <BentoEditToolbar
        isVisible={isEditMode}
        isDirty={isDirty}
        isSaving={isSaving}
        onSave={saveLayout}
        onCancel={cancelEdit}
        onReset={resetLayout}
      />

      {/* Widget picker */}
      <WidgetPicker
        isOpen={showWidgetPicker}
        hiddenWidgets={hiddenWidgets}
        onToggleWidget={(id) => {
          toggleVisibility(id);
          setShowWidgetPicker(false);
        }}
        onClose={() => setShowWidgetPicker(false)}
      />
    </>
  );
}

export default BentoProfileGrid;
