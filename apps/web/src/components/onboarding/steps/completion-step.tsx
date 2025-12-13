'use client';

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Check, Image, Calendar, Users } from 'lucide-react';
import { Button } from '@hive/ui';
import {
  celebrationCheckVariants,
  GLOW_GOLD_STRONG,
  goldenPulseVariants,
  EASE_PREMIUM,
} from '../shared/motion';

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

// What's next items for explorers - action-oriented
const EXPLORER_NEXT_STEPS = [
  { icon: Calendar, text: 'See what\'s happening this week' },
  { icon: Users, text: 'Check out who\'s active' },
];

/**
 * Completion screen
 * Minimal. Confident. "It's yours."
 *
 * For leaders: "It's yours." Space works immediately in stealth mode
 * while awaiting admin verification. They get instant value.
 * For explorers: "You're in."
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
  // Explorers → first space they joined (not an empty feed!)
  // This is critical: explorers need to land somewhere with CONTENT
  const destination = isLeader
    ? (spaceId ? `/spaces/${spaceId}` : '/spaces/browse')
    : (spaceId ? `/spaces/${spaceId}` : '/spaces/browse');

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 py-12"
      role="main"
      aria-labelledby="completion-title"
    >
      {/* Checkmark - the only celebration */}
      <motion.div
        variants={shouldReduceMotion ? {} : goldenPulseVariants}
        initial="initial"
        animate={shouldReduceMotion ? "initial" : "pulse"}
        aria-hidden="true"
      >
        <motion.div
          variants={shouldReduceMotion ? {} : celebrationCheckVariants}
          initial={shouldReduceMotion ? {} : "initial"}
          animate="animate"
          className="w-16 h-16 rounded-full border-2 border-gold-500 flex items-center justify-center"
          style={{ boxShadow: GLOW_GOLD_STRONG }}
        >
          <Check className="w-8 h-8 text-gold-500" strokeWidth={3} />
        </motion.div>
      </motion.div>

      {/* Message - minimal */}
      <motion.div
        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
        animate={{ opacity: showContent ? 1 : 0, y: showContent ? 0 : 10 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.4, ease: EASE_PREMIUM }}
        className="mt-8 text-center"
      >
        <h1 id="completion-title" className="text-[32px] md:text-[40px] font-semibold tracking-tight text-white">
          {isLeader
            ? `It's yours${handle ? `, @${handle}` : ''}.`
            : `Welcome to HIVE${handle ? `, @${handle}` : ''}.`}
        </h1>

        {/* Stealth mode note for leaders - subtle */}
        {isLeader && (
          <motion.p
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: showContent ? 1 : 0 }}
            transition={{ delay: shouldReduceMotion ? 0 : 0.2, duration: shouldReduceMotion ? 0 : 0.4 }}
            className="mt-4 text-sm text-gray-500"
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
            className="mt-4 text-sm text-gray-500"
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
          className="mt-10 w-full max-w-sm"
          aria-label="What's next"
        >
          <p className="text-xs text-gray-600 uppercase tracking-wide mb-3">What's next</p>
          <ul className="space-y-2" role="list">
            {LEADER_NEXT_STEPS.map((step, i) => (
              <motion.li
                key={step.text}
                initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, x: -10 }}
                animate={{ opacity: showNextSteps ? 1 : 0, x: showNextSteps ? 0 : -10 }}
                transition={{ delay: shouldReduceMotion ? 0 : i * 0.1, duration: shouldReduceMotion ? 0 : 0.3 }}
                className="flex items-center gap-3 text-sm text-gray-400"
              >
                <div className="w-8 h-8 rounded-lg bg-white/[0.03] flex items-center justify-center" aria-hidden="true">
                  <step.icon className="w-4 h-4 text-gray-500" />
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
          className="mt-10 w-full max-w-sm"
          aria-label="What's next"
        >
          <p className="text-xs text-gray-600 uppercase tracking-wide mb-3">What's next</p>
          <ul className="space-y-2" role="list">
            {EXPLORER_NEXT_STEPS.map((step, i) => (
              <motion.li
                key={step.text}
                initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, x: -10 }}
                animate={{ opacity: showNextSteps ? 1 : 0, x: showNextSteps ? 0 : -10 }}
                transition={{ delay: shouldReduceMotion ? 0 : i * 0.1, duration: shouldReduceMotion ? 0 : 0.3 }}
                className="flex items-center gap-3 text-sm text-gray-400"
              >
                <div className="w-8 h-8 rounded-lg bg-white/[0.03] flex items-center justify-center" aria-hidden="true">
                  <step.icon className="w-4 h-4 text-gray-500" />
                </div>
                <span>{step.text}</span>
              </motion.li>
            ))}
          </ul>

          {/* Space badges below */}
          {joinedSpaces.length > 0 && (
            <div className="mt-6 pt-6 border-t border-white/[0.04]">
              <p className="text-xs text-gray-600 mb-3">Your communities</p>
              <div className="flex flex-wrap gap-2">
                {joinedSpaces.slice(0, 5).map((name, i) => (
                  <motion.span
                    key={name}
                    initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.8 }}
                    animate={{ opacity: showNextSteps ? 1 : 0, scale: showNextSteps ? 1 : 0.8 }}
                    transition={{ delay: shouldReduceMotion ? 0 : 0.2 + i * 0.08, duration: shouldReduceMotion ? 0 : 0.3 }}
                    className="px-3 py-1.5 text-sm rounded-full bg-white/[0.03] border border-white/[0.06] text-gray-400"
                  >
                    {name}
                  </motion.span>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* CTA */}
      <motion.div
        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
        animate={{ opacity: showContent ? 1 : 0 }}
        transition={{ delay: shouldReduceMotion ? 0 : 0.3, duration: shouldReduceMotion ? 0 : 0.4 }}
        className="mt-10"
      >
        <Button
          onClick={() => onNavigate(destination)}
          showArrow
          size="lg"
        >
          {isLeader ? 'Set up your space' : (spaceId ? 'Check out your space' : 'Find your people')}
        </Button>
      </motion.div>
    </div>
  );
}
