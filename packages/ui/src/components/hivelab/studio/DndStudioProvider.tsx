/**
 * DnD Studio Provider
 *
 * Modern drag-and-drop context using @dnd-kit for HiveLab studio.
 * Replaces react-dnd with better performance and accessibility.
 *
 * Features:
 * - Element palette drag to canvas
 * - Canvas element reordering
 * - Keyboard navigation (WCAG 2.1 AA)
 * - Touch support for mobile
 * - Collision detection
 */

'use client';

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
  type DragOverEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { ReactNode, useState } from 'react';

export interface DndStudioProviderProps {
  children: ReactNode;
  onElementAdd?: (elementType: string, position?: { x: number; y: number }) => void;
  onElementReorder?: (activeId: string, overId: string) => void;
  elementIds?: string[];
}

export function DndStudioProvider({
  children,
  onElementAdd,
  onElementReorder,
  elementIds = [],
}: DndStudioProviderProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activePaletteItem, setActivePaletteItem] = useState<string | null>(null);

  // Configure sensors with accessibility support
  const sensors = useSensors(
    // Mouse/trackpad
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement before drag starts (prevents accidental drags)
      },
    }),
    // Touch (mobile)
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200, // 200ms hold before drag starts (prevents scroll interference)
        tolerance: 5,
      },
    }),
    // Keyboard (accessibility)
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);

    // Check if dragging from palette or canvas
    if (active.data.current?.isPaletteItem) {
      setActivePaletteItem(active.data.current.elementType);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    // Could handle visual feedback during drag here
    // e.g., show drop zone highlights
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      // Drag cancelled
      setActiveId(null);
      setActivePaletteItem(null);
      return;
    }

    // Case 1: Adding element from palette to canvas
    if (active.data.current?.isPaletteItem && over.id === 'canvas-drop-zone') {
      const elementType = active.data.current.elementType;
      onElementAdd?.(elementType);
    }
    // Case 2: Reordering elements on canvas
    else if (active.id !== over.id && !active.data.current?.isPaletteItem) {
      onElementReorder?.(active.id as string, over.id as string);
    }

    setActiveId(null);
    setActivePaletteItem(null);
  };

  const handleDragCancel = () => {
    setActiveId(null);
    setActivePaletteItem(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext items={elementIds} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>

      {/* Drag overlay - shows element being dragged */}
      <DragOverlay>
        {activeId && activePaletteItem && (
          <div className="rounded-lg bg-background-secondary border border-brand-primary p-3 shadow-lg">
            <div className="text-sm font-medium text-text-primary">
              {activePaletteItem}
            </div>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
