'use client';

import * as React from 'react';
import { LayoutProvider } from './LayoutContext';

/**
 * FocusFlowLayout
 *
 * Archetype: Focus Flow
 * Purpose: multi-step wizards/forms
 * Behavior: sequential, no distractions, completion-oriented
 * Shell: OFF
 *
 * Rules:
 * - Sequential steps
 * - No shell
 * - No distractions
 * - Clear progress indication (current step, not gamified progress bar)
 * - Single primary action per step
 *
 * Use for: Entry (auth), Onboarding, Create Space, Create Event, Deploy Tool
 */

interface FocusFlowLayoutProps {
  children: React.ReactNode;
  /** Optional branded header (logo, wordmark) */
  brand?: React.ReactNode;
  /** Optional step indicator (e.g., "Step 2 of 4" or just current context) */
  stepIndicator?: React.ReactNode;
  /** Optional escape/cancel action */
  escapeAction?: React.ReactNode;
}

export function FocusFlowLayout({
  children,
  brand,
  stepIndicator,
  escapeAction,
}: FocusFlowLayoutProps) {
  return (
    <LayoutProvider archetype="focus-flow">
      <div className="min-h-screen bg-[var(--bg-ground,#0A0A09)] flex flex-col">
        {/* Header zone (brand, step indicator, escape) */}
        {(brand || stepIndicator || escapeAction) && (
          <header className="flex-shrink-0 w-full px-6 py-4">
            <div className="flex items-center justify-between max-w-lg mx-auto">
              {/* Left: brand or escape */}
              <div className="flex items-center gap-4">
                {escapeAction}
                {brand}
              </div>

              {/* Right: step indicator */}
              {stepIndicator && (
                <div className="text-sm text-[var(--text-secondary,#888)]">
                  {stepIndicator}
                </div>
              )}
            </div>
          </header>
        )}

        {/* Content zone (centered, constrained) */}
        <main className="flex-1 flex items-center justify-center px-6 py-8">
          <div className="w-full max-w-lg">
            {children}
          </div>
        </main>
      </div>
    </LayoutProvider>
  );
}

/**
 * FocusFlowStep
 *
 * A single step in a focus flow.
 */
interface FocusFlowStepProps {
  children: React.ReactNode;
  /** Step title */
  title?: string;
  /** Step description */
  description?: string;
}

export function FocusFlowStep({
  children,
  title,
  description,
}: FocusFlowStepProps) {
  return (
    <div className="flex flex-col">
      {/* Step header */}
      {(title || description) && (
        <div className="mb-8 text-center">
          {title && (
            <h1 className="text-2xl font-semibold text-[var(--text-primary,#FFF)] tracking-tight">
              {title}
            </h1>
          )}
          {description && (
            <p className="mt-2 text-[var(--text-secondary,#888)]">
              {description}
            </p>
          )}
        </div>
      )}

      {/* Step content */}
      <div className="flex flex-col gap-6">
        {children}
      </div>
    </div>
  );
}

/**
 * FocusFlowActions
 *
 * Action buttons for a focus flow step.
 * Primary action should be obvious. Secondary actions are optional.
 */
interface FocusFlowActionsProps {
  children: React.ReactNode;
  /** Stack buttons vertically on mobile */
  stacked?: boolean;
}

export function FocusFlowActions({
  children,
  stacked = true,
}: FocusFlowActionsProps) {
  return (
    <div
      className={`
        mt-8 flex gap-3
        ${stacked ? 'flex-col' : 'flex-row justify-end'}
      `.trim()}
    >
      {children}
    </div>
  );
}
