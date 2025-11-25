/**
 * Canvas Drop Zone
 *
 * Droppable area for HiveLab canvas where elements can be added.
 * Uses @dnd-kit for modern drag and drop.
 */

'use client';

import { useDroppable } from '@dnd-kit/core';
import { ReactNode } from 'react';
import { cn } from '../../../lib/utils';

export interface CanvasDropZoneProps {
  children: ReactNode;
  isEmpty?: boolean;
  className?: string;
}

export function CanvasDropZone({
  children,
  isEmpty = false,
  className,
}: CanvasDropZoneProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'canvas-drop-zone',
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'relative min-h-[600px]',
        'bg-background-primary',
        'rounded-lg p-6',
        // Drop zone visual feedback
        isOver && [
          'border-2 border-dashed border-brand-primary',
          'bg-brand-primary/5',
        ],
        !isOver && 'border-2 border-dashed border-transparent',
        className
      )}
    >
      {isEmpty && !isOver && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="text-text-tertiary text-sm mb-2">
              Your canvas is empty
            </div>
            <div className="text-text-secondary text-base font-medium">
              Drag elements from the palette to build your tool
            </div>
          </div>
        </div>
      )}

      {isOver && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-brand-primary text-base font-medium">
            Drop element here
          </div>
        </div>
      )}

      <div className={cn(isEmpty && 'opacity-0')}>{children}</div>
    </div>
  );
}
