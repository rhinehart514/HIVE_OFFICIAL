'use client';

import { cva, type VariantProps } from "class-variance-authority"
import { motion, AnimatePresence, HTMLMotionProps } from "framer-motion"
import * as React from "react"

import { duration, easing } from "../../../lib/motion-variants"
import { cn } from "../../../lib/utils"

const switchVariants = cva(
  // Clean, neutral unchecked state - no gold bleeding
  "peer inline-flex shrink-0 cursor-pointer items-center rounded-full border border-[#2A2A2A] bg-[#1A1A1A] transition-[background,border,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0A] disabled:cursor-not-allowed disabled:opacity-40 data-[state=unchecked]:bg-[#1A1A1A] data-[state=unchecked]:border-[#2A2A2A]",
  {
    variants: {
      variant: {
        // Default: White when checked (monochrome discipline - gold only for CTAs/achievements)
        default:
          "data-[state=checked]:bg-white data-[state=checked]:border-white data-[state=checked]:shadow-[0_4px_12px_rgba(255,255,255,0.15)]",
        destructive:
          "data-[state=checked]:bg-[#FF3737] data-[state=checked]:border-[#FF3737] data-[state=checked]:shadow-[0_4px_12px_rgba(255,55,55,0.25)]",
        success:
          "data-[state=checked]:bg-[#00D46A] data-[state=checked]:border-[#00D46A] data-[state=checked]:shadow-[0_4px_12px_rgba(0,212,106,0.25)]",
      },
      size: {
        default: "h-6 w-11",
        sm: "h-5 w-9",
        lg: "h-7 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const switchThumbVariants = cva(
  // Neutral thumb - dark gray, subtle shadow
  "pointer-events-none block rounded-full bg-[#0A0A0A] shadow-[0_1px_3px_rgba(0,0,0,0.4)] ring-0 transition-transform duration-150 data-[state=checked]:bg-[#0A0A0A] data-[state=checked]:shadow-[0_2px_6px_rgba(0,0,0,0.4)]",
  {
    variants: {
      size: {
        default: "h-5 w-5 data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-[2px]",
        sm: "h-4 w-4 data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-[2px]",
        lg: "h-6 w-6 data-[state=checked]:translate-x-6 data-[state=unchecked]:translate-x-[2px]",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

type MotionButtonProps = Omit<HTMLMotionProps<'button'>, 'onDrag' | 'onDragStart' | 'onDragEnd'>

export interface SwitchProps
  extends Omit<MotionButtonProps, "onChange" | keyof VariantProps<typeof switchVariants>>,
    VariantProps<typeof switchVariants> {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  label?: string
  description?: string
  error?: string
}

const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({
    className,
    variant,
    size,
    checked,
    onCheckedChange,
    label,
    description,
    error,
    disabled,
    ...props
  }, ref) => {
    const [internalChecked, setInternalChecked] = React.useState(false)
    const [isFocused, setIsFocused] = React.useState(false)
    const switchId = React.useId()

    const isControlled = checked !== undefined
    const isChecked = isControlled ? checked : internalChecked

    const handleClick = React.useCallback(() => {
      if (disabled) return

      const newChecked = !isChecked
      if (!isControlled) {
        setInternalChecked(newChecked)
      }
      onCheckedChange?.(newChecked)
    }, [disabled, isChecked, isControlled, onCheckedChange])

    const handleKeyDown = React.useCallback((event: React.KeyboardEvent) => {
      if (event.key === " " || event.key === "Enter") {
        event.preventDefault()
        handleClick()
      }
    }, [handleClick])

    const handleFocus = () => setIsFocused(true)
    const handleBlur = () => setIsFocused(false)

    // Motion variants for haptic bounce effect
    const switchMotionVariants = {
      unchecked: { scale: 1 },
      checked: {
        scale: [1, 0.96, 1.02, 1],
        transition: {
          duration: duration.quick,
          ease: easing.smooth
        }
      }
    }

    // Thumb slide animation with spring physics
    const getThumbX = () => {
      if (size === 'sm') return isChecked ? 16 : 2
      if (size === 'lg') return isChecked ? 24 : 2
      return isChecked ? 20 : 2 // default
    }

    return (
      <div className="flex flex-col space-y-2">
        <div className="flex items-center space-x-3">
          {/** Cast motion.button to relax event typings for onDrag */}
          {(() => {
            const MotionButton: any = motion.button;
            return (
          <MotionButton
            ref={ref}
            id={switchId}
            role="switch"
            type="button"
            aria-checked={isChecked}
            aria-describedby={description || error ? `${switchId}-description` : undefined}
            data-state={isChecked ? "checked" : "unchecked"}
            disabled={disabled}
            className={cn(switchVariants({ variant, size }), className)}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
            variants={switchMotionVariants}
            initial="unchecked"
            animate={isChecked ? "checked" : "unchecked"}
            {...props}
            >
            <motion.span
              className={cn(
                "pointer-events-none block rounded-full bg-[#FAFAFA] shadow-[0_1px_3px_rgba(0,0,0,0.3)]",
                size === 'sm' && "h-4 w-4",
                size === 'default' && "h-5 w-5",
                size === 'lg' && "h-6 w-6"
              )}
              animate={{
                x: getThumbX(),
                boxShadow: isChecked
                  ? "0 2px 6px rgba(0,0,0,0.35)"
                  : "0 1px 3px rgba(0,0,0,0.3)",
              }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 30,
              }}
            />
          </MotionButton>
          )})()}

          {label && (
            <label
              htmlFor={switchId}
              className={cn(
                "text-sm font-medium leading-none cursor-pointer select-none",
                "text-[#FAFAFA]",
                disabled && "cursor-not-allowed opacity-70"
              )}
              onClick={!disabled ? handleClick : undefined}
            >
              {label}
            </label>
          )}
        </div>

        <AnimatePresence mode="wait">
          {(description || error) && (
            <motion.p
              key={error ? "error" : "description"}
              id={`${switchId}-description`}
              className={cn(
                "text-xs ml-14",
                error
                  ? "text-[#FF3737]"
                  : "text-[#A1A1A6]"
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
Switch.displayName = "Switch"

export { Switch, switchVariants, switchThumbVariants }
