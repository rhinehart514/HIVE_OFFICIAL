"use client";

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { Button } from "@hive/ui";
import { staggerContainer, staggerItem, transition } from "../shared/animations";
import { INTEREST_TAGS } from "../shared/constants";
import type { OnboardingData } from "../shared/types";

interface InterestsStepProps {
  data: OnboardingData;
  onUpdate: (updates: Partial<OnboardingData>) => void;
  onNext: () => void;
  error: string | null;
  setError: (error: string | null) => void;
  isSubmitting: boolean;
}

export function InterestsStep({
  data,
  onUpdate,
  onNext,
  error,
  _setError,
  isSubmitting,
}: InterestsStepProps) {
  const { interests, termsAccepted } = data;

  const toggleInterest = (interest: string) => {
    const newInterests = interests.includes(interest)
      ? interests.filter((i) => i !== interest)
      : interests.length < 5
      ? [...interests, interest]
      : interests;
    onUpdate({ interests: newInterests });
  };

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-5"
    >
      <motion.div variants={staggerItem} transition={transition}>
        <p className="text-sm text-neutral-400 text-center mb-4">
          Pick up to 5 interests
        </p>
        {/* Interest tags */}
        <div className="flex flex-wrap gap-2">
          {INTEREST_TAGS.map((interest, index) => (
            <motion.button
              key={interest}
              type="button"
              onClick={() => toggleInterest(interest)}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.03 }}
              className={`rounded-full px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                interests.includes(interest)
                  ? "bg-[#FFD700] text-black shadow-lg"
                  : "bg-black border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-600"
              }`}
            >
              {interest}
            </motion.button>
          ))}
        </div>
      </motion.div>

      <motion.div variants={staggerItem} transition={transition}>
        <p className="text-sm text-neutral-500 text-center">
          {interests.length}/5 selected
        </p>
      </motion.div>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="text-sm font-medium text-red-400"
        >
          {error}
        </motion.p>
      )}

      <motion.div variants={staggerItem} transition={transition}>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => onUpdate({ termsAccepted: e.target.checked })}
            className="mt-1 w-4 h-4 rounded border-neutral-800 bg-transparent accent-[#FFD700]"
          />
          <span className="text-xs text-neutral-500 leading-relaxed">
            I agree to the{" "}
            <a
              href="/legal/terms"
              className="underline hover:text-neutral-400"
            >
              Terms
            </a>{" "}
            and{" "}
            <a
              href="/legal/privacy"
              className="underline hover:text-neutral-400"
            >
              Privacy Policy
            </a>
          </span>
        </label>
      </motion.div>

      <motion.div variants={staggerItem} transition={transition}>
        <Button
          type="button"
          onClick={onNext}
          disabled={isSubmitting || !termsAccepted}
          className="w-full h-12 bg-[#FFD700] text-black hover:brightness-110 font-semibold text-sm disabled:opacity-40 transition-all"
          style={{ boxShadow: "0 0 30px rgba(255, 215, 0, 0.15)" }}
        >
          {isSubmitting ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            "Continue"
          )}
        </Button>
      </motion.div>
    </motion.div>
  );
}
