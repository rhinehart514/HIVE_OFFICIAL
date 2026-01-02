'use client';

import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"

import { cn } from "../../../lib/utils"

const progressVariants = cva(
  "relative h-4 w-full overflow-hidden rounded-full bg-[#1A1A1A]",
  {
    variants: {
      size: {
        xs: "h-1.5",
        sm: "h-2",
        default: "h-4",
        lg: "h-6",
      },
      variant: {
        default: "bg-[#1A1A1A]",
        secondary: "bg-[#141414]",
        success: "bg-[#00D46A]/10",
        warning: "bg-[#FFB800]/10",
        error: "bg-[#FF3737]/10",
      },
    },
    defaultVariants: {
      size: "default",
      variant: "default",
    },
  }
)

const progressIndicatorVariants = cva(
  // Default: white for monochrome discipline
  "h-full w-full flex-1 bg-white transition-all duration-300 ease-out",
  {
    variants: {
      variant: {
        default: "bg-white",
        secondary: "bg-[#A1A1A6]",
        success: "bg-[#00D46A]",
        warning: "bg-[#FFB800]",
        error: "bg-[#FF3737]",
      },
      animation: {
        none: "",
        pulse: "animate-pulse",
        indeterminate: "",
      },
    },
    defaultVariants: {
      variant: "default",
      animation: "none",
    },
  }
)

export interface ProgressProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof progressVariants> {
  value?: number
  max?: number
  indeterminate?: boolean
  showValue?: boolean
  formatValue?: (value: number, max: number) => string
  indicatorVariant?: VariantProps<typeof progressIndicatorVariants>["variant"]
  animation?: VariantProps<typeof progressIndicatorVariants>["animation"]
  label?: string
  showLabel?: boolean
  showPercentage?: boolean
  indicatorClassName?: string
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({
    className,
    value = 0,
    max = 100,
    size,
    variant,
    indeterminate = false,
    showValue = false,
    formatValue,
    indicatorVariant,
    animation,
    label,
    showLabel = false,
    showPercentage = false,
    indicatorClassName,
    ...props
  }, ref) => {
    const percentage = indeterminate ? 100 : Math.min(Math.max((value / max) * 100, 0), 100)

    const defaultFormatValue = React.useCallback(
      (val: number, maxVal: number) => `${Math.round((val / maxVal) * 100)}%`,
      []
    )

    const displayValue = formatValue
      ? formatValue(value, max)
      : defaultFormatValue(value, max)

    return (
      <div className="w-full space-y-2">
        {(showValue || showLabel || showPercentage) && (
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-[#FAFAFA]">
              {label ?? "Progress"}
            </span>
            {showValue || showPercentage ? (
              <span className="text-sm text-[#A1A1A6]">
                {indeterminate ? "Loading..." : displayValue}
              </span>
            ) : null}
          </div>
        )}
        <div
          ref={ref}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={max}
          aria-valuenow={indeterminate ? undefined : value}
          aria-label={indeterminate ? "Loading" : `Progress: ${displayValue}`}
          className={cn(progressVariants({ size, variant }), className)}
          {...props}
        >
          <div
            className={cn(
              progressIndicatorVariants({
                variant: indicatorVariant || "default",
                animation: indeterminate ? "indeterminate" : animation,
              }),
              indicatorClassName
            )}
            style={{
              transform: indeterminate
                ? "translateX(-100%)"
                : `translateX(-${100 - percentage}%)`,
              transition: indeterminate
                ? "transform 1s ease-in-out infinite alternate"
                : "transform 300ms ease-in-out",
            }}
          />
        </div>
      </div>
    )
  }
)
Progress.displayName = "Progress"

// Circular Progress variant
export interface CircularProgressProps {
  value?: number
  max?: number
  size?: number
  strokeWidth?: number
  showPercentage?: boolean
  indeterminate?: boolean
  indicatorVariant?: "default" | "success" | "warning" | "error"
  className?: string
}

const CircularProgress = React.forwardRef<SVGSVGElement, CircularProgressProps & React.SVGProps<SVGSVGElement>>(
  ({
    value = 0,
    max = 100,
    size = 40,
    strokeWidth = 4,
    indeterminate = false,
    showPercentage = false,
    indicatorVariant = "default",
    className,
    ...props
  }, ref) => {
    const percentage = indeterminate ? 25 : Math.min(Math.max((value / max) * 100, 0), 100)
    const radius = (size - strokeWidth) / 2
    const circumference = radius * 2 * Math.PI
    const strokeDashoffset = circumference - (percentage / 100) * circumference

    return (
      <div className="relative inline-flex items-center justify-center">
        <svg
          ref={ref}
          width={size}
          height={size}
          className={cn("transform -rotate-90", className)}
          {...props}
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            stroke="#1A1A1A"
            fill="transparent"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            stroke={
              indicatorVariant === "success" ? "#00D46A" :
              indicatorVariant === "warning" ? "#FFB800" :
              indicatorVariant === "error" ? "#FF3737" :
              "#FFFFFF"
            }
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={cn(
              "transition-all duration-300 ease-in-out",
              indeterminate && "animate-spin"
            )}
            style={{
              animationDuration: indeterminate ? "2s" : undefined
            }}
          />
        </svg>
        {showPercentage && !indeterminate && (
          <span className="absolute text-xs font-medium text-[#FAFAFA]">
            {Math.round(percentage)}%
          </span>
        )}
      </div>
    )
  }
)
CircularProgress.displayName = "CircularProgress"

export {
  Progress,
  CircularProgress,
  progressVariants,
  progressIndicatorVariants,
}
