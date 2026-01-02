"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Trophy } from "lucide-react";
import * as React from "react";

import { duration, easing } from "../../../lib/motion-variants";
import { cn } from "../../../lib/utils";
import { Button } from "../../00-Global/atoms/button";
import { Card } from "../../00-Global/atoms/card";

export interface ProfileCompletionStep {
  id: string;
  title: string;
  description?: string;
}

const DEFAULT_STEPS: ProfileCompletionStep[] = [
  { id: "avatar", title: "Add a profile photo" },
  { id: "bio", title: "Share a short bio" },
  { id: "academic", title: "Confirm academic details" },
  { id: "housing", title: "Add housing or residency" },
  { id: "interests", title: "Select your interests" },
  { id: "spaces", title: "Join 3+ spaces" },
];

export interface ProfileCompletionCardProps {
  completionPercentage: number;
  completedSteps?: string[];
  steps?: ProfileCompletionStep[];
  onStepClick?: (stepId: string) => void;
  className?: string;
}

export function ProfileCompletionCard({
  completionPercentage,
  completedSteps = [],
  steps = DEFAULT_STEPS,
  onStepClick,
  className,
}: ProfileCompletionCardProps) {
  const remaining = steps.filter((step) => !completedSteps.includes(step.id));
  const isComplete = remaining.length === 0;

  // Container animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  };

  // Step animation variants (stagger effect)
  const stepVariants = {
    hidden: { opacity: 0, x: -20, scale: 0.95 },
    visible: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 500,
        damping: 30,
      },
    },
  };

  return (
    <Card
      className={cn(
        "border-[color-mix(in_srgb,var(--hive-border-default,#2d3145) 58%,transparent)] bg-[color-mix(in_srgb,var(--hive-background-secondary,#10111c) 92%,transparent)] p-6",
        className,
      )}
    >
      {/* Header with pulsing sparkles icon */}
      <div className="flex items-center gap-3 text-[var(--hive-text-primary,#f7f7ff)]">
        <motion.div
          className="rounded-xl bg-[color-mix(in_srgb,var(--hive-brand-primary,#facc15) 12%,transparent)] p-2"
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Trophy className="h-4 w-4 text-[var(--hive-brand-primary,#facc15)]" aria-hidden />
        </motion.div>
        <div>
          <h3 className="text-lg font-medium">Boost your profile</h3>
          <motion.p
            className="text-xs uppercase tracking-caps text-[var(--hive-text-muted,#8d90a2)]"
            key={completionPercentage}
            initial={{ scale: 1 }}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: duration.quick }}
          >
            {Math.round(completionPercentage)}% complete
          </motion.p>
        </div>
      </div>

      {/* Animated progress bar */}
      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--hive-background-tertiary,#141522) 78%,transparent)]">
        <motion.div
          className="h-full rounded-full bg-[color-mix(in_srgb,var(--hive-brand-primary,#facc15) 92%,transparent)]"
          initial={{ width: 0 }}
          animate={{
            width: `${Math.min(100, Math.max(0, completionPercentage))}%`,
          }}
          transition={{
            type: "spring",
            stiffness: 180,
            damping: 28,
            mass: 1.0,
          }}
        />
      </div>

      {/* Staggered step list */}
      <motion.ul
        className="mt-4 space-y-2"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <AnimatePresence mode="popLayout">
          {remaining.slice(0, 4).map((step, index) => (
            <motion.li
              key={step.id}
              variants={stepVariants}
              layout
              exit={{
                opacity: 0,
                x: 20,
                scale: 0.95,
                transition: { duration: duration.quick },
              }}
            >
              <motion.div
                whileHover={{ scale: 1.02, x: 4 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: duration.instant }}
              >
                <Button
                  variant="ghost"
                  className="w-full justify-between rounded-2xl bg-[color-mix(in_srgb,var(--hive-background-tertiary,#141522) 65%,transparent)] px-4 py-3 text-left text-sm text-[var(--hive-text-secondary,#c0c2cc)] hover:bg-[color-mix(in_srgb,var(--hive-background-tertiary,#141522) 80%,transparent)]"
                  onClick={() => onStepClick?.(step.id)}
                >
                  <span>{step.title}</span>
                  <CheckCircle className="h-4 w-4 text-[color-mix(in_srgb,var(--hive-text-muted,#8d90a2) 90%,transparent)]" aria-hidden />
                </Button>
              </motion.div>
            </motion.li>
          ))}
        </AnimatePresence>
      </motion.ul>

      {/* Completion message with celebration */}
      <AnimatePresence>
        {isComplete && (
          <motion.div
            className="mt-4 rounded-2xl bg-[color-mix(in_srgb,var(--hive-brand-primary,#facc15) 12%,transparent)] p-3 text-center text-sm text-[var(--hive-brand-primary,#facc15)]"
            initial={{ opacity: 0, scale: 0.9, y: -10 }}
            animate={{
              opacity: 1,
              scale: [0.9, 1.05, 1],
              y: 0,
            }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            transition={{
              type: "spring",
              stiffness: 500,
              damping: 30,
            }}
          >
            Profile complete — you&apos;re ready to shine on campus!
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
