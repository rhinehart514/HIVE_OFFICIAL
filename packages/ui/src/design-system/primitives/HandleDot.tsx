'use client';

/**
 * HandleDot Primitive
 * LOCKED: January 2026
 *
 * Decisions:
 * - Color: White (matches system)
 * - Hover: Brighten (70% → 100%), no scale
 * - Active: White glow when dragging
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const handleDotVariants = cva(
  [
    'absolute',
    'rounded-full',
    'border-2 border-[#0a0a09]',
    'bg-white/80',
    'transition-all duration-150',
    'hover:bg-white', // Brighten on hover, NO SCALE
    'z-50',
  ].join(' '),
  {
    variants: {
      size: {
        sm: 'w-2 h-2',
        default: 'w-2.5 h-2.5',
        lg: 'w-3 h-3',
      },
      position: {
        // Corners
        'top-left': '-top-1 -left-1 cursor-nw-resize',
        'top-right': '-top-1 -right-1 cursor-ne-resize',
        'bottom-left': '-bottom-1 -left-1 cursor-sw-resize',
        'bottom-right': '-bottom-1 -right-1 cursor-se-resize',
        // Edges
        'top': '-top-1 left-1/2 -translate-x-1/2 cursor-n-resize',
        'right': 'top-1/2 -right-1 -translate-y-1/2 cursor-e-resize',
        'bottom': '-bottom-1 left-1/2 -translate-x-1/2 cursor-s-resize',
        'left': 'top-1/2 -left-1 -translate-y-1/2 cursor-w-resize',
        // Center (for rotation)
        'center': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 cursor-move',
      },
    },
    defaultVariants: {
      size: 'default',
      position: 'bottom-right',
    },
  }
);

export type HandlePosition =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | 'top'
  | 'right'
  | 'bottom'
  | 'left'
  | 'center';

export interface HandleDotProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onDrag'>,
    VariantProps<typeof handleDotVariants> {
  /** Handle position on the element */
  position: HandlePosition;
  /** Callback when drag starts */
  onDragStart?: (e: React.MouseEvent) => void;
  /** Callback during drag */
  onDrag?: (e: React.MouseEvent, delta: { x: number; y: number }) => void;
  /** Callback when drag ends */
  onDragEnd?: (e: React.MouseEvent) => void;
  /** Whether the handle is active */
  active?: boolean;
  /** Visually hidden (for screen readers) */
  visuallyHidden?: boolean;
}

const HandleDot = React.forwardRef<HTMLDivElement, HandleDotProps>(
  (
    {
      className,
      size,
      position,
      onDragStart,
      onDrag,
      onDragEnd,
      active = false,
      visuallyHidden = false,
      ...props
    },
    ref
  ) => {
    const handleMouseDown = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onDragStart?.(e);
    };

    if (visuallyHidden) {
      return null;
    }

    return (
      <div
        ref={ref}
        className={cn(
          handleDotVariants({ size, position }),
          className
        )}
        style={{
          boxShadow: active ? '0 0 12px rgba(255,255,255,0.6)' : undefined,
        }}
        onMouseDown={handleMouseDown}
        role="slider"
        aria-label={`Resize handle ${position}`}
        tabIndex={0}
        {...props}
      />
    );
  }
);

HandleDot.displayName = 'HandleDot';

/**
 * HandleGroup — All handles for an element
 */
export interface HandleGroupProps {
  /** Show corner handles */
  corners?: boolean;
  /** Show edge handles */
  edges?: boolean;
  /** Handle size */
  size?: 'sm' | 'default' | 'lg';
  /** Active handle position */
  activeHandle?: HandlePosition | null;
  /** Callback when a handle drag starts */
  onHandleDragStart?: (position: HandlePosition, e: React.MouseEvent) => void;
  /** Additional className */
  className?: string;
}

const HandleGroup: React.FC<HandleGroupProps> = ({
  corners = true,
  edges = false,
  size = 'default',
  activeHandle,
  onHandleDragStart,
  className,
}) => {
  const cornerPositions: HandlePosition[] = [
    'top-left',
    'top-right',
    'bottom-left',
    'bottom-right',
  ];

  const edgePositions: HandlePosition[] = ['top', 'right', 'bottom', 'left'];

  return (
    <div className={cn('pointer-events-none', className)}>
      {corners &&
        cornerPositions.map((pos) => (
          <HandleDot
            key={pos}
            position={pos}
            size={size}
            active={activeHandle === pos}
            onDragStart={(e) => onHandleDragStart?.(pos, e)}
            className="pointer-events-auto"
          />
        ))}
      {edges &&
        edgePositions.map((pos) => (
          <HandleDot
            key={pos}
            position={pos}
            size={size}
            active={activeHandle === pos}
            onDragStart={(e) => onHandleDragStart?.(pos, e)}
            className="pointer-events-auto"
          />
        ))}
    </div>
  );
};

/**
 * RotationHandle — Special handle for rotation
 */
export interface RotationHandleProps {
  /** Distance from element (in pixels) */
  offset?: number;
  /** Current rotation (in degrees) */
  rotation?: number;
  /** Callback when rotation starts */
  onRotateStart?: (e: React.MouseEvent) => void;
  /** Additional className */
  className?: string;
}

const RotationHandle: React.FC<RotationHandleProps> = ({
  offset = 24,
  rotation = 0,
  onRotateStart,
  className,
}) => {
  return (
    <div
      className={cn(
        'absolute left-1/2 -translate-x-1/2',
        'flex flex-col items-center gap-1',
        className
      )}
      style={{ top: -offset }}
    >
      {/* Line connecting to element */}
      <div
        className="w-px h-3 bg-[var(--color-interactive-active)]"
        style={{ transform: `rotate(${rotation}deg)` }}
      />
      {/* Rotation handle */}
      <div
        className={cn(
          'w-3 h-3 rounded-full',
          'border-2 border-[var(--color-bg-page)]',
          'bg-[var(--color-interactive-active)]',
          'cursor-grab active:cursor-grabbing',
          'hover:bg-[var(--color-accent-gold)]',
          'transition-colors duration-[var(--duration-snap)]'
        )}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onRotateStart?.(e);
        }}
        role="slider"
        aria-label="Rotation handle"
        tabIndex={0}
      />
    </div>
  );
};

export {
  HandleDot,
  HandleGroup,
  RotationHandle,
  handleDotVariants,
};
