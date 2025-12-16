"use client";

import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { motion, HTMLMotionProps, AnimatePresence } from "framer-motion"
import { Check, ArrowRight } from "lucide-react"
import * as React from "react"

import { buttonVariants as motionButtonVariants, buttonIconVariants, duration, easing } from "../../../lib/motion-variants"
import { cn } from "../../../lib/utils"

/** Button state for loading/success flows */
export type ButtonState = 'idle' | 'loading' | 'success'

/**
 * Button Variants - Dark-First Design System
 *
 * Design Philosophy (Apple/Vercel craft with HIVE warmth):
 * - Default: White button, black text (most common)
 * - Primary: Gold CTA (use sparingly - 1% rule)
 * - Secondary: Subtle background with border
 * - Ghost/Outline: Transparent with white text
 * - Destructive: Red for dangerous actions
 *
 * Focus: White rings (not gold)
 * Colors: Neutral grays + #FFD700 gold accent
 */
const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-1.5 rounded-lg text-sm font-medium transition-all duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-1 focus-visible:ring-offset-[#0A0A0A] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        // Default: White button, black text (Vercel-style)
        default:
          "bg-[#FAFAFA] text-[#0A0A0A] hover:bg-[#FAFAFA]/90",
        // Primary: Gold CTA - use ONLY for primary actions (1% rule)
        primary:
          "bg-[#FFD700] text-[#0A0A0A] hover:bg-[#E6C200]",
        // Secondary: Subtle background with border
        secondary:
          "bg-white/[0.06] text-[#FAFAFA] border border-[#2A2A2A] hover:bg-white/[0.10] hover:border-[#3A3A3A]",
        // Outline: Border only, transparent bg
        outline:
          "border border-[#2A2A2A] bg-transparent text-[#FAFAFA] hover:bg-white/[0.04] hover:border-[#3A3A3A]",
        // Ghost: Completely transparent
        ghost:
          "bg-transparent text-[#A1A1A6] hover:bg-white/[0.04] hover:text-[#FAFAFA]",
        // Destructive: Red for dangerous actions
        destructive:
          "bg-[#FF3737] text-white hover:bg-[#FF3737]/90",
        // Link: Text-only style
        link:
          "bg-transparent px-0 text-[#A1A1A6] underline-offset-4 hover:text-[#FAFAFA] hover:underline",
        // Brand: Same as primary (gold) - for backwards compat
        brand:
          "bg-[#FFD700] text-[#0A0A0A] hover:bg-[#E6C200]",
        // Success: Green
        success:
          "bg-[#00D46A] text-[#0A0A0A] hover:bg-[#00D46A]/90",
        // Warning: Gold (consistent with brand)
        warning:
          "bg-[#FFB800] text-[#0A0A0A] hover:bg-[#FFB800]/90",
      },
      size: {
        sm: "h-9 min-h-[36px] px-3 text-sm", // 36px minimum for compact areas
        md: "h-11 min-h-[44px] px-4 text-sm", // 44px - mobile touch target
        lg: "h-12 min-h-[48px] px-6 text-base",
        xl: "h-14 min-h-[56px] px-8 text-base",
        icon: "h-11 w-11 min-h-[44px] min-w-[44px] p-0", // 44px touch target
        default: "h-11 min-h-[44px] px-4 text-sm", // 44px - mobile touch target
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
    const iconProps = icon.props as { className?: string; strokeWidth?: number }
    return (
      <span aria-hidden className="inline-flex items-center justify-center">
        {React.cloneElement(icon, {
          className: cn(dimension, iconProps.className),
          strokeWidth: iconProps.strokeWidth ?? 1.6,
        } as React.SVGAttributes<SVGElement>)}
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
  /** @deprecated Use state='loading' instead */
  loading?: boolean
  /** Button state for loading/success flows (PremiumButton compat) */
  state?: ButtonState
  /** Show animated arrow icon on right (PremiumButton compat) */
  showArrow?: boolean
  /** Full width button */
  fullWidth?: boolean
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
      state = 'idle',
      showArrow = false,
      fullWidth = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const [isHovered, setIsHovered] = React.useState(false)

    // Merge loading prop with state for backwards compatibility
    const isLoading = loading || state === 'loading'
    const isSuccess = state === 'success'
    const isDisabled = disabled || isLoading

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
    // Spinner/icon color based on button variant
    const iconColor =
      resolvedVariant === "primary" ||
      resolvedVariant === "default" ||
      resolvedVariant === "brand" ||
      resolvedVariant === "success" ||
      resolvedVariant === "warning"
        ? "#0A0A0A"  // Dark on white/gold/green buttons
        : "#FAFAFA"  // Light on dark/ghost/outline buttons

    // Motion props (only apply if not asChild)
    const motionProps = !asChild ? {
      variants: motionButtonVariants,
      initial: "initial",
      whileHover: isDisabled ? undefined : "hover",
      whileTap: isDisabled ? undefined : "tap",
      animate: disabled ? "disabled" : "initial",
      onHoverStart: () => setIsHovered(true),
      onHoverEnd: () => setIsHovered(false),
    } : {}

    // When asChild is true, Slot expects a single child - pass through directly
    if (asChild) {
      return (
        <Slot
          className={cn(
            buttonVariants({
              variant: resolvedVariant,
              size: computedSize as any,
              loading: isLoading ? true : undefined,
            }),
            fullWidth && "w-full",
            className
          )}
          ref={ref}
          {...(props as React.HTMLAttributes<HTMLElement>)}
        >
          {children as React.ReactNode}
        </Slot>
      )
    }

    return (
      <Comp
        className={cn(
          buttonVariants({
            variant: resolvedVariant,
            size: computedSize as any,
            loading: isLoading ? true : undefined,
          }),
          fullWidth && "w-full",
          className
        )}
        ref={ref}
        disabled={isDisabled}
        aria-busy={isLoading}
        {...motionProps}
        {...props}
      >
        {/* Loading/Success state overlays */}
        <AnimatePresence mode="wait" initial={false}>
          {isLoading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: duration.quick, ease: easing.smooth }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <LoadingSpinner color={iconColor} />
            </motion.div>
          )}

          {isSuccess && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: duration.quick, ease: easing.smooth }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <Check className="h-4 w-4" style={{ color: iconColor }} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main content (hidden when loading/success) */}
        <span
          className={cn(
            "inline-flex items-center gap-1.5",
            (isLoading || isSuccess) && "opacity-0"
          )}
        >
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
          {showArrow && (
            <motion.span
              animate={{ x: isHovered ? 2 : 0 }}
              transition={{ duration: duration.quick, ease: easing.smooth }}
              className="inline-flex items-center justify-center"
            >
              <ArrowRight className="h-4 w-4" />
            </motion.span>
          )}
        </span>
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
