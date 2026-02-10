'use client';

/**
 * Spaces Discovery Page - Loading Skeleton
 *
 * Matches the redesigned discovery page layout:
 * - Sticky header with search + category pills
 * - Featured Hero Section (bento grid skeleton)
 * - Discovery Grid sections (card skeletons)
 *
 * Uses Framer Motion for premium pulse animation
 */

import { motion, MOTION } from '@hive/ui/design-system/primitives';

function CategoryPillSkeleton({ delay = 0 }: { delay?: number }) {
  return (
    <motion.div
      className="h-9 w-24 rounded-full bg-[var(--bg-ground)]/50 flex-shrink-0"
      animate={{ opacity: [0.3, 0.6, 0.3] }}
      transition={{ duration: 1.5, repeat: Infinity, delay, ease: MOTION.ease.smooth }}
    />
  );
}

function HeroSectionSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Large hero card skeleton */}
      <motion.div
        className="md:col-span-2 md:row-span-2 h-[240px] md:h-80 rounded-lg bg-[var(--bg-void)]/50 border border-white/[0.06]"
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: MOTION.ease.smooth }}
      >
        <div className="h-full p-6 flex flex-col justify-end">
          <motion.div
            className="h-6 w-48 bg-[var(--bg-ground)] rounded mb-2"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.1, ease: MOTION.ease.smooth }}
          />
          <motion.div
            className="h-4 w-32 bg-[var(--bg-ground)]/60 rounded"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.2, ease: MOTION.ease.smooth }}
          />
        </div>
      </motion.div>

      {/* Secondary card skeletons */}
      <div className="grid grid-cols-2 md:grid-cols-1 md:flex md:flex-col gap-4">
        <motion.div
          className="h-[140px] md:flex-1 rounded-lg bg-[var(--bg-void)]/50 border border-white/[0.06] p-4"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.1, ease: MOTION.ease.smooth }}
        >
          <motion.div
            className="h-4 w-32 bg-[var(--bg-ground)] rounded mb-2"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.15, ease: MOTION.ease.smooth }}
          />
          <motion.div
            className="h-3 w-20 bg-[var(--bg-ground)]/60 rounded"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.2, ease: MOTION.ease.smooth }}
          />
        </motion.div>
        <motion.div
          className="h-[140px] md:flex-1 rounded-lg bg-[var(--bg-void)]/50 border border-white/[0.06] p-4"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.2, ease: MOTION.ease.smooth }}
        >
          <motion.div
            className="h-4 w-28 bg-[var(--bg-ground)] rounded mb-2"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.25, ease: MOTION.ease.smooth }}
          />
          <motion.div
            className="h-3 w-24 bg-[var(--bg-ground)]/60 rounded"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.3, ease: MOTION.ease.smooth }}
          />
        </motion.div>
      </div>
    </div>
  );
}

function SectionHeaderSkeleton({ delay = 0 }: { delay?: number }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-3">
        <motion.div
          className="w-10 h-10 rounded-lg bg-[var(--bg-ground)]/50"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity, delay, ease: MOTION.ease.smooth }}
        />
        <div>
          <motion.div
            className="h-5 w-40 bg-[var(--bg-ground)] rounded mb-1"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: delay + 0.05, ease: MOTION.ease.smooth }}
          />
          <motion.div
            className="h-3 w-28 bg-[var(--bg-ground)]/60 rounded"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: delay + 0.1, ease: MOTION.ease.smooth }}
          />
        </div>
      </div>
      <motion.div
        className="h-4 w-16 bg-[var(--bg-ground)]/40 rounded"
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 1.5, repeat: Infinity, delay: delay + 0.15, ease: MOTION.ease.smooth }}
      />
    </div>
  );
}

function DiscoveryCardSkeletonStaggered({ delay }: { delay: number }) {
  return (
    <motion.div
      className="bg-[var(--bg-void)]/50 border border-white/[0.06] rounded-lg p-4"
      animate={{ opacity: [0.3, 0.6, 0.3] }}
      transition={{ duration: 1.5, repeat: Infinity, delay, ease: MOTION.ease.smooth }}
    >
      <div className="flex items-start gap-3.5">
        <motion.div
          className="w-12 h-12 rounded-lg bg-[var(--bg-ground)]"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: delay + 0.05, ease: MOTION.ease.smooth }}
        />
        <div className="flex-1 space-y-2">
          <motion.div
            className="h-4 w-32 bg-[var(--bg-ground)] rounded"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: delay + 0.1, ease: MOTION.ease.smooth }}
          />
          <motion.div
            className="h-3 w-24 bg-[var(--bg-ground)]/60 rounded"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: delay + 0.15, ease: MOTION.ease.smooth }}
          />
        </div>
        <motion.div
          className="h-8 w-16 bg-[var(--bg-ground)] rounded-lg"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: delay + 0.2, ease: MOTION.ease.smooth }}
        />
      </div>
      <div className="mt-3 pt-3 border-t border-white/[0.06]">
        <motion.div
          className="h-4 w-20 bg-[var(--bg-ground)]/40 rounded"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: delay + 0.25, ease: MOTION.ease.smooth }}
        />
      </div>
    </motion.div>
  );
}

function DiscoveryGridSkeleton({ count = 4, startDelay = 0 }: { count?: number; startDelay?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <DiscoveryCardSkeletonStaggered key={i} delay={startDelay + i * 0.05} />
      ))}
    </div>
  );
}

export default function SpacesLoading() {
  return (
    <div className="min-h-screen bg-black">
      {/* Sticky Header Skeleton */}
      <header className="sticky top-0 z-30 bg-black/80  border-b border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-6 pt-6 pb-4">
          {/* Title Row */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <motion.div
                className="h-7 w-24 bg-[var(--bg-ground)] rounded mb-2"
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: MOTION.ease.smooth }}
              />
              <motion.div
                className="h-4 w-36 bg-[var(--bg-ground)]/60 rounded"
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.05, ease: MOTION.ease.smooth }}
              />
            </div>
            <motion.div
              className="h-9 w-24 bg-gold-500/20 rounded-lg"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.1, ease: MOTION.ease.smooth }}
            />
          </div>

          {/* Search Skeleton */}
          <motion.div
            className="h-10 w-full bg-[var(--bg-void)]/50 border border-white/[0.06] rounded-md mb-4"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.15, ease: MOTION.ease.smooth }}
          />

          {/* Category Pills Skeleton */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <CategoryPillSkeleton key={i} delay={0.2 + i * 0.05} />
            ))}
          </div>
        </div>
      </header>

      {/* Main Content Skeleton */}
      <main className="max-w-5xl mx-auto px-6 py-8 space-y-12">
        {/* Featured Section */}
        <section>
          <SectionHeaderSkeleton delay={0.3} />
          <HeroSectionSkeleton />
        </section>

        {/* Recommended Section */}
        <section>
          <SectionHeaderSkeleton delay={0.5} />
          <DiscoveryGridSkeleton count={4} startDelay={0.55} />
        </section>

        {/* Popular Section */}
        <section>
          <SectionHeaderSkeleton delay={0.7} />
          <DiscoveryGridSkeleton count={4} startDelay={0.75} />
        </section>
      </main>
    </div>
  );
}
