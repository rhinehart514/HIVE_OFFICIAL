/**
 * Example Organism: SpacePins
 *
 * DEMONSTRATES:
 * - Cognitive budget enforcement with useCognitiveBudget hook
 * - Consistent type patterns for UX constraints
 * - Programmatic enforcement of SlotKit rules
 * - Proper error handling when budget exceeded
 * - Type-safe budget access with generic constraints
 *
 * COGNITIVE BUDGET:
 * - maxPins: 2 (enforced programmatically)
 * - Shows warning when over budget
 * - Auto-truncates to budget limit
 *
 * USAGE:
 * <SpacePins pins={pins} onUnpin={handleUnpin} />
 */

import * as React from 'react';
import { useCognitiveBudget, useIsBudgetExceeded } from '@hive/hooks';
import { cn } from '../../../lib/utils';

/**
 * Pin interface with strict types
 */
export interface Pin {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  createdAt: Date;
  isPinned: boolean;
}

/**
 * SpacePins component props
 */
export interface SpacePinsProps {
  /**
   * Array of pins (may exceed budget)
   */
  pins: Pin[];

  /**
   * Callback when user unpins an item
   */
  onUnpin?: (pinId: string) => void;

  /**
   * Show budget warning UI
   * @default true
   */
  showBudgetWarning?: boolean;

  /**
   * Additional class names
   */
  className?: string;
}

/**
 * SpacePins component
 * Example of cognitive budget enforcement with type-safe patterns
 */
export function SpacePins({
  pins,
  onUnpin,
  showBudgetWarning = true,
  className,
}: SpacePinsProps) {
  /**
   * Get cognitive budget for space board pins
   * Type-safe access to specific budget constraint
   */
  const maxPins = useCognitiveBudget('spaceBoard', 'maxPins'); // Returns: 2

  /**
   * Check if pins exceed budget
   * Returns detailed budget information
   */
  const { isWithinBudget, limit, count, overflow } = useIsBudgetExceeded(
    'spaceBoard',
    'maxPins',
    pins
  );

  /**
   * Auto-truncate pins to budget limit
   * First 2 pins are shown, rest are hidden
   */
  const visiblePins = React.useMemo(
    () => pins.slice(0, maxPins),
    [pins, maxPins]
  );

  /**
   * Hidden pins count for overflow warning
   */
  const hiddenPinsCount = pins.length - visiblePins.length;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Budget warning (shown when over limit) */}
      {showBudgetWarning && !isWithinBudget && (
        <div className={cn(
          "rounded-lg p-3",
          "bg-status-warning-default/10",      // Semantic token with opacity
          "border border-status-warning-default/30",
          "text-status-warning-text text-sm"
        )}>
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <p className="font-medium">
                Too many pins ({count}/{limit})
              </p>
              <p className="text-xs mt-1 text-text-secondary">
                You have {overflow} too many pins. Only the first {limit} will be visible to members.
                {hiddenPinsCount > 0 && ` ${hiddenPinsCount} pins are hidden.`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Pin cards (only show within budget) */}
      <div className="grid gap-3">
        {visiblePins.length === 0 ? (
          <div className={cn(
            "rounded-lg p-8 text-center",
            "bg-background-secondary",          // Semantic token
            "border border-border-default"      // Semantic token
          )}>
            <p className="text-text-secondary text-sm">
              No pinned posts yet. Pin important posts to keep them at the top.
            </p>
          </div>
        ) : (
          visiblePins.map((pin, index) => (
            <div
              key={pin.id}
              className={cn(
                "rounded-lg p-4",
                "bg-background-secondary",       // Semantic token
                "border border-border-default",  // Semantic token
                "hover:bg-background-interactive", // Semantic token
                "transition-colors"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {/* Pin number badge */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className={cn(
                      "inline-flex items-center justify-center",
                      "w-6 h-6 rounded-full text-xs font-semibold",
                      "bg-brand-primary/10",        // Gold accent
                      "text-brand-primary",         // Gold text
                      "border border-brand-primary/20"
                    )}>
                      {index + 1}
                    </span>
                    <span className="text-xs text-text-muted">
                      Pinned {/* Could add relative time here */}
                    </span>
                  </div>

                  {/* Pin content */}
                  <h3 className="font-semibold text-text-primary mb-1">
                    {pin.title}
                  </h3>
                  <p className="text-sm text-text-secondary line-clamp-2">
                    {pin.description}
                  </p>
                </div>

                {/* Unpin button */}
                {onUnpin && (
                  <button
                    onClick={() => onUnpin(pin.id)}
                    className={cn(
                      "flex-shrink-0 p-2 rounded-lg",
                      "text-text-secondary",
                      "hover:bg-background-tertiary",
                      "hover:text-text-primary",
                      "transition-colors"
                    )}
                    aria-label={`Unpin ${pin.title}`}
                  >
                    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Budget info footer (helpful developer info) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-text-muted">
          <strong>Cognitive Budget:</strong> {count}/{limit} pins used
          {!isWithinBudget && ` (${overflow} over limit)`}
        </div>
      )}
    </div>
  );
}

SpacePins.displayName = 'SpacePins';

/**
 * TYPE PATTERNS DEMONSTRATED:
 *
 * 1. Generic Type Constraints
 *    - useCognitiveBudget<'spaceBoard'>('spaceBoard', 'maxPins')
 *    - Type-safe access to specific surface budgets
 *
 * 2. Strict Interface Types
 *    - Pin interface with required fields
 *    - Props interface with optional fields marked with ?
 *
 * 3. Type-Safe Budget Hooks
 *    - useIsBudgetExceeded returns typed object
 *    - { isWithinBudget: boolean, limit: number, count: number, overflow: number }
 *
 * 4. Semantic Token Usage
 *    - All colors use semantic tokens (bg-background-*, text-text-*, border-border-*)
 *    - Opacity via Tailwind syntax (/10, /20, /30)
 *    - No hard-coded values
 *
 * 5. Accessibility
 *    - aria-label on interactive elements
 *    - Semantic HTML (button, not div with onClick)
 *    - Clear visual feedback for budget violations
 */
