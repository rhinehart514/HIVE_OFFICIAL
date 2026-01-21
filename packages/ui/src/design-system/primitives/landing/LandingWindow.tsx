'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../../lib/utils';
import { SpacePreviewCard } from './SpacePreviewCard';

export interface LandingWindowSpace {
  id: string;
  name: string;
  shortName?: string;
  avatar?: string;
  memberCount: number;
  isLive?: boolean;
}

export interface LandingWindowProps extends React.HTMLAttributes<HTMLDivElement> {
  spaces: LandingWindowSpace[];
  featuredIndex?: number;
}

export function LandingWindow({
  spaces,
  featuredIndex = 0,
  className,
  ...props
}: LandingWindowProps) {
  return (
    <div className={cn('relative w-full overflow-hidden', className)} {...props}>
      {/* Fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[var(--color-bg-void)] to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[var(--color-bg-void)] to-transparent z-10 pointer-events-none" />

      {/* Scrollable cards */}
      <div className="flex gap-4 px-6 py-4 overflow-x-auto scrollbar-hide">
        {spaces.map((space, i) => (
          <motion.div
            key={space.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.4,
              delay: 0.3 + i * 0.05,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <SpacePreviewCard
              name={space.name}
              shortName={space.shortName}
              avatar={space.avatar}
              memberCount={space.memberCount}
              isLive={space.isLive}
              featured={i === featuredIndex}
            />
          </motion.div>
        ))}
      </div>

      {/* Scroll hint */}
      <p className="text-center text-[12px] text-white/30 mt-2">
        scroll to explore
      </p>
    </div>
  );
}

LandingWindow.displayName = 'LandingWindow';
