'use client';

import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ToolCanvas, type ToolCanvasProps } from '../tool-canvas';
import { cn } from '../../../lib/utils';

/**
 * EmbeddedSurface
 *
 * Sprint 5: Surface-Specific UI
 *
 * Seamlessly embedded in content (posts, pages):
 * - No chrome/borders by default
 * - Inherits surrounding context styles
 * - Minimal padding to blend with content
 * - Optional subtle separator
 */

export interface EmbeddedSurfaceProps extends Omit<ToolCanvasProps, 'className'> {
  /** Whether to show a subtle top border */
  showDivider?: boolean;
  /** Whether to add padding around content */
  padded?: boolean;
  /** Background style variant */
  background?: 'none' | 'subtle' | 'glass';
  /** Additional CSS classes */
  className?: string;
  /** ID for linking purposes */
  id?: string;
  /** Label for screen readers */
  ariaLabel?: string;
}

const backgroundClasses = {
  none: '',
  subtle: 'bg-white/[0.01]',
  glass: 'bg-white/[0.02] backdrop-blur-sm',
};

export function EmbeddedSurface({
  showDivider = false,
  padded = true,
  background = 'none',
  className,
  id,
  ariaLabel,
  // ToolCanvas props
  elements,
  state,
  layout,
  onElementChange,
  onElementAction,
  isLoading,
  error,
  context,
  sharedState,
  userState,
  theme,
}: EmbeddedSurfaceProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      id={id}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "embedded-surface",
        showDivider && "border-t border-white/[0.06] mt-4 pt-4",
        padded && "px-1",
        backgroundClasses[background],
        className
      )}
      role="region"
      aria-label={ariaLabel}
    >
      <ToolCanvas
        elements={elements}
        state={state}
        layout={layout}
        onElementChange={onElementChange}
        onElementAction={onElementAction}
        isLoading={isLoading}
        error={error}
        context={context}
        sharedState={sharedState}
        userState={userState}
        theme={theme}
        className="embedded-tool-canvas"
      />
    </motion.div>
  );
}

export default EmbeddedSurface;
