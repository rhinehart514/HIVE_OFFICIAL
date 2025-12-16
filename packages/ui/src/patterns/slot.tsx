// @ts-nocheck
// TODO: Fix ForwardedRef inference in createSlotComponent
import * as React from 'react'

/**
 * Props for slot components.
 */
export interface SlotProps {
  children?: React.ReactNode
}

/**
 * Slot component for flexible content injection.
 * Merges props from parent to child when child is a single element.
 *
 * @example
 * ```tsx
 * // In component definition
 * const Button = ({ asChild, ...props }) => {
 *   const Comp = asChild ? Slot : 'button'
 *   return <Comp {...props} />
 * }
 *
 * // Usage - renders as button
 * <Button>Click me</Button>
 *
 * // Usage - renders as link with button styles
 * <Button asChild>
 *   <a href="/about">About</a>
 * </Button>
 * ```
 */
export const Slot = React.forwardRef<HTMLElement, SlotProps & React.HTMLAttributes<HTMLElement>>(
  ({ children, ...props }, ref) => {
    if (React.isValidElement(children)) {
      const childProps = children.props as Record<string, unknown>;
      return React.cloneElement(children, {
        ...mergeProps(props, childProps),
        ref: ref
          ? composeRefs(ref, (children as React.ReactElement & { ref?: React.Ref<unknown> }).ref)
          : (children as React.ReactElement & { ref?: React.Ref<unknown> }).ref,
      } as React.HTMLAttributes<HTMLElement>)
    }

    if (React.Children.count(children) > 1) {
      React.Children.only(null) // This will throw
    }

    return null
  }
)
Slot.displayName = 'Slot'

/**
 * Creates a slottable component that can render as child element.
 *
 * @example
 * ```tsx
 * const Button = createSlotComponent<ButtonProps>(
 *   'button',
 *   ({ variant, size, className, ...props }) => ({
 *     className: cn(buttonVariants({ variant, size }), className),
 *     ...props,
 *   })
 * )
 *
 * // Renders as button
 * <Button variant="primary">Save</Button>
 *
 * // Renders as anchor with button styles
 * <Button variant="primary" asChild>
 *   <a href="/save">Save</a>
 * </Button>
 * ```
 */
export function createSlotComponent<P extends object>(
  defaultElement: keyof React.JSX.IntrinsicElements,
  getProps: (props: P) => Record<string, unknown>
) {
  const Component = React.forwardRef<
    HTMLElement,
    P & { asChild?: boolean }
  >(({ asChild, ...props }, ref) => {
    const derivedProps = getProps(props as unknown as P)
    if (asChild) {
      return <Slot ref={ref} {...derivedProps} />
    }
    const Element = defaultElement as React.ElementType
    return <Element ref={ref} {...derivedProps} />
  })

  return Component
}

/**
 * Merges two sets of props, handling event handlers and classNames specially.
 */
function mergeProps(
  parentProps: Record<string, any>,
  childProps: Record<string, any>
): Record<string, any> {
  const result: Record<string, any> = { ...parentProps }

  for (const key in childProps) {
    const parentValue = parentProps[key]
    const childValue = childProps[key]

    // Merge event handlers
    if (
      key.startsWith('on') &&
      typeof parentValue === 'function' &&
      typeof childValue === 'function'
    ) {
      result[key] = (...args: unknown[]) => {
        childValue(...args)
        parentValue(...args)
      }
    }
    // Merge classNames
    else if (key === 'className') {
      result[key] = [parentValue, childValue].filter(Boolean).join(' ')
    }
    // Merge styles
    else if (key === 'style') {
      result[key] = { ...parentValue, ...childValue }
    }
    // Child props override
    else {
      result[key] = childValue !== undefined ? childValue : parentValue
    }
  }

  return result
}

/**
 * Composes multiple refs into a single ref callback.
 */
function composeRefs<T>(
  ...refs: (React.Ref<T> | undefined)[]
): React.RefCallback<T> {
  return (node) => {
    refs.forEach((ref) => {
      if (typeof ref === 'function') {
        ref(node)
      } else if (ref != null) {
        (ref as React.MutableRefObject<T | null>).current = node
      }
    })
  }
}

/**
 * Example: Slottable button
 */
interface SlottableButtonProps {
  variant?: 'default' | 'primary'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  children?: React.ReactNode
}

export const SlottableButtonExample = createSlotComponent<SlottableButtonProps>(
  'button',
  ({ variant = 'default', size = 'md', className, ...props }): Record<string, unknown> => {
    const variantClasses: Record<string, string> = {
      default: 'bg-background-secondary hover:bg-background-tertiary',
      primary: 'bg-brand-primary text-black',
    }
    const sizeClasses: Record<string, string> = {
      sm: 'h-8 px-3 text-xs',
      md: 'h-10 px-4 text-sm',
      lg: 'h-12 px-6 text-base',
    }

    return {
      className: `inline-flex items-center justify-center rounded-lg font-medium transition-colors ${variantClasses[variant]} ${sizeClasses[size]} ${className || ''}`,
      ...props,
    }
  }
)
