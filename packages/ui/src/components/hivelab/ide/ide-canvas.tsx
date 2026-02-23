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
// HiveLab IDE Color Tokens
// Uses CSS variables from globals.css (--hivelab-*)
// ============================================

// Map element types to category dot colors (for the indicator dot, not full background)
function getCategoryDotColor(elementId: string): string {
  const inputElements = ['search-input', 'date-picker', 'user-selector', 'form-builder', 'event-picker', 'space-picker', 'member-selector'];
  const displayElements = ['result-list', 'chart-display', 'tag-cloud', 'map-view', 'notification-center', 'connection-list', 'space-feed', 'space-stats'];
  const actionElements = ['poll', 'poll-element', 'quick-poll', 'rsvp-button', 'announcement'];
  const logicElements = ['filter-selector', 'countdown-timer', 'countdown', 'counter', 'timer', 'role-gate'];

  if (inputElements.includes(elementId)) return 'var(--hivelab-dot-input)';
  if (displayElements.includes(elementId)) return 'var(--hivelab-dot-display)';
  if (actionElements.includes(elementId)) return 'var(--hivelab-dot-action)';
  if (logicElements.includes(elementId)) return 'var(--hivelab-dot-logic)';
  return 'var(--hivelab-dot-data)';
}
import { cn } from '../../../lib/utils';
import { springPresets, easingArrays } from '@hive/tokens';
import { getElementById, type ElementSpec } from '@hive/core';
import type { CanvasElement, Connection, ToolMode } from './types';
import type { ElementProps } from '../../../lib/hivelab/element-system';
import { ElementErrorBoundary } from '../elements/error-boundary';
import { ElementRenderer, type PreviewMode, getElementModeFromPreviewMode } from './element-renderer';

// ============================================
// Port Info Helper
// ============================================

/**
 * Get port information for an element
 * Returns formatted tooltip text for input/output ports
 */
function getPortTooltip(elementId: string, direction: 'input' | 'output'): string {
  // Normalize element ID (remove instance suffix like -1, -2, etc.)
  const normalizedId = elementId.replace(/-\d+$/, '');
  const spec = getElementById(normalizedId);

  if (!spec) {
    return direction === 'input' ? 'Input port' : 'Output port';
  }

  const ports = direction === 'input' ? spec.inputs : spec.outputs;

  if (!ports || ports.length === 0) {
    return direction === 'input'
      ? 'Receives data automatically'
      : 'No data shared';
  }

  const label = direction === 'input' ? 'Receives' : 'Shares';
  return `${label}: ${ports.join(', ')}`;
}

interface IDECanvasProps {
  elements: CanvasElement[];
  connections: Connection[];
  selectedIds: string[];
  /** Currently selected connection ID */
  selectedConnectionId?: string | null;
  zoom: number;
  pan: { x: number; y: number };
  showGrid: boolean;
  gridSize: number;
  snapToGrid: boolean;
  mode: ToolMode;
  /** Set of connection IDs that are currently flowing data (for visual feedback) */
  flowingConnections?: Set<string>;
  /** ID of the element currently being dragged (for dimming other elements) */
  draggingElementIdGlobal?: string | null;
  /**
   * Element preview mode:
   * - 'static': Fast visual previews (default)
   * - 'live': Live element rendering in edit mode
   * - 'interactive': Fully interactive elements
   */
  previewMode?: PreviewMode;
  /** Shared state for live element rendering */
  sharedState?: ElementProps['sharedState'];
  /** User state for live element rendering */
  userState?: ElementProps['userState'];
  /** Runtime context for live elements */
  elementContext?: ElementProps['context'];
  /** Callback when element data changes (for live mode) */
  onElementChange?: (elementId: string, data: Record<string, unknown>) => void;
  /** Callback when element triggers an action (for live mode) */
  onElementAction?: (elementId: string, action: string, data: Record<string, unknown>) => void;
  onSelect: (ids: string[], append?: boolean) => void;
  onUpdateElement: (id: string, updates: Partial<CanvasElement>) => void;
  onDeleteElements: (ids: string[]) => void;
  onAddConnection: (from: Connection['from'], to: Connection['to']) => void;
  onUpdateConnection?: (id: string, updates: Partial<Connection>) => void;
  onDeleteConnection: (id: string) => void;
  /** Callback when a connection is clicked/selected */
  onSelectConnection?: (id: string | null) => void;
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
  /** Whether another element is currently being dragged (for dimming) */
  anotherElementDragging?: boolean;
  /** Element preview mode: static (fast), live (edit mode), interactive (runtime) */
  previewMode?: PreviewMode;
  /** Shared state for live element rendering */
  sharedState?: ElementProps['sharedState'];
  /** User state for live element rendering */
  userState?: ElementProps['userState'];
  /** Runtime context for live elements */
  elementContext?: ElementProps['context'];
  /** Callback when element data changes */
  onElementChange?: (data: Record<string, unknown>) => void;
  /** Callback when element triggers an action */
  onElementAction?: (action: string, data: Record<string, unknown>) => void;
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

/**
 * Visual preview renderer for canvas elements
 * Shows mini-previews of actual element types instead of generic placeholders
 */
function ElementPreview({ element }: { element: CanvasElement }) {
  const elementId = element.elementId.replace(/-\d+$/, ''); // Normalize ID

  // Quick visual previews for common elements
  switch (elementId) {
    case 'poll-element':
    case 'poll':
    case 'quick-poll': {
      // Use actual options from config, or fallback to defaults
      const options = (element.config?.options as string[]) || ['Option A', 'Option B', 'Option C'];
      const question = String(element.config?.question || 'What do you think?');
      // Generate realistic-looking percentages that add to 100%
      const percentages = options.map((_, i) => Math.max(10, 50 - i * 15 + (i % 2 === 0 ? 5 : -5)));
      const total = percentages.reduce((a, b) => a + b, 0);
      const normalizedPcts = percentages.map(p => Math.round((p / total) * 100));

      return (
        <div className="space-y-2">
          <p className="text-label-sm font-medium" style={{ color: 'var(--hivelab-text-primary)' }}>
            {question}
          </p>
          <div className="space-y-1.5">
            {options.slice(0, 4).map((opt, i) => (
              <div key={i} className="space-y-0.5">
                <div className="flex items-center justify-between">
                  <span className="text-label-xs truncate max-w-[70%]" style={{ color: 'var(--hivelab-text-secondary)' }}>
                    {String(opt)}
                  </span>
                  <span className="text-label-xs font-medium" style={{ color: 'var(--hivelab-text-primary)' }}>
                    {normalizedPcts[i]}%
                  </span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${normalizedPcts[i]}%`,
                      backgroundColor: i === 0 ? 'var(--hivelab-connection)' : 'rgba(212, 175, 55, 0.5)'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          {options.length > 4 && (
            <p className="text-[8px]" style={{ color: 'var(--hivelab-text-tertiary)' }}>
              +{options.length - 4} more options
            </p>
          )}
        </div>
      );
    }

    case 'countdown-timer':
    case 'countdown':
    case 'timer':
      return (
        <div className="flex gap-1.5 justify-center py-1">
          {['02', '14', '32'].map((n, i) => (
            <div key={i} className="flex flex-col items-center">
              <div
                className="px-2 py-1 rounded text-sm font-sans font-bold"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  color: 'var(--hivelab-text-primary)'
                }}
              >
                {n}
              </div>
              <span className="text-[8px] mt-0.5" style={{ color: 'var(--hivelab-text-tertiary)' }}>
                {['hr', 'min', 'sec'][i]}
              </span>
            </div>
          ))}
        </div>
      );

    case 'leaderboard':
    case 'leaderboard-display':
      return (
        <div className="space-y-1">
          {[1, 2, 3].map(n => (
            <div key={n} className="flex items-center gap-2 text-label-xs">
              <span
                className="w-4 text-center font-bold"
                style={{ color: n === 1 ? 'var(--hivelab-connection)' : 'var(--hivelab-text-tertiary)' }}
              >
                #{n}
              </span>
              <div className="w-4 h-4 rounded-full bg-white/10" />
              <div className="flex-1 h-1.5 bg-white/10 rounded" />
              <span style={{ color: 'var(--hivelab-text-secondary)' }}>{100 - n * 15}</span>
            </div>
          ))}
        </div>
      );

    case 'rsvp-button':
    case 'rsvp':
      return (
        <div className="flex flex-col items-center gap-1.5 py-1">
          <div
            className="px-4 py-1.5 rounded-lg text-label-sm font-semibold"
            style={{
              backgroundColor: 'var(--hivelab-connection)',
              color: '#000'
            }}
          >
            RSVP Now
          </div>
          <span className="text-label-xs" style={{ color: 'var(--hivelab-text-tertiary)' }}>
            12 attending
          </span>
        </div>
      );

    case 'photo-gallery':
    case 'gallery':
    case 'image-gallery':
      return (
        <div className="grid grid-cols-2 gap-1">
          {[1, 2, 3, 4].map(n => (
            <div
              key={n}
              className="aspect-square rounded bg-white/10 flex items-center justify-center"
            >
              <svg className="w-3 h-3" style={{ color: 'var(--hivelab-text-tertiary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
              </svg>
            </div>
          ))}
        </div>
      );

    case 'event-card':
    case 'event':
      return (
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded flex flex-col items-center justify-center text-center"
            style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
          >
            <span className="text-[8px] font-medium" style={{ color: 'var(--hivelab-text-tertiary)' }}>JAN</span>
            <span className="text-sm font-bold leading-none" style={{ color: 'var(--hivelab-text-primary)' }}>21</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-label-xs font-medium truncate" style={{ color: 'var(--hivelab-text-primary)' }}>
              {String(element.config?.title || 'Event Title')}
            </p>
            <p className="text-label-xs" style={{ color: 'var(--hivelab-text-tertiary)' }}>7:00 PM</p>
          </div>
        </div>
      );

    case 'announcement':
    case 'announcement-banner':
      return (
        <div
          className="p-2 rounded text-center"
          style={{ backgroundColor: `${'var(--hivelab-connection)'}15` }}
        >
          <p className="text-label-xs font-medium" style={{ color: 'var(--hivelab-connection)' }}>
            📢 {String(element.config?.message || 'Announcement')}
          </p>
        </div>
      );

    case 'form-builder':
    case 'form':
    case 'signup-form': {
      // Use actual fields from config, or fallback to defaults
      const fields = (element.config?.fields as Array<{ label: string; type: string }>) || [
        { label: 'Name', type: 'text' },
        { label: 'Email', type: 'email' },
      ];
      const title = String(element.config?.title || 'Form');

      return (
        <div className="space-y-2">
          <p className="text-label-xs font-medium" style={{ color: 'var(--hivelab-text-primary)' }}>
            {title}
          </p>
          <div className="space-y-1.5">
            {fields.slice(0, 3).map((field, i) => (
              <div key={i}>
                <span className="text-[8px]" style={{ color: 'var(--hivelab-text-tertiary)' }}>
                  {typeof field === 'string' ? field : field.label}
                </span>
                <div
                  className="h-5 rounded border flex items-center px-1.5"
                  style={{ borderColor: 'var(--hivelab-node-border)', backgroundColor: 'rgba(255,255,255,0.03)' }}
                >
                  <span className="text-[8px]" style={{ color: 'var(--hivelab-text-tertiary)' }}>
                    {typeof field === 'string' ? 'Enter...' : field.type === 'email' ? 'email@...' : 'Enter...'}
                  </span>
                </div>
              </div>
            ))}
          </div>
          {fields.length > 3 && (
            <p className="text-[8px]" style={{ color: 'var(--hivelab-text-tertiary)' }}>
              +{fields.length - 3} more fields
            </p>
          )}
        </div>
      );
    }

    case 'search-input':
    case 'search':
      return (
        <div
          className="flex items-center gap-2 px-2 py-1.5 rounded-lg border"
          style={{ borderColor: 'var(--hivelab-node-border)', backgroundColor: 'rgba(255,255,255,0.03)' }}
        >
          <svg className="w-3 h-3" style={{ color: 'var(--hivelab-text-tertiary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <span className="text-label-xs" style={{ color: 'var(--hivelab-text-tertiary)' }}>Search...</span>
        </div>
      );

    case 'counter':
    case 'stat-counter':
      return (
        <div className="text-center py-1">
          <div className="text-2xl font-bold" style={{ color: 'var(--hivelab-connection)' }}>247</div>
          <p className="text-label-xs" style={{ color: 'var(--hivelab-text-tertiary)' }}>
            {String(element.config?.label || 'Total Count')}
          </p>
        </div>
      );

    case 'chart-display':
    case 'chart':
    case 'bar-chart':
    case 'line-chart': {
      const chartType = String(element.config?.chartType || 'bar');
      return (
        <div className="flex items-end justify-center gap-1 h-full py-2">
          {chartType === 'line' ? (
            // Line chart preview
            <svg viewBox="0 0 80 40" className="w-full h-full max-h-16">
              <polyline
                fill="none"
                stroke="var(--hivelab-connection)"
                strokeWidth="2"
                points="5,30 20,20 35,25 50,10 65,15 75,8"
              />
              <circle cx="5" cy="30" r="2" fill="var(--hivelab-connection)" />
              <circle cx="20" cy="20" r="2" fill="var(--hivelab-connection)" />
              <circle cx="35" cy="25" r="2" fill="var(--hivelab-connection)" />
              <circle cx="50" cy="10" r="2" fill="var(--hivelab-connection)" />
              <circle cx="65" cy="15" r="2" fill="var(--hivelab-connection)" />
              <circle cx="75" cy="8" r="2" fill="var(--hivelab-connection)" />
            </svg>
          ) : chartType === 'pie' || chartType === 'doughnut' ? (
            // Pie chart preview
            <svg viewBox="0 0 40 40" className="w-12 h-12">
              <circle cx="20" cy="20" r="15" fill="rgba(255,255,255,0.1)" />
              <path d="M20 20 L20 5 A15 15 0 0 1 35 20 Z" fill="var(--hivelab-connection)" />
              <path d="M20 20 L35 20 A15 15 0 0 1 20 35 Z" fill="rgba(212, 175, 55, 0.6)" />
              {chartType === 'doughnut' && <circle cx="20" cy="20" r="7" fill="var(--hivelab-node-body)" />}
            </svg>
          ) : (
            // Bar chart preview (default)
            [35, 55, 40, 70, 50].map((h, i) => (
              <div
                key={i}
                className="w-3 rounded-t transition-all"
                style={{
                  height: `${h}%`,
                  backgroundColor: i === 3 ? 'var(--hivelab-connection)' : 'rgba(212, 175, 55, 0.4)',
                }}
              />
            ))
          )}
        </div>
      );
    }

    case 'result-list':
    case 'list':
      return (
        <div className="space-y-1.5">
          {[1, 2, 3].map(n => (
            <div key={n} className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-white/10" />
              <div className="flex-1 space-y-1">
                <div className="h-2 bg-white/15 rounded w-3/4" />
                <div className="h-1.5 bg-white/10 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      );

    case 'notification-display':
    case 'notifications':
      return (
        <div className="space-y-1.5">
          {[1, 2].map(n => (
            <div key={n} className="flex items-start gap-2 p-1.5 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
              <div className="w-2 h-2 mt-1 rounded-full" style={{ backgroundColor: n === 1 ? 'var(--hivelab-connection)' : 'var(--hivelab-text-tertiary)' }} />
              <div className="flex-1">
                <div className="h-2 bg-white/15 rounded w-full mb-1" />
                <div className="h-1.5 bg-white/10 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      );

    default:
      // Fallback to config text
      return (
        <p
          className="text-xs line-clamp-2"
          style={{ color: 'var(--hivelab-text-secondary)' }}
        >
          {String(
            element.config?.placeholder ||
              element.config?.label ||
              element.config?.title ||
              element.config?.description ||
              'Configure this element...'
          )}
        </p>
      );
  }
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
  anotherElementDragging,
  previewMode = 'static',
  sharedState,
  userState,
  elementContext,
  onElementChange,
  onElementAction,
}: ElementNodeProps) {
  const prefersReducedMotion = useReducedMotion();
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [isNew, setIsNew] = useState(true);
  const [justDropped, setJustDropped] = useState(false);
  const nodeRef = useRef<HTMLDivElement>(null);

  // Get element spec for port names
  const normalizedElementId = element.elementId.replace(/-\d+$/, '');
  const elementSpec = getElementById(normalizedElementId);
  const defaultOutputPort = elementSpec?.outputs?.[0] || 'output';
  const defaultInputPort = elementSpec?.inputs?.[0] || 'input';

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
      // Smart guides deferred - using grid snap only

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
      // Trigger gold pulse on drop
      if (!prefersReducedMotion) {
        setJustDropped(true);
        setTimeout(() => setJustDropped(false), 400);
      }
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

  // Get category dot color for the indicator
  const categoryDotColor = getCategoryDotColor(element.elementId);

  // Calculate opacity - dim when another element is being dragged (0.7 per DRAMA plan)
  const dimOpacity = anotherElementDragging && !isDragging ? 0.7 : 1;

  return (
    <motion.div
      ref={nodeRef}
      initial={{ opacity: 0, scale: 0.8, y: 10 }}
      animate={{
        opacity: dimOpacity,
        scale: isDragging ? 1.02 : 1,
        y: isSelected && !isDragging ? -2 : 0,
        boxShadow: isSelected
          ? `0 0 0 2px ${'var(--hivelab-node-border-selected)'}, 0 8px 24px rgba(0,0,0,0.15)`
          : isDragging
            ? '0 16px 32px rgba(0,0,0,0.2)'
            : '0 2px 8px rgba(0,0,0,0.08)',
      }}
      exit={{ opacity: 0, scale: 0.9, y: -10 }}
      transition={{
        // 150ms + premium easing per DRAMA plan (not spring)
        duration: 0.15,
        ease: easingArrays.default,
        opacity: { duration: 0.15 },
      }}
      whileHover={!isDragging && !isSelected ? { y: -2 } : {}}
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
        backgroundColor: 'var(--hivelab-node-body)',
        border: isSelected
          ? `2px solid ${'var(--hivelab-node-border-selected)'}`
          : `1px solid ${'var(--hivelab-node-border)'}`,
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
            style={{ borderColor: 'var(--hivelab-connection)' }}
          />
        )}
      </AnimatePresence>

      {/* Gold pulse on drop */}
      <AnimatePresence>
        {justDropped && !prefersReducedMotion && (
          <motion.div
            initial={{ opacity: 0.8, scale: 1 }}
            animate={{ opacity: 0, scale: 1.15 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="absolute -inset-1 rounded-2xl pointer-events-none"
            style={{
              border: `2px solid ${'var(--hivelab-connection)'}`,
              boxShadow: `0 0 20px ${'var(--hivelab-connection)'}60`,
            }}
          />
        )}
      </AnimatePresence>

      {/* AI-generated badge - subtle indicator at top-right */}
      {!!element.config?.aiGenerated && (
        <div
          className="absolute top-1.5 right-1.5 z-10 flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium pointer-events-none"
          style={{
            backgroundColor: 'rgba(212, 175, 55, 0.12)',
            color: 'var(--hivelab-text-tertiary)',
          }}
        >
          <svg
            className="w-2.5 h-2.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3z" />
          </svg>
          AI
        </div>
      )}

      {/* Figma-style: Visual preview as the main content, label appears on hover/selection */}
      <div className="relative h-full flex flex-col">
        {/* Floating label - only visible on hover or selection */}
        <AnimatePresence>
          {(isSelected || isDragging) && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.15 }}
              className="absolute -top-7 left-0 flex items-center gap-1.5 px-2 py-1 rounded-md z-10"
              style={{
                backgroundColor: 'var(--hivelab-panel)',
                border: `1px solid var(--hivelab-node-border)`,
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              }}
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: categoryDotColor }}
              />
              <span
                className="text-xs font-medium"
                style={{ color: 'var(--hivelab-text-primary)' }}
              >
                {displayName}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions - floating top-right on selection */}
        <AnimatePresence>
          {isSelected && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.15 }}
              className="absolute -top-7 right-0 flex items-center gap-0.5 px-1 py-0.5 rounded-md z-10"
              style={{
                backgroundColor: 'var(--hivelab-panel)',
                border: `1px solid var(--hivelab-node-border)`,
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              }}
            >
              <button
                type="button"
                className="p-1 rounded transition-colors hover:bg-white/10"
                style={{ color: 'var(--hivelab-text-secondary)' }}
                title="Move"
              >
                <Move className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="p-1 rounded transition-colors hover:bg-red-500/20 hover:text-red-400"
                style={{ color: 'var(--hivelab-text-secondary)' }}
                title="Delete"
              >
                <TrashIcon className="h-3 w-3" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Visual Preview - fills the entire element */}
        <div className="flex-1 p-4 overflow-hidden">
          {previewMode === 'static' ? (
            <ElementPreview element={element} />
          ) : (
            <ElementRenderer
              element={element}
              mode={getElementModeFromPreviewMode(previewMode) || 'edit'}
              isSelected={isSelected}
              sharedState={sharedState}
              userState={userState}
              context={elementContext}
              onChange={onElementChange}
              onAction={onElementAction}
            />
          )}
        </div>
      </div>

      {/* Connection Ports - Make.com style with green dots */}
      {/* Input Port (Left) */}
      <button
        type="button"
        className={cn(
          'absolute -left-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 transition-all',
          mode === 'connect' && 'cursor-pointer hover:opacity-80'
        )}
        style={{
          backgroundColor: mode === 'connect' ? 'var(--hivelab-connection)' : 'var(--hivelab-panel)',
          borderColor: mode === 'connect' ? 'var(--hivelab-connection)' : 'var(--hivelab-node-border-hover)',
          boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (mode === 'connect') {
            onEndConnection(defaultInputPort);
          }
        }}
        title={getPortTooltip(element.elementId, 'input')}
      />

      {/* Output Port (Right) - Plus button style */}
      <button
        type="button"
        className={cn(
          'absolute -right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center',
          mode === 'connect' && 'cursor-pointer hover:opacity-80'
        )}
        style={{
          backgroundColor: mode === 'connect' ? 'var(--hivelab-connection)' : 'var(--hivelab-panel)',
          borderColor: mode === 'connect' ? 'var(--hivelab-connection)' : 'var(--hivelab-node-border-hover)',
          boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (mode === 'connect') {
            onStartConnection(defaultOutputPort);
          }
        }}
        title={getPortTooltip(element.elementId, 'output')}
      >
        {mode !== 'connect' && (
          <PlusIcon
            className="w-3 h-3"
            style={{ color: 'var(--hivelab-text-tertiary)' }}
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
              stroke={isResizing ? 'var(--hivelab-text-primary)' : 'var(--hivelab-text-tertiary)'}
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
  onSelect,
  isNew = false,
  isFlowing = false,
  isSelected = false,
}: {
  connection: Connection;
  elements: CanvasElement[];
  onDelete: () => void;
  onSelect?: () => void;
  isNew?: boolean;
  /** When true, shows animated data flow along the connection */
  isFlowing?: boolean;
  /** When true, shows connection as selected (gold highlight) */
  isSelected?: boolean;
}) {
  const fromElement = elements.find((e) => e.instanceId === connection.from.instanceId);
  const toElement = elements.find((e) => e.instanceId === connection.to.instanceId);
  const [isHovered, setIsHovered] = useState(false);

  // Show flow animation when hovered OR when actively flowing data
  const showFlowAnimation = isHovered || isFlowing || isSelected;

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
        onClick={(e) => {
          e.stopPropagation();
          onSelect?.();
        }}
      />

      {/* Selection highlight (gold border when selected) */}
      {isSelected && (
        <motion.path
          d={path}
          fill="none"
          stroke={'var(--hivelab-connection)'}
          strokeWidth={6}
          strokeLinecap="round"
          strokeOpacity={0.5}
          className="pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />
      )}

      {/* Glow effect on hover/flow - Make.com green style */}
      <motion.path
        d={path}
        fill="none"
        stroke={isFlowing ? 'var(--hivelab-connection)' : 'var(--hivelab-connection)'}
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
        stroke={'var(--hivelab-connection)'}
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
        fill={'var(--hivelab-connection)'}
        className="pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{
          opacity: showFlowAnimation ? [0, 1, 0] : 0,
          offsetDistance: ['0%', '100%'],
        }}
        transition={{
          // 600ms connection pulse per DRAMA plan
          duration: 0.6,
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
          fill={'var(--hivelab-connection)'}
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
        fill={'var(--hivelab-connection)'}
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
        fill={'var(--hivelab-connection)'}
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
            stroke={'var(--hivelab-connection)'}
            strokeWidth="2"
            initial={{ r: 4, opacity: 0.8 }}
            animate={{ r: isFlowing ? 16 : 12, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, repeat: Infinity }} // 600ms per DRAMA plan
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
              fill={'var(--hivelab-panel)'}
              stroke="var(--hivelab-status-error)"
              strokeWidth="2"
              className="cursor-pointer"
              onClick={onDelete}
            />
            <text
              x={(fromX + toX) / 2}
              y={(fromY + toY) / 2 + 1}
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-label-xs font-bold select-none pointer-events-none"
              fill="var(--hivelab-status-error)"
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
        stroke={'var(--hivelab-connection)'}
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
        stroke={'var(--hivelab-connection)'}
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
        fill={'var(--hivelab-connection)'}
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
        fill={'var(--hivelab-connection)'}
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
        stroke={'var(--hivelab-connection)'}
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
  selectedConnectionId,
  zoom,
  pan,
  showGrid,
  gridSize,
  snapToGrid,
  mode,
  flowingConnections,
  previewMode = 'static',
  sharedState,
  userState,
  elementContext,
  onElementChange,
  onElementAction,
  onSelect,
  onUpdateElement,
  onDeleteElements,
  onAddConnection,
  onUpdateConnection,
  onDeleteConnection,
  onSelectConnection,
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
          onSelectConnection?.(null);
        }
      }
    },
    [mode, pan, zoom, onSelect, onSelectConnection]
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
        className="canvas-bg absolute inset-0 pointer-events-none"
        style={{
          backgroundColor: 'var(--hivelab-canvas)',
          backgroundImage: showGrid
            ? `radial-gradient(circle at 1px 1px, ${'var(--hivelab-grid)'} 1px, transparent 0)`
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
              onSelect={() => onSelectConnection?.(conn.id)}
              isFlowing={flowingConnections?.has(conn.id)}
              isSelected={selectedConnectionId === conn.id}
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
          <ElementErrorBoundary key={element.id} elementType={element.elementId}>
            <ElementNode
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
              anotherElementDragging={draggingElementId !== null && draggingElementId !== element.id}
              previewMode={previewMode}
              sharedState={sharedState}
              userState={userState}
              elementContext={elementContext}
              onElementChange={onElementChange ? (data) => onElementChange(element.id, data) : undefined}
              onElementAction={onElementAction ? (action, data) => onElementAction(element.id, action, data) : undefined}
            />
          </ElementErrorBoundary>
        ))}

        {/* Smart Guides deferred */}
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
              border: `2px solid ${'var(--hivelab-connection)'}`,
              backgroundColor: `${'var(--hivelab-connection-glow)'}`,
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
                backgroundColor: 'var(--hivelab-panel)',
                border: `1px solid ${'var(--hivelab-border)'}`,
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              }}
            >
              <Box className="h-10 w-10" style={{ color: 'var(--hivelab-text-tertiary)' }} />
            </div>
            <h3 className="text-xl font-semibold" style={{ color: 'var(--hivelab-text-primary)' }}>
              Start Building
            </h3>
            <p className="text-sm" style={{ color: 'var(--hivelab-text-secondary)' }}>
              Drag elements from the left panel onto the canvas, or press{' '}
              <kbd
                className="px-1.5 py-0.5 rounded text-xs font-sans"
                style={{
                  backgroundColor: 'var(--hivelab-panel)',
                  border: `1px solid ${'var(--hivelab-border)'}`,
                  color: 'var(--hivelab-text-primary)',
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
              backgroundColor: 'var(--hivelab-panel)',
              border: `1px solid ${'var(--hivelab-border)'}`,
              color: 'var(--hivelab-text-secondary)',
            }}
          >
            <span style={{ color: 'var(--hivelab-text-primary)' }}>{visibleElements.length}</span>
            <span className="mx-1">/</span>
            <span>{elements.length}</span>
            <span className="ml-1">visible</span>
          </div>
        )}
        <div
          className="px-2 py-1 rounded text-xs font-medium"
          style={{
            backgroundColor: 'var(--hivelab-panel)',
            border: `1px solid ${'var(--hivelab-border)'}`,
            color: 'var(--hivelab-text-secondary)',
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
            backgroundColor: 'var(--hivelab-panel)',
            border: `1px solid ${'var(--hivelab-connection)'}`,
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-3 h-3 rounded-full animate-pulse"
              style={{ backgroundColor: 'var(--hivelab-connection)' }}
            />
            <span className="text-sm" style={{ color: 'var(--hivelab-text-primary)' }}>
              Click an <span className="font-medium" style={{ color: 'var(--hivelab-connection)' }}>input port</span> to connect
            </span>
            <span className="text-xs" style={{ color: 'var(--hivelab-text-tertiary)' }}>
              or press ESC to cancel
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
}
