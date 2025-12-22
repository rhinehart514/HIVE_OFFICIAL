import { motion } from "framer-motion";
import * as React from "react";

import { duration, easing } from "../../../lib/motion-variants";
import { cn } from "../../../lib/utils";
import { Button } from "../atoms/button";

export interface OnboardingFrameProps extends React.HTMLAttributes<HTMLDivElement> {
  step?: number;
  totalSteps?: number;
  title?: string;
  description?: string;
  mode?: "calm" | "warm" | "celebrate";
  onBack?: () => void;
  onContinue?: () => void;
  continueLabel?: string;
  continueDisabled?: boolean;
  isSubmitting?: boolean;
  children: React.ReactNode;
}

/**
 * OnboardingFrame
 *
 * Frame component for individual onboarding steps with progress tracking,
 * navigation buttons, and dynamic styling based on mode.
 *
 * Used by: onboarding wizard
 */
export const OnboardingFrame = React.forwardRef<HTMLDivElement, OnboardingFrameProps>(
  (
    {
      step = 0,
      totalSteps = 1,
      title,
      description,
      mode = "calm",
      onBack,
      onContinue,
      continueLabel = "Continue",
      continueDisabled = false,
      isSubmitting = false,
      children,
      className,
      ...props
    },
    ref
  ) => {
    // Progress bar width
    const progress = totalSteps > 0 ? ((step + 1) / totalSteps) * 100 : 0;

    // Title color based on mode
    const titleColor = React.useMemo(() => {
      switch (mode) {
        case "warm":
        case "celebrate":
          return "text-[var(--hive-brand-primary)]";
        case "calm":
        default:
          return "text-[var(--hive-text-primary)]";
      }
    }, [mode]);

    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col rounded-3xl border border-[var(--hive-border-default)] bg-[var(--hive-background-secondary)] p-6",
          className
        )}
        {...props}
      >
        {/* Progress Bar */}
        <div className="mb-6 overflow-hidden rounded-full bg-[var(--hive-background-tertiary)] h-2">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-[var(--hive-brand-primary)] to-[var(--hive-brand-secondary)]"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{
              type: "spring",
              stiffness: 180,
              damping: 28,
              mass: 1.0,
            }}
          />
        </div>

        {/* Title & Description */}
        {(title || description) && (
          <div className="mb-6 space-y-2">
            {title && (
              <motion.h2
                className={cn("text-2xl font-semibold", titleColor)}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: duration.quick, ease: easing.smooth }}
              >
                {title}
              </motion.h2>
            )}
            {description && (
              <motion.p
                className="text-sm text-[var(--hive-text-secondary)]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: duration.quick, delay: 0.05 }}
              >
                {description}
              </motion.p>
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1">{children}</div>

        {/* Navigation Buttons */}
        <div className="mt-8 flex items-center justify-between gap-4">
          {onBack ? (
            <Button variant="ghost" onClick={onBack} disabled={isSubmitting}>
              Back
            </Button>
          ) : (
            <div />
          )}

          {onContinue && (
            <motion.div
              whileHover={{ scale: continueDisabled || isSubmitting ? 1 : 1.02 }}
              whileTap={{ scale: continueDisabled || isSubmitting ? 1 : 0.98 }}
              transition={{ duration: duration.instant }}
            >
              <Button
                variant="primary"
                onClick={onContinue}
                disabled={continueDisabled || isSubmitting}
                className="px-8"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <motion.span
                      className="h-4 w-4 rounded-full border-2 border-current border-t-transparent"
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 0.8,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    />
                    {continueLabel}
                  </span>
                ) : (
                  continueLabel
                )}
              </Button>
            </motion.div>
          )}
        </div>
      </div>
    );
  }
);

OnboardingFrame.displayName = "OnboardingFrame";
