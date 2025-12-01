/**
 * AutoAnimated Component
 * Zero-config animations for lists and dynamic content using AutoAnimate
 *
 * @example
 * ```tsx
 * <AutoAnimated>
 *   {items.map(item => (
 *     <div key={item.id}>{item.content}</div>
 *   ))}
 * </AutoAnimated>
 * ```
 */

'use client';

import * as React from 'react';
import { useEffect, useRef, type ReactNode, type HTMLAttributes } from 'react';
import autoAnimate, { type AutoAnimateOptions, type AutoAnimationPlugin } from '@formkit/auto-animate';
import { motion as motionTokens } from '@hive/tokens';

export interface AutoAnimatedProps extends HTMLAttributes<HTMLDivElement> {
  /** Child elements to auto-animate */
  children: ReactNode;

  /** HTML element to render as (default: 'div') */
  as?: keyof React.JSX.IntrinsicElements;

  /** Animation duration in ms (default: from motion tokens) */
  duration?: number;

  /** Easing function (default: from motion tokens) */
  easing?: string;

  /** Disable animations */
  disabled?: boolean;

  /** Custom AutoAnimate options */
  options?: Partial<AutoAnimateOptions>;
}

/**
 * AutoAnimated - Zero-config list animations
 *
 * Automatically animates children when they're added, removed, or reordered.
 * Perfect for feeds, lists, and dynamic content.
 *
 * Uses HIVE motion tokens for consistent timing.
 */
export function AutoAnimated({
  children,
  as: Component = 'div',
  duration,
  easing,
  disabled = false,
  options = {},
  ...props
}: AutoAnimatedProps) {
  const parentRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (parentRef.current && !disabled) {
      const autoAnimateOptions: Partial<AutoAnimateOptions> = {
        duration: duration || parseFloat(motionTokens.duration.liquid) * 1000 || 350,
        easing: easing || motionTokens.easing.default,
        ...options,
      };

      const controller = autoAnimate(parentRef.current, autoAnimateOptions);

      return () => {
        controller?.disable();
      };
    }
  }, [disabled, duration, easing, options]);

  const ElementComponent = Component as any;

  return (
    <ElementComponent ref={parentRef} {...props}>
      {children}
    </ElementComponent>
  );
}

AutoAnimated.displayName = 'AutoAnimated';

/**
 * Hook for manually controlling AutoAnimate
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { ref, enable, disable, isEnabled } = useAutoAnimate();
 *
 *   return (
 *     <div>
 *       <button onClick={() => isEnabled() ? disable() : enable()}>
 *         Toggle Animations
 *       </button>
 *       <div ref={ref}>
 *         {items.map(item => <div key={item.id}>{item.content}</div>)}
 *       </div>
 *     </div>
 *   );
 * }
 * ```
 */
export function useAutoAnimate<T extends HTMLElement = HTMLDivElement>(
  options?: Partial<AutoAnimateOptions>
) {
  const ref = useRef<T>(null);
  const controllerRef = useRef<ReturnType<typeof autoAnimate> | null>(null);

  useEffect(() => {
    if (ref.current) {
      const autoAnimateOptions: Partial<AutoAnimateOptions> = {
        duration: parseFloat(motionTokens.duration.liquid) * 1000 || 350,
        easing: motionTokens.easing.default,
        ...options,
      };

      controllerRef.current = autoAnimate(ref.current, autoAnimateOptions);
    }

    return () => {
      controllerRef.current?.disable();
    };
  }, [options]);

  return {
    ref,
    enable: () => controllerRef.current?.enable(),
    disable: () => controllerRef.current?.disable(),
    isEnabled: () => controllerRef.current?.isEnabled() || false,
  };
}
