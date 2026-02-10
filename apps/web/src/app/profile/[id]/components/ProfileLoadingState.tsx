/**
 * ProfileLoadingState - Loading skeleton for profile page
 *
 * Matches the 3-zone profile layout:
 * - Zone 1: Identity Hero
 * - Zone 2: Activity (Building, Leading, Organizing)
 * - Zone 3: Campus Presence (Spaces)
 *
 * Uses staggered wave animation (0.15s delay between elements)
 * Base color: white/[0.06] per design tokens
 */

'use client';

import { motion } from 'framer-motion';

const MOTION_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

// Skeleton base component with staggered animation
function Skeleton({
  className,
  staggerIndex = 0,
}: {
  className?: string;
  staggerIndex?: number;
}) {
  return (
    <motion.div
      className={`bg-white/[0.06] rounded ${className || ''}`}
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        delay: staggerIndex * 0.15,
        ease: MOTION_EASE,
      }}
    />
  );
}

export function ProfileLoadingState() {
  return (
    <div className="min-h-full w-full overflow-y-auto bg-[var(--bg-base)]">
      <motion.div
        className="max-w-3xl mx-auto px-4 sm:px-8 py-8 sm:py-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, ease: MOTION_EASE }}
      >
        {/* ================================================================
            ZONE 1: IDENTITY HERO SKELETON
            ================================================================ */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: MOTION_EASE }}
        >
          <div
            className="p-6 sm:p-8"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderRadius: '24px',
              boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
            }}
          >
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {/* Avatar */}
              <Skeleton className="w-24 h-24 sm:w-28 sm:h-28 rounded-full flex-shrink-0" staggerIndex={0} />

              <div className="flex-1 text-center sm:text-left space-y-3 w-full">
                {/* Name */}
                <Skeleton className="h-8 w-48 mx-auto sm:mx-0" staggerIndex={1} />
                {/* Bio line 1 */}
                <Skeleton className="h-4 w-64 mx-auto sm:mx-0" staggerIndex={2} />
                {/* Bio line 2 */}
                <Skeleton className="h-4 w-52 mx-auto sm:mx-0" staggerIndex={3} />
                {/* Tags row */}
                <div className="flex flex-wrap gap-2 justify-center sm:justify-start pt-2">
                  <Skeleton className="h-6 w-20 rounded-full" staggerIndex={4} />
                  <Skeleton className="h-6 w-24 rounded-full" staggerIndex={5} />
                  <Skeleton className="h-6 w-16 rounded-full" staggerIndex={6} />
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <Skeleton className="h-10 w-24 rounded-lg" staggerIndex={7} />
                <Skeleton className="h-10 w-10 rounded-lg" staggerIndex={8} />
              </div>
            </div>
          </div>
        </motion.section>

        {/* ================================================================
            ZONE 2: ACTIVITY SKELETON (Building, Leading, Organizing)
            ================================================================ */}
        <motion.section
          className="mt-6"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: MOTION_EASE }}
        >
          <div
            className="p-6 sm:p-8"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderRadius: '24px',
              boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
            }}
          >
            <div className="space-y-6">
              {/* Building Section */}
              <div>
                <Skeleton className="h-3 w-16 mb-4" staggerIndex={9} />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="p-4 rounded-lg"
                      style={{ backgroundColor: 'var(--bg-elevated)' }}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <Skeleton className="w-10 h-10 rounded-lg" staggerIndex={10 + i} />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-24" staggerIndex={11 + i} />
                          <Skeleton className="h-3 w-16" staggerIndex={12 + i} />
                        </div>
                      </div>
                      <Skeleton className="h-3 w-full" staggerIndex={13 + i} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Leading Section */}
              <div>
                <Skeleton className="h-3 w-14 mb-4" staggerIndex={16} />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[0, 1].map((i) => (
                    <div
                      key={i}
                      className="p-4 rounded-lg"
                      style={{ backgroundColor: 'var(--bg-elevated)' }}
                    >
                      <div className="flex items-center gap-3">
                        <Skeleton className="w-10 h-10 rounded-lg" staggerIndex={17 + i * 2} />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-28" staggerIndex={18 + i * 2} />
                          <Skeleton className="h-3 w-20" staggerIndex={19 + i * 2} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* ================================================================
            ZONE 3: CAMPUS PRESENCE SKELETON (Spaces)
            ================================================================ */}
        <motion.section
          className="mt-6"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: MOTION_EASE }}
        >
          <div
            className="p-6 sm:p-8"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderRadius: '24px',
              boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
            }}
          >
            {/* Spaces label */}
            <Skeleton className="h-3 w-12 mb-4" staggerIndex={22} />

            {/* Space pills */}
            <div className="flex flex-wrap gap-2 mb-6">
              <Skeleton className="h-8 w-16 rounded-full" staggerIndex={23} />
              <Skeleton className="h-8 w-20 rounded-full" staggerIndex={24} />
              <Skeleton className="h-8 w-24 rounded-full" staggerIndex={25} />
              <Skeleton className="h-8 w-16 rounded-full" staggerIndex={26} />
              <Skeleton className="h-8 w-20 rounded-full" staggerIndex={27} />
              <Skeleton className="h-8 w-24 rounded-full" staggerIndex={28} />
            </div>

            {/* Connection footer */}
            <div
              className="pt-4 border-t"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              <div className="flex items-center gap-4">
                <Skeleton className="h-4 w-32" staggerIndex={29} />
                <Skeleton className="h-4 w-28" staggerIndex={30} />
              </div>
            </div>
          </div>
        </motion.section>
      </motion.div>
    </div>
  );
}
