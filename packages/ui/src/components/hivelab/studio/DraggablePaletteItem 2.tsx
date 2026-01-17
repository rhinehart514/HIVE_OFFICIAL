/**
 * Draggable Palette Item
 *
 * Individual element in the HiveLab element palette.
 * Uses @dnd-kit for modern, accessible drag and drop.
 */

'use client';

import { useDraggable } from '@dnd-kit/core';
import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';
import { cn } from '../../../lib/utils';

export interface DraggablePaletteItemProps {
  id: string;
  elementType: string;
  icon: LucideIcon | ReactNode;
  label: string;
  description?: string;
  disabled?: boolean;
}

export function DraggablePaletteItem({
  id,
  elementType,
  icon: Icon,
  label,
  description,
  disabled = false,
}: DraggablePaletteItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    isDragging,
    transform,
  } = useDraggable({
    id,
    data: {
      isPaletteItem: true,
      elementType,
    },
    disabled,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        'flex items-center gap-3 p-3 mb-2',
        'bg-transparent border border-border-default rounded-sm',
        'transition-all duration-160',
        'cursor-grab active:cursor-grabbing',
        // Hover states
        !disabled && !isDragging && [
          'hover:bg-brand-primary/5',
          'hover:border-brand-primary/30',
          'hover:translate-x-1',
        ],
        // Dragging state
        isDragging && 'opacity-50',
        // Disabled state
        disabled && 'opacity-40 cursor-not-allowed',
        // Focus styles (keyboard navigation)
        'focus-visible:outline-none',
        'focus-visible:ring-2',
        'focus-visible:ring-brand-primary/50',
        'focus-visible:ring-offset-2',
        'focus-visible:ring-offset-background-primary'
      )}
      tabIndex={disabled ? -1 : 0}
      role="button"
      aria-label={`Drag ${label} element to canvas`}
      aria-disabled={disabled}
    >
      {/* Icon */}
      <div className="w-5 h-5 flex-shrink-0 text-text-secondary">
        {typeof Icon === 'function' ? <Icon className="w-5 h-5" /> : Icon}
      </div>

      {/* Label & Description */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-text-primary truncate">
          {label}
        </div>
        {description && (
          <div className="text-xs text-text-tertiary truncate mt-0.5">
            {description}
          </div>
        )}
      </div>
    </div>
  );
}
