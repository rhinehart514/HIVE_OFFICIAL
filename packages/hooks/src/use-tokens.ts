/**
 * useTokens Hook
 * Runtime access to HIVE design tokens
 *
 * @example
 * const tokens = useTokens();
 * const bgColor = tokens.semantic.background.primary; // "#000000"
 * const buttonBg = tokens.components.button.primary.bg; // "#FFD700"
 */

import { useMemo } from 'react';
import {
  foundation,
  semantic,
  components,
  type FoundationToken,
  type SemanticToken,
  type ComponentToken,
} from '@hive/tokens';

export interface TokenSystem {
  foundation: typeof foundation;
  semantic: typeof semantic;
  components: typeof components;
}

/**
 * Access HIVE design tokens at runtime
 *
 * @returns All design tokens (foundation, semantic, component layers)
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const tokens = useTokens();
 *
 *   return (
 *     <div style={{
 *       backgroundColor: tokens.semantic.background.primary,
 *       color: tokens.semantic.text.primary,
 *       borderColor: tokens.semantic.border.default,
 *     }}>
 *       Content
 *     </div>
 *   );
 * }
 * ```
 */
export function useTokens(): TokenSystem {
  return useMemo(
    () => ({
      foundation,
      semantic,
      components,
    }),
    []
  );
}

/**
 * Get a specific token value by path
 *
 * @param path - Dot-notation path to token (e.g., "semantic.background.primary")
 * @returns Token value or undefined if not found
 *
 * @example
 * ```tsx
 * const bgColor = useToken('semantic.background.primary'); // "#000000"
 * const goldCta = useToken('semantic.gold.cta'); // "#FFD700"
 * const buttonBg = useToken('components.button.primary.bg'); // "#FFD700"
 * ```
 */
export function useToken(path: string): string | undefined {
  const tokens = useTokens();

  return useMemo(() => {
    const parts = path.split('.');
    let current: any = tokens;

    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return undefined;
      }
    }

    return typeof current === 'string' ? current : undefined;
  }, [path, tokens]);
}

/**
 * Get multiple token values at once
 *
 * @param paths - Array of dot-notation paths
 * @returns Object mapping paths to values
 *
 * @example
 * ```tsx
 * const colors = useTokens

Map([
 *   'semantic.background.primary',
 *   'semantic.text.primary',
 *   'semantic.border.default'
 * ]);
 *
 * // colors = {
 * //   'semantic.background.primary': '#000000',
 * //   'semantic.text.primary': '#FFFFFF',
 * //   'semantic.border.default': 'rgba(255, 255, 255, 0.08)'
 * // }
 * ```
 */
export function useTokensMap(paths: string[]): Record<string, string | undefined> {
  const tokens = useTokens();

  return useMemo(() => {
    const result: Record<string, string | undefined> = {};

    for (const path of paths) {
      const parts = path.split('.');
      let current: any = tokens;

      for (const part of parts) {
        if (current && typeof current === 'object' && part in current) {
          current = current[part];
        } else {
          current = undefined;
          break;
        }
      }

      result[path] = typeof current === 'string' ? current : undefined;
    }

    return result;
  }, [paths, tokens]);
}

/**
 * Type-safe token accessors
 */
export const useFoundation = () => useTokens().foundation;
export const useSemantic = () => useTokens().semantic;
export const useComponents = () => useTokens().components;

/**
 * Shorthand hooks for common semantic tokens
 */
export const useBackgroundTokens = () => useSemantic().background;
export const useTextTokens = () => useSemantic().text;
export const useBrandTokens = () => useSemantic().brand;
export const useInteractiveTokens = () => useSemantic().interactive;
export const useStatusTokens = () => useSemantic().status;
export const useBorderTokens = () => useSemantic().border;

/**
 * Shorthand hooks for common component tokens
 */
export const useButtonTokens = () => useComponents().button;
export const useCardTokens = () => useComponents().card;
export const useInputTokens = () => useComponents().input;
export const useBadgeTokens = () => useComponents().badge;
export const useToastTokens = () => useComponents().toast;
export const useOverlayTokens = () => useComponents().overlay;

// Types exported from @hive/tokens
