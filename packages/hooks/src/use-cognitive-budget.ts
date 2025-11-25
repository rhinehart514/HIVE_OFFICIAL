/**
 * useCognitiveBudget Hook
 * Enforce UX constraints as design tokens
 *
 * @example
 * const maxPins = useCognitiveBudget('spaceBoard', 'maxPins'); // 2
 * const maxWidgets = useCognitiveBudget('feed', 'maxRailWidgets'); // 3
 */

import { useMemo } from 'react';
import { slotKit } from '@hive/tokens';

/**
 * Surface types with cognitive budgets
 */
export type CognitiveSurface = keyof typeof slotKit.cognitiveBudgets;

/**
 * Budget constraints for a specific surface
 */
export type CognitiveBudgetKey<T extends CognitiveSurface> = keyof typeof slotKit.cognitiveBudgets[T];

/**
 * Get a cognitive budget constraint value
 *
 * @param surface - UI surface (spaceBoard, feed, hivelab, etc.)
 * @param constraint - Specific constraint name
 * @returns Constraint value (number)
 *
 * @example
 * ```tsx
 * function SpaceBoard() {
 *   const maxPins = useCognitiveBudget('spaceBoard', 'maxPins'); // 2
 *   const maxRailWidgets = useCognitiveBudget('spaceBoard', 'maxRailWidgets'); // 3
 *
 *   return (
 *     <div>
 *       {pins.slice(0, maxPins).map(pin => <PinCard key={pin.id} {...pin} />)}
 *     </div>
 *   );
 * }
 * ```
 */
export function useCognitiveBudget<T extends CognitiveSurface>(
  surface: T,
  constraint: CognitiveBudgetKey<T>
): number {
  return useMemo(() => {
    const surfaceBudgets = slotKit.cognitiveBudgets[surface];
    if (!surfaceBudgets || !(constraint in surfaceBudgets)) {
      console.warn(`Cognitive budget not found: ${surface}.${String(constraint)}`);
      return 0;
    }
    return surfaceBudgets[constraint as keyof typeof surfaceBudgets] as number;
  }, [surface, constraint]);
}

/**
 * Get all cognitive budgets for a surface
 *
 * @param surface - UI surface
 * @returns All budget constraints for the surface
 *
 * @example
 * ```tsx
 * const budgets = useCognitiveBudgets('spaceBoard');
 * // {
 * //   maxPins: 2,
 * //   maxRailWidgets: 3,
 * //   railNowItems: 5,
 * //   composerActions: 4,
 * //   cardPrimaryCtas: 2
 * // }
 * ```
 */
export function useCognitiveBudgets<T extends CognitiveSurface>(
  surface: T
): typeof slotKit.cognitiveBudgets[T] {
  return useMemo(() => {
    return slotKit.cognitiveBudgets[surface];
  }, [surface]);
}

/**
 * Check if an array exceeds a cognitive budget
 *
 * @param surface - UI surface
 * @param constraint - Constraint name
 * @param items - Array to check
 * @returns Object with { isWithinBudget, limit, count, overflow }
 *
 * @example
 * ```tsx
 * const { isWithinBudget, limit, overflow } = useIsBudgetExceeded(
 *   'spaceBoard',
 *   'maxPins',
 *   pins
 * );
 *
 * if (!isWithinBudget) {
 *   console.warn(`Too many pins! Limit: ${limit}, Overflow: ${overflow}`);
 * }
 * ```
 */
export function useIsBudgetExceeded<T extends CognitiveSurface>(
  surface: T,
  constraint: CognitiveBudgetKey<T>,
  items: unknown[]
): {
  isWithinBudget: boolean;
  limit: number;
  count: number;
  overflow: number;
} {
  const limit = useCognitiveBudget(surface, constraint);

  return useMemo(() => {
    const count = items.length;
    const isWithinBudget = count <= limit;
    const overflow = Math.max(0, count - limit);

    return {
      isWithinBudget,
      limit,
      count,
      overflow,
    };
  }, [items, limit]);
}

/**
 * Enforce cognitive budget by truncating array
 *
 * @param surface - UI surface
 * @param constraint - Constraint name
 * @param items - Array to truncate
 * @returns Truncated array within budget
 *
 * @example
 * ```tsx
 * function SpaceBoard({ pins }: { pins: Pin[] }) {
 *   const budgetedPins = useEnforceBudget('spaceBoard', 'maxPins', pins);
 *   // Always returns max 2 pins
 *
 *   return (
 *     <div>
 *       {budgetedPins.map(pin => <PinCard key={pin.id} {...pin} />)}
 *     </div>
 *   );
 * }
 * ```
 */
export function useEnforceBudget<T extends CognitiveSurface, I>(
  surface: T,
  constraint: CognitiveBudgetKey<T>,
  items: I[]
): I[] {
  const limit = useCognitiveBudget(surface, constraint);

  return useMemo(() => {
    return items.slice(0, limit);
  }, [items, limit]);
}

/**
 * Hook for development warnings when budget is exceeded
 * Only warns in development mode
 *
 * @param surface - UI surface
 * @param constraint - Constraint name
 * @param items - Array to check
 *
 * @example
 * ```tsx
 * function SpaceBoard({ pins }: { pins: Pin[] }) {
 *   useWarnIfBudgetExceeded('spaceBoard', 'maxPins', pins);
 *   // Logs warning in console if pins.length > 2
 * }
 * ```
 */
export function useWarnIfBudgetExceeded<T extends CognitiveSurface>(
  surface: T,
  constraint: CognitiveBudgetKey<T>,
  items: unknown[]
): void {
  const { isWithinBudget, limit, count, overflow } = useIsBudgetExceeded(
    surface,
    constraint,
    items
  );

  useMemo(() => {
    if (process.env.NODE_ENV === 'development' && !isWithinBudget) {
      console.warn(
        `[Cognitive Budget] ${surface}.${String(constraint)} exceeded! ` +
        `Limit: ${limit}, Current: ${count}, Overflow: ${overflow}`
      );
    }
  }, [isWithinBudget, surface, constraint, limit, count, overflow]);
}

/**
 * Get all available cognitive budgets
 * Useful for documentation or debugging
 */
export function useAllCognitiveBudgets() {
  return useMemo(() => slotKit.cognitiveBudgets, []);
}

// Types are exported inline above
