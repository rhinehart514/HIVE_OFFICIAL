"use client";

import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { motion, HTMLMotionProps } from "framer-motion"
import * as React from "react"

import { buttonVariants as motionButtonVariants, buttonIconVariants, duration, easing } from "../../../lib/motion-variants"
import { cn } from "../../../lib/utils"

/**
 * Button Variants - Ultra-Minimal YC/SF Aesthetic
 *
 * Design Philosophy (Vercel/OpenAI/Linear style):
 * - Default: White button, black text (most common)
 * - Primary: Gold CTA (use sparingly - 1% rule)
 * - Ghost/Outline: Transparent with white text
 * - Destructive: Red for dangerous actions
 *
 * Colors: Only #000000, #FFFFFF, #FFD700
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 rounded-lg text-sm font-medium transition-all duration-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/20 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        // Default: White button, black text (Vercel-style)
        default:
          "bg-white text-black hover:bg-white/90",
        // Primary: Gold CTA - use ONLY for primary actions (1% rule)
        primary:
          "bg-[#FFD700] text-black hover:bg-[#FFD700]/90",
        // Secondary: Subtle background
        secondary:
          "bg-white/[0.06] text-white border border-white/[0.08] hover:bg-white/[0.10]",
        // Outline: Border only, transparent bg
        outline:
          "border border-white/[0.08] bg-transparent text-white hover:bg-white/[0.04]",
        // Ghost: Completely transparent
        ghost:
          "bg-transparent text-white/70 hover:bg-white/[0.04] hover:text-white",
        // Destructive: Red for dangerous actions
        destructive:
          "bg-[#FF3737] text-white hover:bg-[#FF3737]/90",
        // Link: Text-only style
        link:
          "bg-transparent px-0 text-white/60 underline-offset-4 hover:text-white hover:underline",
        // Brand: Same as primary (gold) - for backwards compat
        brand:
          "bg-[#FFD700] text-black hover:bg-[#FFD700]/90",
        // Success: Green
        success:
          "bg-[#00D46A] text-black hover:bg-[#00D46A]/90",
        // Warning: Gold (consistent with brand)
        warning:
          "bg-[#FFD700] text-black hover:bg-[#FFD700]/90",
      },
      size: {
        sm: "h-8 px-3 text-sm",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-base",
        xl: "h-14 px-8 text-base",
        icon: "h-10 w-10 p-0",
        default: "h-10 px-4 text-sm",
      },
      loading: {
        true: "cursor-progress",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
)

const iconSizeMap = {
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
  lg: "h-5 w-5",
  xl: "h-5 w-5",
  icon: "h-4.5 w-4.5",
  default: "h-4 w-4",
} as const

const renderIcon = (
  icon: React.ReactNode,
  size: keyof typeof iconSizeMap
) => {
  if (!icon) return null

  const dimension = iconSizeMap[size]

  if (React.isValidElement(icon)) {
    return (
      <span aria-hidden className="inline-flex items-center justify-center">
        {React.cloneElement(icon, {
          className: cn(dimension, icon.props.className),
          strokeWidth: icon.props.strokeWidth ?? 1.6,
        })}
      </span>
    )
  }

  return (
    <span
      aria-hidden
      className={cn("inline-flex items-center justify-center", dimension)}
    >
      {icon}
    </span>
  )
}

const LoadingSpinner = ({ color }: { color: string }) => (
  <span
    className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent"
    aria-hidden
    style={{ color }}
  />
)

type MotionButtonProps = Omit<HTMLMotionProps<'button'>, 'onDrag' | 'onDragStart' | 'onDragEnd'>

export interface ButtonProps
  extends Omit<MotionButtonProps, keyof VariantProps<typeof buttonVariants>>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  leadingIcon?: React.ReactNode
  trailingIcon?: React.ReactNode
  /** @deprecated Use leadingIcon instead */
  leftIcon?: React.ReactNode
  /** @deprecated Use trailingIcon instead */
  rightIcon?: React.ReactNode
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size = "md",
      asChild = false,
      leadingIcon,
      trailingIcon,
      leftIcon,
      rightIcon,
      loading,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Dynamic component pattern: Slot and motion.button have incompatible types
    const Comp: any = asChild ? Slot : motion.button
    const resolvedVariant =
      variant === undefined
        ? undefined
        : variant === "default"
          ? "default"
          : variant
    const resolvedSizeProp = size ?? "md"
    const resolvedSize =
      resolvedSizeProp === "default"
        ? "default"
        : resolvedSizeProp
    const mergedLeadingIcon = leadingIcon ?? leftIcon
    const mergedTrailingIcon = trailingIcon ?? rightIcon
    const isIconOnly = !children && (mergedLeadingIcon || mergedTrailingIcon)
    const computedSize =
      (isIconOnly ? "icon" : (resolvedSize as keyof typeof iconSizeMap)) ?? "md"
    // Spinner color based on button variant (YC/SF minimal)
    const spinnerColor =
      resolvedVariant === "primary" ||
      resolvedVariant === "default" ||
      resolvedVariant === "brand" ||
      resolvedVariant === "success" ||
      resolvedVariant === "warning"
        ? "#000000"  // Black spinner on white/gold/green buttons
        : "#FFFFFF"  // White spinner on dark/ghost/outline buttons

    // Motion props (only apply if not asChild)
    const motionProps = !asChild ? {
      variants: motionButtonVariants,
      initial: "initial",
      whileHover: disabled || loading ? undefined : "hover",
      whileTap: disabled || loading ? undefined : "tap",
      animate: disabled ? "disabled" : "initial",
    } : {}

    return (
      <Comp
        className={cn(
          buttonVariants({
            variant: resolvedVariant,
            size: computedSize as any,
            loading: loading ? true : undefined,
          }),
          className
        )}
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading}
        {...motionProps}
        {...props}
      >
        {loading ? (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: duration.quick, ease: easing.smooth }}
          >
            <LoadingSpinner color={spinnerColor} />
          </motion.span>
        ) : (
          <>
            {mergedLeadingIcon && (
              <motion.span
                variants={buttonIconVariants}
                className="inline-flex items-center justify-center"
              >
                {renderIcon(mergedLeadingIcon, computedSize)}
              </motion.span>
            )}
            {children ? <span className="whitespace-nowrap">{children as React.ReactNode}</span> : null}
            {mergedTrailingIcon && (
              <motion.span
                variants={buttonIconVariants}
                className="inline-flex items-center justify-center"
              >
                {renderIcon(mergedTrailingIcon, computedSize)}
              </motion.span>
            )}
          </>
        )}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
