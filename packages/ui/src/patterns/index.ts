/**
 * HIVE Composition Patterns
 *
 * Reusable patterns for building consistent, composable components.
 * These patterns follow YC/SF aesthetics inspired by Vercel and OpenAI.
 */

// Compound component pattern
export { createCompoundComponent, type CompoundComponent } from './compound'

// Polymorphic component pattern
export { createPolymorphicComponent, type PolymorphicComponentProps } from './polymorphic'

// Slot pattern for flexible content injection
export { createSlotComponent, Slot, type SlotProps } from './slot'

// Context factory for compound components
export { createComponentContext } from './context-factory'
