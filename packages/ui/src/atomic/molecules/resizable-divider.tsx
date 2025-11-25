'use client';

/**
 * ResizableDivider
 *
 * Draggable divider for split-view layouts.
 * Features:
 * - Mouse drag to resize
 * - Keyboard navigation (arrow keys)
 * - Min/max width constraints
 * - Visual feedback on hover/drag
 * - Accessible (ARIA labels, focus management)
 */

import { useEffect, useRef, useState } from 'react';
import { cn } from '../../lib/utils';

export interface ResizableDividerProps {
  /** Current left panel width percentage (0-100) */
  leftWidth: number;

  /** Callback when width changes */
  onWidthChange: (newWidth: number) => void;

  /** Minimum left panel width percentage (default: 20) */
  minWidth?: number;

  /** Maximum left panel width percentage (default: 80) */
  maxWidth?: number;

  /** Keyboard resize step in percentage (default: 5) */
  keyboardStep?: number;

  /** Additional CSS classes */
  className?: string;

  /** ARIA label for accessibility */
  ariaLabel?: string;
}

/**
 * Draggable divider component for resizable split layouts
 */
export function ResizableDivider({
  leftWidth,
  onWidthChange,
  minWidth = 20,
  maxWidth = 80,
  keyboardStep = 5,
  className,
  ariaLabel = 'Resize panels'
}: ResizableDividerProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const dividerRef = useRef<HTMLDivElement>(null);

  // Handle mouse drag
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);

    // Add cursor style to body during drag
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;

    // Calculate new width based on mouse position
    const containerWidth = window.innerWidth;
    const newWidth = (e.clientX / containerWidth) * 100;

    // Clamp to min/max
    const clampedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));

    onWidthChange(clampedWidth);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    let newWidth = leftWidth;

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        newWidth = Math.max(minWidth, leftWidth - keyboardStep);
        break;
      case 'ArrowRight':
        e.preventDefault();
        newWidth = Math.min(maxWidth, leftWidth + keyboardStep);
        break;
      case 'Home':
        e.preventDefault();
        newWidth = minWidth;
        break;
      case 'End':
        e.preventDefault();
        newWidth = maxWidth;
        break;
      default:
        return;
    }

    onWidthChange(newWidth);
  };

  // Mouse event listeners
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, leftWidth, minWidth, maxWidth]);

  return (
    <div
      ref={dividerRef}
      role="slider"
      aria-label={ariaLabel}
      aria-valuenow={Math.round(leftWidth)}
      aria-valuemin={minWidth}
      aria-valuemax={maxWidth}
      aria-orientation="vertical"
      tabIndex={0}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onKeyDown={handleKeyDown}
      className={cn(
        // Base styles
        'relative w-1 shrink-0 cursor-col-resize group',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20',
        // Transition
        'transition-colors duration-150',
        className
      )}
    >
      {/* Visual divider line */}
      <div
        className={cn(
          'absolute inset-y-0 left-0 w-px bg-white/[0.08]',
          'transition-colors duration-150',
          {
            'bg-white/20': isHovered || isDragging,
          }
        )}
      />

      {/* Draggable hit area (wider for easier grabbing) */}
      <div
        className={cn(
          'absolute inset-y-0 -left-2 w-5',
          'flex items-center justify-center',
          'transition-opacity duration-150',
          {
            'opacity-100': isHovered || isDragging,
            'opacity-0': !isHovered && !isDragging,
          }
        )}
      >
        {/* Drag handle indicator */}
        <div
          className={cn(
            'w-1 h-12 rounded-full',
            'transition-all duration-150',
            {
              'bg-white/40 scale-110': isDragging,
              'bg-white/20 scale-100': isHovered && !isDragging,
              'bg-transparent': !isHovered && !isDragging,
            }
          )}
        />
      </div>

      {/* Keyboard hint (visible on focus) */}
      <div
        className={cn(
          'absolute top-1/2 left-2 -translate-y-1/2',
          'px-2 py-1 rounded bg-black/90 border border-white/10',
          'text-xs text-white/60 whitespace-nowrap',
          'pointer-events-none opacity-0 transition-opacity duration-150',
          'group-focus-visible:opacity-100'
        )}
      >
        ← → to resize
      </div>
    </div>
  );
}
