'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Users, Sparkles } from 'lucide-react';
import {
  containerVariants,
  itemVariants,
  primaryCardVariants,
  cardHoverVariants,
  arrowVariants,
  GLOW_GOLD_SUBTLE,
} from '../shared/motion';
import type { UserType } from '../shared/types';

interface UserTypeStepProps {
  onSelect: (type: UserType, isLeader: boolean) => void;
}

/**
 * Step 1: The Fork
 * "What brings you here?" - Conversational, not interrogative
 * Shows outcome previews to make choice feel like discovery
 */
export function UserTypeStep({ onSelect }: UserTypeStepProps) {
  const shouldReduceMotion = useReducedMotion();

  // Apply reduced motion to variants
  const safeContainerVariants = shouldReduceMotion
    ? { initial: { opacity: 1 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : containerVariants;

  const safeItemVariants = shouldReduceMotion
    ? { initial: { opacity: 1 }, animate: { opacity: 1 } }
    : itemVariants;

  return (
    <motion.div
      variants={safeContainerVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="min-h-screen flex flex-col justify-center px-6 py-12"
      role="main"
      aria-labelledby="onboarding-title"
    >
      <div className="w-full max-w-3xl mx-auto">
        {/* The question - conversational, warm */}
        <motion.h1
          id="onboarding-title"
          variants={safeItemVariants}
          className="text-[40px] sm:text-[48px] md:text-[64px] font-semibold tracking-tight leading-[1.05] mb-12 md:mb-16 text-center"
        >
          What brings you here?
        </motion.h1>

        {/* Two paths - side by side on desktop */}
        <motion.div
          variants={safeItemVariants}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
          role="group"
          aria-label="Choose your path"
        >
          {/* I lead something - PRIMARY (Leader path) */}
          <motion.button
            variants={shouldReduceMotion ? {} : primaryCardVariants}
            initial="rest"
            whileHover={shouldReduceMotion ? {} : "hover"}
            whileTap={shouldReduceMotion ? {} : "tap"}
            onClick={() => onSelect('student', true)}
            className="relative p-8 md:p-10 rounded-2xl border border-gold-500/20 bg-gold-500/[0.02] text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            style={{ boxShadow: GLOW_GOLD_SUBTLE }}
            aria-describedby="leader-description"
          >
            <div className="flex flex-col h-full min-h-[140px]">
              <div className="flex items-center gap-3 mb-2">
                <Sparkles className="w-5 h-5 text-gold-500" aria-hidden="true" />
                <h2 className="text-2xl md:text-3xl font-semibold text-white">
                  I lead something
                </h2>
              </div>
              <p id="leader-description" className="text-sm text-gray-400 mt-1">
                Claim a club or org. Build it your way.
              </p>
              <motion.div
                variants={shouldReduceMotion ? {} : arrowVariants}
                className="mt-auto pt-6 w-10 h-10 rounded-full bg-gold-500/10 flex items-center justify-center"
                aria-hidden="true"
              >
                <ArrowRight className="w-5 h-5 text-gold-500" />
              </motion.div>
            </div>
          </motion.button>

          {/* I'm finding my people - SECONDARY (Explorer path) */}
          <motion.button
            variants={shouldReduceMotion ? {} : cardHoverVariants}
            initial="rest"
            whileHover={shouldReduceMotion ? {} : "hover"}
            whileTap={shouldReduceMotion ? {} : "tap"}
            onClick={() => onSelect('student', false)}
            className="relative p-8 md:p-10 rounded-2xl border border-white/[0.06] bg-white/[0.02] text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            aria-describedby="explorer-description"
          >
            <div className="flex flex-col h-full min-h-[140px]">
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" aria-hidden="true" />
                <h2 className="text-2xl md:text-3xl font-semibold text-white">
                  I&apos;m finding my people
                </h2>
              </div>
              <p id="explorer-description" className="text-sm text-gray-500 mt-1 group-hover:text-gray-400 transition-colors">
                Join communities. Discover events.
              </p>
              <motion.div
                variants={shouldReduceMotion ? {} : arrowVariants}
                className="mt-auto pt-6 w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors"
                aria-hidden="true"
              >
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
              </motion.div>
            </div>
          </motion.button>
        </motion.div>

        {/* Faculty/Alumni - with label for clarity */}
        <motion.div
          variants={safeItemVariants}
          className="mt-12 md:mt-16 flex flex-col items-center gap-3"
        >
          <span className="text-xs text-gray-600 uppercase tracking-wide">
            Not a student?
          </span>
          <div className="flex items-center gap-6" role="group" aria-label="Other user types">
            <button
              onClick={() => onSelect('faculty', false)}
              className="text-sm text-gray-500 hover:text-gray-300 transition-colors focus:outline-none focus-visible:text-white focus-visible:underline"
            >
              Faculty
            </button>
            <span className="text-gray-700" aria-hidden="true">|</span>
            <button
              onClick={() => onSelect('alumni', false)}
              className="text-sm text-gray-500 hover:text-gray-300 transition-colors focus:outline-none focus-visible:text-white focus-visible:underline"
            >
              Alumni
            </button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
