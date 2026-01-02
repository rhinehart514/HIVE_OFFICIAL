'use client';

import { cva, type VariantProps } from "class-variance-authority"
import { motion, AnimatePresence } from "framer-motion"
import * as React from "react"

import { duration, easing } from "../../../lib/motion-variants"
import { cn } from "../../../lib/utils"

const checkboxVariants = cva(
  [
    // Base: Clean, neutral unchecked state
    "peer relative inline-flex h-5 w-5 shrink-0 appearance-none items-center justify-center rounded-full cursor-pointer",
    "border border-[#2A2A2A] bg-[#141414]",
    "shadow-[0_1px_2px_rgba(0,0,0,0.3)]",
    "transition-[background,border,box-shadow] duration-150 ease-out",
    // Hover: Subtle border brightening
    "hover:border-[#3A3A3A] hover:bg-[#1A1A1A]",
    // Focus: White ring (not gold) - Apple/Vercel style
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0A]",
    "disabled:cursor-not-allowed disabled:opacity-40",
    // Unchecked: Neutral gray
    "data-[state=unchecked]:bg-[#141414] data-[state=unchecked]:border-[#2A2A2A]",
    // Checked: White (monochrome discipline - gold only for CTAs/achievements)
    "data-[state=checked]:bg-white data-[state=checked]:border-white",
    "data-[state=checked]:shadow-[0_4px_12px_rgba(255,255,255,0.15)]",
    "data-[state=indeterminate]:bg-white data-[state=indeterminate]:border-white",
  ].join(" "),
  {
    variants: {
      variant: {
        default: "",
        destructive: [
          "data-[state=checked]:bg-[#FF3737]",
          "data-[state=checked]:border-[#FF3737]",
          "data-[state=checked]:shadow-[0_4px_12px_rgba(255,55,55,0.25)]",
          "data-[state=indeterminate]:bg-[#FF3737]",
          "data-[state=indeterminate]:border-[#FF3737]",
        ].join(" "),
        success: [
          "data-[state=checked]:bg-[#00D46A]",
          "data-[state=checked]:border-[#00D46A]",
          "data-[state=checked]:shadow-[0_4px_12px_rgba(0,212,106,0.25)]",
          "data-[state=indeterminate]:bg-[#00D46A]",
          "data-[state=indeterminate]:border-[#00D46A]",
        ].join(" "),
        warning: [
          "data-[state=checked]:bg-[#FFB800]",
          "data-[state=checked]:border-[#FFB800]",
          "data-[state=checked]:shadow-[0_4px_12px_rgba(255,184,0,0.25)]",
          "data-[state=indeterminate]:bg-[#FFB800]",
          "data-[state=indeterminate]:border-[#FFB800]",
        ].join(" "),
      },
      size: {
        default: "h-5 w-5",
        sm: "h-4 w-4",
        lg: "h-6 w-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof checkboxVariants> {
  onCheckedChange?: (checked: boolean) => void
  label?: string
  description?: string
  error?: string
  indeterminate?: boolean
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({
    className,
    variant,
    size,
    checked,
    indeterminate,
    onCheckedChange,
    onChange,
    onFocus,
    onBlur,
    label,
    description,
    error,
    disabled,
    ...props
  }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false)
    const checkboxId = React.useId()
    const internalRef = React.useRef<HTMLInputElement | null>(null)

    const composedRef = React.useCallback((node: HTMLInputElement | null) => {
      internalRef.current = node

      if (typeof ref === "function") {
        ref(node)
      } else if (ref) {
        ;(ref as React.MutableRefObject<HTMLInputElement | null>).current = node
      }
    }, [ref])

    React.useEffect(() => {
      if (internalRef.current) {
        internalRef.current.indeterminate = Boolean(indeterminate)
      }
    }, [indeterminate])

    const checkboxState = indeterminate
      ? "indeterminate"
      : checked
        ? "checked"
        : "unchecked"

    const handleChange = React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
      const isChecked = event.target.checked
      if (internalRef.current) {
        internalRef.current.indeterminate = false
      }
      onCheckedChange?.(isChecked)
      onChange?.(event)
    }, [onCheckedChange, onChange])

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true)
      onFocus?.(e)
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false)
      onBlur?.(e)
    }

    // Motion variants for the checkbox container
    const checkboxMotionVariants = {
      unchecked: { scale: 1 },
      checked: {
        scale: [1, 0.95, 1.05, 1],
        transition: {
          duration: duration.standard,
          ease: easing.smooth
        }
      },
      indeterminate: {
        scale: [1, 0.95, 1.05, 1],
        transition: {
          duration: duration.standard,
          ease: easing.smooth
        }
      }
    }

    // Check icon color based on variant
    const checkIconColor = variant === 'destructive' || variant === 'success'
      ? '#ffffff'
      : '#111111'

    return (
      <div className="flex flex-col space-y-2">
        <div className="flex items-center space-x-3">
          <motion.div
            className="relative inline-flex"
            initial="unchecked"
            animate={checkboxState}
            variants={checkboxMotionVariants}
          >
            <input
              ref={composedRef}
              id={checkboxId}
              type="checkbox"
              checked={checked}
              onChange={handleChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              disabled={disabled}
              data-state={checkboxState}
              aria-checked={indeterminate ? "mixed" : undefined}
              className={cn(checkboxVariants({ variant, size }), className)}
              {...props}
            />

            {/* Check icon (AnimatePresence for smooth entrance/exit) */}
            <AnimatePresence mode="wait">
              {checkboxState === "checked" && (
                <motion.svg
                  key="check"
                  className={cn(
                    "pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
                    size === "sm" && "h-2.5 w-2.5",
                    size === "default" && "h-3 w-3",
                    size === "lg" && "h-3.5 w-3.5"
                  )}
                  viewBox="0 0 16 16"
                  initial={{ scale: 0, opacity: 0, rotate: -45 }}
                  animate={{
                    scale: 1,
                    opacity: 1,
                    rotate: 0,
                    transition: {
                      type: "spring",
                      stiffness: 500,
                      damping: 30
                    }
                  }}
                  exit={{
                    scale: 0,
                    opacity: 0,
                    rotate: 45,
                    transition: {
                      duration: duration.quick,
                      ease: easing.snap
                    }
                  }}
                >
                  <path
                    d="M4.2 8.8 6.8 11.2 12 5.2"
                    stroke={checkIconColor}
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </motion.svg>
              )}

              {/* Indeterminate dash */}
              {checkboxState === "indeterminate" && (
                <motion.div
                  key="dash"
                  className={cn(
                    "pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full",
                    size === "sm" && "h-0.5 w-2",
                    size === "default" && "h-0.5 w-2.5",
                    size === "lg" && "h-0.5 w-3",
                    variant === 'warning' ? "bg-[#111111]" : "bg-[#0f0f0f]"
                  )}
                  initial={{ scaleX: 0, opacity: 0 }}
                  animate={{
                    scaleX: 1,
                    opacity: 1,
                    transition: {
                      type: "spring",
                      stiffness: 500,
                      damping: 30
                    }
                  }}
                  exit={{
                    scaleX: 0,
                    opacity: 0,
                    transition: {
                      duration: duration.quick,
                      ease: easing.snap
                    }
                  }}
                />
              )}
            </AnimatePresence>
          </motion.div>

          {label && (
            <motion.label
              htmlFor={checkboxId}
              className={cn(
                "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
                "text-[var(--hive-text-primary)] cursor-pointer select-none",
                disabled && "cursor-not-allowed opacity-70"
              )}
              animate={{
                color: isFocused && !error
                  ? "var(--hive-brand-primary)"
                  : "var(--hive-text-primary)",
              }}
              transition={{ duration: duration.quick, ease: easing.smooth }}
            >
              {label}
            </motion.label>
          )}
        </div>

        <AnimatePresence mode="wait">
          {(description || error) && (
            <motion.p
              key={error ? "error" : "description"}
              className={cn(
                "text-xs ml-7",
                error
                  ? "text-[var(--hive-status-error)]"
                  : "text-[var(--hive-text-secondary)]"
              )}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: duration.quick, ease: easing.smooth }}
              role={error ? "alert" : undefined}
            >
              {error || description}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    )
  }
)
Checkbox.displayName = "Checkbox"

export { Checkbox, checkboxVariants }
