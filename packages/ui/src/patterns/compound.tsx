import * as React from 'react'
import { createComponentContext } from './context-factory'

/**
 * Type for compound components with sub-components attached.
 */
export type CompoundComponent<
  P,
  S extends Record<string, React.ComponentType<any>>
> = React.FC<P> & S

/**
 * Creates a compound component with type-safe sub-components.
 *
 * @example
 * ```tsx
 * // Define context type
 * interface CardContextValue {
 *   variant: 'default' | 'elevated'
 * }
 *
 * // Create compound component
 * const Card = createCompoundComponent<CardProps, CardContextValue>(
 *   'Card',
 *   ({ variant = 'default', children }) => (
 *     <div className={cardVariants({ variant })}>
 *       {children}
 *     </div>
 *   ),
 *   (Provider) => ({
 *     Header: ({ children }) => (
 *       <div className="p-4 border-b">{children}</div>
 *     ),
 *     Body: ({ children }) => (
 *       <div className="p-4">{children}</div>
 *     ),
 *     Footer: ({ children }) => (
 *       <div className="p-4 border-t">{children}</div>
 *     ),
 *   })
 * )
 *
 * // Usage
 * <Card variant="elevated">
 *   <Card.Header>Title</Card.Header>
 *   <Card.Body>Content</Card.Body>
 *   <Card.Footer>Actions</Card.Footer>
 * </Card>
 * ```
 */
export function createCompoundComponent<
  P extends { children?: React.ReactNode },
  C = undefined,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  S extends Record<string, React.ComponentType<any>> = Record<string, React.ComponentType<any>>
>(
  displayName: string,
  RootComponent: React.FC<P & { Provider?: React.Provider<C | undefined> }>,
  createSubComponents?: (
    Provider: React.Provider<C | undefined>,
    useContext: () => C
  ) => S
): CompoundComponent<P, S> {
  const [Provider, useContext] = createComponentContext<C>(displayName)

  const Root: React.FC<P> = (props) => {
    return <RootComponent {...props} Provider={Provider} />
  }
  Root.displayName = displayName

  const subComponents = createSubComponents
    ? createSubComponents(Provider, useContext)
    : ({} as S)

  return Object.assign(Root, subComponents)
}

/**
 * Example: Tabs compound component
 */
interface TabsContextValue {
  value: string
  onChange: (value: string) => void
}

interface TabsProps {
  value: string
  onChange: (value: string) => void
  children: React.ReactNode
}

interface TabProps {
  value: string
  children: React.ReactNode
}

interface TabPanelProps {
  value: string
  children: React.ReactNode
}

export const TabsExample = createCompoundComponent<TabsProps, TabsContextValue>(
  'Tabs',
  ({ value, onChange, children, Provider }) => {
    if (!Provider) return <>{children}</>
    return <Provider value={{ value, onChange }}>{children}</Provider>
  },
  (_Provider, useTabs) => ({
    List: ({ children }: { children: React.ReactNode }) => (
      <div className="flex gap-1 border-b border-border-subtle" role="tablist">
        {children}
      </div>
    ),
    Tab: ({ value, children }: TabProps) => {
      const { value: selected, onChange } = useTabs()
      const isSelected = selected === value
      return (
        <button
          role="tab"
          aria-selected={isSelected}
          onClick={() => onChange(value)}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            isSelected
              ? 'text-text-primary border-b-2 border-brand-primary'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          {children}
        </button>
      )
    },
    Panel: ({ value, children }: TabPanelProps) => {
      const { value: selected } = useTabs()
      if (selected !== value) return null
      return (
        <div role="tabpanel" className="py-4">
          {children}
        </div>
      )
    },
  })
)
