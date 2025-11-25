"use client";

import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import Image from "next/image";
import { ProgressBar } from "./progress-bar";
import type { OnboardingStep } from "../shared/types";

interface OnboardingHeaderProps {
  step: OnboardingStep;
  stepNumber: number;
  totalSteps: number;
  onBack: () => void;
}

export function OnboardingHeader({
  step,
  stepNumber,
  totalSteps,
  onBack,
}: OnboardingHeaderProps) {
  const showBackButton = step !== "userType";
  const showProgress = step !== "userType" && step !== "alumniWaitlist";

  return (
    <header className="relative z-10 sticky top-0 backdrop-blur-xl bg-black/90 border-b border-neutral-800/30">
      <div className="max-w-xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between mb-3">
          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            {showBackButton && (
              <button
                onClick={onBack}
                className="p-2 -ml-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}
            <Image
              src="/assets/hive-logo-gold.svg"
              alt="HIVE"
              width={36}
              height={36}
              className="drop-shadow-sm"
            />
            <span className="text-xl font-bold tracking-tight text-white">
              HIVE
            </span>
          </motion.div>
        </div>
        {showProgress && <ProgressBar current={stepNumber} total={totalSteps} />}
      </div>
    </header>
  );
}
