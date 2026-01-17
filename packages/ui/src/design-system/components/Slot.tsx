'use client';

/**
 * Slot Component
 * Source: docs/design-system/COMPONENTS.md
 *
 * Merges props and refs with child element for polymorphic composition.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * VISUAL DESCRIPTION (for AI reference - no Playwright needed)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * CONCEPT:
 *
 * Without Slot (wrapper div):
 * ┌────────────────────────────────────────────────────────────────────────┐
 * │ <Button>                                                               │
 * │   <div className="button-styles">      ← Extra wrapper                │
 * │     <a href="/link">Click me</a>       ← Actual element                │
 * │   </div>                                                               │
 * │ </Button>                                                              │
 * │                                                                        │
 * │ Result DOM:                                                            │
 * │ <div class="button-styles">                                           │
 * │   <a href="/link">Click me</a>                                         │
 * │ </div>                                                                 │
 * │                                                                        │
 * │ Problem: Extra wrapper div can break layouts and styling               │
 * └────────────────────────────────────────────────────────────────────────┘
 *
 * With Slot (asChild pattern):
 * ┌────────────────────────────────────────────────────────────────────────┐
 * │ <Button asChild>                                                       │
 * │   <a href="/link">Click me</a>                                         │
 * │ </Button>                                                              │
 * │                                                                        │
 * │ Result DOM:                                                            │
 * │ <a href="/link" class="button-styles">Click me</a>                     │
 * │                                                                        │
 * │ Button styles merge directly onto the <a> element!                     │
 * └────────────────────────────────────────────────────────────────────────┘
 *
 * PROP MERGING:
 *
 * Parent props + Child props = Merged result
 *
 * <Slot onClick={parentClick} className="parent-class">
 *   <button onClick={childClick} className="child-class">
 *     Click
 *   </button>
 * </Slot>
 *
 * Result:
 * <button
 *   onClick={[parentClick, childClick]}  ← Event handlers compose
 *   className="parent-class child-class"  ← Classes merge
 * >
 *   Click
 * </button>
 *
 * USE CASES:
 *
 * 1. Polymorphic buttons:
 *    ┌────────────────────────────────────────┐
 *    │ <Button asChild>                       │
 *    │   <Link href="/page">Navigate</Link>   │ ← Renders as Next.js Link
 *    │ </Button>                              │
 *    └────────────────────────────────────────┘
 *
 * 2. Trigger elements:
 *    ┌────────────────────────────────────────┐
 *    │ <Dialog.Trigger asChild>               │
 *    │   <IconButton>Open</IconButton>        │ ← Any element can be trigger
 *    │ </Dialog.Trigger>                      │
 *    └────────────────────────────────────────┘
 *
 * 3. Custom card wrappers:
 *    ┌────────────────────────────────────────┐
 *    │ <Card asChild>                         │
 *    │   <article>Content</article>           │ ← Semantic HTML preserved
 *    │ </Card>                                │
 *    └────────────────────────────────────────┘
 *
 * 4. Accessible components:
 *    ┌────────────────────────────────────────┐
 *    │ <AlertDialogTrigger asChild>           │
 *    │   <Button variant="danger">Delete</Button>
 *    │ </AlertDialogTrigger>                  │
 *    └────────────────────────────────────────┘
 *
 * SLOTTABLE PATTERN:
 *
 * For components that need to support both direct children and slotted:
 *
 * <MyComponent>
 *   <Slottable>Default content</Slottable>
 *   Additional stuff
 * </MyComponent>
 *
 * BENEFITS:
 * - No extra DOM elements
 * - Proper semantic HTML
 * - Type-safe polymorphism
 * - Event handler composition
 * - Ref forwarding
 *
 * ACCESSIBILITY:
 * - Preserves semantic elements
 * - Refs work correctly for focus management
 * - ARIA attributes can be properly applied
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

import * as React from 'react';
import { Slot as RadixSlot, Slottable as RadixSlottable } from '@radix-ui/react-slot';
import { cn } from '../../lib/utils';

export interface SlotProps extends React.HTMLAttributes<HTMLElement> {
  /** Child element to slot into */
  children?: React.ReactNode;
}

/**
 * Slot - Merges props with child element
 */
const Slot = React.forwardRef<HTMLElement, SlotProps>(
  ({ children, ...props }, ref) => (
    <RadixSlot ref={ref} {...props}>
      {children}
    </RadixSlot>
  )
);
Slot.displayName = 'Slot';

/**
 * Slottable - Marks content that should be slotted
 */
export interface SlottableProps {
  children: React.ReactNode;
}

const Slottable: React.FC<SlottableProps> = ({ children }) => (
  <RadixSlottable>{children}</RadixSlottable>
);
Slottable.displayName = 'Slottable';

/**
 * SlotClone - Clone element with merged props (lower-level primitive)
 */
export interface SlotCloneProps {
  children: React.ReactElement;
  [key: string]: unknown;
}

const SlotClone = React.forwardRef<HTMLElement, SlotCloneProps>(
  ({ children, ...props }, ref) => {
    if (React.isValidElement(children)) {
      const childProps = children.props as Record<string, unknown>;
      return React.cloneElement(children, {
        ...mergeProps(props, childProps),
        ref: ref
          ? composeRefs(ref, (children as React.ReactElement & { ref?: React.Ref<unknown> }).ref)
          : (children as React.ReactElement & { ref?: React.Ref<unknown> }).ref,
      } as React.Attributes);
    }
    return null;
  }
);
SlotClone.displayName = 'SlotClone';

/**
 * mergeProps - Utility to merge two prop objects
 */
function mergeProps(slotProps: Record<string, unknown>, childProps: Record<string, unknown>) {
  const overrideProps = { ...childProps };

  for (const propName in childProps) {
    const slotPropValue = slotProps[propName];
    const childPropValue = childProps[propName];

    const isHandler = /^on[A-Z]/.test(propName);

    if (isHandler) {
      // Compose event handlers
      if (slotPropValue && childPropValue) {
        overrideProps[propName] = (...args: unknown[]) => {
          (childPropValue as (...args: unknown[]) => void)?.(...args);
          (slotPropValue as (...args: unknown[]) => void)?.(...args);
        };
      } else if (slotPropValue) {
        overrideProps[propName] = slotPropValue;
      }
    } else if (propName === 'style') {
      // Merge styles
      overrideProps[propName] = { ...slotPropValue as object, ...childPropValue as object };
    } else if (propName === 'className') {
      // Merge class names
      overrideProps[propName] = cn(slotPropValue as string, childPropValue as string);
    }
  }

  return { ...slotProps, ...overrideProps };
}

/**
 * composeRefs - Utility to compose multiple refs
 */
function composeRefs<T>(...refs: (React.Ref<T> | undefined)[]): React.RefCallback<T> {
  return (instance: T) => {
    refs.forEach((ref) => {
      if (typeof ref === 'function') {
        ref(instance);
      } else if (ref !== null && ref !== undefined) {
        (ref as React.MutableRefObject<T>).current = instance;
      }
    });
  };
}

/**
 * AsChildProps - Type helper for asChild pattern
 */
export type AsChildProps<DefaultElementProps> =
  | ({ asChild?: false } & DefaultElementProps)
  | { asChild: true; children: React.ReactNode };

/**
 * useSlot - Hook for implementing asChild pattern
 */
function useSlot<Props extends { asChild?: boolean; children?: React.ReactNode }>(
  props: Props,
  Component: React.ElementType
): { Comp: React.ElementType; rest: Omit<Props, 'asChild'> } {
  const { asChild, ...rest } = props;
  const Comp = asChild ? Slot : Component;
  return { Comp: Comp as React.ElementType, rest: rest as Omit<Props, 'asChild'> };
}

export { Slot, Slottable, SlotClone, mergeProps, composeRefs, useSlot };
