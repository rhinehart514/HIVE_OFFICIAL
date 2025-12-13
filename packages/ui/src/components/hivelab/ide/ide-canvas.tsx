'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Box,
  ArrowRight,
  Move,
  Trash2,
  GripVertical,
} from 'lucide-react';
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
  onSelect: (ids: string[], append?: boolean) => void;
  onUpdateElement: (id: string, updates: Partial<CanvasElement>) => void;
  onDeleteElements: (ids: string[]) => void;
  onAddConnection: (from: Connection['from'], to: Connection['to']) => void;
  onDeleteConnection: (id: string) => void;
  onZoomChange: (zoom: number) => void;
  onPanChange: (pan: { x: number; y: number }) => void;
  onDrop: (elementId: string, position: { x: number; y: number }) => void;
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
}

// Minimum element dimensions
const MIN_WIDTH = 120;
const MIN_HEIGHT = 80;

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
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, snapToGrid, snapToElements, gridSize, onUpdate, allElements, element.id, element.size, onDragStateChange]);

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
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, resizeStart, snapToGrid, gridSize, onUpdate]);

  const displayName = element.elementId
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <motion.div
      ref={nodeRef}
      initial={{ opacity: 0, scale: 0.8, y: 10 }}
      animate={{
        opacity: 1,
        scale: isDragging ? 1.02 : 1,
        y: 0,
        boxShadow: isSelected
          ? '0 0 0 2px rgba(255,215,0,0.3), 0 8px 32px rgba(0,0,0,0.4)'
          : isDragging
            ? '0 16px 48px rgba(0,0,0,0.5)'
            : '0 4px 16px rgba(0,0,0,0.3)',
      }}
      exit={{ opacity: 0, scale: 0.9, y: -10 }}
      transition={springPresets.snappy}
      whileHover={!isDragging && !isSelected ? { scale: 1.01 } : {}}
      className={cn(
        'absolute rounded-xl border-2 bg-[#1a1a1a]',
        isSelected
          ? 'border-[#FFD700]'
          : 'border-[#333] hover:border-[#555]',
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
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Selection ring with pulse animation */}
      <AnimatePresence>
        {isSelected && !prefersReducedMotion && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{
              opacity: [0.5, 0.8, 0.5],
              scale: [1, 1.02, 1],
            }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{
              opacity: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
              scale: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
            }}
            className="absolute -inset-1 rounded-xl border-2 border-[#FFD700]/40 pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Outer glow ring when selected */}
      {isSelected && (
        <div className="absolute -inset-[3px] rounded-xl bg-gradient-to-r from-[#FFD700]/10 via-[#FFD700]/5 to-[#FFD700]/10 pointer-events-none" />
      )}
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#333] bg-[#252525] rounded-t-xl">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#FFD700]" />
          <span className="text-sm font-medium text-white truncate max-w-[120px]">
            {displayName}
          </span>
        </div>
        {isSelected && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="p-1 text-[#666] hover:text-white rounded transition-colors"
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
              className="p-1 text-[#666] hover:text-red-400 rounded transition-colors"
              title="Delete"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 text-xs text-[#888]">
        <p className="line-clamp-2">
          {String(
            element.config?.placeholder ||
              element.config?.label ||
              element.config?.title ||
              'Configure this element...'
          )}
        </p>
      </div>

      {/* Connection Ports */}
      {/* Input Port (Left) */}
      <button
        type="button"
        className={cn(
          'absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 transition-all',
          mode === 'connect'
            ? 'bg-green-500 border-green-400 cursor-pointer hover:scale-125'
            : 'bg-[#333] border-[#555]'
        )}
        onClick={(e) => {
          e.stopPropagation();
          if (mode === 'connect') {
            onEndConnection('input');
          }
        }}
        title="Input port"
      />

      {/* Output Port (Right) */}
      <button
        type="button"
        className={cn(
          'absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 transition-all',
          mode === 'connect'
            ? 'bg-blue-500 border-blue-400 cursor-pointer hover:scale-125'
            : 'bg-[#333] border-[#555]'
        )}
        onClick={(e) => {
          e.stopPropagation();
          if (mode === 'connect') {
            onStartConnection('output');
          }
        }}
        title="Output port"
      />

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
            className={cn(
              "transition-colors",
              isResizing ? "text-[#FFD700]" : "text-[#666] group-hover:text-[#888]"
            )}
          >
            <path
              d="M11 1L1 11M11 6L6 11M11 11L11 11"
              stroke="currentColor"
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
            className="absolute -right-1 top-4 bottom-4 w-2 cursor-e-resize hover:bg-[#FFD700]/20 rounded"
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
              };
              window.addEventListener('mousemove', handleMove);
              window.addEventListener('mouseup', handleUp);
            }}
          />
          {/* Bottom edge */}
          <div
            className="absolute -bottom-1 left-4 right-4 h-2 cursor-s-resize hover:bg-[#FFD700]/20 rounded"
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
}: {
  connection: Connection;
  elements: CanvasElement[];
  onDelete: () => void;
  isNew?: boolean;
}) {
  const fromElement = elements.find((e) => e.instanceId === connection.from.instanceId);
  const toElement = elements.find((e) => e.instanceId === connection.to.instanceId);
  const [isHovered, setIsHovered] = useState(false);

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

      {/* Glow effect on hover */}
      <motion.path
        d={path}
        fill="none"
        stroke="#FFD700"
        strokeWidth="8"
        strokeOpacity="0"
        strokeLinecap="round"
        initial={{ strokeOpacity: 0 }}
        animate={{ strokeOpacity: isHovered ? 0.15 : 0 }}
        transition={{ duration: 0.2 }}
        className="pointer-events-none"
        style={{ filter: 'blur(4px)' }}
      />

      {/* Visible path with draw animation */}
      <motion.path
        d={path}
        fill="none"
        stroke="#FFD700"
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0, strokeOpacity: 0.3 }}
        animate={{
          pathLength: 1,
          strokeOpacity: isHovered ? 1 : 0.6,
        }}
        transition={{
          pathLength: { duration: 0.4, ease: 'easeOut' },
          strokeOpacity: { duration: 0.2 },
        }}
        className="pointer-events-none"
      />

      {/* Animated flow particles along the path */}
      <motion.circle
        r="3"
        fill="#FFD700"
        className="pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{
          opacity: isHovered ? [0, 0.8, 0] : 0,
          offsetDistance: ['0%', '100%'],
        }}
        transition={{
          duration: 1.5,
          repeat: isHovered ? Infinity : 0,
          ease: 'linear',
        }}
        style={{
          offsetPath: `path("${path}")`,
        }}
      />

      {/* Arrow/endpoint at destination */}
      <motion.circle
        cx={toX}
        cy={toY}
        fill="#FFD700"
        initial={{ r: 0, opacity: 0 }}
        animate={{
          r: isHovered ? 6 : 4,
          opacity: 1,
        }}
        transition={springPresets.snappy}
        className="pointer-events-none"
      />

      {/* Pulse ring on endpoint when hovered */}
      <AnimatePresence>
        {isHovered && (
          <motion.circle
            cx={toX}
            cy={toY}
            fill="none"
            stroke="#FFD700"
            strokeWidth="2"
            initial={{ r: 4, opacity: 0.8 }}
            animate={{ r: 12, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, repeat: Infinity }}
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
              fill="#1a1a1a"
              stroke="#ff4444"
              strokeWidth="2"
              className="cursor-pointer"
              onClick={onDelete}
            />
            <text
              x={(fromX + toX) / 2}
              y={(fromY + toY) / 2 + 1}
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-[10px] fill-[#ff4444] font-bold select-none pointer-events-none"
            >
              ×
            </text>
          </motion.g>
        )}
      </AnimatePresence>
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
  onSelect,
  onUpdateElement,
  onDeleteElements,
  onAddConnection,
  onDeleteConnection,
  onZoomChange,
  onPanChange,
  onDrop,
}: IDECanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [connectionStart, setConnectionStart] = useState<{
    instanceId: string;
    port: string;
  } | null>(null);
  // Track which element is being dragged for smart guides
  const [draggingElementId, setDraggingElementId] = useState<string | null>(null);
  const [snapToElements] = useState(true); // Enable snap to elements by default

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

  // Handle pan drag
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (mode === 'pan' || e.button === 1) {
        // Middle click or pan mode
        setIsPanning(true);
        setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
        e.preventDefault();
      } else if (mode === 'select' && e.target === canvasRef.current?.querySelector('.canvas-bg')) {
        // Click on background - clear selection
        onSelect([]);
      }
    },
    [mode, pan, onSelect]
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
      onAddConnection(
        { instanceId: connectionStart.instanceId, port: connectionStart.port },
        { instanceId, port }
      );
    }
    setConnectionStart(null);
  };

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
      {/* Background with grid */}
      <div
        className={cn(
          'canvas-bg absolute inset-0',
          showGrid && 'bg-[#0a0a0a]'
        )}
        style={{
          backgroundImage: showGrid
            ? `radial-gradient(circle at 1px 1px, #333 1px, transparent 0)`
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
          {connections.map((conn) => (
            <ConnectionLine
              key={conn.id}
              connection={conn}
              elements={elements}
              onDelete={() => onDeleteConnection(conn.id)}
            />
          ))}
        </svg>

        {/* Elements */}
        {elements
          .filter((el) => el.visible)
          .map((element) => (
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
            />
          ))}

        {/* Smart Guides - show during drag */}
        <SmartGuides
          elements={elements}
          draggingElement={draggingElementId ? elements.find(el => el.id === draggingElementId) || null : null}
          threshold={8}
          zoom={zoom}
        />
      </div>

      {/* Empty State */}
      {elements.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center space-y-4 max-w-md">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-[#1a1a1a] border border-[#333] flex items-center justify-center">
              <Box className="h-10 w-10 text-[#444]" />
            </div>
            <h3 className="text-xl font-semibold text-white">Start Building</h3>
            <p className="text-sm text-[#888]">
              Drag elements from the left panel onto the canvas, or press{' '}
              <kbd className="px-1.5 py-0.5 bg-[#252525] rounded text-xs">⌘K</kbd>{' '}
              to use AI.
            </p>
          </div>
        </div>
      )}

      {/* Zoom indicator */}
      <div className="absolute bottom-4 right-4 px-2 py-1 bg-[#1a1a1a] border border-[#333] rounded text-xs text-[#888]">
        {Math.round(zoom * 100)}%
      </div>

      {/* Connection mode indicator */}
      {connectionStart && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-blue-500/20 border border-blue-500/30 rounded-full text-sm text-blue-400">
          Click an input port to connect
        </div>
      )}
    </div>
  );
}
