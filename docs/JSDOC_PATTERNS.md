# JSDoc Patterns for TypeScript Excellence

> Standards for world-class IntelliSense and developer experience in HIVE components.

---

## Core Principles

1. **Every component gets JSDoc** - No exceptions
2. **Examples are mandatory** - Show, don't just tell
3. **Document the "why"** - Not just the "what"
4. **Use semantic parameter descriptions** - Be specific

---

## Component JSDoc Pattern

```typescript
/**
 * Short description of what the component does (one line).
 *
 * Longer description if needed. Explain use cases, design decisions,
 * or important behaviors.
 *
 * @example Basic usage
 * ```tsx
 * <Button variant="primary" size="md">
 *   Save Changes
 * </Button>
 * ```
 *
 * @example With icon
 * ```tsx
 * <Button leftIcon={<SaveIcon />} isLoading>
 *   Saving...
 * </Button>
 * ```
 *
 * @example As link
 * ```tsx
 * <Button as="a" href="/profile" variant="ghost">
 *   View Profile
 * </Button>
 * ```
 *
 * @see {@link ButtonProps} for all available props
 * @see {@link https://hive-docs.dev/components/button | Documentation}
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  // implementation
)
```

---

## Props Interface Pattern

```typescript
/**
 * Props for the Button component.
 */
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /**
   * Visual style variant.
   * @default "default"
   */
  variant?: 'default' | 'primary' | 'ghost' | 'destructive'

  /**
   * Size of the button.
   * @default "md"
   */
  size?: 'sm' | 'md' | 'lg'

  /**
   * Show loading spinner and disable interactions.
   * @default false
   */
  isLoading?: boolean

  /**
   * Icon displayed before button text.
   * Pass a React element (e.g., `<PlusIcon />`).
   */
  leftIcon?: React.ReactNode

  /**
   * Icon displayed after button text.
   */
  rightIcon?: React.ReactNode

  /**
   * Render as a different element (polymorphic).
   * Useful for rendering as links while keeping button styles.
   *
   * @example
   * ```tsx
   * <Button as="a" href="/about">About</Button>
   * ```
   */
  as?: React.ElementType
}
```

---

## Hook JSDoc Pattern

```typescript
/**
 * Manages tool state with undo/redo history.
 *
 * Provides immutable state updates via Immer with automatic
 * history tracking. Supports up to 50 undo levels.
 *
 * @param initialTool - Starting tool configuration
 * @param options - Optional configuration
 * @returns Tool state and mutation methods
 *
 * @example Basic usage
 * ```tsx
 * const { tool, addElement, undo, canUndo } = useToolState(initialTool)
 *
 * const handleAdd = () => {
 *   addElement({
 *     type: 'text',
 *     label: 'New Field',
 *   })
 * }
 * ```
 *
 * @example With persistence
 * ```tsx
 * const { tool } = useToolState(initialTool, {
 *   onSave: async (tool) => {
 *     await saveTool(tool)
 *   },
 *   autoSaveMs: 3000,
 * })
 * ```
 */
export function useToolState(
  initialTool: Tool,
  options?: UseToolStateOptions
): UseToolStateReturn {
  // implementation
}
```

---

## Type Helper JSDoc Pattern

```typescript
/**
 * Extracts props type from a component.
 *
 * @example
 * ```tsx
 * type MyButtonProps = ComponentProps<typeof Button>
 *
 * const props: MyButtonProps = {
 *   variant: 'primary',
 *   size: 'lg',
 * }
 * ```
 */
export type ComponentProps<T> = T extends React.ComponentType<infer P>
  ? P
  : never

/**
 * Makes specified keys required while keeping others optional.
 *
 * @example
 * ```tsx
 * interface User {
 *   id?: string
 *   name?: string
 *   email?: string
 * }
 *
 * type UserWithId = RequiredKeys<User, 'id'>
 * // { id: string; name?: string; email?: string }
 * ```
 */
export type RequiredKeys<T, K extends keyof T> = T & Required<Pick<T, K>>
```

---

## Variant Type JSDoc Pattern

```typescript
/**
 * Available button variants.
 *
 * | Variant | Use Case |
 * |---------|----------|
 * | `default` | Secondary actions, most common |
 * | `primary` | Primary CTA, gold color |
 * | `ghost` | Tertiary actions, minimal style |
 * | `destructive` | Dangerous actions like delete |
 * | `outline` | Bordered, subtle emphasis |
 * | `link` | Inline text links |
 */
export type ButtonVariant =
  | 'default'
  | 'primary'
  | 'ghost'
  | 'destructive'
  | 'outline'
  | 'link'
```

---

## Function JSDoc Pattern

```typescript
/**
 * Merges multiple class names, filtering falsy values.
 *
 * Uses `clsx` for conditional classes and `tailwind-merge`
 * to resolve Tailwind conflicts.
 *
 * @param inputs - Class names, objects, or arrays
 * @returns Merged class string
 *
 * @example Conditional classes
 * ```tsx
 * cn(
 *   'base-class',
 *   isActive && 'active-class',
 *   { 'hover-class': isHoverable }
 * )
 * // => "base-class active-class hover-class"
 * ```
 *
 * @example Tailwind conflict resolution
 * ```tsx
 * cn('px-4', 'px-6')
 * // => "px-6" (later wins)
 * ```
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
```

---

## Constant JSDoc Pattern

```typescript
/**
 * Standard easing curves for animations.
 *
 * Based on YC/SF aesthetic - subtle, refined, purposeful.
 *
 * @example
 * ```tsx
 * <motion.div
 *   transition={{ ease: easing.default }}
 * />
 * ```
 */
export const easing = {
  /**
   * Smooth, natural movement.
   * Use for 90% of animations.
   */
  default: [0.23, 1, 0.32, 1] as const,

  /**
   * Quick, decisive movement.
   * Use for toggles and instant feedback.
   */
  snap: [0.25, 0.1, 0.25, 1] as const,

  /**
   * Cinematic, dramatic movement.
   * Use for achievements and celebrations.
   */
  dramatic: [0.165, 0.84, 0.44, 1] as const,
}
```

---

## Tags Reference

| Tag | Use For |
|-----|---------|
| `@example` | Code examples (multiple allowed) |
| `@param` | Function/hook parameters |
| `@returns` | Return value description |
| `@default` | Default prop value |
| `@see` | Links to related items |
| `@deprecated` | Mark as deprecated with migration path |
| `@since` | Version introduced |
| `@internal` | Not part of public API |

---

## Anti-Patterns

### Don't: Useless descriptions

```typescript
// ❌ BAD
/**
 * The button component.
 */
export const Button = ...

// ✅ GOOD
/**
 * Interactive button with multiple variants and sizes.
 * Supports loading states, icons, and polymorphic rendering.
 */
export const Button = ...
```

### Don't: Missing examples

```typescript
// ❌ BAD
interface ProgressBarProps {
  /** The value */
  value: number
}

// ✅ GOOD
interface ProgressBarProps {
  /**
   * Current progress value (0-100).
   * @default 0
   * @example
   * ```tsx
   * <ProgressBar value={75} />
   * ```
   */
  value: number
}
```

### Don't: Redundant type info

```typescript
// ❌ BAD
/**
 * @param value - number - The value to set
 */

// ✅ GOOD
/**
 * @param value - Progress percentage (0-100)
 */
```

---

## IntelliSense Preview

When done correctly, hovering shows:

```
Button

Interactive button with multiple variants and sizes.
Supports loading states, icons, and polymorphic rendering.

@example Basic usage
<Button variant="primary" size="md">
  Save Changes
</Button>
```

---

## Migration Checklist

When adding JSDoc to a component:

- [ ] One-line summary at top
- [ ] Extended description if complex
- [ ] At least 2 `@example` blocks
- [ ] All props have descriptions
- [ ] Default values documented with `@default`
- [ ] Complex props have inline examples
- [ ] Return type documented for hooks
- [ ] Links to related components with `@see`

---

**Remember**: Great documentation is a feature, not a chore. Every minute spent here saves hours for the team.
