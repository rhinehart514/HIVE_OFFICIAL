import { cva, type VariantProps } from "class-variance-authority"
import { motion, HTMLMotionProps } from "framer-motion"
import * as React from "react"

import { cardVariants, duration, easing } from "../../../lib/motion-variants"
import { cn } from "../../../lib/utils"

/**
 * HiveCard Variants - Dark-First Design System
 *
 * MONOCHROME DISCIPLINE:
 * - Default state is grayscale
 * - Gold appears ONLY in `selected` variant (earned state)
 * - `brand` variant is deprecated (violates gold-as-reward principle)
 *
 * Glass morphism creates depth without heavy shadows.
 */
const hiveCardVariants = cva(
  "rounded-xl border transition-all duration-200",
  {
    variants: {
      variant: {
        // Default: Subtle surface
        default:
          "border-white/[0.06] bg-white/[0.02] text-[#FAFAFA]",
        /**
         * @deprecated Use `selected` for gold states - gold is earned, not given
         * Kept for backwards compatibility only
         */
        brand:
          "border-[#FFD700]/30 bg-gradient-to-br from-[#FFD700]/5 to-[#E6C200]/5 text-[#FAFAFA]",
        // Elevated: Slightly raised with shadow
        elevated:
          "border-white/[0.08] bg-white/[0.04] text-[#FAFAFA] shadow-lg",
        // Interactive: Hover states for clickable cards
        interactive:
          "border-white/[0.06] bg-white/[0.02] text-[#FAFAFA] hover:bg-white/[0.04] hover:border-white/[0.12] cursor-pointer",
        /**
         * Glass: Premium glass morphism surface
         * Use for containers, modals, dropdowns
         */
        glass:
          "border-white/[0.06] bg-white/[0.02] backdrop-blur-md text-[#FAFAFA]",
        /**
         * Selected: Earned gold state
         * Use ONLY when user has accomplished something:
         * - Selected an option (handle, interest, space)
         * - Completed a step
         * - Achieved something
         */
        selected:
          "border-gold-500/30 bg-white/[0.06] text-[#FAFAFA] shadow-[0_0_20px_rgba(255,215,0,0.1)]",
        /**
         * Hero: Featured card with gold hover glow
         * Use sparingly for hero/featured content
         */
        hero:
          "border-white/[0.06] bg-white/[0.02] text-[#FAFAFA] hover:border-gold-500/20 hover:shadow-[0_0_40px_rgba(255,215,0,0.06)]",
      },
      size: {
        sm: "p-4",
        default: "p-6",
        lg: "p-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

type MotionDivProps = Omit<HTMLMotionProps<'div'>, 'onDrag' | 'onDragStart' | 'onDragEnd'>

export interface HiveCardProps
  extends Omit<MotionDivProps, keyof VariantProps<typeof hiveCardVariants>>,
    VariantProps<typeof hiveCardVariants> {
  disableAnimation?: boolean
}

const HiveCard = React.forwardRef<HTMLDivElement, HiveCardProps>(
  ({ className, variant, size, disableAnimation = false, ...props }, ref) => {
    // Interactive variants get hover/tap motion
    const isInteractive = variant === "interactive" || variant === "hero"

    // Motion variants specific to card interaction
    const cardMotionVariants = {
      initial: {
        opacity: 1,
        y: 0,
        scale: 1,
      },
      hover: isInteractive
        ? {
            y: -8,
            scale: 1.015,
            transition: {
              duration: duration.quick,
              ease: easing.smooth,
            },
          }
        : {},
      tap: isInteractive
        ? {
            scale: 0.995,
            transition: {
              duration: duration.instant,
              ease: easing.snap,
            },
          }
        : {},
    }

    if (disableAnimation) {
      // Filter out motion-specific props before spreading to regular div
      const {
        initial, animate, exit, variants, whileHover, whileTap, whileFocus,
        whileInView, whileDrag, drag, dragConstraints, dragElastic,
        dragMomentum, dragTransition, dragSnapToOrigin, dragControls,
        layout, layoutId, style, onAnimationStart, onAnimationComplete,
        ...htmlProps
      } = props as any;

      return (
        <div
          ref={ref}
          className={cn(hiveCardVariants({ variant, size, className }))}
          {...htmlProps}
        />
      )
    }

    const MotionDiv: any = motion.div

    return (
      <MotionDiv
        ref={ref}
        className={cn(hiveCardVariants({ variant, size, className }))}
        variants={cardMotionVariants}
        initial="initial"
        whileHover={isInteractive ? "hover" : undefined}
        whileTap={isInteractive ? "tap" : undefined}
        {...props}
      />
    )
  }
)
HiveCard.displayName = "HiveCard"

const HiveCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5", className)}
    {...props}
  />
))
HiveCardHeader.displayName = "HiveCardHeader"

const HiveCardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, children, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight text-[#FAFAFA]",
      className
    )}
    {...props}
  >
    {children}
  </h3>
))
HiveCardTitle.displayName = "HiveCardTitle"

const HiveCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-[#A1A1A6]", className)}
    {...props}
  />
))
HiveCardDescription.displayName = "HiveCardDescription"

const HiveCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("pt-0", className)} {...props} />
))
HiveCardContent.displayName = "HiveCardContent"

const HiveCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center pt-6", className)}
    {...props}
  />
))
HiveCardFooter.displayName = "HiveCardFooter"

export {
  HiveCard,
  HiveCardHeader,
  HiveCardFooter,
  HiveCardTitle,
  HiveCardDescription,
  HiveCardContent,
  hiveCardVariants,
}
