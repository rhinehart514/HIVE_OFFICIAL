'use client';

/**
 * CanvasArea Primitive
 * LOCKED: January 2026
 *
 * Decisions:
 * - Grid: Dots pattern (clean, Figma-like)
 * - Drop target: Gold ring + subtle bg tint
 * - Selection: White solid outline
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const canvasAreaVariants = cva(
  [
    'relative',
    'overflow-auto',
    'transition-colors duration-[var(--duration-smooth)]',
  ].join(' '),
  {
    variants: {
      background: {
        // Solid backgrounds
        solid: 'bg-[var(--color-bg-page)]',
        elevated: 'bg-[var(--color-bg-elevated)]',
        // Grid patterns
        dots: '',
        grid: '',
        // Transparent for overlay use
        transparent: 'bg-transparent',
      },
      border: {
        none: '',
        subtle: 'border border-[var(--color-border)]',
        dashed: 'border-2 border-dashed border-[var(--color-border)]',
      },
      rounded: {
        none: '',
        sm: 'rounded-md',
        default: 'rounded-lg',
        lg: 'rounded-xl',
      },
    },
    defaultVariants: {
      background: 'solid',
      border: 'subtle',
      rounded: 'default',
    },
  }
);

export interface CanvasAreaProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof canvasAreaVariants> {
  /** Grid size in pixels (for dot/grid patterns) */
  gridSize?: number;
  /** Show grid pattern */
  showGrid?: boolean;
  /** Grid color */
  gridColor?: string;
  /** Min width constraint */
  minWidth?: number | string;
  /** Min height constraint */
  minHeight?: number | string;
  /** Zoom level (1 = 100%) */
  zoom?: number;
  /** Whether the canvas is interactive (accepts drops, etc) */
  interactive?: boolean;
  /** Drop zone active state */
  isDropTarget?: boolean;
}

const CanvasArea = React.forwardRef<HTMLDivElement, CanvasAreaProps>(
  (
    {
      className,
      background,
      border,
      rounded,
      gridSize = 20,
      showGrid = false,
      gridColor,
      minWidth,
      minHeight,
      zoom = 1,
      interactive = true,
      isDropTarget = false,
      style,
      children,
      ...props
    },
    ref
  ) => {
    const gridStyles = React.useMemo(() => {
      if (!showGrid) return {};

      const color = gridColor || 'var(--color-border)';
      const size = gridSize * zoom;

      if (background === 'dots') {
        return {
          backgroundImage: `radial-gradient(circle, ${color} 1px, transparent 1px)`,
          backgroundSize: `${size}px ${size}px`,
        };
      }

      if (background === 'grid') {
        return {
          backgroundImage: `
            linear-gradient(to right, ${color} 1px, transparent 1px),
            linear-gradient(to bottom, ${color} 1px, transparent 1px)
          `,
          backgroundSize: `${size}px ${size}px`,
        };
      }

      return {};
    }, [showGrid, gridSize, gridColor, background, zoom]);

    return (
      <div
        ref={ref}
        className={cn(
          canvasAreaVariants({ background, border, rounded }),
          interactive && 'cursor-crosshair',
          className
        )}
        style={{
          ...gridStyles,
          ...style,
          ...(isDropTarget && {
            boxShadow: '0 0 0 2px rgba(255,215,0,0.5)',
            backgroundColor: 'rgba(255,215,0,0.03)',
          }),
        }}
        // minWidth/minHeight applied via className or inline
        data-min-width={minWidth}
        data-min-height={minHeight}
        data-interactive={interactive}
        data-drop-target={isDropTarget}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CanvasArea.displayName = 'CanvasArea';

/**
 * CanvasElement — Wrapper for elements on the canvas
 */
export interface CanvasElementProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Position on canvas */
  position?: { x: number; y: number };
  /** Size */
  size?: { width: number | 'auto'; height: number | 'auto' };
  /** Selected state */
  selected?: boolean;
  /** Hovered state */
  hovered?: boolean;
  /** Locked (not movable) */
  locked?: boolean;
  /** Hidden */
  hidden?: boolean;
}

const CanvasElement = React.forwardRef<HTMLDivElement, CanvasElementProps>(
  (
    {
      className,
      position,
      size,
      selected = false,
      hovered = false,
      locked = false,
      hidden = false,
      style,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          'absolute',
          'transition-shadow duration-[var(--duration-snap)]',
          selected && [
            'ring-2 ring-[var(--color-interactive-active)]',
            'shadow-lg',
          ],
          hovered && !selected && 'ring-1 ring-[var(--color-interactive-hover)]',
          locked && 'opacity-70 cursor-not-allowed',
          hidden && 'opacity-30',
          className
        )}
        style={{
          left: position?.x ?? 0,
          top: position?.y ?? 0,
          width: size?.width ?? 'auto',
          height: size?.height ?? 'auto',
          ...style,
        }}
        data-selected={selected}
        data-locked={locked}
        data-hidden={hidden}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CanvasElement.displayName = 'CanvasElement';

/**
 * CanvasGuides — Alignment guides
 */
export interface CanvasGuidesProps {
  /** Horizontal guide positions (Y coordinates) */
  horizontal?: number[];
  /** Vertical guide positions (X coordinates) */
  vertical?: number[];
  /** Guide color */
  color?: string;
}

const CanvasGuides: React.FC<CanvasGuidesProps> = ({
  horizontal = [],
  vertical = [],
  color = 'var(--color-accent-gold)',
}) => {
  return (
    <>
      {horizontal.map((y, i) => (
        <div
          key={`h-${i}`}
          className="absolute left-0 right-0 h-px pointer-events-none z-50"
          style={{ top: y, backgroundColor: color }}
        />
      ))}
      {vertical.map((x, i) => (
        <div
          key={`v-${i}`}
          className="absolute top-0 bottom-0 w-px pointer-events-none z-50"
          style={{ left: x, backgroundColor: color }}
        />
      ))}
    </>
  );
};

export {
  CanvasArea,
  CanvasElement,
  CanvasGuides,
  canvasAreaVariants,
};
