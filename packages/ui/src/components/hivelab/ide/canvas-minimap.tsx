'use client';

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapIcon, XMarkIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import type { CanvasElement, Connection } from './types';

// ============================================
// Constants
// ============================================

const MINIMAP_WIDTH = 180;
const MINIMAP_HEIGHT = 120;
const PADDING = 10;

const COLORS = {
  bg: 'var(--hivelab-surface, #1A1A1A)',
  bgHover: 'var(--hivelab-surface-hover, #242424)',
  border: 'var(--hivelab-border, rgba(255, 255, 255, 0.08))',
  borderEmphasis: 'var(--hivelab-border-emphasis, rgba(255, 255, 255, 0.12))',
  element: 'var(--hivelab-text-tertiary, #5A5A5A)',
  elementSelected: 'var(--life-gold, #D4AF37)',
  viewport: 'rgba(212, 175, 55, 0.2)',
  viewportBorder: 'var(--life-gold, #D4AF37)',
  connection: 'rgba(212, 175, 55, 0.3)',
  text: 'var(--hivelab-text-secondary, #8A8A8A)',
};

// ============================================
// Types
// ============================================

interface CanvasMinimapProps {
  elements: CanvasElement[];
  connections: Connection[];
  selectedIds: string[];
  zoom: number;
  pan: { x: number; y: number };
  containerWidth: number;
  containerHeight: number;
  onPanChange: (pan: { x: number; y: number }) => void;
  /** Whether to show the minimap by default */
  defaultExpanded?: boolean;
}

// ============================================
// Utilities
// ============================================

/**
 * Calculate the bounding box of all elements
 */
function calculateBounds(elements: CanvasElement[]): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
} {
  if (elements.length === 0) {
    return { minX: 0, minY: 0, maxX: 1000, maxY: 1000, width: 1000, height: 1000 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  elements.forEach((el) => {
    minX = Math.min(minX, el.position.x);
    minY = Math.min(minY, el.position.y);
    maxX = Math.max(maxX, el.position.x + el.size.width);
    maxY = Math.max(maxY, el.position.y + el.size.height);
  });

  // Add padding
  minX -= PADDING * 10;
  minY -= PADDING * 10;
  maxX += PADDING * 10;
  maxY += PADDING * 10;

  // Ensure minimum size
  const width = Math.max(maxX - minX, 400);
  const height = Math.max(maxY - minY, 300);

  return { minX, minY, maxX, maxY, width, height };
}

// ============================================
// Component
// ============================================

export function CanvasMinimap({
  elements,
  connections,
  selectedIds,
  zoom,
  pan,
  containerWidth,
  containerHeight,
  onPanChange,
  defaultExpanded = true,
}: CanvasMinimapProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isDragging, setIsDragging] = useState(false);
  const minimapRef = useRef<HTMLDivElement>(null);

  // Calculate world bounds
  const bounds = useMemo(() => calculateBounds(elements), [elements]);

  // Calculate scale to fit content in minimap
  const scale = useMemo(() => {
    const scaleX = (MINIMAP_WIDTH - PADDING * 2) / bounds.width;
    const scaleY = (MINIMAP_HEIGHT - PADDING * 2) / bounds.height;
    return Math.min(scaleX, scaleY);
  }, [bounds]);

  // Convert world coordinates to minimap coordinates
  const toMinimapCoords = useCallback(
    (worldX: number, worldY: number) => ({
      x: (worldX - bounds.minX) * scale + PADDING,
      y: (worldY - bounds.minY) * scale + PADDING,
    }),
    [bounds, scale]
  );

  // Convert minimap coordinates to pan values
  const minimapToPan = useCallback(
    (minimapX: number, minimapY: number) => {
      // Calculate the world position from minimap position
      const worldX = (minimapX - PADDING) / scale + bounds.minX;
      const worldY = (minimapY - PADDING) / scale + bounds.minY;

      // Calculate pan to center this position in the viewport
      const panX = -worldX * zoom + containerWidth / 2;
      const panY = -worldY * zoom + containerHeight / 2;

      return { x: panX, y: panY };
    },
    [bounds, scale, zoom, containerWidth, containerHeight]
  );

  // Calculate viewport rectangle in minimap coordinates
  const viewport = useMemo(() => {
    // Current view bounds in world coordinates
    const viewLeft = -pan.x / zoom;
    const viewTop = -pan.y / zoom;
    const viewRight = viewLeft + containerWidth / zoom;
    const viewBottom = viewTop + containerHeight / zoom;

    // Convert to minimap coordinates
    const topLeft = toMinimapCoords(viewLeft, viewTop);
    const bottomRight = toMinimapCoords(viewRight, viewBottom);

    return {
      x: topLeft.x,
      y: topLeft.y,
      width: bottomRight.x - topLeft.x,
      height: bottomRight.y - topLeft.y,
    };
  }, [pan, zoom, containerWidth, containerHeight, toMinimapCoords]);

  // Handle click/drag on minimap
  const handleMinimapInteraction = useCallback(
    (e: React.MouseEvent | MouseEvent) => {
      if (!minimapRef.current) return;

      const rect = minimapRef.current.getBoundingClientRect();
      const minimapX = e.clientX - rect.left;
      const minimapY = e.clientY - rect.top;

      const newPan = minimapToPan(minimapX, minimapY);
      onPanChange(newPan);
    },
    [minimapToPan, onPanChange]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      handleMinimapInteraction(e);
    },
    [handleMinimapInteraction]
  );

  // Handle drag
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      handleMinimapInteraction(e);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMinimapInteraction]);

  // Don't render if no elements
  if (elements.length === 0) return null;

  return (
    <div
      className="absolute bottom-4 left-4 z-20"
      style={{ width: isExpanded ? MINIMAP_WIDTH : 'auto' }}
    >
      <AnimatePresence mode="wait">
        {isExpanded ? (
          <motion.div
            key="expanded"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className="rounded-xl overflow-hidden"
            style={{
              backgroundColor: COLORS.bg,
              border: `1px solid ${COLORS.border}`,
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-2 py-1.5 cursor-pointer"
              style={{ borderBottom: `1px solid ${COLORS.border}` }}
              onClick={() => setIsExpanded(false)}
            >
              <span className="text-[10px] font-medium" style={{ color: COLORS.text }}>
                Overview
              </span>
              <div className="flex items-center gap-1">
                <span className="text-[10px]" style={{ color: COLORS.text }}>
                  {elements.length} elements
                </span>
                <ChevronDownIcon className="w-3 h-3" style={{ color: COLORS.text }} />
              </div>
            </div>

            {/* Minimap Canvas */}
            <div
              ref={minimapRef}
              className="relative cursor-crosshair"
              style={{
                width: MINIMAP_WIDTH,
                height: MINIMAP_HEIGHT,
                backgroundColor: 'var(--hivelab-canvas, #0E0E0E)',
              }}
              onMouseDown={handleMouseDown}
            >
              {/* Connections */}
              <svg
                className="absolute inset-0 pointer-events-none"
                width={MINIMAP_WIDTH}
                height={MINIMAP_HEIGHT}
              >
                {connections.map((conn) => {
                  const fromEl = elements.find((e) => e.instanceId === conn.from.instanceId);
                  const toEl = elements.find((e) => e.instanceId === conn.to.instanceId);
                  if (!fromEl || !toEl) return null;

                  const from = toMinimapCoords(
                    fromEl.position.x + fromEl.size.width / 2,
                    fromEl.position.y + fromEl.size.height / 2
                  );
                  const to = toMinimapCoords(
                    toEl.position.x + toEl.size.width / 2,
                    toEl.position.y + toEl.size.height / 2
                  );

                  return (
                    <line
                      key={conn.id}
                      x1={from.x}
                      y1={from.y}
                      x2={to.x}
                      y2={to.y}
                      stroke={COLORS.connection}
                      strokeWidth={1}
                    />
                  );
                })}
              </svg>

              {/* Elements */}
              {elements.map((el) => {
                const pos = toMinimapCoords(el.position.x, el.position.y);
                const isSelected = selectedIds.includes(el.id);

                // Calculate size with minimum visibility
                const width = Math.max(el.size.width * scale, 3);
                const height = Math.max(el.size.height * scale, 2);

                return (
                  <div
                    key={el.id}
                    className="absolute rounded-sm pointer-events-none"
                    style={{
                      left: pos.x,
                      top: pos.y,
                      width,
                      height,
                      backgroundColor: isSelected ? COLORS.elementSelected : COLORS.element,
                      opacity: isSelected ? 1 : 0.6,
                    }}
                  />
                );
              })}

              {/* Viewport indicator */}
              <div
                className="absolute pointer-events-none rounded-sm transition-[left,top,width,height] duration-75"
                style={{
                  left: Math.max(0, viewport.x),
                  top: Math.max(0, viewport.y),
                  width: Math.min(viewport.width, MINIMAP_WIDTH - viewport.x),
                  height: Math.min(viewport.height, MINIMAP_HEIGHT - viewport.y),
                  backgroundColor: COLORS.viewport,
                  border: `1px solid ${COLORS.viewportBorder}`,
                }}
              />
            </div>
          </motion.div>
        ) : (
          <motion.button
            key="collapsed"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            onClick={() => setIsExpanded(true)}
            className="p-2 rounded-lg transition-colors"
            style={{
              backgroundColor: COLORS.bg,
              border: `1px solid ${COLORS.border}`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.bgHover;
              e.currentTarget.style.borderColor = COLORS.borderEmphasis;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.bg;
              e.currentTarget.style.borderColor = COLORS.border;
            }}
            aria-label="Show minimap"
          >
            <MapIcon className="w-4 h-4" style={{ color: COLORS.text }} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

export default CanvasMinimap;
