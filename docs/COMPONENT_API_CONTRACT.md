# Component API Contract

> Standard prop patterns for HIVE's design system. Every component MUST follow these conventions.

---

## Core Prop Standards

### Required Props

| Prop | Type | Description |
|------|------|-------------|
| `variant` | `string` | Visual style variant |
| `size` | `'sm' \| 'md' \| 'lg'` | Component size |
| `disabled` | `boolean` | Disabled state |
| `className` | `string` | Additional CSS classes |

### Standard Prop Naming

```typescript
// ✅ CORRECT
variant="primary"
size="md"
disabled={true}
isLoading={true}
isSelected={true}

// ❌ INCORRECT
type="primary"     // Use variant
large={true}       // Use size="lg"
loading={true}     // Use isLoading
selected={true}    // Use isSelected
```

---

## Variant System

### Button Variants
```typescript
type ButtonVariant =
  | 'default'      // Neutral, secondary action
  | 'primary'      // Gold, primary CTA
  | 'ghost'        // Transparent, tertiary
  | 'destructive'  // Red, danger action
  | 'outline'      // Bordered, subtle
  | 'link'         // Text only, inline
```

### Card Variants
```typescript
type CardVariant =
  | 'default'      // Standard elevation
  | 'elevated'     // Higher shadow
  | 'outline'      // Border only
  | 'ghost'        // No background
  | 'glass'        // Glassmorphism effect
```

### Badge Variants
```typescript
type BadgeVariant =
  | 'default'      // Neutral gray
  | 'primary'      // Gold accent
  | 'success'      // Green status
  | 'warning'      // Yellow status
  | 'error'        // Red status
  | 'outline'      // Border only
```

### Input Variants
```typescript
type InputVariant =
  | 'default'      // Standard input
  | 'ghost'        // Minimal style
  | 'filled'       // Background fill
```

---

## Size System

All sizeable components use the same scale:

```typescript
type Size = 'sm' | 'md' | 'lg'

// Mapping to design tokens
const sizeMap = {
  sm: {
    height: '32px',      // h-8
    padding: '8px 12px', // px-3 py-2
    fontSize: '12px',    // text-xs
    iconSize: '14px',
  },
  md: {
    height: '40px',      // h-10
    padding: '8px 16px', // px-4 py-2
    fontSize: '14px',    // text-sm
    iconSize: '16px',
  },
  lg: {
    height: '48px',      // h-12
    padding: '12px 24px',// px-6 py-3
    fontSize: '16px',    // text-base
    iconSize: '20px',
  },
}
```

### Component Size Defaults

| Component | Default Size |
|-----------|--------------|
| Button | `md` |
| Input | `md` |
| Select | `md` |
| Badge | `sm` |
| Avatar | `md` |
| IconButton | `md` |

---

## State Props

### Boolean States
```typescript
// Loading state
isLoading?: boolean

// Selection state
isSelected?: boolean

// Expansion state
isExpanded?: boolean

// Active state (current route, etc.)
isActive?: boolean

// Open state (dropdowns, modals)
isOpen?: boolean

// Disabled state (special case - no 'is' prefix)
disabled?: boolean
```

### State Examples
```tsx
<Button isLoading>Saving...</Button>
<Tab isSelected>Profile</Tab>
<Accordion isExpanded>Content</Accordion>
<NavItem isActive>Dashboard</NavItem>
<Dropdown isOpen>Menu</Dropdown>
<Input disabled />
```

---

## Event Handler Props

### Naming Convention
```typescript
// Format: on + Event
onClick?: (event: MouseEvent) => void
onChange?: (value: T) => void
onBlur?: (event: FocusEvent) => void
onFocus?: (event: FocusEvent) => void
onSubmit?: (data: FormData) => void
onClose?: () => void
onOpen?: () => void
onSelect?: (item: T) => void
```

### Value Change Pattern
```typescript
// For controlled components
interface ControlledProps<T> {
  value: T
  onChange: (value: T) => void
}

// Example
<Select
  value={selected}
  onChange={(value) => setSelected(value)}
/>
```

---

## Slot Props

### Children Slots
```typescript
// Simple children
children?: React.ReactNode

// Named slots
header?: React.ReactNode
footer?: React.ReactNode
icon?: React.ReactNode
prefix?: React.ReactNode
suffix?: React.ReactNode
```

### Render Props Pattern
```typescript
// For complex customization
renderItem?: (item: T, index: number) => React.ReactNode
renderEmpty?: () => React.ReactNode
renderLoading?: () => React.ReactNode
```

---

## Accessibility Props

### Required for Interactive Elements
```typescript
// Labels
'aria-label'?: string
'aria-labelledby'?: string
'aria-describedby'?: string

// States
'aria-expanded'?: boolean
'aria-selected'?: boolean
'aria-pressed'?: boolean
'aria-disabled'?: boolean

// Relationships
'aria-controls'?: string
'aria-owns'?: string
```

### Example
```tsx
<Button
  aria-label="Close dialog"
  aria-controls="dialog-content"
>
  <CloseIcon />
</Button>
```

---

## Ref Forwarding

All components MUST forward refs:

```typescript
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'default', size = 'md', ...props }, ref) => {
    return (
      <button ref={ref} {...props}>
        {props.children}
      </button>
    )
  }
)
Button.displayName = 'Button'
```

---

## TypeScript Patterns

### Component Props Type
```typescript
// Export props type for composition
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}
```

### Variant Props with CVA
```typescript
import { cva, type VariantProps } from 'class-variance-authority'

const buttonVariants = cva(
  // Base styles
  'inline-flex items-center justify-center rounded-lg font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-background-secondary text-text-primary hover:bg-background-tertiary',
        primary: 'bg-brand-primary text-black hover:bg-brand-hover',
        ghost: 'hover:bg-background-secondary',
        destructive: 'bg-status-error text-white hover:bg-status-error/90',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
)
```

---

## Motion Props

### Standard Animation Props
```typescript
// For Framer Motion components
initial?: boolean | Target
animate?: AnimationControls | Target
exit?: Target
transition?: Transition

// Simplified presets
motionPreset?: 'fadeIn' | 'slideUp' | 'scaleIn' | 'none'
```

### Example
```tsx
<Card motionPreset="slideUp">
  Content
</Card>

// Or with full control
<Card
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
>
  Content
</Card>
```

---

## Compound Components

### Pattern
```typescript
// Parent provides context
const Tabs = ({ children, value, onChange }) => {
  return (
    <TabsContext.Provider value={{ value, onChange }}>
      {children}
    </TabsContext.Provider>
  )
}

// Children consume context
Tabs.List = TabsList
Tabs.Tab = Tab
Tabs.Panel = TabsPanel

// Usage
<Tabs value={tab} onChange={setTab}>
  <Tabs.List>
    <Tabs.Tab value="profile">Profile</Tabs.Tab>
    <Tabs.Tab value="settings">Settings</Tabs.Tab>
  </Tabs.List>
  <Tabs.Panel value="profile">...</Tabs.Panel>
  <Tabs.Panel value="settings">...</Tabs.Panel>
</Tabs>
```

---

## Polymorphic Components

### `as` Prop Pattern
```typescript
interface PolymorphicProps<T extends React.ElementType> {
  as?: T
}

type Props<T extends React.ElementType> = PolymorphicProps<T> &
  Omit<React.ComponentPropsWithoutRef<T>, keyof PolymorphicProps<T>>

// Usage
<Button as="a" href="/profile">
  Go to Profile
</Button>

<Card as="article">
  Article content
</Card>
```

---

## Migration Checklist

When updating a component to match this contract:

- [ ] Rename `type` to `variant`
- [ ] Rename boolean props to `is*` pattern (except `disabled`)
- [ ] Add size prop with `sm | md | lg` scale
- [ ] Forward ref properly
- [ ] Export props type
- [ ] Use CVA for variants
- [ ] Add aria labels for interactive elements
- [ ] Add JSDoc comments with examples
- [ ] Add to Storybook

---

## Examples

### Complete Button Implementation
```typescript
import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@hive/ui/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-lg font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-background-secondary text-text-primary hover:bg-background-tertiary',
        primary: 'bg-brand-primary text-black hover:bg-brand-hover',
        ghost: 'hover:bg-background-secondary text-text-primary',
        destructive: 'bg-status-error text-white hover:bg-status-error/90',
        outline: 'border border-border-subtle bg-transparent hover:bg-background-secondary',
        link: 'text-brand-primary underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-8 px-3 text-xs gap-1.5',
        md: 'h-10 px-4 text-sm gap-2',
        lg: 'h-12 px-6 text-base gap-2.5',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Show loading spinner */
  isLoading?: boolean
  /** Icon before text */
  leftIcon?: React.ReactNode
  /** Icon after text */
  rightIcon?: React.ReactNode
}

/**
 * Button component with multiple variants and sizes.
 *
 * @example
 * ```tsx
 * <Button variant="primary" size="lg">
 *   Save Changes
 * </Button>
 *
 * <Button variant="ghost" leftIcon={<PlusIcon />}>
 *   Add Item
 * </Button>
 *
 * <Button isLoading disabled>
 *   Saving...
 * </Button>
 * ```
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <span className="animate-spin mr-2">⟳</span>
        ) : leftIcon ? (
          <span className="shrink-0">{leftIcon}</span>
        ) : null}
        {children}
        {rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
```

---

## Quick Reference

| Pattern | Example |
|---------|---------|
| Visual style | `variant="primary"` |
| Size | `size="md"` |
| Loading | `isLoading={true}` |
| Selected | `isSelected={true}` |
| Disabled | `disabled={true}` |
| Change handler | `onChange={(value) => ...}` |
| Icon slot | `leftIcon={<Icon />}` |
| Motion | `motionPreset="fadeIn"` |
| Polymorphic | `as="a"` |

---

**Remember**: Consistency enables velocity. Every deviation from this contract creates cognitive overhead.
