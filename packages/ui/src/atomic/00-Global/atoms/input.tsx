"use client";

import { cva, type VariantProps } from "class-variance-authority"
import { motion, AnimatePresence, HTMLMotionProps } from "framer-motion"
import { Check, X, Loader2, Eye, EyeOff } from "lucide-react"
import * as React from "react"

import { duration, easing } from "../../../lib/motion-variants"
import { cn } from "../../../lib/utils"

/** Input status for loading/validation flows */
export type InputStatus = 'idle' | 'loading' | 'success' | 'error'

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
  "flex w-full rounded-lg border border-white/[0.08] bg-transparent px-3 text-sm text-white transition-colors duration-100 placeholder:text-white/40 focus:outline-none focus:border-gold-500/40 focus:ring-2 focus:ring-gold-500/40 focus:ring-offset-1 focus:ring-offset-black disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        // Default: Transparent with subtle border
        default: "hover:border-white/[0.16]",
        // Subtle: Same as default (for backwards compat)
        subtle: "hover:border-white/[0.16]",
        // Destructive/Error: Red border
        destructive: "border-status-error/50 focus:border-status-error focus:ring-status-error/30",
        error: "border-status-error/50 focus:border-status-error focus:ring-status-error/30",
        // Success: Green border
        success: "border-status-success/50 focus:border-status-success focus:ring-status-success/30",
        // Brand: Gold border (use sparingly)
        brand: "border-gold-500/30 focus:border-gold-500 focus:ring-gold-500/30",
        // Ghost: No border until focus
        ghost: "border-transparent bg-transparent focus:border-white/[0.08] focus:ring-white/10",
        // Warning: Gold border
        warning: "border-gold-500/30 focus:border-gold-500 focus:ring-gold-500/30",
      },
      size: {
        sm: "h-9 min-h-[36px] text-sm px-3", // 36px for compact areas
        default: "h-11 min-h-[44px] text-sm", // 44px - mobile touch target
        lg: "h-12 min-h-[48px] text-sm px-4",
        xl: "h-14 min-h-[56px] text-base px-5",
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
  /** @deprecated Use helperText instead */
  hint?: string
  description?: React.ReactNode
  error?: React.ReactNode
  /** Success message (green text) */
  success?: string
  leftIcon?: React.ReactNode
  /** @deprecated Use leftIcon instead */
  prefixIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  onClear?: () => void
  showClearButton?: boolean
  wrapperClassName?: string
  /** Input status for validation/loading flows (PremiumInput compat) */
  status?: InputStatus
  /** Suffix text (e.g., "@buffalo.edu") */
  suffix?: string
  /** Show password toggle for password inputs */
  showPasswordToggle?: boolean
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
      hint,
      description,
      error,
      success,
      leftIcon,
      prefixIcon,
      rightIcon,
      onClear,
      showClearButton,
      value,
      id,
      wrapperClassName,
      onFocus,
      onBlur,
      status = 'idle',
      suffix,
      showPasswordToggle,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = React.useState(false)
    const [hasError, setHasError] = React.useState(!!error)
    const [showPassword, setShowPassword] = React.useState(false)

    // Merge prefixIcon with leftIcon for backwards compat
    const mergedLeftIcon = leftIcon ?? prefixIcon
    // Merge hint with helperText for backwards compat
    const mergedHelperText = helperText ?? hint

    // Determine effective status based on error/success props
    const effectiveStatus = error ? 'error' : success ? 'success' : status

    // Password toggle logic
    const isPassword = type === 'password'
    const inputType = isPassword && showPassword ? 'text' : type

    // Update error state when prop changes
    React.useEffect(() => {
      setHasError(!!error)
    }, [error])

    const inputId = React.useId()
    const computedVariant = error ? "destructive" : success ? "success" : variant
    const shouldWrap =
      Boolean(label || mergedHelperText || description || error || success || mergedLeftIcon || rightIcon || showClearButton || suffix || showPasswordToggle || effectiveStatus !== 'idle')
    const hasValue =
      value !== undefined && `${value}`.length > 0

    // Calculate right padding based on what's on the right side
    const hasRightContent = rightIcon || suffix || (showClearButton && hasValue) ||
      (isPassword && showPasswordToggle) || effectiveStatus === 'loading' ||
      (effectiveStatus === 'success' && !suffix) || (effectiveStatus === 'error' && !suffix)

    const inputClassName = cn(
      inputVariants({ variant: computedVariant, size, width }),
      mergedLeftIcon && "pl-11",
      hasRightContent && "pr-11",
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
        type={inputType}
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

    const inputWithDecorations = hasRightContent || mergedLeftIcon
      ? (
        <div className="relative">
          {mergedLeftIcon ? (
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
              {mergedLeftIcon}
            </motion.span>
          ) : null}
          {inputNode}
          {hasRightContent ? (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 text-white/50">
              {/* Status indicators */}
              <AnimatePresence mode="wait">
                {effectiveStatus === 'loading' && (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: duration.quick, ease: easing.smooth }}
                  >
                    <Loader2 className="h-4 w-4 animate-spin text-white/50" />
                  </motion.div>
                )}
                {effectiveStatus === 'success' && !suffix && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: duration.quick, ease: easing.smooth }}
                  >
                    <Check className="h-4 w-4 text-status-success" />
                  </motion.div>
                )}
                {effectiveStatus === 'error' && !suffix && (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: duration.quick, ease: easing.smooth }}
                  >
                    <X className="h-4 w-4 text-status-error" />
                  </motion.div>
                )}
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
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                  </motion.button>
                ) : null}
              </AnimatePresence>

              {/* Password toggle */}
              {isPassword && showPasswordToggle && (
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-white/50 hover:text-white transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              )}

              {/* Suffix */}
              {suffix && (
                <span className="text-sm text-white/50 select-none">
                  {suffix}
                </span>
              )}

              {/* Right icon */}
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
          {(error || success || mergedHelperText) ? (
            <motion.p
              key={error ? "error" : success ? "success" : "helper"}
              id={`${inputId}-description`}
              className={cn(
                "text-xs",
                error
                  ? "text-status-error"
                  : success
                  ? "text-status-success"
                  : "text-white/50"
              )}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: duration.quick, ease: easing.smooth }}
              role={error ? "alert" : undefined}
            >
              {error || success || mergedHelperText}
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input, inputVariants }
