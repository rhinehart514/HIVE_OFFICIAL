'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ArrowRight, ChevronDown } from 'lucide-react';

// Premium easing
const EASE_PREMIUM = [0.22, 1, 0.36, 1] as const;

// Spring config
const SPRING_BUTTER = {
  type: 'spring' as const,
  stiffness: 120,
  damping: 20,
  mass: 1,
};

export interface SpaceThresholdProps {
  space: {
    id: string;
    name: string;
    description?: string;
    iconUrl?: string;
    bannerUrl?: string;
    category?: string;
    memberCount: number;
    onlineCount?: number;
  };
  events?: Array<{
    id: string;
    title: string;
    date: Date | string;
  }>;
  toolCount?: number;
  /** Preview without joining - peek at the chat */
  onEnter: () => void;
  /** Join the space (requires auth) - primary action */
  onJoin?: () => void;
  /** Whether join is in progress */
  isJoining?: boolean;
}

/**
 * SpaceThreshold - Edge-to-Edge Welcoming Entry
 *
 * The threshold pattern: First-time visitors see space info before chat.
 * Matches the onboarding aesthetic: #050505 background, gold CTAs, centered content.
 *
 * For leaders: This screen is skipped (they go straight to setup/chat).
 * For returning visitors: This screen is skipped (localStorage check).
 */
export function SpaceThreshold({
  space,
  events = [],
  toolCount = 0,
  onEnter,
  onJoin,
  isJoining = false,
}: SpaceThresholdProps) {
  const shouldReduceMotion = useReducedMotion();
  const [showDetails, setShowDetails] = useState(false);

  // Stagger reveal after mount
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const hasUpcomingEvents = events.length > 0;
  const hasTools = toolCount > 0;
  const isActive = (space.onlineCount ?? 0) > 0;

  return (
    <motion.div
      initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen bg-[#050505] flex flex-col items-center justify-center px-6 py-12"
    >
      <div className="w-full max-w-md text-center">
        {/* Space Icon/Avatar */}
        <motion.div
          initial={shouldReduceMotion ? {} : { opacity: 0, scale: 0.9 }}
          animate={isVisible ? { opacity: 1, scale: 1 } : {}}
          transition={
            shouldReduceMotion
              ? {}
              : { delay: 0.1, duration: 0.5, ease: EASE_PREMIUM }
          }
          className="mb-6"
        >
          <div className="w-20 h-20 mx-auto rounded-2xl bg-white/[0.04] flex items-center justify-center overflow-hidden border border-white/[0.08]">
            {space.iconUrl ? (
              <img
                src={space.iconUrl}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-3xl font-bold text-white/60">
                {space.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        </motion.div>

        {/* Space Name */}
        <motion.h1
          initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={
            shouldReduceMotion
              ? {}
              : { delay: 0.15, duration: 0.5, ease: EASE_PREMIUM }
          }
          className="text-[clamp(1.5rem,3.5vw,2rem)] font-semibold tracking-[-0.02em] text-white mb-3"
        >
          {space.name}
        </motion.h1>

        {/* Description */}
        {space.description && (
          <motion.p
            initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={
              shouldReduceMotion
                ? {}
                : { delay: 0.2, duration: 0.5, ease: EASE_PREMIUM }
            }
            className="text-[15px] text-white/40 mb-6 line-clamp-2"
          >
            {space.description}
          </motion.p>
        )}

        {/* Stats Row */}
        <motion.div
          initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={
            shouldReduceMotion
              ? {}
              : { delay: 0.25, duration: 0.5, ease: EASE_PREMIUM }
          }
          className="flex items-center justify-center gap-4 mb-10"
        >
          <span className="text-[14px] text-white/40">
            {space.memberCount.toLocaleString()} members
          </span>
          {isActive && (
            <>
              <span className="text-white/20">·</span>
              <span className="flex items-center gap-1.5 text-[14px] text-[#FFD700]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FFD700] shadow-[0_0_8px_rgba(255,215,0,0.4)]" />
                {space.onlineCount} online
              </span>
            </>
          )}
        </motion.div>

        {/* Dual-Path CTA - Clear distinction between Preview and Join */}
        <motion.div
          initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={
            shouldReduceMotion
              ? {}
              : { delay: 0.3, duration: 0.5, ease: EASE_PREMIUM }
          }
          className="flex flex-col items-center gap-4"
        >
          {/* Primary + Secondary CTAs */}
          <div className="flex items-center gap-3">
            {/* Preview - Ghost button (secondary) */}
            <motion.button
              onClick={onEnter}
              whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
              whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
              className="py-3.5 px-6 rounded-full font-medium text-[15px] border border-white/[0.12] text-white/70 hover:text-white hover:border-white/[0.24] hover:bg-white/[0.04] transition-all duration-200"
            >
              Preview
            </motion.button>

            {/* Join Space - Gold CTA (primary) */}
            {onJoin && (
              <motion.button
                onClick={onJoin}
                disabled={isJoining}
                whileHover={shouldReduceMotion || isJoining ? {} : { scale: 1.02 }}
                whileTap={shouldReduceMotion || isJoining ? {} : { scale: 0.98 }}
                className="py-3.5 px-7 rounded-full font-medium text-[15px] bg-[#FFD700] text-black flex items-center gap-2 transition-all duration-300 hover:bg-[#FFE44D] disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ boxShadow: '0 0 30px rgba(255, 215, 0, 0.2)' }}
              >
                {isJoining ? (
                  <>
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                      className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full"
                    />
                    Joining...
                  </>
                ) : (
                  <>
                    Join Space
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </motion.button>
            )}
          </div>

          {/* Clarifying text */}
          <p className="text-[12px] text-white/30">
            Preview without joining
          </p>
        </motion.div>

        {/* More Info Toggle (expandable) */}
        <AnimatePresence>
          {!showDetails && (hasUpcomingEvents || hasTools) && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDetails(true)}
              className="mt-8 text-[12px] text-white/25 hover:text-white/40 transition-colors flex items-center gap-1 mx-auto"
            >
              What's happening
              <ChevronDown className="w-3 h-3" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Expanded Details */}
        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={SPRING_BUTTER}
              className="mt-8 pt-8 border-t border-white/[0.06] overflow-hidden"
            >
              {/* Upcoming Events */}
              {hasUpcomingEvents && (
                <div className="mb-6">
                  <p className="text-[11px] uppercase tracking-[0.1em] text-white/25 mb-3">
                    Upcoming Events
                  </p>
                  <div className="space-y-2">
                    {events.slice(0, 3).map((event) => (
                      <div
                        key={event.id}
                        className="text-left px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.04]"
                      >
                        <p className="text-[13px] text-white/70">{event.title}</p>
                        <p className="text-[12px] text-white/30">
                          {typeof event.date === 'string'
                            ? new Date(event.date).toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                              })
                            : event.date.toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                              })}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tools Available */}
              {hasTools && (
                <div>
                  <p className="text-[11px] uppercase tracking-[0.1em] text-white/25 mb-2">
                    Interactive Tools
                  </p>
                  <p className="text-[13px] text-white/40">
                    {toolCount} {toolCount === 1 ? 'tool' : 'tools'} available
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default SpaceThreshold;
