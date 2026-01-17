/**
 * Sortable Canvas Element
 *
 * Individual element on the HiveLab canvas with reordering support.
 * Uses @dnd-kit/sortable for smooth, accessible reordering.
 */

'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Bars3Icon, TrashIcon } from '@heroicons/react/24/outline';
import { ReactNode } from 'react';
import { cn } from '../../../lib/utils';

export interface SortableCanvasElementProps {
  id: string;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  children: ReactNode;
  disabled?: boolean;
}

export function SortableCanvasElement({
  id,
  isSelected,
  onSelect,
  onDelete,
  children,
  disabled = false,
}: SortableCanvasElementProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    disabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative group',
        'mb-5 p-4',
        'bg-transparent border border-dashed border-transparent rounded-sm',
        'transition-all duration-160',
        // Hover states
        !isDragging && [
          'hover:bg-background-interactive/20',
          'hover:border-border-default',
        ],
        // Selected state
        isSelected && [
          'bg-brand-primary/5',
          'border-brand-primary',
          'border-solid',
        ],
        // Dragging state
        isDragging && 'opacity-40 z-50',
        // Focus styles
        'focus-within:outline-none',
        'focus-within:ring-2',
        'focus-within:ring-brand-primary/50'
      )}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      aria-label={`Canvas element ${id}`}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className={cn(
          'absolute top-2 left-2',
          'w-6 h-6 flex items-center justify-center',
          'opacity-0 group-hover:opacity-50',
          'transition-opacity cursor-grab active:cursor-grabbing',
          'focus-visible:opacity-100',
          'focus-visible:ring-2',
          'focus-visible:ring-brand-primary/50',
          'rounded',
          disabled && 'hidden'
        )}
        aria-label="Drag to reorder"
      >
        <Bars3Icon className="w-4 h-4 text-text-tertiary" />
      </div>

      {/* Delete Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className={cn(
          'absolute top-2 right-2',
          'w-6 h-6 flex items-center justify-center',
          'opacity-0 group-hover:opacity-70 hover:opacity-100',
          'transition-opacity',
          'focus-visible:opacity-100',
          'focus-visible:ring-2',
          'focus-visible:ring-status-error-default/50',
          'rounded',
          'text-status-error-default'
        )}
        aria-label="Delete element"
        type="button"
      >
        <TrashIcon className="w-4 h-4" />
      </button>

      {/* Element Content */}
      <div className="pt-2">
        {children}
      </div>
    </div>
  );
}
