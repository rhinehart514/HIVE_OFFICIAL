'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import type { UserType } from '../shared/types';

// Premium easing
const EASE_PREMIUM = [0.22, 1, 0.36, 1] as const;

interface UserTypeStepProps {
  onSelect: (type: UserType, isLeader: boolean) => void;
}

/**
 * Step 1: The Fork - Edge-to-Edge Aesthetic
 * Floating choice cards on #050505
 * Leader card gets subtle gold on hover
 */
export function UserTypeStep({ onSelect }: UserTypeStepProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={shouldReduceMotion ? {} : { duration: 0.4 }}
      className="flex flex-col"
      role="main"
      aria-labelledby="onboarding-title"
    >
      {/* The question - clean typography */}
      <motion.h1
        id="onboarding-title"
        initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={shouldReduceMotion ? {} : { delay: 0.1, duration: 0.5, ease: EASE_PREMIUM }}
        className="text-[clamp(1.75rem,4vw,2.25rem)] font-semibold tracking-[-0.02em] text-white mb-12 text-center"
      >
        What brings you here?
      </motion.h1>

      {/* Two paths - floating cards */}
      <motion.div
        initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={shouldReduceMotion ? {} : { delay: 0.2, duration: 0.5, ease: EASE_PREMIUM }}
        className="grid grid-cols-1 gap-4 mb-12"
        role="group"
        aria-label="Choose your path"
      >
        {/* I lead something - gold hint on hover */}
        <motion.button
          whileHover={shouldReduceMotion ? {} : { scale: 1.01 }}
          whileTap={shouldReduceMotion ? {} : { scale: 0.99 }}
          onClick={() => onSelect('student', true)}
          className="relative p-6 rounded-xl text-left bg-white/[0.03] border border-white/[0.08] transition-all duration-300 hover:bg-white/[0.05] hover:border-[#FFD700]/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 group"
          aria-describedby="leader-description"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h2 className="text-[17px] font-medium text-white mb-1.5 group-hover:text-[#FFD700] transition-colors duration-300">
                I run a club or org
              </h2>
              <p
                id="leader-description"
                className="text-[14px] text-white/40"
              >
                Claim your space. Set it up your way.
              </p>
            </div>
            <div
              className="w-10 h-10 rounded-full bg-white/[0.04] group-hover:bg-[#FFD700]/10 flex items-center justify-center transition-all duration-300"
              aria-hidden="true"
            >
              <ArrowRight className="w-4 h-4 text-white/40 group-hover:text-[#FFD700] transition-colors duration-300" />
            </div>
          </div>
        </motion.button>

        {/* I'm finding my people - pure grayscale */}
        <motion.button
          whileHover={shouldReduceMotion ? {} : { scale: 1.01 }}
          whileTap={shouldReduceMotion ? {} : { scale: 0.99 }}
          onClick={() => onSelect('student', false)}
          className="relative p-6 rounded-xl text-left bg-white/[0.03] border border-white/[0.08] transition-all duration-300 hover:bg-white/[0.05] hover:border-white/[0.16] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 group"
          aria-describedby="explorer-description"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h2 className="text-[17px] font-medium text-white mb-1.5">
                I&apos;m looking to join things
              </h2>
              <p
                id="explorer-description"
                className="text-[14px] text-white/40"
              >
                Browse spaces. Find your communities.
              </p>
            </div>
            <div
              className="w-10 h-10 rounded-full bg-white/[0.04] group-hover:bg-white/[0.08] flex items-center justify-center transition-all duration-300"
              aria-hidden="true"
            >
              <ArrowRight className="w-4 h-4 text-white/40 group-hover:text-white/70 transition-colors duration-300" />
            </div>
          </div>
        </motion.button>
      </motion.div>

      {/* Faculty/Alumni - minimal secondary options */}
      <motion.div
        initial={shouldReduceMotion ? {} : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={shouldReduceMotion ? {} : { delay: 0.35, duration: 0.4 }}
        className="flex flex-col items-center gap-3"
      >
        <span className="text-[13px] text-white/25">
          Not a student?
        </span>
        <div className="flex items-center gap-4" role="group" aria-label="Other user types">
          <button
            onClick={() => onSelect('faculty', false)}
            className="text-[13px] text-white/40 hover:text-white/70 transition-colors duration-200"
          >
            I&apos;m Faculty
          </button>
          <span className="text-white/15">·</span>
          <button
            onClick={() => onSelect('alumni', false)}
            className="text-[13px] text-white/40 hover:text-white/70 transition-colors duration-200"
          >
            I&apos;m an Alum
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
