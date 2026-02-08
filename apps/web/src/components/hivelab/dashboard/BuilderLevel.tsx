'use client';

/**
 * BuilderLevel -- Shows builder progression: level, XP bar, next level info.
 *
 * Levels:
 *   Creator (Seedling) -> Builder (Hammer) -> Architect (Blueprint) -> Innovator (Rocket)
 */

import { motion, useReducedMotion } from 'framer-motion';
import { Sprout, Hammer, Compass, Rocket } from 'lucide-react';
import { MOTION, springPresets } from '@hive/tokens';
import { useBuilderProfile } from '@/hooks/use-builder-profile';

const EASE = MOTION.ease.premium;

const LEVEL_CONFIG: Record<
  string,
  {
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    bgColor: string;
  }
> = {
  creator: {
    icon: Sprout,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-400/10',
  },
  builder: {
    icon: Hammer,
    color: 'text-amber-400',
    bgColor: 'bg-amber-400/10',
  },
  architect: {
    icon: Compass,
    color: 'text-blue-400',
    bgColor: 'bg-blue-400/10',
  },
  innovator: {
    icon: Rocket,
    color: 'text-purple-400',
    bgColor: 'bg-purple-400/10',
  },
};

const PROGRESS_BAR_COLORS: Record<string, string> = {
  creator: 'bg-emerald-400',
  builder: 'bg-amber-400',
  architect: 'bg-blue-400',
  innovator: 'bg-purple-400',
};

export function BuilderLevel() {
  const { data: profile, isLoading } = useBuilderProfile();
  const shouldReduceMotion = useReducedMotion();

  if (isLoading || !profile) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/[0.06] bg-white/[0.02] animate-pulse">
        <div className="w-8 h-8 rounded-lg bg-white/[0.06]" />
        <div className="flex-1 min-w-0">
          <div className="h-3.5 w-20 rounded bg-white/[0.06] mb-2" />
          <div className="h-1.5 w-full rounded-full bg-white/[0.04]" />
        </div>
      </div>
    );
  }

  const config = LEVEL_CONFIG[profile.level] || LEVEL_CONFIG.creator;
  const Icon = config.icon;
  const barColor = PROGRESS_BAR_COLORS[profile.level] || 'bg-white/40';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: shouldReduceMotion ? 0 : 0.25,
        ease: EASE,
      }}
      className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/[0.06] bg-white/[0.02]"
    >
      {/* Level icon */}
      <div
        className={`w-8 h-8 rounded-lg ${config.bgColor} flex items-center justify-center flex-shrink-0`}
      >
        <Icon className={`w-4 h-4 ${config.color}`} />
      </div>

      {/* Level info + progress */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <span className={`text-xs font-medium ${config.color}`}>
            {profile.levelLabel}
          </span>
          <span className="text-[10px] text-white/30 tabular-nums">
            {profile.xp.toLocaleString()} XP
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${barColor}`}
            initial={{ width: 0 }}
            animate={{ width: `${profile.progressPercent}%` }}
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : { ...springPresets.default, delay: 0.2 }
            }
          />
        </div>

        {/* Next level hint */}
        {!profile.isMaxLevel && profile.nextLevelName && (
          <div className="mt-1">
            <span className="text-[10px] text-white/25">
              {profile.xpToNextLevel} XP to {profile.nextLevelName}
            </span>
          </div>
        )}
        {profile.isMaxLevel && (
          <div className="mt-1">
            <span className="text-[10px] text-white/25">Max level reached</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
