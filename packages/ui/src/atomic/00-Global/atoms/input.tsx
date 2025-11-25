"use client";

import { cva, type VariantProps } from "class-variance-authority"
import { motion, AnimatePresence, HTMLMotionProps } from "framer-motion"
import * as React from "react"

import { duration, easing } from "../../../lib/motion-variants"
import { cn } from "../../../lib/utils"

/**
 * Input Variants - Ultra-Minimal YC/SF Aesthetic (Linear-style)
 *
 * Design Philosophy:
 * - Transparent background, subtle white/8 border
 * - Focus: white/20 border (no gold focus rings)
 * - Placeholder: white/40 text
 *
 * Colors: Only #000000, #FFFFFF, #FFD700 (gold only for errors/warnings)
 */
const inputVariants = cva(
  "flex w-full rounded-lg border border-white/[0.08] bg-transparent px-3 text-sm text-white transition-colors duration-100 placeholder:text-white/40 focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/20 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        // Default: Transparent with subtle border
        default: "hover:border-white/[0.16]",
        // Subtle: Same as default (for backwards compat)
        subtle: "hover:border-white/[0.16]",
        // Destructive/Error: Red border
        destructive: "border-[#FF3737]/50 focus:border-[#FF3737] focus:ring-[#FF3737]/30",
        error: "border-[#FF3737]/50 focus:border-[#FF3737] focus:ring-[#FF3737]/30",
        // Success: Green border
        success: "border-[#00D46A]/50 focus:border-[#00D46A] focus:ring-[#00D46A]/30",
        // Brand: Gold border (use sparingly)
        brand: "border-[#FFD700]/30 focus:border-[#FFD700] focus:ring-[#FFD700]/30",
        // Ghost: No border until focus
        ghost: "border-transparent bg-transparent focus:border-white/[0.08] focus:ring-white/10",
        // Warning: Gold border
        warning: "border-[#FFD700]/30 focus:border-[#FFD700] focus:ring-[#FFD700]/30",
      },
      size: {
        sm: "h-8 text-sm px-3",
        default: "h-10 text-sm",
        lg: "h-12 text-sm px-4",
        xl: "h-14 text-base px-5",
      },
      width: {
        full: "w-full",
        auto: "w-auto",
        fit: "w-fit",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      width: "full",
    },
  }
)

type MotionInputProps = Omit<HTMLMotionProps<'input'>, 'onDrag' | 'onDragStart' | 'onDragEnd'>

export interface InputProps
  extends Omit<MotionInputProps, "size" | "width" | keyof VariantProps<typeof inputVariants>>,
    VariantProps<typeof inputVariants> {
  label?: React.ReactNode
  helperText?: React.ReactNode
  description?: React.ReactNode
  error?: React.ReactNode
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  onClear?: () => void
  showClearButton?: boolean
  wrapperClassName?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      variant,
      size,
      width,
      type,
      disabled,
      label,
      helperText,
      description,
      error,
      leftIcon,
      rightIcon,
      onClear,
      showClearButton,
      value,
      id,
      wrapperClassName,
      onFocus,
      onBlur,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = React.useState(false)
    const [hasError, setHasError] = React.useState(!!error)

    // Update error state when prop changes
    React.useEffect(() => {
      setHasError(!!error)
    }, [error])

    const inputId = React.useId()
    const computedVariant = error ? "destructive" : variant
    const shouldWrap =
      Boolean(label || helperText || description || error || leftIcon || rightIcon || showClearButton)
    const hasValue =
      value !== undefined && `${value}`.length > 0

    const inputClassName = cn(
      inputVariants({ variant: computedVariant, size, width }),
      leftIcon && "pl-11",
      (rightIcon || (showClearButton && hasValue)) && "pr-11",
      disabled
        ? "bg-white/[0.02] text-white/30"
        : "",
      className
    )

    const controlledProps =
      value !== undefined ? { value } : {}

    // Determine motion state
    const getMotionState = () => {
      if (hasError && !isFocused) return "error"
      if (isFocused) return "focus"
      return "initial"
    }

    // Motion variants for input - simplified
    const inputMotionVariants = {
      initial: {
        scale: 1,
      },
      focus: {
        scale: 1,
      },
      error: {
        scale: 1,
      },
    }

    // Handle focus with motion state
    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true)
      onFocus?.(e)
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false)
      onBlur?.(e)
    }

    const MotionInput: any = motion.input

    const inputNode = (
      <MotionInput
        id={inputId}
        type={type}
        className={inputClassName}
        disabled={disabled}
        aria-invalid={
          Boolean(error) ||
          computedVariant === "destructive" ||
          computedVariant === "error" ||
          undefined
        }
        aria-disabled={disabled || undefined}
        aria-describedby={
          helperText || error ? `${inputId}-description` : undefined
        }
        ref={ref}
        onFocus={handleFocus}
        onBlur={handleBlur}
        variants={inputMotionVariants}
        initial="initial"
        animate={getMotionState()}
        {...props}
        {...controlledProps}
      />
    )

    const inputWithDecorations = leftIcon || rightIcon || (showClearButton && hasValue && !disabled)
      ? (
        <div className="relative">
          {leftIcon ? (
            <motion.span
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/50"
              aria-hidden
              animate={{
                color: isFocused
                  ? "rgba(255, 255, 255, 1)"
                  : "rgba(255, 255, 255, 0.5)",
              }}
              transition={{ duration: duration.quick, ease: easing.smooth }}
            >
              {leftIcon}
            </motion.span>
          ) : null}
          {inputNode}
          {(rightIcon || (showClearButton && hasValue && !disabled)) ? (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-white/50">
              <AnimatePresence mode="wait">
                {showClearButton && hasValue && !disabled && onClear ? (
                  <motion.button
                    key="clear-button"
                    type="button"
                    onClick={onClear}
                    className="rounded-full p-1 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                    aria-label="Clear input"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ duration: duration.quick, ease: easing.smooth }}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </motion.button>
                ) : null}
              </AnimatePresence>
              {rightIcon ? (
                <motion.span
                  aria-hidden
                  animate={{
                    color: isFocused
                      ? "rgba(255, 255, 255, 1)"
                      : "rgba(255, 255, 255, 0.5)",
                  }}
                  transition={{ duration: duration.quick, ease: easing.smooth }}
                >
                  {rightIcon}
                </motion.span>
              ) : null}
            </span>
          ) : null}
        </div>
      )
      : inputNode

    if (!shouldWrap) {
      return inputWithDecorations
    }

    return (
      <div className={cn("flex flex-col gap-1.5", wrapperClassName)}>
        {label ? (
          <motion.label
            htmlFor={inputId}
            className={cn(
              "text-sm font-medium text-white",
              disabled && "opacity-70"
            )}
            animate={{
              color: isFocused && !error
                ? "rgba(255, 255, 255, 1)"
                : "rgba(255, 255, 255, 0.70)",
            }}
            transition={{ duration: duration.quick, ease: easing.smooth }}
          >
            {label}
          </motion.label>
        ) : null}

        {description ? (
          <p className="text-xs text-white/50">
            {description}
          </p>
        ) : null}

        {inputWithDecorations}

        <AnimatePresence mode="wait">
          {(helperText || error) ? (
            <motion.p
              key={error ? "error" : "helper"}
              id={`${inputId}-description`}
              className={cn(
                "text-xs",
                error
                  ? "text-[#FF3737]"
                  : "text-white/50"
              )}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: duration.quick, ease: easing.smooth }}
              role={error ? "alert" : undefined}
            >
              {error || helperText}
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input, inputVariants }
