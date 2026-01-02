"use client";

/**
 * World Background - Shared ambient layer
 *
 * Used by:
 * - WindowLanding (full opacity)
 * - AuthShell (dimmed, persistent)
 * - OnboardingLayout (progressively revealed)
 *
 * Shows fragments of HIVE to maintain context
 * during the entrance flow.
 */

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import {
  FRAGMENT_SEQUENCE,
  getMessageById,
  getSpaceById,
  getToolById,
  getActivityById,
  type FragmentSequence,
} from "./content-library";

import {
  messageVariants,
  spaceVariants,
  toolVariants,
  activityVariants,
  pulseVariants,
  getFragmentPosition,
} from "./motion-rhythm";

// ============================================
// MINI FRAGMENT COMPONENTS (Simplified)
// ============================================

function MiniMessage({ id }: { id: string }) {
  const message = getMessageById(id);
  if (!message) return null;

  return (
    <motion.div
      variants={messageVariants}
      initial="hidden"
      animate="visible"
      className="max-w-[260px]"
    >
      <div className="px-3 py-2 rounded-xl bg-white/[0.02] border border-white/[0.04]">
        <p className="text-[12px] text-white/40 leading-snug truncate">
          {message.text}
        </p>
      </div>
    </motion.div>
  );
}

function MiniSpace({ id }: { id: string }) {
  const space = getSpaceById(id);
  if (!space) return null;

  return (
    <motion.div variants={spaceVariants} initial="hidden" animate="visible">
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
        <div className="w-7 h-7 rounded-md bg-white/[0.03] flex items-center justify-center relative">
          <span className="text-[9px] font-semibold text-white/30 uppercase">
            {space.name.split(" ").slice(0, 2).map((w) => w[0]).join("")}
          </span>
          {space.hot && (
            <motion.span
              variants={pulseVariants}
              animate="pulse"
              className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#FFD700]/60"
            />
          )}
        </div>
        <div className="min-w-0">
          <p className="text-[11px] text-white/50 truncate">{space.name}</p>
          <p className="text-[9px] text-white/25">{space.activity}</p>
        </div>
      </div>
    </motion.div>
  );
}

function MiniTool({ id }: { id: string }) {
  const tool = getToolById(id);
  if (!tool) return null;

  return (
    <motion.div variants={toolVariants} initial="hidden" animate="visible">
      <div className="px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
        <div className="flex items-center gap-2">
          <span className="text-[8px] text-white/20 uppercase">tool</span>
          {tool.stat && (
            <span className="text-[10px] text-white/40 font-mono">
              {tool.stat}
            </span>
          )}
        </div>
        <p className="text-[11px] text-white/50 mt-0.5">{tool.name}</p>
      </div>
    </motion.div>
  );
}

function MiniActivity({ id }: { id: string }) {
  const activity = getActivityById(id);
  if (!activity) return null;

  return (
    <motion.div variants={activityVariants} initial="hidden" animate="visible">
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.02] border border-white/[0.04]">
        <span className="text-[10px] text-white/30">{activity.action}</span>
      </div>
    </motion.div>
  );
}

// ============================================
// FRAGMENT RENDERER
// ============================================

interface FragmentRendererProps {
  fragment: FragmentSequence;
  index: number;
}

function FragmentRenderer({ fragment, index }: FragmentRendererProps) {
  const position = getFragmentPosition(fragment.position);
  const isTopCenter = fragment.position === "top-center";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{
        delay: 0.5 + index * 0.3, // Staggered appearance
        duration: 0.3,
      }}
      className="absolute pointer-events-none"
      style={{
        ...position,
        zIndex: index,
        ...(isTopCenter && { transform: "translateX(-50%)" }),
      }}
    >
      {fragment.type === "message" && <MiniMessage id={fragment.id} />}
      {fragment.type === "space" && <MiniSpace id={fragment.id} />}
      {fragment.type === "tool" && <MiniTool id={fragment.id} />}
      {fragment.type === "activity" && <MiniActivity id={fragment.id} />}
    </motion.div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

interface WorldBackgroundProps {
  /** Opacity of the fragments (0-1). Default: 0.4 for auth/onboarding */
  opacity?: number;
  /** Whether to animate fragments in. Default: true */
  animated?: boolean;
  /** Subset of fragments to show (for progressive reveal) */
  fragmentCount?: number;
  /** Additional className */
  className?: string;
}

export function WorldBackground({
  opacity = 0.4,
  animated = true,
  fragmentCount,
  className = "",
}: WorldBackgroundProps) {
  const [visibleFragments, setVisibleFragments] = useState<number[]>([]);

  const fragments = fragmentCount
    ? FRAGMENT_SEQUENCE.slice(0, fragmentCount)
    : FRAGMENT_SEQUENCE;

  useEffect(() => {
    if (!animated) {
      setVisibleFragments(fragments.map((_, i) => i));
      return;
    }

    const timeouts: NodeJS.Timeout[] = [];
    fragments.forEach((_, index) => {
      const timeout = setTimeout(
        () => {
          setVisibleFragments((prev) => [...prev, index]);
        },
        300 + index * 400
      );
      timeouts.push(timeout);
    });

    return () => timeouts.forEach(clearTimeout);
  }, [animated, fragments.length]);

  return (
    <div
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
      style={{ opacity }}
    >
      {/* Ambient gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(255,255,255,0.01) 0%, transparent 60%)",
        }}
      />

      {/* Noise texture */}
      <div
        className="absolute inset-0 opacity-[0.01]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Fragments */}
      <AnimatePresence>
        {visibleFragments.map((index) => (
          <FragmentRenderer
            key={index}
            fragment={fragments[index]}
            index={index}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

export default WorldBackground;
