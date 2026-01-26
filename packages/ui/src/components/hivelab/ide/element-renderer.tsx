'use client';

/**
 * Element Renderer for IDE Canvas
 *
 * Renders actual HiveLab elements within the IDE canvas.
 * Supports three modes:
 * - 'preview': Static visual representation (ElementPreview)
 * - 'edit': Live element with edit mode affordances
 * - 'runtime': Fully interactive element
 *
 * This bridges the gap between the static ElementPreview and live elements,
 * allowing the IDE to show actual element behavior when desired.
 */

import * as React from 'react';
import { Suspense, memo, useMemo } from 'react';
import { motion } from 'framer-motion';

import type { CanvasElement } from './types';
import type { ElementProps } from '../../../lib/hivelab/element-system';
import type { ElementMode } from '../elements/core';
import { renderElement, isElementSupported } from '../elements/registry';
import { ElementErrorBoundary } from '../elements/error-boundary';
import { Skeleton } from '../../../design-system/primitives';

// ============================================================
// Types
// ============================================================

export interface ElementRendererProps {
  /** The canvas element to render */
  element: CanvasElement;
  /** Render mode: preview (static), edit (live with edit UI), runtime (fully interactive) */
  mode: ElementMode;
  /** Whether the element is selected in the canvas */
  isSelected?: boolean;
  /** Shared state from the tool runtime */
  sharedState?: ElementProps['sharedState'];
  /** User-specific state */
  userState?: ElementProps['userState'];
  /** Callback when element data changes */
  onChange?: ElementProps['onChange'];
  /** Callback when element triggers an action */
  onAction?: ElementProps['onAction'];
  /** Runtime context (userId, campusId, etc.) */
  context?: ElementProps['context'];
}

// ============================================================
// Loading Fallback
// ============================================================

function ElementLoadingFallback() {
  return (
    <div className="w-full h-full p-4">
      <Skeleton className="w-full h-4 mb-2" />
      <Skeleton className="w-3/4 h-4 mb-2" />
      <Skeleton className="w-1/2 h-4" />
    </div>
  );
}

// ============================================================
// Unsupported Element Fallback
// ============================================================

function UnsupportedElement({ elementId }: { elementId: string }) {
  return (
    <div className="w-full h-full flex items-center justify-center p-4 text-center">
      <div className="space-y-2">
        <div className="text-2xl opacity-40">⚠️</div>
        <p className="text-sm text-muted-foreground">
          Unknown element: <code className="text-xs bg-muted px-1 py-0.5 rounded">{elementId}</code>
        </p>
      </div>
    </div>
  );
}

// ============================================================
// Element Renderer Component
// ============================================================

/**
 * Renders a live HiveLab element with the appropriate mode.
 *
 * In 'edit' mode, elements show their configuration UI instead of
 * interactive controls. This allows the IDE to show live previews
 * without accidental interactions during canvas manipulation.
 */
function ElementRendererBase({
  element,
  mode,
  isSelected,
  sharedState,
  userState,
  onChange,
  onAction,
  context,
}: ElementRendererProps) {
  // Normalize element ID (strip numeric suffixes like -1, -2)
  const normalizedId = element.elementId.replace(/-\d+$/, '');

  // Check if element is supported
  if (!isElementSupported(normalizedId)) {
    return <UnsupportedElement elementId={element.elementId} />;
  }

  // Build element props from canvas element
  // Note: CanvasElement doesn't have runtime data - that comes from sharedState/userState
  const elementProps: ElementProps = useMemo(
    () => ({
      id: element.instanceId,
      config: element.config || {},
      data: {}, // Runtime data is managed externally via sharedState
      sharedState,
      userState,
      onChange,
      onAction,
      context,
      // Pass mode to elements that support it
      mode,
    }),
    [element.instanceId, element.config, sharedState, userState, onChange, onAction, context, mode]
  );

  return (
    <ErrorBoundary elementId={element.elementId}>
      <Suspense fallback={<ElementLoadingFallback />}>
        <div className="w-full h-full overflow-hidden">
          {renderElement(normalizedId, elementProps)}
        </div>
      </Suspense>
    </ErrorBoundary>
  );
}

// ============================================================
// Error Boundary Wrapper
// ============================================================

interface ErrorBoundaryProps {
  elementId: string;
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`Element render error (${this.props.elementId}):`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex items-center justify-center p-4 text-center bg-red-500/5 border border-red-500/20 rounded">
          <div className="space-y-2">
            <div className="text-2xl">💥</div>
            <p className="text-sm text-red-500/80">
              Render error
            </p>
            <p className="text-xs text-muted-foreground">
              {this.state.error?.message?.slice(0, 50)}
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// ============================================================
// Memoized Export
// ============================================================

/**
 * Memoized element renderer to prevent unnecessary re-renders.
 * Only re-renders when element config, mode, or state changes.
 */
export const ElementRenderer = memo(ElementRendererBase, (prevProps, nextProps) => {
  // Re-render if any of these change
  if (prevProps.mode !== nextProps.mode) return false;
  if (prevProps.isSelected !== nextProps.isSelected) return false;
  if (prevProps.element.instanceId !== nextProps.element.instanceId) return false;
  if (prevProps.element.elementId !== nextProps.element.elementId) return false;

  // Deep compare config (most common change)
  if (JSON.stringify(prevProps.element.config) !== JSON.stringify(nextProps.element.config)) {
    return false;
  }

  // Deep compare sharedState (runtime data source)
  if (JSON.stringify(prevProps.sharedState) !== JSON.stringify(nextProps.sharedState)) {
    return false;
  }

  // Skip re-render
  return true;
});

ElementRenderer.displayName = 'ElementRenderer';

// ============================================================
// Preview Mode Switch Helper
// ============================================================

export type PreviewMode = 'static' | 'live' | 'interactive';

/**
 * Maps PreviewMode to ElementMode.
 * - static: Uses ElementPreview (fast, no React rendering)
 * - live: Uses ElementRenderer with mode='edit' (shows element but not interactive)
 * - interactive: Uses ElementRenderer with mode='runtime' (fully interactive)
 */
export function getElementModeFromPreviewMode(previewMode: PreviewMode): ElementMode | null {
  switch (previewMode) {
    case 'static':
      return null; // Use ElementPreview
    case 'live':
      return 'edit';
    case 'interactive':
      return 'runtime';
  }
}
