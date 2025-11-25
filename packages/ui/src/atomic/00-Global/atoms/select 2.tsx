'use client';

import { cva, type VariantProps } from "class-variance-authority"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, Check } from "lucide-react"
import * as React from "react"

import { dropdownVariants, menuItemVariants, duration, easing } from "../../../lib/motion-variants"
import { cn } from "../../../lib/utils"

const selectVariants = cva(
  "group relative inline-flex w-full items-center justify-between gap-3 rounded-xl border bg-[var(--hive-background-secondary)] px-4 py-2.5 text-sm font-medium text-[var(--hive-text-primary)] shadow-sm transition-all duration-200 ease-out placeholder:text-[var(--hive-text-tertiary)] focus:outline-none disabled:cursor-not-allowed disabled:opacity-40 hover:shadow-md",
  {
    variants: {
      variant: {
        default: "border-[var(--hive-border-default)] hover:border-[var(--hive-interactive-hover)] hover:bg-[var(--hive-background-tertiary)] focus-visible:border-[var(--hive-brand-primary)] focus-visible:ring-2 focus-visible:ring-[var(--hive-interactive-focus)] focus-visible:ring-offset-0",
        subtle: "border-transparent bg-[var(--hive-background-primary)] hover:bg-[var(--hive-background-secondary)]",
        ghost: "border-transparent bg-transparent hover:bg-[var(--hive-background-secondary)]",
        destructive: "border-[var(--hive-status-error)] bg-[var(--hive-background-secondary)] hover:bg-[color-mix(in_srgb,var(--hive-status-error) 10%,transparent)]",
        success: "border-[var(--hive-status-success)] bg-[var(--hive-background-secondary)] hover:bg-[color-mix(in_srgb,var(--hive-status-success) 10%,transparent)]",
      },
      size: {
        sm: "h-9 px-3 text-sm rounded-lg",
        default: "h-11 px-4 text-sm",
        lg: "h-12 px-5 text-base rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const selectContentVariants = cva(
  "relative z-50 min-w-[12rem] max-h-96 overflow-auto rounded-xl border border-[var(--hive-border-default)] bg-[var(--hive-background-secondary)] p-1 shadow-[0_12px_48px_rgba(0,0,0,0.6)] backdrop-blur-xl",
  {
    variants: {
      position: {
        "item-aligned": "",
        popper: "mt-1",
      },
      appearance: {
        default: "text-[var(--hive-text-primary)]",
        glass: "bg-[color-mix(in_srgb,var(--hive-background-primary) 85%,transparent)] backdrop-blur-2xl",
      },
    },
    defaultVariants: {
      position: "popper",
      appearance: "glass",
    },
  }
)

const selectItemVariants = cva(
  "relative flex w-full cursor-pointer select-none items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium outline-none transition-all duration-150 data-[disabled]:pointer-events-none data-[disabled]:opacity-30",
  {
    variants: {
      variant: {
        default: "hover:bg-[var(--hive-interactive-hover)] active:bg-[var(--hive-interactive-active)] text-[var(--hive-text-secondary)] hover:text-[var(--hive-text-primary)]",
        destructive: "text-[var(--hive-status-error)] hover:bg-[color-mix(in_srgb,var(--hive-status-error) 10%,transparent)] hover:text-[var(--hive-status-error)]",
      },
      appearance: {
        default: "",
        subtle: "hover:bg-[var(--hive-background-tertiary)]",
      }
    },
    defaultVariants: {
      variant: "default",
      appearance: "default",
    },
  }
)

interface SelectContextType {
  value: string
  onValueChange: (value: string) => void
  open: boolean
  onOpenChange: (open: boolean) => void
}

const SelectContext = React.createContext<SelectContextType | null>(null)

export interface SelectProps extends VariantProps<typeof selectVariants> {
  value?: string
  onValueChange?: (value: string) => void
  defaultValue?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
  disabled?: boolean
  children: React.ReactNode
}

function Select({
  value,
  onValueChange,
  defaultValue,
  open,
  onOpenChange,
  disabled,
  children,
}: SelectProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue || "")
  const [internalOpen, setInternalOpen] = React.useState(false)

  const isControlledValue = value !== undefined
  const isControlledOpen = open !== undefined

  const currentValue = isControlledValue ? value : internalValue
  const currentOpen = isControlledOpen ? open : internalOpen

  const handleValueChange = React.useCallback((newValue: string) => {
    if (!isControlledValue) {
      setInternalValue(newValue)
    }
    onValueChange?.(newValue)

    // Close after selection
    if (!isControlledOpen) {
      setInternalOpen(false)
    }
    onOpenChange?.(false)
  }, [isControlledValue, isControlledOpen, onValueChange, onOpenChange])

  const handleOpenChange = React.useCallback((newOpen: boolean) => {
    if (disabled) return

    if (!isControlledOpen) {
      setInternalOpen(newOpen)
    }
    onOpenChange?.(newOpen)
  }, [disabled, isControlledOpen, onOpenChange])

  const contextValue = React.useMemo(() => ({
    value: currentValue,
    onValueChange: handleValueChange,
    open: currentOpen,
    onOpenChange: handleOpenChange,
  }), [currentValue, handleValueChange, currentOpen, handleOpenChange])

  return (
    <SelectContext.Provider value={contextValue}>
      {children}
    </SelectContext.Provider>
  )
}

export interface SelectTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof selectVariants> {}

const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ className, children, variant, size, ...props }, ref) => {
    const context = React.useContext(SelectContext)

    if (!context) {
      throw new Error("SelectTrigger must be used within Select")
    }

    const MotionButton: any = motion.button

    return (
      <MotionButton
        ref={ref}
        type="button"
        role="combobox"
        aria-expanded={context.open}
        aria-haspopup="listbox"
        className={cn(selectVariants({ variant, size }), className)}
        onClick={() => context.onOpenChange(!context.open)}
        whileHover={{ scale: 1.005 }}
        whileTap={{ scale: 0.995 }}
        transition={{ duration: duration.quick, ease: easing.smooth }}
        {...props}
      >
        <span className="flex-1 text-left truncate">{children}</span>
        <motion.div
          animate={{ rotate: context.open ? 180 : 0 }}
          transition={{ duration: duration.quick, ease: easing.smooth }}
        >
          <ChevronDown
            aria-hidden
            className="h-4 w-4 text-[var(--hive-text-tertiary)]"
          />
        </motion.div>
      </MotionButton>
    )
  }
)
SelectTrigger.displayName = "SelectTrigger"

export interface SelectValueProps extends React.HTMLAttributes<HTMLSpanElement> {
  placeholder?: string
}

const SelectValue = React.forwardRef<HTMLSpanElement, SelectValueProps>(
  ({ className, placeholder, ...props }, ref) => {
    const context = React.useContext(SelectContext)

    if (!context) {
      throw new Error("SelectValue must be used within Select")
    }

    return (
      <span
        ref={ref}
        className={cn("truncate", className)}
        {...props}
      >
        {context.value || placeholder}
      </span>
    )
  }
)
SelectValue.displayName = "SelectValue"

export interface SelectContentProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'>,
    VariantProps<typeof selectContentVariants> {
  children: React.ReactNode
}

const SelectContent = React.forwardRef<HTMLDivElement, SelectContentProps>(
  ({ className, children, position, appearance, ...props }, ref) => {
    const context = React.useContext(SelectContext)

    if (!context) {
      throw new Error("SelectContent must be used within Select")
    }

    const MotionDiv: any = motion.div

    return (
      <AnimatePresence>
        {context.open ? (
          <MotionDiv
            key="select-content"
            ref={ref}
            role="listbox"
            variants={dropdownVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className={cn(selectContentVariants({ position, appearance }), className)}
            {...props}
          >
            {children}
          </MotionDiv>
        ) : null}
      </AnimatePresence>
    )
  }
)
SelectContent.displayName = "SelectContent"

export interface SelectItemProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof selectItemVariants> {
  value: string
  disabled?: boolean
}

const SelectItem = React.forwardRef<HTMLDivElement, SelectItemProps>(
  ({ className, children, value, disabled, variant, appearance, ...props }, ref) => {
    const context = React.useContext(SelectContext)

    if (!context) {
      throw new Error("SelectItem must be used within Select")
    }

    const isSelected = context.value === value

    const MotionDiv: any = motion.div

    return (
      <MotionDiv
        ref={ref}
        role="option"
        aria-selected={isSelected}
        data-disabled={disabled}
        className={cn(
          selectItemVariants({ variant, appearance }),
          isSelected && "text-[var(--hive-brand-primary)]",
          className
        )}
        onClick={disabled ? undefined : () => context.onValueChange(value)}
        whileHover={disabled ? undefined : { x: 2 }}
        whileTap={disabled ? undefined : { scale: 0.98 }}
        transition={{ duration: duration.quick, ease: easing.smooth }}
        {...props}
      >
        {isSelected && (
          <motion.span
            className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: duration.quick, ease: easing.smooth }}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 15 15"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
            >
              <path
                d="M11.4669 3.72684C11.7558 3.91574 11.8369 4.30308 11.648 4.59198L7.39799 11.092C7.29783 11.2452 7.13556 11.3467 6.95402 11.3699C6.77247 11.3931 6.58989 11.3355 6.45446 11.2124L3.70446 8.71241C3.44905 8.48022 3.43023 8.08494 3.66242 7.82953C3.89461 7.57412 4.28989 7.55529 4.5453 7.78749L6.75292 9.79441L10.6018 3.90792C10.7907 3.61902 11.178 3.53795 11.4669 3.72684Z"
                fill="currentColor"
                fillRule="evenodd"
                clipRule="evenodd"
              />
            </svg>
          </motion.span>
        )}
        {children}
      </MotionDiv>
    )
  }
)
SelectItem.displayName = "SelectItem"

export type SelectLabelProps = React.HTMLAttributes<HTMLDivElement>

const SelectLabel = React.forwardRef<HTMLDivElement, SelectLabelProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("py-1.5 pl-8 pr-2 text-sm font-semibold text-[var(--hive-text-primary)]", className)}
      {...props}
    />
  )
)
SelectLabel.displayName = "SelectLabel"

export type SelectSeparatorProps = React.HTMLAttributes<HTMLDivElement>

const SelectSeparator = React.forwardRef<HTMLDivElement, SelectSeparatorProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("-mx-1 my-1 h-px bg-[var(--hive-border-default)]", className)}
      {...props}
    />
  )
)
SelectSeparator.displayName = "SelectSeparator"

export {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  selectVariants,
  selectContentVariants,
  selectItemVariants,
}
