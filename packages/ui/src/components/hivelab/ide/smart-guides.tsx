'use client';

import { useMemo } from 'react';
import type { CanvasElement } from './types';

/**
 * Smart Guides for HiveLab IDE Canvas
 *
 * Displays alignment guides when dragging elements (Figma-like).
 * Shows:
 * - Center alignment (vertical/horizontal)
 * - Edge alignment (top/bottom/left/right)
 * - Spacing guides between elements
 */

interface SmartGuidesProps {
  elements: CanvasElement[];
  draggingElement: CanvasElement | null;
  threshold?: number;
  zoom?: number;
}

interface Guide {
  type: 'vertical' | 'horizontal';
  position: number;
  start: number;
  end: number;
  label?: string;
}

export function SmartGuides({
  elements,
  draggingElement,
  threshold = 8,
  zoom = 1,
}: SmartGuidesProps) {
  const guides = useMemo(() => {
    if (!draggingElement) return [];

    const result: Guide[] = [];
    const drag = draggingElement;

    // Dragging element bounds
    const dragLeft = drag.position.x;
    const dragRight = drag.position.x + drag.size.width;
    const dragTop = drag.position.y;
    const dragBottom = drag.position.y + drag.size.height;
    const dragCenterX = dragLeft + drag.size.width / 2;
    const dragCenterY = dragTop + drag.size.height / 2;

    // Check against all other elements
    for (const el of elements) {
      if (el.id === drag.id) continue;
      if (!el.visible) continue;

      const elLeft = el.position.x;
      const elRight = el.position.x + el.size.width;
      const elTop = el.position.y;
      const elBottom = el.position.y + el.size.height;
      const elCenterX = elLeft + el.size.width / 2;
      const elCenterY = elTop + el.size.height / 2;

      // Vertical guides (x-axis alignment)

      // Center-to-center horizontal alignment
      if (Math.abs(dragCenterX - elCenterX) < threshold) {
        result.push({
          type: 'vertical',
          position: elCenterX,
          start: Math.min(dragTop, elTop),
          end: Math.max(dragBottom, elBottom),
        });
      }

      // Left edge alignment
      if (Math.abs(dragLeft - elLeft) < threshold) {
        result.push({
          type: 'vertical',
          position: elLeft,
          start: Math.min(dragTop, elTop),
          end: Math.max(dragBottom, elBottom),
        });
      }

      // Right edge alignment
      if (Math.abs(dragRight - elRight) < threshold) {
        result.push({
          type: 'vertical',
          position: elRight,
          start: Math.min(dragTop, elTop),
          end: Math.max(dragBottom, elBottom),
        });
      }

      // Left to right alignment (snap to edge)
      if (Math.abs(dragLeft - elRight) < threshold) {
        result.push({
          type: 'vertical',
          position: elRight,
          start: Math.min(dragTop, elTop),
          end: Math.max(dragBottom, elBottom),
        });
      }

      // Right to left alignment
      if (Math.abs(dragRight - elLeft) < threshold) {
        result.push({
          type: 'vertical',
          position: elLeft,
          start: Math.min(dragTop, elTop),
          end: Math.max(dragBottom, elBottom),
        });
      }

      // Horizontal guides (y-axis alignment)

      // Center-to-center vertical alignment
      if (Math.abs(dragCenterY - elCenterY) < threshold) {
        result.push({
          type: 'horizontal',
          position: elCenterY,
          start: Math.min(dragLeft, elLeft),
          end: Math.max(dragRight, elRight),
        });
      }

      // Top edge alignment
      if (Math.abs(dragTop - elTop) < threshold) {
        result.push({
          type: 'horizontal',
          position: elTop,
          start: Math.min(dragLeft, elLeft),
          end: Math.max(dragRight, elRight),
        });
      }

      // Bottom edge alignment
      if (Math.abs(dragBottom - elBottom) < threshold) {
        result.push({
          type: 'horizontal',
          position: elBottom,
          start: Math.min(dragLeft, elLeft),
          end: Math.max(dragRight, elRight),
        });
      }

      // Top to bottom alignment
      if (Math.abs(dragTop - elBottom) < threshold) {
        result.push({
          type: 'horizontal',
          position: elBottom,
          start: Math.min(dragLeft, elLeft),
          end: Math.max(dragRight, elRight),
        });
      }

      // Bottom to top alignment
      if (Math.abs(dragBottom - elTop) < threshold) {
        result.push({
          type: 'horizontal',
          position: elTop,
          start: Math.min(dragLeft, elLeft),
          end: Math.max(dragRight, elRight),
        });
      }
    }

    // Deduplicate guides by position and type
    const uniqueGuides: Guide[] = [];
    const seen = new Set<string>();
    for (const guide of result) {
      const key = `${guide.type}-${Math.round(guide.position)}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueGuides.push(guide);
      }
    }

    return uniqueGuides;
  }, [elements, draggingElement, threshold]);

  if (!draggingElement || guides.length === 0) {
    return null;
  }

  return (
    <svg
      className="absolute inset-0 pointer-events-none overflow-visible"
      style={{ width: 4000, height: 4000, zIndex: 1000 }}
    >
      <defs>
        <pattern
          id="guide-pattern"
          patternUnits="userSpaceOnUse"
          width="6"
          height="6"
        >
          <line
            x1="0"
            y1="3"
            x2="6"
            y2="3"
            stroke="#FFD700"
            strokeWidth="1"
            strokeDasharray="2 2"
          />
        </pattern>
      </defs>

      {guides.map((guide, i) => (
        <g key={i}>
          {guide.type === 'vertical' ? (
            <>
              {/* Main guide line */}
              <line
                x1={guide.position}
                y1={guide.start - 20}
                x2={guide.position}
                y2={guide.end + 20}
                stroke="#FFD700"
                strokeWidth={1 / zoom}
                strokeDasharray="4 2"
                opacity={0.8}
              />
              {/* Accent dots at ends */}
              <circle
                cx={guide.position}
                cy={guide.start - 20}
                r={2 / zoom}
                fill="#FFD700"
              />
              <circle
                cx={guide.position}
                cy={guide.end + 20}
                r={2 / zoom}
                fill="#FFD700"
              />
            </>
          ) : (
            <>
              {/* Main guide line */}
              <line
                x1={guide.start - 20}
                y1={guide.position}
                x2={guide.end + 20}
                y2={guide.position}
                stroke="#FFD700"
                strokeWidth={1 / zoom}
                strokeDasharray="4 2"
                opacity={0.8}
              />
              {/* Accent dots at ends */}
              <circle
                cx={guide.start - 20}
                cy={guide.position}
                r={2 / zoom}
                fill="#FFD700"
              />
              <circle
                cx={guide.end + 20}
                cy={guide.position}
                r={2 / zoom}
                fill="#FFD700"
              />
            </>
          )}
        </g>
      ))}
    </svg>
  );
}

/**
 * Helper to calculate snap position based on smart guides
 * Returns adjusted position if within threshold of a guide
 */
export function snapToGuides(
  position: { x: number; y: number },
  size: { width: number; height: number },
  elements: CanvasElement[],
  draggingId: string,
  threshold: number = 8
): { x: number; y: number; snappedX: boolean; snappedY: boolean } {
  let { x, y } = position;
  let snappedX = false;
  let snappedY = false;

  const dragLeft = x;
  const dragRight = x + size.width;
  const dragTop = y;
  const dragBottom = y + size.height;
  const dragCenterX = x + size.width / 2;
  const dragCenterY = y + size.height / 2;

  for (const el of elements) {
    if (el.id === draggingId) continue;
    if (!el.visible) continue;

    const elLeft = el.position.x;
    const elRight = el.position.x + el.size.width;
    const elTop = el.position.y;
    const elBottom = el.position.y + el.size.height;
    const elCenterX = elLeft + el.size.width / 2;
    const elCenterY = elTop + el.size.height / 2;

    // X-axis snapping (vertical guides)
    if (!snappedX) {
      // Center to center
      if (Math.abs(dragCenterX - elCenterX) < threshold) {
        x = elCenterX - size.width / 2;
        snappedX = true;
      }
      // Left to left
      else if (Math.abs(dragLeft - elLeft) < threshold) {
        x = elLeft;
        snappedX = true;
      }
      // Right to right
      else if (Math.abs(dragRight - elRight) < threshold) {
        x = elRight - size.width;
        snappedX = true;
      }
      // Left to right (adjacent)
      else if (Math.abs(dragLeft - elRight) < threshold) {
        x = elRight;
        snappedX = true;
      }
      // Right to left (adjacent)
      else if (Math.abs(dragRight - elLeft) < threshold) {
        x = elLeft - size.width;
        snappedX = true;
      }
    }

    // Y-axis snapping (horizontal guides)
    if (!snappedY) {
      // Center to center
      if (Math.abs(dragCenterY - elCenterY) < threshold) {
        y = elCenterY - size.height / 2;
        snappedY = true;
      }
      // Top to top
      else if (Math.abs(dragTop - elTop) < threshold) {
        y = elTop;
        snappedY = true;
      }
      // Bottom to bottom
      else if (Math.abs(dragBottom - elBottom) < threshold) {
        y = elBottom - size.height;
        snappedY = true;
      }
      // Top to bottom (adjacent)
      else if (Math.abs(dragTop - elBottom) < threshold) {
        y = elBottom;
        snappedY = true;
      }
      // Bottom to top (adjacent)
      else if (Math.abs(dragBottom - elTop) < threshold) {
        y = elTop - size.height;
        snappedY = true;
      }
    }

    // Early exit if both axes snapped
    if (snappedX && snappedY) break;
  }

  return { x, y, snappedX, snappedY };
}

export default SmartGuides;
