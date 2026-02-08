'use client';

/**
 * StatsBar — Top-level stats summary for the creator dashboard
 *
 * Shows total tools, total users, and weekly interactions in a compact row.
 */

import { motion, useReducedMotion } from 'framer-motion';
import { Wrench, Users, Zap } from 'lucide-react';
import { MOTION } from '@hive/tokens';

const EASE = MOTION.ease.premium;

interface StatsBarProps {
  totalTools: number;
  totalUsers: number;
  weeklyInteractions: number;
}

function StatCard({
  value,
  label,
  icon: Icon,
  index,
}: {
  value: number;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  index: number;
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: shouldReduceMotion ? 0 : 0.25,
        delay: shouldReduceMotion ? 0 : index * 0.08,
        ease: EASE,
      }}
      className="flex items-center gap-3 px-4 py-3 rounded-xl
        border border-white/[0.06] bg-white/[0.02]"
    >
      <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-white/40" />
      </div>
      <div className="min-w-0">
        <div className="text-lg font-semibold text-white leading-tight">
          {value.toLocaleString()}
        </div>
        <div className="text-[11px] text-white/40 leading-tight">{label}</div>
      </div>
    </motion.div>
  );
}

export function StatsBar({ totalTools, totalUsers, weeklyInteractions }: StatsBarProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <StatCard value={totalTools} label="Tools" icon={Wrench} index={0} />
      <StatCard value={totalUsers} label="Total Users" icon={Users} index={1} />
      <StatCard value={weeklyInteractions} label="This Week" icon={Zap} index={2} />
    </div>
  );
}
