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
 * Input Variants - Dark-First Design System
 *
 * Design Philosophy (Apple/Vercel craft):
 * - Surface background (#141414), subtle border (#2A2A2A)
 * - Focus: White border/ring (not gold)
 * - Placeholder: Subtle text (#71717A)
 *
 * Colors: Neutral grays + status colors
 */
const inputVariants = cva(
  "flex w-full text-[#FAFAFA] transition-all duration-200 placeholder:text-[#71717A] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        // Default: Surface bg with subtle border (boxed)
        default: "rounded-lg border border-[#2A2A2A] bg-[#141414] px-3 hover:border-[#3A3A3A] focus:border-white/50 focus:ring-2 focus:ring-white/10 focus:ring-offset-1 focus:ring-offset-[#0A0A0A]",
        // Subtle: Same as default (for backwards compat)
        subtle: "rounded-lg border border-[#2A2A2A] bg-[#141414] px-3 hover:border-[#3A3A3A] focus:border-white/50 focus:ring-2 focus:ring-white/10 focus:ring-offset-1 focus:ring-offset-[#0A0A0A]",
        /**
         * Underline: Minimal bottom-border style for onboarding/hero sections
         * Uses monochrome aesthetic - NO gold on focus (gold is earned, not given)
         */
        underline: "border-0 border-b border-neutral-800 bg-transparent px-0 text-center text-lg placeholder:text-neutral-700 hover:border-neutral-700 focus:border-white/50 focus:ring-0",
        // Destructive/Error: Red border
        destructive: "rounded-lg border border-[#FF3737]/50 bg-[#141414] px-3 focus:border-[#FF3737] focus:ring-2 focus:ring-[#FF3737]/20 focus:ring-offset-1 focus:ring-offset-[#0A0A0A]",
        error: "rounded-lg border border-[#FF3737]/50 bg-[#141414] px-3 focus:border-[#FF3737] focus:ring-2 focus:ring-[#FF3737]/20 focus:ring-offset-1 focus:ring-offset-[#0A0A0A]",
        // Success: Green border
        success: "rounded-lg border border-[#00D46A]/50 bg-[#141414] px-3 focus:border-[#00D46A] focus:ring-2 focus:ring-[#00D46A]/20 focus:ring-offset-1 focus:ring-offset-[#0A0A0A]",
        // Brand: Gold border (use sparingly - achievements only)
        brand: "rounded-lg border border-[#FFD700]/30 bg-[#141414] px-3 focus:border-[#FFD700] focus:ring-2 focus:ring-white/20 focus:ring-offset-1 focus:ring-offset-[#0A0A0A]",
        // Ghost: No border until focus
        ghost: "rounded-lg border border-transparent bg-transparent px-3 focus:border-[#2A2A2A] focus:ring-2 focus:ring-white/10 focus:ring-offset-1 focus:ring-offset-[#0A0A0A]",
        // Warning: Warning border
        warning: "rounded-lg border border-[#FFB800]/30 bg-[#141414] px-3 focus:border-[#FFB800] focus:ring-2 focus:ring-[#FFB800]/20 focus:ring-offset-1 focus:ring-offset-[#0A0A0A]",
      },
      size: {
        sm: "h-9 min-h-[36px] text-base md:text-sm px-3", // 16px mobile (iOS zoom fix), 14px desktop
        default: "h-11 min-h-[44px] text-base md:text-sm", // 44px touch target, 16px mobile
        lg: "h-12 min-h-[48px] text-base md:text-sm px-4",
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
        ? "bg-[#141414]/50 text-[#52525B]"
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
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#818187]"
              aria-hidden
              animate={{
                color: isFocused
                  ? "#FAFAFA"
                  : "#818187",
              }}
              transition={{ duration: duration.quick, ease: easing.smooth }}
            >
              {mergedLeftIcon}
            </motion.span>
          ) : null}
          {inputNode}
          {hasRightContent ? (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 text-[#818187]">
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
                    <Loader2 className="h-4 w-4 animate-spin text-[#818187]" />
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
                    <Check className="h-4 w-4 text-[#00D46A]" />
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
                    <X className="h-4 w-4 text-[#FF3737]" />
                  </motion.div>
                )}
                {showClearButton && hasValue && !disabled && onClear ? (
                  <motion.button
                    key="clear-button"
                    type="button"
                    onClick={onClear}
                    className="rounded-full p-1 transition-colors hover:text-[#FAFAFA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0A]"
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
                  className="text-[#818187] hover:text-[#FAFAFA] transition-colors"
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
                <span className="text-sm text-[#818187] select-none">
                  {suffix}
                </span>
              )}

              {/* Right icon */}
              {rightIcon ? (
                <motion.span
                  aria-hidden
                  animate={{
                    color: isFocused
                      ? "#FAFAFA"
                      : "#818187",
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
              "text-sm font-medium text-[#FAFAFA]",
              disabled && "opacity-70"
            )}
            animate={{
              color: isFocused && !error
                ? "#FAFAFA"
                : "#A1A1A6",
            }}
            transition={{ duration: duration.quick, ease: easing.smooth }}
          >
            {label}
          </motion.label>
        ) : null}

        {description ? (
          <p className="text-xs text-[#818187]">
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
                  ? "text-[#FF3737]"
                  : success
                  ? "text-[#00D46A]"
                  : "text-[#818187]"
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
