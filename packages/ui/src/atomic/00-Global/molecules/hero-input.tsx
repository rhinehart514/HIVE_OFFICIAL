/**
 * HeroInput - ChatGPT-style Central Input
 *
 * Design Philosophy:
 * - Central, prominent placement (conversation as OS)
 * - Large touch target (56px height)
 * - Subtle glass effect for depth
 * - White focus ring (not gold)
 * - Submit button with gold CTA option
 *
 * Usage:
 * - Primary action input (landing pages, space chat)
 * - Command entry point (ask anything)
 */
'use client';

import { cva, type VariantProps } from "class-variance-authority";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, ArrowRight, Command } from "lucide-react";
import * as React from "react";

import { cn } from "../../../lib/utils";

const heroInputVariants = cva(
  "relative flex w-full items-center rounded-xl border transition-all duration-200",
  {
    variants: {
      variant: {
        // Default: Surface bg with subtle border
        default: "bg-[#141414] border-[#2A2A2A] hover:border-[#3A3A3A] focus-within:border-white/50 focus-within:ring-2 focus-within:ring-white/10",
        // Glass: Transparent with blur
        glass: "bg-[#141414]/60 backdrop-blur-xl border-[#2A2A2A] hover:border-[#3A3A3A] focus-within:border-white/50 focus-within:ring-2 focus-within:ring-white/10",
        // Elevated: Slightly raised
        elevated: "bg-[#1A1A1A] border-[#2A2A2A] shadow-[0_4px_6px_rgba(0,0,0,0.3)] hover:border-[#3A3A3A] focus-within:border-white/50 focus-within:ring-2 focus-within:ring-white/10",
      },
      size: {
        default: "h-14 px-4", // 56px - large touch target
        lg: "h-16 px-5",      // 64px - even larger for landing
        xl: "h-20 px-6",      // 80px - hero sections
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface HeroInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size" | "onSubmit">,
    VariantProps<typeof heroInputVariants> {
  /** Called when submit button clicked or Enter pressed */
  onValueSubmit?: (value: string) => void;
  /** Show loading state */
  loading?: boolean;
  /** Submit button style */
  submitVariant?: "default" | "gold" | "icon";
  /** Submit button label */
  submitLabel?: string;
  /** Left icon/element */
  leftElement?: React.ReactNode;
  /** Wrapper className */
  wrapperClassName?: string;
}

const HeroInput = React.forwardRef<HTMLInputElement, HeroInputProps>(
  (
    {
      className,
      variant,
      size,
      onValueSubmit,
      loading = false,
      submitVariant = "default",
      submitLabel = "Send",
      leftElement,
      wrapperClassName,
      placeholder = "Ask anything...",
      disabled,
      onKeyDown,
      ...props
    },
    ref
  ) => {
    const [value, setValue] = React.useState("");

    const handleSubmit = () => {
      if (value.trim() && !loading && !disabled) {
        onValueSubmit?.(value.trim());
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
      onKeyDown?.(e);
    };

    const hasValue = value.trim().length > 0;

    const submitButtonClass = cn(
      "flex items-center justify-center rounded-lg transition-all duration-150 disabled:opacity-50",
      {
        // Default: White button
        "bg-[#FAFAFA] text-[#0A0A0A] hover:bg-[#FAFAFA]/90 h-10 px-4 gap-2": submitVariant === "default",
        // Gold: CTA style
        "bg-[#FFD700] text-[#0A0A0A] hover:bg-[#E6C200] h-10 px-4 gap-2": submitVariant === "gold",
        // Icon only
        "bg-[#FAFAFA] text-[#0A0A0A] hover:bg-[#FAFAFA]/90 h-10 w-10": submitVariant === "icon",
      }
    );

    return (
      <div className={cn(heroInputVariants({ variant, size }), wrapperClassName)}>
        {/* Left element */}
        {leftElement && (
          <div className="flex items-center pr-3">
            {leftElement}
          </div>
        )}

        {/* Input */}
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || loading}
          className={cn(
            "flex-1 bg-transparent text-[#FAFAFA] text-base placeholder:text-[#71717A] focus:outline-none disabled:cursor-not-allowed",
            className
          )}
          {...props}
        />

        {/* Submit button */}
        <AnimatePresence mode="wait">
          {(hasValue || loading) && (
            <motion.button
              type="button"
              onClick={handleSubmit}
              disabled={!hasValue || loading || disabled}
              className={submitButtonClass}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : submitVariant === "icon" ? (
                <Send className="h-4 w-4" />
              ) : (
                <>
                  <span className="text-sm font-medium">{submitLabel}</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    );
  }
);
HeroInput.displayName = "HeroInput";

export { HeroInput, heroInputVariants };
