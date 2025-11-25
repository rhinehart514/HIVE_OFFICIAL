'use client';

import { cva, type VariantProps } from "class-variance-authority"
import { motion, useReducedMotion } from "framer-motion"
import * as React from "react"

import { cn } from "../../../lib/utils"

const tabsListVariants = cva(
  "inline-flex h-9 items-center justify-center rounded-lg bg-background-secondary p-1 text-text-tertiary",
  {
    variants: {
      variant: {
        default: "bg-background-secondary",
        underline: "bg-transparent border-b border-border-default",
        pills: "bg-background-interactive gap-1",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const tabsTriggerVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-primary/50 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "text-text-tertiary hover:text-text-primary data-[state=active]:bg-background-interactive data-[state=active]:text-brand-primary",
        underline: "text-text-tertiary hover:text-text-primary border-b-2 border-transparent data-[state=active]:border-brand-primary data-[state=active]:text-brand-primary rounded-none",
        pills: "text-text-tertiary hover:text-text-primary hover:bg-background-interactive/50 data-[state=active]:bg-brand-primary/15 data-[state=active]:text-brand-primary",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const tabsContentVariants = cva(
  "mt-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-border-strong",
  {
    variants: {
      variant: {
        default: "",
        card: "rounded-lg border border-border-default bg-background-secondary p-4",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

interface TabsContextValue {
  value: string
  onValueChange: (value: string) => void
  variant?: "default" | "underline" | "pills"
  registerRef: (val: string, el: HTMLButtonElement | null) => void
  listRef: React.MutableRefObject<HTMLDivElement | null>
  getRef: (val: string) => HTMLButtonElement | null
}

const TabsContext = React.createContext<TabsContextValue | null>(null)

export interface TabsProps extends VariantProps<typeof tabsListVariants> {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
  className?: string
}

function Tabs({
  value,
  defaultValue,
  onValueChange,
  variant = "default",
  children,
  className
}: TabsProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue || "")

  const isControlled = value !== undefined
  const currentValue = isControlled ? value : internalValue
  const handleValueChange = React.useCallback((newValue: string) => {
    if (!isControlled) {
      setInternalValue(newValue)
    }
    onValueChange?.(newValue)
  }, [isControlled, onValueChange])

  const triggerRefs = React.useRef(new Map<string, HTMLButtonElement | null>())
  const listRef = React.useRef<HTMLDivElement | null>(null)

  const contextVariant: TabsContextValue["variant"] = variant ?? "default"

  const contextValue = React.useMemo(() => ({
    value: currentValue,
    onValueChange: handleValueChange,
    variant: contextVariant,
    registerRef: (val: string, el: HTMLButtonElement | null) => {
      triggerRefs.current.set(val, el)
    },
    listRef,
    getRef: (val: string) => triggerRefs.current.get(val) ?? null,
  }), [currentValue, handleValueChange, contextVariant])

  return (
    <TabsContext.Provider value={contextValue}>
      <div className={cn("w-full", className)}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

export interface TabsListProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof tabsListVariants> {}

const TabsList = React.forwardRef<HTMLDivElement, TabsListProps>(
  ({ className, variant, ...props }, ref) => {
    const context = React.useContext(TabsContext)
    const actualVariant = variant || context?.variant || "default"
    const shouldReduce = useReducedMotion()
    const [indicator, setIndicator] = React.useState<{ left: number; width: number } | null>(null)

    React.useLayoutEffect(() => {
      if (!context || actualVariant !== "underline") return
      const recalc = () => {
        const listEl = context.listRef.current
        const activeEl = context.getRef(context.value)
        if (!listEl || !activeEl) return
        const listRect = listEl.getBoundingClientRect()
        const elRect = activeEl.getBoundingClientRect()
        setIndicator({ left: elRect.left - listRect.left, width: elRect.width })
      }
      recalc()
      const onResize = () => recalc()
      window.addEventListener("resize", onResize)
      const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(recalc) : undefined
      if (ro && context.listRef.current) ro.observe(context.listRef.current)
      return () => {
        window.removeEventListener("resize", onResize)
        ro?.disconnect()
      }
    }, [context, actualVariant, context?.value])

    return (
      <div
        ref={(node) => {
          if (ref) {
            if (typeof ref === "function") ref(node)
            else (ref as any).current = node
          }
          if (context) context.listRef.current = node as HTMLDivElement
        }}
        role="tablist"
        className={cn("relative", tabsListVariants({ variant: actualVariant }), className)}
        {...props}
      >
        {actualVariant === "underline" && indicator && (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute bottom-0 h-[2px] rounded-full bg-brand-primary"
            initial={false}
            animate={{ x: indicator.left, width: indicator.width }}
            transition={{ type: "spring", stiffness: 500, damping: 30, mass: 0.5 }}
            style={{ left: 0 }}
          />
        )}
        {props.children}
      </div>
    )
  }
)
TabsList.displayName = "TabsList"

export interface TabsTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof tabsTriggerVariants> {
  value: string
}

const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, variant, value, children, ...props }, ref) => {
    const context = React.useContext(TabsContext)
    const actualVariant = variant || context?.variant || "default"

    if (!context) {
      throw new Error("TabsTrigger must be used within Tabs")
    }

    const isActive = context.value === value

    const localRef = React.useRef<HTMLButtonElement | null>(null)

    React.useLayoutEffect(() => {
      if (!context) return
      context.registerRef(value, localRef.current)
      return () => context.registerRef(value, null)
    }, [context, value])

    return (
      <button
        ref={(node) => {
          localRef.current = node
          if (ref) {
            if (typeof ref === "function") ref(node)
            else (ref as any).current = node
          }
        }}
        role="tab"
        aria-selected={isActive}
        data-state={isActive ? "active" : "inactive"}
        className={cn(tabsTriggerVariants({ variant: actualVariant }), className)}
        onClick={() => context.onValueChange(value)}
        {...props}
      >
        {children}
      </button>
    )
  }
)
TabsTrigger.displayName = "TabsTrigger"

export interface TabsContentProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof tabsContentVariants> {
  value: string
}

const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className, variant, value, children, ...props }, ref) => {
    const context = React.useContext(TabsContext)

    if (!context) {
      throw new Error("TabsContent must be used within Tabs")
    }

    const isActive = context.value === value

    if (!isActive) {
      return null
    }

    return (
      <div
        ref={ref}
        role="tabpanel"
        data-state={isActive ? "active" : "inactive"}
        className={cn(tabsContentVariants({ variant }), className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
TabsContent.displayName = "TabsContent"

export {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  tabsListVariants,
  tabsTriggerVariants,
  tabsContentVariants,
}
