'use client';

import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ArrowRightIcon, TrashIcon, Bars3Icon, ArrowsPointingOutIcon, CubeIcon, PlusIcon } from '@heroicons/react/24/outline';

// Aliases for lucide compatibility
const Move = ArrowsPointingOutIcon;
const Box = CubeIcon;

// Viewport buffer - render elements this many pixels outside visible area
const VIEWPORT_BUFFER = 200;

// ============================================
// Make.com-Style Color Palette
// ============================================
const MAKE_COLORS = {
  // Canvas background - mint green
  canvasBg: '#E8F5E9',
  canvasGrid: '#C8E6C9',

  // Node category colors (light tinted backgrounds)
  nodeInput: '#FFEBEE',      // Pink for inputs
  nodeDisplay: '#E3F2FD',    // Blue for display
  nodeAction: '#FFF3E0',     // Orange for actions
  nodeLogic: '#F3E5F5',      // Purple for logic
  nodeData: '#E8F5E9',       // Green for data
  nodeBorder: 'rgba(0,0,0,0.08)',
  nodeBorderHover: 'rgba(0,0,0,0.15)',
  nodeBorderSelected: 'rgba(0,0,0,0.25)',

  // Connections
  connectionLine: '#4CAF50',
  connectionDot: '#2E7D32',
  connectionGlow: 'rgba(76, 175, 80, 0.3)',

  // Text
  textPrimary: '#212121',
  textSecondary: '#757575',
  textTertiary: '#9E9E9E',

  // UI
  panelBg: '#ffffff',
  panelBorder: '#e0e0e0',
};

// Map element types to category colors
function getNodeColor(elementId: string): string {
  const inputElements = ['search-input', 'date-picker', 'user-selector', 'form-builder', 'event-picker', 'space-picker', 'member-selector'];
  const displayElements = ['result-list', 'chart-display', 'tag-cloud', 'map-view', 'notification-center', 'connection-list', 'space-feed', 'space-stats'];
  const actionElements = ['poll', 'rsvp-button', 'announcement'];
  const logicElements = ['filter-selector', 'countdown-timer', 'counter', 'timer', 'role-gate'];

  if (inputElements.includes(elementId)) return MAKE_COLORS.nodeInput;
  if (displayElements.includes(elementId)) return MAKE_COLORS.nodeDisplay;
  if (actionElements.includes(elementId)) return MAKE_COLORS.nodeAction;
  if (logicElements.includes(elementId)) return MAKE_COLORS.nodeLogic;
  return MAKE_COLORS.nodeData;
}
import { cn } from '../../../lib/utils';
import { springPresets, easingArrays } from '@hive/tokens';
import type { CanvasElement, Connection, ToolMode } from './types';
import { SmartGuides, snapToGuides } from './smart-guides';

interface IDECanvasProps {
  elements: CanvasElement[];
  connections: Connection[];
  selectedIds: string[];
  zoom: number;
  pan: { x: number; y: number };
  showGrid: boolean;
  gridSize: number;
  snapToGrid: boolean;
  mode: ToolMode;
  /** Set of connection IDs that are currently flowing data (for visual feedback) */
  flowingConnections?: Set<string>;
  onSelect: (ids: string[], append?: boolean) => void;
  onUpdateElement: (id: string, updates: Partial<CanvasElement>) => void;
  onDeleteElements: (ids: string[]) => void;
  onAddConnection: (from: Connection['from'], to: Connection['to']) => void;
  onDeleteConnection: (id: string) => void;
  onZoomChange: (zoom: number) => void;
  onPanChange: (pan: { x: number; y: number }) => void;
  onDrop: (elementId: string, position: { x: number; y: number }) => void;
  /** Called when a drag/resize operation completes (for undo history) */
  onTransformEnd?: () => void;
}

interface ElementNodeProps {
  element: CanvasElement;
  allElements: CanvasElement[];
  isSelected: boolean;
  mode: ToolMode;
  onSelect: (append?: boolean) => void;
  onUpdate: (updates: Partial<CanvasElement>) => void;
  onDelete: () => void;
  onStartConnection: (port: string) => void;
  onEndConnection: (port: string) => void;
  onDragStateChange: (isDragging: boolean) => void;
  snapToGrid: boolean;
  snapToElements: boolean;
  gridSize: number;
  /** Called when drag/resize completes (for undo history) */
  onTransformEnd?: () => void;
}

// Minimum element dimensions
const MIN_WIDTH = 120;
const MIN_HEIGHT = 80;

/**
 * Calculate viewport bounds in canvas coordinates
 */
function getViewportBounds(
  containerWidth: number,
  containerHeight: number,
  pan: { x: number; y: number },
  zoom: number,
  buffer: number = VIEWPORT_BUFFER
): { left: number; top: number; right: number; bottom: number } {
  // Convert viewport to canvas coordinates
  const left = (-pan.x - buffer) / zoom;
  const top = (-pan.y - buffer) / zoom;
  const right = (containerWidth - pan.x + buffer) / zoom;
  const bottom = (containerHeight - pan.y + buffer) / zoom;

  return { left, top, right, bottom };
}

/**
 * Check if an element is within the viewport bounds
 */
function isElementVisible(
  element: CanvasElement,
  bounds: { left: number; top: number; right: number; bottom: number }
): boolean {
  const elLeft = element.position.x;
  const elTop = element.position.y;
  const elRight = element.position.x + element.size.width;
  const elBottom = element.position.y + element.size.height;

  // Check if rectangles intersect
  return (
    elLeft < bounds.right &&
    elRight > bounds.left &&
    elTop < bounds.bottom &&
    elBottom > bounds.top
  );
}

/**
 * Check if a connection should be visible
 * A connection is visible if either endpoint element is visible
 */
function isConnectionVisible(
  connection: Connection,
  elements: CanvasElement[],
  bounds: { left: number; top: number; right: number; bottom: number }
): boolean {
  const fromElement = elements.find((e) => e.instanceId === connection.from.instanceId);
  const toElement = elements.find((e) => e.instanceId === connection.to.instanceId);

  if (!fromElement || !toElement) return false;

  return isElementVisible(fromElement, bounds) || isElementVisible(toElement, bounds);
}

function ElementNode({
  element,
  allElements,
  isSelected,
  mode,
  onSelect,
  onUpdate,
  onDelete,
  onStartConnection,
  onEndConnection,
  onDragStateChange,
  snapToGrid,
  snapToElements,
  gridSize,
  onTransformEnd,
}: ElementNodeProps) {
  const prefersReducedMotion = useReducedMotion();
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [isNew, setIsNew] = useState(true);
  const nodeRef = useRef<HTMLDivElement>(null);

  // Mark as not new after mount animation
  useEffect(() => {
    const timer = setTimeout(() => setIsNew(false), 400);
    return () => clearTimeout(timer);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (mode !== 'select' || element.locked) return;
    e.stopPropagation();

    onSelect(e.shiftKey || e.metaKey);

    if (e.button === 0) {
      setIsDragging(true);
      onDragStateChange(true);
      setDragOffset({
        x: e.clientX - element.position.x,
        y: e.clientY - element.position.y,
      });
    }
  };

  // Handle resize start
  const handleResizeMouseDown = (e: React.MouseEvent) => {
    if (element.locked) return;
    e.stopPropagation();
    e.preventDefault();

    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: element.size.width,
      height: element.size.height,
    });
  };

  // Handle dragging with smart snapping
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      let x = e.clientX - dragOffset.x;
      let y = e.clientY - dragOffset.y;

      // First, snap to elements if enabled (higher priority)
      if (snapToElements) {
        const snapped = snapToGuides(
          { x, y },
          element.size,
          allElements,
          element.id,
          8 // threshold
        );
        x = snapped.x;
        y = snapped.y;
      }

      // Then apply grid snap if enabled and not already snapped to element
      if (snapToGrid) {
        x = Math.round(x / gridSize) * gridSize;
        y = Math.round(y / gridSize) * gridSize;
      }

      onUpdate({ position: { x, y } });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      onDragStateChange(false);
      // Push to undo history when drag completes
      onTransformEnd?.();
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, snapToGrid, snapToElements, gridSize, onUpdate, allElements, element.id, element.size, onDragStateChange, onTransformEnd]);

  // Handle resizing
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - resizeStart.x;
      const dy = e.clientY - resizeStart.y;

      let newWidth = resizeStart.width + dx;
      let newHeight = resizeStart.height + dy;

      // Apply minimum size constraints
      newWidth = Math.max(MIN_WIDTH, newWidth);
      newHeight = Math.max(MIN_HEIGHT, newHeight);

      // Snap to grid if enabled
      if (snapToGrid) {
        newWidth = Math.round(newWidth / gridSize) * gridSize;
        newHeight = Math.round(newHeight / gridSize) * gridSize;
      }

      onUpdate({ size: { width: newWidth, height: newHeight } });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      // Push to undo history when resize completes
      onTransformEnd?.();
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, resizeStart, snapToGrid, gridSize, onUpdate, onTransformEnd]);

  const displayName = element.elementId
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  // Get category-based color for Make.com style
  const nodeColor = getNodeColor(element.elementId);

  return (
    <motion.div
      ref={nodeRef}
      initial={{ opacity: 0, scale: 0.8, y: 10 }}
      animate={{
        opacity: 1,
        scale: isDragging ? 1.02 : 1,
        y: 0,
        boxShadow: isSelected
          ? `0 0 0 2px ${MAKE_COLORS.nodeBorderSelected}, 0 8px 24px rgba(0,0,0,0.15)`
          : isDragging
            ? '0 16px 32px rgba(0,0,0,0.2)'
            : '0 2px 8px rgba(0,0,0,0.08)',
      }}
      exit={{ opacity: 0, scale: 0.9, y: -10 }}
      transition={springPresets.snappy}
      whileHover={!isDragging && !isSelected ? { scale: 1.02, y: -2 } : {}}
      className={cn(
        'absolute rounded-2xl',
        isDragging && 'cursor-grabbing z-50',
        element.locked && 'opacity-60',
        !element.visible && 'opacity-30'
      )}
      style={{
        left: element.position.x,
        top: element.position.y,
        width: element.size.width,
        height: element.size.height,
        zIndex: isDragging ? 1000 : element.zIndex || 1,
        backgroundColor: nodeColor,
        border: isSelected
          ? `2px solid ${MAKE_COLORS.nodeBorderSelected}`
          : `1px solid ${MAKE_COLORS.nodeBorder}`,
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Selection ring with pulse animation */}
      <AnimatePresence>
        {isSelected && !prefersReducedMotion && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{
              opacity: [0.3, 0.5, 0.3],
              scale: [1, 1.02, 1],
            }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{
              opacity: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
              scale: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
            }}
            className="absolute -inset-1 rounded-2xl border-2 pointer-events-none"
            style={{ borderColor: MAKE_COLORS.connectionLine }}
          />
        )}
      </AnimatePresence>

      {/* Header - Make.com style */}
      <div
        className="flex items-center justify-between px-3 py-2.5 rounded-t-2xl"
        style={{
          borderBottom: `1px solid ${MAKE_COLORS.nodeBorder}`,
          backgroundColor: 'rgba(255,255,255,0.5)',
        }}
      >
        <div className="flex items-center gap-2.5">
          {/* Category dot indicator */}
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: MAKE_COLORS.connectionLine }}
          />
          <span
            className="text-sm font-semibold truncate max-w-[140px]"
            style={{ color: MAKE_COLORS.textPrimary }}
          >
            {displayName}
          </span>
        </div>
        {isSelected && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="p-1 rounded transition-colors hover:bg-black/5"
              style={{ color: MAKE_COLORS.textTertiary }}
              title="Move"
            >
              <Move className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-1 rounded transition-colors hover:bg-red-50 hover:text-red-500"
              style={{ color: MAKE_COLORS.textTertiary }}
              title="Delete"
            >
              <TrashIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Content - Make.com style */}
      <div className="p-3">
        <p
          className="text-xs line-clamp-2"
          style={{ color: MAKE_COLORS.textSecondary }}
        >
          {String(
            element.config?.placeholder ||
              element.config?.label ||
              element.config?.title ||
              'Configure this element...'
          )}
        </p>
      </div>

      {/* Connection Ports - Make.com style with green dots */}
      {/* Input Port (Left) */}
      <button
        type="button"
        className={cn(
          'absolute -left-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 transition-all',
          mode === 'connect' && 'cursor-pointer hover:scale-125'
        )}
        style={{
          backgroundColor: mode === 'connect' ? MAKE_COLORS.connectionLine : '#fff',
          borderColor: mode === 'connect' ? MAKE_COLORS.connectionDot : MAKE_COLORS.nodeBorderHover,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (mode === 'connect') {
            onEndConnection('input');
          }
        }}
        title="Input port"
      />

      {/* Output Port (Right) - Plus button style */}
      <button
        type="button"
        className={cn(
          'absolute -right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center',
          mode === 'connect' && 'cursor-pointer hover:scale-125'
        )}
        style={{
          backgroundColor: mode === 'connect' ? MAKE_COLORS.connectionLine : '#fff',
          borderColor: mode === 'connect' ? MAKE_COLORS.connectionDot : MAKE_COLORS.nodeBorderHover,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (mode === 'connect') {
            onStartConnection('output');
          }
        }}
        title="Output port"
      >
        {mode !== 'connect' && (
          <PlusIcon
            className="w-3 h-3"
            style={{ color: MAKE_COLORS.textTertiary }}
          />
        )}
      </button>

      {/* Resize Handle - SE corner (Figma-like) */}
      {isSelected && !element.locked && (
        <div
          className={cn(
            "absolute -right-1 -bottom-1 w-5 h-5 cursor-se-resize z-10",
            "flex items-center justify-center",
            isResizing && "opacity-100"
          )}
          onMouseDown={handleResizeMouseDown}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
          >
            <path
              d="M11 1L1 11M11 6L6 11M11 11L11 11"
              stroke={isResizing ? MAKE_COLORS.textPrimary : MAKE_COLORS.textTertiary}
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </div>
      )}

      {/* Additional resize handles for better UX (like Figma) */}
      {isSelected && !element.locked && (
        <>
          {/* Right edge */}
          <div
            className="absolute -right-1 top-4 bottom-4 w-2 cursor-e-resize hover:bg-black/5 rounded"
            onMouseDown={(e) => {
              if (element.locked) return;
              e.stopPropagation();
              e.preventDefault();
              setIsResizing(true);
              setResizeStart({
                x: e.clientX,
                y: e.clientY,
                width: element.size.width,
                height: element.size.height,
              });
              // Track that this is horizontal-only resize
              const handleMove = (ev: MouseEvent) => {
                const dx = ev.clientX - e.clientX;
                let newWidth = element.size.width + dx;
                newWidth = Math.max(MIN_WIDTH, newWidth);
                if (snapToGrid) {
                  newWidth = Math.round(newWidth / gridSize) * gridSize;
                }
                onUpdate({ size: { ...element.size, width: newWidth } });
              };
              const handleUp = () => {
                setIsResizing(false);
                window.removeEventListener('mousemove', handleMove);
                window.removeEventListener('mouseup', handleUp);
                // Push to undo history
                onTransformEnd?.();
              };
              window.addEventListener('mousemove', handleMove);
              window.addEventListener('mouseup', handleUp);
            }}
          />
          {/* Bottom edge */}
          <div
            className="absolute -bottom-1 left-4 right-4 h-2 cursor-s-resize hover:bg-black/5 rounded"
            onMouseDown={(e) => {
              if (element.locked) return;
              e.stopPropagation();
              e.preventDefault();
              // Track that this is vertical-only resize
              const handleMove = (ev: MouseEvent) => {
                const dy = ev.clientY - e.clientY;
                let newHeight = element.size.height + dy;
                newHeight = Math.max(MIN_HEIGHT, newHeight);
                if (snapToGrid) {
                  newHeight = Math.round(newHeight / gridSize) * gridSize;
                }
                onUpdate({ size: { ...element.size, height: newHeight } });
              };
              const handleUp = () => {
                setIsResizing(false);
                window.removeEventListener('mousemove', handleMove);
                window.removeEventListener('mouseup', handleUp);
                // Push to undo history
                onTransformEnd?.();
              };
              setIsResizing(true);
              window.addEventListener('mousemove', handleMove);
              window.addEventListener('mouseup', handleUp);
            }}
          />
        </>
      )}
    </motion.div>
  );
}

function ConnectionLine({
  connection,
  elements,
  onDelete,
  isNew = false,
  isFlowing = false,
}: {
  connection: Connection;
  elements: CanvasElement[];
  onDelete: () => void;
  isNew?: boolean;
  /** When true, shows animated data flow along the connection */
  isFlowing?: boolean;
}) {
  const fromElement = elements.find((e) => e.instanceId === connection.from.instanceId);
  const toElement = elements.find((e) => e.instanceId === connection.to.instanceId);
  const [isHovered, setIsHovered] = useState(false);

  // Show flow animation when hovered OR when actively flowing data
  const showFlowAnimation = isHovered || isFlowing;

  if (!fromElement || !toElement) return null;

  // Calculate positions
  const fromX = fromElement.position.x + fromElement.size.width;
  const fromY = fromElement.position.y + fromElement.size.height / 2;
  const toX = toElement.position.x;
  const toY = toElement.position.y + toElement.size.height / 2;

  // Bezier curve control points
  const midX = (fromX + toX) / 2;
  const path = `M ${fromX} ${fromY} C ${midX} ${fromY}, ${midX} ${toY}, ${toX} ${toY}`;

  return (
    <g
      className="group cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Invisible wider path for easier clicking */}
      <path
        d={path}
        fill="none"
        stroke="transparent"
        strokeWidth="20"
        onClick={onDelete}
      />

      {/* Glow effect on hover/flow - Make.com green style */}
      <motion.path
        d={path}
        fill="none"
        stroke={isFlowing ? MAKE_COLORS.connectionLine : MAKE_COLORS.connectionLine}
        strokeWidth={isFlowing ? 12 : 8}
        strokeOpacity="0"
        strokeLinecap="round"
        initial={{ strokeOpacity: 0 }}
        animate={{ strokeOpacity: showFlowAnimation ? (isFlowing ? 0.3 : 0.2) : 0 }}
        transition={{ duration: 0.2 }}
        className="pointer-events-none"
        style={{ filter: isFlowing ? 'blur(6px)' : 'blur(4px)' }}
      />

      {/* Visible path with draw animation - Make.com green */}
      <motion.path
        d={path}
        fill="none"
        stroke={MAKE_COLORS.connectionLine}
        strokeWidth={isFlowing ? 3 : 2}
        strokeLinecap="round"
        initial={{ pathLength: 0, strokeOpacity: 0.3 }}
        animate={{
          pathLength: 1,
          strokeOpacity: showFlowAnimation ? 1 : 0.7,
        }}
        transition={{
          pathLength: { duration: 0.4, ease: 'easeOut' },
          strokeOpacity: { duration: 0.2 },
        }}
        className="pointer-events-none"
      />

      {/* Animated flow particles along the path */}
      <motion.circle
        r={isFlowing ? 5 : 3}
        fill={MAKE_COLORS.connectionLine}
        className="pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{
          opacity: showFlowAnimation ? [0, 1, 0] : 0,
          offsetDistance: ['0%', '100%'],
        }}
        transition={{
          duration: isFlowing ? 0.8 : 1.5,
          repeat: showFlowAnimation ? Infinity : 0,
          ease: 'linear',
        }}
        style={{
          offsetPath: `path("${path}")`,
        }}
      />

      {/* Second flow particle for flowing state (faster animation) */}
      {isFlowing && (
        <motion.circle
          r={4}
          fill={MAKE_COLORS.connectionLine}
          className="pointer-events-none"
          animate={{
            opacity: [0, 0.8, 0],
            offsetDistance: ['0%', '100%'],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            ease: 'linear',
            delay: 0.4,
          }}
          style={{
            offsetPath: `path("${path}")`,
          }}
        />
      )}

      {/* Endpoint dot - Make.com style darker green */}
      <motion.circle
        cx={toX}
        cy={toY}
        fill={MAKE_COLORS.connectionDot}
        initial={{ r: 0, opacity: 0 }}
        animate={{
          r: showFlowAnimation ? (isFlowing ? 8 : 6) : 5,
          opacity: 1,
        }}
        transition={springPresets.snappy}
        className="pointer-events-none"
      />

      {/* Start endpoint dot */}
      <motion.circle
        cx={fromX}
        cy={fromY}
        fill={MAKE_COLORS.connectionDot}
        initial={{ r: 0, opacity: 0 }}
        animate={{ r: 5, opacity: 1 }}
        transition={springPresets.snappy}
        className="pointer-events-none"
      />

      {/* Pulse ring on endpoint when hovered or flowing */}
      <AnimatePresence>
        {showFlowAnimation && (
          <motion.circle
            cx={toX}
            cy={toY}
            fill="none"
            stroke={MAKE_COLORS.connectionLine}
            strokeWidth="2"
            initial={{ r: 4, opacity: 0.8 }}
            animate={{ r: isFlowing ? 16 : 12, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: isFlowing ? 0.4 : 0.6, repeat: Infinity }}
            className="pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Delete indicator on hover */}
      <AnimatePresence>
        {isHovered && (
          <motion.g
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={springPresets.snappy}
          >
            <circle
              cx={(fromX + toX) / 2}
              cy={(fromY + toY) / 2}
              r="12"
              fill={MAKE_COLORS.panelBg}
              stroke="#ef4444"
              strokeWidth="2"
              className="cursor-pointer"
              onClick={onDelete}
            />
            <text
              x={(fromX + toX) / 2}
              y={(fromY + toY) / 2 + 1}
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-[10px] font-bold select-none pointer-events-none"
              fill="#ef4444"
            >
              ×
            </text>
          </motion.g>
        )}
      </AnimatePresence>
    </g>
  );
}

/**
 * Visual preview of a connection being drawn
 */
function ConnectionPreviewLine({
  fromElement,
  toPosition,
  fromPort,
}: {
  fromElement: CanvasElement;
  toPosition: { x: number; y: number };
  fromPort: string;
}) {
  // Calculate from position based on port type
  const fromX =
    fromPort === 'output'
      ? fromElement.position.x + fromElement.size.width
      : fromElement.position.x;
  const fromY = fromElement.position.y + fromElement.size.height / 2;

  const toX = toPosition.x;
  const toY = toPosition.y;

  // Bezier curve control points
  const midX = (fromX + toX) / 2;
  const path = `M ${fromX} ${fromY} C ${midX} ${fromY}, ${midX} ${toY}, ${toX} ${toY}`;

  return (
    <g className="pointer-events-none">
      {/* Glow effect - Make.com green */}
      <motion.path
        d={path}
        fill="none"
        stroke={MAKE_COLORS.connectionLine}
        strokeWidth={8}
        strokeOpacity={0.25}
        strokeLinecap="round"
        style={{ filter: 'blur(4px)' }}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.2 }}
      />

      {/* Main path - Make.com green dashed */}
      <motion.path
        d={path}
        fill="none"
        stroke={MAKE_COLORS.connectionLine}
        strokeWidth={2}
        strokeLinecap="round"
        strokeDasharray="8 4"
        initial={{ pathLength: 0, opacity: 0.5 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
      />

      {/* Animated dots along path */}
      <motion.circle
        r={4}
        fill={MAKE_COLORS.connectionLine}
        animate={{
          opacity: [0.3, 1, 0.3],
          offsetDistance: ['0%', '100%'],
        }}
        transition={{
          duration: 0.8,
          repeat: Infinity,
          ease: 'linear',
        }}
        style={{
          offsetPath: `path("${path}")`,
        }}
      />

      {/* Source port indicator */}
      <motion.circle
        cx={fromX}
        cy={fromY}
        r={6}
        fill={MAKE_COLORS.connectionDot}
        initial={{ scale: 0 }}
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 0.5, repeat: Infinity }}
      />

      {/* Cursor endpoint */}
      <motion.circle
        cx={toX}
        cy={toY}
        r={8}
        fill="transparent"
        stroke={MAKE_COLORS.connectionLine}
        strokeWidth={2}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 500 }}
      />
    </g>
  );
}

export function IDECanvas({
  elements,
  connections,
  selectedIds,
  zoom,
  pan,
  showGrid,
  gridSize,
  snapToGrid,
  mode,
  flowingConnections,
  onSelect,
  onUpdateElement,
  onDeleteElements,
  onAddConnection,
  onDeleteConnection,
  onZoomChange,
  onPanChange,
  onDrop,
  onTransformEnd,
}: IDECanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [connectionStart, setConnectionStart] = useState<{
    instanceId: string;
    port: string;
  } | null>(null);
  // Mouse position for connection preview
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  // Track which element is being dragged for smart guides
  const [draggingElementId, setDraggingElementId] = useState<string | null>(null);
  const [snapToElements] = useState(true); // Enable snap to elements by default

  // Selection rectangle state
  const [selectionRect, setSelectionRect] = useState<{
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  } | null>(null);
  const [isDrawingSelection, setIsDrawingSelection] = useState(false);

  // Viewport size for virtualization
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });

  // Track container size with ResizeObserver
  useEffect(() => {
    if (!canvasRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setViewportSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    resizeObserver.observe(canvasRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Calculate viewport bounds for virtualization
  const viewportBounds = useMemo(() => {
    if (viewportSize.width === 0 || viewportSize.height === 0) {
      // Return very large bounds if size not yet measured
      return { left: -10000, top: -10000, right: 10000, bottom: 10000 };
    }
    return getViewportBounds(viewportSize.width, viewportSize.height, pan, zoom);
  }, [viewportSize.width, viewportSize.height, pan, zoom]);

  // Filter elements and connections to only visible ones (virtualization)
  const visibleElements = useMemo(() => {
    // Don't virtualize if dragging (need all elements for snapping)
    if (draggingElementId) return elements.filter((el) => el.visible);
    return elements.filter((el) => el.visible && isElementVisible(el, viewportBounds));
  }, [elements, viewportBounds, draggingElementId]);

  const visibleConnections = useMemo(() => {
    return connections.filter((conn) => isConnectionVisible(conn, elements, viewportBounds));
  }, [connections, elements, viewportBounds]);

  // Handle wheel zoom
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        const newZoom = Math.min(3, Math.max(0.25, zoom + delta));
        onZoomChange(newZoom);
      } else if (mode === 'pan' || e.shiftKey) {
        // Pan with shift+scroll
        onPanChange({
          x: pan.x - e.deltaX,
          y: pan.y - e.deltaY,
        });
      }
    },
    [zoom, pan, mode, onZoomChange, onPanChange]
  );

  // Handle pan drag and selection rectangle
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (mode === 'pan' || e.button === 1) {
        // Middle click or pan mode
        setIsPanning(true);
        setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
        e.preventDefault();
      } else if (mode === 'select' && e.target === canvasRef.current?.querySelector('.canvas-bg')) {
        // Click on background - start selection rectangle
        const rect = canvasRef.current!.getBoundingClientRect();
        const x = (e.clientX - rect.left - pan.x) / zoom;
        const y = (e.clientY - rect.top - pan.y) / zoom;

        setSelectionRect({ startX: x, startY: y, endX: x, endY: y });
        setIsDrawingSelection(true);

        // Clear selection unless shift is held
        if (!e.shiftKey) {
          onSelect([]);
        }
      }
    },
    [mode, pan, zoom, onSelect]
  );

  useEffect(() => {
    if (!isPanning) return;

    const handleMouseMove = (e: MouseEvent) => {
      onPanChange({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    };

    const handleMouseUp = () => {
      setIsPanning(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isPanning, panStart, onPanChange]);

  // Handle selection rectangle drag
  useEffect(() => {
    if (!isDrawingSelection || !canvasRef.current) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvasRef.current!.getBoundingClientRect();
      const x = (e.clientX - rect.left - pan.x) / zoom;
      const y = (e.clientY - rect.top - pan.y) / zoom;

      setSelectionRect((prev) =>
        prev ? { ...prev, endX: x, endY: y } : null
      );
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (selectionRect) {
        // Calculate normalized rectangle bounds
        const left = Math.min(selectionRect.startX, selectionRect.endX);
        const right = Math.max(selectionRect.startX, selectionRect.endX);
        const top = Math.min(selectionRect.startY, selectionRect.endY);
        const bottom = Math.max(selectionRect.startY, selectionRect.endY);

        // Find elements that intersect with selection rectangle
        const selectedElementIds = elements
          .filter((el) => {
            const elLeft = el.position.x;
            const elRight = el.position.x + el.size.width;
            const elTop = el.position.y;
            const elBottom = el.position.y + el.size.height;

            // Check if rectangles intersect
            return (
              elLeft < right &&
              elRight > left &&
              elTop < bottom &&
              elBottom > top
            );
          })
          .map((el) => el.id);

        if (selectedElementIds.length > 0) {
          // If shift was held, add to existing selection
          if (e.shiftKey) {
            onSelect([...new Set([...selectedIds, ...selectedElementIds])]);
          } else {
            onSelect(selectedElementIds);
          }
        }
      }

      setSelectionRect(null);
      setIsDrawingSelection(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDrawingSelection, selectionRect, pan, zoom, elements, selectedIds, onSelect]);

  // Handle drop
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const elementId = e.dataTransfer.getData('elementId');
      if (!elementId || !canvasRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      let x = (e.clientX - rect.left - pan.x) / zoom;
      let y = (e.clientY - rect.top - pan.y) / zoom;

      if (snapToGrid) {
        x = Math.round(x / gridSize) * gridSize;
        y = Math.round(y / gridSize) * gridSize;
      }

      onDrop(elementId, { x, y });
    },
    [pan, zoom, snapToGrid, gridSize, onDrop]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  // Handle connection creation
  const handleStartConnection = (instanceId: string, port: string) => {
    setConnectionStart({ instanceId, port });
  };

  const handleEndConnection = (instanceId: string, port: string) => {
    if (connectionStart && connectionStart.instanceId !== instanceId) {
      // Validate port types: connections must go from output → input
      const isValidConnection =
        connectionStart.port === 'output' && port === 'input';

      if (isValidConnection) {
        onAddConnection(
          { instanceId: connectionStart.instanceId, port: connectionStart.port },
          { instanceId, port }
        );
      }
      // Invalid connections (output→output, input→input) are silently ignored
    }
    setConnectionStart(null);
    setMousePos(null);
  };

  // Track mouse position when drawing a connection
  useEffect(() => {
    if (!connectionStart || !canvasRef.current) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvasRef.current!.getBoundingClientRect();
      setMousePos({
        x: (e.clientX - rect.left - pan.x) / zoom,
        y: (e.clientY - rect.top - pan.y) / zoom,
      });
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setConnectionStart(null);
        setMousePos(null);
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      // If clicking on empty space, cancel connection
      const target = e.target as HTMLElement;
      if (!target.closest('button')) {
        setConnectionStart(null);
        setMousePos(null);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [connectionStart, pan, zoom]);

  // Get source element for connection preview
  const connectionSourceElement = connectionStart
    ? elements.find((e) => e.instanceId === connectionStart.instanceId)
    : null;

  return (
    <div
      ref={canvasRef}
      className={cn(
        'flex-1 relative overflow-hidden',
        mode === 'pan' && 'cursor-grab',
        isPanning && 'cursor-grabbing'
      )}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      {/* Background with grid - Make.com mint green style */}
      <div
        className="canvas-bg absolute inset-0"
        style={{
          backgroundColor: MAKE_COLORS.canvasBg,
          backgroundImage: showGrid
            ? `radial-gradient(circle at 1px 1px, ${MAKE_COLORS.canvasGrid} 1px, transparent 0)`
            : 'none',
          backgroundSize: `${gridSize * zoom}px ${gridSize * zoom}px`,
          backgroundPosition: `${pan.x}px ${pan.y}px`,
        }}
      />

      {/* Canvas content - transformed */}
      <div
        className="absolute"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
        }}
      >
        {/* Connections SVG */}
        <svg
          className="absolute inset-0 pointer-events-none overflow-visible"
          style={{ width: 4000, height: 4000 }}
        >
          {visibleConnections.map((conn) => (
            <ConnectionLine
              key={conn.id}
              connection={conn}
              elements={elements}
              onDelete={() => onDeleteConnection(conn.id)}
              isFlowing={flowingConnections?.has(conn.id)}
            />
          ))}

          {/* Connection preview wire while dragging */}
          {connectionStart && connectionSourceElement && mousePos && (
            <ConnectionPreviewLine
              fromElement={connectionSourceElement}
              toPosition={mousePos}
              fromPort={connectionStart.port}
            />
          )}
        </svg>

        {/* Elements (virtualized - only visible ones rendered) */}
        {visibleElements.map((element) => (
          <ElementNode
            key={element.id}
            element={element}
            allElements={elements}
            isSelected={selectedIds.includes(element.id)}
            mode={mode}
            onSelect={(append) =>
              onSelect(
                append
                  ? selectedIds.includes(element.id)
                    ? selectedIds.filter((id) => id !== element.id)
                    : [...selectedIds, element.id]
                  : [element.id]
              )
            }
            onUpdate={(updates) => onUpdateElement(element.id, updates)}
            onDelete={() => onDeleteElements([element.id])}
            onStartConnection={(port) => handleStartConnection(element.instanceId, port)}
            onEndConnection={(port) => handleEndConnection(element.instanceId, port)}
            onDragStateChange={(isDragging) => {
              setDraggingElementId(isDragging ? element.id : null);
            }}
            snapToGrid={snapToGrid}
            snapToElements={snapToElements}
            gridSize={gridSize}
            onTransformEnd={onTransformEnd}
          />
        ))}

        {/* Smart Guides - show during drag */}
        <SmartGuides
          elements={elements}
          draggingElement={draggingElementId ? elements.find(el => el.id === draggingElementId) || null : null}
          threshold={8}
          zoom={zoom}
        />

        {/* Selection Rectangle - Make.com green */}
        {selectionRect && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute pointer-events-none rounded-sm"
            style={{
              left: Math.min(selectionRect.startX, selectionRect.endX),
              top: Math.min(selectionRect.startY, selectionRect.endY),
              width: Math.abs(selectionRect.endX - selectionRect.startX),
              height: Math.abs(selectionRect.endY - selectionRect.startY),
              border: `2px solid ${MAKE_COLORS.connectionLine}`,
              backgroundColor: `${MAKE_COLORS.connectionGlow}`,
            }}
          />
        )}
      </div>

      {/* Empty State - Make.com light theme */}
      {elements.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center space-y-4 max-w-md">
            <div
              className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center"
              style={{
                backgroundColor: MAKE_COLORS.panelBg,
                border: `1px solid ${MAKE_COLORS.panelBorder}`,
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              }}
            >
              <Box className="h-10 w-10" style={{ color: MAKE_COLORS.textTertiary }} />
            </div>
            <h3 className="text-xl font-semibold" style={{ color: MAKE_COLORS.textPrimary }}>
              Start Building
            </h3>
            <p className="text-sm" style={{ color: MAKE_COLORS.textSecondary }}>
              Drag elements from the left panel onto the canvas, or press{' '}
              <kbd
                className="px-1.5 py-0.5 rounded text-xs font-mono"
                style={{
                  backgroundColor: MAKE_COLORS.panelBg,
                  border: `1px solid ${MAKE_COLORS.panelBorder}`,
                  color: MAKE_COLORS.textPrimary,
                }}
              >
                ⌘K
              </kbd>{' '}
              to use AI.
            </p>
          </div>
        </div>
      )}

      {/* Zoom indicator with virtualization stats - Make.com light theme */}
      <div className="absolute bottom-4 right-4 flex items-center gap-2">
        {/* Virtualization indicator - only show when actually virtualizing */}
        {elements.length > 0 && visibleElements.length < elements.length && (
          <div
            className="px-2 py-1 rounded text-xs"
            style={{
              backgroundColor: MAKE_COLORS.panelBg,
              border: `1px solid ${MAKE_COLORS.panelBorder}`,
              color: MAKE_COLORS.textSecondary,
            }}
          >
            <span style={{ color: MAKE_COLORS.textPrimary }}>{visibleElements.length}</span>
            <span className="mx-1">/</span>
            <span>{elements.length}</span>
            <span className="ml-1">visible</span>
          </div>
        )}
        <div
          className="px-2 py-1 rounded text-xs font-medium"
          style={{
            backgroundColor: MAKE_COLORS.panelBg,
            border: `1px solid ${MAKE_COLORS.panelBorder}`,
            color: MAKE_COLORS.textSecondary,
          }}
        >
          {Math.round(zoom * 100)}%
        </div>
      </div>

      {/* Connection mode indicator - Make.com green theme */}
      {connectionStart && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg shadow-lg"
          style={{
            backgroundColor: MAKE_COLORS.panelBg,
            border: `1px solid ${MAKE_COLORS.connectionLine}`,
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-3 h-3 rounded-full animate-pulse"
              style={{ backgroundColor: MAKE_COLORS.connectionLine }}
            />
            <span className="text-sm" style={{ color: MAKE_COLORS.textPrimary }}>
              Click an <span className="font-medium" style={{ color: MAKE_COLORS.connectionLine }}>input port</span> to connect
            </span>
            <span className="text-xs" style={{ color: MAKE_COLORS.textTertiary }}>
              or press ESC to cancel
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
}
