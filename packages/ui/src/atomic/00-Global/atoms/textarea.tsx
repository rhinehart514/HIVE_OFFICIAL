'use client';

import { cva, type VariantProps } from "class-variance-authority"
import { motion, AnimatePresence } from "framer-motion"
import * as React from "react"

import { duration, easing } from "../../../lib/motion-variants"
import { cn } from "../../../lib/utils"

const textareaVariants = cva(
  "flex min-h-[108px] w-full rounded-lg border border-[#2A2A2A] bg-[#141414] px-4 py-3 text-base md:text-sm text-[#FAFAFA] transition-[border,background,box-shadow] duration-150 ease-out placeholder:text-[#71717A] focus-visible:outline-none focus-visible:border-white/50 focus-visible:ring-2 focus-visible:ring-white/10 focus-visible:ring-offset-1 focus-visible:ring-offset-[#0A0A0A] disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "hover:border-[#3A3A3A]",
        subtle: "border-transparent bg-[#0A0A0A]",
        destructive: "border-[#FF3737]/50 focus-visible:border-[#FF3737] focus-visible:ring-[#FF3737]/20",
        success: "border-[#00D46A]/50 focus-visible:border-[#00D46A] focus-visible:ring-[#00D46A]/20",
        warning: "border-[#FFB800]/50 focus-visible:border-[#FFB800] focus-visible:ring-[#FFB800]/20",
        ghost: "border-transparent bg-transparent focus-visible:border-[#2A2A2A] focus-visible:ring-white/10",
        outline: "border-2 border-[#2A2A2A] bg-transparent",
      },
      size: {
        sm: "min-h-[72px] px-3 py-2 text-base md:text-sm", // 16px mobile (iOS zoom fix)
        default: "min-h-[96px] px-4 py-3 text-base md:text-sm",
        lg: "min-h-[128px] px-5 py-4 text-base",
        xl: "min-h-[160px] px-6 py-5 text-base",
      },
      resize: {
        none: "resize-none",
        vertical: "resize-y",
        horizontal: "resize-x",
        both: "resize",
      },
      rounded: {
        none: "rounded-none",
        sm: "rounded-sm",
        md: "rounded-md",
        lg: "rounded-lg",
        xl: "rounded-xl",
        full: "rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      resize: "vertical",
      rounded: "lg",
    },
  }
)

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof textareaVariants> {
  label?: React.ReactNode
  helperText?: React.ReactNode
  error?: React.ReactNode
  maxLength?: number
  showCount?: boolean
  autoResize?: boolean
  description?: React.ReactNode
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  footerContent?: React.ReactNode
  onClear?: () => void
  showClearButton?: boolean
  required?: boolean
  optional?: boolean
  wrapperClassName?: string
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      variant,
      size,
      resize,
      rounded,
      label,
      helperText,
      error,
      maxLength,
      showCount = false,
      autoResize = false,
      description,
      leftIcon,
      rightIcon,
      footerContent,
      onClear,
      showClearButton,
      required,
      optional,
      value,
      onChange,
      onFocus,
      onBlur,
      disabled,
      id,
      wrapperClassName,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = React.useState(false)
    const [hasError, setHasError] = React.useState(!!error)

    const textareaRef = React.useRef<HTMLTextAreaElement | null>(null)
    const combinedRef = React.useMemo(() => {
      return (node: HTMLTextAreaElement) => {
        if (typeof ref === "function") {
          ref(node)
        } else if (ref) {
          ;(ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = node
        }
        textareaRef.current = node
      }
    }, [ref])

    // Update error state when prop changes
    React.useEffect(() => {
      setHasError(!!error)
    }, [error])

    const textareaId = React.useId()
    const computedVariant = error ? "destructive" : variant
    const hasValue = value !== undefined && `${value}`.length > 0
    const currentLength = typeof value === "string" ? value.length : 0
    const isOverLimit = Boolean(maxLength && currentLength > maxLength)
    const isNearLimit = Boolean(maxLength && currentLength > maxLength * 0.9)

    React.useEffect(() => {
      if (autoResize && textareaRef.current) {
        const textarea = textareaRef.current
        textarea.style.height = "auto"
        textarea.style.height = `${textarea.scrollHeight}px`
      }
    }, [value, autoResize])

    const handleChange = React.useCallback(
      (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        if (autoResize) {
          const target = event.target
          target.style.height = "auto"
          target.style.height = `${target.scrollHeight}px`
        }
        onChange?.(event)
      },
      [onChange, autoResize]
    )

    const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(true)
      onFocus?.(e)
    }

    const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(false)
      onBlur?.(e)
    }

    const textareaClassName = cn(
      textareaVariants({
        variant: computedVariant,
        size,
        resize: autoResize ? "none" : resize,
        rounded,
      }),
      leftIcon && "pl-12",
      (rightIcon || (showClearButton && hasValue)) && "pr-12",
      disabled && "bg-[#1A1A1A] text-[#71717A]",
      className
    )

    const controlledTextareaProps =
      value !== undefined ? { value } : {}

    // Determine motion state
    const getMotionState = () => {
      if (hasError && !isFocused) return "error"
      if (isFocused) return "focus"
      return "initial"
    }

    // Motion variants for textarea
    const textareaMotionVariants = {
      initial: {
        scale: 1,
      },
      focus: {
        scale: 1.005,
        transition: {
          duration: duration.quick,
          ease: easing.smooth,
        },
      },
      error: {
        x: [0, -4, 4, -4, 4, 0],
        transition: {
          duration: duration.leisurely,
          ease: easing.snap,
        },
      },
    }

    const MotionTextarea: any = motion.textarea

    const textareaNode = (
      <MotionTextarea
        id={textareaId}
        className={textareaClassName}
        ref={combinedRef}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        maxLength={maxLength}
        disabled={disabled}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={
          helperText || error || footerContent ? `${textareaId}-helper` : undefined
        }
        variants={textareaMotionVariants}
        initial="initial"
        animate={getMotionState()}
        {...props}
        {...controlledTextareaProps}
      />
    )

    return (
      <div className={cn("flex flex-col gap-2", wrapperClassName)}>
        {label ? (
          <div className="flex items-center justify-between">
            <motion.label
              htmlFor={textareaId}
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
              {required ? (
                <span className="ml-1 text-[#FF3737]">*</span>
              ) : null}
              {optional ? (
                <span className="ml-1 font-normal text-[#A1A1A6]">
                  (optional)
                </span>
              ) : null}
            </motion.label>
            {showCount && maxLength ? (
              <motion.span
                className={cn(
                  "text-xs",
                  isOverLimit
                    ? "text-[#FF3737]"
                    : isNearLimit
                    ? "text-[#FFB800]"
                    : "text-[#A1A1A6]"
                )}
                aria-live="polite"
                animate={{
                  scale: isOverLimit ? [1, 1.1, 1] : 1,
                }}
                transition={{
                  duration: duration.quick,
                  ease: easing.smooth,
                }}
              >
                {currentLength}/{maxLength}
              </motion.span>
            ) : null}
          </div>
        ) : null}

        {description ? (
          <p className="text-xs text-[#A1A1A6]">{description}</p>
        ) : null}

        <div className="relative">
          {leftIcon ? (
            <motion.span
              className="pointer-events-none absolute left-4 top-4 text-[#A1A1A6]"
              aria-hidden
              animate={{
                color: isFocused
                  ? "#FAFAFA"
                  : "#A1A1A6",
              }}
              transition={{ duration: duration.quick, ease: easing.smooth }}
            >
              {leftIcon}
            </motion.span>
          ) : null}

          {textareaNode}

          {(rightIcon || (showClearButton && hasValue && !disabled)) ? (
            <span className="absolute right-3 top-3 flex items-start gap-1 text-[#A1A1A6]">
              <AnimatePresence mode="wait">
                {showClearButton && hasValue && !disabled && onClear ? (
                  <motion.button
                    key="clear-button"
                    type="button"
                    onClick={onClear}
                    className="rounded-full p-1 transition-colors hover:text-[#FAFAFA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0A]"
                    aria-label="Clear text"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ duration: duration.quick, ease: easing.smooth }}
                  >
                    <svg
                      width="16"
                      height="16"
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
                      ? "#FAFAFA"
                      : "#A1A1A6",
                  }}
                  transition={{ duration: duration.quick, ease: easing.smooth }}
                >
                  {rightIcon}
                </motion.span>
              ) : null}
            </span>
          ) : null}
        </div>

        <AnimatePresence mode="wait">
          {(helperText || error || footerContent) ? (
            <motion.div
              key={error ? "error" : "helper"}
              className="flex items-start justify-between gap-2 text-xs"
              id={`${textareaId}-helper`}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: duration.quick, ease: easing.smooth }}
            >
              <p
                className={cn(
                  "leading-snug",
                  error
                    ? "text-[#FF3737]"
                    : "text-[#A1A1A6]"
                )}
                role={error ? "alert" : undefined}
              >
                {error || helperText}
              </p>
              {footerContent ? <span>{footerContent}</span> : null}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea, textareaVariants }
