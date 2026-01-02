"use client";

import * as SliderPrimitive from "@radix-ui/react-slider";
import { cva, type VariantProps } from "class-variance-authority";
import { motion, AnimatePresence } from "framer-motion";
import * as React from "react";

import { duration, easing } from "../../../lib/motion-variants";
import { cn } from "../../../lib/utils";

const sliderVariants = cva(
  "relative flex w-full touch-none select-none items-center",
  {
    variants: {
      size: {
        sm: "h-4",
        default: "h-5",
        lg: "h-6",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
);

const sliderTrackVariants = cva(
  "relative h-1.5 w-full grow overflow-hidden rounded-full bg-[#1A1A1A] transition-colors duration-150",
  {
    variants: {
      variant: {
        default: "",
        subtle: "bg-[#141414]",
        destructive: "bg-[#FF3737]/10",
        success: "bg-[#00D46A]/10",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const sliderRangeVariants = cva(
  // Default: white for monochrome discipline
  "absolute h-full bg-white transition-all duration-150",
  {
    variants: {
      variant: {
        default: "",
        destructive: "bg-[#FF3737]",
        success: "bg-[#00D46A]",
        subtle: "bg-[#A1A1A6]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const sliderThumbVariants = cva(
  // Monochrome discipline: white focus, no gold borders
  "block h-4 w-4 rounded-full border border-[#2A2A2A] bg-[#FAFAFA] shadow-[0_1px_3px_rgba(0,0,0,0.3)] transition-[transform,box-shadow,background,border] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0A] hover:-translate-y-[1px] data-[state=active]:scale-105 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "data-[state=active]:shadow-[0_2px_8px_rgba(255,255,255,0.2)] data-[state=active]:border-white",
        destructive: "border-[#FF3737] data-[state=active]:shadow-[0_2px_8px_rgba(255,55,55,0.3)]",
        success: "border-[#00D46A] data-[state=active]:shadow-[0_2px_8px_rgba(0,212,106,0.3)]",
        subtle: "",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface SliderProps
  extends Omit<React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>, 'value'>,
    VariantProps<typeof sliderVariants> {
  variant?: "default" | "destructive" | "success" | "subtle";
  label?: React.ReactNode;
  description?: React.ReactNode;
  error?: React.ReactNode;
  showValue?: boolean;
  showMinMax?: boolean;
  showTooltip?: boolean;
  formatValue?: (value: number) => string;
  value?: number[];
  onValueChange?: (value: number[]) => void;
}

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  SliderProps
>(({
  className,
  size,
  variant = "default",
  label,
  description,
  error,
  showValue = true,
  showMinMax = false,
  showTooltip = true,
  formatValue = (v) => v.toString(),
  value,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  disabled,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);
  const [internalValue, setInternalValue] = React.useState<number[]>(value ?? [min]);
  const sliderId = React.useId();
  const sliderRef = React.useRef<HTMLDivElement>(null);

  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : internalValue;
  const safeValue = (currentValue && currentValue.length > 0 ? currentValue : [min]) as number[];
  const primaryValue = safeValue[0] ?? min;

  const handleValueChange = (newValue: number[]) => {
    if (!isControlled) {
      setInternalValue(newValue);
    }
    onValueChange?.(newValue);
  };

  // Calculate thumb position for tooltip
  const thumbPosition = ((primaryValue - min) / (max - min || 1)) * 100;

  return (
    <div className="flex flex-col space-y-3 w-full">
      {/* Label and Value */}
      {(label || showValue) && (
        <div className="flex items-center justify-between">
          {label && (
            <motion.label
              htmlFor={sliderId}
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
          )}
          {showValue && (
            <motion.span
              className={cn(
                "text-sm font-medium tabular-nums",
                error
                  ? "text-[#FF3737]"
                  : "text-[#A1A1A6]"
              )}
              animate={{ scale: isDragging ? 1.05 : 1 }}
              transition={{ duration: duration.quick, ease: easing.smooth }}
            >
              {formatValue(primaryValue)}
            </motion.span>
          )}
        </div>
      )}

      {/* Slider with Tooltip */}
      <div className="relative w-full">
        <SliderPrimitive.Root
          ref={ref}
          id={sliderId}
          className={cn(sliderVariants({ size }), className)}
          value={safeValue}
          onValueChange={handleValueChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onPointerDown={() => setIsDragging(true)}
          onPointerUp={() => setIsDragging(false)}
          onPointerLeave={() => setIsDragging(false)}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          aria-describedby={description || error ? `${sliderId}-description` : undefined}
          {...props}
        >
          <SliderPrimitive.Track className={sliderTrackVariants({ variant })}>
            <SliderPrimitive.Range className={sliderRangeVariants({ variant })} />
          </SliderPrimitive.Track>
          <SliderPrimitive.Thumb className={sliderThumbVariants({ variant })} />
        </SliderPrimitive.Root>

        {/* Value Tooltip */}
        <AnimatePresence>
          {showTooltip && (isFocused || isDragging) && (
            <motion.div
              className="absolute -top-10 pointer-events-none"
              style={{ left: `${thumbPosition}%` }}
              initial={{ opacity: 0, y: 4, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.9 }}
              transition={{
                type: "spring",
                stiffness: 500,
                damping: 30,
              }}
            >
              <div className="relative flex items-center justify-center -translate-x-1/2">
                <div className="px-2 py-1 rounded-md bg-[#0A0A0A] border border-[#2A2A2A] shadow-lg">
                  <span className="text-xs font-medium text-[#FAFAFA] tabular-nums">
                    {formatValue(primaryValue)}
                  </span>
                </div>
                {/* Arrow */}
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-[#0A0A0A] border-r border-b border-[#2A2A2A]" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Min/Max Labels */}
      {showMinMax && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-[#71717A]">
            {formatValue(min)}
          </span>
          <span className="text-xs text-[#71717A]">
            {formatValue(max)}
          </span>
        </div>
      )}

      {/* Description/Error */}
      <AnimatePresence mode="wait">
        {(description || error) && (
          <motion.p
            key={error ? "error" : "description"}
            id={`${sliderId}-description`}
            className={cn(
              "text-xs",
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
  );
});

Slider.displayName = "Slider";

export { Slider, sliderVariants, sliderTrackVariants, sliderRangeVariants, sliderThumbVariants };
