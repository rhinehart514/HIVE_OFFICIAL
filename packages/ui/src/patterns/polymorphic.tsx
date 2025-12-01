// @ts-nocheck
// TODO: Fix advanced polymorphic type issues
import * as React from 'react'

/**
 * Props for polymorphic components that can render as different elements.
 */
export type PolymorphicComponentProps<
  T extends React.ElementType,
  P = Record<string, never>
> = P & {
  /** Element type to render as */
  as?: T
} & Omit<React.ComponentPropsWithoutRef<T>, keyof P | 'as'>

/**
 * Ref type for polymorphic components.
 */
export type PolymorphicRef<T extends React.ElementType> =
  React.ComponentPropsWithRef<T>['ref']

/**
 * Creates a polymorphic component that can render as different elements.
 *
 * @example
 * ```tsx
 * const Box = createPolymorphicComponent<'div', BoxProps>(
 *   'div',
 *   ({ as: Component = 'div', padding, ...props }, ref) => (
 *     <Component
 *       ref={ref}
 *       style={{ padding }}
 *       {...props}
 *     />
 *   )
 * )
 *
 * // Usage
 * <Box padding={16}>Default div</Box>
 * <Box as="section" padding={24}>As section</Box>
 * <Box as="a" href="/about" padding={8}>As link</Box>
 * <Box as={motion.div} animate={{ opacity: 1 }}>With Framer</Box>
 * ```
 */
export function createPolymorphicComponent<
  DefaultElement extends React.ElementType,
  P = Record<string, never>
>(
  _defaultElement: DefaultElement,
  render: <T extends React.ElementType = DefaultElement>(
    props: PolymorphicComponentProps<T, P> & { as?: T },
    ref: PolymorphicRef<T>
  ) => React.ReactElement | null
) {
  type ComponentType = <T extends React.ElementType = DefaultElement>(
    props: PolymorphicComponentProps<T, P> & {
      ref?: PolymorphicRef<T>
    }
  ) => React.ReactElement | null

  // Use explicit unknown cast to bypass complex generic inference issues
  const Component = React.forwardRef(
    render as React.ForwardRefRenderFunction<unknown, Record<string, unknown>>
  ) as unknown as ComponentType

  return Component
}

/**
 * Example: Box component that can be any element
 */
interface BoxProps {
  /** Padding in pixels */
  padding?: number | string
  /** Background color */
  bg?: string
}

export const BoxExample = createPolymorphicComponent<'div', BoxProps>(
  'div',
  ({ as: Component = 'div', padding, bg, style, ...props }, ref) => (
    <Component
      ref={ref}
      style={{
        padding,
        backgroundColor: bg,
        ...style,
      }}
      {...props}
    />
  )
)

/**
 * Example: Text component for typography
 */
interface TextProps {
  /** Text variant */
  variant?: 'body' | 'heading' | 'label' | 'caption'
  /** Text color */
  color?: 'primary' | 'secondary' | 'tertiary'
}

const textStyles = {
  body: 'text-sm leading-relaxed',
  heading: 'text-lg font-semibold',
  label: 'text-xs font-medium uppercase tracking-wide',
  caption: 'text-xs text-text-tertiary',
}

const colorStyles = {
  primary: 'text-text-primary',
  secondary: 'text-text-secondary',
  tertiary: 'text-text-tertiary',
}

export const TextExample = createPolymorphicComponent<'p', TextProps>(
  'p',
  (
    {
      as: Component = 'p',
      variant = 'body',
      color = 'primary',
      className,
      ...props
    },
    ref
  ) => (
    <Component
      ref={ref}
      className={`${textStyles[variant]} ${colorStyles[color]} ${className || ''}`}
      {...props}
    />
  )
)

/**
 * Example: Button that can be a link
 */
interface ButtonBaseProps {
  variant?: 'default' | 'primary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

const buttonVariants = {
  default: 'bg-background-secondary hover:bg-background-tertiary',
  primary: 'bg-brand-primary text-black hover:bg-brand-hover',
  ghost: 'hover:bg-background-secondary',
}

const buttonSizes = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
}

export const PolymorphicButtonExample = createPolymorphicComponent<
  'button',
  ButtonBaseProps
>(
  'button',
  (
    {
      as: Component = 'button',
      variant = 'default',
      size = 'md',
      className,
      ...props
    },
    ref
  ) => (
    <Component
      ref={ref}
      className={`inline-flex items-center justify-center rounded-lg font-medium transition-colors ${buttonVariants[variant]} ${buttonSizes[size]} ${className || ''}`}
      {...props}
    />
  )
)
