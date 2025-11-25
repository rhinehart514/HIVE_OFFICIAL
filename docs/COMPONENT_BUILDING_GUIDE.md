# HIVE Component Building Guide
**How to Build Custom, Production-Grade Components**

This guide outlines the exact patterns and principles for building strong, reusable components in the HIVE design system that match Linear/Vercel/OpenAI quality standards.

---

## 🎯 Philosophy: What Makes Components "Strong"

Strong components are:
1. **Predictable** - Behave consistently across all use cases
2. **Accessible** - WCAG 2.1 AA compliant with keyboard navigation
3. **Performant** - Render in < 16ms, optimize re-renders
4. **Composable** - Work well with other components
5. **Polished** - Micro-interactions that feel delightful
6. **Type-Safe** - Full TypeScript support with prop validation
7. **Mobile-First** - Work perfectly on 375px viewports

---

## 📐 The 7-Layer Component Architecture

Every production component should have these 7 layers:

### **Layer 1: Variants (CVA Pattern)**
Define visual variations using `class-variance-authority`.

```typescript
import { cva, type VariantProps } from "class-variance-authority"

const inputVariants = cva(
  // Base styles (always applied)
  "w-full rounded-xl border bg-[var(--hive-background-secondary)] px-4 py-2.5 text-sm font-medium text-[var(--hive-text-primary)] transition-all duration-200",
  {
    // Variant definitions
    variants: {
      variant: {
        default: "border-[var(--hive-border-default)] hover:border-[var(--hive-interactive-hover)]",
        subtle: "border-transparent bg-[var(--hive-background-primary)]",
        ghost: "border-transparent bg-transparent",
      },
      size: {
        sm: "h-9 px-3 text-sm rounded-lg",
        default: "h-11 px-4 text-sm",
        lg: "h-12 px-5 text-base rounded-xl",
      },
      state: {
        default: "",
        error: "border-[var(--hive-status-error)] focus:border-[var(--hive-status-error)]",
        success: "border-[var(--hive-status-success)] focus:border-[var(--hive-status-success)]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      state: "default",
    },
  }
)
```

**Why this matters:**
- Consistent styling across all instances
- Type-safe variant composition
- Easy to extend without breaking existing uses

---

### **Layer 2: Motion Variants**
Define animation states for micro-interactions.

```typescript
import { motion } from "framer-motion"
import { inputVariants, duration, easing } from "@/lib/motion-variants"

const InputMotionVariants = {
  initial: {
    borderColor: "var(--hive-border-default)",
  },
  focus: {
    borderColor: "var(--hive-interactive-focus)",
    scale: 1.01,
    transition: {
      duration: duration.quick,
      ease: easing.smooth,
    },
  },
  error: {
    borderColor: "var(--hive-status-error)",
    x: [0, -4, 4, -4, 4, 0], // Shake animation
    transition: {
      duration: duration.leisurely,
      ease: easing.snap,
    },
  },
}
```

**Motion Guidelines:**
- **160ms** (quick) for focus transitions
- **240ms** (standard) for state changes
- **400ms** (leisurely) for complex animations
- Use butter easing `[0.22, 1, 0.36, 1]` for 90% of animations
- Respect `prefers-reduced-motion`

---

### **Layer 3: TypeScript Interface**
Strong typing with proper prop inheritance.

```typescript
export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  // Custom props
  label?: string
  helperText?: string
  errorText?: string
  leadingIcon?: React.ReactNode
  trailingIcon?: React.ReactNode

  // Callbacks with proper types
  onValueChange?: (value: string) => void

  // State management
  loading?: boolean
}
```

**Type Safety Rules:**
- Extend native HTML props when possible
- Use `Omit` to remove conflicting props (like `size`)
- Include `VariantProps<typeof inputVariants>` for type inference
- Proper callback typing (e.g., `onValueChange` not just `onChange`)

---

### **Layer 4: State Management**
Use React hooks for internal component state.

```typescript
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ value, onValueChange, errorText, ...props }, ref) => {
    // Internal state
    const [isFocused, setIsFocused] = React.useState(false)
    const [hasError, setHasError] = React.useState(!!errorText)

    // Controlled vs uncontrolled handling
    const isControlled = value !== undefined
    const [internalValue, setInternalValue] = React.useState("")
    const currentValue = isControlled ? value : internalValue

    // Derived state
    const showError = hasError && !isFocused
    const motionState = showError ? "error" : isFocused ? "focus" : "initial"

    // Event handlers
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value
      if (!isControlled) {
        setInternalValue(newValue)
      }
      onValueChange?.(newValue)
      props.onChange?.(e)
    }

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true)
      props.onFocus?.(e)
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false)
      props.onBlur?.(e)
    }

    // ... component JSX
  }
)
```

**State Management Rules:**
- Support both controlled and uncontrolled modes
- Derive computed state (don't duplicate)
- Preserve original event handlers (call `props.onChange` after custom logic)
- Use meaningful state names (`isFocused` not `focused`)

---

### **Layer 5: Accessibility**
WCAG 2.1 AA compliance built-in.

```typescript
<motion.input
  ref={ref}
  // ARIA attributes
  aria-label={props['aria-label'] || label}
  aria-describedby={errorText ? `${id}-error` : helperText ? `${id}-helper` : undefined}
  aria-invalid={hasError}
  aria-required={props.required}

  // IDs for label association
  id={props.id || id}

  // Keyboard navigation
  onKeyDown={(e) => {
    if (e.key === 'Escape') {
      e.currentTarget.blur()
    }
    props.onKeyDown?.(e)
  }}

  // Focus management
  autoFocus={props.autoFocus}
  tabIndex={props.disabled ? -1 : 0}
/>
```

**Accessibility Checklist:**
- ✅ Keyboard navigation (Tab, Shift+Tab, Escape)
- ✅ Screen reader support (ARIA labels, descriptions, live regions)
- ✅ Focus indicators (visible outline with `focus-visible`)
- ✅ Error announcements (`aria-invalid`, `aria-describedby`)
- ✅ Disabled state handling (no tab stops)

---

### **Layer 6: Composition & Slots**
Support icon slots and flexible composition.

```typescript
return (
  <div className="relative w-full">
    {label && (
      <label
        htmlFor={id}
        className="mb-1.5 block text-sm font-medium text-[var(--hive-text-secondary)]"
      >
        {label}
        {props.required && <span className="ml-1 text-[var(--hive-status-error)]">*</span>}
      </label>
    )}

    <div className="relative">
      {leadingIcon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--hive-text-tertiary)]">
          {leadingIcon}
        </div>
      )}

      <motion.input
        ref={ref}
        variants={InputMotionVariants}
        initial="initial"
        animate={motionState}
        className={cn(
          inputVariants({ variant, size, state: hasError ? "error" : "default" }),
          leadingIcon && "pl-10",
          trailingIcon && "pr-10",
          className
        )}
        value={currentValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        {...props}
      />

      {trailingIcon && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--hive-text-tertiary)]">
          {trailingIcon}
        </div>
      )}

      {loading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <LoadingSpinner size="sm" />
        </div>
      )}
    </div>

    {errorText && (
      <p id={`${id}-error`} className="mt-1.5 text-xs text-[var(--hive-status-error)]" role="alert">
        {errorText}
      </p>
    )}

    {helperText && !errorText && (
      <p id={`${id}-helper`} className="mt-1.5 text-xs text-[var(--hive-text-tertiary)]">
        {helperText}
      </p>
    )}
  </div>
)
```

**Composition Patterns:**
- **Icon slots**: `leadingIcon`, `trailingIcon` for visual enhancement
- **Helper text**: Contextual guidance below input
- **Error text**: Validation feedback with `role="alert"`
- **Loading state**: Show spinner when async validation happening

---

### **Layer 7: Export & Documentation**
Proper exports with display names.

```typescript
Input.displayName = "Input"

export { Input, inputVariants }
export type { InputProps }
```

**Documentation Requirements:**
- Display name for React DevTools
- Export both component and variants
- Export TypeScript types for consumers
- JSDoc comments for complex props

---

## 🔨 Production Patterns

### **Pattern 1: Optimistic Updates**
Make interactions feel instant (< 16ms perceived latency).

```typescript
const handleUpvote = async () => {
  // Optimistic update (instant UI feedback)
  setUpvotes(prev => prev + 1)
  setHasUpvoted(true)

  try {
    await upvotePost(postId)
  } catch (error) {
    // Rollback on error
    setUpvotes(prev => prev - 1)
    setHasUpvoted(false)
    toast.error("Failed to upvote")
  }
}
```

---

### **Pattern 2: Debounced Inputs**
Reduce API calls for search/autocomplete.

```typescript
const [searchQuery, setSearchQuery] = React.useState("")
const debouncedQuery = useDebounce(searchQuery, 300)

React.useEffect(() => {
  if (debouncedQuery) {
    fetchResults(debouncedQuery)
  }
}, [debouncedQuery])

return (
  <Input
    value={searchQuery}
    onValueChange={setSearchQuery}
    placeholder="Search..."
  />
)
```

---

### **Pattern 3: Error Boundaries**
Graceful error handling for complex components.

```typescript
class ComponentErrorBoundary extends React.Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return <FallbackComponent />
    }
    return this.props.children
  }
}
```

---

### **Pattern 4: Compound Components**
Related components that work together.

```typescript
// Select.tsx - Root component
const Select = ({ children, value, onValueChange }) => {
  const context = { value, onValueChange, open, setOpen }
  return <SelectContext.Provider value={context}>{children}</SelectContext.Provider>
}

// Select.Trigger.tsx
const SelectTrigger = ({ children }) => {
  const { open, setOpen } = useSelectContext()
  return <button onClick={() => setOpen(!open)}>{children}</button>
}

// Select.Content.tsx
const SelectContent = ({ children }) => {
  const { open } = useSelectContext()
  return open ? <div>{children}</div> : null
}

// Usage
<Select value={value} onValueChange={setValue}>
  <Select.Trigger>
    <Select.Value placeholder="Select..." />
  </Select.Trigger>
  <Select.Content>
    <Select.Item value="1">Option 1</Select.Item>
    <Select.Item value="2">Option 2</Select.Item>
  </Select.Content>
</Select>
```

---

## 🎨 Visual Polish Checklist

Before shipping any component, ensure it has:

### **Micro-Interactions** (< 200ms)
- ✅ Hover states with subtle scale/color changes
- ✅ Active/pressed states with scale reduction
- ✅ Focus rings with smooth transitions
- ✅ Loading states with spinners or skeletons

### **Feedback Mechanisms**
- ✅ Success states (green checkmark, subtle flash)
- ✅ Error states (red border, shake animation)
- ✅ Disabled states (reduced opacity, no pointer events)
- ✅ Empty states (helpful guidance, not blank screens)

### **Mobile Optimization**
- ✅ Touch targets ≥ 44x44px (Apple HIG)
- ✅ No hover-dependent interactions
- ✅ Responsive padding (tighter on mobile)
- ✅ Readable text at 375px viewport

---

## 🚀 Week 1 Implementation Plan

### **Day 1-2: Input Component Enhancement**
Apply all 7 layers to Input:
1. Refine `inputVariants` with all visual states
2. Add motion variants (focus, error, success)
3. Enhance TypeScript interface
4. Add icon slots and helper text
5. Full accessibility audit
6. Mobile touch target fixes

### **Day 3-4: Textarea Component Enhancement**
Clone Input patterns to Textarea:
1. Auto-resize functionality
2. Character count indicator
3. Multi-line focus animations
4. Proper mobile keyboard handling

### **Day 5-6: Card Component Polish**
Add hover animations:
1. Subtle lift on hover (y: -4px)
2. Shadow enhancement
3. Interactive card variants (clickable, selectable)
4. Loading skeleton states

### **Day 7: Mobile Testing**
Test all enhanced components:
1. 375px viewport testing
2. Touch interaction testing
3. iOS Safari specific fixes
4. Android Chrome specific fixes

---

## 📊 Quality Metrics

Every component must meet:

| Metric | Target | How to Measure |
|--------|--------|----------------|
| **Render time** | < 16ms | React DevTools Profiler |
| **Bundle size** | < 5KB gzipped | `pnpm build:analyze` |
| **Accessibility** | WCAG 2.1 AA | axe DevTools |
| **Type coverage** | 100% | `pnpm typecheck` |
| **Mobile touch target** | ≥ 44x44px | Manual testing |
| **Storybook story** | Required | `pnpm storybook` |

---

## 🎯 Next Steps

1. **Apply this guide to Input component** - Full enhancement following all 7 layers
2. **Create Storybook stories** - Show all states and variants
3. **Document usage patterns** - JSDoc comments + README
4. **Repeat for Textarea and Card** - Build muscle memory for the pattern

**Remember:** Strong components are built, not born. Follow this guide every time you create or enhance a component, and you'll ship production-quality UI that feels like Linear, Vercel, or OpenAI.
