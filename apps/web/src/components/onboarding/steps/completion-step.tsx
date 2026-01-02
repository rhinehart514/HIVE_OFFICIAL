'use client';

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Check, Image, Calendar, Users, ArrowRight } from 'lucide-react';

// Premium easing
const EASE_PREMIUM = [0.22, 1, 0.36, 1] as const;

// Celebration check animation
const celebrationCheckVariants = {
  initial: { scale: 0, rotate: -90, opacity: 0 },
  animate: {
    scale: 1,
    rotate: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 200,
      damping: 15,
      delay: 0.2,
    },
  },
};

// Gold pulse animation
const goldenPulseVariants = {
  initial: { scale: 1 },
  pulse: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

interface CompletionStepProps {
  spaceName?: string;
  spaceId?: string;
  isLeader: boolean;
  handle?: string;
  /** For explorers: names of spaces they joined */
  joinedSpaces?: string[];
  onNavigate: (path: string) => void;
}

// What's next items for leaders
const LEADER_NEXT_STEPS = [
  { icon: Image, text: 'Customize your banner' },
  { icon: Calendar, text: 'Add your first event' },
  { icon: Users, text: 'Invite members' },
];

// What's next items for explorers
const EXPLORER_NEXT_STEPS = [
  { icon: Calendar, text: "See what's happening this week" },
  { icon: Users, text: "Check out who's active" },
];

/**
 * Completion Screen - Edge-to-Edge Aesthetic
 * THE GOLD CELEBRATION - earned moment
 *
 * For leaders: "It's yours." - Space works immediately
 * For explorers: "Welcome to HIVE." - Ready to explore
 */
export function CompletionStep({
  spaceName,
  spaceId,
  isLeader,
  handle,
  joinedSpaces = [],
  onNavigate,
}: CompletionStepProps) {
  const shouldReduceMotion = useReducedMotion();
  const [showContent, setShowContent] = useState(false);
  const [showNextSteps, setShowNextSteps] = useState(false);

  // Stagger content reveal after checkmark
  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 500);
    return () => clearTimeout(timer);
  }, []);

  // Show "What's Next" panel after main content
  useEffect(() => {
    const timer = setTimeout(() => setShowNextSteps(true), 900);
    return () => clearTimeout(timer);
  }, []);

  // Leaders → their space (or browse if no space claimed)
  // Explorers → first space they joined
  const destination = isLeader
    ? (spaceId ? `/spaces/${spaceId}` : '/spaces/browse')
    : (spaceId ? `/spaces/${spaceId}` : '/spaces/browse');

  return (
    <motion.div
      initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={shouldReduceMotion ? {} : { duration: 0.4 }}
      className="flex flex-col items-center relative"
      role="main"
      aria-labelledby="completion-title"
    >
      {/* Radial gold glow - celebration */}
      {!shouldReduceMotion && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 0.06, scale: 1 }}
          transition={{ duration: 1, ease: EASE_PREMIUM }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(255, 215, 0, 0.5) 0%, transparent 60%)',
            filter: 'blur(80px)',
          }}
        />
      )}

      {/* Checkmark - the gold celebration */}
      <motion.div
        variants={shouldReduceMotion ? {} : goldenPulseVariants}
        initial="initial"
        animate={shouldReduceMotion ? 'initial' : 'pulse'}
        aria-hidden="true"
      >
        <motion.div
          variants={shouldReduceMotion ? {} : celebrationCheckVariants}
          initial={shouldReduceMotion ? {} : 'initial'}
          animate="animate"
          className="w-16 h-16 rounded-full border-2 border-[#FFD700] flex items-center justify-center"
          style={{ boxShadow: '0 0 40px rgba(255, 215, 0, 0.3)' }}
        >
          <Check className="w-8 h-8 text-[#FFD700]" strokeWidth={3} />
        </motion.div>
      </motion.div>

      {/* Message */}
      <motion.div
        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
        animate={{ opacity: showContent ? 1 : 0, y: showContent ? 0 : 10 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.4, ease: EASE_PREMIUM }}
        className="mt-8 text-center"
      >
        <h1
          id="completion-title"
          className="text-[clamp(1.75rem,4vw,2.25rem)] font-semibold tracking-[-0.02em] text-[#FFD700]"
        >
          {isLeader
            ? `It's yours${handle ? `, @${handle}` : ''}.`
            : `Welcome to HIVE${handle ? `, @${handle}` : ''}.`}
        </h1>

        {/* Stealth mode note for leaders */}
        {isLeader && (
          <motion.p
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: showContent ? 1 : 0 }}
            transition={{ delay: shouldReduceMotion ? 0 : 0.2, duration: shouldReduceMotion ? 0 : 0.4 }}
            className="mt-4 text-[14px] text-white/40"
          >
            Your space is live. We'll verify you shortly.
          </motion.p>
        )}

        {/* Explorer joined spaces summary */}
        {!isLeader && joinedSpaces.length > 0 && (
          <motion.p
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: showContent ? 1 : 0 }}
            transition={{ delay: shouldReduceMotion ? 0 : 0.2, duration: shouldReduceMotion ? 0 : 0.4 }}
            className="mt-4 text-[14px] text-white/40"
          >
            You joined {joinedSpaces.length} {joinedSpaces.length === 1 ? 'community' : 'communities'}.
          </motion.p>
        )}
      </motion.div>

      {/* What's Next panel for leaders */}
      {isLeader && (
        <motion.div
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
          animate={{ opacity: showNextSteps ? 1 : 0, y: showNextSteps ? 0 : 20 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.5, ease: EASE_PREMIUM }}
          className="mt-10 w-full"
          aria-label="What's next"
        >
          <p className="text-[11px] uppercase tracking-[0.1em] mb-3 text-white/25">
            What's next
          </p>
          <ul className="space-y-2" role="list">
            {LEADER_NEXT_STEPS.map((step, i) => (
              <motion.li
                key={step.text}
                initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, x: -10 }}
                animate={{ opacity: showNextSteps ? 1 : 0, x: showNextSteps ? 0 : -10 }}
                transition={{ delay: shouldReduceMotion ? 0 : i * 0.1, duration: shouldReduceMotion ? 0 : 0.3 }}
                className="flex items-center gap-3 text-[14px] text-white/50"
              >
                <div
                  className="w-8 h-8 rounded-lg bg-white/[0.03] flex items-center justify-center"
                  aria-hidden="true"
                >
                  <step.icon className="w-4 h-4 text-white/30" />
                </div>
                <span>{step.text}</span>
              </motion.li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Explorer: What's next panel + space badges */}
      {!isLeader && (
        <motion.div
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
          animate={{ opacity: showNextSteps ? 1 : 0, y: showNextSteps ? 0 : 20 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.5, ease: EASE_PREMIUM }}
          className="mt-10 w-full"
          aria-label="What's next"
        >
          <p className="text-[11px] uppercase tracking-[0.1em] mb-3 text-white/25">
            What's next
          </p>
          <ul className="space-y-2" role="list">
            {EXPLORER_NEXT_STEPS.map((step, i) => (
              <motion.li
                key={step.text}
                initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, x: -10 }}
                animate={{ opacity: showNextSteps ? 1 : 0, x: showNextSteps ? 0 : -10 }}
                transition={{ delay: shouldReduceMotion ? 0 : i * 0.1, duration: shouldReduceMotion ? 0 : 0.3 }}
                className="flex items-center gap-3 text-[14px] text-white/50"
              >
                <div
                  className="w-8 h-8 rounded-lg bg-white/[0.03] flex items-center justify-center"
                  aria-hidden="true"
                >
                  <step.icon className="w-4 h-4 text-white/30" />
                </div>
                <span>{step.text}</span>
              </motion.li>
            ))}
          </ul>

          {/* Space badges below */}
          {joinedSpaces.length > 0 && (
            <div className="mt-6 pt-6 border-t border-white/[0.06]">
              <p className="text-[11px] uppercase tracking-[0.1em] mb-3 text-white/25">
                Your communities
              </p>
              <div className="flex flex-wrap gap-2">
                {joinedSpaces.slice(0, 5).map((name, i) => (
                  <motion.span
                    key={name}
                    initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.8 }}
                    animate={{ opacity: showNextSteps ? 1 : 0, scale: showNextSteps ? 1 : 0.8 }}
                    transition={{
                      delay: shouldReduceMotion ? 0 : 0.2 + i * 0.08,
                      duration: shouldReduceMotion ? 0 : 0.3,
                    }}
                    className="px-3 py-1.5 text-[13px] rounded-full bg-white/[0.03] border border-white/[0.08] text-white/50"
                  >
                    {name}
                  </motion.span>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* CTA - GOLD BUTTON (the earned moment, final action) */}
      <motion.div
        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
        animate={{ opacity: showContent ? 1 : 0 }}
        transition={{ delay: shouldReduceMotion ? 0 : 0.3, duration: shouldReduceMotion ? 0 : 0.4 }}
        className="mt-10"
      >
        <motion.button
          onClick={() => onNavigate(destination)}
          whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
          whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
          className="py-4 px-8 rounded-full font-medium text-[15px] bg-[#FFD700] text-black flex items-center gap-2 transition-all duration-300 hover:bg-[#FFE44D]"
          style={{ boxShadow: '0 0 30px rgba(255, 215, 0, 0.2)' }}
        >
          {isLeader ? 'Set up your space' : spaceId ? 'Check out your space' : 'Find your people'}
          <ArrowRight className="w-4 h-4" />
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
