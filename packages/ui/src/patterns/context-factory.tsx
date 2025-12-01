'use client';

import * as React from 'react'

/**
 * Creates a context with a custom hook for compound components.
 * Provides type-safe context with helpful error messages.
 *
 * @example
 * ```tsx
 * const [TabsProvider, useTabs] = createComponentContext<TabsContextValue>('Tabs')
 *
 * // In parent
 * <TabsProvider value={{ selected, setSelected }}>
 *   {children}
 * </TabsProvider>
 *
 * // In child
 * const { selected, setSelected } = useTabs()
 * ```
 */
export function createComponentContext<T>(displayName: string) {
  const Context = React.createContext<T | undefined>(undefined)
  Context.displayName = displayName

  const Provider = Context.Provider

  function useContext() {
    const context = React.useContext(Context)
    if (context === undefined) {
      throw new Error(
        `use${displayName} must be used within a ${displayName}Provider`
      )
    }
    return context
  }

  return [Provider, useContext] as const
}

/**
 * Creates a context with optional value (no error if missing).
 * Useful for optional feature detection in compound components.
 */
export function createOptionalContext<T>(displayName: string) {
  const Context = React.createContext<T | undefined>(undefined)
  Context.displayName = displayName

  const Provider = Context.Provider

  function useContext() {
    return React.useContext(Context)
  }

  return [Provider, useContext] as const
}
