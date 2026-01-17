'use client';

import * as React from 'react';
import { LayoutProvider } from './LayoutContext';

/**
 * ImmersionLayout
 *
 * Archetype: Immersion
 * Purpose: doing
 * Behavior: full viewport, spatial, focus, "room-like"
 * Shell: OFF
 *
 * Rules:
 * - Full viewport
 * - No shell chrome
 * - Content owns scroll
 * - Escape affordance (minimal, edge-positioned)
 *
 * Use for: Space Room (chat), Tool Editor (IDE), Tool Runtime
 */

interface ImmersionLayoutProps {
  children: React.ReactNode;
  /** Optional escape/back affordance */
  escapeAction?: React.ReactNode;
  /** Position of escape affordance */
  escapePosition?: 'top-left' | 'top-right';
  /** Optional context bar (minimal, for orientation within immersion) */
  contextBar?: React.ReactNode;
}

export function ImmersionLayout({
  children,
  escapeAction,
  escapePosition = 'top-left',
  contextBar,
}: ImmersionLayoutProps) {
  return (
    <LayoutProvider archetype="immersion">
      <div className="fixed inset-0 bg-[var(--bg-ground,#0A0A09)] flex flex-col overflow-hidden">
        {/* Escape affordance (minimal, positioned) */}
        {escapeAction && (
          <div
            className={`
              absolute top-4 z-50
              ${escapePosition === 'top-left' ? 'left-4' : 'right-4'}
            `.trim()}
          >
            {escapeAction}
          </div>
        )}

        {/* Optional context bar (minimal orientation) */}
        {contextBar && (
          <div className="flex-shrink-0 w-full border-b border-white/[0.06]">
            {contextBar}
          </div>
        )}

        {/* Content (owns the viewport) */}
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </div>
    </LayoutProvider>
  );
}

/**
 * ImmersionPanel
 *
 * A panel within immersion (for split views, sidebars, etc.)
 */
interface ImmersionPanelProps {
  children: React.ReactNode;
  /** Panel position */
  position?: 'left' | 'right' | 'center';
  /** Panel sizing */
  size?: 'sm' | 'md' | 'lg' | 'fill';
  /** Border on adjacent edge */
  bordered?: boolean;
}

const SIZE_MAP = {
  sm: 'w-64',
  md: 'w-80',
  lg: 'w-96',
  fill: 'flex-1',
} as const;

export function ImmersionPanel({
  children,
  position = 'center',
  size = 'fill',
  bordered = false,
}: ImmersionPanelProps) {
  const borderClass = bordered
    ? position === 'left'
      ? 'border-r border-white/[0.06]'
      : position === 'right'
        ? 'border-l border-white/[0.06]'
        : ''
    : '';

  return (
    <div
      className={`
        h-full overflow-hidden
        ${SIZE_MAP[size]}
        ${borderClass}
      `.trim()}
    >
      {children}
    </div>
  );
}
